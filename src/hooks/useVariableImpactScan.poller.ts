import { getVariableImpactScanJob } from '../api/sandbox';
import type {
  VariableImpactScanJob,
  VariableImpactScanResult,
} from '../../shared/variableSandbox';

type VariableImpactScanStatus = 'idle' | 'loading' | 'error';

type VariableImpactScanPollerDependencies = {
  workspaceId: string;
  getActiveJobId: () => string | null;
  setActiveJobId: (jobId: string | null) => void;
  clearPolling: () => void;
  schedulePoll: (callback: () => void) => void;
  setJob: (job: VariableImpactScanJob | null) => void;
  setResult: (result: VariableImpactScanResult | null) => void;
  setStatus: (status: VariableImpactScanStatus) => void;
  setError: (error: string | null) => void;
  upsertHistoryScan: (scan: VariableImpactScanJob) => void;
};

export function createVariableImpactScanPoller(
  dependencies: VariableImpactScanPollerDependencies,
) {
  return async function pollJob(jobId: string) {
    try {
      const nextJob = await getVariableImpactScanJob(dependencies.workspaceId, jobId);

      if (dependencies.getActiveJobId() !== jobId) {
        return null;
      }

      dependencies.setJob(nextJob);

      if (nextJob.status === 'completed' && nextJob.result) {
        dependencies.setActiveJobId(null);
        dependencies.clearPolling();
        dependencies.setResult(nextJob.result);
        dependencies.setStatus('idle');
        dependencies.upsertHistoryScan(nextJob);
        return nextJob.result;
      }

      if (nextJob.status === 'error') {
        dependencies.setActiveJobId(null);
        dependencies.clearPolling();
        dependencies.setStatus('error');
        dependencies.setError(nextJob.error ?? nextJob.message);
        return null;
      }

      dependencies.schedulePoll(() => {
        void pollJob(jobId);
      });

      return null;
    } catch (caughtError) {
      if (dependencies.getActiveJobId() !== jobId) {
        return null;
      }

      dependencies.setActiveJobId(null);
      dependencies.clearPolling();
      dependencies.setStatus('error');
      dependencies.setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Polling the variable impact scan failed.',
      );
      return null;
    }
  };
}
