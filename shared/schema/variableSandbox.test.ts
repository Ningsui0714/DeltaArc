import assert from 'node:assert/strict';
import test from 'node:test';
import { SchemaError } from './common';
import {
  parsePersistedLatestAnalysis,
  parseCreateFrozenBaselineRequest,
  parseDesignVariableV1,
  parseFrozenBaseline,
  parseVariableImpactScanJob,
  parseVariableImpactScanRequest,
  parseVariableImpactScanResult,
} from './variableSandbox';
import { createWorkspaceInputSignature } from '../variableSandbox';

test('parseCreateFrozenBaselineRequest accepts a fresh remote analysis payload', () => {
  const request = parseCreateFrozenBaselineRequest({
    project: {
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
      currentStatus: '担心学习成本会掩盖合作乐趣。'
    },
    evidenceItems: [],
    analysis: {
      generatedAt: '2026-03-14T08:58:00.000Z',
      mode: 'balanced',
      model: 'fixture-model',
      pipeline: ['dossier@fixture-model'],
      meta: {
        source: 'remote',
        status: 'fresh',
        requestId: 'analysis_fixture_001'
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
        prototypeCost: 54
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
        mitigation: '先缩小原型边界。'
      },
      memorySignals: [],
      report: {
        headline: '值得做短局原型。',
        summary: '合作高光有潜力，但等待感要先压住。',
        conclusion: '继续做，但要优先补失败恢复。',
        whyNow: '当前最缺的是可玩样本。',
        risk: '等待队友的成本会被快速放大。',
        actions: ['做 15 分钟短局原型']
      },
      warnings: []
    }
  });

  assert.equal(request.analysis.meta.source, 'remote');
  assert.equal(request.analysis.meta.status, 'fresh');
});

test('parseCreateFrozenBaselineRequest accepts a degraded remote analysis payload', () => {
  const request = parseCreateFrozenBaselineRequest({
    project: {
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
      currentStatus: '担心学习成本会掩盖合作乐趣。'
    },
    evidenceItems: [],
    analysis: {
      generatedAt: '2026-03-14T08:58:00.000Z',
      mode: 'balanced',
      model: 'fixture-model',
      pipeline: ['dossier@fixture-model'],
      meta: {
        source: 'remote',
        status: 'degraded',
        requestId: 'analysis_fixture_003'
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
        prototypeCost: 54
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
        mitigation: '先缩小原型边界。'
      },
      memorySignals: [],
      report: {
        headline: '值得做短局原型。',
        summary: '合作高光有潜力，但等待感要先压住。',
        conclusion: '继续做，但要优先补失败恢复。',
        whyNow: '当前最缺的是可玩样本。',
        risk: '等待队友的成本会被快速放大。',
        actions: ['做 15 分钟短局原型']
      },
      warnings: []
    }
  });

  assert.equal(request.analysis.meta.source, 'remote');
  assert.equal(request.analysis.meta.status, 'degraded');
});

test('parseFrozenBaseline accepts a valid baseline snapshot', () => {
  const baseline = parseFrozenBaseline({
    id: 'baseline_demo_001',
    projectId: 'project_demo_001',
    createdAt: '2026-03-14T09:00:00.000Z',
    sourceAnalysisRequestId: 'analysis_demo_001',
    sourceAnalysisMode: 'balanced',
    sourceAnalysisGeneratedAt: '2026-03-14T08:58:00.000Z',
    sourceAnalysisStatus: 'fresh',
    projectSnapshot: {
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
      currentStatus: '担心学习成本会掩盖合作乐趣。'
    },
    evidenceSnapshot: [
      {
        id: 'evi_demo_001',
        type: 'interview',
        title: '轻协作玩家反馈',
        source: 'Discord 访谈',
        trust: 'high',
        summary: '玩家愿意合作解谜，但要求失败后能迅速重试。'
      }
    ],
    analysisSnapshot: {
      summary: '双人协作机关有机会制造记忆点，但失败惩罚要收敛。',
      systemVerdict: '值得做单局原型，但必须先补单人补位和快速重开。',
      evidenceLevel: 'medium',
      primaryRisk: '等待队友会把轻度玩家挤出局。',
      nextStep: '先做 15 分钟短局原型，重点测失败反馈。',
      scores: {
        coreFun: 72,
        learningCost: 58,
        novelty: 70,
        acceptanceRisk: 61,
        prototypeCost: 54
      },
      personas: [],
      hypotheses: [],
      perspectives: [],
      blindSpots: [],
      validationTracks: [],
      warnings: ['当前样本量偏小。']
    }
  });

  assert.equal(baseline.id, 'baseline_demo_001');
  assert.equal(baseline.analysisSnapshot.evidenceLevel, 'medium');
  assert.equal(baseline.evidenceSnapshot.length, 1);
});

test('parseDesignVariableV1 rejects unsupported categories', () => {
  assert.throws(
    () =>
      parseDesignVariableV1({
        id: 'var_demo_001',
        baselineId: 'baseline_demo_001',
        name: '双人协作机关',
        category: 'core_gameplay',
        intent: '提升中期合作乐趣',
        changeStatement: '加入必须双人配合才能通过的限时机关',
        injectionTargets: ['core_loop'],
        expectedBenefits: ['合作记忆点更强'],
        knownCosts: ['学习成本提高'],
        activationStage: 'mid',
        dependencies: ['需要单人补位机制'],
        successSignals: ['玩家主动讨论合作解法'],
        failureSignals: ['玩家抱怨必须等人']
      }),
    SchemaError,
  );
});

test('parseCreateFrozenBaselineRequest rejects stale analysis payloads', () => {
  assert.throws(
    () =>
      parseCreateFrozenBaselineRequest({
        project: {
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
          currentStatus: '担心学习成本会掩盖合作乐趣。'
        },
        evidenceItems: [],
        analysis: {
          generatedAt: '2026-03-14T08:58:00.000Z',
          mode: 'balanced',
          model: 'fixture-model',
          pipeline: ['dossier@fixture-model'],
          meta: {
            source: 'remote',
            status: 'stale',
            requestId: 'analysis_fixture_002'
          },
          summary: '旧结果',
          systemVerdict: '旧结论',
          evidenceLevel: 'medium',
          primaryRisk: '旧风险',
          nextStep: '旧下一步',
          playerAcceptance: 60,
          confidence: 60,
          supportRatio: 60,
          scores: {
            coreFun: 60,
            learningCost: 60,
            novelty: 60,
            acceptanceRisk: 60,
            prototypeCost: 60
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
            thesis: '旧 thesis',
            attackVectors: [],
            failureModes: [],
            mitigation: '旧 mitigation'
          },
          memorySignals: [],
          report: {
            headline: '旧 headline',
            summary: '旧 summary',
            conclusion: '旧 conclusion',
            whyNow: '旧 whyNow',
            risk: '旧 risk',
            actions: ['旧 action']
          },
          warnings: []
        }
      }),
    SchemaError,
  );
});

test('parseVariableImpactScanRequest parses the nested variable payload', () => {
  const request = parseVariableImpactScanRequest({
    baselineId: 'baseline_demo_001',
    mode: 'balanced',
    variable: {
      id: 'var_demo_001',
      baselineId: 'baseline_demo_001',
      name: '双人协作机关',
      category: 'gameplay',
      intent: '提升中期合作乐趣',
      changeStatement: '加入必须双人配合才能通过的限时机关',
      injectionTargets: ['core_loop'],
      expectedBenefits: ['合作记忆点更强'],
      knownCosts: ['学习成本提高'],
      activationStage: 'mid',
      dependencies: ['需要单人补位机制'],
      successSignals: ['玩家主动讨论合作解法'],
      failureSignals: ['玩家抱怨必须等人']
    }
  });

  assert.equal(request.mode, 'balanced');
  assert.equal(request.variable.category, 'gameplay');
});

test('parseVariableImpactScanResult accepts structured impact scan output', () => {
  const result = parseVariableImpactScanResult({
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
        prototypeCost: 54
      }
    },
    impactScan: [
      {
        target: 'core_loop',
        directEffect: '双人同步节点会把高光集中到中期推进。',
        upside: '可复述的合作记忆点更强。',
        downside: '单人补位失败时会迅速放大等待感。',
        confidence: 78
      }
    ],
    affectedPersonas: [
      {
        personaName: '轻协作玩家',
        likelyReaction: '会喜欢成功配合，但对被迫等待非常敏感。',
        primaryTrigger: '失败后能否迅速重试。',
        riskLevel: 'medium'
      }
    ],
    guardrails: [
      {
        title: '补单人补位机制',
        reason: '先把等待队友的挫败压下来，再放大合作收益。',
        priority: 'P0'
      }
    ],
    validationPlan: [
      {
        step: '做 15 分钟短局原型',
        goal: '验证首局 10 分钟内是否会出现可复述高光。',
        successSignal: '玩家愿意主动复述协作瞬间。',
        failureSignal: '玩家把讨论焦点放在等待与失误惩罚上。'
      }
    ],
    assumptions: ['玩家能在首局内快速理解双人机关的目标。'],
    warnings: ['当前还没有真实可玩录像样本。'],
    confidence: 71,
    evidenceLevel: 'medium'
  });

  assert.equal(result.impactScan.length, 1);
  assert.equal(result.guardrails[0]?.priority, 'P0');
  assert.equal(result.confidence, 71);
});

test('parseVariableImpactScanJob accepts a completed job payload', () => {
  const job = parseVariableImpactScanJob({
    id: 'impact_scan_demo_001',
    workspaceId: 'workspace_demo_001',
    baselineId: 'baseline_demo_001',
    variableId: 'var_demo_001',
    mode: 'balanced',
    status: 'completed',
    currentStageKey: 'complete',
    currentStageLabel: 'Complete',
    message: 'Impact scan finished.',
    createdAt: '2026-03-14T09:10:00.000Z',
    updatedAt: '2026-03-14T09:10:02.000Z',
    stages: [
      {
        key: 'queued',
        label: 'Queued',
        detail: 'Waiting to start.',
        status: 'completed',
      },
      {
        key: 'baseline_read',
        label: 'Read Baseline',
        detail: 'Loaded the frozen baseline.',
        status: 'completed',
      },
      {
        key: 'impact_scan',
        label: 'Impact Scan',
        detail: 'Synthesizing direct effects and guardrails.',
        status: 'completed',
      },
      {
        key: 'complete',
        label: 'Complete',
        detail: 'Impact scan finished.',
        status: 'completed',
      },
    ],
    result: {
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
      affectedPersonas: [],
      guardrails: [],
      validationPlan: [],
      assumptions: ['玩家能在首局内快速理解双人机关的目标。'],
      warnings: [],
      confidence: 71,
      evidenceLevel: 'medium',
    },
  });

  assert.equal(job.status, 'completed');
  assert.equal(job.result?.impactScan[0]?.target, 'core_loop');
});

test('parsePersistedLatestAnalysis accepts a persisted latest analysis record', () => {
  const record = parsePersistedLatestAnalysis({
    workspaceId: 'workspace_demo_001',
    updatedAt: '2026-03-14T09:05:00.000Z',
    inputSignature: '{"project":{"name":"代号：远岸旅团"}}',
    projectSnapshot: {
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
      currentStatus: '担心学习成本会掩盖合作乐趣。'
    },
    evidenceSnapshot: [
      {
        id: 'evi_demo_001',
        type: 'interview',
        title: '轻协作玩家反馈',
        source: 'Discord 访谈',
        trust: 'high',
        summary: '玩家愿意合作解谜，但要求失败后能迅速重试。'
      }
    ],
    analysis: {
      generatedAt: '2026-03-14T08:58:00.000Z',
      mode: 'balanced',
      model: 'fixture-model',
      pipeline: ['dossier@fixture-model'],
      meta: {
        source: 'remote',
        status: 'fresh',
        requestId: 'analysis_fixture_001'
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
        prototypeCost: 54
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
        mitigation: '先缩小原型边界。'
      },
      memorySignals: [],
      report: {
        headline: '值得做短局原型。',
        summary: '合作高光有潜力，但等待感要先压住。',
        conclusion: '继续做，但要优先补失败恢复。',
        whyNow: '当前最缺的是可玩样本。',
        risk: '等待队友的成本会被快速放大。',
        actions: ['做 15 分钟短局原型']
      },
      warnings: []
    }
  });

  assert.equal(record.workspaceId, 'workspace_demo_001');
  assert.equal(record.analysis.meta.source, 'remote');
});

test('createWorkspaceInputSignature stays stable for identical inputs', () => {
  const project = {
    name: '代号：远岸旅团',
    mode: 'Concept' as const,
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
    currentStatus: '担心学习成本会掩盖合作乐趣。'
  };
  const evidenceItems = [
    {
      id: 'evi_demo_001',
      type: 'interview' as const,
      title: '轻协作玩家反馈',
      source: 'Discord 访谈',
      trust: 'high' as const,
      summary: '玩家愿意合作解谜，但要求失败后能迅速重试。',
      createdAt: '09:00',
    },
  ];

  assert.equal(
    createWorkspaceInputSignature(project, evidenceItems),
    createWorkspaceInputSignature(
      { ...project, platforms: [...project.platforms] },
      evidenceItems.map((item) => ({ ...item })),
    ),
  );
});
