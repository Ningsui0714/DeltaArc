import type { SandboxAnalysisRequest, SandboxAnalysisResult } from '../../../shared/sandbox';
import { createAnalysisMeta, createAnalysisRequestId } from '../normalizeSandboxResult';
import { jsonMemoryStore } from '../sandboxMemoryStore';
import { createExecutionPlan } from './executionPlan';
import { runDossierStage } from './dossierStage';
import { summarizeMemories } from './memory';
import type { MemoryStore } from './memoryStore';
import {
  buildModelSummary,
  createNormalizationFallback,
  type OrchestrationDependencies,
} from './orchestrationCore';
import { runRefineStage, runSynthesisStage } from './postStages';
import { runSpecialistStages } from './specialistStage';
import { dedupeBy } from './utils';

export async function orchestrateSandboxAnalysis(
  request: SandboxAnalysisRequest,
  dependencies: OrchestrationDependencies = {},
) {
  const memoryStore = dependencies.memoryStore ?? jsonMemoryStore;
  const requestId = createAnalysisRequestId('analysis');
  const executionPlan = createExecutionPlan(request.mode);
  const recalledMemories = await memoryStore.loadRelevant(request.project);
  const memorySummary = summarizeMemories(recalledMemories);
  const stageWarnings: string[] = [];
  const pipeline: string[] = [];

  const dossierStage = await runDossierStage(
    request,
    executionPlan,
    memorySummary.memoryContext,
    memorySummary.memorySignals,
    dependencies.onProgress,
  );
  pipeline.push(dossierStage.pipelineEntry);
  stageWarnings.push(...dossierStage.warnings);

  const specialistStage = await runSpecialistStages(
    request,
    executionPlan,
    dossierStage.dossier,
    dependencies.onProgress,
  );
  pipeline.push(...specialistStage.pipelineEntries);
  stageWarnings.push(...specialistStage.warnings);

  const degradedStageKeys = new Set<string>(specialistStage.degradedStageKeys);
  const modelSummary = buildModelSummary(pipeline);
  let provisional = createNormalizationFallback(request, pipeline, modelSummary);

  const synthesisStage = await runSynthesisStage(
    request,
    executionPlan,
    dossierStage.dossier,
    specialistStage.specialistOutputs,
    pipeline,
    provisional,
    dependencies.onProgress,
  );
  if (synthesisStage.pipelineEntry) {
    pipeline.push(synthesisStage.pipelineEntry);
  }
  provisional = synthesisStage.provisional;

  const refineStage = await runRefineStage(
    request,
    executionPlan,
    provisional,
    pipeline,
    modelSummary,
    synthesisStage.warnings,
    dependencies.onProgress,
  );
  if (refineStage.pipelineEntry) {
    pipeline.push(refineStage.pipelineEntry);
  }

  const finalResult = refineStage.finalResult;
  const finalModelSummary = buildModelSummary(pipeline);
  const hydratedResult = {
    ...finalResult,
    generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    mode: request.mode,
    model: finalModelSummary,
    pipeline,
    meta: createAnalysisMeta('remote', degradedStageKeys.size > 0 ? 'degraded' : 'fresh', requestId),
    warnings: dedupeBy(
      [...stageWarnings, ...finalResult.warnings, ...synthesisStage.warnings, ...refineStage.warnings],
      (item) => item,
      12,
    ),
  };

  if (hydratedResult.meta.status === 'fresh') {
    await persistFreshAnalysisMemory(memoryStore, request, hydratedResult);
  }

  return hydratedResult;
}

async function persistFreshAnalysisMemory(
  memoryStore: MemoryStore,
  request: SandboxAnalysisRequest,
  hydratedResult: SandboxAnalysisResult,
) {
  try {
    await memoryStore.persist(request.project, hydratedResult);
  } catch (error) {
    const message =
      error instanceof Error
        ? `Analysis memory persistence failed: ${error.message}`
        : 'Analysis memory persistence failed after a successful run.';
    hydratedResult.warnings = dedupeBy([...hydratedResult.warnings, message], (item) => item, 12);
    console.warn(`[memory] ${message}`);
  }
}
