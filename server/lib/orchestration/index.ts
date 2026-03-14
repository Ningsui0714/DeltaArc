import type { SandboxAnalysisRequest, SandboxAnalysisResult } from '../../../shared/sandbox';
import { createAnalysisMeta, createAnalysisRequestId } from '../normalizeSandboxResult';
import { jsonMemoryStore } from '../sandboxMemoryStore';
import {
  cloneCheckpointState,
  createEmptyCheckpointState,
  getOrderedSpecialistCheckpoints,
  orderSpecialistCheckpoints,
  getSpecialistResumeState,
} from './checkpoints';
import { createExecutionPlan } from './executionPlan';
import { runDossierStage } from './dossierStage';
import { buildProvisionalFallback } from './fallback';
import { summarizeMemories } from './memory';
import type { MemoryStore } from './memoryStore';
import {
  buildModelSummary,
  isOrchestrationStageError,
  OrchestrationRetryableError,
  OrchestrationStageError,
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
  const checkpoints = cloneCheckpointState(
    dependencies.resume?.checkpoints ?? createEmptyCheckpointState(),
  );
  const recalledMemories = await memoryStore.loadRelevant(request.project);
  const memorySummary = summarizeMemories(recalledMemories);
  const stageWarnings: string[] = [];
  const pipeline: string[] = [];
  const resumeStageKey = dependencies.resume?.startStageKey ?? 'dossier';

  try {
    const orderedSpecialistCheckpoints = getOrderedSpecialistCheckpoints(
      executionPlan,
      checkpoints,
    );
    const canResumeFromSynthesis =
      resumeStageKey === 'synthesis' &&
      Boolean(checkpoints.dossier) &&
      Boolean(orderedSpecialistCheckpoints);
    const canResumeFromRefine =
      resumeStageKey === 'refine' &&
      Boolean(checkpoints.dossier) &&
      Boolean(orderedSpecialistCheckpoints) &&
      Boolean(checkpoints.synthesis?.provisional);
    const specialistResumeState =
      canResumeFromSynthesis || canResumeFromRefine
        ? null
        : getSpecialistResumeState(executionPlan, checkpoints, resumeStageKey);

    const dossierStage =
      resumeStageKey !== 'dossier' && checkpoints.dossier
        ? {
            dossier: checkpoints.dossier.dossier,
            pipelineEntry: checkpoints.dossier.pipelineEntry,
            warnings: [...checkpoints.dossier.warnings],
            degraded: checkpoints.dossier.degraded,
            selectionSummary: checkpoints.dossier.selectionSummary,
          }
        : await runDossierStage(
            request,
            executionPlan,
            memorySummary.memoryContext,
            memorySummary.memorySignals,
            dependencies.onProgress,
          );

    if (resumeStageKey === 'dossier' || !checkpoints.dossier) {
      checkpoints.dossier = {
        dossier: dossierStage.dossier,
        pipelineEntry: dossierStage.pipelineEntry,
        warnings: [...dossierStage.warnings],
        degraded: dossierStage.degraded,
        selectionSummary: dossierStage.selectionSummary,
      };
    }

    pipeline.push(dossierStage.pipelineEntry);
    stageWarnings.push(...dossierStage.warnings);

    const specialistStage = canResumeFromSynthesis || canResumeFromRefine
      ? {
          specialistOutputs: orderedSpecialistCheckpoints!.map((checkpoint) => checkpoint.output),
          pipelineEntries: orderedSpecialistCheckpoints!.map((checkpoint) => checkpoint.pipelineEntry),
          warnings: orderedSpecialistCheckpoints!.flatMap((checkpoint) => checkpoint.warnings),
          degradedStageKeys: new Set(
            orderedSpecialistCheckpoints!
              .filter((checkpoint) => checkpoint.degraded)
              .map((checkpoint) => checkpoint.key),
          ),
          checkpoints: orderedSpecialistCheckpoints!,
        }
      : await (async () => {
          const reusedCheckpoints = specialistResumeState?.reusedCheckpoints ?? [];
          const specialistExecutionPlan = specialistResumeState
            ? {
                ...executionPlan,
                specialists: specialistResumeState.remainingSpecialists,
              }
            : executionPlan;

          const rerunSpecialistStage = await runSpecialistStages(
            request,
            specialistExecutionPlan,
            dossierStage.dossier,
            dependencies.onProgress,
          );
          const mergedCheckpoints = orderSpecialistCheckpoints(executionPlan, {
            specialists: [...reusedCheckpoints, ...rerunSpecialistStage.checkpoints],
          });
          const mergedWarnings = mergedCheckpoints.flatMap((checkpoint) => checkpoint.warnings);
          const mergedDegradedStageKeys = new Set(
            mergedCheckpoints
              .filter((checkpoint) => checkpoint.degraded)
              .map((checkpoint) => checkpoint.key),
          );

          return {
            specialistOutputs: mergedCheckpoints.map((checkpoint) => checkpoint.output),
            pipelineEntries: mergedCheckpoints.map((checkpoint) => checkpoint.pipelineEntry),
            warnings: mergedWarnings,
            degradedStageKeys: mergedDegradedStageKeys,
            checkpoints: mergedCheckpoints,
            failedStage: rerunSpecialistStage.failedStage,
          };
        })();

    if (!canResumeFromSynthesis && !canResumeFromRefine) {
      checkpoints.specialists = specialistStage.checkpoints;
    }

    if ('failedStage' in specialistStage && specialistStage.failedStage) {
      throw new OrchestrationStageError(
        specialistStage.failedStage.key,
        specialistStage.failedStage.label,
        `${specialistStage.failedStage.label} failed: ${specialistStage.failedStage.message} Cached specialist checkpoints were preserved for retry.`,
      );
    }

    pipeline.push(...specialistStage.pipelineEntries);
    stageWarnings.push(...specialistStage.warnings);

    const degradedStageKeys = new Set<string>(specialistStage.degradedStageKeys);
    if (dossierStage.degraded) {
      degradedStageKeys.add('dossier');
    }
    const modelSummary = buildModelSummary(pipeline);
    let provisional = buildProvisionalFallback(
      request,
      dossierStage.dossier,
      specialistStage.specialistOutputs,
      pipeline,
      modelSummary,
      dedupeBy([...stageWarnings], (item) => item, 12),
    );
    if (dossierStage.selectionSummary) {
      provisional = {
        ...provisional,
        meta: {
          ...provisional.meta,
          dossierSelection: dossierStage.selectionSummary,
        },
      };
    }

    const synthesisStage = canResumeFromRefine
        ? {
            provisional: checkpoints.synthesis!.provisional,
            pipelineEntry: checkpoints.synthesis!.pipelineEntry,
            warnings: [...checkpoints.synthesis!.warnings],
            degraded: checkpoints.synthesis!.degraded,
          }
      : await runSynthesisStage(
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
    if (synthesisStage.degraded) {
      degradedStageKeys.add('synthesis');
    }
    if (!canResumeFromRefine) {
      checkpoints.synthesis = {
        provisional,
        pipelineEntry: synthesisStage.pipelineEntry,
        warnings: [...synthesisStage.warnings],
        degraded: synthesisStage.degraded,
      };
    }

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
    if (refineStage.degraded) {
      degradedStageKeys.add('refine');
    }

    const finalResult = refineStage.finalResult;
    const finalModelSummary = buildModelSummary(pipeline);
    if (degradedStageKeys.size > 0) {
      stageWarnings.push(
        `Reliability degraded: ${Array.from(degradedStageKeys).join(', ')} stage(s) needed JSON repair or fallback handling.`,
      );
    }
    const hydratedResult = {
      ...finalResult,
      generatedAt: new Date().toISOString(),
      mode: request.mode,
      model: finalModelSummary,
      pipeline,
      meta: {
        ...finalResult.meta,
        ...createAnalysisMeta('remote', degradedStageKeys.size > 0 ? 'degraded' : 'fresh', requestId),
      },
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
  } catch (error) {
    if (isOrchestrationStageError(error)) {
      throw new OrchestrationRetryableError(
        error.stageKey,
        error.stageLabel,
        error.message,
        checkpoints,
        null,
      );
    }

    throw error;
  }
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
