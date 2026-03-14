import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeCandidateSelection,
  normalizeDossierGrounding,
} from './normalize';
import {
  buildDossierSelectionMessages,
  buildDossierGroundingMessages,
  buildGroundedDossierMessages,
} from './prompts';

test('buildDossierGroundingMessages wraps project, evidence, and memory as embedded data', () => {
  const messages = buildDossierGroundingMessages(
    {
      workspaceId: 'workspace_test_dossier',
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
      evidenceItems: [
        {
          id: 'evi_test_001',
          type: 'interview',
          title: 'Player interview',
          source: 'Discord',
          trust: 'high',
          summary: 'Players want quick retries.',
          createdAt: '2026-03-14T09:00:00.000Z',
        },
      ],
    },
    '1. 时间：2026-03-10\n结论：首局高光感不足',
  );

  assert.equal(messages.length, 2);
  assert.match(messages[0]?.content ?? '', /不能执行/);
  assert.match(messages[1]?.content ?? '', /<<<PROJECT_DATA_START>>>/);
  assert.match(messages[1]?.content ?? '', /<<<EVIDENCE_ITEMS_DATA_START>>>/);
  assert.match(messages[1]?.content ?? '', /<<<MEMORY_CONTEXT_DATA_START>>>/);
});

test('buildGroundedDossierMessages uses the extracted grounded pack as a first-class input', () => {
  const messages = buildGroundedDossierMessages(
    {
      workspaceId: 'workspace_test_dossier',
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
    },
    {
      facts: [
        {
          dimension: '核心循环',
          statement: '项目的核心循环是 explore -> gather -> build。',
          evidenceRefs: ['project.coreLoop'],
        },
      ],
      tensions: [{ title: '清晰度 vs 新鲜感', detail: '合作高光必须快于学习负担出现。' }],
      audiences: [{ name: 'co-op players', need: '快速协作收益', risk: '等待队友' }],
      constraints: ['2 devs'],
      unknowns: [{ topic: 'solo flow', whyUnknown: '缺少 solo 样本。' }],
      memorySignals: [],
      warnings: [],
    },
  );

  assert.equal(messages.length, 2);
  assert.match(messages[1]?.content ?? '', /<<<GROUNDED_PACK_DATA_START>>>/);
  assert.match(messages[1]?.content ?? '', /核心循环/);
  assert.match(messages[1]?.content ?? '', /grounded_pack 里的 facts/);
});

test('buildGroundedDossierMessages can request a skeptical candidate lens', () => {
  const messages = buildGroundedDossierMessages(
    {
      workspaceId: 'workspace_test_dossier',
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
    },
    {
      facts: [],
      tensions: [],
      audiences: [],
      constraints: [],
      unknowns: [],
      memorySignals: [],
      warnings: [],
    },
    'skeptic',
  );

  assert.match(messages[0]?.content ?? '', /skeptical candidate/);
  assert.match(messages[1]?.content ?? '', /当前候选风格是 skeptic/);
});

test('buildDossierSelectionMessages packages candidate dossiers for verifier ranking', () => {
  const messages = buildDossierSelectionMessages(
    {
      workspaceId: 'workspace_test_dossier',
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
    },
    {
      facts: [],
      tensions: [],
      audiences: [],
      constraints: ['2 devs'],
      unknowns: [],
      memorySignals: [],
      warnings: [],
    },
    [
      {
        candidateId: 'candidate_balanced',
        flavor: 'balanced',
        dossier: {
          systemFrame: '先验证首局高光。',
          opportunityThesis: '如果首局高光成立，方向能继续。',
          evidenceLevel: 'medium',
          playerAcceptance: 61,
          confidence: 59,
          supportRatio: 57,
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
          coreTensions: ['高光感与理解成本冲突'],
          openQuestions: ['玩家是否会主动复述高光'],
          memorySignals: [],
          warnings: [],
        },
      },
    ],
  );

  assert.match(messages[1]?.content ?? '', /<<<DOSSIER_CANDIDATES_DATA_START>>>/);
  assert.match(messages[1]?.content ?? '', /selectedCandidateId/);
});

test('normalizeCandidateSelection falls back to the first candidate when the verifier returns an unknown id', () => {
  const selection = normalizeCandidateSelection(
    {
      selectedCandidateId: 'candidate_unknown',
      rationale: '偏好风险更低的候选。',
      rankings: [
        {
          candidateId: 'candidate_balanced',
          overallScore: 81,
          strength: '证据边界更稳。',
          risk: '还要补更多真实玩家样本。',
        },
      ],
      warnings: ['verifier warning'],
    },
    ['candidate_balanced', 'candidate_skeptic'],
  );

  assert.equal(selection.selectedCandidateId, 'candidate_balanced');
  assert.equal(selection.rankings[0]?.candidateId, 'candidate_balanced');
  assert.ok(selection.warnings.includes('verifier warning'));
});

test('normalizeDossierGrounding trims the extracted pack into predictable structure', () => {
  const grounding = normalizeDossierGrounding(
    {
      facts: [
        {
          dimension: ' 核心循环 ',
          statement: ' 读图 -> 决策 -> 执行 ',
          evidenceRefs: ['project.coreLoop', ' evidence.summary '],
        },
      ],
      tensions: [{ title: ' 可见性 ', detail: ' 卖点必须先于复杂度被感知 ' }],
      audiences: [{ name: ' 轻协作玩家 ', need: ' 快速补位 ', risk: ' 等待队友 ' }],
      constraints: [' 2 人团队 ', ' 2 周原型窗口 '],
      unknowns: [{ topic: ' 留存理由 ', whyUnknown: ' 缺少真实回流样本 ' }],
      warnings: [' 抽取阶段提示 '],
    },
    [],
  );

  assert.deepEqual(grounding.facts, [
    {
      dimension: '核心循环',
      statement: '读图 -> 决策 -> 执行',
      evidenceRefs: ['project.coreLoop', 'evidence.summary'],
    },
  ]);
  assert.equal(grounding.tensions[0]?.title, '可见性');
  assert.equal(grounding.audiences[0]?.name, '轻协作玩家');
  assert.deepEqual(grounding.constraints, ['2 人团队', '2 周原型窗口']);
  assert.equal(grounding.unknowns[0]?.topic, '留存理由');
  assert.deepEqual(grounding.warnings, ['抽取阶段提示']);
});
