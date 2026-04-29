import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parsePreflightSimulationJob,
  parsePreflightSimulationRequest,
  parsePreflightSimulationResult,
} from './preflightSimulation';

test('parsePreflightSimulationRequest keeps the lightweight form fields', () => {
  const request = parsePreflightSimulationRequest({
    workspaceId: 'demo',
    platform: 'xiaohongshu',
    goal: 'store_visit',
    mode: 'quick',
    contentDraft: {
      title: '标题',
      body: '正文',
    },
  });

  assert.equal(request.workspaceId, 'demo');
  assert.equal(request.platform, 'xiaohongshu');
  assert.equal(request.goal, 'store_visit');
  assert.equal(request.contentDraft.title, '标题');
  assert.equal(request.contentDraft.body, '正文');
});

test('parsePreflightSimulationResult always injects the required push cohorts', () => {
  const result = parsePreflightSimulationResult({
    provider: 'mock',
    mode: 'quick',
    pushModel: {
      cohorts: [
        {
          id: 'cohort_core',
          label: '核心受众',
          relevanceTier: 'core',
          exposureShare: 42,
        },
      ],
    },
  });

  assert.equal(result.pushModel.cohorts.length, 4);
  assert.deepEqual(
    result.pushModel.cohorts.map((cohort) => cohort.relevanceTier),
    ['core', 'broad', 'weak', 'misfire'],
  );
});

test('parsePreflightSimulationResult normalizes ratio-style percent fields from remote models', () => {
  const result = parsePreflightSimulationResult({
    provider: 'doubao',
    mode: 'quick',
    imageInsight: {
      attentionScore: 0.68,
    },
    pushModel: {
      nonRelevantShare: 0.38,
      cohorts: [
        {
          id: 'cohort_core',
          label: '核心受众',
          relevanceTier: 'core',
          exposureShare: 0.34,
        },
        {
          id: 'cohort_broad',
          label: '泛兴趣受众',
          relevanceTier: 'broad',
          exposureShare: 0.28,
        },
        {
          id: 'cohort_weak',
          label: '弱相关受众',
          relevanceTier: 'weak',
          exposureShare: 0.22,
        },
        {
          id: 'cohort_misfire',
          label: '误推用户',
          relevanceTier: 'misfire',
          exposureShare: 0.16,
        },
      ],
    },
    confidence: {
      score: 0.72,
    },
  });

  assert.equal(result.imageInsight.attentionScore, 68);
  assert.equal(result.pushModel.nonRelevantShare, 38);
  assert.deepEqual(
    result.pushModel.cohorts.map((cohort) => cohort.exposureShare),
    [34, 28, 22, 16],
  );
  assert.equal(result.confidence.score, 72);
});

test('parsePreflightSimulationResult normalizes ten-point score fields without changing traffic shares', () => {
  const result = parsePreflightSimulationResult({
    schemaVersion: 'preflight_v2',
    provider: 'doubao',
    mode: 'quick',
    visualRead: {
      coverScore: 8,
    },
    imageInsight: {
      attentionScore: 7,
    },
    pushModel: {
      nonRelevantShare: 7,
      cohorts: [
        {
          id: 'cohort_core',
          label: '核心受众',
          relevanceTier: 'core',
          exposureShare: 7,
        },
      ],
    },
    confidence: {
      score: 6.8,
    },
    simulatedMetrics: {
      attentionScore: 7,
      saveIntentScore: 8,
      commentIntentScore: 5,
      followIntentScore: 6,
      shareIntentScore: 4,
      metricCards: [
        {
          label: '收藏',
          simulatedValue: 7,
          rationale: '模型误用十分制。',
        },
      ],
    },
    qualityCheck: {
      overallScore: 7,
      reliableSignals: ['定位精准匹配账号'],
      weakSignals: ['内容细节不全'],
      possibleHallucinations: [],
      needsHumanReview: ['核对单品总价是否真的为99元'],
      outputWarnings: [],
    },
    publishSafetyReview: {
      gate: 'revise',
      score: 6,
      summary: '需要复核价格与单品合规。',
      escalation: 'ops',
      redFlags: [],
      checklist: [],
      mustFixBeforePublish: [],
      safeRewriteHints: [],
    },
  });

  assert.equal(result.visualRead.coverScore, 80);
  assert.equal(result.imageInsight.attentionScore, 70);
  assert.equal(result.confidence.score, 68);
  assert.equal(result.simulatedMetrics.attentionScore, 70);
  assert.equal(result.simulatedMetrics.metricCards[0]?.simulatedValue, 70);
  assert.equal(result.qualityCheck.overallScore, 70);
  assert.equal(result.publishSafetyReview.score, 60);
  assert.equal(result.pushModel.nonRelevantShare, 7);
  assert.equal(result.pushModel.cohorts[0]?.exposureShare, 7);
});

test('parsePreflightSimulationResult keeps native V2 reply and intervention fields', () => {
  const result = parsePreflightSimulationResult({
    schemaVersion: 'preflight_v2',
    provider: 'doubao',
    mode: 'quick',
    scenario: 'koc_growth',
    contentPromise: {
      oneLinePromise: '99元改造桌面',
      targetUser: '宿舍学生',
      userPain: '桌面乱且预算少',
      promisedValue: '低预算清单',
      desiredAction: '收藏并关注下一期',
      proofProvided: ['封面对比'],
      proofMissing: ['价格表'],
      overclaimRisk: '可能误解为整套桌子只要99元',
    },
    visualRead: {
      firstGlance: '看到前后对比桌面',
      visibleText: ['99元'],
      visibleObjects: ['书架', '台灯'],
      strongestSignal: '低预算改造',
      confusionPoints: ['新增物品范围不清楚'],
      missingAnnotations: ['缺少价格标注'],
      coverScore: 0.72,
      mobileLegibility: 'medium',
    },
    audienceDistribution: [
      {
        id: 'cohort_core',
        tier: 'core',
        userProfile: '宿舍改造用户',
        exposureShare: 0.4,
        pushReason: '兴趣匹配',
        likelyReaction: '收藏并追问清单',
        conversionTrigger: '价格明细',
        dropOffReason: '担心标题党',
        misunderstandingRisk: '误解预算范围',
      },
    ],
    simulatedReplies: [
      {
        id: 'reply_1',
        cohortId: 'cohort_core',
        userType: '准新生',
        tier: 'core',
        sentiment: 'positive',
        replyType: 'question',
        comment: '99元包含桌子吗？',
        surfaceIntent: '确认预算范围',
        hiddenNeed: '想知道清单是否可复制',
        conversionSignal: '解释清楚后可能收藏',
        riskSignal: '预算误解',
        suggestedReply: '99元只包含新增收纳和灯具，桌子是原有物品，我会补价格表。',
        contentAction: '正文第一段补一句“99元只包含新增收纳/灯具”。',
        evidenceNeeded: ['价格表'],
      },
    ],
    interventions: [
      {
        id: 'intervention_1',
        priority: 'P0',
        target: 'opening',
        problem: '预算范围可能被误解',
        change: '开头说明99元口径',
        exampleRewrite: '99元新增收纳清单：宿舍桌面从乱到可学习',
        expectedEffect: '减少标题党质疑',
        effort: 'low',
        evidenceSource: 'reply_1',
      },
    ],
    qualityCheck: {
      overallScore: 0.74,
      reliableSignals: ['评论围绕预算'],
      weakSignals: ['缺少真实账号历史数据'],
      possibleHallucinations: ['可能误判物品是否新增'],
      needsHumanReview: ['价格口径'],
      outputWarnings: ['模拟值不是承诺'],
    },
    publishSafetyReview: {
      gate: 'hold',
      score: 0.42,
      summary: '价格口径和隐私授权未过，先暂停发布。',
      escalation: 'legal',
      redFlags: [
        {
          id: 'safety_flag_budget',
          title: '99元预算口径可能误导',
          severity: 'critical',
          area: 'overclaim',
          trigger: '标题没有说明99元只包含新增收纳。',
          whyItMatters: '容易被质疑标题党或虚假种草。',
          evidence: '评论追问99元是否包含桌子。',
          fix: '标题和正文补清预算范围。',
          owner: 'legal',
        },
      ],
      checklist: [
        {
          id: 'safety_check_budget',
          label: '价格口径',
          status: 'fail',
          detail: '需要补齐预算范围。',
          owner: 'ops',
        },
      ],
      mustFixBeforePublish: ['补清预算范围'],
      safeRewriteHints: ['99元只包含新增收纳，原桌不计入预算。'],
    },
    growthBrief: {
      contentDirection: {
        summary: '低预算宿舍桌面改造',
        strongestHook: '99元前后对比',
        evidence: ['封面对比'],
        missingSignals: ['价格表'],
      },
      topicIdeas: {
        nextPost: '下一条做失败版清单',
        seriesDirection: '宿舍改造系列',
        abTests: ['标题A/B'],
        reuseFromComments: ['99元包含桌子吗？'],
      },
      publishStrategy: {
        title: '补清99元口径',
        cover: '前后对比+价格标注',
        timing: '晚间发布',
        tags: ['#宿舍改造'],
        structure: '对比、清单、投票',
      },
      interactionOptimization: {
        pinnedComment: '投票下一期改哪里',
        replyPrinciple: '先解释预算再引导关注',
        commentTriggers: ['想看哪里？'],
        riskReplies: ['99元只包含新增收纳。'],
      },
      accountGrowthPlan: {
        growthThesis: '用连续改造实验促成关注',
        followTriggers: ['下一期'],
        nextThreePosts: ['失败版清单', '床边改造', '一周复盘'],
        reviewMetrics: ['关注率'],
      },
      riskGuardrail: {
        positioning: '压住标题党风险',
        mustAvoid: ['不要写成整套99元'],
        safePhrasing: ['只包含新增物品'],
      },
    },
  });

  assert.equal(result.schemaVersion, 'preflight_v2');
  assert.equal(result.scenario, 'koc_growth');
  assert.equal(result.contentRead.oneLineIntent, '99元改造桌面');
  assert.equal(result.visualRead.coverScore, 72);
  assert.equal(result.pushModel.cohorts[0]?.relevanceTier, 'core');
  assert.equal(result.simulatedReplies[0]?.text, '99元包含桌子吗？');
  assert.equal(result.simulatedReplies[0]?.suggestedReply, '99元只包含新增收纳和灯具，桌子是原有物品，我会补价格表。');
  assert.equal(result.simulatedReplies[0]?.contentAction, '正文第一段补一句“99元只包含新增收纳/灯具”。');
  assert.equal(result.interventions[0]?.exampleRewrite, '99元新增收纳清单：宿舍桌面从乱到可学习');
  assert.equal(result.qualityCheck.overallScore, 74);
  assert.equal(result.publishSafetyReview.gate, 'hold');
  assert.equal(result.publishSafetyReview.score, 42);
  assert.equal(result.publishSafetyReview.redFlags[0]?.severity, 'critical');
  assert.equal(result.publishSafetyReview.checklist[0]?.status, 'fail');
  assert.equal(result.growthBrief.topicIdeas.nextPost, '下一条做失败版清单');
  assert.equal(result.growthBrief.publishStrategy.title, '补清99元口径');
  assert.equal(result.growthBrief.accountGrowthPlan.nextThreePosts.length, 3);
});

test('parsePreflightSimulationResult strips stray model JSON fragments from string fields', () => {
  const result = parsePreflightSimulationResult({
    schemaVersion: 'preflight_v2',
    provider: 'doubao',
    mode: 'quick',
    simulatedReplies: [
      {
        id: 'reply_fragment',
        userType: '预算敏感用户',
        tier: 'broad',
        sentiment: 'skeptical',
        replyType: 'question',
        comment: '99元是全部吗？ {"replyType":"question"}',
        hiddenNeed: '想确认预算范围',
        conversionSignal: '互动但存{"sentiment":"skeptical"}',
        riskSignal: '{"sentiment":"skeptical"}预算范围不清',
        suggestedReply: '{"sentiment":"skeptical"}99元只包含新增收纳和灯具。',
        contentAction: '补一句预算范围 {"contentAction":"clarify"}',
      },
    ],
  });

  const reply = result.simulatedReplies[0];

  assert.equal(reply?.text, '99元是全部吗？');
  assert.equal(reply?.conversionSignal, '互动但存疑');
  assert.equal(reply?.riskSignal, '预算范围不清');
  assert.equal(reply?.suggestedReply, '99元只包含新增收纳和灯具。');
  assert.equal(reply?.contentAction, '补一句预算范围');
});

test('parsePreflightSimulationResult mirrors top-level warnings into qualityCheck.outputWarnings when omitted', () => {
  const result = parsePreflightSimulationResult({
    provider: 'doubao',
    mode: 'quick',
    warnings: ['远端 JSON 已本地修复', '结果仅作模拟'],
    qualityCheck: {
      overallScore: 73,
      reliableSignals: ['评论覆盖完整'],
      weakSignals: ['缺少真实后台数据'],
      possibleHallucinations: [],
      needsHumanReview: [],
    },
  });

  assert.deepEqual(result.warnings, ['远端 JSON 已本地修复', '结果仅作模拟']);
  assert.deepEqual(result.qualityCheck.outputWarnings, ['远端 JSON 已本地修复', '结果仅作模拟']);
});

test('parsePreflightSimulationResult preserves explicit qualityCheck.outputWarnings', () => {
  const result = parsePreflightSimulationResult({
    provider: 'doubao',
    mode: 'quick',
    warnings: ['顶层运行提示'],
    qualityCheck: {
      overallScore: 73,
      reliableSignals: ['评论覆盖完整'],
      weakSignals: ['缺少真实后台数据'],
      possibleHallucinations: [],
      needsHumanReview: [],
      outputWarnings: ['质量检测 Agent 明确提示'],
    },
  });

  assert.deepEqual(result.qualityCheck.outputWarnings, ['质量检测 Agent 明确提示']);
});

test('parsePreflightSimulationResult derives safety gate from quality review needs', () => {
  const result = parsePreflightSimulationResult({
    provider: 'doubao',
    mode: 'quick',
    qualityCheck: {
      overallScore: 76,
      reliableSignals: ['方向明确'],
      weakSignals: ['素材授权待确认'],
      possibleHallucinations: [],
      needsHumanReview: ['复核素材授权'],
      outputWarnings: [],
    },
    publishSafetyReview: {
      redFlags: [],
      checklist: [],
      mustFixBeforePublish: [],
      safeRewriteHints: [],
    },
  });

  assert.equal(result.publishSafetyReview.gate, 'revise');
  assert.equal(result.publishSafetyReview.escalation, 'none');
});

test('parsePreflightSimulationResult derives hold gate from critical quality red flag', () => {
  const result = parsePreflightSimulationResult({
    provider: 'doubao',
    mode: 'quick',
    qualityCheck: {
      overallScore: 62,
      reliableSignals: ['方向明确'],
      weakSignals: ['素材授权待确认'],
      possibleHallucinations: [],
      needsHumanReview: ['复核素材授权'],
      outputWarnings: [],
    },
    publishSafetyReview: {
      redFlags: [
        {
          id: 'safety_flag_critical',
          title: '隐私数据未脱敏',
          severity: 'critical',
          area: 'privacy',
          trigger: '截图含真实手机号。',
          whyItMatters: '会触发隐私风险。',
          evidence: 'visualRead.visibleText 中出现手机号。',
          fix: '发布前替换为脱敏截图。',
          owner: 'legal',
        },
      ],
      checklist: [],
      safeRewriteHints: [],
    },
  });

  assert.equal(result.publishSafetyReview.gate, 'hold');
  assert.equal(result.publishSafetyReview.escalation, 'legal');
  assert.ok(result.publishSafetyReview.mustFixBeforePublish.includes('发布前替换为脱敏截图。'));
});

test('parsePreflightSimulationResult adapts legacy V1 results into V2 fields', () => {
  const result = parsePreflightSimulationResult({
    provider: 'mock',
    mode: 'quick',
    contentRead: {
      oneLineIntent: '测试一条发布前内容',
      likelyHook: '第一眼看标题',
      missingContext: ['缺少价格证据'],
      assumptions: ['不承诺真实流量'],
    },
    imageInsight: {
      coverRead: '封面能看到对比',
      attentionScore: 66,
    },
    simulatedReplies: [
      {
        id: 'reply_legacy',
        cohortId: 'cohort_core',
        userType: '核心用户',
        relevanceTier: 'core',
        sentiment: 'skeptical',
        replyType: 'question',
        text: '价格怎么算？',
        why: '担心标题党',
        conversionSignal: '解释后可能收藏',
        intervention: '正文补价格明细。',
      },
    ],
  });

  assert.equal(result.schemaVersion, 'preflight_v2');
  assert.equal(result.contentPromise.oneLinePromise, '测试一条发布前内容');
  assert.equal(result.visualRead.firstGlance, '封面能看到对比');
  assert.equal(result.simulatedReplies[0]?.comment, '价格怎么算？');
  assert.equal(result.simulatedReplies[0]?.hiddenNeed, '担心标题党');
  assert.equal(result.simulatedReplies[0]?.contentAction, '正文补价格明细。');
  assert.ok(result.simulatedReplies[0]?.suggestedReply);
  assert.equal(result.simulatedMetrics.disclaimer, '以下为发布前模拟值，不代表真实播放、点赞或涨粉承诺。');
  assert.equal(result.publishSafetyReview.gate, 'revise');
  assert.ok(result.publishSafetyReview.checklist.some((item) => item.label === '隐私与授权'));
  assert.match(result.growthBrief.contentDirection.summary, /测试一条发布前内容/);
  assert.ok(result.growthBrief.topicIdeas.nextPost);
});

test('parsePreflightSimulationJob preserves degraded fallback metadata', () => {
  const job = parsePreflightSimulationJob({
    id: 'preflight_degraded',
    workspaceId: 'demo',
    status: 'degraded',
    currentStageKey: 'complete',
    currentStageLabel: '兜底完成',
    message: '远端模型不可用，已用本地模拟兜底完成。',
    stages: [],
    fallbackReason: '远端超时',
    result: {
      provider: 'doubao',
      model: 'test-model',
      mode: 'quick',
      degraded: true,
      fallbackReason: '远端超时',
    },
  });

  assert.equal(job.status, 'degraded');
  assert.equal(job.fallbackReason, '远端超时');
  assert.equal(job.result?.degraded, true);
  assert.equal(job.result?.fallbackReason, '远端超时');
});
