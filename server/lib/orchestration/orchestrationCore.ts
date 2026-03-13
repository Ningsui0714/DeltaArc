import type {
  SandboxAnalysisRequest,
  SandboxAnalysisResult,
  SandboxAnalysisStageKey,
} from '../../../shared/sandbox';
import {
  createAnalysisMeta,
  createFallbackAnalysis,
} from '../normalizeSandboxResult';
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
};

export type TimedStageError = {
  durationMs: number;
  error: unknown;
};

export function formatDuration(durationMs: number) {
  return `${(durationMs / 1000).toFixed(durationMs >= 10000 ? 0 : 1)}s`;
}

export function logStageResult(label: string, model: string, durationMs: number, warnings: string[]) {
  const warningSuffix = warnings.length > 0 ? ` warnings=${warnings.length}` : '';
  console.info(`[orchestration] ${label} ${model} ${formatDuration(durationMs)}${warningSuffix}`);
}

export function buildModelSummary(pipeline: string[]) {
  return `multi-stage: ${Array.from(new Set(pipeline.map((item) => item.split('@')[1]))).join(' + ')}`;
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
