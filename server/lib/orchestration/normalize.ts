import type { SandboxMemorySignal } from '../../../shared/sandbox';
import {
  clampPercent,
  ensureRecord,
  ensureRecordArray,
  ensureString,
  ensureStringArray,
  normalizeBlindSpots,
  normalizeContrarianMoves,
  normalizeDecisionLenses,
  normalizeEvidenceLevel,
  normalizeHypothesisCards,
  normalizeMemorySignals,
  normalizePerspectives,
  normalizePersonaCards,
  normalizeRedTeam,
  normalizeScenarioVariants,
  normalizeScoreSet,
  normalizeSecondOrderEffects,
  normalizeStrategyCards,
  normalizeUnknowns,
  normalizeValidationTracks,
} from '../normalizeSandboxResult';
import { createSpecialistFallback } from './fallback';
import type { SpecialistBlueprint } from './specialists';
import type {
  CandidateSelection,
  Dossier,
  DossierGrounding,
  SpecialistOutput,
} from './types';

export function normalizeDossierGrounding(
  parsed: Record<string, unknown>,
  recalledMemorySignals: SandboxMemorySignal[],
): DossierGrounding {
  return {
    facts: ensureRecordArray(parsed.facts)
      .slice(0, 12)
      .map((item, index) => ({
        dimension: ensureString(item.dimension, `维度 ${index + 1}`),
        statement: ensureString(item.statement, '当前事实仍需补充。'),
        evidenceRefs: ensureStringArray(item.evidenceRefs),
      })),
    tensions: ensureRecordArray(parsed.tensions)
      .slice(0, 6)
      .map((item, index) => ({
        title: ensureString(item.title, `张力 ${index + 1}`),
        detail: ensureString(item.detail, '张力说明仍需补充。'),
      })),
    audiences: ensureRecordArray(parsed.audiences)
      .slice(0, 4)
      .map((item, index) => ({
        name: ensureString(item.name, `人群 ${index + 1}`),
        need: ensureString(item.need, '关键诉求仍需补充。'),
        risk: ensureString(item.risk, '主要风险仍需补充。'),
      })),
    constraints: ensureStringArray(parsed.constraints).slice(0, 6),
    unknowns: ensureRecordArray(parsed.unknowns)
      .slice(0, 6)
      .map((item, index) => ({
        topic: ensureString(item.topic, `未知项 ${index + 1}`),
        whyUnknown: ensureString(item.whyUnknown, '未知原因仍需补充。'),
      })),
    memorySignals: normalizeMemorySignals(parsed.memorySignals, recalledMemorySignals),
    warnings: ensureStringArray(parsed.warnings),
  };
}

export function normalizeDossier(parsed: Record<string, unknown>, recalledMemorySignals: SandboxMemorySignal[]): Dossier {
  return {
    systemFrame: ensureString(parsed.systemFrame, '当前项目仍需重新界定系统核心和成功条件。'),
    opportunityThesis: ensureString(parsed.opportunityThesis, '项目存在机会，但仍依赖更清晰的核心价值锚点。'),
    evidenceLevel: normalizeEvidenceLevel(parsed.evidenceLevel, 'medium'),
    playerAcceptance: clampPercent(parsed.playerAcceptance, 60),
    confidence: clampPercent(parsed.confidence, 55),
    supportRatio: clampPercent(parsed.supportRatio, 58),
    scores: normalizeScoreSet(parsed.scores, {
      coreFun: 62,
      learningCost: 56,
      novelty: 68,
      acceptanceRisk: 54,
      prototypeCost: 52,
    }),
    personas: normalizePersonaCards(parsed.personas),
    hypotheses: normalizeHypothesisCards(parsed.hypotheses),
    evidenceDigest: ensureRecordArray(parsed.evidenceDigest).map((item, index) => ({
      title: ensureString(item.title, `证据 ${index + 1}`),
      signal: ensureString(item.signal, '暂无明确信号。'),
      implication: ensureString(item.implication, '影响尚不明确。'),
    })),
    coreTensions: ensureStringArray(parsed.coreTensions),
    openQuestions: ensureStringArray(parsed.openQuestions),
    memorySignals: normalizeMemorySignals(parsed.memorySignals, recalledMemorySignals),
    warnings: ensureStringArray(parsed.warnings),
  };
}

export function normalizeCandidateSelection(
  parsed: Record<string, unknown>,
  candidateIds: string[],
): CandidateSelection {
  const fallbackCandidateId = candidateIds[0] ?? 'candidate_1';
  const rawRankings = ensureRecordArray(parsed.rankings)
    .slice(0, Math.max(candidateIds.length, 1))
    .map((item, index) => ({
      candidateId: ensureString(item.candidateId, candidateIds[index] ?? fallbackCandidateId),
      overallScore: clampPercent(item.overallScore, Math.max(35, 85 - index * 10)),
      strength: ensureString(item.strength, '优势仍需补充。'),
      risk: ensureString(item.risk, '主要风险仍需补充。'),
    }))
    .filter((item) => candidateIds.includes(item.candidateId));

  const rankings =
    rawRankings.length > 0
      ? rawRankings
      : candidateIds.map((candidateId, index) => ({
          candidateId,
          overallScore: Math.max(35, 85 - index * 10),
          strength: '候选已生成，但验证排序缺失。',
          risk: '需要人工复核该候选的主要风险。',
        }));

  const selectedCandidateId = candidateIds.includes(String(parsed.selectedCandidateId ?? ''))
    ? String(parsed.selectedCandidateId)
    : rankings[0]?.candidateId ?? fallbackCandidateId;

  return {
    selectedCandidateId,
    rationale: ensureString(parsed.rationale, '验证器未返回明确理由，已按默认顺位选择。'),
    rankings,
    warnings: ensureStringArray(parsed.warnings),
  };
}

export function normalizeSpecialistOutput(
  blueprint: SpecialistBlueprint,
  parsed: Record<string, unknown>,
  dossier: Dossier,
): SpecialistOutput {
  const perspectiveList = normalizePerspectives(
    [ensureRecord(parsed.perspective, { key: blueprint.key, label: blueprint.label })],
    [createSpecialistFallback(blueprint, dossier).perspective],
  );

  return {
    perspective: perspectiveList[0],
    blindSpots: normalizeBlindSpots(parsed.blindSpots),
    secondOrderEffects: normalizeSecondOrderEffects(parsed.secondOrderEffects),
    scenarioVariants: normalizeScenarioVariants(parsed.scenarioVariants),
    decisionLenses: normalizeDecisionLenses(parsed.decisionLenses),
    validationTracks: normalizeValidationTracks(parsed.validationTracks),
    contrarianMoves: normalizeContrarianMoves(parsed.contrarianMoves),
    unknowns: normalizeUnknowns(parsed.unknowns),
    strategyIdeas: normalizeStrategyCards(parsed.strategyIdeas),
    redTeam: normalizeRedTeam(parsed.redTeam, {
      thesis: '当前还没有形成足够具体的失败假说。',
      attackVectors: [],
      failureModes: [],
      mitigation: '继续补充反证材料。',
    }),
    warnings: ensureStringArray(parsed.warnings),
  };
}
