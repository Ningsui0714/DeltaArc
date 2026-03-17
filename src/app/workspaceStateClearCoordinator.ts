import { clearSandboxWorkspace } from '../api/sandbox';

export function createWorkspaceStateClearCoordinator(
  clearWorkspace: (workspaceId: string) => Promise<void> | void,
) {
  const pendingClears = new Map<string, Promise<void>>();

  function clearPersistedWorkspaceState(workspaceId: string) {
    const previousClear = pendingClears.get(workspaceId) ?? Promise.resolve();
    const clearPromise = previousClear
      .catch(() => undefined)
      .then(async () => {
        await clearWorkspace(workspaceId);
      })
      .catch((caughtError) => {
        console.warn(
          '[sandbox] clearing persisted workspace failed',
          caughtError instanceof Error ? caughtError.message : caughtError,
        );
      })
      .finally(() => {
        if (pendingClears.get(workspaceId) === clearPromise) {
          pendingClears.delete(workspaceId);
        }
      });

    pendingClears.set(workspaceId, clearPromise);
    return clearPromise;
  }

  function waitForPendingWorkspaceStateClear(workspaceId: string) {
    return pendingClears.get(workspaceId) ?? Promise.resolve();
  }

  return {
    clearPersistedWorkspaceState,
    waitForPendingWorkspaceStateClear,
  };
}

const workspaceStateClearCoordinator = createWorkspaceStateClearCoordinator(clearSandboxWorkspace);

export const clearPersistedWorkspaceState =
  workspaceStateClearCoordinator.clearPersistedWorkspaceState;

export const waitForPendingWorkspaceStateClear =
  workspaceStateClearCoordinator.waitForPendingWorkspaceStateClear;
