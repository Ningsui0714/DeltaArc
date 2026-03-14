import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAnalysisMeta,
  createFallbackAnalysis,
  extractJsonObject,
  normalizeFinalAnalysis,
  repairJsonObjectLocally,
} from './sandboxResult';

test('repairJsonObjectLocally escapes nested quotes inside string values', () => {
  const malformed = '{"summary":"他说 "你好" 并继续分析","count":1}';
  const repaired = repairJsonObjectLocally(malformed);
  const parsed = JSON.parse(repaired) as { summary: string; count: number };

  assert.equal(parsed.summary, '他说 "你好" 并继续分析');
  assert.equal(parsed.count, 1);
});

test('repairJsonObjectLocally inserts missing commas and preserves newlines inside strings', () => {
  const malformed = '{"summary":"line1\nline2" "flag": true "score": 3}';
  const repaired = repairJsonObjectLocally(malformed);
  const parsed = JSON.parse(repaired) as { summary: string; flag: boolean; score: number };

  assert.equal(parsed.summary, 'line1\nline2');
  assert.equal(parsed.flag, true);
  assert.equal(parsed.score, 3);
});

test('extractJsonObject remains strict without local repair candidates', () => {
  assert.throws(
    () => extractJsonObject('{"summary":"bad "quote" here"}'),
    /Expected ',' or '}' after property value in JSON/,
  );
});

test('normalizeFinalAnalysis preserves fallback warnings alongside model warnings', () => {
  const fallback = createFallbackAnalysis(
    'balanced',
    'fixture-model',
    ['dossier@fixture-model'],
    createAnalysisMeta('remote', 'degraded', 'analysis_fixture'),
  );

  const normalized = normalizeFinalAnalysis(
    {
      ...fallback,
      warnings: ['模型自己追加的提示'],
    },
    {
      ...fallback,
      warnings: ['dossier JSON required one repair pass after the initial parse failed.'],
    },
  );

  assert.deepEqual(normalized.warnings, [
    'dossier JSON required one repair pass after the initial parse failed.',
    '模型自己追加的提示',
  ]);
});

test('normalizeFinalAnalysis preserves verifier and reverse-check metadata from the fallback result', () => {
  const fallback = createFallbackAnalysis(
    'reasoning',
    'fixture-model',
    ['dossier@fixture-model', 'synthesis@fixture-model'],
    {
      ...createAnalysisMeta('remote', 'fresh', 'analysis_fixture_meta'),
      dossierSelection: {
        stage: 'dossier',
        candidateCount: 3,
        selectedCandidateId: 'candidate_skeptic',
        selectedFlavor: 'skeptic',
        decisionMode: 'verifier',
        rationale: '证据边界最稳。',
        rankings: [
          {
            candidateId: 'candidate_skeptic',
            overallScore: 83,
            strength: '约束意识最强。',
            risk: '仍需更多玩家样本。',
          },
        ],
      },
      actionBriefSelection: {
        stage: 'action_brief',
        candidateCount: 3,
        selectedCandidateId: 'brief_execution_first',
        selectedFlavor: 'execution_first',
        decisionMode: 'verifier',
        rationale: '两周动作最具体。',
        rankings: [],
      },
      reverseCheck: {
        tightened: true,
        fragilitySummary: '当前判断仍依赖首局高光成立。',
        necessaryConditions: [
          {
            condition: '玩家会主动复述高光',
            status: 'unsupported',
            evidenceRefs: ['evi_test_001'],
            impact: '若不成立，结论会明显收缩。',
          },
        ],
      },
    },
  );

  const normalized = normalizeFinalAnalysis(
    {
      ...fallback,
      summary: '收缩后的摘要',
    },
    fallback,
  );

  assert.equal(normalized.meta.dossierSelection?.selectedFlavor, 'skeptic');
  assert.equal(normalized.meta.actionBriefSelection?.selectedFlavor, 'execution_first');
  assert.equal(normalized.meta.reverseCheck?.tightened, true);
  assert.equal(normalized.meta.reverseCheck?.necessaryConditions[0]?.status, 'unsupported');
});
