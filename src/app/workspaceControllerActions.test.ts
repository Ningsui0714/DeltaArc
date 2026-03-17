import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createProjectUpdateAction,
  createRefreshAnalysisAction,
  createWorkspaceStateClearCoordinator,
  shouldResetWorkspaceStateAfterProjectEdit,
  shouldResetWorkspaceStateAfterProjectImport,
} from './workspaceControllerActions';
import type { ProjectSnapshot } from '../types';

function createProjectFixture(): ProjectSnapshot {
  return {
    name: '异环',
    mode: 'Validation',
    genre: '都市开放世界二次元动作 RPG',
    platforms: ['PC', 'iOS', 'Android'],
    targetPlayers: ['二次元开放世界玩家'],
    coreFantasy: '在超自然都市里驾驶穿行并处理异象委托。',
    ideaSummary: '验证都市开放世界题材能否稳定留存。',
    coreLoop: '探索 -> 驾驶 -> 委托 -> 战斗',
    sessionLength: '20-40 分钟',
    differentiators: '现代都市 + 驾驶 + 异象',
    progressionHook: '角色与城市事件双线推进',
    socialHook: '截图、驾驶片段与异象高光传播',
    monetization: '后续再验证商业化',
    referenceGames: ['绝区零'],
    validationGoal: '把热度转成留存与持续讨论',
    productionConstraints: '高规格开放世界制作压力大',
    currentStatus: '前期热度高但留存未验证',
  };
}

test('project imports with a project snapshot reset previous workspace outputs', () => {
  assert.equal(
    shouldResetWorkspaceStateAfterProjectImport({
      project: {
        name: '异环',
        mode: 'Live',
        genre: '都市开放世界二次元动作 RPG',
        platforms: ['PC'],
        targetPlayers: ['内容传播型玩家'],
        coreFantasy: '在超自然都市里驾驶穿行并处理异象委托。',
        ideaSummary: '验证都市开放世界题材能否稳定留存。',
        coreLoop: '探索 -> 驾驶 -> 委托 -> 战斗',
        sessionLength: '20-40 分钟',
        differentiators: '现代都市 + 驾驶 + 异象',
        progressionHook: '角色与城市事件双线推进',
        socialHook: '截图、驾驶片段与异象高光传播',
        monetization: '后续再验证商业化',
        referenceGames: ['绝区零'],
        validationGoal: '把热度转成留存与持续讨论',
        productionConstraints: '高规格开放世界制作压力大',
        currentStatus: '前期热度高但留存未验证',
      },
      evidenceMode: 'append',
      evidenceItems: [],
      warnings: [],
    }),
    true,
  );
});

test('replace-mode project imports reset previous workspace outputs even without a project snapshot', () => {
  assert.equal(
    shouldResetWorkspaceStateAfterProjectImport({
      evidenceMode: 'replace',
      evidenceItems: [],
      warnings: [],
    }),
    true,
  );
});

test('append-only imports keep the current workspace outputs until the user reruns analysis', () => {
  assert.equal(
    shouldResetWorkspaceStateAfterProjectImport({
      evidenceMode: 'append',
      evidenceItems: [],
      warnings: [],
    }),
    false,
  );
});

test('project edits that change the draft reset downstream workspace state', () => {
  assert.equal(
    shouldResetWorkspaceStateAfterProjectEdit(createProjectFixture(), {
      ideaSummary: '验证都市开放世界题材是否还能撑住第二周留存。',
    }),
    true,
  );
});

test('project edits that keep the same value do not reset downstream workspace state', () => {
  const project = createProjectFixture();

  assert.equal(
    shouldResetWorkspaceStateAfterProjectEdit(project, {
      ideaSummary: project.ideaSummary,
      platforms: [...project.platforms],
    }),
    false,
  );
});

test('project update action clears later stages when the draft changes', () => {
  const calls: string[] = [];
  const project = createProjectFixture();
  const updateProject = createProjectUpdateAction({
    workspaceId: 'workspace_fixture',
    project,
    clearPersistedWorkspaceState: () => {
      calls.push('clearPersistedWorkspaceState');
    },
    updateProject: () => {
      calls.push('updateProject');
    },
    resetAnalysisState: () => {
      calls.push('resetAnalysisState');
    },
    resetBaselines: () => {
      calls.push('resetBaselines');
    },
    setActivePhase: () => {
      calls.push('setActivePhase');
    },
    setActiveOutputStep: () => {
      calls.push('setActiveOutputStep');
    },
  });

  updateProject({
    currentStatus: '改成验证首发留存和内容密度是否匹配。',
  });

  assert.deepEqual(calls, [
    'clearPersistedWorkspaceState',
    'resetAnalysisState',
    'resetBaselines',
    'setActivePhase',
    'setActiveOutputStep',
    'updateProject',
  ]);
});

test('project update action skips downstream reset for no-op patches', () => {
  const calls: string[] = [];
  const project = createProjectFixture();
  const updateProject = createProjectUpdateAction({
    workspaceId: 'workspace_fixture',
    project,
    clearPersistedWorkspaceState: () => {
      calls.push('clearPersistedWorkspaceState');
    },
    updateProject: () => {
      calls.push('updateProject');
    },
    resetAnalysisState: () => {
      calls.push('resetAnalysisState');
    },
    resetBaselines: () => {
      calls.push('resetBaselines');
    },
    setActivePhase: () => {
      calls.push('setActivePhase');
    },
    setActiveOutputStep: () => {
      calls.push('setActiveOutputStep');
    },
  });

  updateProject({
    ideaSummary: project.ideaSummary,
  });

  assert.deepEqual(calls, ['updateProject']);
});

test('workspace clear coordinator serializes clears for the same workspace', async () => {
  const calls: string[] = [];
  const releases = new Map<number, () => void>();
  let invocation = 0;

  const { clearPersistedWorkspaceState, waitForPendingWorkspaceStateClear } =
    createWorkspaceStateClearCoordinator(async () => {
      const currentInvocation = ++invocation;
      calls.push(`start:${currentInvocation}`);

      await new Promise<void>((resolve) => {
        releases.set(currentInvocation, () => {
          calls.push(`release:${currentInvocation}`);
          resolve();
        });
      });

      calls.push(`end:${currentInvocation}`);
    });

  const firstClear = clearPersistedWorkspaceState('workspace_fixture');
  const secondClear = clearPersistedWorkspaceState('workspace_fixture');
  let waitResolved = false;
  const waitForClear = waitForPendingWorkspaceStateClear('workspace_fixture').then(() => {
    waitResolved = true;
    calls.push('wait:done');
  });

  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual([...calls], ['start:1']);
  assert.equal(waitResolved, false);

  releases.get(1)?.();
  for (let attempt = 0; attempt < 5 && !releases.has(2); attempt += 1) {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
  assert.equal(releases.has(2), true);
  assert.deepEqual([...calls], ['start:1', 'release:1', 'end:1', 'start:2']);
  assert.equal(waitResolved, false);

  releases.get(2)?.();
  await Promise.all([firstClear, secondClear, waitForClear]);

  assert.deepEqual([...calls], [
    'start:1',
    'release:1',
    'end:1',
    'start:2',
    'release:2',
    'end:2',
    'wait:done',
  ]);
});

test('analysis refresh waits for pending workspace clears before starting a new run', async () => {
  const calls: string[] = [];
  let releaseClear!: () => void;

  const refreshAnalysis = createRefreshAnalysisAction({
    workspaceId: 'workspace_fixture',
    canRunAnalysis: true,
    setActivePhase: () => {
      calls.push('setActivePhase');
    },
    waitForPendingWorkspaceStateClear: async () => {
      calls.push('waitForClear');
      await new Promise<void>((resolve) => {
        releaseClear = () => {
          calls.push('releaseClear');
          resolve();
        };
      });
      calls.push('clearFinished');
    },
    runAnalysis: async () => {
      calls.push('runAnalysis');
      return { ok: true };
    },
    navigate: () => {
      calls.push('navigate');
    },
  });

  const refreshPromise = refreshAnalysis('balanced', 'report');
  await Promise.resolve();

  assert.deepEqual(calls, ['setActivePhase', 'waitForClear']);

  releaseClear();
  await refreshPromise;

  assert.deepEqual(calls, [
    'setActivePhase',
    'waitForClear',
    'releaseClear',
    'clearFinished',
    'runAnalysis',
    'navigate',
  ]);
});
