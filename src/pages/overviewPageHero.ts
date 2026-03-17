import type { OverviewPageViewModel, OverviewPageViewModelInput } from './overviewPageTypes';

function getQuickScanLabel(language: OverviewPageViewModelInput['language']) {
  return language === 'en' ? 'Quick Scan' : '快速扫描';
}

export function buildOverviewHeroViewModel(
  input: OverviewPageViewModelInput,
  filledFieldCount: number,
): OverviewPageViewModel['hero'] {
  const isEnglish = input.language === 'en';
  const displayIdeaSummary =
    input.project.ideaSummary ||
    (isEnglish
      ? 'Start from a blank project and define what this round is trying to validate.'
      : '从空白项目开始，先定义这次要验证什么。');
  const displayCoreLoop =
    input.project.coreLoop ||
    (isEnglish
      ? 'Write the core loop first, for example: explore -> fight -> collect -> grow.'
      : '先写核心循环，例如：探索 -> 战斗 -> 收集 -> 成长。');
  const displayCoreFantasy =
    input.project.coreFantasy ||
    (isEnglish
      ? 'Explain why players stay and what they should feel.'
      : '先写玩家为什么愿意留下来，以及想感受到什么。');
  const displayValidationGoal =
    input.project.validationGoal ||
    (isEnglish
      ? 'Turn this round into one sentence with a clear success or failure bar.'
      : '先把这轮验证目标写成一句可判断输赢的话。');
  const displayCurrentStatus =
    input.project.currentStatus ||
    (isEnglish
      ? 'Write the main concern right now, such as onboarding cost, differentiation, or retention risk.'
      : '先写你现在最担心的问题，例如上手成本、差异化或留存风险。');

  return {
    eyebrow: isEnglish ? 'Mission Brief' : '任务简报',
    title: displayIdeaSummary,
    copy: isEnglish
      ? `This stage is only for project setup, evidence loading, and import feedback. When the minimum gate is ready, move to the Inference Desk for ${getQuickScanLabel(input.language)}.`
      : '这一阶段只负责项目设定、证据装载和导入反馈。最小门槛达标后，再进入推理台开始快速扫描。',
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
        label: isEnglish ? 'Core Loop' : '核心循环',
        value: displayCoreLoop,
      },
      {
        label: isEnglish ? 'Core Fantasy' : '核心体验',
        value: displayCoreFantasy,
      },
      {
        label: isEnglish ? 'Validation Goal' : '验证目标',
        value: displayValidationGoal,
      },
      {
        label: isEnglish ? 'Current Concern' : '当前状态',
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
    title: isEnglish ? 'Import Project File' : '导入项目文件',
    description: isEnglish
      ? 'If you already have a project JSON bundle, design Markdown, or requirement TXT, import it here first. Recognized project fields fill automatically, and the body is also converted into evidence cards.'
      : '如果你已经有项目包 JSON、设计文档 Markdown 或需求 TXT，建议先在这里导入。命中项目字段时会自动回填；正文也会同步沉淀成证据卡。',
    hint: isEnglish
      ? 'Recommended before manual editing: project JSON bundle / design Markdown / requirement TXT'
      : '推荐先导入再手填：项目包 JSON / 设计文档 Markdown / 需求说明 TXT',
    buttonLabel: isEnglish ? 'Choose Project File' : '选择项目文件',
  };
}
