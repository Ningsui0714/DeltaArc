import { normalizeEvidenceList, normalizeProjectSnapshot } from './normalize';
import type { ImportedPayload } from './types';

function looksLikeProjectBundle(input: Record<string, unknown>) {
  return 'project' in input || 'evidenceItems' in input;
}

function looksLikeProjectObject(input: Record<string, unknown>) {
  return [
    'name',
    'mode',
    'genre',
    'ideaSummary',
    'coreLoop',
    'targetPlayers',
    'coreFantasy',
    'validationGoal',
  ].some((key) => key in input);
}

export function parseJsonImport(text: string): ImportedPayload {
  const parsed = JSON.parse(text) as unknown;
  const warnings: string[] = [];

  if (Array.isArray(parsed)) {
    return {
      evidenceMode: 'append',
      evidenceItems: normalizeEvidenceList(parsed),
      warnings,
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('JSON file format is invalid.');
  }

  const source = parsed as Record<string, unknown>;

  if (looksLikeProjectBundle(source)) {
    const hasEvidenceItems = Object.prototype.hasOwnProperty.call(source, 'evidenceItems');

    if (hasEvidenceItems && !Array.isArray(source.evidenceItems)) {
      throw new Error('JSON project bundles must use an evidenceItems array.');
    }

    const project = normalizeProjectSnapshot(source.project);
    const evidenceItems = hasEvidenceItems ? normalizeEvidenceList(source.evidenceItems) : undefined;

    if (!project && !hasEvidenceItems) {
      throw new Error('JSON project bundles must include project or evidenceItems.');
    }

    return {
      evidenceMode: hasEvidenceItems ? 'replace' : 'none',
      project: project ?? undefined,
      evidenceItems,
      warnings,
    };
  }

  if (looksLikeProjectObject(source)) {
    return {
      evidenceMode: 'none',
      project: normalizeProjectSnapshot(source) ?? undefined,
      warnings,
    };
  }

  if ('title' in source || 'summary' in source || 'content' in source) {
    return {
      evidenceMode: 'append',
      evidenceItems: normalizeEvidenceList([source]),
      warnings,
    };
  }

  throw new Error('Unsupported JSON structure. Use a project bundle, project object, or evidence array.');
}
