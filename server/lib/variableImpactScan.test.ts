import assert from 'node:assert/strict';
import test from 'node:test';
import type { FrozenBaseline } from '../../shared/variableSandbox';
import {
  buildVariableImpactScanMessages,
  normalizeVariableImpactScanResult,
} from './variableImpactScan';

function createBaseline(): FrozenBaseline {
  return {
    id: 'baseline_demo_001',
    projectId: 'workspace_demo_001',
    createdAt: '2026-03-14T09:00:00.000Z',
    sourceAnalysisRequestId: 'analysis_demo_001',
    sourceAnalysisMode: 'balanced',
    sourceAnalysisGeneratedAt: '2026-03-14T08:58:00.000Z',
    sourceAnalysisStatus: 'fresh',
    projectSnapshot: {
      name: '青屿咖啡春季新品种草',
      mode: 'Concept',
      genre: 'campus-koc',
      platforms: ['小红书'],
      targetPlayers: ['校园女生'],
      coreFantasy: '让新品第一口就值得拉室友一起试。',
      ideaSummary: '验证室友盲测是否能提升到店和 UGC。',
      coreLoop: '刷到内容 -> 拉朋友到店 -> 评论区站队',
      sessionLength: '20-40 秒内容',
      differentiators: '用真实反应替代功能介绍。',
      progressionHook: '持续看不同宿舍组合和口味站队。',
      socialHook: '评论区带室友打分和补充第一口反应。',
      monetization: '优先看券核销和到店转化。',
      referenceGames: ['校园新品测评账号'],
      validationGoal: '确认室友盲测是否提升评论复述率。',
      productionConstraints: '1 名运营，1 周 6 条内容快测。',
      currentStatus: '担心内容热闹但转化承接不足。',
    },
    evidenceSnapshot: [
      {
        id: 'evi_demo_001',
        type: 'interview',
        title: 'KOC 访谈',
        source: '4 位校园达人回访',
        trust: 'high',
        summary: '达人更愿意拍室友真实反应，不想做生硬口播。',
        createdAt: '2026-03-14T08:20:00.000Z',
      },
    ],
    analysisSnapshot: {
      summary: '室友盲测有机会带动评论站队和到店决策。',
      systemVerdict: '值得做一周内容快测。',
      evidenceLevel: 'medium',
      primaryRisk: '内容热闹但到店承接不足。',
      nextStep: '先做 6 条 KOC 内容快测。',
      scores: {
        coreFun: 72,
        learningCost: 35,
        novelty: 70,
        acceptanceRisk: 45,
        prototypeCost: 40,
      },
      personas: [
        {
          name: '宿舍决策者',
          motive: '想快速判断新品是否值得拉室友一起试。',
          accepts: '真实反应和清晰到店理由。',
          rejects: '只有卖点罗列。',
          verdict: '有条件看好',
        },
      ],
      hypotheses: [],
      perspectives: [],
      blindSpots: [],
      validationTracks: [],
      warnings: [],
    },
  };
}

test('buildVariableImpactScanMessages grounds the prompt in the frozen baseline and variable', () => {
  const baseline = createBaseline();
  const messages = buildVariableImpactScanMessages({
    baseline,
    variable: {
      id: 'var_demo_001',
      baselineId: baseline.id,
      name: '室友盲测',
      category: 'gameplay',
      intent: '提升到店冲动和评论复述率',
      changeStatement: '把功能介绍改成室友第一口盲测',
      injectionTargets: ['core_loop', 'player_cooperation'],
      expectedBenefits: ['真实反应更强'],
      knownCosts: ['拍摄协同成本更高'],
      activationStage: 'mid',
      dependencies: ['门店愿意配合拍摄'],
      successSignals: ['评论区主动站队'],
      failureSignals: ['内容热闹但没有核销'],
    },
    mode: 'reasoning',
  });

  assert.equal(messages.length, 2);
  assert.match(messages[0]?.content ?? '', /frozen baseline/);
  assert.match(messages[0]?.content ?? '', /不得擅自新增/);
  assert.match(messages[1]?.content ?? '', /<<<BASELINE_PROJECT_SNAPSHOT_DATA_START>>>/);
  assert.match(messages[1]?.content ?? '', /1 名运营，1 周 6 条内容快测/);
  assert.match(messages[1]?.content ?? '', /室友盲测/);
  assert.match(messages[1]?.content ?? '', /evidenceLevel 必须保持和 baseline 一致/);
});

test('normalizeVariableImpactScanResult keeps the baseline evidence level and merges remote warnings', () => {
  const baseline = createBaseline();
  const result = normalizeVariableImpactScanResult({
    baseline,
    remoteWarnings: ['变量实验在 reasoning 模型超时后，已切换到 deepseek-chat 继续生成。'],
    input: {
      summary: '变量会先放大真实反应，也会先暴露拍摄协同成本。',
      baselineRead: {
        summary: '当前基线的反应类内容方向成立，但承接偏弱。',
        evidenceLevel: 'high',
        primaryRisk: '内容热闹但到店承接不足。',
        scores: {
          coreFun: 72,
          learningCost: 35,
          novelty: 70,
          acceptanceRisk: 45,
          prototypeCost: 40,
        },
      },
      impactScan: [
        {
          target: 'core_loop',
          directEffect: '室友盲测会把内容主线从卖点说明切到现场反应。',
          upside: '评论区更容易复述和站队。',
          downside: '拍摄协同不到位会拖慢周更节奏。',
          confidence: 78,
        },
      ],
      affectedPersonas: [
        {
          personaName: '宿舍决策者',
          likelyReaction: '会更愿意拉朋友到店试喝。',
          primaryTrigger: '真实反应是否足够强。',
          riskLevel: 'medium',
        },
      ],
      guardrails: [
        {
          title: '先写好评论区互动句',
          reason: '避免围观只停留在礼貌点赞。',
          priority: 'P0',
        },
      ],
      validationPlan: [
        {
          step: '做 6 条室友盲测快测',
          goal: '验证评论站队和到店券核销。',
          successSignal: '评论区主动站队且核销高于对照组。',
          failureSignal: '互动热闹但核销不动。',
        },
      ],
      assumptions: ['推断：门店能配合轻量拍摄。'],
      warnings: ['当前还缺少门店高峰时段样本。'],
      confidence: 71,
      evidenceLevel: 'high',
    },
  });

  assert.equal(result.evidenceLevel, 'medium');
  assert.equal(result.baselineRead.evidenceLevel, 'medium');
  assert.ok(
    result.warnings.includes('变量实验在 reasoning 模型超时后，已切换到 deepseek-chat 继续生成。'),
  );
  assert.ok(
    result.warnings.includes('变量实验输出的 evidenceLevel 已被校正回 frozen baseline 的证据等级。'),
  );
});

test('normalizeVariableImpactScanResult labels assumptions as explicit inference', () => {
  const baseline = createBaseline();
  const result = normalizeVariableImpactScanResult({
    baseline,
    input: {
      summary: '变量会改变内容节奏。',
      baselineRead: {
        summary: '当前基线仍然偏向小范围快测。',
        evidenceLevel: 'medium',
        primaryRisk: '内容热闹但到店承接不足。',
        scores: {
          coreFun: 72,
          learningCost: 35,
          novelty: 70,
          acceptanceRisk: 45,
          prototypeCost: 40,
        },
      },
      impactScan: [],
      affectedPersonas: [],
      guardrails: [],
      validationPlan: [],
      assumptions: ['用户能快速看懂室友盲测。', '推断：门店可以承接到店流量。'],
      warnings: [],
      confidence: 60,
      evidenceLevel: 'medium',
    },
  });

  assert.deepEqual(result.assumptions, [
    '推断：用户能快速看懂室友盲测。',
    '推断：门店可以承接到店流量。',
  ]);
});
