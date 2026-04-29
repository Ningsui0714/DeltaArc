import assert from 'node:assert/strict';
import test from 'node:test';
import type { ProjectSnapshot } from '../types';
import { createOverviewPageViewModel } from './overviewPageViewModel';

function createProject(overrides: Partial<ProjectSnapshot> = {}): ProjectSnapshot {
  return {
    name: '测试项目',
    mode: 'Concept',
    genre: 'coop',
    platforms: ['PC'],
    targetPlayers: ['friends'],
    coreFantasy: '一起过机关',
    ideaSummary: '验证双人协作机关',
    coreLoop: '探索-配合-结算',
    sessionLength: '20min',
    differentiators: '双人协作',
    progressionHook: '逐步解锁',
    socialHook: '组队分享',
    monetization: 'cosmetic',
    referenceGames: ['It Takes Two'],
    validationGoal: '验证合作高光',
    productionConstraints: '两人关卡有限',
    currentStatus: '验证中',
    ...overrides,
  };
}

test('createOverviewPageViewModel guides intake before inference is unlocked', () => {
  const viewModel = createOverviewPageViewModel({
    language: 'en',
    project: createProject({
      coreLoop: '',
      coreFantasy: '',
      ideaSummary: '',
      validationGoal: '',
      currentStatus: '',
      targetPlayers: [],
    }),
    evidenceCount: 1,
    hasViewableAnalysis: false,
    isAnalysisFresh: false,
    isAnalysisStale: false,
    isAnalysisDegraded: false,
  });

  assert.equal(
    viewModel.hero.title,
    'Start from a blank brief and define the campaign goal for this round.',
  );
  assert.equal(viewModel.launchpad.steps[0]?.status, 'current');
  assert.equal(viewModel.launchpad.steps[1]?.status, 'upcoming');
  assert.equal(
    viewModel.runStatus.copy,
    'Fill the 4/4 minimum setup and 3 evidence items first, then go to the Diagnosis Desk to run Quick Diagnosis.',
  );
  assert.equal(viewModel.metrics[2]?.value, 'Locked');
});

test('createOverviewPageViewModel marks stale outputs as viewable but needing rerun', () => {
  const viewModel = createOverviewPageViewModel({
    language: 'zh',
    project: createProject(),
    evidenceCount: 4,
    hasViewableAnalysis: true,
    isAnalysisFresh: false,
    isAnalysisStale: true,
    isAnalysisDegraded: false,
  });

  assert.equal(viewModel.runStatus.title, '上一份策略结果仍可继续查看');
  assert.equal(
    viewModel.runStatus.bullets[0],
    '当前可见结果已经过期，因为当前输入与上次正式诊断时不再一致。',
  );
  assert.equal(viewModel.metrics[2]?.value, '过期');
  assert.equal(viewModel.launchpad.steps[2]?.metric, '已有旧策略结果，建议重跑');
  assert.equal(viewModel.launchpad.steps[3]?.actionLabel, '打开输出区');
});

test('createOverviewPageViewModel keeps fresh outputs ready to open', () => {
  const viewModel = createOverviewPageViewModel({
    language: 'en',
    project: createProject(),
    evidenceCount: 5,
    hasViewableAnalysis: true,
    isAnalysisFresh: true,
    isAnalysisStale: false,
    isAnalysisDegraded: false,
  });

  assert.equal(viewModel.launchpad.steps[2]?.status, 'done');
  assert.equal(viewModel.launchpad.steps[3]?.status, 'current');
  assert.equal(viewModel.launchpad.steps[3]?.actionStep, 'modeling');
  assert.equal(viewModel.metrics[2]?.tone, 'good');
  assert.equal(viewModel.timeline.steps[2]?.title, 'Run Quick Diagnosis first');
});
