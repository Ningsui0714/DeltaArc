import { getSandboxAnalysisJob } from '../api/sandbox';
import type {
  SandboxAnalysisJob,
  SandboxAnalysisMode,
  SandboxAnalysisResult,
} from '../../shared/sandbox';

type SandboxAnalysisStatus = 'idle' | 'loading' | 'error';

type SandboxAnalysisPollerDependencies = {
  fetchJob?: typeof getSandboxAnalysisJob;
  getActiveJobId: () => string | null;
  setActiveJobId: (jobId: string | null) => void;
  getActiveJobInputSignature: () => string | null;
  setActiveJobInputSignature: (inputSignature: string | null) => void;
  getCurrentInputSignature: () => string;
  clearPolling: () => void;
  schedulePoll: (callback: () => void) => void;
  cacheRemoteAnalysis: (result: SandboxAnalysisResult, inputSignature: string) => void;
  cacheRetryableJob: (job: SandboxAnalysisJob, inputSignature: string) => void;
  clearRetryableJob: () => void;
  setProgress: (job: SandboxAnalysisJob | null) => void;
  setAnalysis: (analysis: SandboxAnalysisResult) => void;
  setStatus: (status: SandboxAnalysisStatus) => void;
  setError: (error: string | null) => void;
  resolveVisibleAnalysis: (mode: SandboxAnalysisMode) => SandboxAnalysisResult;
  resolveFallbackAnalysis: (
    mode: SandboxAnalysisMode,
    partialResult?: SandboxAnalysisResult,
  ) => SandboxAnalysisResult;
};

export function createSandboxAnalysisPoller(
  dependencies: SandboxAnalysisPollerDependencies,
) {
  const fetchJob = dependencies.fetchJob ?? getSandboxAnalysisJob;

  return async function pollJob(jobId: string, mode: SandboxAnalysisMode) {
    try {
      const job = await fetchJob(jobId);

      if (dependencies.getActiveJobId() !== jobId) {
        return null;
      }

      dependencies.setProgress(job);

      if (job.status === 'completed' && job.result) {
        dependencies.setActiveJobId(null);
        dependencies.clearPolling();
        dependencies.clearRetryableJob();
        dependencies.cacheRemoteAnalysis(
          job.result,
          dependencies.getActiveJobInputSignature() ?? dependencies.getCurrentInputSignature(),
        );
        dependencies.setActiveJobInputSignature(null);
        dependencies.setAnalysis(dependencies.resolveVisibleAnalysis(mode));
        dependencies.setProgress(null);
        dependencies.setStatus('idle');
        return job.result;
      }

      if (job.status === 'error') {
        dependencies.setActiveJobId(null);
        dependencies.clearPolling();
        const failedInputSignature =
          dependencies.getActiveJobInputSignature() ?? dependencies.getCurrentInputSignature();

        dependencies.cacheRetryableJob(job, failedInputSignature);

        if (job.result && job.result.meta.source === 'remote') {
          dependencies.cacheRemoteAnalysis(job.result, failedInputSignature);
        }

        dependencies.setAnalysis(
          dependencies.resolveFallbackAnalysis(mode, job.result),
        );
        dependencies.setStatus('error');
        dependencies.setError(job.error ?? job.message);
        return job.result ?? null;
      }

      dependencies.schedulePoll(() => {
        void pollJob(jobId, mode);
      });

      return null;
    } catch (caughtError) {
      if (dependencies.getActiveJobId() !== jobId) {
        return null;
      }

      dependencies.setActiveJobId(null);
      dependencies.setActiveJobInputSignature(null);
      dependencies.clearPolling();
      dependencies.clearRetryableJob();
      dependencies.setProgress(null);
      dependencies.setAnalysis(dependencies.resolveFallbackAnalysis(mode));
      dependencies.setStatus('error');
      dependencies.setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Polling the sandbox analysis failed.',
      );
      return null;
    }
  };
}
