import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createProjectUpdateAction,
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
