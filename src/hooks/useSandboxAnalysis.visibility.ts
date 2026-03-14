import type {
  SandboxAnalysisMode,
  SandboxAnalysisResult,
} from '../../shared/sandbox';
import {
  createEmptySandboxAnalysis,
  markAnalysisStale,
} from '../lib/workspaceAnalysisState';

type VisibleAnalysisParams = {
  mode: SandboxAnalysisMode;
  currentInputSignature: string;
  latestRemoteAnalysis: SandboxAnalysisResult | null;
  latestRemoteInputSignature: string | null;
};

export function materializeVisibleRemoteAnalysis(
  result: SandboxAnalysisResult,
  inputSignature: string,
  currentInputSignature: string,
) {
  return inputSignature === currentInputSignature
    ? result
    : result.meta.status === 'fresh'
      ? markAnalysisStale(result)
      : result;
}

export function resolveVisibleAnalysis({
  mode,
  currentInputSignature,
  latestRemoteAnalysis,
  latestRemoteInputSignature,
}: VisibleAnalysisParams) {
  if (!latestRemoteAnalysis || !latestRemoteInputSignature) {
    return createEmptySandboxAnalysis(mode);
  }

  if (latestRemoteInputSignature === currentInputSignature) {
    return latestRemoteAnalysis;
  }

  return latestRemoteAnalysis.meta.status === 'fresh'
    ? markAnalysisStale(latestRemoteAnalysis)
    : latestRemoteAnalysis;
}

export function resolveFallbackAnalysis(
  params: VisibleAnalysisParams,
  partialResult?: SandboxAnalysisResult,
) {
  if (partialResult) {
    return partialResult;
  }

  return resolveVisibleAnalysis(params);
}
