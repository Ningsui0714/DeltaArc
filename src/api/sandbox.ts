import type { SandboxAnalysisJob, SandboxAnalysisRequest } from '../../shared/sandbox';
import { parseSandboxAnalysisRequest, parseSandboxAnalysisResult } from '../../shared/schema';

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
