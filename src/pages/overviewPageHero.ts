import type { OverviewPageViewModel, OverviewPageViewModelInput } from './overviewPageTypes';

function getQuickScanLabel(language: OverviewPageViewModelInput['language']) {
  return language === 'en' ? 'Quick Diagnosis' : '快速诊断';
}

export function buildOverviewHeroViewModel(
  input: OverviewPageViewModelInput,
  filledFieldCount: number,
): OverviewPageViewModel['hero'] {
  const isEnglish = input.language === 'en';
  const displayIdeaSummary =
    input.project.ideaSummary ||
    (isEnglish
      ? 'Start from a blank brief and define the campaign goal for this round.'
      : '从空白 brief 开始，先定义这轮传播到底要验证什么。');
  const displayCoreLoop =
    input.project.coreLoop ||
    (isEnglish
      ? 'Write the content growth loop first, for example: publish -> interact -> save -> revisit.'
      : '先写内容增长回路，例如：看到内容 -> 点进评论 -> 收藏转发 -> 线下到店。');
  const displayCoreFantasy =
    input.project.coreFantasy ||
    (isEnglish
      ? 'Explain the account promise or content feeling people should remember.'
      : '先写账号/内容到底要让人记住什么，以及为什么愿意继续关注。');
  const displayValidationGoal =
    input.project.validationGoal ||
    (isEnglish
      ? 'Turn this round into one sentence with a clear decision bar.'
      : '先把这轮验证目标写成一句可判断输赢的话。');
  const displayCurrentStatus =
    input.project.currentStatus ||
    (isEnglish
      ? 'Write the main concern right now, such as weak differentiation, unclear CTA, or thin evidence.'
      : '先写你现在最担心的问题，例如内容不够差异化、互动点不够强，或证据还不够。');

  return {
    eyebrow: isEnglish ? 'Campaign Brief' : '传播简报',
    title: displayIdeaSummary,
    copy: isEnglish
      ? `This stage is only for campaign setup, evidence loading, and import feedback. When the minimum gate is ready, move to the Diagnosis Desk for ${getQuickScanLabel(input.language)}.`
      : '这一阶段只负责传播任务设定、证据装载和导入反馈。最小门槛达标后，再进入诊断台开始快速诊断。',
    signalItems: [
      {
        label: isEnglish ? 'Core Fields' : '关键字段',
        value: `${filledFieldCount}/8`,
      },
      {
        label: isEnglish ? 'Evidence' : '当前证据',
        value: isEnglish ? `${input.evidenceCount}` : `${input.evidenceCount} 条`,
      },
      {
        label: isEnglish ? 'Growth Loop' : '增长回路',
        value: displayCoreLoop,
      },
      {
        label: isEnglish ? 'Content Promise' : '内容承诺',
        value: displayCoreFantasy,
      },
      {
        label: isEnglish ? 'Decision Goal' : '验证目标',
        value: displayValidationGoal,
      },
      {
        label: isEnglish ? 'Main Concern' : '当前担心点',
        value: displayCurrentStatus,
      },
    ],
  };
}

export function buildOverviewImportCardViewModel(
  language: OverviewPageViewModelInput['language'],
): OverviewPageViewModel['importCard'] {
  const isEnglish = language === 'en';

  return {
    title: isEnglish ? 'Import Brief File' : '导入 brief 文件',
    description: isEnglish
      ? 'If you already have a brief JSON bundle, campaign Markdown, or requirement TXT, import it here first. Recognized fields fill automatically, and the body is also converted into evidence cards.'
      : '如果你已经有 brief JSON、投放方案 Markdown 或需求 TXT，建议先在这里导入。命中字段时会自动回填；正文也会同步沉淀成证据卡。',
    hint: isEnglish
      ? 'Recommended before manual editing: brief JSON / campaign Markdown / requirement TXT'
      : '推荐先导入再手填：brief JSON / 投放方案 Markdown / 需求说明 TXT',
    buttonLabel: isEnglish ? 'Choose Brief File' : '选择 brief 文件',
  };
}
