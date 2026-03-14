import { useEffect, useRef, useState } from 'react';
import type { SandboxAnalysisMode } from '../../shared/sandbox';
import type {
  DesignVariableV1,
  FrozenBaseline,
  VariableImpactScanJob,
  VariableImpactScanResult,
} from '../../shared/variableSandbox';
import { startVariableImpactScan } from '../api/sandbox';
import { createVariableImpactScanPoller } from './useVariableImpactScan.poller';
import {
  buildResolvedVariable,
  createEmptyVariable,
  createVariableId,
  splitListInput,
} from './useVariableImpactScan.draft';
import type { VariableSandboxListField } from './useVariableImpactScan.draft';
import {
  findPersistedHistoryError,
  hydrateVariableDraftFromScan,
  loadPersistedVariableImpactState,
  logPersistedVariableImpactErrors,
} from './useVariableImpactScan.persistence';

type UseVariableImpactScanParams = {
  workspaceId: string;
  baseline: FrozenBaseline | null;
};

type VariableImpactHistoryStatus = 'idle' | 'loading' | 'error';

export type { VariableSandboxListField } from './useVariableImpactScan.draft';

export function useVariableImpactScan({
  workspaceId,
  baseline,
}: UseVariableImpactScanParams) {
  const baselineId = baseline?.id ?? '';
  const [variableDraft, setVariableDraft] = useState<DesignVariableV1>(() =>
    createEmptyVariable(baselineId),
  );
  const [categoryIsManual, setCategoryIsManual] = useState(false);
  const [job, setJob] = useState<VariableImpactScanJob | null>(null);
  const [result, setResult] = useState<VariableImpactScanResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<VariableImpactScanJob[]>([]);
  const [historyStatus, setHistoryStatus] =
    useState<VariableImpactHistoryStatus>('idle');
  const [historyError, setHistoryError] = useState<string | null>(null);
  const activeJobIdRef = useRef<string | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);
  const draftRevisionRef = useRef(0);

  function clearPolling() {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }

  function applyScanToDraft(scan: VariableImpactScanJob) {
    hydrateVariableDraftFromScan(scan, (nextScan) => {
      setCategoryIsManual(true);
      setVariableDraft(nextScan.variable!);
    });
  }

  function upsertHistoryScan(scan: VariableImpactScanJob) {
    setHistory((current) => [scan, ...current.filter((item) => item.id !== scan.id)]);
    setHistoryStatus('idle');
    setHistoryError(null);
  }

  const pollJob = createVariableImpactScanPoller({
    workspaceId,
    getActiveJobId: () => activeJobIdRef.current,
    setActiveJobId: (jobId) => {
      activeJobIdRef.current = jobId;
    },
    clearPolling,
    schedulePoll: (callback) => {
      pollTimeoutRef.current = window.setTimeout(callback, 300);
    },
    setJob,
    setResult,
    setStatus,
    setError,
    upsertHistoryScan,
  });

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    clearPolling();
    activeJobIdRef.current = null;
    setJob(null);
    setResult(null);
    setStatus('idle');
    setError(null);
    setHistory([]);
    setHistoryStatus(baselineId && workspaceId ? 'loading' : 'idle');
    setHistoryError(null);
    setCategoryIsManual(false);
    setVariableDraft(createEmptyVariable(baselineId));
    draftRevisionRef.current = 0;

    const hydrationRevision = draftRevisionRef.current;

    async function loadPersistedHistory() {
      const persistedState = await loadPersistedVariableImpactState(
        workspaceId,
        baselineId,
      );

      if (cancelled) {
        return;
      }

      logPersistedVariableImpactErrors(persistedState.errors);

      const nextHistoryError = findPersistedHistoryError(persistedState.errors);

      if (nextHistoryError) {
        setHistory([]);
        setHistoryStatus('error');
        setHistoryError(nextHistoryError);
      } else {
        setHistory(persistedState.scans);
        setHistoryStatus('idle');
      }

      if (
        activeJobIdRef.current !== null ||
        draftRevisionRef.current !== hydrationRevision
      ) {
        return;
      }

      if (persistedState.latestOpenJob) {
        setJob(persistedState.latestOpenJob);
        setResult(persistedState.latestOpenJob.result ?? null);
        setStatus(
          persistedState.latestOpenJob.status === 'error' ? 'error' : 'loading',
        );
        setError(
          persistedState.latestOpenJob.status === 'error'
            ? persistedState.latestOpenJob.error ?? persistedState.latestOpenJob.message
            : null,
        );
        applyScanToDraft(persistedState.latestOpenJob);

        if (
          persistedState.latestOpenJob.status === 'queued' ||
          persistedState.latestOpenJob.status === 'running'
        ) {
          activeJobIdRef.current = persistedState.latestOpenJob.id;
          void pollJob(persistedState.latestOpenJob.id);
        }
        return;
      }

      const latestScan = persistedState.scans[0];

      if (!latestScan) {
        return;
      }

      setJob(latestScan);
      setResult(latestScan.result ?? null);
      applyScanToDraft(latestScan);
    }

    if (baselineId && workspaceId) {
      void loadPersistedHistory();
    }

    return () => {
      cancelled = true;
    };
  }, [baselineId, workspaceId]);

  function openHistoryScan(scanId: string) {
    const persistedScan = history.find((item) => item.id === scanId);

    if (!persistedScan) {
      return;
    }

    clearPolling();
    activeJobIdRef.current = null;
    draftRevisionRef.current += 1;
    setJob(persistedScan);
    setResult(persistedScan.result ?? null);
    setStatus('idle');
    setError(null);
    applyScanToDraft(persistedScan);
  }

  function updateVariable(patch: Partial<DesignVariableV1>) {
    draftRevisionRef.current += 1;
    setVariableDraft((current) => ({
      ...current,
      ...patch,
      baselineId: baselineId || current.baselineId,
    }));
  }

  function updateCategory(category: DesignVariableV1['category']) {
    setCategoryIsManual(true);
    updateVariable({ category });
  }

  function updateListField(field: VariableSandboxListField, rawValue: string) {
    updateVariable({
      [field]: splitListInput(rawValue),
    } as Pick<DesignVariableV1, typeof field>);
  }

  function updatePrimaryConcern(value: string) {
    draftRevisionRef.current += 1;
    setVariableDraft((current) => {
      const rest = current.knownCosts.slice(1);
      const nextKnownCosts = value.trim() ? [value.trim(), ...rest] : rest;

      return {
        ...current,
        baselineId: baselineId || current.baselineId,
        knownCosts: [...new Set(nextKnownCosts.map((item) => item.trim()).filter(Boolean))],
      };
    });
  }

  async function runImpactScan(mode: SandboxAnalysisMode) {
    if (!baseline || !workspaceId) {
      return null;
    }

    const nextVariable: DesignVariableV1 = {
      ...buildResolvedVariable(variableDraft, baseline, categoryIsManual),
      baselineId: baseline.id,
      id: variableDraft.id || createVariableId(),
    };

    draftRevisionRef.current += 1;
    setVariableDraft(nextVariable);
    clearPolling();
    activeJobIdRef.current = null;
    setJob(null);
    setResult(null);
    setStatus('loading');
    setError(null);
    setHistoryError(null);

    try {
      const nextJob = await startVariableImpactScan(workspaceId, {
        baselineId: baseline.id,
        variable: nextVariable,
        mode,
      });

      activeJobIdRef.current = nextJob.id;
      setJob(nextJob);
      return await pollJob(nextJob.id);
    } catch (caughtError) {
      setStatus('error');
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Starting the variable impact scan failed.',
      );
      return null;
    }
  }

  const resolvedVariableDraft = buildResolvedVariable(
    variableDraft,
    baseline,
    categoryIsManual,
  );

  const canRunImpactScan =
    Boolean(baseline) &&
    Boolean(variableDraft.name.trim()) &&
    Boolean(variableDraft.changeStatement.trim()) &&
    Boolean(variableDraft.intent.trim());

  return {
    variableDraft,
    resolvedVariableDraft,
    primaryConcern: variableDraft.knownCosts[0] || '',
    job,
    result,
    status,
    error,
    history,
    historyStatus,
    historyError,
    canRunImpactScan,
    updateVariable,
    updateCategory,
    updateListField,
    updatePrimaryConcern,
    openHistoryScan,
    resetVariableDraft: () => {
      draftRevisionRef.current += 1;
      setCategoryIsManual(false);
      setVariableDraft(createEmptyVariable(baselineId));
    },
    runQuickImpactScan: () => runImpactScan('balanced'),
    runDeepImpactScan: () => runImpactScan('reasoning'),
  };
}
