import { useEffect, useRef, useState } from 'react';
import {
  getPreflightSimulationJob,
  startPreflightSimulation,
} from '../api/preflight';
import type {
  PreflightSimulationJob,
  PreflightSimulationRequest,
  PreflightSimulationResult,
} from '../../shared/preflightSimulation';

type PreflightSimulationStatus = 'idle' | 'loading' | 'completed' | 'degraded' | 'error';

export function usePreflightSimulation() {
  const [job, setJob] = useState<PreflightSimulationJob | null>(null);
  const [result, setResult] = useState<PreflightSimulationResult | null>(null);
  const [status, setStatus] = useState<PreflightSimulationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);
  const activeRunIdRef = useRef(0);

  function clearPolling() {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }

  function isActiveRun(runId: number) {
    return activeRunIdRef.current === runId;
  }

  function failPolling(caughtError: unknown, runId: number) {
    if (!isActiveRun(runId)) {
      return;
    }

    clearPolling();
    setStatus('error');
    setError(caughtError instanceof Error ? caughtError.message : '查询发布前试映任务失败。');
  }

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, []);

  async function pollJob(jobId: string, runId: number) {
    const nextJob = await getPreflightSimulationJob(jobId);

    if (!isActiveRun(runId)) {
      return nextJob;
    }

    setJob(nextJob);

    if (nextJob.status === 'completed' || nextJob.status === 'degraded') {
      setResult(nextJob.result ?? null);
      setStatus(nextJob.status);
      setError(null);
      clearPolling();
      return nextJob;
    }

    if (nextJob.status === 'error') {
      setResult(nextJob.result ?? null);
      setStatus('error');
      setError(nextJob.error ?? nextJob.message);
      clearPolling();
      return nextJob;
    }

    pollTimeoutRef.current = window.setTimeout(() => {
      void pollJob(jobId, runId).catch((caughtError) => failPolling(caughtError, runId));
    }, 700);

    return nextJob;
  }

  async function runSimulation(request: PreflightSimulationRequest) {
    const runId = activeRunIdRef.current + 1;
    activeRunIdRef.current = runId;
    clearPolling();
    setStatus('loading');
    setError(null);

    try {
      const nextJob = await startPreflightSimulation(request);

      if (!isActiveRun(runId)) {
        return nextJob;
      }

      setJob(nextJob);
      setResult(nextJob.result ?? null);
      await pollJob(nextJob.id, runId);
      return nextJob;
    } catch (caughtError) {
      if (!isActiveRun(runId)) {
        throw caughtError;
      }

      setStatus('error');
      setError(
        caughtError instanceof Error ? caughtError.message : '启动发布前试映失败。',
      );
      throw caughtError;
    }
  }

  return {
    job,
    result,
    status,
    error,
    runSimulation,
    reset() {
      activeRunIdRef.current += 1;
      clearPolling();
      setJob(null);
      setResult(null);
      setStatus('idle');
      setError(null);
    },
  };
}
