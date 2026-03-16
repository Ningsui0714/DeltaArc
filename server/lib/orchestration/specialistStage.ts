import type { ExecutionPlan } from './executionPlan';
import { filterVisibleAnalysisWarnings } from '../../../shared/analysisWarnings';
import { normalizeSpecialistOutput } from './normalize';
import {
  emitProgress,
  formatDuration,
  logStageResult,
  mapSettledWithConcurrency,
  unwrapTimedStageError,
  type ProgressUpdate,
  type TimedStageError,
} from './orchestrationCore';
import type { SpecialistCheckpoint } from './checkpoints';
import { buildSpecialistMessages } from './prompts';
import { createSpecialistPreview } from './progressPreview';
import { runJsonStage } from './runStage';
import type { Dossier, SpecialistOutput } from './types';
import { dedupeBy } from './utils';
import type {
  SandboxAnalysisRequest,
  SandboxPerspectiveKey,
} from '../../../shared/sandbox';

const specialistMaxTokens = 4500;

type SpecialistStageResult = {
  specialistOutputs: SpecialistOutput[];
  pipelineEntries: string[];
  warnings: string[];
  degradedStageKeys: Set<string>;
  checkpoints: SpecialistCheckpoint[];
  failedStage?:
    | {
        key: SandboxPerspectiveKey;
        label: string;
        message: string;
      }
    | undefined;
};

export async function runSpecialistStages(
  request: SandboxAnalysisRequest,
  executionPlan: ExecutionPlan,
  dossier: Dossier,
  onProgress: ((update: ProgressUpdate) => void) | undefined,
): Promise<SpecialistStageResult> {
  const specialistOutputs: SpecialistOutput[] = [];
  const pipelineEntries: string[] = [];
  const stageWarnings: string[] = [];
  const degradedStageKeys = new Set<string>();
  const specialistCheckpoints: SpecialistCheckpoint[] = [];
  const failedStages: Array<{
    key: SandboxPerspectiveKey;
    label: string;
    message: string;
  }> = [];

  const specialistSettled = await mapSettledWithConcurrency(
    executionPlan.specialists,
    executionPlan.specialistConcurrency,
    async (blueprint) => {
      emitProgress(onProgress, {
        key: blueprint.key,
        label: blueprint.label,
        detail: `Running the ${blueprint.label} perspective.`,
        status: 'running',
      });

      const startedAt = Date.now();

      try {
        const stage = await runJsonStage(
          request,
          blueprint.key,
          executionPlan.specialistReasoningKeys.has(blueprint.key) ? 'reasoning' : 'balanced',
          blueprint.key === 'market' ? 0.45 : 0.35,
          buildSpecialistMessages(blueprint, request, dossier),
          executionPlan.specialistTimeoutMs,
          specialistMaxTokens,
        );

        const output = normalizeSpecialistOutput(blueprint, stage.data, dossier);
        logStageResult(blueprint.key, stage.model, stage.durationMs, stage.warnings);
        emitProgress(onProgress, {
          key: blueprint.key,
          label: blueprint.label,
          detail: `${blueprint.label} perspective finished.`,
          status: 'completed',
          preview: createSpecialistPreview(output),
          model: stage.model,
          durationMs: stage.durationMs,
        });

        return {
          blueprint,
          output,
          model: stage.model,
          durationMs: stage.durationMs,
          warnings: stage.warnings,
          degraded: stage.degraded,
        };
      } catch (error) {
        throw {
          error,
          durationMs: Date.now() - startedAt,
        } satisfies TimedStageError;
      }
    },
  );

  specialistSettled.forEach((result, index) => {
    const blueprint = executionPlan.specialists[index];

    if (result.status === 'fulfilled') {
      if (result.value.degraded) {
        degradedStageKeys.add(blueprint.key);
      }
      const visibleWarnings = filterVisibleAnalysisWarnings([
        ...result.value.warnings,
        ...result.value.output.warnings,
      ]);
      pipelineEntries.push(`${result.value.blueprint.key}@${result.value.model}`);
      stageWarnings.push(...visibleWarnings);
      specialistOutputs.push(result.value.output);
      specialistCheckpoints.push({
        key: blueprint.key,
        output: result.value.output,
        pipelineEntry: `${result.value.blueprint.key}@${result.value.model}`,
        warnings: dedupeBy(visibleWarnings, (item) => item, 8),
        degraded: result.value.degraded,
      });
      return;
    }

    const failure = unwrapTimedStageError(result.reason);
    const message =
      failure.error instanceof Error ? failure.error.message : `${blueprint.label} failed.`;

    console.warn(
      `[orchestration] ${blueprint.key} failed${
        typeof failure.durationMs === 'number' ? ` ${formatDuration(failure.durationMs)}` : ''
      } because ${message}; preserving completed specialists for retry`,
    );

    failedStages.push({
      key: blueprint.key,
      label: blueprint.label,
      message,
    });
    emitProgress(onProgress, {
      key: blueprint.key,
      label: blueprint.label,
      detail: `${blueprint.label} remote stage failed; completed perspectives were cached for retry.`,
      status: 'error',
      durationMs: failure.durationMs,
    });
  });

  const primaryFailure = failedStages[0];
  const failedStage =
    primaryFailure
      ? {
          ...primaryFailure,
          message:
            failedStages.length > 1
              ? `${primaryFailure.message}. Additional failed perspectives: ${failedStages
                  .slice(1)
                  .map((stage) => stage.label)
                  .join(', ')}.`
              : `${primaryFailure.message}.`,
        }
      : undefined;

  return {
    specialistOutputs,
    pipelineEntries,
    warnings: stageWarnings,
    degradedStageKeys,
    checkpoints: specialistCheckpoints,
    failedStage,
  };
}
