import assert from 'node:assert/strict';
import test from 'node:test';
import type { SandboxAnalysisRequest, SandboxAnalysisResult } from '../../../shared/sandbox';
import { createAnalysisMeta, createFallbackAnalysis } from '../normalizeSandboxResult';
import { createExecutionPlan } from './executionPlan';
import { buildModelSummary } from './orchestrationCore';
import {
  applyReverseCheckToProvisional,
  assembleSynthesisProvisional,
  runRefineStage,
} from './postStages';
import {
  buildActionBriefMessages,
  buildActionBriefSelectionMessages,
  buildRefinementMessages,
  buildReverseCheckMessages,
} from './prompts';

function createBaseDossier() {
  return {
    systemFrame: '先验证首局是否真的有协作高光。',
    opportunityThesis: '如果玩家愿意主动复述协作高光，项目还有继续空间。',
    evidenceLevel: 'medium' as const,
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
    workspaceId: 'workspace_test_post_stages',
    mode: 'reasoning',
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

test('assembleSynthesisProvisional keeps the local base when only the action slice returns', () => {
  const assembled = assembleSynthesisProvisional({
    provisional: createBaseProvisional(),
    pipeline: ['dossier@test-model', 'systems@test-model'],
    models: ['deepseek-chat'],
    actionData: {
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
    warnings: ['slice degraded warning'],
  });

  assert.equal(assembled.pipelineEntry, 'synthesis@deepseek-chat');
  assert.equal(assembled.provisional.summary, '新的综合摘要');
  assert.equal(assembled.provisional.futureTimeline[0]?.phase, '首波反应');
  assert.equal(assembled.provisional.report.headline, '先验证，再扩写');
  assert.ok(assembled.provisional.warnings.includes('brief remote warning'));
  assert.ok(assembled.provisional.warnings.includes('slice degraded warning'));
});

test('assembleSynthesisProvisional prefers the remote future slice when it is available', () => {
  const assembled = assembleSynthesisProvisional({
    provisional: createBaseProvisional(),
    pipeline: ['dossier@test-model', 'systems@test-model'],
    models: ['deepseek-reasoner', 'deepseek-chat'],
    futureData: {
      futureTimeline: [
        {
          phase: '远端首波反应',
          timing: '0-12 小时',
          expectedReaction: '玩家先围绕首局高光展开讨论。',
          likelyShift: '如果复述率高，讨论会转向玩法拆解。',
          risk: '若高光只存在于讲述，口碑会很快回落。',
          watchSignals: ['复述率'],
          recommendedResponse: '在 24 小时内补第二轮样本。',
        },
      ],
      communityRhythms: [
        {
          name: '远端围观节奏',
          timing: '第 1 天',
          pattern: '玩家会先围观，再分层复盘。',
          trigger: '首轮直播片段',
          implication: '第一波素材会决定后续语气。',
        },
      ],
      trajectorySignals: [
        {
          signal: '复述率继续上升',
          direction: 'positive',
          timing: '48 小时内',
          impact: '说明卖点开始稳定。',
          recommendedMove: '把验证样本扩到第二组人群。',
        },
      ],
    },
  });

  assert.equal(assembled.pipelineEntry, 'synthesis@deepseek-reasoner+deepseek-chat');
  assert.equal(assembled.provisional.futureTimeline[0]?.phase, '远端首波反应');
  assert.equal(assembled.provisional.communityRhythms[0]?.name, '远端围观节奏');
  assert.equal(assembled.provisional.trajectorySignals[0]?.signal, '复述率继续上升');
});

test('buildActionBriefMessages can request an execution-first candidate', () => {
  const messages = buildActionBriefMessages(
    createBaseRequest(),
    createBaseDossier(),
    createBaseProvisional(),
    'execution_first',
  );

  assert.match(messages[0]?.content ?? '', /execution-first action brief/);
  assert.match(messages[1]?.content ?? '', /当前候选风格是 execution_first/);
});

test('buildActionBriefSelectionMessages packages candidates for verifier ranking', () => {
  const messages = buildActionBriefSelectionMessages(
    createBaseRequest(),
    createBaseDossier(),
    createBaseProvisional(),
    [
      {
        candidateId: 'brief_balanced',
        flavor: 'balanced',
        brief: {
          summary: '先验证首局高光。',
          systemVerdict: '先缩范围再扩。',
          primaryRisk: '理解成本先于高光暴露。',
          nextStep: '做 15 分钟首局测试。',
          playerAcceptance: 64,
          confidence: 60,
          supportRatio: 58,
          strategies: [],
          report: {
            headline: '先验证',
            summary: '先验证核心体验。',
            conclusion: '不要先扩内容。',
            whyNow: '越早验证越省返工。',
            risk: '概念热度可能误导判断。',
            actions: ['约测试', '录反馈', '拆高光', '补失败路径'],
          },
        },
      },
    ],
  );

  assert.match(messages[1]?.content ?? '', /<<<ACTION_BRIEF_CANDIDATES_DATA_START>>>/);
  assert.match(messages[1]?.content ?? '', /selectedCandidateId/);
});

test('buildReverseCheckMessages asks for necessary conditions and constraint-aware shrinkage', () => {
  const messages = buildReverseCheckMessages(
    createBaseRequest(),
    createBaseDossier(),
    createBaseProvisional(),
  );

  assert.match(messages[0]?.content ?? '', /reverse-check verifier/);
  assert.match(messages[1]?.content ?? '', /necessaryConditions/);
  assert.match(messages[1]?.content ?? '', /supported \/ uncertain \/ unsupported/);
});

test('buildRefinementMessages requests an incremental patch instead of a full schema rewrite', () => {
  const messages = buildRefinementMessages(createBaseProvisional());

  assert.match(messages[0]?.content ?? '', /增量修订/);
  assert.match(messages[0]?.content ?? '', /合法 JSON patch/);
  assert.match(messages[1]?.content ?? '', /这是增量 patch，不是完整 schema/);
  assert.match(messages[1]?.content ?? '', /不要返回 generatedAt、mode、model、pipeline、meta/);
  assert.match(messages[1]?.content ?? '', /只返回一个极小 patch/);
});

test('applyReverseCheckToProvisional folds reverse-check fragility into warnings and top-level fields', () => {
  const next = applyReverseCheckToProvisional(
    createBaseProvisional(),
    {
      systemVerdict: '方向可以继续，但前提仍未被充分证实。',
      primaryRisk: '首局高光可能只存在于讲述而非真实体验。',
      nextStep: '先做一轮验证高光复述率的 15 分钟首局测试。',
      fragilitySummary: '当前正向判断依赖首局高光真实成立。',
      necessaryConditions: [
        {
          condition: '玩家会主动复述协作高光',
          status: 'unsupported',
          evidenceRefs: ['evi_test_001'],
          impact: '如果不成立，当前卖点会迅速失焦。',
        },
        {
          condition: '两周内能做出足够清晰的原型',
          status: 'uncertain',
          evidenceRefs: ['project.productionConstraints'],
          impact: '如果无法及时验证，判断会继续漂移。',
        },
      ],
      warnings: ['reverse warning'],
    },
    ['stage warning'],
  );

  assert.equal(next.provisional.systemVerdict, '方向可以继续，但前提仍未被充分证实。');
  assert.equal(next.provisional.primaryRisk, '首局高光可能只存在于讲述而非真实体验。');
  assert.ok(next.provisional.warnings.includes('reverse warning'));
  assert.ok(next.provisional.warnings.includes('stage warning'));
  assert.ok(next.provisional.warnings.some((warning) => warning.includes('Reverse check blocked')));
  assert.ok(next.provisional.warnings.some((warning) => warning.includes('Reverse check: 当前正向判断依赖首局高光真实成立。')));
  assert.equal(next.reverseCheckSummary?.tightened, true);
  assert.equal(next.reverseCheckSummary?.necessaryConditions[0]?.status, 'unsupported');
});

test('runRefineStage throws a retryable stage error and preserves the synthesis draft on failure', async () => {
  const provisional = createBaseProvisional();
  const executionPlan = {
    ...createExecutionPlan('reasoning'),
    shouldRunRefine: true,
  };

  await assert.rejects(
    () =>
      runRefineStage(
        createBaseRequest(),
        executionPlan,
        provisional,
        provisional.pipeline,
        provisional.model,
        ['synthesis warning'],
        undefined,
        {
          runJsonStage: async () => {
            throw new Error('simulated refine timeout');
          },
        },
      ),
    (error: unknown) => {
      assert.equal((error as { name?: string })?.name, 'OrchestrationStageError');
      assert.equal((error as { stageKey?: string })?.stageKey, 'refine');
      assert.equal((error as { stageLabel?: string })?.stageLabel, 'Refine');
      assert.match((error as { message?: string })?.message ?? '', /preserved for retry/i);
      assert.equal(
        (error as { partialResult?: SandboxAnalysisResult | null })?.partialResult?.summary,
        provisional.summary,
      );
      assert.equal(
        (error as { partialResult?: SandboxAnalysisResult | null })?.partialResult?.meta.status,
        'degraded',
      );
      assert.ok(
        (error as { partialResult?: SandboxAnalysisResult | null })?.partialResult?.warnings.includes(
          'synthesis warning',
        ),
      );
      assert.ok(
        (error as { partialResult?: SandboxAnalysisResult | null })?.partialResult?.warnings.some(
          (warning) => warning.includes('Refine failed; returning the synthesis draft for retry'),
        ),
      );
      return true;
    },
  );
});

test('buildModelSummary expands composite synthesis pipeline entries', () => {
  assert.equal(
    buildModelSummary([
      'dossier@deepseek-reasoner',
      'systems@deepseek-chat',
      'synthesis@deepseek-reasoner+deepseek-chat',
    ]),
    'multi-stage: deepseek-reasoner + deepseek-chat',
  );
});
