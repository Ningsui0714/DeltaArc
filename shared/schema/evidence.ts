import type { EvidenceItem, EvidenceType, TrustLevel } from '../domain';
import { ensureString, isRecord, requireArray, requireRecord, SchemaError } from './common';

function createDefaultCreatedAt() {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function normalizeTrust(value: unknown): TrustLevel {
  const raw = ensureString(value).toLowerCase();
  if (raw === 'high' || raw === '高' || raw === '高可信') {
    return 'high';
  }

  if (raw === 'low' || raw === '低' || raw === '低可信') {
    return 'low';
  }

  return 'medium';
}

function normalizeEvidenceType(value: unknown): EvidenceType {
  const raw = ensureString(value).toLowerCase();
  if (
    raw === 'note' ||
    raw === 'interview' ||
    raw === 'review' ||
    raw === 'design_doc' ||
    raw === 'metric_snapshot'
  ) {
    return raw;
  }

  if (raw.includes('访谈')) {
    return 'interview';
  }

  if (raw.includes('评论')) {
    return 'review';
  }

  if (raw.includes('指标')) {
    return 'metric_snapshot';
  }

  if (raw.includes('文档') || raw.includes('草案')) {
    return 'design_doc';
  }

  return 'note';
}

function buildEvidenceItem(source: Record<string, unknown>, index: number): EvidenceItem | null {
  const title = ensureString(source.title);
  const summary = ensureString(source.summary) || ensureString(source.content);

  if (!title && !summary) {
    return null;
  }

  return {
    id: ensureString(source.id, `evi_import_${Date.now()}_${index}`),
    type: normalizeEvidenceType(source.type),
    title: title || `导入材料 ${index + 1}`,
    source: ensureString(source.source, '文件导入'),
    trust: normalizeTrust(source.trust),
    summary,
    createdAt: ensureString(source.createdAt, createDefaultCreatedAt()),
  };
}

export function normalizeEvidenceItem(input: unknown, index = 0): EvidenceItem | null {
  if (!isRecord(input)) {
    return null;
  }

  return buildEvidenceItem(input, index);
}

export function parseEvidenceItem(input: unknown, index = 0): EvidenceItem {
  const source = requireRecord(input, `evidenceItems[${index}]`);
  const item = buildEvidenceItem(source, index);

  if (!item) {
    throw new SchemaError(`evidenceItems[${index}] 至少需要 title 或 summary。`);
  }

  return item;
}

export function normalizeEvidenceList(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => normalizeEvidenceItem(item, index))
    .filter((item): item is EvidenceItem => item !== null);
}

export function parseEvidenceList(input: unknown) {
  return requireArray(input, 'evidenceItems').map((item, index) => parseEvidenceItem(item, index));
}
