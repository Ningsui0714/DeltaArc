import assert from 'node:assert/strict';
import test from 'node:test';
import type { SandboxAnalysisRequest, SandboxAnalysisResult } from '../../../shared/sandbox';
import { createAnalysisMeta, createFallbackAnalysis } from '../normalizeSandboxResult';
import { createExecutionPlan } from './executionPlan';
import { buildActionBriefMessages } from './prompts';
import { runSynthesisStage } from './postStages';
import type { Dossier } from './types';

function createBaseDossier(): Dossier {
  return {
    systemFrame: '先验证首局是否真的有协作高光。',
    opportunityThesis: '如果玩家愿意主动复述协作高光，项目还有继续空间。',
    evidenceLevel: 'medium',
    playerAcceptance: 61,
    confidence: 58,
    supportRatio: 56,
    scores: {
      coreFun: 66,
      learningCost: 54,
      novelty: 63,
      acceptanceRisk: 48,
      prototypeCost: 52,
    },
    personas: [],
    hypotheses: [],
    evidenceDigest: [],
    coreTensions: ['高光感知必须快于理解成本暴露'],
    openQuestions: ['玩家是否会主动复述协作高光'],
    memorySignals: [],
    warnings: [],
  };
}

function createBaseRequest(): SandboxAnalysisRequest {
  return {
    workspaceId: 'workspace_test_run_synthesis_stage',
    mode: 'balanced',
    project: {
      name: 'Campfire Co-op',
      mode: 'Concept',
      genre: 'survival',
      platforms: ['PC'],
      targetPlayers: ['co-op players'],
      coreFantasy: 'survive together',
      ideaSummary: 'A co-op survival concept',
      coreLoop: 'explore -> gather -> build',
      sessionLength: '20m',
      differentiators: 'shared traps',
      progressionHook: 'base upgrades',
      socialHook: 'paired actions',
      monetization: 'premium',
      referenceGames: ['Dont Starve Together'],
      validationGoal: 'Check if co-op rituals improve mid-game retention.',
      productionConstraints: '2 devs',
      currentStatus: 'concept',
    },
    evidenceItems: [],
  };
}

function createBaseProvisional(): SandboxAnalysisResult {
  const base = createFallbackAnalysis(
    'balanced',
    'multi-stage: local-base',
    ['dossier@test-model', 'systems@test-model'],
    createAnalysisMeta('remote', 'degraded', 'analysis_test_base'),
  );

  return {
    ...base,
    summary: '本地底座摘要',
    futureTimeline: [
      {
        phase: '首波反应',
        timing: '0-24 小时',
        expectedReaction: '玩家先讨论一句话卖点。',
        likelyShift: '讨论会快速分成看好与观望两派。',
        risk: '高光感知不稳定。',
        watchSignals: ['玩家是否主动复述高光'],
        recommendedResponse: '先收首波样本再放大外宣。',
      },
    ],
    communityRhythms: [
      {
        name: '首发围观',
        timing: '第 1 天',
        pattern: '先看卖点，再看试玩反馈。',
        trigger: '概念传播',
        implication: '第一拍不稳，后续会越来越抽象。',
      },
    ],
    trajectorySignals: [
      {
        signal: '玩家主动复述高光',
        direction: 'positive',
        timing: '首波反馈',
        impact: '说明卖点开始变成社区语言。',
        recommendedMove: '继续补更多同类样本。',
      },
    ],
  };
}

test('runSynthesisStage keeps the local future slice when only the action brief succeeds', async () => {
  const result = await runSynthesisStage(
    createBaseRequest(),
    createExecutionPlan('balanced'),
    createBaseDossier(),
    [],
    ['dossier@test-model', 'systems@test-model'],
    createBaseProvisional(),
    undefined,
    {
      runJsonStage: async (_request, label) => {
        if (label === 'synthesis-future') {
          throw new Error('DeepSeek synthesis-future returned no usable content.');
        }

        throw new Error(`Unexpected stage label in test: ${label}`);
      },
      runActionBriefCandidateSelection: async () => ({
        data: {
          summary: '新的综合摘要',
          systemVerdict: '方向能继续，但要先压住理解成本。',
          primaryRisk: '高光成立前，学习负担会先暴露。',
          nextStep: '先做一轮 15 分钟内的首局测试。',
          playerAcceptance: 67,
          confidence: 64,
          supportRatio: 62,
          strategies: [
            {
              name: '先做短局验证',
              type: '验证',
              cost: '低',
              timeToValue: '1 周',
              acceptance: 68,
              risk: '样本还不够广。',
              recommendation: '先证明首局高光，再扩内容。',
            },
          ],
          report: {
            headline: '先验证，再扩写',
            summary: '先证明首局价值，再决定是否加码。',
            conclusion: '现在最值钱的是更快看到真实玩家反应。',
            whyNow: '一旦先扩内容，后续返工成本会快速抬升。',
            risk: '如果误把概念热度当成体验成立，会走偏。',
            actions: ['约首批测试', '记录首局反馈', '拆高光时刻', '补失败路径'],
          },
          warnings: ['brief remote warning'],
        },
        warnings: ['brief selection warning'],
        models: ['deepseek-chat'],
        degraded: false,
        selectionSummary: {
          stage: 'action_brief',
          candidateCount: 1,
          selectedCandidateId: 'brief_balanced',
          selectedFlavor: 'balanced',
          decisionMode: 'single',
          rationale: 'Only one action brief candidate completed, so it was promoted directly.',
          rankings: [],
        },
      }),
    },
  );

  assert.equal(result.pipelineEntry, 'synthesis@deepseek-chat');
  assert.equal(result.provisional.summary, '新的综合摘要');
  assert.equal(result.provisional.futureTimeline[0]?.phase, '首波反应');
  assert.equal(result.provisional.report.headline, '先验证，再扩写');
  assert.equal(result.provisional.meta.actionBriefSelection?.selectedCandidateId, 'brief_balanced');
  assert.equal(result.degraded, true);
  assert.ok(
    result.warnings.some((warning) =>
      warning.includes('Future evolution slice failed: DeepSeek synthesis-future returned no usable content.'),
    ),
  );
  assert.ok(
    result.provisional.warnings.some((warning) =>
      warning.includes('The local synthesis base was kept for the missing slice.'),
    ),
  );
});

test('runSynthesisStage keeps user-facing warnings but drops internal repair traces', async () => {
  const result = await runSynthesisStage(
    createBaseRequest(),
    createExecutionPlan('balanced'),
    createBaseDossier(),
    [],
    ['dossier@test-model', 'systems@test-model'],
    createBaseProvisional(),
    undefined,
    {
      runJsonStage: async () => ({
        data: {
          futureTimeline: [],
          communityRhythms: [],
          trajectorySignals: [],
          warnings: ['推断：未来节奏仍需补样本验证。'],
        },
        model: 'deepseek-chat',
        durationMs: 1200,
        warnings: ['synthesis-future JSON required one local repair pass after the initial parse failed.'],
        degraded: true,
      }),
      runActionBriefCandidateSelection: async () => ({
        data: {
          summary: '新的综合摘要',
          systemVerdict: '方向能继续，但要先压住理解成本。',
          primaryRisk: '高光成立前，学习负担会先暴露。',
          nextStep: '先做一轮 15 分钟内的首局测试。',
          playerAcceptance: 67,
          confidence: 64,
          supportRatio: 62,
          strategies: [],
          report: {
            headline: '先验证，再扩写',
            summary: '先证明首局价值，再决定是否加码。',
            conclusion: '现在最值钱的是更快看到真实玩家反应。',
            whyNow: '一旦先扩内容，后续返工成本会快速抬升。',
            risk: '如果误把概念热度当成体验成立，会走偏。',
            actions: ['约首批测试', '记录首局反馈', '拆高光时刻', '补失败路径'],
          },
          warnings: ['证据中未提供新手引导对早期情绪和留存的影响细节。'],
        },
        warnings: [
          'synthesis-brief-balanced JSON required one local repair pass after the initial parse failed.',
          'Action brief verifier selected balanced candidate: 更可执行。',
        ],
        models: ['deepseek-chat'],
        degraded: true,
        selectionSummary: {
          stage: 'action_brief',
          candidateCount: 3,
          selectedCandidateId: 'brief_balanced',
          selectedFlavor: 'balanced',
          decisionMode: 'verifier',
          rationale: '更可执行。',
          rankings: [],
        },
      }),
    },
  );

  assert.ok(result.warnings.includes('推断：未来节奏仍需补样本验证。'));
  assert.ok(result.warnings.includes('证据中未提供新手引导对早期情绪和留存的影响细节。'));
  assert.equal(
    result.warnings.some((warning) => warning.includes('JSON required one local repair pass')),
    false,
  );
  assert.equal(
    result.provisional.warnings.some((warning) => warning.includes('verifier selected')),
    false,
  );
});

test('buildActionBriefMessages does not embed internal runtime warnings into the provisional context', () => {
  const provisional = {
    ...createBaseProvisional(),
    warnings: [
      'dossier-select JSON required one local repair pass after the initial parse failed.',
      '推断：confidence 仍基于有限证据。',
    ],
  };
  const messages = buildActionBriefMessages(
    createBaseRequest(),
    createBaseDossier(),
    provisional,
    'balanced',
  );

  assert.match(messages[1]?.content ?? '', /推断：confidence 仍基于有限证据。/);
  assert.doesNotMatch(
    messages[1]?.content ?? '',
    /dossier-select JSON required one local repair pass after the initial parse failed\./,
  );
  assert.match(
    messages[1]?.content ?? '',
    /不要直接复用 provisional_base\.systemVerdict 的原句/,
  );
  assert.match(
    messages[1]?.content ?? '',
    /不要直接写“方向暂不宜乐观扩张，先用更小成本验证关键前提。/,
  );
});

test('runSynthesisStage still fails when both synthesis slices fail', async () => {
  await assert.rejects(
    () =>
      runSynthesisStage(
        createBaseRequest(),
        createExecutionPlan('balanced'),
        createBaseDossier(),
        [],
        ['dossier@test-model', 'systems@test-model'],
        createBaseProvisional(),
        undefined,
        {
          runJsonStage: async () => {
            throw new Error('DeepSeek synthesis-future returned no usable content.');
          },
          runActionBriefCandidateSelection: async () => {
            throw new Error('DeepSeek synthesis-brief-balanced returned no usable content.');
          },
        },
      ),
    (error: unknown) => {
      assert.equal((error as { name?: string })?.name, 'OrchestrationStageError');
      assert.equal((error as { stageKey?: string })?.stageKey, 'synthesis');
      assert.match((error as { message?: string })?.message ?? '', /Future evolution slice failed/);
      assert.match((error as { message?: string })?.message ?? '', /Action brief slice failed/);
      return true;
    },
  );
});
