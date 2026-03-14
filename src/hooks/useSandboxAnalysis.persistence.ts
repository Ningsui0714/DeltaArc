import type {
  LatestActiveSandboxAnalysisJob,
  LatestRetryableSandboxAnalysisJob,
  SandboxAnalysisResult,
} from '../../shared/sandbox';
import type { PersistedLatestAnalysis } from '../../shared/variableSandbox';
import {
  getLatestActiveSandboxAnalysisJob,
  getLatestPersistedSandboxAnalysis,
  getLatestRetryableSandboxAnalysisJob,
} from '../api/sandbox';

type PersistedLoadError = {
  label: string;
  reason: unknown;
};

export type RestoredRemoteAnalysis = {
  analysis: SandboxAnalysisResult;
  inputSignature: string;
};

export async function loadPersistedSandboxWorkspaceState(workspaceId: string) {
  const [latestAnalysisResult, latestActiveJobResult, latestRetryableJobResult] =
    await Promise.allSettled([
      getLatestPersistedSandboxAnalysis(workspaceId),
      getLatestActiveSandboxAnalysisJob(workspaceId),
      getLatestRetryableSandboxAnalysisJob(workspaceId),
    ]);

  const errors: PersistedLoadError[] = [];

  if (latestAnalysisResult.status === 'rejected') {
    errors.push({
      label: 'latest persisted analysis',
      reason: latestAnalysisResult.reason,
    });
  }

  if (latestActiveJobResult.status === 'rejected') {
    errors.push({
      label: 'latest active analysis job',
      reason: latestActiveJobResult.reason,
    });
  }

  if (latestRetryableJobResult.status === 'rejected') {
    errors.push({
      label: 'latest retryable analysis job',
      reason: latestRetryableJobResult.reason,
    });
  }

  return {
    latestAnalysis:
      latestAnalysisResult.status === 'fulfilled' ? latestAnalysisResult.value : null,
    latestActiveJob:
      latestActiveJobResult.status === 'fulfilled' ? latestActiveJobResult.value : null,
    latestRetryableJob:
      latestRetryableJobResult.status === 'fulfilled'
        ? latestRetryableJobResult.value
        : null,
    errors,
  };
}

export function logPersistedSandboxWorkspaceErrors(errors: PersistedLoadError[]) {
  errors.forEach((error) => {
    console.warn(
      `[sandbox] ${error.label} load failed`,
      error.reason instanceof Error ? error.reason.message : error.reason,
    );
  });
}

export function resolveRestoredSandboxWorkspaceState(params: {
  currentInputSignature: string;
  latestAnalysis: PersistedLatestAnalysis | null;
  latestActiveJob: LatestActiveSandboxAnalysisJob | null;
  latestRetryableJob: LatestRetryableSandboxAnalysisJob | null;
}) {
  const restoredActiveJob =
    params.latestActiveJob &&
    params.latestActiveJob.inputSignature === params.currentInputSignature
      ? params.latestActiveJob
      : null;

  const restoredRetryableJob =
    !restoredActiveJob &&
    params.latestRetryableJob &&
    params.latestRetryableJob.inputSignature === params.currentInputSignature
      ? params.latestRetryableJob
      : null;

  const restoredRemoteAnalysis =
    restoredActiveJob?.job.result?.meta.source === 'remote'
      ? {
          analysis: restoredActiveJob.job.result,
          inputSignature: restoredActiveJob.inputSignature,
        }
      : restoredRetryableJob?.job.result?.meta.source === 'remote'
        ? {
            analysis: restoredRetryableJob.job.result,
            inputSignature: restoredRetryableJob.inputSignature,
          }
        : params.latestAnalysis
          ? {
              analysis: params.latestAnalysis.analysis,
              inputSignature: params.latestAnalysis.inputSignature,
            }
          : null;

  return {
    restoredActiveJob,
    restoredRetryableJob,
    restoredRemoteAnalysis,
    retryableJobToCache: !restoredActiveJob ? params.latestRetryableJob : null,
  };
}
