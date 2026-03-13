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
import type { Dossier, SpecialistOutput } from './types';

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
