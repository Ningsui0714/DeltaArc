import type { SandboxAnalysisResult } from '../sandbox';
import {
  clampPercent,
  ensureString,
  ensureStringArray,
  JsonRecord,
  requireArray,
  requireOneOf,
  requirePercent,
  requireRecord,
  requireString,
  requireStringArray,
} from './common';
import { createFallbackAnalysis } from './sandboxResultFallback';
import {
  createAnalysisMeta,
  createAnalysisRequestId,
  normalizeSandboxAnalysisMeta,
  parseSandboxAnalysisMeta,
} from './sandboxResultMeta';
import { extractJsonObject, repairJsonObjectLocally } from './sandboxResultJson';
import {
  normalizeBlindSpots,
  normalizeCommunityRhythms,
  normalizeContrarianMoves,
  normalizeDecisionLenses,
  normalizeEvidenceLevel,
  normalizeFutureTimeline,
  normalizeHypothesisCards,
  normalizeMemorySignals,
  normalizePersonaCards,
  normalizePerspectives,
  normalizeRedTeam,
  normalizeReport,
  normalizeScenarioVariants,
  normalizeScoreSet,
  normalizeSecondOrderEffects,
  normalizeStrategyCards,
  normalizeTrajectorySignals,
  normalizeUnknowns,
  normalizeValidationTracks,
} from './sandboxResultNormalizers';
import { analysisModes } from './sandboxResultOptions';

export {
  createAnalysisMeta,
  createAnalysisRequestId,
  createFallbackAnalysis,
  extractJsonObject,
  repairJsonObjectLocally,
  normalizeBlindSpots,
  normalizeCommunityRhythms,
  normalizeContrarianMoves,
  normalizeDecisionLenses,
  normalizeEvidenceLevel,
  normalizeFutureTimeline,
  normalizeHypothesisCards,
  normalizeMemorySignals,
  normalizePersonaCards,
  normalizePerspectives,
  normalizeRedTeam,
  normalizeReport,
  normalizeSandboxAnalysisMeta,
  normalizeScenarioVariants,
  normalizeScoreSet,
  normalizeSecondOrderEffects,
  normalizeStrategyCards,
  normalizeTrajectorySignals,
  normalizeUnknowns,
  normalizeValidationTracks,
  parseSandboxAnalysisMeta,
};

function mergeWarnings(primary: unknown, fallback: string[]) {
  return Array.from(new Set([...fallback, ...ensureStringArray(primary)]));
}

export function normalizeFinalAnalysis(parsed: JsonRecord, fallback: SandboxAnalysisResult): SandboxAnalysisResult {
  return {
    generatedAt: ensureString(parsed.generatedAt, fallback.generatedAt),
    mode: fallback.mode,
    model: ensureString(parsed.model, fallback.model),
    pipeline: ensureStringArray(parsed.pipeline, fallback.pipeline),
    meta: normalizeSandboxAnalysisMeta(parsed.meta, fallback.meta),
    summary: ensureString(parsed.summary, fallback.summary),
    systemVerdict: ensureString(parsed.systemVerdict, fallback.systemVerdict),
    evidenceLevel: normalizeEvidenceLevel(parsed.evidenceLevel, fallback.evidenceLevel),
    primaryRisk: ensureString(parsed.primaryRisk, fallback.primaryRisk),
    nextStep: ensureString(parsed.nextStep, fallback.nextStep),
    playerAcceptance: clampPercent(parsed.playerAcceptance, fallback.playerAcceptance),
    confidence: clampPercent(parsed.confidence, fallback.confidence),
    supportRatio: clampPercent(parsed.supportRatio, fallback.supportRatio),
    scores: normalizeScoreSet(parsed.scores, fallback.scores),
    personas: normalizePersonaCards(parsed.personas, fallback.personas),
    hypotheses: normalizeHypothesisCards(parsed.hypotheses, fallback.hypotheses),
    strategies: normalizeStrategyCards(parsed.strategies, fallback.strategies),
    perspectives: normalizePerspectives(parsed.perspectives, fallback.perspectives),
    blindSpots: normalizeBlindSpots(parsed.blindSpots, fallback.blindSpots),
    secondOrderEffects: normalizeSecondOrderEffects(parsed.secondOrderEffects, fallback.secondOrderEffects),
    scenarioVariants: normalizeScenarioVariants(parsed.scenarioVariants, fallback.scenarioVariants),
    futureTimeline: normalizeFutureTimeline(parsed.futureTimeline, fallback.futureTimeline),
    communityRhythms: normalizeCommunityRhythms(parsed.communityRhythms, fallback.communityRhythms),
    trajectorySignals: normalizeTrajectorySignals(parsed.trajectorySignals, fallback.trajectorySignals),
    decisionLenses: normalizeDecisionLenses(parsed.decisionLenses, fallback.decisionLenses),
    validationTracks: normalizeValidationTracks(parsed.validationTracks, fallback.validationTracks),
    contrarianMoves: normalizeContrarianMoves(parsed.contrarianMoves, fallback.contrarianMoves),
    unknowns: normalizeUnknowns(parsed.unknowns, fallback.unknowns),
    redTeam: normalizeRedTeam(parsed.redTeam, fallback.redTeam),
    memorySignals: normalizeMemorySignals(parsed.memorySignals, fallback.memorySignals),
    report: normalizeReport(parsed.report, fallback.report),
    warnings: mergeWarnings(parsed.warnings, fallback.warnings),
  };
}

export function parseSandboxAnalysisResult(input: unknown): SandboxAnalysisResult {
  const parsed = requireRecord(input, 'analysis result');
  const meta = parseSandboxAnalysisMeta(parsed.meta);
  const mode = requireOneOf(parsed.mode, analysisModes, 'mode');
  const generatedAt = requireString(parsed.generatedAt, 'generatedAt');
  const model = requireString(parsed.model, 'model');
  const pipeline = requireStringArray(parsed.pipeline, 'pipeline');

  requireString(parsed.summary, 'summary');
  requireString(parsed.systemVerdict, 'systemVerdict');
  requireString(parsed.primaryRisk, 'primaryRisk');
  requireString(parsed.nextStep, 'nextStep');
  requirePercent(parsed.playerAcceptance, 'playerAcceptance');
  requirePercent(parsed.confidence, 'confidence');
  requirePercent(parsed.supportRatio, 'supportRatio');
  requireRecord(parsed.scores, 'scores');
  requireArray(parsed.personas, 'personas');
  requireArray(parsed.hypotheses, 'hypotheses');
  requireArray(parsed.strategies, 'strategies');
  requireArray(parsed.perspectives, 'perspectives');
  requireArray(parsed.blindSpots, 'blindSpots');
  requireArray(parsed.secondOrderEffects, 'secondOrderEffects');
  requireArray(parsed.scenarioVariants, 'scenarioVariants');
  requireArray(parsed.futureTimeline, 'futureTimeline');
  requireArray(parsed.communityRhythms, 'communityRhythms');
  requireArray(parsed.trajectorySignals, 'trajectorySignals');
  requireArray(parsed.decisionLenses, 'decisionLenses');
  requireArray(parsed.validationTracks, 'validationTracks');
  requireArray(parsed.contrarianMoves, 'contrarianMoves');
  requireArray(parsed.unknowns, 'unknowns');
  requireRecord(parsed.redTeam, 'redTeam');
  requireArray(parsed.memorySignals, 'memorySignals');
  requireRecord(parsed.report, 'report');
  requireArray(parsed.warnings, 'warnings');

  return {
    ...normalizeFinalAnalysis(parsed, createFallbackAnalysis(mode, model, pipeline, meta)),
    generatedAt,
    mode,
    model,
    pipeline,
    meta,
  };
}
