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
    systemVerdict:
      perspectives.filter((item) => item.stance === 'bullish').length >
      perspectives.filter((item) => item.stance === 'bearish').length
        ? '方向值得推进，但必须依赖多轮验证而不是单点乐观。'
        : '方向暂不宜乐观扩张，先用更小成本验证关键前提。',
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
