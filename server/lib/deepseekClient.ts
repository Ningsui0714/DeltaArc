import type { SandboxAnalysisRequest } from '../../shared/sandbox';
import { orchestrateSandboxAnalysis } from './orchestration';

export async function runDeepseekSandboxAnalysis(
  request: SandboxAnalysisRequest,
  dependencies?: Parameters<typeof orchestrateSandboxAnalysis>[1],
) {
  return orchestrateSandboxAnalysis(request, dependencies);
}
