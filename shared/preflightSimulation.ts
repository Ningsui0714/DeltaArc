export const preflightPlatforms = [
  'campus_ai_competition',
  'xiaohongshu',
  'wechat_channels',
  'douyin',
  'bilibili',
  'weibo',
  'generic',
] as const;

export const preflightGoals = [
  'follower_growth',
  'submission_readiness',
  'store_visit',
  'ugc',
  'comment',
  'lead',
  'awareness',
  'conversion',
  'generic',
] as const;

export const preflightSimulationModes = ['quick', 'deep'] as const;

export const preflightRelevanceTiers = ['core', 'broad', 'weak', 'misfire'] as const;

export type PreflightPlatform = (typeof preflightPlatforms)[number];
export type PreflightGoal = (typeof preflightGoals)[number];
export type PreflightSimulationMode = (typeof preflightSimulationModes)[number];
export type PreflightRelevanceTier = (typeof preflightRelevanceTiers)[number];
export type PreflightJobStatus = 'queued' | 'running' | 'completed' | 'degraded' | 'error';
export type PreflightJobStageStatus = 'pending' | 'running' | 'completed' | 'error';
export type PreflightJobStageKey =
  | 'queued'
  | 'content_read'
  | 'image_read'
  | 'push_model'
  | 'reply_simulation'
  | 'synthesis'
  | 'complete';

export type PreflightContentDraft = {
  title: string;
  body: string;
  script: string;
};

export type PreflightMediaAsset = {
  id: string;
  kind: 'image';
  name: string;
  mimeType: string;
  dataUrl?: string;
  base64?: string;
  url?: string;
  imagePath?: string;
};

export type PreflightSimulationRequest = {
  workspaceId: string;
  platform: PreflightPlatform;
  goal: PreflightGoal;
  mode: PreflightSimulationMode;
  contentDraft: PreflightContentDraft;
  mediaAssets: PreflightMediaAsset[];
  accountContext: string;
  targetAudience: string;
  desiredAction: string;
  brandGuardrails: string;
};

export type PreflightContentRead = {
  oneLineIntent: string;
  platformFit: string;
  likelyHook: string;
  missingContext: string[];
  assumptions: string[];
};

export type PreflightImageInsight = {
  summary: string;
  visibleElements: string[];
  coverRead: string;
  textOnImage: string[];
  ambiguity: string;
  attentionScore: number;
  risks: string[];
  improvementIdeas: string[];
};

export type PreflightPushCohort = {
  id: string;
  label: string;
  relevanceTier: PreflightRelevanceTier;
  exposureShare: number;
  whyPushed: string;
  likelyBehavior: string;
  misunderstandingRisk: string;
  conversionIntent: string;
};

export type PreflightPushModel = {
  summary: string;
  nonRelevantShare: number;
  platformDrift: string;
  cohorts: PreflightPushCohort[];
};

export type PreflightReplySentiment =
  | 'positive'
  | 'neutral'
  | 'skeptical'
  | 'negative'
  | 'irrelevant';

export type PreflightReplyType =
  | 'comment'
  | 'question'
  | 'objection'
  | 'save_signal'
  | 'follow_signal'
  | 'share_signal'
  | 'share_trigger'
  | 'conversion_signal'
  | 'misread'
  | 'scroll_away';

export type PreflightScenario =
  | 'koc_growth'
  | 'campus_submission'
  | 'brand_post'
  | 'generic_preflight';

export type PreflightContentPromise = {
  oneLinePromise: string;
  targetUser: string;
  userPain: string;
  promisedValue: string;
  desiredAction: string;
  proofProvided: string[];
  proofMissing: string[];
  overclaimRisk: string;
};

export type PreflightVisualRead = {
  firstGlance: string;
  visibleText: string[];
  visibleObjects: string[];
  strongestSignal: string;
  confusionPoints: string[];
  missingAnnotations: string[];
  coverScore: number;
  mobileLegibility: 'good' | 'medium' | 'poor';
};

export type PreflightAudienceCohortV2 = {
  id: string;
  tier: PreflightRelevanceTier;
  userProfile: string;
  exposureShare: number;
  pushReason: string;
  likelyReaction: string;
  conversionTrigger: string;
  dropOffReason: string;
  misunderstandingRisk: string;
};

export type PreflightSimulatedReply = {
  id: string;
  cohortId: string;
  userType: string;
  relevanceTier: PreflightRelevanceTier;
  sentiment: PreflightReplySentiment;
  replyType: PreflightReplyType;
  text: string;
  why: string;
  conversionSignal: string;
  intervention: string;
  comment?: string;
  surfaceIntent?: string;
  hiddenNeed?: string;
  riskSignal?: string;
  suggestedReply?: string;
  contentAction?: string;
  evidenceNeeded?: string[];
};

export type PreflightRisk = {
  title: string;
  severity: 'low' | 'medium' | 'high';
  trigger: string;
  likelyComment: string;
  mitigation: string;
};

export type PreflightIntervention = {
  priority: 'P0' | 'P1' | 'P2';
  target:
    | 'cover'
    | 'title'
    | 'opening'
    | 'body'
    | 'comment'
    | 'proof'
    | 'next_post'
    | 'comment_prompt'
    | 'timing'
    | 'offer'
    | 'script';
  action: string;
  reason: string;
  expectedChange: string;
  id?: string;
  problem?: string;
  change?: string;
  exampleRewrite?: string;
  expectedEffect?: string;
  effort?: 'low' | 'medium' | 'high';
  evidenceSource?: string;
};

export type PreflightConfidence = {
  level: 'low' | 'medium' | 'high';
  score: number;
  rationale: string;
  limitations: string[];
};

export type PreflightRiskReview = {
  topRisks: PreflightRisk[];
  complianceRisks: PreflightRisk[];
  misreadRisks: PreflightRisk[];
};

export type PreflightMetricCard = {
  label: string;
  simulatedValue: number;
  rationale: string;
};

export type PreflightSimulatedMetrics = {
  disclaimer: string;
  attentionScore: number;
  saveIntentScore: number;
  commentIntentScore: number;
  followIntentScore: number;
  shareIntentScore: number;
  metricCards: PreflightMetricCard[];
};

export type PreflightQualityCheck = {
  overallScore: number;
  reliableSignals: string[];
  weakSignals: string[];
  possibleHallucinations: string[];
  needsHumanReview: string[];
  outputWarnings: string[];
};

export type PreflightPublishGate = 'go' | 'revise' | 'hold';
export type PreflightSafetySeverity = 'low' | 'medium' | 'high' | 'critical';
export type PreflightSafetyArea =
  | 'overclaim'
  | 'privacy'
  | 'copyright'
  | 'platform_policy'
  | 'brand_reputation'
  | 'public_opinion'
  | 'data_security'
  | 'minor_protection'
  | 'competition_integrity'
  | 'misleading_context';
export type PreflightSafetyOwner =
  | 'ops'
  | 'brand'
  | 'legal'
  | 'pr'
  | 'data_security'
  | 'product'
  | 'competition_team';
export type PreflightSafetyStatus = 'pass' | 'review' | 'fail';
export type PreflightSafetyEscalation =
  | 'none'
  | 'ops'
  | 'brand'
  | 'legal'
  | 'pr'
  | 'data_security'
  | 'competition_team';

export type PreflightSafetyRedFlag = {
  id: string;
  title: string;
  severity: PreflightSafetySeverity;
  area: PreflightSafetyArea;
  trigger: string;
  whyItMatters: string;
  evidence: string;
  fix: string;
  owner: PreflightSafetyOwner;
};

export type PreflightSafetyChecklistItem = {
  id: string;
  label: string;
  status: PreflightSafetyStatus;
  detail: string;
  owner: PreflightSafetyOwner;
};

export type PreflightPublishSafetyReview = {
  gate: PreflightPublishGate;
  score: number;
  summary: string;
  escalation: PreflightSafetyEscalation;
  redFlags: PreflightSafetyRedFlag[];
  checklist: PreflightSafetyChecklistItem[];
  mustFixBeforePublish: string[];
  safeRewriteHints: string[];
};

export type PreflightGrowthBrief = {
  contentDirection: {
    summary: string;
    strongestHook: string;
    evidence: string[];
    missingSignals: string[];
  };
  topicIdeas: {
    nextPost: string;
    seriesDirection: string;
    abTests: string[];
    reuseFromComments: string[];
  };
  publishStrategy: {
    title: string;
    cover: string;
    timing: string;
    tags: string[];
    structure: string;
  };
  interactionOptimization: {
    pinnedComment: string;
    replyPrinciple: string;
    commentTriggers: string[];
    riskReplies: string[];
  };
  accountGrowthPlan: {
    growthThesis: string;
    followTriggers: string[];
    nextThreePosts: string[];
    reviewMetrics: string[];
  };
  riskGuardrail: {
    positioning: string;
    mustAvoid: string[];
    safePhrasing: string[];
  };
};

export type PreflightSimulationResult = {
  schemaVersion: 'preflight_v2';
  generatedAt: string;
  provider: 'doubao' | 'mock';
  model: string;
  mode: PreflightSimulationMode;
  scenario: PreflightScenario;
  degraded: boolean;
  fallbackReason?: string;
  contentPromise: PreflightContentPromise;
  contentRead: PreflightContentRead;
  visualRead: PreflightVisualRead;
  imageInsight: PreflightImageInsight;
  audienceDistribution: PreflightAudienceCohortV2[];
  pushModel: PreflightPushModel;
  simulatedReplies: PreflightSimulatedReply[];
  riskReview: PreflightRiskReview;
  risks: PreflightRisk[];
  interventions: PreflightIntervention[];
  simulatedMetrics: PreflightSimulatedMetrics;
  qualityCheck: PreflightQualityCheck;
  publishSafetyReview: PreflightPublishSafetyReview;
  growthBrief: PreflightGrowthBrief;
  confidence: PreflightConfidence;
  warnings: string[];
};

export type PreflightJobStage = {
  key: PreflightJobStageKey;
  label: string;
  detail: string;
  status: PreflightJobStageStatus;
  startedAt?: string;
  completedAt?: string;
};

export type PreflightSimulationJob = {
  id: string;
  workspaceId: string;
  status: PreflightJobStatus;
  currentStageKey: PreflightJobStageKey;
  currentStageLabel: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  stages: PreflightJobStage[];
  result?: PreflightSimulationResult;
  error?: string;
  fallbackReason?: string;
};

export class PreflightSchemaError extends Error {
  readonly issues: string[];

  constructor(message: string | string[]) {
    const issues = Array.isArray(message) ? message : [message];
    super(issues[0] ?? 'Preflight schema validation failed.');
    this.name = 'PreflightSchemaError';
    this.issues = issues;
  }
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanModelText(value: string) {
  return value
    .replace(/存\s*\{[^{}]*["']sentiment["']\s*:\s*["']skeptical["'][^{}]*\}/g, '存疑')
    .replace(
      /\s*\{[^{}]*["'](?:sentiment|replyType|tier|relevanceTier|conversionSignal|riskSignal|contentAction|suggestedReply)["']\s*:[^{}]*\}\s*/g,
      ' ',
    )
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([，。！？；：、])/g, '$1')
    .trim();
}

function trimString(value: unknown, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const cleaned = cleanModelText(value.trim());
  return cleaned || fallback;
}

function stringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const nextValue = value
    .map((item) => trimString(item))
    .filter(Boolean);

  return nextValue.length > 0 ? nextValue : fallback;
}

function percentNumberInRange(value: unknown, fallback: number, min = 0, max = 100) {
  const numberValue = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  const percentValue = numberValue > 0 && numberValue <= 1 ? numberValue * 100 : numberValue;
  return Math.max(min, Math.min(max, Math.round(percentValue)));
}

function scoreNumberInRange(value: unknown, fallback: number, min = 0, max = 100) {
  const numberValue = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  const percentValue = numberValue > 0 && numberValue <= 1
    ? numberValue * 100
    : numberValue > 1 && numberValue <= 10
    ? numberValue * 10
    : numberValue;
  return Math.max(min, Math.min(max, Math.round(percentValue)));
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function recordArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function createFallbackId(prefix: string, index: number) {
  return `${prefix}_${index + 1}`;
}

function parseScenario(value: unknown): PreflightScenario {
  return oneOf(
    value,
    ['koc_growth', 'campus_submission', 'brand_post', 'generic_preflight'] as const,
    'generic_preflight',
  );
}

function parseRiskRecord(risk: JsonRecord, index: number): PreflightRisk {
  return {
    title: trimString(risk.title, `风险 ${index + 1}`),
    severity: oneOf(risk.severity, ['low', 'medium', 'high'] as const, 'medium'),
    trigger: trimString(risk.trigger, '表达不够具体。'),
    likelyComment: trimString(risk.likelyComment ?? risk.likelyUserComment, '所以到底有什么不一样？'),
    mitigation: trimString(risk.mitigation, '把证据和行动入口前置。'),
  };
}

function parseContentPromise(value: unknown, contentRead: PreflightContentRead): PreflightContentPromise {
  const contentPromiseValue = isRecord(value) ? value : {};

  return {
    oneLinePromise: trimString(contentPromiseValue.oneLinePromise, contentRead.oneLineIntent),
    targetUser: trimString(contentPromiseValue.targetUser, '需要从目标人群描述中进一步确认。'),
    userPain: trimString(contentPromiseValue.userPain, contentRead.missingContext[0] ?? '痛点表达还不够明确。'),
    promisedValue: trimString(contentPromiseValue.promisedValue, contentRead.likelyHook),
    desiredAction: trimString(contentPromiseValue.desiredAction, '继续评论、收藏、关注或查看下一步。'),
    proofProvided: stringArray(contentPromiseValue.proofProvided, [contentRead.platformFit]),
    proofMissing: stringArray(contentPromiseValue.proofMissing, contentRead.missingContext),
    overclaimRisk: trimString(contentPromiseValue.overclaimRisk, contentRead.assumptions[0] ?? '不要把模拟结果当成真实承诺。'),
  };
}

function parseVisualRead(value: unknown, imageInsight: PreflightImageInsight): PreflightVisualRead {
  const visualReadValue = isRecord(value) ? value : {};

  return {
    firstGlance: trimString(visualReadValue.firstGlance, imageInsight.coverRead),
    visibleText: stringArray(visualReadValue.visibleText, imageInsight.textOnImage),
    visibleObjects: stringArray(visualReadValue.visibleObjects, imageInsight.visibleElements),
    strongestSignal: trimString(visualReadValue.strongestSignal, imageInsight.summary),
    confusionPoints: stringArray(visualReadValue.confusionPoints, [imageInsight.ambiguity]),
    missingAnnotations: stringArray(visualReadValue.missingAnnotations, imageInsight.improvementIdeas),
    coverScore: scoreNumberInRange(visualReadValue.coverScore, imageInsight.attentionScore),
    mobileLegibility: oneOf(visualReadValue.mobileLegibility, ['good', 'medium', 'poor'] as const, 'medium'),
  };
}

function parseAudienceDistribution(value: unknown, cohorts: PreflightPushCohort[]): PreflightAudienceCohortV2[] {
  const cohortRecords = recordArray(value);
  const source = cohortRecords.length > 0 ? cohortRecords : cohorts;

  return source.map<PreflightAudienceCohortV2>((cohort, index) => {
    const cohortValue = cohort as JsonRecord & Partial<PreflightPushCohort>;
    const legacyCohort = cohorts[index];
    const tier = oneOf(cohortValue.tier ?? cohortValue.relevanceTier, preflightRelevanceTiers, legacyCohort?.relevanceTier ?? 'broad');

    return {
      id: trimString(cohortValue.id, legacyCohort?.id ?? createFallbackId('cohort', index)),
      tier,
      userProfile: trimString(cohortValue.userProfile ?? cohortValue.label, legacyCohort?.label ?? `受众 ${index + 1}`),
      exposureShare: percentNumberInRange(cohortValue.exposureShare, legacyCohort?.exposureShare ?? 20),
      pushReason: trimString(cohortValue.pushReason ?? cohortValue.whyPushed, legacyCohort?.whyPushed ?? '平台根据兴趣相似度扩散。'),
      likelyReaction: trimString(cohortValue.likelyReaction ?? cohortValue.likelyBehavior, legacyCohort?.likelyBehavior ?? '快速判断是否值得停留。'),
      conversionTrigger: trimString(cohortValue.conversionTrigger ?? cohortValue.conversionIntent, legacyCohort?.conversionIntent ?? '需要更多证据才会行动。'),
      dropOffReason: trimString(cohortValue.dropOffReason, legacyCohort?.misunderstandingRisk ?? '信息不足时会划走。'),
      misunderstandingRisk: trimString(cohortValue.misunderstandingRisk, legacyCohort?.misunderstandingRisk ?? '信息不足时可能误读。'),
    };
  });
}

function parseRiskReview(value: unknown, risks: PreflightRisk[]): PreflightRiskReview {
  const riskReviewValue = isRecord(value) ? value : {};
  const topRisks = recordArray(riskReviewValue.topRisks).map(parseRiskRecord);
  const complianceRisks = recordArray(riskReviewValue.complianceRisks).map(parseRiskRecord);
  const misreadRisks = recordArray(riskReviewValue.misreadRisks).map(parseRiskRecord);

  return {
    topRisks: topRisks.length > 0 ? topRisks : risks.slice(0, 2),
    complianceRisks: complianceRisks.length > 0 ? complianceRisks : risks.filter((risk) => risk.severity === 'high').slice(0, 1),
    misreadRisks: misreadRisks.length > 0 ? misreadRisks : risks.slice(-1),
  };
}

function parseSimulatedMetrics(
  value: unknown,
  imageInsight: PreflightImageInsight,
  confidence: PreflightConfidence,
  replies: PreflightSimulatedReply[],
): PreflightSimulatedMetrics {
  const metricsValue = isRecord(value) ? value : {};
  const metricCards = recordArray(metricsValue.metricCards).map<PreflightMetricCard>((item, index) => ({
    label: trimString(item.label, ['点赞', '收藏', '评论', '转发'][index] ?? `指标 ${index + 1}`),
    simulatedValue: scoreNumberInRange(item.simulatedValue, imageInsight.attentionScore),
    rationale: trimString(item.rationale, '由内容承诺、视觉强度和模拟评论共同推导。'),
  }));

  return {
    disclaimer: trimString(metricsValue.disclaimer, '以下为发布前模拟值，不代表真实播放、点赞或涨粉承诺。'),
    attentionScore: scoreNumberInRange(metricsValue.attentionScore, imageInsight.attentionScore),
    saveIntentScore: scoreNumberInRange(metricsValue.saveIntentScore, Math.round((imageInsight.attentionScore + confidence.score) / 2)),
    commentIntentScore: scoreNumberInRange(metricsValue.commentIntentScore, Math.min(100, replies.length * 9)),
    followIntentScore: scoreNumberInRange(metricsValue.followIntentScore, Math.round(confidence.score * 0.72)),
    shareIntentScore: scoreNumberInRange(metricsValue.shareIntentScore, Math.round(imageInsight.attentionScore * 0.58)),
    metricCards: metricCards.length > 0
      ? metricCards
      : [
          { label: '注意力', simulatedValue: imageInsight.attentionScore, rationale: '来自封面首屏和标题钩子强度。' },
          { label: '收藏意图', simulatedValue: Math.round((imageInsight.attentionScore + confidence.score) / 2), rationale: '来自可复制价值和证据完整度。' },
          { label: '评论意图', simulatedValue: Math.min(100, replies.length * 9), rationale: '来自问题、质疑和分享触发点数量。' },
          { label: '关注意图', simulatedValue: Math.round(confidence.score * 0.72), rationale: '来自系列化承诺和下一步动作清晰度。' },
        ],
  };
}

function parseQualityCheck(
  value: unknown,
  confidence: PreflightConfidence,
  warnings: string[],
): PreflightQualityCheck {
  const qualityCheckValue = isRecord(value) ? value : {};

  return {
    overallScore: scoreNumberInRange(qualityCheckValue.overallScore, confidence.score),
    reliableSignals: stringArray(qualityCheckValue.reliableSignals, [confidence.rationale]),
    weakSignals: stringArray(qualityCheckValue.weakSignals, confidence.limitations),
    possibleHallucinations: stringArray(qualityCheckValue.possibleHallucinations, ['模型可能误判图片细节或平台真实分发偏好。']),
    needsHumanReview: stringArray(qualityCheckValue.needsHumanReview, ['价格、合规、平台规则和真实素材边界。']),
    outputWarnings: stringArray(qualityCheckValue.outputWarnings, warnings),
  };
}

function parseSafetyRedFlag(value: JsonRecord, index: number): PreflightSafetyRedFlag {
  const severity = oneOf(
    value.severity,
    ['low', 'medium', 'high', 'critical'] as const,
    index === 0 ? 'high' : 'medium',
  );

  return {
    id: trimString(value.id, createFallbackId('safety_flag', index)),
    title: trimString(value.title, `发布安全风险 ${index + 1}`),
    severity,
    area: oneOf(
      value.area,
      [
        'overclaim',
        'privacy',
        'copyright',
        'platform_policy',
        'brand_reputation',
        'public_opinion',
        'data_security',
        'minor_protection',
        'competition_integrity',
        'misleading_context',
      ] as const,
      severity === 'high' || severity === 'critical' ? 'brand_reputation' : 'misleading_context',
    ),
    trigger: trimString(value.trigger, '当前表达可能被外部用户、平台或评审按高风险语境理解。'),
    whyItMatters: trimString(value.whyItMatters ?? value.impact, '大厂发布需要避免舆情扩散、合规争议和品牌信任损耗。'),
    evidence: trimString(value.evidence, '来自草稿、素材、模拟评论或风险复核。'),
    fix: trimString(value.fix ?? value.mitigation, '发布前补充边界、证据和更稳妥的措辞。'),
    owner: oneOf(
      value.owner,
      ['ops', 'brand', 'legal', 'pr', 'data_security', 'product', 'competition_team'] as const,
      severity === 'critical' ? 'legal' : severity === 'high' ? 'pr' : 'ops',
    ),
  };
}

function parseSafetyChecklistItem(value: JsonRecord, index: number): PreflightSafetyChecklistItem {
  return {
    id: trimString(value.id, createFallbackId('safety_check', index)),
    label: trimString(value.label, `安全检查项 ${index + 1}`),
    status: oneOf(value.status, ['pass', 'review', 'fail'] as const, 'review'),
    detail: trimString(value.detail, '需要发布前人工复核。'),
    owner: oneOf(
      value.owner,
      ['ops', 'brand', 'legal', 'pr', 'data_security', 'product', 'competition_team'] as const,
      'ops',
    ),
  };
}

function createFallbackSafetyFlags(risks: PreflightRisk[], riskReview: PreflightRiskReview) {
  const riskSources = [
    ...riskReview.complianceRisks,
    ...riskReview.misreadRisks,
    ...riskReview.topRisks,
    ...risks,
  ];
  const seen = new Set<string>();

  return riskSources
    .filter((risk) => {
      if (seen.has(risk.title)) {
        return false;
      }

      seen.add(risk.title);
      return true;
    })
    .slice(0, 4)
    .map<PreflightSafetyRedFlag>((risk, index) => ({
      id: createFallbackId('safety_flag', index),
      title: risk.title,
      severity: risk.severity === 'high' ? 'high' : risk.severity,
      area: risk.severity === 'high' ? 'brand_reputation' : 'misleading_context',
      trigger: risk.trigger,
      whyItMatters: '发布后可能被用户、平台或评审放大，影响品牌信任和内容安全判断。',
      evidence: risk.likelyComment,
      fix: risk.mitigation,
      owner: risk.severity === 'high' ? 'pr' : 'ops',
    }));
}

function deriveSafetyGate(redFlags: PreflightSafetyRedFlag[], qualityCheck: PreflightQualityCheck) {
  if (redFlags.some((flag) => flag.severity === 'critical')) {
    return 'hold';
  }

  if (redFlags.some((flag) => flag.severity === 'high') || qualityCheck.needsHumanReview.length > 0) {
    return 'revise';
  }

  return 'go';
}

function deriveSafetyEscalation(redFlags: PreflightSafetyRedFlag[]): PreflightSafetyEscalation {
  const criticalFlag = redFlags.find((flag) => flag.severity === 'critical');
  if (criticalFlag) {
    return criticalFlag.owner === 'data_security' ? 'data_security' : criticalFlag.owner === 'pr' ? 'pr' : 'legal';
  }

  const highFlag = redFlags.find((flag) => flag.severity === 'high');
  if (!highFlag) {
    return 'none';
  }

  if (highFlag.owner === 'legal' || highFlag.owner === 'pr' || highFlag.owner === 'brand' || highFlag.owner === 'data_security') {
    return highFlag.owner;
  }

  return 'ops';
}

function parsePublishSafetyReview(
  value: unknown,
  risks: PreflightRisk[],
  riskReview: PreflightRiskReview,
  qualityCheck: PreflightQualityCheck,
  warnings: string[],
): PreflightPublishSafetyReview {
  const safetyValue = isRecord(value) ? value : {};
  const parsedFlags = recordArray(safetyValue.redFlags).map(parseSafetyRedFlag);
  const redFlags = parsedFlags.length > 0 ? parsedFlags : createFallbackSafetyFlags(risks, riskReview);
  const fallbackGate = deriveSafetyGate(redFlags, qualityCheck);
  const fallbackScore = Math.max(
    0,
    qualityCheck.overallScore
      - redFlags.filter((flag) => flag.severity === 'critical').length * 30
      - redFlags.filter((flag) => flag.severity === 'high').length * 14
      - redFlags.filter((flag) => flag.severity === 'medium').length * 6,
  );
  const checklist = recordArray(safetyValue.checklist).map(parseSafetyChecklistItem);
  const fallbackChecklist: PreflightSafetyChecklistItem[] = [
    {
      id: 'safety_check_overclaim',
      label: '承诺与功效边界',
      status: redFlags.some((flag) => flag.area === 'overclaim') ? 'fail' : 'review',
      detail: '检查是否存在播放量、涨粉、评审结果、效果保证或过度功效承诺。',
      owner: 'ops',
    },
    {
      id: 'safety_check_privacy',
      label: '隐私与授权',
      status: redFlags.some((flag) => flag.area === 'privacy' || flag.area === 'data_security') ? 'fail' : 'review',
      detail: '检查素材、人像、聊天记录、学生信息、数据来源和截图是否有授权。',
      owner: 'legal',
    },
    {
      id: 'safety_check_reputation',
      label: '舆情与品牌声誉',
      status: redFlags.some((flag) => flag.area === 'brand_reputation' || flag.area === 'public_opinion') ? 'fail' : 'review',
      detail: '检查是否容易被解读为官方背书、碰瓷品牌、拉踩竞品或引战。',
      owner: 'pr',
    },
    {
      id: 'safety_check_platform',
      label: '平台规则与互动方式',
      status: redFlags.some((flag) => flag.area === 'platform_policy') ? 'fail' : 'review',
      detail: '检查是否有诱导互动、虚假种草、标题党、低俗化或刷量暗示。',
      owner: 'ops',
    },
  ];

  return {
    gate: oneOf(safetyValue.gate, ['go', 'revise', 'hold'] as const, fallbackGate),
    score: scoreNumberInRange(safetyValue.score, fallbackScore),
    summary: trimString(
      safetyValue.summary,
      fallbackGate === 'hold'
        ? '存在必须暂停发布并升级复核的安全风险。'
        : fallbackGate === 'revise'
        ? '发布前需要先修正文案边界、素材授权或舆情误读点。'
        : '未发现明确阻断项，但仍建议保留人工复核。',
    ),
    escalation: oneOf(
      safetyValue.escalation,
      ['none', 'ops', 'brand', 'legal', 'pr', 'data_security', 'competition_team'] as const,
      deriveSafetyEscalation(redFlags),
    ),
    redFlags,
    checklist: checklist.length > 0 ? checklist : fallbackChecklist,
    mustFixBeforePublish: stringArray(
      safetyValue.mustFixBeforePublish,
      redFlags.filter((flag) => flag.severity === 'critical' || flag.severity === 'high').map((flag) => flag.fix),
    ),
    safeRewriteHints: stringArray(
      safetyValue.safeRewriteHints,
      [
        '把绝对承诺改成可验证事实和适用边界。',
        '把可能被误读的官方背书改成清晰来源说明。',
        ...warnings.slice(0, 2),
      ].filter(Boolean),
    ),
  };
}

function parseGrowthBrief(
  value: unknown,
  contentPromise: PreflightContentPromise,
  visualRead: PreflightVisualRead,
  replies: PreflightSimulatedReply[],
  interventions: PreflightIntervention[],
  publishSafetyReview: PreflightPublishSafetyReview,
): PreflightGrowthBrief {
  const growthValue = isRecord(value) ? value : {};
  const contentDirectionValue = isRecord(growthValue.contentDirection) ? growthValue.contentDirection : {};
  const topicIdeasValue = isRecord(growthValue.topicIdeas) ? growthValue.topicIdeas : {};
  const publishStrategyValue = isRecord(growthValue.publishStrategy) ? growthValue.publishStrategy : {};
  const interactionValue = isRecord(growthValue.interactionOptimization) ? growthValue.interactionOptimization : {};
  const accountGrowthValue = isRecord(growthValue.accountGrowthPlan) ? growthValue.accountGrowthPlan : {};
  const guardrailValue = isRecord(growthValue.riskGuardrail) ? growthValue.riskGuardrail : {};
  const nextPostAction = interventions.find((item) => item.target === 'next_post' || item.target === 'script');
  const pinnedCommentAction = interventions.find((item) => item.target === 'comment_prompt' || item.target === 'comment');
  const coverAction = interventions.find((item) => item.target === 'cover');
  const titleAction = interventions.find((item) => item.target === 'title' || item.target === 'opening');
  const usefulReplies = replies
    .filter((reply) => reply.replyType === 'share_trigger' || reply.replyType === 'follow_signal' || reply.replyType === 'conversion_signal')
    .map((reply) => reply.text)
    .slice(0, 3);

  return {
    contentDirection: {
      summary: trimString(contentDirectionValue.summary, contentPromise.oneLinePromise),
      strongestHook: trimString(contentDirectionValue.strongestHook, visualRead.strongestSignal),
      evidence: stringArray(contentDirectionValue.evidence, contentPromise.proofProvided),
      missingSignals: stringArray(contentDirectionValue.missingSignals, [
        ...contentPromise.proofMissing,
        ...visualRead.missingAnnotations,
      ].slice(0, 4)),
    },
    topicIdeas: {
      nextPost: trimString(topicIdeasValue.nextPost, nextPostAction?.action ?? '把本条评论里最高频的问题做成下一条内容。'),
      seriesDirection: trimString(topicIdeasValue.seriesDirection, '围绕同一账号定位做连续三条低成本实验，建立可期待的系列。'),
      abTests: stringArray(topicIdeasValue.abTests, [
        'A版标题强调低预算清单，B版标题强调前后反差。',
        'A版封面放改造前后，B版封面放踩坑价格表。',
      ]),
      reuseFromComments: stringArray(topicIdeasValue.reuseFromComments, usefulReplies.length ? usefulReplies : ['把用户追问转成下一条选题投票。']),
    },
    publishStrategy: {
      title: trimString(publishStrategyValue.title, titleAction?.action ?? '标题同时写清人群、场景和可复制价值。'),
      cover: trimString(publishStrategyValue.cover, coverAction?.action ?? '封面前置真实对比、预算边界和最强视觉钩子。'),
      timing: trimString(publishStrategyValue.timing, '优先选目标用户有空评论和收藏的晚间或周末时段。'),
      tags: stringArray(publishStrategyValue.tags, ['#KOC成长', '#发布前预演', '#低成本实验']),
      structure: trimString(publishStrategyValue.structure, '开头给结论，中段给证据和清单，结尾给下一期互动入口。'),
    },
    interactionOptimization: {
      pinnedComment: trimString(interactionValue.pinnedComment, pinnedCommentAction?.action ?? '置顶一个投票问题，把收藏用户引导到关注下一期。'),
      replyPrinciple: trimString(interactionValue.replyPrinciple, '先承认边界，再补证据，最后引导到下一条内容或系列更新。'),
      commentTriggers: stringArray(interactionValue.commentTriggers, ['你最想先改哪一块？', '要不要出失败版清单？', '评论区投票决定下一期。']),
      riskReplies: stringArray(
        interactionValue.riskReplies,
        replies
          .filter((reply) => reply.sentiment === 'skeptical' || reply.sentiment === 'negative')
          .map((reply) => reply.suggestedReply)
          .filter((reply): reply is string => Boolean(reply))
          .slice(0, 3),
      ),
    },
    accountGrowthPlan: {
      growthThesis: trimString(accountGrowthValue.growthThesis, '让用户关注的不是单条清单，而是持续可复用的真实实验。'),
      followTriggers: stringArray(accountGrowthValue.followTriggers, ['系列预告', '真实踩坑', '评论区投票', '可复制模板']),
      nextThreePosts: stringArray(accountGrowthValue.nextThreePosts, [
        '失败版清单：哪些东西不建议买。',
        '床边或衣柜改造：延续同一预算逻辑。',
        '复盘帖：哪些改动真正提升了使用频率。',
      ]),
      reviewMetrics: stringArray(accountGrowthValue.reviewMetrics, ['关注率', '收藏率', '评论问题数量', '下一条投票参与']),
    },
    riskGuardrail: {
      positioning: trimString(guardrailValue.positioning, publishSafetyReview.summary),
      mustAvoid: stringArray(guardrailValue.mustAvoid, publishSafetyReview.mustFixBeforePublish),
      safePhrasing: stringArray(guardrailValue.safePhrasing, publishSafetyReview.safeRewriteHints),
    },
  };
}

export function parsePreflightSimulationRequest(value: unknown): PreflightSimulationRequest {
  if (!isRecord(value)) {
    throw new PreflightSchemaError('请求体必须是对象。');
  }

  const contentDraftValue = isRecord(value.contentDraft) ? value.contentDraft : {};
  const contentDraft: PreflightContentDraft = {
    title: trimString(contentDraftValue.title),
    body: trimString(contentDraftValue.body),
    script: trimString(contentDraftValue.script),
  };
  const hasDraftText = Boolean(contentDraft.title || contentDraft.body || contentDraft.script);

  const mediaAssets = recordArray(value.mediaAssets).slice(0, 3).map<PreflightMediaAsset>((asset, index) => ({
    id: trimString(asset.id, createFallbackId('image', index)),
    kind: 'image',
    name: trimString(asset.name, `image-${index + 1}`),
    mimeType: trimString(asset.mimeType, 'image/jpeg'),
    dataUrl: trimString(asset.dataUrl) || undefined,
    base64: trimString(asset.base64) || undefined,
    url: trimString(asset.url) || undefined,
    imagePath: trimString(asset.imagePath) || undefined,
  }));

  if (!hasDraftText) {
    throw new PreflightSchemaError('请至少填写标题、正文或脚本中的一项。');
  }

  return {
    workspaceId: trimString(value.workspaceId, 'default'),
    platform: oneOf(value.platform, preflightPlatforms, 'xiaohongshu'),
    goal: oneOf(value.goal, preflightGoals, 'store_visit'),
    mode: oneOf(value.mode, preflightSimulationModes, 'quick'),
    contentDraft,
    mediaAssets,
    accountContext: trimString(value.accountContext),
    targetAudience: trimString(value.targetAudience),
    desiredAction: trimString(value.desiredAction),
    brandGuardrails: trimString(value.brandGuardrails),
  };
}

export function parsePreflightSimulationResult(value: unknown): PreflightSimulationResult {
  if (!isRecord(value)) {
    throw new PreflightSchemaError('模拟结果必须是对象。');
  }

  const contentPromiseValue = isRecord(value.contentPromise) ? value.contentPromise : {};
  const visualReadValue = isRecord(value.visualRead) ? value.visualRead : {};
  const contentReadValue = isRecord(value.contentRead) ? value.contentRead : {};
  const imageInsightValue = isRecord(value.imageInsight) ? value.imageInsight : {};
  const pushModelValue = isRecord(value.pushModel) ? value.pushModel : {};
  const confidenceValue = isRecord(value.confidence) ? value.confidence : {};
  const cohortValues = recordArray(pushModelValue.cohorts);
  const v2CohortValues = recordArray(value.audienceDistribution);

  const cohorts = (cohortValues.length > 0 ? cohortValues : v2CohortValues).map<PreflightPushCohort>((cohort, index) => ({
    id: trimString(cohort.id, createFallbackId('cohort', index)),
    label: trimString(cohort.label ?? cohort.userProfile, `受众 ${index + 1}`),
    relevanceTier: oneOf(cohort.relevanceTier ?? cohort.tier, preflightRelevanceTiers, 'broad'),
    exposureShare: percentNumberInRange(cohort.exposureShare, 20),
    whyPushed: trimString(cohort.whyPushed ?? cohort.pushReason, '平台根据兴趣相似度进行扩散。'),
    likelyBehavior: trimString(cohort.likelyBehavior ?? cohort.likelyReaction, '先快速判断是否值得停留。'),
    misunderstandingRisk: trimString(cohort.misunderstandingRisk, '信息不足时可能产生误读。'),
    conversionIntent: trimString(cohort.conversionIntent ?? cohort.conversionTrigger, '需要更多证据才会行动。'),
  }));

  const simulatedReplies = recordArray(value.simulatedReplies).map<PreflightSimulatedReply>((reply, index) => {
    const comment = trimString(reply.comment ?? reply.text, '看起来有点意思，但还需要更多信息。');
    const hiddenNeed = trimString(reply.hiddenNeed ?? reply.why, '用户会基于标题、封面和第一句话快速判断。');
    const contentAction = trimString(reply.contentAction ?? reply.intervention, '补充一个更明确的内容修改动作。');
    const suggestedReply = trimString(
      reply.suggestedReply,
      '这个点我会补清楚：先说明边界，再把证据和下一步整理到正文或置顶评论里。',
    );

    return {
      id: trimString(reply.id, createFallbackId('reply', index)),
      cohortId: trimString(reply.cohortId, cohorts[index % Math.max(cohorts.length, 1)]?.id ?? 'cohort_1'),
      userType: trimString(reply.userType, '路过用户'),
      relevanceTier: oneOf(reply.tier ?? reply.relevanceTier, preflightRelevanceTiers, 'broad'),
      sentiment: oneOf(
        reply.sentiment,
        ['positive', 'neutral', 'skeptical', 'negative', 'irrelevant'] as const,
        'neutral',
      ),
      replyType: oneOf(
        reply.replyType,
        [
          'comment',
          'question',
          'objection',
          'save_signal',
          'follow_signal',
          'share_signal',
          'share_trigger',
          'conversion_signal',
          'misread',
          'scroll_away',
        ] as const,
        'comment',
      ),
      text: comment,
      why: hiddenNeed,
      conversionSignal: trimString(reply.conversionSignal, '转化信号暂不明确。'),
      intervention: contentAction,
      comment,
      surfaceIntent: trimString(reply.surfaceIntent, '表面反馈需要继续拆解。'),
      hiddenNeed,
      riskSignal: trimString(reply.riskSignal, '如果不补充证据，可能产生误读。'),
      suggestedReply,
      contentAction,
      evidenceNeeded: stringArray(reply.evidenceNeeded, []),
    };
  });

  const risks = recordArray(value.risks).map(parseRiskRecord);

  const interventions = recordArray(value.interventions).map<PreflightIntervention>((item, index) => {
    const action = trimString(item.change ?? item.action, '改写开头，让用户更快知道为什么现在要看。');
    const reason = trimString(item.problem ?? item.reason, '首屏信息决定停留。');
    const expectedChange = trimString(item.expectedEffect ?? item.expectedChange, '提升相关用户停留率，减少误读。');

    return {
      priority: oneOf(item.priority, ['P0', 'P1', 'P2'] as const, 'P1'),
      target: oneOf(
        item.target,
        [
          'cover',
          'title',
          'opening',
          'body',
          'comment',
          'proof',
          'next_post',
          'comment_prompt',
          'timing',
          'offer',
          'script',
        ] as const,
        'opening',
      ),
      action,
      reason,
      expectedChange,
      id: trimString(item.id, createFallbackId('intervention', index)),
      problem: reason,
      change: action,
      exampleRewrite: trimString(item.exampleRewrite, action),
      expectedEffect: expectedChange,
      effort: oneOf(item.effort, ['low', 'medium', 'high'] as const, 'medium'),
      evidenceSource: trimString(item.evidenceSource, 'simulatedReplies + visualRead + contentPromise'),
    };
  });

  const contentRead: PreflightContentRead = {
    oneLineIntent: trimString(contentReadValue.oneLineIntent ?? contentPromiseValue.oneLinePromise, '验证发布前内容是否值得推出。'),
    platformFit: trimString(contentReadValue.platformFit, '需要根据平台语境调整第一眼信息。'),
    likelyHook: trimString(contentReadValue.likelyHook ?? contentPromiseValue.promisedValue, '用户会先看标题、封面和前两秒表达。'),
    missingContext: stringArray(contentReadValue.missingContext, stringArray(contentPromiseValue.proofMissing, ['缺少真实发布后的反馈。'])),
    assumptions: stringArray(contentReadValue.assumptions, [trimString(contentPromiseValue.overclaimRisk, '本结果是发布前模拟，不代表真实流量承诺。')]),
  };
  const imageInsight: PreflightImageInsight = {
    summary: trimString(imageInsightValue.summary ?? visualReadValue.strongestSignal, '未提供图片，主要依据文案模拟。'),
    visibleElements: stringArray(imageInsightValue.visibleElements, stringArray(visualReadValue.visibleObjects, ['未提供图片'])),
    coverRead: trimString(imageInsightValue.coverRead ?? visualReadValue.firstGlance, '封面吸引力需要结合具体素材判断。'),
    textOnImage: stringArray(imageInsightValue.textOnImage, stringArray(visualReadValue.visibleText)),
    ambiguity: trimString(
      imageInsightValue.ambiguity,
      stringArray(visualReadValue.confusionPoints, ['素材信息不足时可能造成误读。'])[0] ?? '素材信息不足时可能造成误读。',
    ),
    attentionScore: scoreNumberInRange(imageInsightValue.attentionScore ?? visualReadValue.coverScore, 55),
    risks: stringArray(imageInsightValue.risks, stringArray(visualReadValue.confusionPoints, ['图片证据不足。'])),
    improvementIdeas: stringArray(imageInsightValue.improvementIdeas, stringArray(visualReadValue.missingAnnotations, ['补充能一眼看懂的主体和利益点。'])),
  };
  const pushModel: PreflightPushModel = {
    summary: trimString(pushModelValue.summary, '平台会先给相关人群，再向泛兴趣和弱相关人群扩散。'),
    nonRelevantShare: percentNumberInRange(pushModelValue.nonRelevantShare, 28),
    platformDrift: trimString(pushModelValue.platformDrift, '标签相似但需求不同的用户可能被推到。'),
    cohorts: ensureRequiredCohorts(cohorts),
  };
  const confidence: PreflightConfidence = {
    level: oneOf(confidenceValue.level, ['low', 'medium', 'high'] as const, 'medium'),
    score: scoreNumberInRange(confidenceValue.score, 62),
    rationale: trimString(confidenceValue.rationale, '基于输入内容、图片线索和平台分发常识进行模拟。'),
    limitations: stringArray(confidenceValue.limitations, ['没有接入真实平台私域数据。']),
  };
  const warnings = stringArray(value.warnings);
  const riskReview = parseRiskReview(value.riskReview, risks);
  const simulatedMetrics = parseSimulatedMetrics(value.simulatedMetrics, imageInsight, confidence, simulatedReplies);
  const qualityCheck = parseQualityCheck(value.qualityCheck, confidence, warnings);
  const publishSafetyReview = parsePublishSafetyReview(
    value.publishSafetyReview,
    risks,
    riskReview,
    qualityCheck,
    warnings,
  );
  const growthBrief = parseGrowthBrief(
    value.growthBrief,
    parseContentPromise(value.contentPromise, contentRead),
    parseVisualRead(value.visualRead, imageInsight),
    simulatedReplies,
    interventions,
    publishSafetyReview,
  );

  return {
    schemaVersion: 'preflight_v2',
    generatedAt: trimString(value.generatedAt, new Date().toISOString()),
    provider: oneOf(value.provider, ['doubao', 'mock'] as const, 'mock'),
    model: trimString(value.model, 'preflight-simulator'),
    mode: oneOf(value.mode, preflightSimulationModes, 'quick'),
    scenario: parseScenario(value.scenario),
    degraded: booleanValue(value.degraded),
    fallbackReason: trimString(value.fallbackReason) || undefined,
    contentPromise: parseContentPromise(value.contentPromise, contentRead),
    contentRead,
    visualRead: parseVisualRead(value.visualRead, imageInsight),
    imageInsight,
    audienceDistribution: parseAudienceDistribution(value.audienceDistribution, pushModel.cohorts),
    pushModel,
    simulatedReplies,
    riskReview,
    risks,
    interventions,
    simulatedMetrics,
    qualityCheck,
    publishSafetyReview,
    growthBrief,
    confidence,
    warnings,
  };
}

export function parsePreflightSimulationJob(value: unknown): PreflightSimulationJob {
  if (!isRecord(value)) {
    throw new PreflightSchemaError('任务结果必须是对象。');
  }

  const stageValues = recordArray(value.stages).map<PreflightJobStage>((stage, index) => ({
    key: oneOf(
      stage.key,
      ['queued', 'content_read', 'image_read', 'push_model', 'reply_simulation', 'synthesis', 'complete'] as const,
      index === 0 ? 'content_read' : 'queued',
    ),
    label: trimString(stage.label, `阶段 ${index + 1}`),
    detail: trimString(stage.detail, '等待中。'),
    status: oneOf(stage.status, ['pending', 'running', 'completed', 'error'] as const, 'pending'),
    startedAt: trimString(stage.startedAt) || undefined,
    completedAt: trimString(stage.completedAt) || undefined,
  }));

  return {
    id: trimString(value.id, 'preflight_job'),
    workspaceId: trimString(value.workspaceId, 'default'),
    status: oneOf(value.status, ['queued', 'running', 'completed', 'degraded', 'error'] as const, 'queued'),
    currentStageKey: oneOf(
      value.currentStageKey,
      ['queued', 'content_read', 'image_read', 'push_model', 'reply_simulation', 'synthesis', 'complete'] as const,
      'queued',
    ),
    currentStageLabel: trimString(value.currentStageLabel, '排队中'),
    message: trimString(value.message, '等待开始。'),
    createdAt: trimString(value.createdAt, new Date().toISOString()),
    updatedAt: trimString(value.updatedAt, new Date().toISOString()),
    stages: stageValues,
    result: value.result ? parsePreflightSimulationResult(value.result) : undefined,
    error: trimString(value.error) || undefined,
    fallbackReason: trimString(value.fallbackReason) || undefined,
  };
}

export function ensureRequiredCohorts(cohorts: PreflightPushCohort[]) {
  const required: Array<Pick<PreflightPushCohort, 'id' | 'label' | 'relevanceTier' | 'whyPushed' | 'likelyBehavior' | 'misunderstandingRisk' | 'conversionIntent'> & { exposureShare: number }> = [
    {
      id: 'cohort_core',
      label: '核心受众',
      relevanceTier: 'core',
      exposureShare: 34,
      whyPushed: '内容标签与显性需求高度匹配。',
      likelyBehavior: '愿意停留、追问细节或保存。',
      misunderstandingRisk: '如果证据不足，会担心只是广告。',
      conversionIntent: '有明确到店或互动可能。',
    },
    {
      id: 'cohort_broad',
      label: '泛兴趣受众',
      relevanceTier: 'broad',
      exposureShare: 28,
      whyPushed: '平台根据相邻兴趣和同城/社交关系扩散。',
      likelyBehavior: '先看热闹，再判断是否和自己有关。',
      misunderstandingRisk: '可能只记住噱头，忽略转化目标。',
      conversionIntent: '需要强提示才会行动。',
    },
    {
      id: 'cohort_weak',
      label: '弱相关受众',
      relevanceTier: 'weak',
      exposureShare: 22,
      whyPushed: '大数据会把相似内容消费人群一起测试。',
      likelyBehavior: '容易划走，也可能留下随口评价。',
      misunderstandingRisk: '可能把内容看成普通广告或无关生活分享。',
      conversionIntent: '转化弱，更多贡献噪声反馈。',
    },
    {
      id: 'cohort_misfire',
      label: '误推 / 路过用户',
      relevanceTier: 'misfire',
      exposureShare: 16,
      whyPushed: '平台早期探索会混入低相关样本来校准内容标签。',
      likelyBehavior: '不理解语境，可能吐槽、问错重点或直接划走。',
      misunderstandingRisk: '容易把核心卖点误读成不相关话题。',
      conversionIntent: '几乎不转化，但会影响评论区语气。',
    },
  ];

  const byTier = new Map(cohorts.map((cohort) => [cohort.relevanceTier, cohort]));
  return required.map((fallback) => byTier.get(fallback.relevanceTier) ?? fallback);
}

export function summarizePreflightDraft(request: PreflightSimulationRequest) {
  const title = request.contentDraft.title ? `标题：${request.contentDraft.title}` : '';
  const body = request.contentDraft.body ? `正文：${request.contentDraft.body}` : '';
  const script = request.contentDraft.script ? `脚本：${request.contentDraft.script}` : '';
  return [title, body, script].filter(Boolean).join('\n\n');
}

export function getPreflightPlatformLabel(platform: PreflightPlatform) {
  const labels: Record<PreflightPlatform, string> = {
    campus_ai_competition: 'PCG 校园 AI 大赛评审',
    xiaohongshu: '小红书',
    wechat_channels: '视频号',
    douyin: '抖音',
    bilibili: 'B站',
    weibo: '微博',
    generic: '通用社媒',
  };
  return labels[platform];
}

export function getPreflightGoalLabel(goal: PreflightGoal) {
  const labels: Record<PreflightGoal, string> = {
    follower_growth: '涨粉推演',
    submission_readiness: '参赛交付就绪',
    store_visit: '到店 / 到场',
    ugc: 'UGC 参与',
    comment: '评论互动',
    lead: '留资 / 咨询',
    awareness: '认知曝光',
    conversion: '购买转化',
    generic: '综合验证',
  };
  return labels[goal];
}

export function getRelevanceTierLabel(tier: PreflightRelevanceTier) {
  const labels: Record<PreflightRelevanceTier, string> = {
    core: '核心受众',
    broad: '泛兴趣受众',
    weak: '弱相关受众',
    misfire: '误推 / 路过用户',
  };
  return labels[tier];
}
