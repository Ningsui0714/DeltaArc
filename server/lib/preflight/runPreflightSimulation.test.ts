import assert from 'node:assert/strict';
import test from 'node:test';
import type { PreflightModelProvider } from './modelProvider';
import { buildPreflightSimulationPrompt } from './prompt';
import { runPreflightSimulation } from './runPreflightSimulation';

function createRequest(mode: 'quick' | 'deep' = 'quick') {
  return {
    workspaceId: 'test',
    platform: 'xiaohongshu' as const,
    goal: 'follower_growth' as const,
    mode,
    contentDraft: {
      title: '宿舍桌面改造',
      body: '测试内容。',
      script: '',
    },
    mediaAssets: [],
    accountContext: '',
    targetAudience: '',
    desiredAction: '',
    brandGuardrails: '',
  };
}

const incompleteProvider: PreflightModelProvider = {
  provider: 'mock',
  model: 'incomplete-test-model',
  async generateJson() {
    return {
      contentRead: {
        oneLineIntent: '测试内容',
      },
      pushModel: {
        cohorts: [
          {
            id: 'cohort_core',
            label: '核心受众',
            relevanceTier: 'core',
            exposureShare: 90,
          },
        ],
      },
      simulatedReplies: [
        {
          id: 'reply_core_only',
          cohortId: 'cohort_core',
          userType: '核心用户',
          relevanceTier: 'core',
          text: '我想试试。',
        },
      ],
    };
  },
};

const failingRemoteProvider: PreflightModelProvider = {
  provider: 'doubao',
  model: 'remote-test-model',
  async generateJson() {
    throw new Error('remote timeout');
  },
};

const campusProviderWithGrowthDisclaimer: PreflightModelProvider = {
  provider: 'doubao',
  model: 'campus-test-model',
  async generateJson() {
    return {
      simulatedMetrics: {
        disclaimer: '以下为发布前模拟值，不代表真实播放、点赞或涨粉承诺。',
        metricCards: [],
      },
      simulatedReplies: [
        {
          id: 'reply_campus',
          cohortId: 'cohort_core',
          userType: '产品评委',
          tier: 'core',
          comment: 'AI能力具体体现在哪里？',
          hiddenNeed: '确认不是普通清单工具',
          conversionSignal: '追问价值证明',
          contentAction: '补充AI能力说明。',
        },
      ],
    };
  },
};

test('runPreflightSimulation backfills weak and misfire replies when the model omits them', async () => {
  const result = await runPreflightSimulation(
    {
      workspaceId: 'test',
      platform: 'xiaohongshu',
      goal: 'store_visit',
      mode: 'quick',
      contentDraft: {
        title: '室友盲测',
        body: '测试校园咖啡新品。',
        script: '',
      },
      mediaAssets: [],
      accountContext: '',
      targetAudience: '',
      desiredAction: '',
      brandGuardrails: '',
    },
    {
      provider: incompleteProvider,
    },
  );

  const tiers = result.pushModel.cohorts.map((cohort) => cohort.relevanceTier);
  const weakReplies = result.simulatedReplies.filter((reply) => reply.relevanceTier === 'weak');
  const misfireReplies = result.simulatedReplies.filter((reply) => reply.relevanceTier === 'misfire');
  const coverageReplies = result.simulatedReplies.filter((reply) => reply.id.startsWith('coverage_'));
  const coverageText = coverageReplies.map((reply) => `${reply.userType} ${reply.text}`).join(' ');

  assert.deepEqual(tiers, ['core', 'broad', 'weak', 'misfire']);
  assert.ok(result.simulatedReplies.length >= 8);
  assert.ok(weakReplies.length >= 2);
  assert.ok(misfireReplies.length >= 2);
  assert.ok(coverageReplies.length > 0);
  assert.ok(coverageReplies.every((reply) => reply.userType.includes('补齐模拟')));
  assert.match(coverageText, /室友盲测|测试校园咖啡新品/);
  assert.doesNotMatch(coverageText, /宿舍|收纳|桌面/);
  assert.equal(result.publishSafetyReview.gate, 'revise');
  assert.ok(result.publishSafetyReview.redFlags.length > 0);
});

test('runPreflightSimulation marks remote fallback results as degraded', async () => {
  const result = await runPreflightSimulation(
    createRequest('quick'),
    {
      provider: failingRemoteProvider,
    },
  );

  assert.equal(result.degraded, true);
  assert.match(result.fallbackReason ?? '', /remote timeout/);
  assert.ok(result.warnings.some((warning) => warning.includes('本地模拟兜底')));
  assert.match(result.growthBrief.topicIdeas.nextPost, /失败版清单/);
  assert.ok(result.growthBrief.accountGrowthPlan.followTriggers.includes('下一期投票'));
});

test('buildPreflightSimulationPrompt aligns the JSON contract with runtime fields', () => {
  const prompt = buildPreflightSimulationPrompt(createRequest('quick'));

  assert.match(prompt.userPrompt, /"contentRead"/);
  assert.match(prompt.userPrompt, /"imageInsight"/);
  assert.match(prompt.userPrompt, /"pushModel"/);
  assert.match(prompt.userPrompt, /"confidence"/);
  assert.match(prompt.userPrompt, /"relevanceTier": "core"/);
  assert.match(prompt.userPrompt, /"text": "string"/);
  assert.match(prompt.userPrompt, /evidenceSource must name a concrete source/);
});

test('runPreflightSimulation keeps quick on a single provider call', async () => {
  const calls: string[] = [];
  const provider: PreflightModelProvider = {
    provider: 'mock',
    model: 'quick-count-provider',
    async generateJson(input) {
      calls.push(input.userPrompt);
      return incompleteProvider.generateJson(input);
    },
  };

  await runPreflightSimulation(createRequest('quick'), { provider });

  assert.equal(calls.length, 1);
});

test('runPreflightSimulation runs quality detection agent for deep mode', async () => {
  const calls: string[] = [];
  const provider: PreflightModelProvider = {
    provider: 'mock',
    model: 'deep-quality-provider',
    async generateJson(input) {
      calls.push(input.userPrompt);

      if (calls.length === 1) {
        return incompleteProvider.generateJson(input);
      }

      return {
        qualityCheck: {
          overallScore: 88,
          reliableSignals: ['四类人群已补齐'],
          weakSignals: ['图片证据不足'],
          possibleHallucinations: ['可能脑补封面细节'],
          needsHumanReview: ['复核素材授权'],
          outputWarnings: ['质量检测 Agent：图片证据不足'],
        },
        publishSafetyReview: {
          gate: 'hold',
          score: 41,
          summary: '素材授权不明，先暂停发布。',
          escalation: 'legal',
          redFlags: [
            {
              id: 'safety_flag_quality_license',
              title: '素材授权不明',
              severity: 'critical',
              area: 'copyright',
              trigger: '未说明封面素材来源。',
              whyItMatters: '发布后可能触发版权风险。',
              evidence: 'mediaAssets 为空，visualRead 不足。',
              fix: '发布前补充授权素材或替换为自有图片。',
              owner: 'legal',
            },
          ],
          checklist: [],
          mustFixBeforePublish: ['发布前补充授权素材或替换为自有图片。'],
          safeRewriteHints: ['说明素材来源并避免官方背书。'],
        },
        warnings: ['质量检测 Agent 已发现素材授权风险'],
      };
    },
  };

  const result = await runPreflightSimulation(createRequest('deep'), { provider });

  assert.equal(calls.length, 2);
  assert.match(calls[1] ?? '', /Quality agent JSON contract/);
  assert.equal(result.qualityCheck.overallScore, 88);
  assert.ok(result.qualityCheck.needsHumanReview.includes('复核素材授权'));
  assert.equal(result.publishSafetyReview.gate, 'hold');
  assert.equal(result.publishSafetyReview.escalation, 'legal');
  assert.ok(result.simulatedReplies.length >= 8);
  assert.ok(result.warnings.includes('质量检测 Agent 已完成 deep 模式复核。'));
  assert.ok(result.warnings.includes('质量检测 Agent 已发现素材授权风险'));
});

test('runPreflightSimulation keeps the base result when the deep quality agent fails', async () => {
  let callCount = 0;
  const provider: PreflightModelProvider = {
    provider: 'mock',
    model: 'deep-quality-failing-provider',
    async generateJson(input) {
      callCount += 1;

      if (callCount === 1) {
        return incompleteProvider.generateJson(input);
      }

      throw new Error('quality timeout');
    },
  };

  const result = await runPreflightSimulation(createRequest('deep'), { provider });

  assert.equal(callCount, 2);
  assert.equal(result.degraded, true);
  assert.match(result.fallbackReason ?? '', /quality timeout|质量检测 Agent/);
  assert.ok(result.warnings.some((warning) => warning.includes('质量检测 Agent 未完成')));
  assert.ok(result.qualityCheck.needsHumanReview.some((item) => item.includes('质量检测 Agent')));
  assert.ok(result.simulatedReplies.length >= 8);
});

test('runPreflightSimulation normalizes campus disclaimer away from growth wording', async () => {
  const result = await runPreflightSimulation(
    {
      workspaceId: 'test',
      platform: 'campus_ai_competition',
      goal: 'submission_readiness',
      mode: 'quick',
      contentDraft: {
        title: 'DeltaArc 提交前评审预演',
        body: '帮助参赛团队补齐 Demo 证据和材料边界。',
        script: '',
      },
      mediaAssets: [],
      accountContext: '',
      targetAudience: '',
      desiredAction: '',
      brandGuardrails: '',
    },
    {
      provider: campusProviderWithGrowthDisclaimer,
    },
  );

  assert.equal(result.simulatedMetrics.disclaimer, '以下为提交前模拟值，不代表官方评审结论、晋级或奖项承诺。');
  assert.doesNotMatch(result.simulatedMetrics.disclaimer, /涨粉|播放|点赞/);
  assert.equal(result.publishSafetyReview.escalation, 'competition_team');
  assert.ok(result.publishSafetyReview.redFlags.some((flag) => flag.area === 'competition_integrity'));
});
