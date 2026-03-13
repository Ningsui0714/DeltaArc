import type { HypothesisCard, PersonaCard, StrategyCard } from '../domain';
import type {
  SandboxBlindSpot,
  SandboxCommunityRhythm,
  SandboxContrarianMove,
  SandboxDecisionLens,
  SandboxEvidenceLevel,
  SandboxFutureTimelineItem,
  SandboxMemorySignal,
  SandboxPerspective,
  SandboxRedTeamReport,
  SandboxReport,
  SandboxScenarioVariant,
  SandboxScoreSet,
  SandboxSecondOrderEffect,
  SandboxTrajectorySignal,
  SandboxUnknown,
  SandboxValidationTrack,
} from '../sandbox';
import {
  clampPercent,
  ensureRecord,
  ensureRecordArray,
  ensureString,
  ensureStringArray,
} from './common';
import {
  effectDirections,
  effectHorizons,
  evidenceLevels,
  memoryStrengths,
  perspectiveKeys,
  perspectiveStances,
  validationPriorities,
} from './sandboxResultOptions';

export function normalizeEvidenceLevel(value: unknown, fallback: SandboxEvidenceLevel) {
  return oneOf(value, evidenceLevels, fallback);
}

export function normalizeScoreSet(value: unknown, fallback: SandboxScoreSet): SandboxScoreSet {
  const record = ensureRecord(value);

  return {
    coreFun: clampPercent(record.coreFun, fallback.coreFun),
    learningCost: clampPercent(record.learningCost, fallback.learningCost),
    novelty: clampPercent(record.novelty, fallback.novelty),
    acceptanceRisk: clampPercent(record.acceptanceRisk, fallback.acceptanceRisk),
    prototypeCost: clampPercent(record.prototypeCost, fallback.prototypeCost),
  };
}

export function normalizePersonaCards(value: unknown, fallback: PersonaCard[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    name: ensureString(item.name, `Persona ${index + 1}`),
    motive: ensureString(item.motive, 'The core motivation still needs clearer support.'),
    accepts: ensureString(item.accepts, 'Positive triggers are still unclear.'),
    rejects: ensureString(item.rejects, 'Negative triggers are still unclear.'),
    verdict: ensureString(item.verdict, 'The verdict is still provisional.'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeHypothesisCards(value: unknown, fallback: HypothesisCard[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    title: ensureString(item.title, `Hypothesis ${index + 1}`),
    evidence: ensureString(item.evidence, 'This still needs clearer evidence.'),
    confidence: clampPercent(item.confidence, 55) / 100,
    gap: ensureString(item.gap, 'The validation gap is not clear yet.'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeStrategyCards(value: unknown, fallback: StrategyCard[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    name: ensureString(item.name, `Strategy ${index + 1}`),
    type: ensureString(item.type, 'Uncategorized'),
    cost: ensureString(item.cost, 'M'),
    timeToValue: ensureString(item.timeToValue, '2 weeks'),
    acceptance: clampPercent(item.acceptance, 60),
    risk: ensureString(item.risk, 'The main risk is not specified yet.'),
    recommendation: ensureString(item.recommendation, 'Run a smaller validation step first.'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizePerspectives(value: unknown, fallback: SandboxPerspective[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    key: oneOf(item.key, perspectiveKeys, perspectiveKeys[index] ?? 'systems'),
    label: ensureString(item.label, `Perspective ${index + 1}`),
    stance: oneOf(item.stance, perspectiveStances, 'mixed'),
    confidence: clampPercent(item.confidence, 60),
    verdict: ensureString(item.verdict, 'This perspective does not have a clear verdict yet.'),
    opportunity: ensureString(item.opportunity, 'The opportunity is still unclear.'),
    concern: ensureString(item.concern, 'The main concern is still unclear.'),
    leverage: ensureString(item.leverage, 'No clear leverage point has been identified yet.'),
    evidenceRefs: ensureStringArray(item.evidenceRefs),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeBlindSpots(value: unknown, fallback: SandboxBlindSpot[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    area: ensureString(item.area, `Blind spot ${index + 1}`),
    whyItMatters: ensureString(item.whyItMatters, 'The impact still needs explanation.'),
    missingEvidence: ensureString(item.missingEvidence, 'Missing evidence is not specified yet.'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeSecondOrderEffects(
  value: unknown,
  fallback: SandboxSecondOrderEffect[] = [],
) {
  const items = ensureRecordArray(value).map((item, index) => ({
    trigger: ensureString(item.trigger, `Second-order trigger ${index + 1}`),
    outcome: ensureString(item.outcome, 'The second-order outcome still needs explanation.'),
    horizon: oneOf(item.horizon, effectHorizons, 'mid'),
    direction: oneOf(item.direction, effectDirections, 'mixed'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeScenarioVariants(value: unknown, fallback: SandboxScenarioVariant[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    name: ensureString(item.name, `Scenario ${index + 1}`),
    premise: ensureString(item.premise, 'The premise is still unclear.'),
    upside: ensureString(item.upside, 'The upside is still unclear.'),
    downside: ensureString(item.downside, 'The downside is still unclear.'),
    watchSignals: ensureStringArray(item.watchSignals),
    recommendedMove: ensureString(item.recommendedMove, 'Gather more evidence before committing.'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeFutureTimeline(
  value: unknown,
  fallback: SandboxFutureTimelineItem[] = [],
): SandboxFutureTimelineItem[] {
  const items = ensureRecordArray(value).map((item, index) => ({
    phase: ensureString(item.phase, `Timeline beat ${index + 1}`),
    timing: ensureString(item.timing, 'Shortly after release'),
    expectedReaction: ensureString(item.expectedReaction, 'The first reaction is not clear enough yet.'),
    likelyShift: ensureString(
      item.likelyShift,
      'How the narrative evolves from this beat is still uncertain.',
    ),
    risk: ensureString(item.risk, 'The main risk for this beat is still unclear.'),
    watchSignals: ensureStringArray(item.watchSignals),
    recommendedResponse: ensureString(
      item.recommendedResponse,
      'Prepare a response plan before this beat arrives.',
    ),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeCommunityRhythms(
  value: unknown,
  fallback: SandboxCommunityRhythm[] = [],
): SandboxCommunityRhythm[] {
  const items = ensureRecordArray(value).map((item, index) => ({
    name: ensureString(item.name, `Community rhythm ${index + 1}`),
    timing: ensureString(item.timing, 'Within the next discussion cycle'),
    pattern: ensureString(item.pattern, 'The discussion pattern is not specified yet.'),
    trigger: ensureString(item.trigger, 'The trigger for this rhythm is not specified yet.'),
    implication: ensureString(
      item.implication,
      'What this rhythm means for the trajectory is still unclear.',
    ),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeTrajectorySignals(
  value: unknown,
  fallback: SandboxTrajectorySignal[] = [],
): SandboxTrajectorySignal[] {
  const items = ensureRecordArray(value).map((item, index) => ({
    signal: ensureString(item.signal, `Trajectory signal ${index + 1}`),
    direction: oneOf(item.direction, effectDirections, 'mixed'),
    timing: ensureString(item.timing, 'Within the next cycle'),
    impact: ensureString(item.impact, 'The impact of this signal is still unclear.'),
    recommendedMove: ensureString(
      item.recommendedMove,
      'Prepare a response before this signal becomes obvious.',
    ),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeDecisionLenses(value: unknown, fallback: SandboxDecisionLens[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    name: ensureString(item.name, `Decision lens ${index + 1}`),
    keyQuestion: ensureString(item.keyQuestion, 'The key question is not specified yet.'),
    answer: ensureString(item.answer, 'There is not enough support for a clear answer yet.'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeValidationTracks(value: unknown, fallback: SandboxValidationTrack[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    name: ensureString(item.name, `Validation track ${index + 1}`),
    priority: oneOf(item.priority, validationPriorities, 'P1'),
    goal: ensureString(item.goal, 'The validation goal is not specified yet.'),
    method: ensureString(item.method, 'The validation method is not specified yet.'),
    successSignal: ensureString(item.successSignal, 'The success signal is not specified yet.'),
    failureSignal: ensureString(item.failureSignal, 'The failure signal is not specified yet.'),
    cost: ensureString(item.cost, 'M'),
    timeframe: ensureString(item.timeframe, '2 weeks'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeContrarianMoves(value: unknown, fallback: SandboxContrarianMove[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    title: ensureString(item.title, `Contrarian move ${index + 1}`),
    thesis: ensureString(item.thesis, 'The contrarian view is not specified yet.'),
    whenToUse: ensureString(item.whenToUse, 'The usage condition is not specified yet.'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeUnknowns(value: unknown, fallback: SandboxUnknown[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    topic: ensureString(item.topic, `Unknown ${index + 1}`),
    whyUnknown: ensureString(item.whyUnknown, 'Why this remains unknown is not specified yet.'),
    resolveBy: ensureString(item.resolveBy, 'No resolution path has been specified yet.'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeRedTeam(value: unknown, fallback: SandboxRedTeamReport): SandboxRedTeamReport {
  const record = ensureRecord(value);

  return {
    thesis: ensureString(record.thesis, fallback.thesis),
    attackVectors: ensureStringArray(record.attackVectors, fallback.attackVectors),
    failureModes: ensureStringArray(record.failureModes, fallback.failureModes),
    mitigation: ensureString(record.mitigation, fallback.mitigation),
  };
}

export function normalizeMemorySignals(value: unknown, fallback: SandboxMemorySignal[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    title: ensureString(item.title, `Memory signal ${index + 1}`),
    summary: ensureString(item.summary, 'No additional memory signal is available.'),
    signalStrength: oneOf(item.signalStrength, memoryStrengths, 'fresh'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeReport(value: unknown, fallback: SandboxReport): SandboxReport {
  const record = ensureRecord(value);

  return {
    headline: ensureString(record.headline, fallback.headline),
    summary: ensureString(record.summary, fallback.summary),
    conclusion: ensureString(record.conclusion, fallback.conclusion),
    whyNow: ensureString(record.whyNow, fallback.whyNow),
    risk: ensureString(record.risk, fallback.risk),
    actions: ensureStringArray(record.actions, fallback.actions),
  };
}

function oneOf<TValue>(value: unknown, candidates: readonly TValue[], fallback: TValue) {
  return candidates.includes(value as TValue) ? (value as TValue) : fallback;
}
