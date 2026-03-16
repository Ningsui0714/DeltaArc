const storageEpochKey = 'wind-tunnel-storage-epoch';

// Early prototype drafts were persisting forever, so this epoch forces one clean reset.
export const currentWorkspaceStorageEpoch = 'workspace-reset-20260315';

function clearKeysByPrefix(prefix: string) {
  const storage = window.localStorage;

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);

    if (key?.startsWith(prefix)) {
      storage.removeItem(key);
    }
  }
}

export function ensureCurrentWorkspaceStorageEpoch() {
  if (typeof window === 'undefined') {
    return;
  }

  const storage = window.localStorage;

  if (storage.getItem(storageEpochKey) === currentWorkspaceStorageEpoch) {
    return;
  }

  storage.removeItem('wind-tunnel-workspace');
  clearKeysByPrefix('wind-tunnel-project');
  clearKeysByPrefix('wind-tunnel-evidence');
  storage.setItem(storageEpochKey, currentWorkspaceStorageEpoch);
}
