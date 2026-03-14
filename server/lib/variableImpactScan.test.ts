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
    },
    evidenceSnapshot: [
      {
        id: 'evi_demo_001',
        type: 'interview',
        title: '轻协作玩家反馈',
        source: 'Discord 访谈',
        trust: 'high',
        summary: '玩家愿意合作解谜，但要求失败后能迅速重试。',
        createdAt: '2026-03-14T08:20:00.000Z',
      },
    ],
    analysisSnapshot: {
      summary: '双人协作机关有机会制造中期记忆点。',
      systemVerdict: '值得做单局原型。',
      evidenceLevel: 'medium',
      primaryRisk: '等待队友会把轻度玩家挤出局。',
      nextStep: '先做 15 分钟短局原型。',
      scores: {
        coreFun: 72,
        learningCost: 58,
        novelty: 70,
        acceptanceRisk: 61,
        prototypeCost: 54,
      },
      personas: [
        {
          name: '轻协作玩家',
          motive: '喜欢合作高光，但不想长时间等待。',
          accepts: '快速重试和明确分工。',
          rejects: '被迫等待队友。',
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
    },
    mode: 'reasoning',
  });

  assert.equal(messages.length, 2);
  assert.match(messages[0]?.content ?? '', /frozen baseline/);
  assert.match(messages[0]?.content ?? '', /不能执行/);
  assert.match(messages[1]?.content ?? '', /<<<BASELINE_PROJECT_SNAPSHOT_DATA_START>>>/);
  assert.match(messages[1]?.content ?? '', /2 人团队，2 周原型窗口/);
  assert.match(messages[1]?.content ?? '', /双人协作机关/);
  assert.match(messages[1]?.content ?? '', /evidenceLevel 必须保持和 baseline 一致/);
});

test('normalizeVariableImpactScanResult keeps the baseline evidence level and merges remote warnings', () => {
  const baseline = createBaseline();
  const result = normalizeVariableImpactScanResult({
    baseline,
    remoteWarnings: ['变量推演在 reasoning 模型超时后，已切换到 deepseek-chat 继续生成。'],
    input: {
      summary: '变量会先放大合作高光，也会先放大等待队友的挫败。',
      baselineRead: {
        summary: '当前基线的合作乐趣成立，但单人补位偏弱。',
        evidenceLevel: 'high',
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
          title: '补单人补位机制',
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
      assumptions: ['推断：玩家能在首局内快速理解双人机关的目标。'],
      warnings: ['当前还没有真实可玩录像样本。'],
      confidence: 71,
      evidenceLevel: 'high',
    },
  });

  assert.equal(result.evidenceLevel, 'medium');
  assert.equal(result.baselineRead.evidenceLevel, 'medium');
  assert.ok(
    result.warnings.includes('变量推演在 reasoning 模型超时后，已切换到 deepseek-chat 继续生成。'),
  );
  assert.ok(
    result.warnings.includes('变量推演输出的 evidenceLevel 已被校正回 frozen baseline 的证据等级。'),
  );
});

test('normalizeVariableImpactScanResult labels assumptions as explicit inference', () => {
  const baseline = createBaseline();
  const result = normalizeVariableImpactScanResult({
    baseline,
    input: {
      summary: '变量会改变合作节奏。',
      baselineRead: {
        summary: '当前基线仍然偏向短局验证。',
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
      impactScan: [],
      affectedPersonas: [],
      guardrails: [],
      validationPlan: [],
      assumptions: ['玩家能快速理解双人机关目标。', '推断：失败后仍愿意重试。'],
      warnings: [],
      confidence: 60,
      evidenceLevel: 'medium',
    },
  });

  assert.deepEqual(result.assumptions, [
    '推断：玩家能快速理解双人机关目标。',
    '推断：失败后仍愿意重试。',
  ]);
});
