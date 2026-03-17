import type { OverviewPageViewModel, OverviewPageViewModelInput } from './overviewPageTypes';

function getQuickScanLabel(language: OverviewPageViewModelInput['language']) {
  return language === 'en' ? 'Quick Scan' : '快速扫描';
}

function getDeepDiveLabel(language: OverviewPageViewModelInput['language']) {
  return language === 'en' ? 'Deep Dive' : '深度推演';
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
        title: isEnglish ? 'Define the project question first' : '先定义项目问题',
        detail: isEnglish
          ? 'Write the one-line concept, core loop, target audience, and validation goal so the system knows what to watch.'
          : '至少写清一句话想法、核心循环、目标玩家和验证目标，系统才知道该盯什么。',
      },
      {
        time: '02',
        title: isEnglish ? 'Load the evidence' : '把证据丢进来',
        detail: isEnglish
          ? 'You can paste interviews and playtest notes, or import Markdown, TXT, and JSON. Keep each item to one observation.'
          : '支持粘贴访谈/试玩观察，也支持导入 Markdown、TXT、JSON。每条证据尽量只写一个观察。',
      },
      {
        time: '03',
        title: isEnglish ? `Run ${quickScanLabel} first` : '先跑快速扫描',
        detail: isEnglish
          ? `${quickScanLabel} is better for the first structured read. Leave ${deepDiveLabel} for after the minimum gate and the first output review are complete.`
          : '快速扫描更适合拿第一轮结构化判断。深度推演留到最小门槛达标并完成第一轮结果查看之后。',
      },
      {
        time: '04',
        title: isEnglish ? 'Open Outputs for decisions' : '去输出阶段做判断',
        detail: isEnglish
          ? 'Review modeling and strategy first, then decide whether to add evidence, rewrite the goal, or open the full report.'
          : '先看建模和策略，再决定是继续补证据、重写目标，还是进入完整报告。',
      },
    ],
  };
}
