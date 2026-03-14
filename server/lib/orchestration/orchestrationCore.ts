import type {
  SandboxAnalysisRequest,
  SandboxAnalysisResult,
  SandboxAnalysisResumeStageKey,
  SandboxAnalysisStageKey,
} from '../../../shared/sandbox';
import {
  createAnalysisMeta,
  createFallbackAnalysis,
} from '../normalizeSandboxResult';
import type { AnalysisCheckpointState } from './checkpoints';
import type { MemoryStore } from './memoryStore';

export type ProgressUpdate = {
  key: SandboxAnalysisStageKey;
  label: string;
  detail: string;
  status: 'running' | 'completed' | 'error';
  preview?: {
    headline: string;
    summary: string;
    bullets: string[];
  };
  model?: string;
  durationMs?: number;
};

export type OrchestrationDependencies = {
  memoryStore?: MemoryStore;
  onProgress?: (update: ProgressUpdate) => void;
  resume?: {
    startStageKey: SandboxAnalysisResumeStageKey;
    checkpoints: AnalysisCheckpointState;
  };
};

export type TimedStageError = {
  durationMs: number;
  error: unknown;
};

export class OrchestrationStageError extends Error {
  stageKey: SandboxAnalysisResumeStageKey;
  stageLabel: string;

  constructor(stageKey: SandboxAnalysisResumeStageKey, stageLabel: string, message: string) {
    super(message);
    this.name = 'OrchestrationStageError';
    this.stageKey = stageKey;
    this.stageLabel = stageLabel;
  }
}

export class OrchestrationRetryableError extends Error {
  stageKey: SandboxAnalysisResumeStageKey;
  stageLabel: string;
  checkpoints: AnalysisCheckpointState;
  partialResult: SandboxAnalysisResult | null;

  constructor(
    stageKey: SandboxAnalysisResumeStageKey,
    stageLabel: string,
    message: string,
    checkpoints: AnalysisCheckpointState,
    partialResult: SandboxAnalysisResult | null,
  ) {
    super(message);
    this.name = 'OrchestrationRetryableError';
    this.stageKey = stageKey;
    this.stageLabel = stageLabel;
    this.checkpoints = checkpoints;
    this.partialResult = partialResult;
  }
}

export function isOrchestrationStageError(error: unknown): error is OrchestrationStageError {
  return error instanceof OrchestrationStageError;
}

export function isOrchestrationRetryableError(error: unknown): error is OrchestrationRetryableError {
  return error instanceof OrchestrationRetryableError;
}

export function formatDuration(durationMs: number) {
  return `${(durationMs / 1000).toFixed(durationMs >= 10000 ? 0 : 1)}s`;
}

export function logStageResult(label: string, model: string, durationMs: number, warnings: string[]) {
  const warningSuffix = warnings.length > 0 ? ` warnings=${warnings.length}` : '';
  console.info(`[orchestration] ${label} ${model} ${formatDuration(durationMs)}${warningSuffix}`);
}

export function buildModelSummary(pipeline: string[]) {
  const models = pipeline.flatMap((item) => {
    const encodedModels = item.split('@')[1] ?? '';
    return encodedModels
      .split('+')
      .map((model) => model.trim())
      .filter(Boolean);
  });

  return `multi-stage: ${Array.from(new Set(models)).join(' + ')}`;
}

export function createNormalizationFallback(
  request: SandboxAnalysisRequest,
  pipeline: string[],
  modelSummary: string,
): SandboxAnalysisResult {
  return createFallbackAnalysis(
    request.mode,
    modelSummary || 'multi-stage: pending',
    pipeline,
    createAnalysisMeta('remote', 'fresh'),
  );
}

export function emitProgress(
  onProgress: OrchestrationDependencies['onProgress'],
  update: ProgressUpdate,
) {
  onProgress?.(update);
}

export function unwrapTimedStageError(reason: unknown) {
  if (
    typeof reason === 'object' &&
    reason !== null &&
    'error' in reason &&
    'durationMs' in reason &&
    typeof reason.durationMs === 'number'
  ) {
    return reason as TimedStageError;
  }

  return {
    error: reason,
    durationMs: undefined,
  };
}

export async function mapSettledWithConcurrency<TItem, TResult>(
  items: TItem[],
  concurrency: number,
  worker: (item: TItem, index: number) => Promise<TResult>,
) {
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results: PromiseSettledResult<TResult>[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      try {
        const value = await worker(items[currentIndex], currentIndex);
        results[currentIndex] = {
          status: 'fulfilled',
          value,
        };
      } catch (error) {
        results[currentIndex] = {
          status: 'rejected',
          reason: error,
        };
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, () => runWorker()));
  return results;
}
