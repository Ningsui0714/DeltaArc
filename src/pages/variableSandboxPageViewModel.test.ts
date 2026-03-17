import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  FrozenBaseline,
  VariableImpactScanJob,
  VariableImpactScanResult,
} from '../../shared/variableSandbox';
import { createVariableSandboxPageViewModel } from './variableSandboxPageViewModel';

function createBaseline(): FrozenBaseline {
  return {
    id: 'baseline_001',
    projectId: 'workspace_001',
    createdAt: '2026-03-16T09:00:00.000Z',
    sourceAnalysisRequestId: 'analysis_001',
    sourceAnalysisMode: 'balanced',
    sourceAnalysisGeneratedAt: '2026-03-16T08:50:00.000Z',
    sourceAnalysisStatus: 'fresh',
    projectSnapshot: {
      name: '测试项目',
      mode: 'Concept',
      genre: 'coop',
      platforms: ['PC'],
      targetPlayers: ['friends'],
      coreFantasy: '一起过机关',
      ideaSummary: '加一个协作机关',
      coreLoop: '探索-配合-结算',
      sessionLength: '20min',
      differentiators: '强协作',
      progressionHook: '逐步解锁',
      socialHook: '组队分享',
      monetization: 'cosmetic',
      referenceGames: ['It Takes Two'],
      validationGoal: '验证合作高光',
      productionConstraints: '两人关卡有限',
      currentStatus: '验证中',
    },
    evidenceSnapshot: [],
    analysisSnapshot: {
      summary: '基线摘要',
      systemVerdict: '方向可试',
      evidenceLevel: 'medium',
      primaryRisk: '教学可能不够',
      nextStep: '先做纸面原型',
      scores: {
        coreFun: 70,
        learningCost: 45,
        novelty: 68,
        acceptanceRisk: 40,
        prototypeCost: 35,
      },
      personas: [],
      hypotheses: [],
      perspectives: [],
      blindSpots: [],
      validationTracks: [],
      warnings: [],
    },
  };
}

function createRunningScanJob(): VariableImpactScanJob {
  return {
    id: 'scan_001',
    workspaceId: 'workspace_001',
    baselineId: 'baseline_001',
    variableId: 'variable_001',
    mode: 'balanced',
    status: 'running',
    currentStageKey: 'impact_scan',
    currentStageLabel: '影响扫描',
    message: '正在评估直接影响',
    createdAt: '2026-03-16T09:10:00.000Z',
    updatedAt: '2026-03-16T09:10:30.000Z',
    stages: [
      {
        key: 'queued',
        label: '排队中',
        detail: '等待开始',
        status: 'completed',
      },
      {
        key: 'baseline_read',
        label: '读取基线',
        detail: '整理正式结果',
        status: 'completed',
      },
      {
        key: 'impact_scan',
        label: '影响扫描',
        detail: '判断直接影响',
        status: 'running',
      },
      {
        key: 'complete',
        label: '完成',
        detail: '输出结果',
        status: 'pending',
      },
    ],
  };
}

function createScanResult(): VariableImpactScanResult {
  return {
    summary: '会提高合作高光，但会抬升教学压力。',
    baselineRead: {
      summary: '基线判断',
      evidenceLevel: 'medium',
      primaryRisk: '教学不清晰',
      scores: {
        coreFun: 70,
        learningCost: 45,
        novelty: 68,
        acceptanceRisk: 40,
        prototypeCost: 35,
      },
    },
    impactScan: [],
    affectedPersonas: [],
    guardrails: [],
    validationPlan: [],
    assumptions: [],
    warnings: [],
    confidence: 0.66,
    evidenceLevel: 'medium',
  };
}

test('createVariableSandboxPageViewModel shows stale guidance before the first baseline', () => {
  const viewModel = createVariableSandboxPageViewModel({
    language: 'zh',
    reportSummary: '正式结果摘要',
    baselines: [],
    baselineStatus: 'idle',
    baselineError: null,
    canFreezeBaseline: false,
    freezeBaselineSourceStatus: 'stale',
    variableName: '',
    canRunImpactScan: false,
    scanJob: null,
    scanResult: null,
    scanStatus: 'idle',
  });

  assert.equal(
    viewModel.baseline.title,
    '需要一份当前最新远端结果，才能冻结第一份基线',
  );
  assert.equal(
    viewModel.flow.items[0]?.detail,
    '当前可见结果已经过期，先重跑正式推演，再冻结新的基线。',
  );
  assert.equal(
    viewModel.baseline.bullets[0],
    '当前可见结果已过期，必须先拿到更新的远端结果才能冻结。',
  );
});

test('createVariableSandboxPageViewModel marks the idea ready and surfaces the running stage', () => {
  const viewModel = createVariableSandboxPageViewModel({
    language: 'en',
    reportSummary: 'Formal result summary.',
    baselines: [createBaseline()],
    baselineStatus: 'saving',
    baselineError: 'Freeze is pending.',
    canFreezeBaseline: true,
    freezeBaselineSourceStatus: 'fresh',
    variableName: 'Timed co-op gate',
    canRunImpactScan: true,
    scanJob: createRunningScanJob(),
    scanResult: null,
    scanStatus: 'loading',
  });

  assert.equal(viewModel.flow.items[1]?.state, 'done');
  assert.equal(viewModel.flow.items[1]?.detail, 'Idea ready: Timed co-op gate');
  assert.equal(viewModel.flow.items[2]?.detail, '影响扫描');
  assert.equal(viewModel.baseline.freezeButtonLabel, 'Freezing Baseline');
  assert.equal(
    viewModel.baseline.bullets[viewModel.baseline.bullets.length - 1],
    'Freeze is pending.',
  );
});

test('createVariableSandboxPageViewModel shows the finished summary after a scan completes', () => {
  const viewModel = createVariableSandboxPageViewModel({
    language: 'zh',
    reportSummary: '正式结果摘要',
    baselines: [createBaseline()],
    baselineStatus: 'idle',
    baselineError: null,
    canFreezeBaseline: true,
    freezeBaselineSourceStatus: 'degraded',
    variableName: '双人限时机关',
    canRunImpactScan: true,
    scanJob: createRunningScanJob(),
    scanResult: createScanResult(),
    scanStatus: 'idle',
  });

  assert.equal(viewModel.flow.items[2]?.state, 'done');
  assert.equal(viewModel.flow.items[3]?.state, 'done');
  assert.equal(
    viewModel.flow.items[3]?.detail,
    '会提高合作高光，但会抬升教学压力。',
  );
});
