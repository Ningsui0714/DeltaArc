import type { HypothesisCard, PersonaCard, StrategyCard } from '../domain';
import type {
  AnalysisSource,
  AnalysisStatus,
  SandboxAnalysisMeta,
  SandboxAnalysisMode,
  SandboxAnalysisResult,
  SandboxBlindSpot,
  SandboxContrarianMove,
  SandboxDecisionLens,
  SandboxEffectDirection,
  SandboxEffectHorizon,
  SandboxEvidenceLevel,
  SandboxMemorySignal,
  SandboxMemoryStrength,
  SandboxPerspective,
  SandboxPerspectiveKey,
  SandboxPerspectiveStance,
  SandboxRedTeamReport,
  SandboxReport,
  SandboxScenarioVariant,
  SandboxScoreSet,
  SandboxSecondOrderEffect,
  SandboxUnknown,
  SandboxValidationPriority,
  SandboxValidationTrack,
} from '../sandbox';
import {
  clampPercent,
  ensureRecord,
  ensureRecordArray,
  ensureString,
  ensureStringArray,
  JsonRecord,
  oneOf,
  requireArray,
  requireOneOf,
  requirePercent,
  requireRecord,
  requireString,
  requireStringArray,
} from './common';

const analysisModes: SandboxAnalysisMode[] = ['balanced', 'reasoning'];
const analysisSources: AnalysisSource[] = ['remote', 'local_fallback'];
const analysisStatuses: AnalysisStatus[] = ['fresh', 'stale', 'degraded', 'error'];
const perspectiveKeys: SandboxPerspectiveKey[] = [
  'systems',
  'psychology',
  'economy',
  'market',
  'production',
  'red_team',
];
const perspectiveStances: SandboxPerspectiveStance[] = ['bullish', 'mixed', 'bearish'];
const evidenceLevels: SandboxEvidenceLevel[] = ['low', 'medium', 'high'];
const effectHorizons: SandboxEffectHorizon[] = ['near', 'mid', 'long'];
const effectDirections: SandboxEffectDirection[] = ['positive', 'mixed', 'negative'];
const validationPriorities: SandboxValidationPriority[] = ['P0', 'P1', 'P2'];
const memoryStrengths: SandboxMemoryStrength[] = ['fresh', 'recurring', 'warning'];

export function createAnalysisRequestId(prefix = 'analysis') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createAnalysisMeta(
  source: AnalysisSource,
  status: AnalysisStatus,
  requestId = createAnalysisRequestId(source === 'remote' ? 'analysis' : 'local'),
): SandboxAnalysisMeta {
  return {
    source,
    status,
    requestId,
  };
}

export function extractJsonObject(content: string) {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('模型没有返回可解析的 JSON。');
  }

  return JSON.parse(content.slice(start, end + 1)) as JsonRecord;
}

export function normalizeSandboxAnalysisMeta(value: unknown, fallback: SandboxAnalysisMeta): SandboxAnalysisMeta {
  const record = ensureRecord(value);

  return {
    source: oneOf(record.source, analysisSources, fallback.source),
    status: oneOf(record.status, analysisStatuses, fallback.status),
    requestId: ensureString(record.requestId, fallback.requestId),
  };
}

export function parseSandboxAnalysisMeta(value: unknown): SandboxAnalysisMeta {
  const record = requireRecord(value, 'meta');

  return {
    source: requireOneOf(record.source, analysisSources, 'meta.source'),
    status: requireOneOf(record.status, analysisStatuses, 'meta.status'),
    requestId: requireString(record.requestId, 'meta.requestId'),
  };
}

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
    name: ensureString(item.name, `角色 ${index + 1}`),
    motive: ensureString(item.motive, '动机仍需补证。'),
    accepts: ensureString(item.accepts, '接受触发条件尚不明确。'),
    rejects: ensureString(item.rejects, '拒绝触发条件尚不明确。'),
    verdict: ensureString(item.verdict, '暂时保持中性判断。'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeHypothesisCards(value: unknown, fallback: HypothesisCard[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    title: ensureString(item.title, `假设 ${index + 1}`),
    evidence: ensureString(item.evidence, '需要更多证据才能判断。'),
    confidence: clampPercent(item.confidence, 55) / 100,
    gap: ensureString(item.gap, '还没有明确的验证缺口描述。'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeStrategyCards(value: unknown, fallback: StrategyCard[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    name: ensureString(item.name, `策略 ${index + 1}`),
    type: ensureString(item.type, '待分类'),
    cost: ensureString(item.cost, '中'),
    timeToValue: ensureString(item.timeToValue, '两周内'),
    acceptance: clampPercent(item.acceptance, 60),
    risk: ensureString(item.risk, '风险尚未明确。'),
    recommendation: ensureString(item.recommendation, '建议先做小范围验证。'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizePerspectives(value: unknown, fallback: SandboxPerspective[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    key: oneOf(item.key, perspectiveKeys, perspectiveKeys[index] ?? 'systems'),
    label: ensureString(item.label, `视角 ${index + 1}`),
    stance: oneOf(item.stance, perspectiveStances, 'mixed'),
    confidence: clampPercent(item.confidence, 60),
    verdict: ensureString(item.verdict, '当前视角下还没有明确结论。'),
    opportunity: ensureString(item.opportunity, '机会点仍需继续拆解。'),
    concern: ensureString(item.concern, '风险点仍需继续拆解。'),
    leverage: ensureString(item.leverage, '还没有提炼出明确杠杆。'),
    evidenceRefs: ensureStringArray(item.evidenceRefs),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeBlindSpots(value: unknown, fallback: SandboxBlindSpot[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    area: ensureString(item.area, `盲点 ${index + 1}`),
    whyItMatters: ensureString(item.whyItMatters, '影响仍需进一步说明。'),
    missingEvidence: ensureString(item.missingEvidence, '缺少对应证据。'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeSecondOrderEffects(value: unknown, fallback: SandboxSecondOrderEffect[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    trigger: ensureString(item.trigger, `触发点 ${index + 1}`),
    outcome: ensureString(item.outcome, '二阶影响仍需补充。'),
    horizon: oneOf(item.horizon, effectHorizons, 'mid'),
    direction: oneOf(item.direction, effectDirections, 'mixed'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeScenarioVariants(value: unknown, fallback: SandboxScenarioVariant[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    name: ensureString(item.name, `分支 ${index + 1}`),
    premise: ensureString(item.premise, '前提尚不明确。'),
    upside: ensureString(item.upside, '上行空间尚不明确。'),
    downside: ensureString(item.downside, '下行风险尚不明确。'),
    watchSignals: ensureStringArray(item.watchSignals),
    recommendedMove: ensureString(item.recommendedMove, '建议先补证据再推进。'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeDecisionLenses(value: unknown, fallback: SandboxDecisionLens[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    name: ensureString(item.name, `决策镜头 ${index + 1}`),
    keyQuestion: ensureString(item.keyQuestion, '关键问题尚未明确。'),
    answer: ensureString(item.answer, '还没有足够支撑形成回答。'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeValidationTracks(value: unknown, fallback: SandboxValidationTrack[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    name: ensureString(item.name, `验证轨道 ${index + 1}`),
    priority: oneOf(item.priority, validationPriorities, 'P1'),
    goal: ensureString(item.goal, '验证目标尚未明确。'),
    method: ensureString(item.method, '验证方法尚未明确。'),
    successSignal: ensureString(item.successSignal, '成功信号尚未明确。'),
    failureSignal: ensureString(item.failureSignal, '失败信号尚未明确。'),
    cost: ensureString(item.cost, '中'),
    timeframe: ensureString(item.timeframe, '两周内'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeContrarianMoves(value: unknown, fallback: SandboxContrarianMove[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    title: ensureString(item.title, `逆向动作 ${index + 1}`),
    thesis: ensureString(item.thesis, '逆向观点尚未明确。'),
    whenToUse: ensureString(item.whenToUse, '适用条件尚未明确。'),
  }));

  return items.length > 0 ? items : fallback;
}

export function normalizeUnknowns(value: unknown, fallback: SandboxUnknown[] = []) {
  const items = ensureRecordArray(value).map((item, index) => ({
    topic: ensureString(item.topic, `未知项 ${index + 1}`),
    whyUnknown: ensureString(item.whyUnknown, '未知原因尚未说明。'),
    resolveBy: ensureString(item.resolveBy, '需要补充验证路径。'),
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
    title: ensureString(item.title, `记忆信号 ${index + 1}`),
    summary: ensureString(item.summary, '暂无额外记忆信号。'),
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

export function createFallbackAnalysis(
  mode: SandboxAnalysisMode,
  model: string,
  pipeline: string[],
  meta = createAnalysisMeta('local_fallback', 'degraded'),
): SandboxAnalysisResult {
  return {
    generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    mode,
    model,
    pipeline,
    meta,
    summary: '当前推演引擎已经切换为多阶段编排，但这一轮还没拿到足够完整的结构化输出。',
    systemVerdict: '建议先保留方向，同时用更小的验证问题继续逼近真相。',
    evidenceLevel: 'medium',
    primaryRisk: '证据覆盖仍然薄，容易把单点亮点误判成整体成立。',
    nextStep: '优先补齐最关键的反证和失败路径，再重新跑一次多阶段推演。',
    playerAcceptance: 60,
    confidence: 55,
    supportRatio: 58,
    scores: {
      coreFun: 62,
      learningCost: 56,
      novelty: 68,
      acceptanceRisk: 54,
      prototypeCost: 52,
    },
    personas: [],
    hypotheses: [],
    strategies: [],
    perspectives: [],
    blindSpots: [],
    secondOrderEffects: [],
    scenarioVariants: [],
    decisionLenses: [],
    validationTracks: [],
    contrarianMoves: [],
    unknowns: [],
    redTeam: {
      thesis: '当前还无法形成足够强的反方论证。',
      attackVectors: [],
      failureModes: [],
      mitigation: '继续补证据并保留反证视角。',
    },
    memorySignals: [],
    report: {
      headline: '继续推进，但先缩小验证问题',
      summary: '本轮更适合作为结构预览，而不是最终商业判断。',
      conclusion: '方向可留，但必须尽快把“成立条件”和“失败条件”都做成可验证对象。',
      whyNow: '现在最有价值的是加深推演结构，而不是继续堆概念描述。',
      risk: '如果不主动引入反方和记忆约束，结果会再次滑回单一维度。',
      actions: ['补关键证据', '重跑多阶段推演', '比较不同场景分支', '收敛到两周验证计划'],
    },
    warnings: [],
  };
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
    decisionLenses: normalizeDecisionLenses(parsed.decisionLenses, fallback.decisionLenses),
    validationTracks: normalizeValidationTracks(parsed.validationTracks, fallback.validationTracks),
    contrarianMoves: normalizeContrarianMoves(parsed.contrarianMoves, fallback.contrarianMoves),
    unknowns: normalizeUnknowns(parsed.unknowns, fallback.unknowns),
    redTeam: normalizeRedTeam(parsed.redTeam, fallback.redTeam),
    memorySignals: normalizeMemorySignals(parsed.memorySignals, fallback.memorySignals),
    report: normalizeReport(parsed.report, fallback.report),
    warnings: ensureStringArray(parsed.warnings, fallback.warnings),
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
