import type { SandboxAnalysisRequest, SandboxAnalysisStageKey } from '../../../shared/sandbox';
import {
  createAnalysisMeta,
  createAnalysisRequestId,
  normalizeFinalAnalysis,
} from '../normalizeSandboxResult';
import { jsonMemoryStore } from '../sandboxMemoryStore';
import {
  buildProvisionalFallback,
  createDossierFallback,
  createQuickScanSpecialistOutput,
  createSpecialistFallback,
} from './fallback';
import { createExecutionPlan } from './executionPlan';
import { summarizeMemories } from './memory';
import type { MemoryStore } from './memoryStore';
import { normalizeDossier, normalizeSpecialistOutput } from './normalize';
import {
  buildDossierMessages,
  buildRefinementMessages,
  buildSpecialistMessages,
  buildSynthesisMessages,
} from './prompts';
import { runJsonStage } from './runStage';
import type { Dossier, SpecialistOutput } from './types';
import { dedupeBy } from './utils';

type ProgressUpdate = {
  key: SandboxAnalysisStageKey;
  label: string;
  detail: string;
  status: 'running' | 'completed' | 'error';
  model?: string;
  durationMs?: number;
};

type OrchestrationDependencies = {
  memoryStore?: MemoryStore;
  onProgress?: (update: ProgressUpdate) => void;
};

function formatDuration(durationMs: number) {
  return `${(durationMs / 1000).toFixed(durationMs >= 10000 ? 0 : 1)}s`;
}

function logStageResult(label: string, model: string, durationMs: number, warnings: string[]) {
  const warningSuffix = warnings.length > 0 ? ` warnings=${warnings.length}` : '';
  console.info(`[orchestration] ${label} ${model} ${formatDuration(durationMs)}${warningSuffix}`);
}

function buildModelSummary(pipeline: string[]) {
  return `multi-stage: ${Array.from(new Set(pipeline.map((item) => item.split('@')[1]))).join(' + ')}`;
}

function emitProgress(
  onProgress: OrchestrationDependencies['onProgress'],
  update: ProgressUpdate,
) {
  onProgress?.(update);
}

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

  emitProgress(dependencies.onProgress, {
    key: 'dossier',
    label: 'Dossier',
    detail: 'Extracting a shared dossier from the current project and evidence.',
    status: 'running',
  });
  const dossierStartedAt = Date.now();
  let dossier: Dossier;

  try {
    const dossierStage = await runJsonStage(
      request,
      'dossier',
      executionPlan.dossierPreference,
      request.mode === 'reasoning' ? 0.22 : 0.3,
      buildDossierMessages(request, memorySummary.memoryContext),
      executionPlan.dossierTimeoutMs,
    );

    logStageResult('dossier', dossierStage.model, dossierStage.durationMs, dossierStage.warnings);
    emitProgress(dependencies.onProgress, {
      key: 'dossier',
      label: 'Dossier',
      detail: 'Shared dossier ready for the downstream perspectives.',
      status: 'completed',
      model: dossierStage.model,
      durationMs: dossierStage.durationMs,
    });

    dossier = normalizeDossier(dossierStage.data, memorySummary.memorySignals);
    stageWarnings.push(...dossierStage.warnings, ...dossier.warnings);
    pipeline.push(`dossier@${dossierStage.model}`);
  } catch (error) {
    const durationMs = Date.now() - dossierStartedAt;
    const message = error instanceof Error ? error.message : 'Dossier stage failed.';

    dossier = createDossierFallback(request, memorySummary.memorySignals, message);
    stageWarnings.push(...dossier.warnings);
    pipeline.push('dossier@local-fallback');
    console.warn(`[orchestration] dossier local-fallback ${formatDuration(durationMs)} because ${message}`);
    emitProgress(dependencies.onProgress, {
      key: 'dossier',
      label: 'Dossier',
      detail: 'Remote dossier failed. Continuing with a local project summary.',
      status: 'completed',
      model: 'local-fallback',
      durationMs,
    });
  }

  const specialistOutputs: SpecialistOutput[] = [];

  if (executionPlan.specialistStrategy === 'local') {
    stageWarnings.push('Quick scan used local perspective synthesis to stay responsive.');

    executionPlan.specialists.forEach((blueprint) => {
      emitProgress(dependencies.onProgress, {
        key: blueprint.key,
        label: blueprint.label,
        detail: `Distilling the ${blueprint.label} perspective from the shared dossier.`,
        status: 'running',
      });

      const output = createQuickScanSpecialistOutput(blueprint, dossier);
      specialistOutputs.push(output);
      pipeline.push(`${blueprint.key}@local-fallback`);
      emitProgress(dependencies.onProgress, {
        key: blueprint.key,
        label: blueprint.label,
        detail: `${blueprint.label} perspective synthesized locally for the quick scan.`,
        status: 'completed',
        model: 'local-fallback',
        durationMs: 0,
      });
    });
  } else {
    const specialistSettled = await Promise.allSettled(
      executionPlan.specialists.map(async (blueprint) => {
        emitProgress(dependencies.onProgress, {
          key: blueprint.key,
          label: blueprint.label,
          detail: `Running the ${blueprint.label} perspective.`,
          status: 'running',
        });

        const stage = await runJsonStage(
          request,
          blueprint.key,
          executionPlan.specialistReasoningKeys.has(blueprint.key) ? 'reasoning' : 'balanced',
          blueprint.key === 'market' ? 0.45 : 0.35,
          buildSpecialistMessages(blueprint, request, dossier),
          executionPlan.specialistTimeoutMs,
        );

        logStageResult(blueprint.key, stage.model, stage.durationMs, stage.warnings);
        emitProgress(dependencies.onProgress, {
          key: blueprint.key,
          label: blueprint.label,
          detail: `${blueprint.label} perspective finished.`,
          status: 'completed',
          model: stage.model,
          durationMs: stage.durationMs,
        });

        return {
          blueprint,
          output: normalizeSpecialistOutput(blueprint, stage.data, dossier),
          model: stage.model,
          durationMs: stage.durationMs,
          warnings: stage.warnings,
        };
      }),
    );

    specialistSettled.forEach((result, index) => {
      const blueprint = executionPlan.specialists[index];

      if (result.status === 'fulfilled') {
        pipeline.push(`${result.value.blueprint.key}@${result.value.model}`);
        stageWarnings.push(...result.value.warnings, ...result.value.output.warnings);
        specialistOutputs.push(result.value.output);
        return;
      }

      const fallback = createSpecialistFallback(blueprint, dossier);
      specialistOutputs.push(fallback);
      pipeline.push(`${blueprint.key}@local-fallback`);
      stageWarnings.push(...fallback.warnings, result.reason instanceof Error ? result.reason.message : `${blueprint.label} failed.`);
      emitProgress(dependencies.onProgress, {
        key: blueprint.key,
        label: blueprint.label,
        detail: `${blueprint.label} switched to a local heuristic result after the remote stage failed.`,
        status: 'completed',
        model: 'local-fallback',
      });
    });
  }

  let modelSummary = buildModelSummary(pipeline);
  const provisionalFallback = buildProvisionalFallback(
    request,
    dossier,
    specialistOutputs,
    pipeline,
    modelSummary,
    dedupeBy(stageWarnings, (item) => item, 10),
  );

  let provisional = provisionalFallback;
  let synthesisWarnings: string[] = [];
  let refinementWarnings: string[] = [];

  if (executionPlan.shouldRunSynthesis) {
    emitProgress(dependencies.onProgress, {
      key: 'synthesis',
      label: 'Synthesis',
      detail: 'Merging perspective outputs into a single recommendation.',
      status: 'running',
    });

    try {
      const synthesisStage = await runJsonStage(
        request,
        'synthesis',
        executionPlan.synthesisPreference,
        request.mode === 'reasoning' ? 0.18 : 0.25,
        buildSynthesisMessages(request, dossier, specialistOutputs, pipeline),
        executionPlan.synthesisTimeoutMs,
      );

      logStageResult('synthesis', synthesisStage.model, synthesisStage.durationMs, synthesisStage.warnings);
      pipeline.push(`synthesis@${synthesisStage.model}`);
      synthesisWarnings = synthesisStage.warnings;
      provisional = normalizeFinalAnalysis(synthesisStage.data, {
        ...provisionalFallback,
        warnings: dedupeBy([...provisionalFallback.warnings, ...synthesisStage.warnings], (item) => item, 10),
      });
      emitProgress(dependencies.onProgress, {
        key: 'synthesis',
        label: 'Synthesis',
        detail: 'Cross-perspective synthesis finished.',
        status: 'completed',
        model: synthesisStage.model,
        durationMs: synthesisStage.durationMs,
      });
    } catch (error) {
      pipeline.push('synthesis@local-fallback');
      synthesisWarnings = [
        error instanceof Error ? error.message : 'Synthesis failed and fell back to the provisional result.',
      ];
      emitProgress(dependencies.onProgress, {
        key: 'synthesis',
        label: 'Synthesis',
        detail: 'Synthesis failed and fell back to the provisional result.',
        status: 'completed',
        model: 'local-fallback',
      });
    }
  }

  let finalResult = provisional;

  if (executionPlan.shouldRunRefine) {
    emitProgress(dependencies.onProgress, {
      key: 'refine',
      label: 'Refine',
      detail: 'Tightening the final write-up and removing generic advice.',
      status: 'running',
    });

    try {
      const refinementStage = await runJsonStage(
        request,
        'refine',
        executionPlan.refinePreference,
        0.15,
        buildRefinementMessages(provisional),
        executionPlan.refineTimeoutMs,
      );

      logStageResult('refine', refinementStage.model, refinementStage.durationMs, refinementStage.warnings);
      pipeline.push(`refine@${refinementStage.model}`);
      refinementWarnings = refinementStage.warnings;
      finalResult = normalizeFinalAnalysis(refinementStage.data, {
        ...provisional,
        pipeline,
        model: modelSummary,
        warnings: dedupeBy(
          [...provisional.warnings, ...synthesisWarnings, ...refinementStage.warnings],
          (item) => item,
          12,
        ),
      });
      emitProgress(dependencies.onProgress, {
        key: 'refine',
        label: 'Refine',
        detail: 'Final refinement finished.',
        status: 'completed',
        model: refinementStage.model,
        durationMs: refinementStage.durationMs,
      });
    } catch (error) {
      pipeline.push('refine@local-fallback');
      refinementWarnings = [
        error instanceof Error ? error.message : 'Refine failed and the synthesis result was kept.',
      ];
      emitProgress(dependencies.onProgress, {
        key: 'refine',
        label: 'Refine',
        detail: 'Refine failed and the synthesis result was kept.',
        status: 'completed',
        model: 'local-fallback',
      });
    }
  }

  const hasFallbackStage = pipeline.some((step) => step.includes('@local-fallback'));
  modelSummary = buildModelSummary(pipeline);
  const hydratedResult = {
    ...finalResult,
    generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    mode: request.mode,
    model: modelSummary,
    pipeline,
    meta: createAnalysisMeta('remote', hasFallbackStage ? 'degraded' : 'fresh', requestId),
    warnings: dedupeBy(
      [...stageWarnings, ...finalResult.warnings, ...synthesisWarnings, ...refinementWarnings],
      (item) => item,
      12,
    ),
  };

  if (hydratedResult.meta.status === 'fresh') {
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

  return hydratedResult;
}
