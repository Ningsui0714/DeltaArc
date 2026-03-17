import type {
  SandboxAnalysisRequest,
  SandboxAnalysisResult,
  SandboxMemorySignal,
} from '../../../shared/sandbox';
import { filterVisibleAnalysisWarnings } from '../../../shared/analysisWarnings';
import { createAnalysisMeta, createFallbackAnalysis } from '../normalizeSandboxResult';
import type { Dossier, SpecialistOutput } from './types';
import {
  buildCommunityRhythmsFromFallback,
  buildFutureTimelineFromFallback,
  buildTrajectorySignalsFromFallback,
} from './fallbackShared';
import { dedupeBy } from './utils';

function getFallbackSystemVerdict(
  dossier: Dossier,
  specialistOutputs: SpecialistOutput[],
) {
  const bullishCount = specialistOutputs.filter(
    (output) => output.perspective.stance === 'bullish',
  ).length;
  const bearishCount = specialistOutputs.filter(
    (output) => output.perspective.stance === 'bearish',
  ).length;

  if (bullishCount > bearishCount && dossier.supportRatio >= 60 && dossier.confidence >= 55) {
    return '方向值得推进，但必须依赖多轮验证而不是单点乐观。';
  }

  if (
    bearishCount >= 2 ||
    (bearishCount > bullishCount &&
      dossier.supportRatio <= 50 &&
      dossier.confidence <= 55)
  ) {
    return '方向暂不宜乐观扩张，先用更小成本验证关键前提。';
  }

  return '方向有继续验证的价值，但当前更适合围绕分歧最大的前提做小步试探。';
}

export function buildProvisionalFallback(
  request: SandboxAnalysisRequest,
  dossier: Dossier,
  specialistOutputs: SpecialistOutput[],
  pipeline: string[],
  modelSummary: string,
  warnings: string[],
): SandboxAnalysisResult {
  const perspectives = specialistOutputs.map((output) => output.perspective);
  const blindSpots = dedupeBy(
    specialistOutputs.flatMap((output) => output.blindSpots),
    (item) => item.area,
    6,
  );
  const secondOrderEffects = dedupeBy(
    specialistOutputs.flatMap((output) => output.secondOrderEffects),
    (item) => `${item.trigger}-${item.outcome}`,
    6,
  );
  const scenarioVariants = dedupeBy(
    specialistOutputs.flatMap((output) => output.scenarioVariants),
    (item) => item.name,
    4,
  );
  const decisionLenses = dedupeBy(
    specialistOutputs.flatMap((output) => output.decisionLenses),
    (item) => item.name,
    5,
  );
  const validationTracks = dedupeBy(
    specialistOutputs.flatMap((output) => output.validationTracks),
    (item) => item.name,
    5,
  );
  const contrarianMoves = dedupeBy(
    specialistOutputs.flatMap((output) => output.contrarianMoves),
    (item) => item.title,
    4,
  );
  const unknowns = dedupeBy(
    specialistOutputs.flatMap((output) => output.unknowns),
    (item) => item.topic,
    5,
  );
  const strategies = dedupeBy(
    specialistOutputs.flatMap((output) => output.strategyIdeas),
    (item) => item.name,
    4,
  );
  const redTeam =
    specialistOutputs.find((output) => output.perspective.key === 'red_team')?.redTeam ?? {
      thesis: '当前缺少更尖锐的反方论证。',
      attackVectors: [],
      failureModes: [],
      mitigation: '优先补反证。',
    };

  const fallback = createFallbackAnalysis(
    request.mode,
    modelSummary,
    pipeline,
    createAnalysisMeta('remote', 'degraded'),
  );
  const resolvedStrategies = strategies.length > 0 ? strategies : fallback.strategies;
  const futureTimeline = buildFutureTimelineFromFallback(request, dossier, scenarioVariants, validationTracks);
  const communityRhythms = buildCommunityRhythmsFromFallback(request, dossier, resolvedStrategies);
  const trajectorySignals = buildTrajectorySignalsFromFallback(secondOrderEffects, validationTracks, redTeam);
  const visibleWarnings = filterVisibleAnalysisWarnings(warnings);

  return {
    ...fallback,
    summary: dossier.opportunityThesis,
    systemVerdict: getFallbackSystemVerdict(dossier, specialistOutputs),
    evidenceLevel: dossier.evidenceLevel,
    primaryRisk: blindSpots[0]?.whyItMatters ?? redTeam.thesis,
    nextStep: validationTracks[0]?.goal ?? dossier.openQuestions[0] ?? fallback.nextStep,
    playerAcceptance: dossier.playerAcceptance,
    confidence: dossier.confidence,
    supportRatio: dossier.supportRatio,
    scores: dossier.scores,
    personas: dossier.personas,
    hypotheses: dossier.hypotheses,
    strategies: resolvedStrategies,
    perspectives: perspectives.length > 0 ? perspectives : fallback.perspectives,
    blindSpots: blindSpots.length > 0 ? blindSpots : fallback.blindSpots,
    secondOrderEffects,
    scenarioVariants,
    futureTimeline,
    communityRhythms,
    trajectorySignals,
    decisionLenses,
    validationTracks,
    contrarianMoves,
    unknowns,
    redTeam,
    memorySignals: dossier.memorySignals as SandboxMemorySignal[],
    report: {
      headline: '多阶段推演已完成，下一步应以验证而不是辩论继续收敛',
      summary: dossier.systemFrame,
      conclusion: '当前结果已经不再只是单个模型的直觉判断，而是多视角冲突后的暂时结论。',
      whyNow: '在证据仍不完备时，越早把不同视角和失败路径显性化，后续迭代成本越低。',
      risk: redTeam.thesis,
      actions:
        validationTracks.length > 0
          ? validationTracks.slice(0, 4).map((item) => `${item.priority} ${item.goal}`)
          : fallback.report.actions,
    },
    warnings: visibleWarnings,
  };
}

export function buildProvisionalSeed(
  request: SandboxAnalysisRequest,
  dossier: Dossier,
  specialistOutputs: SpecialistOutput[],
  pipeline: string[],
  modelSummary: string,
  warnings: string[],
): SandboxAnalysisResult {
  const perspectives = specialistOutputs.map((output) => output.perspective);
  const blindSpots = dedupeBy(
    specialistOutputs.flatMap((output) => output.blindSpots),
    (item) => item.area,
    6,
  );
  const secondOrderEffects = dedupeBy(
    specialistOutputs.flatMap((output) => output.secondOrderEffects),
    (item) => `${item.trigger}-${item.outcome}`,
    6,
  );
  const scenarioVariants = dedupeBy(
    specialistOutputs.flatMap((output) => output.scenarioVariants),
    (item) => item.name,
    4,
  );
  const decisionLenses = dedupeBy(
    specialistOutputs.flatMap((output) => output.decisionLenses),
    (item) => item.name,
    5,
  );
  const validationTracks = dedupeBy(
    specialistOutputs.flatMap((output) => output.validationTracks),
    (item) => item.name,
    5,
  );
  const contrarianMoves = dedupeBy(
    specialistOutputs.flatMap((output) => output.contrarianMoves),
    (item) => item.title,
    4,
  );
  const unknowns = dedupeBy(
    specialistOutputs.flatMap((output) => output.unknowns),
    (item) => item.topic,
    5,
  );
  const strategies = dedupeBy(
    specialistOutputs.flatMap((output) => output.strategyIdeas),
    (item) => item.name,
    4,
  );
  const redTeam =
    specialistOutputs.find((output) => output.perspective.key === 'red_team')?.redTeam ?? {
      thesis: '当前还没有足够证据去收束反方结论。',
      attackVectors: [],
      failureModes: [],
      mitigation: '先把分歧最大的前提变成可观察信号。',
    };
  const base = createFallbackAnalysis(
    request.mode,
    modelSummary,
    pipeline,
    createAnalysisMeta('remote', 'fresh'),
  );
  const visibleWarnings = filterVisibleAnalysisWarnings(warnings);

  return {
    ...base,
    summary: dossier.opportunityThesis,
    systemVerdict: '待综合各视角后收束最终结论。',
    evidenceLevel: dossier.evidenceLevel,
    primaryRisk: blindSpots[0]?.whyItMatters ?? redTeam.thesis,
    nextStep:
      validationTracks[0]?.goal ?? dossier.openQuestions[0] ?? '待确定下一步验证动作。',
    playerAcceptance: dossier.playerAcceptance,
    confidence: dossier.confidence,
    supportRatio: dossier.supportRatio,
    scores: dossier.scores,
    personas: dossier.personas,
    hypotheses: dossier.hypotheses,
    strategies,
    perspectives,
    blindSpots,
    secondOrderEffects,
    scenarioVariants,
    futureTimeline: [],
    communityRhythms: [],
    trajectorySignals: [],
    decisionLenses,
    validationTracks,
    contrarianMoves,
    unknowns,
    redTeam,
    memorySignals: dossier.memorySignals as SandboxMemorySignal[],
    report: {
      headline: '待综合多视角结果后收束最终判断',
      summary: dossier.systemFrame,
      conclusion: '',
      whyNow: '',
      risk: blindSpots[0]?.whyItMatters ?? redTeam.thesis,
      actions: validationTracks
        .slice(0, 4)
        .map((item) => `${item.priority} ${item.goal}`),
    },
    warnings: visibleWarnings,
  };
}
