import type { SandboxAnalysisMode, SandboxAnalysisResult } from '../../shared/sandbox';
import { createAnalysisMeta, createAnalysisRequestId } from '../../shared/schema';

export type WorkspaceAnalysisState = {
  hasViewableOutput: boolean;
  isFresh: boolean;
  isStale: boolean;
  isDegraded: boolean;
  requiresRerun: boolean;
  lastCompletedAt: string;
};

export function createEmptySandboxAnalysis(mode: SandboxAnalysisMode): SandboxAnalysisResult {
  return {
    generatedAt: '',
    mode,
    model: 'Awaiting LLM forecast',
    pipeline: [],
    meta: createAnalysisMeta('local_fallback', 'stale', createAnalysisRequestId('pending')),
    summary: '',
    systemVerdict: '',
    evidenceLevel: 'low',
    primaryRisk: '',
    nextStep: '',
    playerAcceptance: 0,
    confidence: 0,
    supportRatio: 0,
    scores: {
      coreFun: 0,
      learningCost: 0,
      novelty: 0,
      acceptanceRisk: 0,
      prototypeCost: 0,
    },
    personas: [],
    hypotheses: [],
    strategies: [],
    perspectives: [],
    blindSpots: [],
    secondOrderEffects: [],
    scenarioVariants: [],
    futureTimeline: [],
    communityRhythms: [],
    trajectorySignals: [],
    decisionLenses: [],
    validationTracks: [],
    contrarianMoves: [],
    unknowns: [],
    redTeam: {
      thesis: '',
      attackVectors: [],
      failureModes: [],
      mitigation: '',
    },
    memorySignals: [],
    report: {
      headline: '',
      summary: '',
      conclusion: '',
      whyNow: '',
      risk: '',
      actions: [],
    },
    warnings: [],
  };
}

export function deriveWorkspaceAnalysisState(
  analysis: SandboxAnalysisResult,
  options?: {
    matchesCurrentInputs?: boolean;
  },
): WorkspaceAnalysisState {
  const hasViewableOutput =
    analysis.meta.source === 'remote' && analysis.meta.status !== 'error';
  const matchesCurrentInputs = options?.matchesCurrentInputs ?? analysis.meta.status !== 'stale';
  const isDegraded = hasViewableOutput && analysis.meta.status === 'degraded';
  const isStale =
    hasViewableOutput &&
    (analysis.meta.status === 'stale' || (!matchesCurrentInputs && analysis.meta.status !== 'degraded'));
  const isFresh = hasViewableOutput && !isStale && !isDegraded;

  return {
    hasViewableOutput,
    isFresh,
    isStale,
    isDegraded,
    requiresRerun: isStale || isDegraded,
    lastCompletedAt: hasViewableOutput ? analysis.generatedAt : '',
  };
}

export function markAnalysisStale(analysis: SandboxAnalysisResult): SandboxAnalysisResult {
  if (analysis.meta.source !== 'remote') {
    return createEmptySandboxAnalysis(analysis.mode);
  }

  if (analysis.meta.status === 'stale' || analysis.meta.status === 'degraded') {
    return analysis;
  }

  return {
    ...analysis,
    meta: {
      ...analysis.meta,
      status: 'stale',
    },
  };
}

export function resetWorkspaceAnalysis(mode: SandboxAnalysisMode): SandboxAnalysisResult {
  return createEmptySandboxAnalysis(mode);
}
