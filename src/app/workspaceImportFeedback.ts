import type { EvidenceItem } from '../types';
import type { ImportFeedback } from '../components/import/FileImportCard';
import type { ImportedPayload } from '../lib/import/types';

export function buildProjectImportFeedback(
  payload: ImportedPayload,
  nextEvidenceItems: EvidenceItem[],
  isEnglish: boolean,
): ImportFeedback {
  const messages = [
    payload.project ? (isEnglish ? 'Project fields were updated.' : '项目字段已更新。') : '',
    payload.evidenceMode === 'replace'
      ? isEnglish
        ? `Evidence was replaced with ${nextEvidenceItems.length} items.`
        : `证据已替换为 ${nextEvidenceItems.length} 条。`
      : payload.evidenceMode === 'append' && nextEvidenceItems.length > 0
        ? isEnglish
          ? `${nextEvidenceItems.length} evidence items were appended.`
          : `已追加 ${nextEvidenceItems.length} 条证据。`
        : '',
    ...payload.warnings,
  ].filter(Boolean);

  return {
    tone: payload.warnings.length > 0 ? 'warning' : 'success',
    message: messages.join(' ') || (isEnglish ? 'File imported.' : '文件已导入。'),
  };
}

export function buildProjectImportErrorFeedback(
  error: unknown,
  isEnglish: boolean,
): ImportFeedback {
  return {
    tone: 'error',
    message:
      error instanceof Error
        ? error.message
        : isEnglish
          ? 'Project file import failed.'
          : '项目文件导入失败。',
  };
}

export function buildEvidenceImportFeedback(
  payload: ImportedPayload,
  nextItems: EvidenceItem[],
  isEnglish: boolean,
): ImportFeedback {
  return {
    tone: payload.warnings.length > 0 ? 'warning' : 'success',
    message: [
      isEnglish
        ? `Imported ${nextItems.length} evidence items.`
        : `已导入 ${nextItems.length} 条证据。`,
      ...payload.warnings,
    ].join(' '),
  };
}

export function buildEvidenceImportErrorFeedback(
  error: unknown,
  isEnglish: boolean,
): ImportFeedback {
  return {
    tone: 'error',
    message:
      error instanceof Error
        ? error.message
        : isEnglish
          ? 'Evidence file import failed.'
          : '证据文件导入失败。',
  };
}
