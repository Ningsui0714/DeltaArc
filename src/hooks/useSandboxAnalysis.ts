import { useEffect, useRef, useState } from 'react';
import { getSandboxAnalysisJob, startSandboxAnalysis } from '../api/sandbox';
import { createLocalSandboxAnalysis } from '../lib/createLocalSandboxAnalysis';
import type { EvidenceItem, ProjectSnapshot } from '../types';
import type { SandboxAnalysisJob, SandboxAnalysisMode, SandboxAnalysisResult } from '../../shared/sandbox';
import { createAnalysisMeta, createAnalysisRequestId } from '../../shared/schema';

type UseSandboxAnalysisParams = {
  project: ProjectSnapshot;
  evidenceItems: EvidenceItem[];
};

function createLocalPreview(
  project: ProjectSnapshot,
  evidenceItems: EvidenceItem[],
  mode: SandboxAnalysisMode,
  status: SandboxAnalysisResult['meta']['status'] = 'degraded',
) {
  return createLocalSandboxAnalysis(
    project,
    evidenceItems,
    mode,
    createAnalysisMeta('local_fallback', status, createAnalysisRequestId('local')),
  );
}

export function useSandboxAnalysis({ project, evidenceItems }: UseSandboxAnalysisParams) {
  const [analysis, setAnalysis] = useState(() => createLocalPreview(project, evidenceItems, 'balanced'));
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
    setAnalysis((current) => createLocalPreview(project, evidenceItems, current.mode, 'degraded'));
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
      setAnalysis(createLocalPreview(project, evidenceItems, mode, 'error'));
      setStatus('error');
      setError(job.error ?? job.message);
      return null;
    }

    pollTimeoutRef.current = window.setTimeout(() => {
      void pollJob(jobId, mode);
    }, 900);

    return null;
  }

  async function runAnalysis(mode: SandboxAnalysisMode) {
    clearPolling();
    activeJobIdRef.current = null;
    setStatus('loading');
    setError(null);
    setAnalysis(createLocalPreview(project, evidenceItems, mode, 'stale'));

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
      setAnalysis(createLocalPreview(project, evidenceItems, mode, 'error'));
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
