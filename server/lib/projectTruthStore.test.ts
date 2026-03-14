import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { EvidenceItem, ProjectSnapshot } from '../../shared/domain';
import type { SandboxAnalysisResult } from '../../shared/sandbox';
import type {
  DesignVariableV1,
  VariableImpactScanResult,
} from '../../shared/variableSandbox';
import { buildPersistedVariableImpactScanJob } from './impactScanJobStore';
import { createProjectTruthStore } from './projectTruthStore';

function createProject(): ProjectSnapshot {
  return {
    name: '代号：远岸旅团',
    mode: 'Concept',
    genre: '合作生存建造',
    platforms: ['PC'],
    targetPlayers: ['轻中度合作生存玩家'],
    coreFantasy: '和朋友临场补位救回一局快要崩盘的危机。',
    ideaSummary: '验证双人协作机关是否能提升中期留存。',
    coreLoop: '探索 -> 收集 -> 建造 -> 协作机关 -> 防守',
    sessionLength: '15-20 分钟',
    differentiators: '高频高压的合作高光。',
    progressionHook: '局内外双层成长。',
    socialHook: '双人同步操作与补位空间并存。',
    monetization: '当前阶段不验证付费。',
    referenceGames: ['双人成行'],
    validationGoal: '确认首局 10 分钟内是否能稳定出现高光。',
    productionConstraints: '2 人团队，2 周原型窗口。',
    currentStatus: '担心学习成本会掩盖合作乐趣。',
  };
}

function createEvidence(): EvidenceItem[] {
  return [
    {
      id: 'evi_demo_001',
      type: 'interview',
      title: '轻协作玩家反馈',
      source: 'Discord 访谈',
      trust: 'high',
      summary: '玩家愿意合作解谜，但要求失败后能迅速重试。',
      createdAt: '09:00',
    },
  ];
}

function createAnalysis(
  status: 'fresh' | 'degraded' = 'fresh',
  options?: {
    mode?: SandboxAnalysisResult['mode'];
    requestId?: string;
    generatedAt?: string;
  },
): SandboxAnalysisResult {
  const mode = options?.mode ?? 'balanced';
  const requestId = options?.requestId ?? `analysis_${status}`;
  const generatedAt = options?.generatedAt ?? '2026-03-14T08:58:00.000Z';

  return {
    generatedAt,
    mode,
    model: 'fixture-model',
    pipeline: ['dossier@fixture-model', 'synthesis@fixture-model'],
    meta: {
      source: 'remote',
      status,
      requestId,
    },
    summary: '双人协作机关有机会制造中期记忆点。',
    systemVerdict: '值得做单局原型。',
    evidenceLevel: 'medium',
    primaryRisk: '等待队友会把轻度玩家挤出局。',
    nextStep: '先做 15 分钟短局原型。',
    playerAcceptance: 68,
    confidence: 64,
    supportRatio: 62,
    scores: {
      coreFun: 72,
      learningCost: 58,
      novelty: 70,
      acceptanceRisk: 61,
      prototypeCost: 54,
    },
    personas: [],
    hypotheses: [],
    strategies: [],
    perspectives: [],
    blindSpots: [],
    secondOrderEffects: [],
    scenarioVariants: [],
    futureTimeline: [],
    communityRhythms: [],
    trajectorySignals: [],
    decisionLenses: [],
    validationTracks: [],
    contrarianMoves: [],
    unknowns: [],
    redTeam: {
      thesis: '失败惩罚可能会压过合作乐趣。',
      attackVectors: [],
      failureModes: [],
      mitigation: '先缩小原型边界。',
    },
    memorySignals: [],
    report: {
      headline: '值得做短局原型。',
      summary: '合作高光有潜力，但等待感要先压住。',
      conclusion: '继续做，但要优先补失败恢复。',
      whyNow: '当前最缺的是可玩样本。',
      risk: '等待队友的成本会被快速放大。',
      actions: ['做 15 分钟短局原型'],
    },
    warnings: [],
  };
}

function createVariable(): DesignVariableV1 {
  return {
    id: 'var_demo_001',
    baselineId: 'baseline_demo_001',
    name: '双人协作机关',
    category: 'gameplay',
    intent: '提升中期合作高光',
    changeStatement: '加入必须双人配合才能通过的限时机关',
    injectionTargets: ['core_loop', 'player_cooperation'],
    expectedBenefits: ['合作记忆点更强'],
    knownCosts: ['等待队友时会放大挫败'],
    activationStage: 'mid',
    dependencies: ['补单人补位机制'],
    successSignals: ['玩家主动复述合作瞬间'],
    failureSignals: ['玩家抱怨必须等人'],
  };
}

function createImpactScanResult(): VariableImpactScanResult {
  return {
    summary: '变量会先放大合作高光，也会先放大等待队友的挫败。',
    baselineRead: {
      summary: '当前基线的合作乐趣成立，但单人补位偏弱。',
      evidenceLevel: 'medium',
      primaryRisk: '等待队友会把轻度玩家挤出局。',
      scores: {
        coreFun: 72,
        learningCost: 58,
        novelty: 70,
        acceptanceRisk: 61,
        prototypeCost: 54,
      },
    },
    impactScan: [
      {
        target: 'core_loop',
        directEffect: '双人同步节点会把高光集中到中期推进。',
        upside: '可复述的合作记忆点更强。',
        downside: '单人补位失败时会迅速放大等待感。',
        confidence: 78,
      },
    ],
    affectedPersonas: [
      {
        personaName: '轻协作玩家',
        likelyReaction: '会喜欢成功配合，但对被迫等待非常敏感。',
        primaryTrigger: '失败后能否迅速重试。',
        riskLevel: 'medium',
      },
    ],
    guardrails: [
      {
        title: '先压住等待感',
        reason: '先把等待队友的挫败压下来，再放大合作收益。',
        priority: 'P0',
      },
    ],
    validationPlan: [
      {
        step: '做 15 分钟短局原型',
        goal: '验证首局 10 分钟内是否会出现可复述高光。',
        successSignal: '玩家愿意主动复述协作瞬间。',
        failureSignal: '玩家把讨论焦点放在等待与失误惩罚上。',
      },
    ],
    assumptions: ['玩家能在首局内快速理解双人机关的目标。'],
    warnings: [],
    confidence: 71,
    evidenceLevel: 'medium',
  };
}

test('project truth store persists and reloads the latest analysis', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'wind-tunnel-project-truth-'));
  const store = createProjectTruthStore(tempDir);

  try {
    await store.persistLatestAnalysis({
      workspaceId: 'workspace_demo_001',
      runStartedAt: '2026-03-14T08:57:00.000Z',
      analysisJobId: 'job_demo_001',
      projectSnapshot: createProject(),
      evidenceSnapshot: createEvidence(),
      analysis: createAnalysis(),
    });

    const reloaded = await store.loadLatestAnalysis('workspace_demo_001');

    assert.equal(reloaded?.workspaceId, 'workspace_demo_001');
    assert.equal(reloaded?.analysis.meta.requestId, 'analysis_fresh');
    assert.equal(reloaded?.evidenceSnapshot.length, 1);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('project truth store freezes baselines from persisted latest analysis', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'wind-tunnel-project-truth-'));
  const store = createProjectTruthStore(tempDir);

  try {
    await store.persistLatestAnalysis({
      workspaceId: 'workspace_demo_001',
      runStartedAt: '2026-03-14T08:57:00.000Z',
      analysisJobId: 'job_demo_001',
      projectSnapshot: createProject(),
      evidenceSnapshot: createEvidence(),
      analysis: createAnalysis(),
    });

    const baseline = await store.freezeLatestBaseline('workspace_demo_001');
    const baselines = await store.listBaselines('workspace_demo_001');
    const reloaded = await store.loadBaseline('workspace_demo_001', baseline.id);

    assert.equal(baseline.projectId, 'workspace_demo_001');
    assert.equal(baseline.sourceAnalysisStatus, 'fresh');
    assert.equal(baselines.length, 1);
    assert.equal(reloaded?.id, baseline.id);
    assert.equal(reloaded?.analysisSnapshot.summary, '双人协作机关有机会制造中期记忆点。');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('project truth store rejects freezing degraded latest analysis snapshots', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'wind-tunnel-project-truth-'));
  const store = createProjectTruthStore(tempDir);

  try {
    await store.persistLatestAnalysis({
      workspaceId: 'workspace_demo_001',
      runStartedAt: '2026-03-14T08:57:00.000Z',
      analysisJobId: 'job_demo_001',
      projectSnapshot: createProject(),
      evidenceSnapshot: createEvidence(),
      analysis: createAnalysis('degraded'),
    });

    await assert.rejects(
      () => store.freezeLatestBaseline('workspace_demo_001'),
      /fresh latest analysis can be frozen as a baseline/i,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('project truth store persists variables and impact scan results', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'wind-tunnel-project-truth-'));
  const store = createProjectTruthStore(tempDir);
  const variable = createVariable();
  const result = createImpactScanResult();

  try {
    await store.persistVariable('workspace_demo_001', variable);
    await store.persistImpactScan({
      workspaceId: 'workspace_demo_001',
      scanId: 'impact_scan_demo_001',
      baselineId: 'baseline_demo_001',
      mode: 'balanced',
      variable,
      result,
    });

    const reloadedVariable = await store.loadVariable('workspace_demo_001', variable.id);
    const reloadedResult = await store.loadImpactScanResult(
      'workspace_demo_001',
      'impact_scan_demo_001',
    );
    const rebuiltJob = reloadedResult
      ? buildPersistedVariableImpactScanJob(reloadedResult)
      : null;

    assert.equal(reloadedVariable?.name, '双人协作机关');
    assert.equal(reloadedResult?.variable.id, 'var_demo_001');
    assert.equal(reloadedResult?.result.guardrails[0]?.priority, 'P0');
    assert.equal(rebuiltJob?.status, 'completed');
    assert.equal(rebuiltJob?.result?.summary, result.summary);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('project truth store lists persisted impact scans in reverse chronological order', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'wind-tunnel-project-truth-'));
  const store = createProjectTruthStore(tempDir);
  const variable = createVariable();
  const result = createImpactScanResult();

  try {
    await store.persistImpactScan({
      workspaceId: 'workspace_demo_001',
      scanId: 'impact_scan_demo_older',
      baselineId: 'baseline_demo_001',
      mode: 'balanced',
      variable,
      result,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    await store.persistImpactScan({
      workspaceId: 'workspace_demo_001',
      scanId: 'impact_scan_demo_newer',
      baselineId: 'baseline_demo_001',
      mode: 'reasoning',
      variable: {
        ...variable,
        id: 'var_demo_002',
        name: '协作补位按钮',
      },
      result: {
        ...result,
        summary: '新的变量结果',
      },
    });

    await store.persistImpactScan({
      workspaceId: 'workspace_demo_001',
      scanId: 'impact_scan_demo_other_baseline',
      baselineId: 'baseline_demo_002',
      mode: 'balanced',
      variable: {
        ...variable,
        id: 'var_demo_003',
        baselineId: 'baseline_demo_002',
      },
      result,
    });

    const allScans = await store.listImpactScanResults('workspace_demo_001');
    const baselineScans = await store.listImpactScanResults('workspace_demo_001', {
      baselineId: 'baseline_demo_001',
    });

    assert.deepEqual(
      allScans.map((scan) => scan.id),
      [
        'impact_scan_demo_other_baseline',
        'impact_scan_demo_newer',
        'impact_scan_demo_older',
      ],
    );
    assert.deepEqual(
      baselineScans.map((scan) => scan.id),
      ['impact_scan_demo_newer', 'impact_scan_demo_older'],
    );
    assert.equal(baselineScans[0]?.variable.name, '协作补位按钮');
    assert.equal(buildPersistedVariableImpactScanJob(baselineScans[0]).variable?.id, 'var_demo_002');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('project truth store keeps the newer run as latest when an older run finishes later', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'wind-tunnel-project-truth-'));
  const store = createProjectTruthStore(tempDir);

  try {
    await store.persistLatestAnalysis({
      workspaceId: 'workspace_demo_001',
      runStartedAt: '2026-03-14T09:05:00.000Z',
      analysisJobId: 'job_newer_001',
      projectSnapshot: createProject(),
      evidenceSnapshot: createEvidence(),
      analysis: createAnalysis('fresh', {
        mode: 'reasoning',
        requestId: 'analysis_newer',
        generatedAt: '2026-03-14T09:10:00.000Z',
      }),
    });

    const lateOlderWrite = await store.persistLatestAnalysis({
      workspaceId: 'workspace_demo_001',
      runStartedAt: '2026-03-14T09:00:00.000Z',
      analysisJobId: 'job_older_001',
      projectSnapshot: createProject(),
      evidenceSnapshot: createEvidence(),
      analysis: createAnalysis('fresh', {
        mode: 'balanced',
        requestId: 'analysis_older',
        generatedAt: '2026-03-14T09:12:00.000Z',
      }),
    });

    const latest = await store.loadLatestAnalysis('workspace_demo_001');
    const baseline = await store.freezeLatestBaseline('workspace_demo_001');

    assert.equal(lateOlderWrite.persisted, false);
    assert.equal(latest?.analysis.meta.requestId, 'analysis_newer');
    assert.equal(latest?.analysis.mode, 'reasoning');
    assert.equal(baseline.sourceAnalysisRequestId, 'analysis_newer');
    assert.equal(baseline.sourceAnalysisMode, 'reasoning');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('project truth store can clear one workspace without leaving persisted artifacts behind', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'wind-tunnel-project-truth-'));
  const store = createProjectTruthStore(tempDir);
  const variable = createVariable();
  const result = createImpactScanResult();

  try {
    await store.persistLatestAnalysis({
      workspaceId: 'workspace_demo_001',
      runStartedAt: '2026-03-14T08:57:00.000Z',
      analysisJobId: 'job_demo_001',
      projectSnapshot: createProject(),
      evidenceSnapshot: createEvidence(),
      analysis: createAnalysis(),
    });
    const baseline = await store.freezeLatestBaseline('workspace_demo_001');
    await store.persistVariable('workspace_demo_001', variable);
    await store.persistImpactScan({
      workspaceId: 'workspace_demo_001',
      scanId: 'impact_scan_demo_001',
      baselineId: baseline.id,
      mode: 'balanced',
      variable: {
        ...variable,
        baselineId: baseline.id,
      },
      result,
    });

    await store.clearWorkspace('workspace_demo_001');

    const latest = await store.loadLatestAnalysis('workspace_demo_001');
    const baselines = await store.listBaselines('workspace_demo_001');
    const reloadedVariable = await store.loadVariable('workspace_demo_001', variable.id);
    const impactScan = await store.loadImpactScanResult('workspace_demo_001', 'impact_scan_demo_001');

    assert.equal(latest, null);
    assert.equal(baselines.length, 0);
    assert.equal(reloadedVariable, null);
    assert.equal(impactScan, null);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
