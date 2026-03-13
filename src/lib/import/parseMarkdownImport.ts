import type { EvidenceItem, ProjectSnapshot } from '../../types';
import type { ImportLanguage, ImportedPayload } from './types';

const sectionLabels = [
  '标题',
  '项目名称',
  '阶段模式',
  '游戏类型',
  '目标平台',
  '核心体验承诺',
  '核心体验幻想',
  '一句话想法',
  '要验证的想法',
  '核心循环',
  '单局时长',
  '差异化卖点',
  '成长驱动',
  '社交驱动',
  '社交/传播驱动',
  '商业化方案',
  '参考游戏',
  '参考竞品',
  '验证目标',
  '制作约束',
  '当前最担心的问题',
  '当前状态',
  '类型',
  '来源',
  '目标玩家',
  '核心事实',
  '玩家可能接受的原因',
  '玩家可能反感的原因',
  '当前最大担忧',
];

function extractSections(text: string) {
  const lines = text.replace(/\r/g, '').split('\n');
  const sections = new Map<string, string[]>();
  let currentLabel = 'body';

  sections.set(currentLabel, []);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const matchedLabel = sectionLabels.find((label) => line.startsWith(`${label}：`) || line.startsWith(`${label}:`));

    if (matchedLabel) {
      currentLabel = matchedLabel;
      const value = line.replace(new RegExp(`^${matchedLabel}[：:]\\s*`), '');
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

function getSection(sections: Map<string, string[]>, label: string) {
  return (sections.get(label) ?? [])
    .join('\n')
    .trim();
}

function getFirstSection(sections: Map<string, string[]>, labels: string[]) {
  return labels.map((label) => getSection(sections, label)).find(Boolean) ?? '';
}

function toBullets(value: string) {
  return value
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

function buildProject(sections: Map<string, string[]>, language: ImportLanguage) {
  const name = getFirstSection(sections, ['项目名称', '标题']);
  const rawMode = getSection(sections, '阶段模式');
  const mode = rawMode === 'Validation' || rawMode === 'Live' ? rawMode : 'Concept';
  const projectFields = [
    name,
    getSection(sections, '游戏类型'),
    getFirstSection(sections, ['要验证的想法', '一句话想法']),
    getSection(sections, '核心循环'),
    getFirstSection(sections, ['核心体验承诺', '核心体验幻想']),
  ];

  if (projectFields.every((item) => item.length === 0)) {
    return null;
  }

  const platforms = getSection(sections, '目标平台')
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const targetPlayers = getSection(sections, '目标玩家')
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const referenceGames = getFirstSection(sections, ['参考游戏', '参考竞品'])
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const currentStatus =
    getSection(sections, '当前最担心的问题') ||
    getSection(sections, '当前最大担忧') ||
    getSection(sections, '当前状态');

  const project: ProjectSnapshot = {
    name: name || (language === 'en' ? 'Untitled Project' : '未命名项目'),
    mode,
    genre: getSection(sections, '游戏类型'),
    platforms,
    targetPlayers,
    coreFantasy: getFirstSection(sections, ['核心体验承诺', '核心体验幻想']),
    ideaSummary: getFirstSection(sections, ['要验证的想法', '一句话想法']),
    coreLoop: getSection(sections, '核心循环'),
    sessionLength: getSection(sections, '单局时长'),
    differentiators: getSection(sections, '差异化卖点'),
    progressionHook: getSection(sections, '成长驱动'),
    socialHook: getFirstSection(sections, ['社交驱动', '社交/传播驱动']),
    monetization: getSection(sections, '商业化方案'),
    referenceGames,
    validationGoal: getSection(sections, '验证目标'),
    productionConstraints: getSection(sections, '制作约束'),
    currentStatus,
  };

  return project;
}

function buildEvidence(text: string, fileName: string, sections: Map<string, string[]>, language: ImportLanguage) {
  const title = getSection(sections, '标题') || fileName.replace(/\.[^.]+$/, '');
  const type = getSection(sections, '类型');
  const source = getSection(sections, '来源') || fileName;

  const summaryParts = [
    getFirstSection(sections, ['要验证的想法', '一句话想法']),
    getSection(sections, '目标玩家'),
    getFirstSection(sections, ['核心体验承诺', '核心体验幻想']),
    ...toBullets(getSection(sections, '核心事实')),
    ...toBullets(getSection(sections, '玩家可能接受的原因')),
    ...toBullets(getSection(sections, '玩家可能反感的原因')),
    getSection(sections, '差异化卖点'),
    getSection(sections, '成长驱动'),
    getFirstSection(sections, ['社交驱动', '社交/传播驱动']),
    getSection(sections, '商业化方案'),
    getSection(sections, '当前最大担忧'),
  ].filter(Boolean);

  const evidence: EvidenceItem = {
    id: `evi_import_${Date.now()}`,
    type:
      type === 'interview' || type === 'review' || type === 'design_doc' || type === 'metric_snapshot'
        ? type
        : 'design_doc',
    title,
    source,
    trust: 'medium',
    summary: summaryParts.join('；') || text.slice(0, 300),
    createdAt: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };

  return evidence;
}

export function parseMarkdownImport(text: string, fileName: string, language: ImportLanguage): ImportedPayload {
  const sections = extractSections(text);
  const project = buildProject(sections, language);
  const evidence = buildEvidence(text, fileName, sections, language);
  const warnings: string[] = [];

  if (!project) {
    warnings.push(
      language === 'en'
        ? 'The Markdown file did not match the full project template, so it was imported as evidence only.'
        : 'Markdown 未命中完整项目模板，已按证据材料导入。',
    );
  }

  return {
    evidenceMode: 'append',
    project: project ?? undefined,
    evidenceItems: [evidence],
    warnings,
  };
}
