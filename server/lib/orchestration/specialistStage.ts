import { createSpecialistFallback } from './fallback';
import type { ExecutionPlan } from './executionPlan';
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
import { buildSpecialistMessages } from './prompts';
import { createSpecialistPreview } from './progressPreview';
import { runJsonStage } from './runStage';
import type { Dossier, SpecialistOutput } from './types';
import { dedupeBy } from './utils';
import type { SandboxAnalysisRequest } from '../../../shared/sandbox';

const specialistMaxTokens = 4500;

type SpecialistStageResult = {
  specialistOutputs: SpecialistOutput[];
  pipelineEntries: string[];
  warnings: string[];
  degradedStageKeys: Set<string>;
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
      pipelineEntries.push(`${result.value.blueprint.key}@${result.value.model}`);
      stageWarnings.push(...result.value.warnings, ...result.value.output.warnings);
      specialistOutputs.push(result.value.output);
      return;
    }

    const failure = unwrapTimedStageError(result.reason);
    const message =
      failure.error instanceof Error ? failure.error.message : `${blueprint.label} failed.`;
    const fallbackOutput = createSpecialistFallback(blueprint, dossier);
    const fallbackWarnings = dedupeBy(
      [
        ...fallbackOutput.warnings,
        `${blueprint.key} remote stage failed and continued with local fallback.`,
        message,
      ],
      (item) => item,
      6,
    );

    console.warn(
      `[orchestration] ${blueprint.key} failed${
        typeof failure.durationMs === 'number' ? ` ${formatDuration(failure.durationMs)}` : ''
      } because ${message}; continuing with local fallback`,
    );

    degradedStageKeys.add(blueprint.key);
    specialistOutputs.push({
      ...fallbackOutput,
      warnings: fallbackWarnings,
    });
    pipelineEntries.push(`${blueprint.key}@local-fallback`);
    stageWarnings.push(...fallbackWarnings);

    emitProgress(onProgress, {
      key: blueprint.key,
      label: blueprint.label,
      detail: `${blueprint.label} remote stage failed; local fallback filled the lane.`,
      status: 'completed',
      preview: createSpecialistPreview(fallbackOutput),
      model: 'local-fallback',
      durationMs: failure.durationMs,
    });
  });

  return {
    specialistOutputs,
    pipelineEntries,
    warnings: stageWarnings,
    degradedStageKeys,
  };
}
