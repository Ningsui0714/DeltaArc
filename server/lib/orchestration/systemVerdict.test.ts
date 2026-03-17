import assert from 'node:assert/strict';
import test from 'node:test';
import { createAnalysisMeta, createFallbackAnalysis } from '../normalizeSandboxResult';
import { ensureProjectSpecificSystemVerdict } from './systemVerdict';
import type { Dossier } from './types';

function createDossier(): Dossier {
  return {
    systemFrame: '新角色、怀旧活动、赛季更新和平台迁移一起决定这轮运营强度能否转成留存。',
    opportunityThesis: '新角色首发、怀旧活动和赛季更新仍有共同拉动回流与讨论热度的机会。',
    evidenceLevel: 'low',
    playerAcceptance: 65,
    confidence: 42,
    supportRatio: 50,
    scores: {
      coreFun: 70,
      learningCost: 50,
      novelty: 62,
      acceptanceRisk: 78,
      prototypeCost: 88,
    },
    personas: [],
    hypotheses: [],
    evidenceDigest: [],
    coreTensions: ['高关注度能否真正转成稳定回流仍缺少验证'],
    openQuestions: ['Varka 和 Flins 返场到底能带来多少真实回流'],
    memorySignals: [],
    warnings: [],
  };
}

test('ensureProjectSpecificSystemVerdict rewrites stock verdicts into project-specific judgment', () => {
  const dossier = createDossier();
  const result = ensureProjectSpecificSystemVerdict(dossier, {
    ...createFallbackAnalysis(
      'reasoning',
      'multi-stage: deepseek-chat + deepseek-reasoner',
      ['dossier@test-model', 'synthesis@test-model'],
      createAnalysisMeta('remote', 'fresh', 'analysis_test_verdict'),
    ),
    summary:
      '基于公开信息，这一轮版本仍在依赖新角色、怀旧活动、赛季化更新和平台迁移共同维持活跃、付费与口碑。',
    systemVerdict: '方向暂不宜乐观扩张，先用更小成本验证关键前提。',
    primaryRisk:
      '关键驱动因素效果未经验证，若吸引力不足或响应不佳，可能导致活跃下降、付费减少和口碑恶化。',
    nextStep: '验证 Varka 和 Flins 返场对玩家回流、付费率和口碑的具体影响。',
    confidence: 40,
    supportRatio: 50,
  });

  assert.notEqual(result.systemVerdict, '方向暂不宜乐观扩张，先用更小成本验证关键前提。');
  assert.match(result.systemVerdict, /机会在于/);
  assert.match(result.systemVerdict, /下一步先/);
  assert.match(result.systemVerdict, /新角色首发、怀旧活动和赛季更新/);
  assert.match(result.systemVerdict, /关键驱动因素效果未经验证/);
});

test('ensureProjectSpecificSystemVerdict keeps already specific verdicts unchanged', () => {
  const dossier = createDossier();
  const specificVerdict =
    '机会在于新角色首发和怀旧活动仍可能共同拉动回流；但 PS4 迁移影响还没被验证，下一步先补迁移与留存数据。';
  const result = ensureProjectSpecificSystemVerdict(dossier, {
    ...createFallbackAnalysis(
      'reasoning',
      'multi-stage: deepseek-chat + deepseek-reasoner',
      ['dossier@test-model', 'synthesis@test-model'],
      createAnalysisMeta('remote', 'fresh', 'analysis_test_specific_verdict'),
    ),
    summary:
      '基于公开信息，这一轮版本仍在依赖新角色、怀旧活动、赛季化更新和平台迁移共同维持活跃、付费与口碑。',
    systemVerdict: specificVerdict,
    primaryRisk:
      '关键驱动因素效果未经验证，若吸引力不足或响应不佳，可能导致活跃下降、付费减少和口碑恶化。',
    nextStep: '验证 Varka 和 Flins 返场对玩家回流、付费率和口碑的具体影响。',
    confidence: 40,
    supportRatio: 50,
  });

  assert.equal(result.systemVerdict, specificVerdict);
});
