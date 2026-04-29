import {
  ensureRequiredCohorts,
  parsePreflightSimulationResult,
  type PreflightJobStageKey,
  type PreflightJobStageStatus,
  type PreflightRelevanceTier,
  type PreflightSimulatedReply,
  type PreflightSimulationRequest,
  type PreflightSimulationResult,
} from '../../../shared/preflightSimulation';
import { buildPreflightQualityAgentPrompt, buildPreflightSimulationPrompt } from './prompt';
import {
  createPreflightModelProvider,
  resolveImagePayloads,
  type PreflightModelProvider,
} from './modelProvider';
import { createMockPreflightResult } from './mockProvider';

export type PreflightProgressUpdate = {
  key: PreflightJobStageKey;
  label: string;
  detail: string;
  status: PreflightJobStageStatus;
};

export type RunPreflightSimulationOptions = {
  provider?: PreflightModelProvider;
  onProgress?: (update: PreflightProgressUpdate) => void;
};

function reportProgress(
  onProgress: RunPreflightSimulationOptions['onProgress'],
  update: PreflightProgressUpdate,
) {
  onProgress?.(update);
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function mergeUniqueStrings(...groups: string[][]) {
  return Array.from(new Set(groups.flat().map((item) => item.trim()).filter(Boolean)));
}

function mergeRecord(base: unknown, patch: unknown) {
  return {
    ...(isRecord(base) ? base : {}),
    ...(isRecord(patch) ? patch : {}),
  };
}

function deepMergeRecord(base: unknown, patch: unknown): JsonRecord {
  const baseRecord = isRecord(base) ? base : {};
  const patchRecord = isRecord(patch) ? patch : {};
  const nextRecord: JsonRecord = {
    ...baseRecord,
  };

  Object.entries(patchRecord).forEach(([key, value]) => {
    if (isRecord(value) && isRecord(baseRecord[key])) {
      nextRecord[key] = deepMergeRecord(baseRecord[key], value);
      return;
    }

    nextRecord[key] = value;
  });

  return nextRecord;
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readRecordArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function normalizeSketchTier(value: unknown, index: number): PreflightRelevanceTier {
  if (value === 'core' || value === 'broad' || value === 'weak' || value === 'misfire') {
    return value;
  }

  return requiredReplyTiers[index % requiredReplyTiers.length];
}

function normalizeQuickSketchReplies(rawResult: JsonRecord) {
  const sourceReplies = readRecordArray(rawResult.simulatedReplies).length > 0
    ? readRecordArray(rawResult.simulatedReplies)
    : readRecordArray(rawResult.comments);

  return sourceReplies.map((reply, index) => {
    const tier = normalizeSketchTier(reply.relevanceTier ?? reply.tier, index);
    const text = readString(reply.text ?? reply.comment, '这条内容有点意思，但还需要更多信息。');

    return {
      id: readString(reply.id, `remote_quick_reply_${index + 1}`),
      cohortId: readString(reply.cohortId, `cohort_${tier}`),
      userType: readString(reply.userType ?? reply.userProfile, `${tier} 用户`),
      relevanceTier: tier,
      sentiment: readString(reply.sentiment, tier === 'misfire' ? 'negative' : tier === 'weak' ? 'skeptical' : 'positive'),
      replyType: readString(reply.replyType, tier === 'misfire' ? 'objection' : tier === 'weak' ? 'misread' : 'question'),
      text,
      comment: text,
      surfaceIntent: readString(reply.surfaceIntent, '快速判断是否值得继续看。'),
      hiddenNeed: readString(reply.hiddenNeed ?? reply.why, '需要更明确的证据和行动入口。'),
      conversionSignal: readString(reply.conversionSignal, tier === 'core' ? '有进一步行动意愿。' : '转化仍需更多证据。'),
      riskSignal: readString(reply.riskSignal, tier === 'misfire' || tier === 'weak' ? '可能误读内容目的。' : '风险较低。'),
      suggestedReply: readString(reply.suggestedReply, '这个点我会补清楚：先说明边界，再补证据和入口。'),
      contentAction: readString(reply.contentAction ?? reply.intervention, '把证据、边界和下一步行动放到正文前半段。'),
      evidenceNeeded: readStringArray(reply.evidenceNeeded),
    };
  });
}

function normalizeQuickSketchInterventions(rawResult: JsonRecord) {
  const interventions = readRecordArray(rawResult.interventions);

  if (interventions.length > 0) {
    return interventions;
  }

  const actions = isRecord(rawResult.actions) ? rawResult.actions : {};
  const actionEntries = [
    ['title', actions.titleFix],
    ['cover', actions.coverFix],
    ['comment', actions.pinnedComment],
    ['next_post', actions.nextPost],
  ].filter(([, value]) => typeof value === 'string' && value.trim());

  return actionEntries.map(([target, value], index) => ({
    id: `remote_quick_action_${index + 1}`,
    priority: index === 0 ? 'P0' : 'P1',
    target,
    problem: '远端 quick 草图指出该位置需要优化。',
    change: value,
    exampleRewrite: value,
    expectedEffect: '提升首屏理解和发布前安全性。',
    effort: 'low',
    evidenceSource: 'visualRead.strongestSignal',
  }));
}

function normalizeQuickSketchSafety(baseSafetyReview: unknown, rawResult: JsonRecord) {
  const directSafety = isRecord(rawResult.publishSafetyReview) ? rawResult.publishSafetyReview : {};
  const sketchSafety = isRecord(rawResult.safety) ? rawResult.safety : {};
  const mergedSafety = deepMergeRecord(baseSafetyReview, deepMergeRecord(directSafety, sketchSafety));

  if (!Array.isArray(mergedSafety.redFlags) || mergedSafety.redFlags.length === 0) {
    const mustFix = readStringArray(mergedSafety.mustFixBeforePublish);
    mergedSafety.redFlags = mustFix.slice(0, 1).map((item, index) => ({
      id: `remote_quick_safety_${index + 1}`,
      title: item,
      severity: 'medium',
      area: 'misleading_context',
      trigger: item,
      whyItMatters: '发布前需要避免误导、授权或口径风险。',
      evidence: 'publishSafetyReview.mustFixBeforePublish',
      fix: item,
      owner: 'ops',
    }));
  }

  return mergedSafety;
}

function expandQuickRemoteSketch(rawResult: Record<string, unknown>, request: PreflightSimulationRequest) {
  const baseResult = createMockPreflightResult(request) as JsonRecord;
  const sketchReplies = normalizeQuickSketchReplies(rawResult);
  const sketchInterventions = normalizeQuickSketchInterventions(rawResult);
  const simulatedMetricsPatch = isRecord(rawResult.metrics)
    ? {
        attentionScore: readNumber(rawResult.metrics.attention, undefined as unknown as number),
        saveIntentScore: readNumber(rawResult.metrics.save, undefined as unknown as number),
        commentIntentScore: readNumber(rawResult.metrics.comment, undefined as unknown as number),
        followIntentScore: readNumber(rawResult.metrics.follow, undefined as unknown as number),
        shareIntentScore: readNumber(rawResult.metrics.share, undefined as unknown as number),
      }
    : {};

  Object.keys(simulatedMetricsPatch).forEach((key) => {
    if (!Number.isFinite(simulatedMetricsPatch[key as keyof typeof simulatedMetricsPatch])) {
      delete simulatedMetricsPatch[key as keyof typeof simulatedMetricsPatch];
    }
  });

  return deepMergeRecord(baseResult, {
    ...rawResult,
    contentRead: deepMergeRecord(baseResult.contentRead, rawResult.contentRead),
    visualRead: deepMergeRecord(baseResult.visualRead, rawResult.visualRead),
    imageInsight: deepMergeRecord(baseResult.imageInsight, rawResult.imageInsight),
    pushModel: deepMergeRecord(baseResult.pushModel, rawResult.pushModel),
    simulatedReplies: sketchReplies.length > 0 ? sketchReplies : rawResult.simulatedReplies,
    interventions: sketchInterventions.length > 0 ? sketchInterventions : rawResult.interventions,
    growthBrief: deepMergeRecord(baseResult.growthBrief, rawResult.growthBrief),
    simulatedMetrics: deepMergeRecord(
      baseResult.simulatedMetrics,
      deepMergeRecord(rawResult.simulatedMetrics, simulatedMetricsPatch),
    ),
    qualityCheck: deepMergeRecord(baseResult.qualityCheck, rawResult.qualityCheck ?? rawResult.quality),
    publishSafetyReview: normalizeQuickSketchSafety(baseResult.publishSafetyReview, rawResult),
    confidence: deepMergeRecord(baseResult.confidence, rawResult.confidence),
    risks: readRecordArray(rawResult.risks).length > 0 ? rawResult.risks : baseResult.risks,
    warnings: mergeUniqueStrings(
      readStringArray(baseResult.warnings),
      readStringArray(rawResult.warnings),
      ['真实 quick provider 返回短草图，服务端已补齐发布前试映结构。'],
    ),
  });
}

function mergeQualityAgentResult(
  rawResult: Record<string, unknown>,
  qualityResult: Record<string, unknown>,
) {
  const qualityCheck = isRecord(qualityResult.qualityCheck) ? qualityResult.qualityCheck : undefined;
  const publishSafetyReview = isRecord(qualityResult.publishSafetyReview)
    ? qualityResult.publishSafetyReview
    : undefined;
  const qualityWarnings = readStringArray(qualityResult.warnings);
  const rawWarnings = readStringArray(rawResult.warnings);
  const nextResult: Record<string, unknown> = {
    ...rawResult,
    warnings: mergeUniqueStrings([
      ...rawWarnings,
      ...qualityWarnings,
      '质量检测 Agent 已完成 deep 模式复核。',
    ]),
  };

  if (qualityCheck) {
    const baseQualityCheck = isRecord(rawResult.qualityCheck) ? rawResult.qualityCheck : {};
    nextResult.qualityCheck = {
      ...baseQualityCheck,
      ...qualityCheck,
      outputWarnings: mergeUniqueStrings(
        readStringArray(baseQualityCheck.outputWarnings),
        readStringArray(qualityCheck.outputWarnings),
        qualityWarnings,
      ),
    };
  }

  if (publishSafetyReview) {
    nextResult.publishSafetyReview = mergeRecord(rawResult.publishSafetyReview, publishSafetyReview);
  }

  return nextResult;
}

function markQualityAgentFailure(rawResult: Record<string, unknown>, message: string) {
  const warning = `质量检测 Agent 未完成，已保留基础推演结果：${message}`;
  const baseQualityCheck = isRecord(rawResult.qualityCheck) ? rawResult.qualityCheck : {};

  return {
    ...rawResult,
    degraded: true,
    fallbackReason: rawResult.fallbackReason ?? warning,
    warnings: mergeUniqueStrings(readStringArray(rawResult.warnings), [warning]),
    qualityCheck: {
      ...baseQualityCheck,
      needsHumanReview: mergeUniqueStrings(
        readStringArray(baseQualityCheck.needsHumanReview),
        ['质量检测 Agent 未完成，请人工复核关键判断。'],
      ),
      outputWarnings: mergeUniqueStrings(readStringArray(baseQualityCheck.outputWarnings), [warning]),
    },
  };
}

function mergeMissingItems<T>(items: T[], fallbackItems: T[], minCount: number, getKey: (item: T) => string) {
  const nextItems = [...items];
  const seenIds = new Set(nextItems.map(getKey));

  fallbackItems.forEach((item) => {
    const itemKey = getKey(item);
    if (nextItems.length >= minCount || seenIds.has(itemKey)) {
      return;
    }

    nextItems.push(item);
    seenIds.add(itemKey);
  });

  return nextItems;
}

function countRepliesByTierInList(replies: PreflightSimulatedReply[], tier: PreflightRelevanceTier) {
  return replies.filter((reply) => reply.relevanceTier === tier).length;
}

const requiredReplyTiers: PreflightRelevanceTier[] = ['core', 'broad', 'weak', 'misfire'];

function getContentTopic(request: PreflightSimulationRequest) {
  const title = request.contentDraft.title.trim();
  if (title) {
    return title;
  }

  const body = request.contentDraft.body.trim() || request.contentDraft.script.trim();
  return body ? `${body.slice(0, 28)}${body.length > 28 ? '...' : ''}` : '这条内容';
}

function getCoverageBackfillText(request: PreflightSimulationRequest, tier: PreflightRelevanceTier, variant: number) {
  const topic = getContentTopic(request);
  const sourceText = [
    request.contentDraft.title,
    request.contentDraft.body,
    request.contentDraft.script,
    request.accountContext,
    request.targetAudience,
  ].join(' ');
  const isCompetition = request.platform === 'campus_ai_competition' || request.goal === 'submission_readiness';
  const isGame = /洛克|王国|精灵|游戏|上线|玩法|玩家|开放世界|战斗|社交/.test(sourceText);

  if (isCompetition) {
    const variants: Record<PreflightRelevanceTier, string[]> = {
      core: [
        `${topic}的方向能看懂，但我会先问 Demo 能不能现场跑通。`,
        `如果这是提交材料，我还需要看到真实输入、输出和失败边界。`,
      ],
      broad: [
        `价值点有了，但评审第一眼可能分不清它和普通工具的差异。`,
        `材料结构可以更清楚：问题、Demo、AI能力、提交证据要一眼对应。`,
      ],
      weak: [
        `我不是这个方向的评委，可能只会检查隐私、授权和材料完整性。`,
        `如果截图像概念图，我会怀疑真实可用程度。`,
      ],
      misfire: [
        `这类项目如果承诺过满，容易被质疑是在包装概念而不是产品。`,
        `如果出现官方背书或结果承诺，我会直接标成高风险。`,
      ],
    };
    return variants[tier][variant % variants[tier].length];
  }

  if (isGame) {
    const variants: Record<PreflightRelevanceTier, string[]> = {
      core: [
        `${topic}能打中老玩家情绪，但我会想确认这些玩法是不是都已公开。`,
        `如果后续能继续整理精灵、玩法和活动公开信息，我会愿意关注。`,
      ],
      broad: [
        `画面和氛围有吸引力，但我更想看实机或官方素材，不只是概念感封面。`,
        `开放世界和精灵收集是兴趣点，正文需要更快告诉我第一天能玩什么。`,
      ],
      weak: [
        `我主要是被图吸引，但没看懂这是正式画面、官方素材还是内部预演图。`,
        `如果只是情怀，我可能会划走；需要更明确的玩法信息留住我。`,
      ],
      misfire: [
        `我不熟这个 IP，官方口吻如果太像广告，可能会直接划走。`,
        `如果出现未公开福利、概率或战力承诺，我会质疑可信度。`,
      ],
    };
    return variants[tier][variant % variants[tier].length];
  }

  const variants: Record<PreflightRelevanceTier, string[]> = {
    core: [
      `${topic}和我的需求相关，但我需要看到更具体的证据和下一步入口。`,
      `这个方向有关注价值，如果后续能持续更新同主题内容我会考虑关注。`,
    ],
    broad: [
      `第一眼有兴趣，但正文要更快解释和我有什么关系。`,
      `我会先收藏看看，是否关注取决于下一条内容是否连续。`,
    ],
    weak: [
      `我只被封面吸引，暂时没看懂这条内容要解决什么问题。`,
      `如果标题和画面边界不清，我可能会误读内容目的。`,
    ],
    misfire: [
      `这条内容不太像推给我的，标签可能需要收窄。`,
      `如果表达过满或像广告，我可能会在评论区质疑可信度。`,
    ],
  };

  return variants[tier][variant % variants[tier].length];
}

function createCoverageBackfillReply(
  request: PreflightSimulationRequest,
  tier: PreflightRelevanceTier,
  index: number,
  cohortId: string,
): PreflightSimulatedReply {
  const userLabels: Record<PreflightRelevanceTier, string> = {
    core: '补齐模拟 · 核心用户',
    broad: '补齐模拟 · 泛兴趣用户',
    weak: '补齐模拟 · 弱相关用户',
    misfire: '补齐模拟 · 误推用户',
  };
  const sentiments: Record<PreflightRelevanceTier, PreflightSimulatedReply['sentiment']> = {
    core: 'positive',
    broad: 'neutral',
    weak: 'skeptical',
    misfire: 'negative',
  };
  const replyTypes: Record<PreflightRelevanceTier, PreflightSimulatedReply['replyType']> = {
    core: 'follow_signal',
    broad: 'question',
    weak: 'misread',
    misfire: 'objection',
  };
  const text = getCoverageBackfillText(request, tier, index);

  return {
    id: `coverage_${tier}_${index + 1}`,
    cohortId,
    userType: userLabels[tier],
    relevanceTier: tier,
    sentiment: sentiments[tier],
    replyType: replyTypes[tier],
    text,
    why: '豆包本次未完整覆盖该人群层，系统按当前标题、正文和安全边界补齐一条覆盖样本。',
    conversionSignal: '覆盖补齐样本，需人工复核，不应当作豆包真实判断。',
    intervention: '复核该人群是否需要保留；若保留，补充对应证据、授权或发布边界。',
    comment: text,
    surfaceIntent: '覆盖缺口提示',
    hiddenNeed: '需要避免只看豆包返回的部分评论就误判整条内容。',
    riskSignal: '评论覆盖不足会让发布风险被低估。',
    suggestedReply: '这条是发布前覆盖补齐样本，正式判断以前还要结合真实评论和运营复核。',
    contentAction: '在发布前复核评论覆盖层，确认核心、泛兴趣、弱相关和误推用户都有样本。',
    evidenceNeeded: ['评论覆盖复核', '素材授权', '公开口径边界'],
  };
}

function completeReplyCoverage(
  replies: PreflightSimulatedReply[],
  request: PreflightSimulationRequest,
  cohorts: PreflightSimulationResult['pushModel']['cohorts'],
) {
  const nextReplies = [...replies];
  const tierToCohortId = new Map(cohorts.map((cohort) => [cohort.relevanceTier, cohort.id]));
  let backfillIndex = 0;

  requiredReplyTiers.forEach((tier) => {
    while (countRepliesByTierInList(nextReplies, tier) < 2) {
      nextReplies.push(
        createCoverageBackfillReply(
          request,
          tier,
          backfillIndex,
          tierToCohortId.get(tier) ?? `cohort_${tier}`,
        ),
      );
      backfillIndex += 1;
    }
  });

  while (nextReplies.length < 8) {
    const tier = requiredReplyTiers[backfillIndex % requiredReplyTiers.length];
    nextReplies.push(
      createCoverageBackfillReply(
        request,
        tier,
        backfillIndex,
        tierToCohortId.get(tier) ?? `cohort_${tier}`,
      ),
    );
    backfillIndex += 1;
  }

  return nextReplies;
}

function getScenarioDisclaimer(isGrowth: boolean, isCompetition: boolean) {
  if (isCompetition) {
    return '以下为提交前模拟值，不代表官方评审结论、晋级或奖项承诺。';
  }

  if (isGrowth) {
    return '以下为发布前模拟值，不代表真实播放、点赞或涨粉承诺。';
  }

  return '以下为发布前模拟值，不代表真实曝光、转化或评论承诺。';
}

function normalizePreflightResult(
  rawResult: Record<string, unknown>,
  request: PreflightSimulationRequest,
  provider: PreflightModelProvider,
): PreflightSimulationResult {
  const isGrowth = request.goal === 'follower_growth';
  const isCompetition = request.platform === 'campus_ai_competition' || request.goal === 'submission_readiness';
  const scenario = isGrowth ? 'koc_growth' : isCompetition ? 'campus_submission' : 'brand_post';
  const expandedRawResult = request.mode === 'quick' && provider.provider !== 'mock' && rawResult.degraded !== true
    ? expandQuickRemoteSketch(rawResult, request)
    : rawResult;
  const parsed = parsePreflightSimulationResult({
    ...expandedRawResult,
    provider: provider.provider,
    model: provider.model,
    mode: request.mode,
    scenario,
    generatedAt: new Date().toISOString(),
  });
  const fallback = parsePreflightSimulationResult(createMockPreflightResult(request));
  const cohorts = ensureRequiredCohorts(parsed.pushModel.cohorts);
  const cohortIds = new Set(cohorts.map((cohort) => cohort.id));
  let simulatedReplies = parsed.simulatedReplies.map((reply) => ({
    ...reply,
    cohortId: cohortIds.has(reply.cohortId) ? reply.cohortId : `cohort_${reply.relevanceTier}`,
  }));

  simulatedReplies = completeReplyCoverage(simulatedReplies, request, cohorts);

  const nonRelevantShare = cohorts
    .filter((cohort) => cohort.relevanceTier === 'weak' || cohort.relevanceTier === 'misfire')
    .reduce((sum, cohort) => sum + cohort.exposureShare, 0);

  return parsePreflightSimulationResult({
    ...parsed,
    scenario,
    pushModel: {
      ...parsed.pushModel,
      cohorts,
      nonRelevantShare,
    },
    simulatedMetrics: {
      ...parsed.simulatedMetrics,
      disclaimer: getScenarioDisclaimer(isGrowth, isCompetition),
    },
    simulatedReplies,
    risks: mergeMissingItems(parsed.risks, fallback.risks, 3, (risk) => risk.title),
    interventions: mergeMissingItems(
      parsed.interventions,
      fallback.interventions,
      4,
      (intervention) => `${intervention.priority}-${intervention.target}-${intervention.action}`,
    ),
    publishSafetyReview: parsed.publishSafetyReview.redFlags.length > 0
      ? parsed.publishSafetyReview
      : fallback.publishSafetyReview,
    warnings: Array.from(
      new Set([
        ...parsed.warnings,
        isGrowth
          ? '增长推演只能模拟可能反应，不能承诺真实播放量、点赞量或涨粉数。'
          : isCompetition
          ? '提交前试映只能模拟评审关注点，不能代表官方评审结论、晋级或奖项。'
          : '发布前试映只能模拟可能反应，不能承诺真实播放量、点赞量或评论逐字命中。',
      ]),
    ),
  });
}

export async function runPreflightSimulation(
  request: PreflightSimulationRequest,
  options: RunPreflightSimulationOptions = {},
) {
  const provider = options.provider ?? createPreflightModelProvider();
  const isGrowth = request.goal === 'follower_growth';
  const isCompetition = request.platform === 'campus_ai_competition' || request.goal === 'submission_readiness';

  reportProgress(options.onProgress, {
    key: 'content_read',
    label: '读取输入材料',
    detail: isGrowth ? '正在提取平台、账号定位、作品标题、正文和增长目标。' : isCompetition ? '正在提取赛道、产品标题、方案说明和提交动作。' : '正在提取平台、目标、标题、正文和行动意图。',
    status: 'running',
  });
  const prompt = buildPreflightSimulationPrompt(request);
  reportProgress(options.onProgress, {
    key: 'content_read',
    label: '读取输入材料',
    detail: isGrowth ? '已完成账号语境和内容草稿读取。' : isCompetition ? '已完成参赛材料和提交目标读取。' : '已完成内容草稿和发布目标读取。',
    status: 'completed',
  });

  reportProgress(options.onProgress, {
    key: 'image_read',
    label: '读取图片 / 素材',
    detail: request.mediaAssets.length > 0 ? '正在整理图片 payload。' : '未提供图片，跳过视觉输入。',
    status: 'running',
  });
  const images = resolveImagePayloads(request.mediaAssets);
  reportProgress(options.onProgress, {
    key: 'image_read',
    label: '读取图片 / 素材',
    detail: images.length > 0 ? `已准备 ${images.length} 张图片。` : '本次仅基于文本材料模拟。',
    status: 'completed',
  });

  reportProgress(options.onProgress, {
    key: 'push_model',
    label: '模拟反馈视角',
    detail: isGrowth
      ? '正在要求模型显式构造核心粉、泛兴趣、路过用户和误推噪声。'
      : isCompetition
      ? '正在要求模型显式构造产品价值、赛道匹配、提交完整性和风险边界视角。'
      : '正在要求模型显式构造核心、泛兴趣、弱相关和误推用户。',
    status: 'running',
  });
  reportProgress(options.onProgress, {
    key: 'reply_simulation',
    label: '生成模拟反馈',
    detail: isGrowth ? '正在生成关注信号、收藏理由、评论走向和划走信号。' : isCompetition ? '正在生成评委追问、格式检查和风险提示。' : '正在生成首批评论、质疑、误读和划走信号。',
    status: 'running',
  });

  let rawResult: Record<string, unknown>;
  let usedSimulationFallback = false;

  try {
    rawResult = await provider.generateJson({
      request,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      images,
    });
  } catch (error) {
    if (provider.provider === 'mock') {
      throw error;
    }

    usedSimulationFallback = true;
    const message =
      error instanceof Error ? error.message : '远端模型返回不可用结果，已回退到本地模拟。';
    rawResult = {
      ...createMockPreflightResult(request),
      provider: provider.provider,
      model: provider.model,
      degraded: true,
      fallbackReason: message,
      warnings: [
        `远端豆包/火山方舟结果不可用，已使用本地模拟兜底：${message}`,
      ],
    };
  }

  if (request.mode === 'deep' && !usedSimulationFallback) {
    const baseResult = normalizePreflightResult(rawResult, request, provider);

    reportProgress(options.onProgress, {
      key: 'synthesis',
      label: '质量检测 Agent',
      detail: '正在复核证据支撑、评论覆盖、发布风险和可执行性。',
      status: 'running',
    });

    try {
      const qualityPrompt = buildPreflightQualityAgentPrompt(request, baseResult);
      const qualityResult = await provider.generateJson({
        request,
        systemPrompt: qualityPrompt.systemPrompt,
        userPrompt: qualityPrompt.userPrompt,
        images,
      });

      rawResult = mergeQualityAgentResult(rawResult, qualityResult);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '质量检测 Agent 返回不可用结果。';
      rawResult = markQualityAgentFailure(rawResult, message);
    }
  }

  const result = normalizePreflightResult(rawResult, request, provider);

  reportProgress(options.onProgress, {
    key: 'push_model',
    label: '模拟反馈视角',
    detail: isGrowth ? '已完成传播人群分层。' : isCompetition ? '已完成评审关注点分层。' : '已完成非精准推流分层。',
    status: 'completed',
  });
  reportProgress(options.onProgress, {
    key: 'reply_simulation',
    label: '生成模拟反馈',
    detail: isGrowth ? '已完成模拟用户反馈。' : isCompetition ? '已完成模拟评审反馈。' : '已完成首批模拟回复。',
    status: 'completed',
  });
  reportProgress(options.onProgress, {
    key: 'synthesis',
    label: '整理行动建议',
    detail: request.mode === 'deep'
      ? '已完成质量检测 Agent 复核并收拢行动建议。'
      : isGrowth ? '正在收拢内容方向、选题建议、发布策略、互动优化和账号成长计划。' : isCompetition ? '正在收拢提交风险、评审追问和修改动作。' : '正在收拢风险、误解和发布前修改动作。',
    status: 'completed',
  });

  return result;
}
