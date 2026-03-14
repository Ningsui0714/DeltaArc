import { useEffect, useState } from 'react';
import type { FrozenBaseline } from '../../shared/variableSandbox';
import {
  freezeLatestSandboxBaseline,
  listFrozenBaselines,
} from '../api/sandbox';

type BaselineLibraryStatus = 'idle' | 'loading' | 'saving' | 'error';

export function useBaselineLibrary(workspaceId: string) {
  const [baselines, setBaselines] = useState<FrozenBaseline[]>([]);
  const [status, setStatus] = useState<BaselineLibraryStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBaselines() {
      setStatus('loading');
      setError(null);

      try {
        const nextBaselines = await listFrozenBaselines(workspaceId);

        if (!cancelled) {
          setBaselines(nextBaselines);
          setStatus('idle');
        }
      } catch (caughtError) {
        if (!cancelled) {
          setBaselines([]);
          setStatus('error');
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Loading frozen baselines failed.',
          );
        }
      }
    }

    if (!workspaceId) {
      setBaselines([]);
      setStatus('idle');
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    void loadBaselines();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  async function freezeLatestBaseline() {
    setStatus('saving');
    setError(null);

    try {
      const baseline = await freezeLatestSandboxBaseline(workspaceId);
      setBaselines((current) => [baseline, ...current.filter((item) => item.id !== baseline.id)]);
      setStatus('idle');
      return baseline;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Freezing the latest baseline failed.';
      setStatus('error');
      setError(message);
      throw caughtError;
    }
  }

  function resetBaselines() {
    setBaselines([]);
    setStatus('idle');
    setError(null);
  }

  return {
    baselines,
    status,
    error,
    freezeLatestBaseline,
    resetBaselines,
  };
}
