import type { AnalysisSource, AnalysisStatus, SandboxAnalysisMeta } from '../sandbox';
import {
  ensureRecord,
  ensureString,
  oneOf,
  requireOneOf,
  requireRecord,
  requireString,
} from './common';
import { analysisSources, analysisStatuses } from './sandboxResultOptions';

export function createAnalysisRequestId(prefix = 'analysis') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createAnalysisMeta(
  source: AnalysisSource,
  status: AnalysisStatus,
  requestId = createAnalysisRequestId(source === 'remote' ? 'analysis' : 'local'),
): SandboxAnalysisMeta {
  return {
    source,
    status,
    requestId,
  };
}

export function normalizeSandboxAnalysisMeta(
  value: unknown,
  fallback: SandboxAnalysisMeta,
): SandboxAnalysisMeta {
  const record = ensureRecord(value);

  return {
    source: oneOf(record.source, analysisSources, fallback.source),
    status: oneOf(record.status, analysisStatuses, fallback.status),
    requestId: ensureString(record.requestId, fallback.requestId),
  };
}

export function parseSandboxAnalysisMeta(value: unknown): SandboxAnalysisMeta {
  const record = requireRecord(value, 'meta');

  return {
    source: requireOneOf(record.source, analysisSources, 'meta.source'),
    status: requireOneOf(record.status, analysisStatuses, 'meta.status'),
    requestId: requireString(record.requestId, 'meta.requestId'),
  };
}
