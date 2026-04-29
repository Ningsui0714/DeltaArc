import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'harness', 'output');
const imageDir = path.join(root, 'harness', 'generated-images');
const terminalStatuses = new Set(['completed', 'degraded', 'error']);

async function imageAsset(fileName) {
  const filePath = path.join(imageDir, fileName);
  const base64 = await fs.readFile(filePath, { encoding: 'base64' });
  const extension = path.extname(fileName).toLowerCase();
  const mimeType = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 'image/png';

  return {
    id: fileName.replace(/\.[^.]+$/, ''),
    kind: 'image',
    name: fileName,
    mimeType,
    base64,
  };
}

async function runCase(testCase) {
  const response = await fetch('http://127.0.0.1:5001/api/preflight-simulations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testCase.request),
  });

  if (!response.ok) {
    throw new Error(`${testCase.id} start failed: ${response.status} ${await response.text()}`);
  }

  let job = await response.json();
  const startedAt = Date.now();

  while (!terminalStatuses.has(job.status)) {
    if (Date.now() - startedAt > 180000) {
      throw new Error(`${testCase.id} timed out while polling ${job.id}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
    const next = await fetch(`http://127.0.0.1:5001/api/preflight-simulations/${job.id}`);

    if (!next.ok) {
      throw new Error(`${testCase.id} poll failed: ${next.status} ${await next.text()}`);
    }

    job = await next.json();
  }

  if (job.status === 'error') {
    throw new Error(`${testCase.id} ended in error: ${job.error || job.message}`);
  }

  const result = job.result;

  return {
    id: testCase.id,
    title: testCase.title,
    image: testCase.image,
    jobId: job.id,
    status: job.status,
    message: job.message,
    provider: result?.provider,
    degraded: Boolean(result?.degraded),
    fallbackReason: result?.fallbackReason || '',
    attentionScore: result?.imageInsight?.attentionScore,
    cohortTiers: result?.pushModel?.cohorts?.map((cohort) => `${cohort.relevanceTier}:${cohort.exposureShare}`) ?? [],
    replyCount: result?.simulatedReplies?.length ?? 0,
    weakReplyCount: result?.simulatedReplies?.filter((reply) => reply.relevanceTier === 'weak').length ?? 0,
    misfireReplyCount: result?.simulatedReplies?.filter((reply) => reply.relevanceTier === 'misfire').length ?? 0,
    topRisk: result?.risks?.[0]?.title ?? '',
    schemaVersion: result?.schemaVersion ?? '',
    scenario: result?.scenario ?? '',
    firstSuggestedReply: result?.simulatedReplies?.[0]?.suggestedReply ?? '',
    firstContentAction: result?.simulatedReplies?.[0]?.contentAction ?? '',
    firstIntervention: result?.interventions?.[0]?.change ?? result?.interventions?.[0]?.action ?? '',
    firstExampleRewrite: result?.interventions?.[0]?.exampleRewrite ?? '',
    qualityScore: result?.qualityCheck?.overallScore,
    warnings: result?.warnings ?? [],
  };
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const dormImage = 'case-01-dorm-desk-cover-imagegen-provider.jpg';
  const campusDemoImage = 'case-02-campus-ai-demo-imagegen-provider.jpg';

  const cases = [
    {
      id: 'imagegen_case_01_dorm_growth',
      title: '宿舍桌面改造涨粉推演',
      image: dormImage,
      request: {
        workspaceId: 'imagegen-case-dorm-growth',
        platform: 'xiaohongshu',
        goal: 'follower_growth',
        mode: 'quick',
        contentDraft: {
          title: '99元宿舍桌面改造：新增单品清单公开',
          body:
            '改造前桌面杂乱，改造后用书架、线缆收纳、小台灯和白板周计划让学习角更清爽。本条想测试封面是否能带来收藏、评论和关注下一期。',
          script: '开头3秒放前后对比；中段拆预算和踩坑；结尾引导评论桌面痛点并投票下一期改造。',
        },
        mediaAssets: [await imageAsset(dormImage)],
        accountContext: '账号定位：校园生活改造、低预算收纳、真实踩坑。粉丝以大学生和备考人群为主。',
        targetAudience: '宿舍党、备考学生、低预算收纳兴趣用户。',
        desiredAction: '收藏清单、评论桌面痛点、关注下一期宿舍改造。',
        brandGuardrails: '不夸大自律效果，不虚假种草，不诱导刷量，保留真实预算边界。',
      },
    },
    {
      id: 'imagegen_case_02_campus_submission',
      title: '校园 AI 产品提交前试映',
      image: campusDemoImage,
      request: {
        workspaceId: 'imagegen-case-campus-submission',
        platform: 'campus_ai_competition',
        goal: 'submission_readiness',
        mode: 'quick',
        contentDraft: {
          title: 'DeltaArc 校园 AI 产品试映场：提交前评审预演',
          body:
            '产品帮助校园团队在提交比赛材料前提前看到评委可能追问的 Demo 证据、赛道匹配、隐私边界和录屏完整性问题。',
          script:
            '录屏按痛点、Demo、AI 拆解、提交补洞四段展示，目标是证明它不是普通聊天助手，而是参赛材料预演工具。',
        },
        mediaAssets: [await imageAsset(campusDemoImage)],
        accountContext: '参赛团队已有本地 Demo、README、测试报告和演示页面。',
        targetAudience: 'PCG 校园 AI 产品创意大赛评委、参赛学生团队、产品导师。',
        desiredAction: '找出提交前必须补齐的材料和最容易被追问的产品边界。',
        brandGuardrails: '不承诺晋级，不冒充官方评审，不使用真实学生隐私数据。',
      },
    },
  ];

  const summaries = [];

  for (const testCase of cases) {
    summaries.push(await runCase(testCase));
  }

  const outputPath = path.join(outputDir, 'generated-two-case-preflight-imagegen-summary.json');
  await fs.writeFile(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        imageSource: 'imagegen skill / built-in image_gen',
        summaries,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(JSON.stringify({ outputPath, summaries }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
