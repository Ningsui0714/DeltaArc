import assert from 'node:assert/strict';
import test from 'node:test';
import {
  currentWorkspaceStorageEpoch,
  ensureCurrentWorkspaceStorageEpoch,
} from './workspaceStorage';

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  constructor(initialEntries: Record<string, string> = {}) {
    Object.entries(initialEntries).forEach(([key, value]) => {
      this.store.set(key, value);
    });
  }

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');

function installWindow(localStorage: Storage) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage },
  });
}

function restoreWindow() {
  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', originalWindowDescriptor);
    return;
  }

  Reflect.deleteProperty(globalThis, 'window');
}

test('workspace storage epoch clears legacy project and evidence drafts once', () => {
  const localStorage = new MemoryStorage({
    'wind-tunnel-workspace': 'workspace_legacy',
    'wind-tunnel-project': '{"name":"legacy"}',
    'wind-tunnel-project:workspace_legacy': '{"name":"legacy"}',
    'wind-tunnel-evidence': '[]',
    'wind-tunnel-evidence:workspace_legacy': '[]',
    'wind-tunnel-ui-language': 'en',
  });

  installWindow(localStorage);

  try {
    ensureCurrentWorkspaceStorageEpoch();

    assert.equal(localStorage.getItem('wind-tunnel-workspace'), null);
    assert.equal(localStorage.getItem('wind-tunnel-project'), null);
    assert.equal(localStorage.getItem('wind-tunnel-project:workspace_legacy'), null);
    assert.equal(localStorage.getItem('wind-tunnel-evidence'), null);
    assert.equal(localStorage.getItem('wind-tunnel-evidence:workspace_legacy'), null);
    assert.equal(localStorage.getItem('wind-tunnel-ui-language'), 'en');
    assert.equal(
      localStorage.getItem('wind-tunnel-storage-epoch'),
      currentWorkspaceStorageEpoch,
    );
  } finally {
    restoreWindow();
  }
});

test('workspace storage epoch does not clear current drafts after it has been applied', () => {
  const localStorage = new MemoryStorage({
    'wind-tunnel-storage-epoch': currentWorkspaceStorageEpoch,
    'wind-tunnel-workspace': 'workspace_current',
    'wind-tunnel-project:workspace_current': '{"name":"current"}',
    'wind-tunnel-evidence:workspace_current': '[]',
  });

  installWindow(localStorage);

  try {
    ensureCurrentWorkspaceStorageEpoch();

    assert.equal(localStorage.getItem('wind-tunnel-workspace'), 'workspace_current');
    assert.equal(
      localStorage.getItem('wind-tunnel-project:workspace_current'),
      '{"name":"current"}',
    );
    assert.equal(localStorage.getItem('wind-tunnel-evidence:workspace_current'), '[]');
  } finally {
    restoreWindow();
  }
});
