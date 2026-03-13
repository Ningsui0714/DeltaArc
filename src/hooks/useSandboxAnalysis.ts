import { useEffect, useRef, useState } from 'react';
import { getSandboxAnalysisJob, startSandboxAnalysis } from '../api/sandbox';
import type { EvidenceItem, ProjectSnapshot } from '../types';
import type { SandboxAnalysisJob, SandboxAnalysisMode, SandboxAnalysisResult } from '../../shared/sandbox';
import { createAnalysisMeta, createAnalysisRequestId } from '../../shared/schema';

type UseSandboxAnalysisParams = {
  project: ProjectSnapshot;
  evidenceItems: EvidenceItem[];
};

function createEmptyAnalysis(mode: SandboxAnalysisMode): SandboxAnalysisResult {
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

export function useSandboxAnalysis({ project, evidenceItems }: UseSandboxAnalysisParams) {
const [analysis, setAnalysis] = useState<SandboxAnalysisResult>(() => createEmptyAnalysis('balanced'));
  const [progress, setProgress] = useState<SandboxAnalysisJob | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const activeJobIdRef = useRef<string | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);

  function clearPolling() {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, []);

  useEffect(() => {
    clearPolling();
    activeJobIdRef.current = null;
    setProgress(null);
    setError(null);
    setStatus('idle');
    setAnalysis((current) => createEmptyAnalysis(current.mode));
  }, [project, evidenceItems]);

  async function pollJob(jobId: string, mode: SandboxAnalysisMode) {
    const job = await getSandboxAnalysisJob(jobId);

    if (activeJobIdRef.current !== jobId) {
      return null;
    }

    setProgress(job);

    if (job.status === 'completed' && job.result) {
      activeJobIdRef.current = null;
      clearPolling();
      setAnalysis(job.result);
      setStatus('idle');
      return job.result;
    }

    if (job.status === 'error') {
      activeJobIdRef.current = null;
      clearPolling();
      setAnalysis(createEmptyAnalysis(mode));
      setStatus('error');
      setError(job.error ?? job.message);
      return null;
    }

    pollTimeoutRef.current = window.setTimeout(() => {
      void pollJob(jobId, mode);
    }, 300);

    return null;
  }

  async function runAnalysis(mode: SandboxAnalysisMode) {
    clearPolling();
    activeJobIdRef.current = null;
    setStatus('loading');
    setError(null);
    setAnalysis((current) => {
      if (current.meta.source === 'remote') {
        return { ...current, mode };
      }

      return createEmptyAnalysis(mode);
    });

    try {
      const job = await startSandboxAnalysis({
        mode,
        project,
        evidenceItems,
      });

      activeJobIdRef.current = job.id;
      setProgress(job);

      return await pollJob(job.id, mode);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Sandbox analysis request failed.';
      setAnalysis(createEmptyAnalysis(mode));
      setStatus('error');
      setError(message);
      return null;
    }
  }

  return {
    analysis,
    progress,
    status,
    error,
    runAnalysis,
  };
}
