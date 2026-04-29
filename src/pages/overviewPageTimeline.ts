import type { OverviewPageViewModel, OverviewPageViewModelInput } from './overviewPageTypes';

function getQuickScanLabel(language: OverviewPageViewModelInput['language']) {
  return language === 'en' ? 'Quick Diagnosis' : '快速诊断';
}

function getDeepDiveLabel(language: OverviewPageViewModelInput['language']) {
  return language === 'en' ? 'Deep Simulation' : '深度推演';
}

export function buildOverviewTimelineViewModel(
  language: OverviewPageViewModelInput['language'],
): OverviewPageViewModel['timeline'] {
  const isEnglish = language === 'en';
  const quickScanLabel = getQuickScanLabel(language);
  const deepDiveLabel = getDeepDiveLabel(language);

  return {
    eyebrow: isEnglish ? 'How It Works' : '使用流程',
    title: isEnglish ? 'Recommended ramp-up path' : '推荐上手路线',
    buttonLabel: isEnglish ? 'Open Evidence' : '去证据页',
    buttonStep: 'evidence',
    steps: [
      {
        time: '01',
        title: isEnglish ? 'Define the campaign question first' : '先定义传播任务',
        detail: isEnglish
          ? 'Write the campaign goal, growth loop, target audience, and validation goal so the system knows what to watch.'
          : '至少写清一句话传播目标、内容增长回路、目标受众和验证目标，系统才知道该盯什么。',
      },
      {
        time: '02',
        title: isEnglish ? 'Load the evidence' : '把证据丢进来',
        detail: isEnglish
          ? 'You can paste comment excerpts, KOC interviews, and recap notes, or import Markdown, TXT, and JSON. Keep each item to one observation.'
          : '支持粘贴评论摘录、KOC 访谈、投放复盘，也支持导入 Markdown、TXT、JSON。每条证据尽量只写一个观察。',
      },
      {
        time: '03',
        title: isEnglish ? `Run ${quickScanLabel} first` : '先跑快速诊断',
        detail: isEnglish
          ? `${quickScanLabel} is better for the first structured read. Leave ${deepDiveLabel} for after the minimum gate and the first output review are complete.`
          : '快速诊断更适合拿第一轮结构化判断。深度推演留到最小门槛达标并完成第一轮结果查看之后。',
      },
      {
        time: '04',
        title: isEnglish ? 'Open Outputs for decisions' : '去输出阶段做判断',
        detail: isEnglish
          ? 'Review current diagnosis and spread outlook first, then decide whether to add evidence, rewrite the brief, or open the full report.'
          : '先看当前诊断和扩散演化，再决定是继续补证据、重写 brief，还是进入完整策略报告。',
      },
    ],
  };
}
