export type SectionKey =
  | 'title'
  | 'projectName'
  | 'stageMode'
  | 'genre'
  | 'platforms'
  | 'corePromise'
  | 'coreFantasy'
  | 'oneLineIdea'
  | 'ideaToValidate'
  | 'coreLoop'
  | 'sessionLength'
  | 'differentiators'
  | 'progressionHook'
  | 'socialHook'
  | 'socialSharingHook'
  | 'monetization'
  | 'referenceGames'
  | 'competitors'
  | 'validationGoal'
  | 'productionConstraints'
  | 'currentConcern'
  | 'currentStatus'
  | 'type'
  | 'source'
  | 'targetPlayers'
  | 'coreFacts'
  | 'playerAcceptanceReasons'
  | 'playerRejectionReasons'
  | 'currentBiggestConcern';

export type SectionMap = Map<SectionKey | 'body', string[]>;

const sectionLabelDefinitions: Array<{
  key: SectionKey;
  aliases: string[];
}> = [
  { key: 'title', aliases: ['标题', 'Title'] },
  { key: 'projectName', aliases: ['项目名称', 'Project Name'] },
  { key: 'stageMode', aliases: ['阶段模式', 'Stage Mode'] },
  { key: 'genre', aliases: ['游戏类型', 'Genre'] },
  { key: 'platforms', aliases: ['目标平台', 'Platforms'] },
  {
    key: 'corePromise',
    aliases: ['核心体验承诺', 'Core Experience Promise'],
  },
  { key: 'coreFantasy', aliases: ['核心体验幻想', 'Core Fantasy'] },
  { key: 'oneLineIdea', aliases: ['一句话想法', 'One-line Idea'] },
  { key: 'ideaToValidate', aliases: ['要验证的想法', 'Idea to Validate'] },
  { key: 'coreLoop', aliases: ['核心循环', 'Core Loop'] },
  { key: 'sessionLength', aliases: ['单局时长', 'Session Length'] },
  { key: 'differentiators', aliases: ['差异化卖点', 'Differentiators'] },
  { key: 'progressionHook', aliases: ['成长驱动', 'Progression Hook'] },
  { key: 'socialHook', aliases: ['社交驱动', 'Social Hook'] },
  { key: 'socialSharingHook', aliases: ['社交/传播驱动', 'Social/Sharing Hook'] },
  { key: 'monetization', aliases: ['商业化方案', 'Monetization'] },
  { key: 'referenceGames', aliases: ['参考游戏', 'Reference Games'] },
  { key: 'competitors', aliases: ['参考竞品', 'Competitors'] },
  { key: 'validationGoal', aliases: ['验证目标', 'Validation Goal'] },
  {
    key: 'productionConstraints',
    aliases: ['制作约束', 'Production Constraints'],
  },
  {
    key: 'currentConcern',
    aliases: ['当前最担心的问题', 'Current Concern'],
  },
  { key: 'currentStatus', aliases: ['当前状态', 'Current Status'] },
  { key: 'type', aliases: ['类型', 'Type'] },
  { key: 'source', aliases: ['来源', 'Source'] },
  { key: 'targetPlayers', aliases: ['目标玩家', 'Target Players'] },
  { key: 'coreFacts', aliases: ['核心事实', 'Core Facts'] },
  {
    key: 'playerAcceptanceReasons',
    aliases: ['玩家可能接受的原因', 'Why Players May Accept'],
  },
  {
    key: 'playerRejectionReasons',
    aliases: ['玩家可能反感的原因', 'Why Players May Reject'],
  },
  {
    key: 'currentBiggestConcern',
    aliases: ['当前最大担忧', 'Current Biggest Concern'],
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchSectionLabel(line: string) {
  for (const definition of sectionLabelDefinitions) {
    const matchedAlias = definition.aliases.find(
      (alias) => line.startsWith(`${alias}：`) || line.startsWith(`${alias}:`),
    );

    if (matchedAlias) {
      return {
        key: definition.key,
        alias: matchedAlias,
      };
    }
  }

  return null;
}

export function extractSections(text: string) {
  const lines = text.replace(/\r/g, '').split('\n');
  const sections: SectionMap = new Map();
  let currentLabel: SectionKey | 'body' = 'body';

  sections.set(currentLabel, []);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const matchedLabel = matchSectionLabel(line);

    if (matchedLabel) {
      currentLabel = matchedLabel.key;
      const value = line.replace(
        new RegExp(`^${escapeRegExp(matchedLabel.alias)}[：:]\\s*`),
        '',
      );
      sections.set(currentLabel, value ? [value] : []);
      continue;
    }

    if (!sections.has(currentLabel)) {
      sections.set(currentLabel, []);
    }

    sections.get(currentLabel)?.push(rawLine);
  }

  return sections;
}

export function getSection(sections: SectionMap, label: SectionKey) {
  return (sections.get(label) ?? []).join('\n').trim();
}

export function getFirstSection(sections: SectionMap, labels: SectionKey[]) {
  return labels.map((label) => getSection(sections, label)).find(Boolean) ?? '';
}

export function toBullets(value: string) {
  return value
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

export function splitInlineList(value: string) {
  return value
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
