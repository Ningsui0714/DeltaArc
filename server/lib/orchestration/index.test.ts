import assert from 'node:assert/strict';
import test from 'node:test';
import type { SandboxAnalysisRequest, SandboxAnalysisResult } from '../../../shared/sandbox';
import { createAnalysisMeta, createFallbackAnalysis } from '../normalizeSandboxResult';
import type { AnalysisCheckpointState } from './checkpoints';
import { createRetryableStageError, orchestrateSandboxAnalysis } from './index';
import { OrchestrationStageError } from './orchestrationCore';
import type { MemoryStore } from './memoryStore';

function createBaseRequest(): SandboxAnalysisRequest {
  return {
    workspaceId: 'workspace_resume_degraded',
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

function createSystemsPerspectiveCheckpoint(key: 'systems' | 'psychology' | 'market' | 'red_team') {
  return {
    key,
    output: {
      perspective: {
        key,
        label:
          key === 'systems'
            ? '玩法系统'
            : key === 'psychology'
              ? '玩家心理'
              : key === 'market'
                ? '市场定位'
                : '反方拆解',
        stance: key === 'red_team' ? ('bearish' as const) : ('mixed' as const),
        confidence: 66,
        verdict: `${key} 已缓存。`,
        opportunity: '已有一版可复用判断。',
        concern: '这条判断仍需继续验证。',
        leverage: '失败后只重跑缺失阶段。',
        evidenceRefs: [],
      },
      blindSpots: [],
      secondOrderEffects: [],
      scenarioVariants: [],
      decisionLenses: [],
      validationTracks: [],
      contrarianMoves: [],
      unknowns: [],
      strategyIdeas: [],
      redTeam:
        key === 'red_team'
          ? {
              thesis: '需要优先验证高光是否真实存在。',
              attackVectors: [],
              failureModes: [],
              mitigation: '先做最小验证。',
            }
          : undefined,
      warnings: [],
    },
    pipelineEntry: `${key}@test-model`,
    warnings: [],
    degraded: false,
  };
}

function createSynthesisProvisional(): SandboxAnalysisResult {
  return {
    ...createFallbackAnalysis(
      'balanced',
      'multi-stage: test-model',
      [
        'dossier@test-model',
        'systems@test-model',
        'psychology@test-model',
        'market@test-model',
        'red_team@test-model',
        'synthesis@test-model',
      ],
      createAnalysisMeta('remote', 'fresh', 'analysis_resume_degraded'),
    ),
    summary: '已缓存的综合摘要。',
    systemVerdict: '可以继续，但先验证首局高光。',
    primaryRisk: '高光可能只存在于讲述。',
    nextStep: '先做一轮 15 分钟首局测试。',
    report: {
      headline: '先验证，再决定是否扩大投入',
      summary: '这是恢复 refine 前缓存下来的综合结果。',
      conclusion: '如果首局高光站得住，这个方向可以继续。',
      whyNow: '越晚验证，返工成本越高。',
      risk: '误把概念热度当成体验成立。',
      actions: ['约测试', '记录复述率'],
    },
  };
}

test('resume from cached checkpoints keeps degraded status instead of washing it into fresh', async () => {
  let persistCalls = 0;
  const memoryStore: MemoryStore = {
    async loadRelevant() {
      return [];
    },
    async persist() {
      persistCalls += 1;
    },
  };
  const checkpoints: AnalysisCheckpointState = {
    dossier: {
      dossier: {
        systemFrame: 'Co-op rituals can differentiate the mid-game loop.',
        opportunityThesis: 'There is early evidence that shared tasks create stronger recall.',
        evidenceLevel: 'medium',
        playerAcceptance: 68,
        confidence: 61,
        supportRatio: 57,
        scores: {
          coreFun: 72,
          learningCost: 48,
          novelty: 66,
          acceptanceRisk: 44,
          prototypeCost: 53,
        },
        personas: [],
        hypotheses: [],
        evidenceDigest: [],
        coreTensions: ['clarity vs novelty'],
        openQuestions: ['Will solo players feel excluded?'],
        memorySignals: [],
        warnings: [],
      },
      pipelineEntry: 'dossier@test-model',
      warnings: ['dossier split pipeline failed and fell back to the legacy single-pass dossier path.'],
      degraded: true,
    },
    specialists: [
      createSystemsPerspectiveCheckpoint('systems'),
      createSystemsPerspectiveCheckpoint('psychology'),
      createSystemsPerspectiveCheckpoint('market'),
      createSystemsPerspectiveCheckpoint('red_team'),
    ],
    synthesis: {
      provisional: createSynthesisProvisional(),
      pipelineEntry: 'synthesis@test-model',
      warnings: [],
      degraded: false,
    },
  };

  const result = await orchestrateSandboxAnalysis(createBaseRequest(), {
    memoryStore,
    resume: {
      startStageKey: 'refine',
      checkpoints,
    },
  });

  assert.equal(result.meta.source, 'remote');
  assert.equal(result.meta.status, 'degraded');
  assert.match(result.warnings.join(' '), /Reliability degraded/i);
  assert.equal(persistCalls, 0);
});

test('createRetryableStageError preserves the partial result for retryable failures', () => {
  const partialResult = createSynthesisProvisional();
  const checkpoints: AnalysisCheckpointState = {
    dossier: {
      dossier: {
        systemFrame: 'Co-op rituals can differentiate the mid-game loop.',
        opportunityThesis: 'There is early evidence that shared tasks create stronger recall.',
        evidenceLevel: 'medium',
        playerAcceptance: 68,
        confidence: 61,
        supportRatio: 57,
        scores: {
          coreFun: 72,
          learningCost: 48,
          novelty: 66,
          acceptanceRisk: 44,
          prototypeCost: 53,
        },
        personas: [],
        hypotheses: [],
        evidenceDigest: [],
        coreTensions: ['clarity vs novelty'],
        openQuestions: ['Will solo players feel excluded?'],
        memorySignals: [],
        warnings: [],
      },
      pipelineEntry: 'dossier@test-model',
      warnings: [],
      degraded: false,
    },
    specialists: [],
    synthesis: {
      provisional: partialResult,
      pipelineEntry: 'synthesis@test-model',
      warnings: [],
      degraded: false,
    },
  };

  const retryableError = createRetryableStageError(
    new OrchestrationStageError(
      'refine',
      'Refine',
      'Refine stage failed: simulated timeout',
      partialResult,
    ),
    checkpoints,
  );

  assert.equal(retryableError.stageKey, 'refine');
  assert.equal(retryableError.partialResult?.summary, partialResult.summary);
  assert.equal(retryableError.checkpoints.synthesis?.provisional.summary, partialResult.summary);
});
