import type { VariableImpactScanJob } from '../../shared/variableSandbox';
import {
  getLatestOpenVariableImpactScanJob,
  listVariableImpactScans,
} from '../api/sandbox';

type PersistedLoadError = {
  label: string;
  reason: unknown;
};

export async function loadPersistedVariableImpactState(
  workspaceId: string,
  baselineId: string,
) {
  const [latestOpenJobResult, scansResult] = await Promise.allSettled([
    getLatestOpenVariableImpactScanJob(workspaceId, baselineId),
    listVariableImpactScans(workspaceId, baselineId),
  ]);

  const errors: PersistedLoadError[] = [];

  if (latestOpenJobResult.status === 'rejected') {
    errors.push({
      label: 'latest open impact scan job',
      reason: latestOpenJobResult.reason,
    });
  }

  if (scansResult.status === 'rejected') {
    errors.push({
      label: 'recent impact scans',
      reason: scansResult.reason,
    });
  }

  return {
    latestOpenJob:
      latestOpenJobResult.status === 'fulfilled'
        ? latestOpenJobResult.value
        : null,
    scans: scansResult.status === 'fulfilled' ? scansResult.value : [],
    errors,
  };
}

export function logPersistedVariableImpactErrors(errors: PersistedLoadError[]) {
  errors.forEach((error) => {
    console.warn(
      `[sandbox] ${error.label} load failed`,
      error.reason instanceof Error ? error.reason.message : error.reason,
    );
  });
}

export function findPersistedHistoryError(errors: PersistedLoadError[]) {
  const historyError = errors.find((error) => error.label === 'recent impact scans');

  if (!historyError) {
    return null;
  }

  return historyError.reason instanceof Error
    ? historyError.reason.message
    : 'Loading the recent impact scans failed.';
}

export function hydrateVariableDraftFromScan(
  scan: VariableImpactScanJob | null,
  apply: (scan: VariableImpactScanJob) => void,
) {
  if (scan?.variable) {
    apply(scan);
  }
}
