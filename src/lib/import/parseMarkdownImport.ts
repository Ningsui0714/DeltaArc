import type { EvidenceItem, ProjectSnapshot } from '../../types';
import type { ImportLanguage, ImportedPayload } from './types';
import {
  extractSections,
  getFirstSection,
  getSection,
  splitInlineList,
  toBullets,
  type SectionMap,
} from './markdownImportSections';

function normalizeProjectMode(rawMode: string): ProjectSnapshot['mode'] {
  const normalized = rawMode.trim().toLowerCase();

  if (normalized === 'validation' || normalized === 'prototype' || normalized === '验证') {
    return 'Validation';
  }

  if (
    normalized === 'live' ||
    normalized === 'launch' ||
    normalized === 'operate' ||
    normalized === '上线'
  ) {
    return 'Live';
  }

  return 'Concept';
}

function buildProject(sections: SectionMap, language: ImportLanguage) {
  const name = getFirstSection(sections, ['projectName', 'title']);
  const projectFields = [
    name,
    getSection(sections, 'genre'),
    getFirstSection(sections, ['ideaToValidate', 'oneLineIdea']),
    getSection(sections, 'coreLoop'),
    getFirstSection(sections, ['corePromise', 'coreFantasy']),
  ];

  if (projectFields.every((item) => item.length === 0)) {
    return null;
  }

  const project: ProjectSnapshot = {
    name: name || (language === 'en' ? 'Untitled Project' : '未命名项目'),
    mode: normalizeProjectMode(getSection(sections, 'stageMode')),
    genre: getSection(sections, 'genre'),
    platforms: splitInlineList(getSection(sections, 'platforms')),
    targetPlayers: splitInlineList(getSection(sections, 'targetPlayers')),
    coreFantasy: getFirstSection(sections, ['corePromise', 'coreFantasy']),
    ideaSummary: getFirstSection(sections, ['ideaToValidate', 'oneLineIdea']),
    coreLoop: getSection(sections, 'coreLoop'),
    sessionLength: getSection(sections, 'sessionLength'),
    differentiators: getSection(sections, 'differentiators'),
    progressionHook: getSection(sections, 'progressionHook'),
    socialHook: getFirstSection(sections, ['socialHook', 'socialSharingHook']),
    monetization: getSection(sections, 'monetization'),
    referenceGames: splitInlineList(
      getFirstSection(sections, ['referenceGames', 'competitors']),
    ),
    validationGoal: getSection(sections, 'validationGoal'),
    productionConstraints: getSection(sections, 'productionConstraints'),
    currentStatus:
      getSection(sections, 'currentConcern') ||
      getSection(sections, 'currentBiggestConcern') ||
      getSection(sections, 'currentStatus'),
  };

  return project;
}

function buildEvidence(
  text: string,
  fileName: string,
  sections: SectionMap,
  language: ImportLanguage,
) {
  const title = getSection(sections, 'title') || fileName.replace(/\.[^.]+$/, '');
  const type = getSection(sections, 'type');
  const coreFacts = toBullets(getSection(sections, 'coreFacts'));
  const summaryParts = [
    getFirstSection(sections, ['ideaToValidate', 'oneLineIdea']),
    getSection(sections, 'targetPlayers'),
    getFirstSection(sections, ['corePromise', 'coreFantasy']),
    getSection(sections, 'coreLoop'),
    ...coreFacts,
    getSection(sections, 'differentiators'),
    getSection(sections, 'progressionHook'),
    getFirstSection(sections, ['socialHook', 'socialSharingHook']),
    getSection(sections, 'monetization'),
  ].filter(Boolean);

  const evidence: EvidenceItem = {
    id: `evi_import_${Date.now()}`,
    type:
      type === 'interview' ||
      type === 'review' ||
      type === 'design_doc' ||
      type === 'metric_snapshot'
        ? type
        : 'design_doc',
    title,
    source: getSection(sections, 'source') || fileName,
    trust: coreFacts.length > 0 ? 'medium' : 'low',
    summary: summaryParts.join('；') || text.slice(0, 300),
    createdAt: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };

  return {
    evidence,
    hasStructuredFacts: coreFacts.length > 0,
  };
}

export function parseMarkdownImport(
  text: string,
  fileName: string,
  language: ImportLanguage,
): ImportedPayload {
  const sections = extractSections(text);
  const project = buildProject(sections, language);
  const { evidence, hasStructuredFacts } = buildEvidence(
    text,
    fileName,
    sections,
    language,
  );
  const warnings: string[] = [];

  if (!project) {
    warnings.push(
      language === 'en'
        ? 'The Markdown file did not match the full project template, so it was imported as evidence only.'
        : 'Markdown 未命中完整项目模板，已按证据材料导入。',
    );
  }

  if (!hasStructuredFacts) {
    warnings.push(
      language === 'en'
        ? 'The imported evidence did not include a Core Facts section, so it was saved with low trust.'
        : '导入材料缺少“核心事实 / Core Facts”段落，当前证据已按低可信导入。',
    );
  }

  return {
    evidenceMode: 'append',
    project: project ?? undefined,
    evidenceItems: [evidence],
    warnings,
  };
}
