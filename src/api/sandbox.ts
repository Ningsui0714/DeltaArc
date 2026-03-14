import type {
  LatestActiveSandboxAnalysisJob,
  LatestRetryableSandboxAnalysisJob,
  SandboxAnalysisJob,
  SandboxAnalysisRequest,
} from '../../shared/sandbox';
import type {
  FrozenBaseline,
  PersistedLatestAnalysis,
  VariableImpactScanJob,
  VariableImpactScanRequest,
} from '../../shared/variableSandbox';
import {
  parseFrozenBaseline,
  parsePersistedLatestAnalysis,
  parseSandboxAnalysisRequest,
  parseSandboxAnalysisResult,
  parseVariableImpactScanJob,
} from '../../shared/schema';

async function parseError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'Sandbox analysis service is unavailable.';
}

function normalizeJob(job: SandboxAnalysisJob) {
  if (job.result) {
    return {
      ...job,
      result: parseSandboxAnalysisResult(job.result),
    };
  }

  return job;
}

function normalizeLatestRetryableJob(snapshot: LatestRetryableSandboxAnalysisJob) {
  return {
    ...snapshot,
    job: normalizeJob(snapshot.job),
  };
}

function normalizeLatestActiveJob(snapshot: LatestActiveSandboxAnalysisJob) {
  return {
    ...snapshot,
    job: normalizeJob(snapshot.job),
  };
}

export async function startSandboxAnalysis(request: SandboxAnalysisRequest) {
  const normalizedRequest = parseSandboxAnalysisRequest(request);
  const response = await fetch('/api/sandbox/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(normalizedRequest),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return normalizeJob((await response.json()) as SandboxAnalysisJob);
}

export async function getSandboxAnalysisJob(jobId: string) {
  const response = await fetch(`/api/sandbox/analyze/${jobId}`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return normalizeJob((await response.json()) as SandboxAnalysisJob);
}

export async function retrySandboxAnalysisJob(jobId: string) {
  const response = await fetch(`/api/sandbox/analyze/${jobId}/retry`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return normalizeJob((await response.json()) as SandboxAnalysisJob);
}

export async function getLatestPersistedSandboxAnalysis(workspaceId: string) {
  const response = await fetch(`/api/sandbox/workspaces/${workspaceId}/latest-analysis`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as { latestAnalysis?: PersistedLatestAnalysis | null };
  return payload.latestAnalysis ? parsePersistedLatestAnalysis(payload.latestAnalysis) : null;
}

export async function getLatestActiveSandboxAnalysisJob(workspaceId: string) {
  const response = await fetch(`/api/sandbox/workspaces/${workspaceId}/latest-active-job`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as {
    latestActiveJob?: LatestActiveSandboxAnalysisJob | null;
  };

  return payload.latestActiveJob ? normalizeLatestActiveJob(payload.latestActiveJob) : null;
}

export async function getLatestRetryableSandboxAnalysisJob(workspaceId: string) {
  const response = await fetch(`/api/sandbox/workspaces/${workspaceId}/latest-retryable-job`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as {
    latestRetryableJob?: LatestRetryableSandboxAnalysisJob | null;
  };

  return payload.latestRetryableJob
    ? normalizeLatestRetryableJob(payload.latestRetryableJob)
    : null;
}

export async function clearSandboxWorkspace(workspaceId: string) {
  const response = await fetch(`/api/sandbox/workspaces/${workspaceId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function listFrozenBaselines(workspaceId: string) {
  const response = await fetch(`/api/sandbox/workspaces/${workspaceId}/baselines`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as { baselines?: FrozenBaseline[] };
  return Array.isArray(payload.baselines)
    ? payload.baselines.map((baseline) => parseFrozenBaseline(baseline))
    : [];
}

export async function freezeLatestSandboxBaseline(workspaceId: string) {
  const response = await fetch(`/api/sandbox/workspaces/${workspaceId}/baselines`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return parseFrozenBaseline((await response.json()) as FrozenBaseline);
}

export async function getFrozenBaseline(workspaceId: string, baselineId: string) {
  const response = await fetch(
    `/api/sandbox/workspaces/${workspaceId}/baselines/${baselineId}`,
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return parseFrozenBaseline((await response.json()) as FrozenBaseline);
}

export async function startVariableImpactScan(
  workspaceId: string,
  request: VariableImpactScanRequest,
) {
  const response = await fetch(`/api/sandbox/workspaces/${workspaceId}/impact-scans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return parseVariableImpactScanJob((await response.json()) as VariableImpactScanJob);
}

export async function listVariableImpactScans(workspaceId: string, baselineId?: string) {
  const query = baselineId ? `?baselineId=${encodeURIComponent(baselineId)}` : '';
  const response = await fetch(`/api/sandbox/workspaces/${workspaceId}/impact-scans${query}`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as { scans?: VariableImpactScanJob[] };
  return Array.isArray(payload.scans)
    ? payload.scans.map((scan) => parseVariableImpactScanJob(scan))
    : [];
}

export async function getLatestOpenVariableImpactScanJob(workspaceId: string, baselineId: string) {
  const response = await fetch(
    `/api/sandbox/workspaces/${workspaceId}/impact-scans/latest-open?baselineId=${encodeURIComponent(baselineId)}`,
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as {
    latestOpenJob?: VariableImpactScanJob | null;
  };

  return payload.latestOpenJob ? parseVariableImpactScanJob(payload.latestOpenJob) : null;
}

export async function getVariableImpactScanJob(workspaceId: string, jobId: string) {
  const response = await fetch(`/api/sandbox/workspaces/${workspaceId}/impact-scans/${jobId}`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return parseVariableImpactScanJob((await response.json()) as VariableImpactScanJob);
}
