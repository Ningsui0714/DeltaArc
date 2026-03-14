import { useEffect, useRef, useState } from 'react';
import {
  retrySandboxAnalysisJob,
  startSandboxAnalysis,
} from '../api/sandbox';
import type { EvidenceItem, ProjectSnapshot } from '../types';
import type {
  SandboxAnalysisJob,
  SandboxAnalysisMode,
  SandboxAnalysisResult,
} from '../../shared/sandbox';
import { createWorkspaceInputSignature } from '../../shared/variableSandbox';
import {
  createEmptySandboxAnalysis,
  resetWorkspaceAnalysis,
} from '../lib/workspaceAnalysisState';
import { createSandboxAnalysisPoller } from './useSandboxAnalysis.poller';
import {
  loadPersistedSandboxWorkspaceState,
  logPersistedSandboxWorkspaceErrors,
  resolveRestoredSandboxWorkspaceState,
} from './useSandboxAnalysis.persistence';
import {
  materializeVisibleRemoteAnalysis,
  resolveFallbackAnalysis,
  resolveVisibleAnalysis,
} from './useSandboxAnalysis.visibility';

type UseSandboxAnalysisParams = {
  workspaceId: string;
  project: ProjectSnapshot;
  evidenceItems: EvidenceItem[];
};

export function useSandboxAnalysis({
  workspaceId,
  project,
  evidenceItems,
}: UseSandboxAnalysisParams) {
  const currentInputSignature = createWorkspaceInputSignature(project, evidenceItems);
  const [analysis, setAnalysis] = useState<SandboxAnalysisResult>(() =>
    createEmptySandboxAnalysis('balanced'),
  );
  const [progress, setProgress] = useState<SandboxAnalysisJob | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastRequestedMode, setLastRequestedMode] =
    useState<SandboxAnalysisMode | null>(null);
  const activeJobIdRef = useRef<string | null>(null);
  const activeJobInputSignatureRef = useRef<string | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);
  const currentInputSignatureRef = useRef(currentInputSignature);
  const lastRemoteAnalysisRef = useRef<SandboxAnalysisResult | null>(null);
  const lastRemoteInputSignatureRef = useRef<string | null>(null);
  const retryableJobRef = useRef<SandboxAnalysisJob | null>(null);
  const retryableJobInputSignatureRef = useRef<string | null>(null);

  function clearPolling() {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }

  function cacheRemoteAnalysis(result: SandboxAnalysisResult, inputSignature: string) {
    lastRemoteAnalysisRef.current = result;
    lastRemoteInputSignatureRef.current = inputSignature;
  }

  function clearRetryableJob() {
    retryableJobRef.current = null;
    retryableJobInputSignatureRef.current = null;
  }

  function cacheRetryableJob(job: SandboxAnalysisJob, inputSignature: string) {
    if (!job.retryable) {
      clearRetryableJob();
      return;
    }

    retryableJobRef.current = job;
    retryableJobInputSignatureRef.current = inputSignature;
  }

  function getVisibleRetryableJob() {
    const job = retryableJobRef.current;
    const inputSignature = retryableJobInputSignatureRef.current;

    if (!job || !inputSignature || inputSignature !== currentInputSignatureRef.current) {
      return null;
    }

    return {
      job,
      inputSignature,
    };
  }

  function resolveVisibleAnalysisForMode(mode: SandboxAnalysisMode) {
    return resolveVisibleAnalysis({
      mode,
      currentInputSignature: currentInputSignatureRef.current,
      latestRemoteAnalysis: lastRemoteAnalysisRef.current,
      latestRemoteInputSignature: lastRemoteInputSignatureRef.current,
    });
  }

  function resolveFallbackAnalysisForMode(
    mode: SandboxAnalysisMode,
    partialResult?: SandboxAnalysisResult,
  ) {
    return resolveFallbackAnalysis(
      {
        mode,
        currentInputSignature: currentInputSignatureRef.current,
        latestRemoteAnalysis: lastRemoteAnalysisRef.current,
        latestRemoteInputSignature: lastRemoteInputSignatureRef.current,
      },
      partialResult,
    );
  }

  function resetAnalysisState() {
    clearPolling();
    activeJobIdRef.current = null;
    activeJobInputSignatureRef.current = null;
    lastRemoteAnalysisRef.current = null;
    lastRemoteInputSignatureRef.current = null;
    clearRetryableJob();
    setProgress(null);
    setError(null);
    setStatus('idle');
    setLastRequestedMode(null);
    setAnalysis((current) => resetWorkspaceAnalysis(current.mode));
  }

  const pollJob = createSandboxAnalysisPoller({
    getActiveJobId: () => activeJobIdRef.current,
    setActiveJobId: (jobId) => {
      activeJobIdRef.current = jobId;
    },
    getActiveJobInputSignature: () => activeJobInputSignatureRef.current,
    setActiveJobInputSignature: (inputSignature) => {
      activeJobInputSignatureRef.current = inputSignature;
    },
    getCurrentInputSignature: () => currentInputSignatureRef.current,
    clearPolling,
    schedulePoll: (callback) => {
      pollTimeoutRef.current = window.setTimeout(callback, 300);
    },
    cacheRemoteAnalysis,
    cacheRetryableJob,
    clearRetryableJob,
    setProgress,
    setAnalysis,
    setStatus,
    setError,
    resolveVisibleAnalysis: resolveVisibleAnalysisForMode,
    resolveFallbackAnalysis: resolveFallbackAnalysisForMode,
  });

  useEffect(() => {
    currentInputSignatureRef.current = currentInputSignature;
  }, [currentInputSignature]);

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    resetAnalysisState();

    async function loadWorkspaceState() {
      const restored = await loadPersistedSandboxWorkspaceState(workspaceId);

      if (cancelled) {
        return;
      }

      logPersistedSandboxWorkspaceErrors(restored.errors);

      const {
        restoredActiveJob,
        restoredRetryableJob,
        restoredRemoteAnalysis,
        retryableJobToCache,
      } = resolveRestoredSandboxWorkspaceState({
        currentInputSignature: currentInputSignatureRef.current,
        latestAnalysis: restored.latestAnalysis,
        latestActiveJob: restored.latestActiveJob,
        latestRetryableJob: restored.latestRetryableJob,
      });

      if (retryableJobToCache) {
        cacheRetryableJob(
          retryableJobToCache.job,
          retryableJobToCache.inputSignature,
        );
      } else {
        clearRetryableJob();
      }

      if (restoredRemoteAnalysis) {
        cacheRemoteAnalysis(
          restoredRemoteAnalysis.analysis,
          restoredRemoteAnalysis.inputSignature,
        );
        setAnalysis(
          materializeVisibleRemoteAnalysis(
            restoredRemoteAnalysis.analysis,
            restoredRemoteAnalysis.inputSignature,
            currentInputSignatureRef.current,
          ),
        );
      }

      if (restoredActiveJob) {
        activeJobIdRef.current = restoredActiveJob.job.id;
        activeJobInputSignatureRef.current = restoredActiveJob.inputSignature;
        setProgress(restoredActiveJob.job);
        setStatus('loading');
        setError(null);
        setLastRequestedMode(restoredActiveJob.job.mode);

        if (!restoredRemoteAnalysis) {
          setAnalysis(createEmptySandboxAnalysis(restoredActiveJob.job.mode));
        }

        void pollJob(restoredActiveJob.job.id, restoredActiveJob.job.mode);
        return;
      }

      if (!restoredRetryableJob) {
        return;
      }

      activeJobInputSignatureRef.current = restoredRetryableJob.inputSignature;
      setProgress(restoredRetryableJob.job);
      setStatus('error');
      setError(restoredRetryableJob.job.error ?? restoredRetryableJob.job.message);
      setLastRequestedMode(restoredRetryableJob.job.mode);

      if (!restoredRemoteAnalysis) {
        setAnalysis(createEmptySandboxAnalysis(restoredRetryableJob.job.mode));
      }
    }

    if (workspaceId) {
      void loadWorkspaceState();
    }

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    const hasActiveJob = activeJobIdRef.current !== null;
    const visibleRetryableJob = !hasActiveJob ? getVisibleRetryableJob() : null;

    if (!hasActiveJob) {
      clearPolling();

      if (visibleRetryableJob) {
        activeJobInputSignatureRef.current = visibleRetryableJob.inputSignature;
        setProgress(visibleRetryableJob.job);
        setError(visibleRetryableJob.job.error ?? visibleRetryableJob.job.message);
        setStatus('error');
        setLastRequestedMode(visibleRetryableJob.job.mode);
      } else {
        activeJobInputSignatureRef.current = null;
        setProgress(null);
        setError(null);
        setStatus('idle');
      }
    }

    setAnalysis((current) => {
      if (visibleRetryableJob) {
        return resolveFallbackAnalysisForMode(
          visibleRetryableJob.job.mode,
          visibleRetryableJob.job.result,
        );
      }

      if (lastRemoteAnalysisRef.current) {
        return resolveVisibleAnalysisForMode(current.mode);
      }

      if (hasActiveJob) {
        return current;
      }

      return current.meta.source === 'remote'
        ? resolveVisibleAnalysisForMode(current.mode)
        : createEmptySandboxAnalysis(current.mode);
    });
  }, [currentInputSignature]);

  async function runAnalysis(mode: SandboxAnalysisMode) {
    clearPolling();
    activeJobIdRef.current = null;
    activeJobInputSignatureRef.current = currentInputSignatureRef.current;
    setLastRequestedMode(mode);
    setProgress(null);
    setStatus('loading');
    setError(null);
    setAnalysis((current) =>
      current.meta.source === 'remote'
        ? { ...resolveVisibleAnalysisForMode(mode), mode }
        : createEmptySandboxAnalysis(mode),
    );

    try {
      const job = await startSandboxAnalysis({
        workspaceId,
        mode,
        project,
        evidenceItems,
      });

      clearRetryableJob();
      activeJobIdRef.current = job.id;
      setProgress(job);

      return await pollJob(job.id, mode);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Sandbox analysis request failed.';
      activeJobInputSignatureRef.current = null;
      setProgress(null);
      setAnalysis(resolveFallbackAnalysisForMode(mode));
      setStatus('error');
      setError(message);
      return null;
    }
  }

  async function retryAnalysisFromFailure() {
    if (!progress?.retryable) {
      throw new Error('The latest analysis failure cannot be resumed from a cached stage.');
    }

    const retryInputSignature = activeJobInputSignatureRef.current;

    if (!retryInputSignature) {
      throw new Error('The failed analysis is missing its original input signature.');
    }

    if (retryInputSignature !== currentInputSignatureRef.current) {
      throw new Error(
        'Current inputs changed after the failed run. Start a new analysis instead of resuming the old one.',
      );
    }

    clearPolling();
    activeJobIdRef.current = null;
    activeJobInputSignatureRef.current = retryInputSignature;
    setLastRequestedMode(progress.mode);
    setStatus('loading');
    setError(null);

    try {
      const resumedJob = await retrySandboxAnalysisJob(progress.id);
      clearRetryableJob();
      activeJobIdRef.current = resumedJob.id;
      setProgress(resumedJob);

      return await pollJob(resumedJob.id, resumedJob.mode);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Retrying the failed analysis stage did not work.';
      setAnalysis(resolveFallbackAnalysisForMode(progress.mode, progress.result));
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
    lastRequestedMode,
    visibleAnalysisMode:
      analysis.meta.source === 'remote'
        ? lastRemoteAnalysisRef.current?.mode ?? analysis.mode
        : null,
    isShowingFallbackAnalysis: status === 'error' && analysis.meta.source === 'remote',
    canRetryAnalysisFromFailure:
      Boolean(progress?.retryable) &&
      activeJobInputSignatureRef.current === currentInputSignature,
    analysisMatchesCurrentDraft:
      Boolean(lastRemoteAnalysisRef.current) &&
      lastRemoteInputSignatureRef.current === currentInputSignature,
    runAnalysis,
    retryAnalysisFromFailure,
    resetAnalysisState,
  };
}
