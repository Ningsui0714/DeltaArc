import {
  parsePreflightSimulationJob,
  parsePreflightSimulationRequest,
  type PreflightSimulationJob,
  type PreflightSimulationRequest,
} from '../../shared/preflightSimulation';

async function parseError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? '发布前试映服务暂时不可用。';
}

function normalizeJob(job: PreflightSimulationJob) {
  return parsePreflightSimulationJob(job);
}

export async function startPreflightSimulation(request: PreflightSimulationRequest) {
  const normalizedRequest = parsePreflightSimulationRequest(request);
  const response = await fetch('/api/preflight-simulations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(normalizedRequest),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return normalizeJob((await response.json()) as PreflightSimulationJob);
}

export async function getPreflightSimulationJob(jobId: string) {
  const response = await fetch(`/api/preflight-simulations/${jobId}`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return normalizeJob((await response.json()) as PreflightSimulationJob);
}
