import type {
  OverviewGuideStepDraft,
  OverviewPageViewModel,
  OverviewPageViewModelInput,
} from './overviewPageTypes';

function getQuickScanLabel(language: OverviewPageViewModelInput['language']) {
  return language === 'en' ? 'Quick Diagnosis' : '快速诊断';
}

function getGuideStatusLabel(
  status: OverviewPageViewModel['launchpad']['steps'][number]['status'],
  language: OverviewPageViewModelInput['language'],
) {
  if (status === 'done') {
    return language === 'en' ? 'Done' : '已完成';
  }

  if (status === 'current') {
    return language === 'en' ? 'Recommended Now' : '当前建议';
  }

  return language === 'en' ? 'Later' : '稍后再做';
}

export function buildOverviewLaunchpadViewModel(
  input: OverviewPageViewModelInput,
  setupFieldCount: number,
  projectReady: boolean,
  evidenceReady: boolean,
): OverviewPageViewModel['launchpad'] {
  const isEnglish = input.language === 'en';
  const quickScanLabel = getQuickScanLabel(input.language);
  const canRunAnalysis = projectReady && evidenceReady;
  const scanMetric = input.hasViewableAnalysis
    ? input.isAnalysisFresh
      ? isEnglish
        ? 'Latest strategy result already available'
        : '已有最新策略结果'
      : isEnglish
        ? 'Older strategy result available, rerun recommended'
        : '已有旧策略结果，建议重跑'
    : canRunAnalysis
      ? isEnglish
        ? `Ready to open ${quickScanLabel} from the Diagnosis Desk`
        : '已达标，可进入诊断台开始快速诊断'
      : isEnglish
        ? 'Requires 4/4 setup fields and 3 evidence items'
        : '需要 4/4 关键字段和 3 条证据';
  const reviewMetric = input.hasViewableAnalysis
    ? input.isAnalysisFresh
      ? isEnglish
        ? 'Outputs are ready to open'
        : '输出区已可查看'
      : isEnglish
        ? 'Outputs stay viewable, rerun recommended'
        : '输出区仍可查看，但建议重跑'
    : isEnglish
      ? `Finish ${quickScanLabel} first`
      : '先完成快速诊断';
  const steps = [
    {
      id: 'project' as const,
      number: '01' as const,
      title: isEnglish ? 'Fill the campaign frame' : '填传播任务骨架',
      description: isEnglish
        ? 'At minimum, add the campaign goal, growth loop, target audience, and validation goal so the system knows what it is diagnosing.'
        : '至少补一句话传播目标、内容增长回路、目标受众、验证目标，系统才知道在诊断什么。',
      metric: isEnglish ? `Core fields ${setupFieldCount}/4` : `关键字段 ${setupFieldCount}/4`,
      status: projectReady ? 'done' : 'current',
      actionLabel: isEnglish ? 'Continue Editing' : '继续填写任务',
      actionStep: 'overview' as const,
    },
    {
      id: 'evidence' as const,
      number: '02' as const,
      title: isEnglish ? 'Add at least three evidence items' : '补三条以上证据',
      description: isEnglish
        ? 'Comment excerpts, KOC interviews, competitor content notes, data snapshots, and brief excerpts all count. Keep each item to one observation.'
        : '用户评论摘录、KOC 访谈、竞品内容观察、数据快照、brief 摘录都可以，每条只写一个观察。',
      metric: isEnglish ? `Evidence ${input.evidenceCount}/3+` : `当前证据 ${input.evidenceCount}/3+`,
      status: evidenceReady ? 'done' : projectReady ? 'current' : 'upcoming',
      actionLabel: isEnglish ? 'Add Evidence' : '去补证据',
      actionStep: 'evidence' as const,
    },
    {
      id: 'scan' as const,
      number: '03' as const,
      title: isEnglish ? `Run ${quickScanLabel}` : '开始快速诊断',
      description: isEnglish
        ? `${quickScanLabel} is the first formal pass for audience tension, blind spots, and next moves. It only unlocks after the minimum setup and evidence gate are both ready.`
        : '快速诊断是第一轮正式的受众张力、盲点、风险和下一步判断，只有最小设定和证据门槛都达标后才会解锁。',
      metric: scanMetric,
      status: input.hasViewableAnalysis ? 'done' : canRunAnalysis ? 'current' : 'upcoming',
    },
    {
      id: 'review' as const,
      number: '04' as const,
      title: isEnglish ? 'Review strategy outputs' : '去输出阶段看策略结果',
      description: isEnglish
        ? 'Current diagnosis, spread outlook, and the report stay in Outputs only. Intake gives you status and readiness, not conclusion copy.'
        : '当前诊断、扩散演化和策略报告只放在输出阶段。输入阶段只给状态和准备度，不直接展示结论文案。',
      metric: reviewMetric,
      status: input.hasViewableAnalysis ? 'current' : 'upcoming',
      actionLabel: input.hasViewableAnalysis
        ? isEnglish
          ? 'Open Outputs'
          : '打开输出区'
        : undefined,
      actionStep: input.hasViewableAnalysis ? ('modeling' as const) : undefined,
    },
  ] satisfies OverviewGuideStepDraft[];

  return {
    eyebrow: isEnglish ? 'Getting Started' : '开始使用',
    title: isEnglish ? 'Start with these four steps' : '第一次使用，按这 4 步走',
    badge: isEnglish
      ? '4/4 setup + 3 evidence to unlock diagnosis'
      : '4/4 关键字段 + 3 条证据后解锁正式诊断',
    steps: steps.map((step) => ({
      ...step,
      statusLabel: getGuideStatusLabel(step.status, input.language),
    })),
  };
}

export function buildOverviewRunStatusViewModel(
  input: OverviewPageViewModelInput,
  setupFieldCount: number,
): OverviewPageViewModel['runStatus'] {
  const isEnglish = input.language === 'en';
  const quickScanLabel = getQuickScanLabel(input.language);

  return {
    eyebrow: isEnglish ? 'Formal Diagnosis Status' : '正式诊断状态',
    title: input.hasViewableAnalysis
      ? input.isAnalysisFresh
        ? isEnglish
          ? 'Latest strategy result is ready in Outputs'
          : '最新策略结果已在输出区就绪'
        : input.isAnalysisDegraded
          ? isEnglish
            ? 'A stabilized strategy result is still viewable'
            : '一份经过回退稳定的策略结果仍可继续查看'
          : isEnglish
            ? 'A previous strategy result is still viewable'
            : '上一份策略结果仍可继续查看'
      : isEnglish
        ? 'No strategy result is shown during intake'
        : '输入阶段不会直接展示正式策略结论',
    copy: input.hasViewableAnalysis
      ? input.isAnalysisFresh
        ? isEnglish
          ? 'Keep intake focused on the brief. Review current diagnosis, spread outlook, and the report from Outputs only.'
          : '输入阶段继续专注 brief 和证据；当前诊断、扩散演化和策略报告请到输出区查看。'
        : input.isAnalysisDegraded
          ? isEnglish
            ? 'The current outputs come from a completed run that needed fallback handling. They stay viewable, but a rerun is recommended before freezing or deciding.'
            : '当前输出来自一轮已经完成、但中途触发过回退处理的正式诊断。结果仍可查看，但在冻结或决策前建议重跑。'
          : isEnglish
            ? 'Current inputs have changed since the last formal diagnosis. The previous outputs stay viewable, but a rerun is recommended.'
            : '自上次正式诊断后，当前输入已经变化。旧结果仍可查看，但建议重新运行。'
      : isEnglish
        ? `Fill the 4/4 minimum setup and 3 evidence items first, then go to the Diagnosis Desk to run ${quickScanLabel}.`
        : '先补齐 4/4 最小起跑线和 3 条证据，再进入诊断台开始快速诊断。',
    bullets: input.hasViewableAnalysis
      ? [
          input.isAnalysisFresh
            ? isEnglish
              ? 'The latest strategy result is current. Keep intake focused on inputs, and open Outputs when you need the judgment.'
              : '最新策略结果仍是当前版本。输入阶段继续专注输入整理，真正查看判断时再打开输出区。'
            : input.isAnalysisDegraded
              ? isEnglish
                ? 'The visible result is degraded because one or more stages needed fallback handling or JSON repair during the run.'
                : '当前可见结果被标记为降级，是因为运行过程中有一个或多个阶段触发了回退处理或 JSON 修复。'
              : isEnglish
                ? 'The visible result is stale because current inputs no longer match the last formal diagnosis.'
                : '当前可见结果已经过期，因为当前输入与上次正式诊断时不再一致。',
          isEnglish
            ? 'Only the output phase shows the actual summary, verdict, confidence, and report.'
            : '真正的摘要、结论、置信度和策略报告只会在输出阶段展示。',
          isEnglish
            ? 'If you want a new conclusion, rerun from the Diagnosis Desk after the inputs are ready again.'
            : '如果要拿新结论，请在输入再次达标后回诊断台重跑。',
        ]
      : [
          isEnglish
            ? `${setupFieldCount}/4 core fields are filled. Add the campaign goal, growth loop, target audience, and validation goal first.`
            : `当前已完成 ${setupFieldCount}/4 个关键字段，建议先补齐一句话传播目标、内容增长回路、目标受众、验证目标。`,
          isEnglish
            ? `There are ${input.evidenceCount} evidence items now. Aim for at least 3 before formal diagnosis unlocks.`
            : `当前证据 ${input.evidenceCount} 条，建议先累计到 3 条以上再解锁正式诊断。`,
          isEnglish
            ? 'You can import a brief JSON bundle, campaign Markdown, or TXT directly. There is no need to refill a sample template.'
            : '可以直接导入 brief JSON、投放方案 Markdown 或 TXT，不需要按示例模板重填。',
          isEnglish
            ? 'The evidence page supports line-by-line comments, KOC interviews, competitor notes, and recap snippets. One observation per line is clearest.'
            : '证据页支持逐行粘贴评论摘录、KOC 访谈、竞品观察、投放复盘，每行一条最清晰。',
        ],
  };
}
