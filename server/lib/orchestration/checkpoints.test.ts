import test from 'node:test';
import assert from 'node:assert/strict';
import {
  type AnalysisCheckpointState,
  getOrderedSpecialistCheckpoints,
  getSpecialistResumeState,
} from './checkpoints';
import { createExecutionPlan } from './executionPlan';

test('getOrderedSpecialistCheckpoints returns checkpoints in execution order', () => {
  const executionPlan = createExecutionPlan('balanced');
  const checkpoints: AnalysisCheckpointState = {
    specialists: [
      {
        key: 'market' as const,
        output: {
          perspective: {
            key: 'market',
            label: '市场定位',
            stance: 'mixed' as const,
            confidence: 66,
            verdict: '市场表达还需要再压缩。',
            opportunity: '一句话卖点已经出现。',
            concern: '外部传播可能还不够清晰。',
            leverage: '先测试玩家能否主动复述。',
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
          redTeam: undefined,
          warnings: [],
      },
      pipelineEntry: 'market@test-model',
      warnings: [],
      degraded: false,
    },
      {
        key: 'systems' as const,
        output: {
          perspective: {
            key: 'systems',
            label: '玩法系统',
            stance: 'mixed' as const,
            confidence: 70,
            verdict: '核心循环还算成立。',
            opportunity: '局内高光有出现空间。',
            concern: '首局理解成本偏高。',
            leverage: '先压缩第一局的信息量。',
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
          redTeam: undefined,
          warnings: [],
      },
      pipelineEntry: 'systems@test-model',
      warnings: [],
      degraded: false,
    },
      {
        key: 'psychology' as const,
        output: {
          perspective: {
            key: 'psychology',
            label: '玩家心理',
            stance: 'mixed' as const,
            confidence: 68,
            verdict: '情绪节奏还需要更快起势。',
            opportunity: '合作高光有放大空间。',
            concern: '早期等待感会打断动力。',
            leverage: '先让第一轮补位更快闭环。',
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
          redTeam: undefined,
          warnings: [],
      },
      pipelineEntry: 'psychology@test-model',
      warnings: [],
      degraded: false,
    },
      {
        key: 'red_team' as const,
        output: {
          perspective: {
            key: 'red_team',
            label: '反方拆解',
            stance: 'bearish' as const,
            confidence: 71,
            verdict: '当前的卖点可能只存在于讲述。',
            opportunity: '如果高光真实存在，反而会更容易证伪。',
            concern: '概念热度可能掩盖实际 friction。',
            leverage: '先盯首局复述率和等待时长。',
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
          redTeam: undefined,
          warnings: [],
      },
      pipelineEntry: 'red_team@test-model',
      warnings: [],
      degraded: false,
    },
    ],
  };

  const ordered = getOrderedSpecialistCheckpoints(executionPlan, checkpoints);

  assert.deepEqual(
    ordered?.map((checkpoint) => checkpoint.key),
    ['systems', 'psychology', 'market', 'red_team'],
  );
});

test('getSpecialistResumeState reuses every cached specialist and reruns only missing ones', () => {
  const executionPlan = createExecutionPlan('reasoning');
  const checkpoints: AnalysisCheckpointState = {
    dossier: {
      dossier: {
        systemFrame: '先做首局高光验证。',
        opportunityThesis: '如果协作高光真实成立，这个方向还有继续空间。',
        evidenceLevel: 'medium' as const,
        playerAcceptance: 62,
        confidence: 58,
        supportRatio: 55,
        scores: {
          coreFun: 68,
          learningCost: 50,
          novelty: 63,
          acceptanceRisk: 48,
          prototypeCost: 52,
        },
        personas: [],
        hypotheses: [],
        evidenceDigest: [],
        coreTensions: [],
        openQuestions: [],
        memorySignals: [],
        warnings: [],
      },
      pipelineEntry: 'dossier@test-model',
      warnings: [],
      degraded: false,
    },
    specialists: executionPlan.specialists
      .filter((blueprint) => blueprint.key !== 'market' && blueprint.key !== 'production')
      .map((blueprint) => ({
        key: blueprint.key,
        output: {
          perspective: {
            key: blueprint.key,
            label: blueprint.label,
            stance: 'mixed' as const,
            confidence: 60,
            verdict: `${blueprint.label} 已缓存。`,
            opportunity: '已有一版可复用判断。',
            concern: '仍需要从失败点后继续。',
            leverage: '只重跑后半段。',
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
          redTeam: undefined,
          warnings: [],
        },
        pipelineEntry: `${blueprint.key}@test-model`,
        warnings: [],
        degraded: false,
      })),
  };

  const resumeState = getSpecialistResumeState(executionPlan, checkpoints, 'market');

  assert.deepEqual(
    resumeState?.reusedCheckpoints.map((checkpoint) => checkpoint.key),
    ['systems', 'psychology', 'economy', 'red_team'],
  );
  assert.deepEqual(
    resumeState?.remainingSpecialists.map((blueprint) => blueprint.key),
    ['market', 'production'],
  );
});
