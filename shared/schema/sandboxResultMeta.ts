import type {
  AnalysisSource,
  AnalysisStatus,
  SandboxAnalysisMeta,
  SandboxNecessaryCondition,
  SandboxReverseCheckSummary,
  SandboxSelectionRanking,
  SandboxSelectionSummary,
} from '../sandbox';
import {
  clampPercent,
  ensureRecord,
  ensureRecordArray,
  ensureString,
  ensureStringArray,
  oneOf,
  requireOneOf,
  requireRecord,
  requireString,
} from './common';
import { analysisSources, analysisStatuses } from './sandboxResultOptions';

const selectionStages = ['dossier', 'action_brief'] as const;
const verifierDecisionModes = ['verifier', 'fallback', 'single'] as const;
const necessaryConditionStatuses = ['supported', 'uncertain', 'unsupported'] as const;

function normalizeSelectionRankings(
  value: unknown,
  fallback: SandboxSelectionRanking[] = [],
) {
  const rankings = ensureRecordArray(value)
    .map((item, index) => ({
      candidateId: ensureString(item.candidateId, fallback[index]?.candidateId ?? `candidate_${index + 1}`),
      overallScore: clampPercent(item.overallScore, fallback[index]?.overallScore ?? Math.max(40, 88 - index * 10)),
      strength: ensureString(item.strength, fallback[index]?.strength ?? 'Verifier strength summary is unavailable.'),
      risk: ensureString(item.risk, fallback[index]?.risk ?? 'Verifier risk summary is unavailable.'),
    }))
    .filter((item) => item.candidateId);

  return rankings.length > 0 ? rankings : fallback;
}

function normalizeSelectionSummary(
  value: unknown,
  fallback?: SandboxSelectionSummary,
): SandboxSelectionSummary | undefined {
  const record = ensureRecord(value);
  const rankings = normalizeSelectionRankings(record.rankings, fallback?.rankings ?? []);
  const selectedCandidateId = ensureString(
    record.selectedCandidateId,
    fallback?.selectedCandidateId ?? rankings[0]?.candidateId ?? '',
  );
  const selectedFlavor = ensureString(record.selectedFlavor, fallback?.selectedFlavor ?? '');
  const rationale = ensureString(record.rationale, fallback?.rationale ?? '');
  const hasSummary =
    Boolean(selectedCandidateId) || Boolean(selectedFlavor) || Boolean(rationale) || rankings.length > 0;

  if (!hasSummary) {
    return fallback;
  }

  return {
    stage: oneOf(record.stage, selectionStages, fallback?.stage ?? 'dossier'),
    candidateCount:
      typeof record.candidateCount === 'number' && Number.isFinite(record.candidateCount)
        ? Math.max(1, Math.round(record.candidateCount))
        : fallback?.candidateCount ?? Math.max(rankings.length, 1),
    selectedCandidateId,
    selectedFlavor,
    decisionMode: oneOf(record.decisionMode, verifierDecisionModes, fallback?.decisionMode ?? 'verifier'),
    rationale,
    rankings,
  };
}

function normalizeNecessaryConditions(
  value: unknown,
  fallback: SandboxNecessaryCondition[] = [],
) {
  const conditions = ensureRecordArray(value)
    .map((item, index) => ({
      condition: ensureString(item.condition, fallback[index]?.condition ?? `必要条件 ${index + 1}`),
      status: oneOf(
        item.status,
        necessaryConditionStatuses,
        fallback[index]?.status ?? 'uncertain',
      ),
      evidenceRefs: ensureStringArray(item.evidenceRefs, fallback[index]?.evidenceRefs ?? []),
      impact: ensureString(item.impact, fallback[index]?.impact ?? 'Impact summary is unavailable.'),
    }))
    .filter((item) => item.condition);

  return conditions.length > 0 ? conditions : fallback;
}

function normalizeReverseCheckSummary(
  value: unknown,
  fallback?: SandboxReverseCheckSummary,
): SandboxReverseCheckSummary | undefined {
  const record = ensureRecord(value);
  const necessaryConditions = normalizeNecessaryConditions(
    record.necessaryConditions,
    fallback?.necessaryConditions ?? [],
  );
  const fragilitySummary = ensureString(record.fragilitySummary, fallback?.fragilitySummary ?? '');
  const tightened =
    typeof record.tightened === 'boolean'
      ? record.tightened
      : fallback?.tightened ?? false;

  if (!fragilitySummary && necessaryConditions.length === 0 && !tightened) {
    return fallback;
  }

  return {
    tightened,
    fragilitySummary,
    necessaryConditions,
  };
}

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
  const dossierSelection = normalizeSelectionSummary(
    record.dossierSelection,
    fallback.dossierSelection,
  );
  const actionBriefSelection = normalizeSelectionSummary(
    record.actionBriefSelection,
    fallback.actionBriefSelection,
  );
  const reverseCheck = normalizeReverseCheckSummary(
    record.reverseCheck,
    fallback.reverseCheck,
  );

  return {
    source: oneOf(record.source, analysisSources, fallback.source),
    status: oneOf(record.status, analysisStatuses, fallback.status),
    requestId: ensureString(record.requestId, fallback.requestId),
    ...(dossierSelection ? { dossierSelection } : {}),
    ...(actionBriefSelection ? { actionBriefSelection } : {}),
    ...(reverseCheck ? { reverseCheck } : {}),
  };
}

export function parseSandboxAnalysisMeta(value: unknown): SandboxAnalysisMeta {
  const record = requireRecord(value, 'meta');
  const dossierSelection = normalizeSelectionSummary(record.dossierSelection);
  const actionBriefSelection = normalizeSelectionSummary(record.actionBriefSelection);
  const reverseCheck = normalizeReverseCheckSummary(record.reverseCheck);

  return {
    source: requireOneOf(record.source, analysisSources, 'meta.source'),
    status: requireOneOf(record.status, analysisStatuses, 'meta.status'),
    requestId: requireString(record.requestId, 'meta.requestId'),
    ...(dossierSelection ? { dossierSelection } : {}),
    ...(actionBriefSelection ? { actionBriefSelection } : {}),
    ...(reverseCheck ? { reverseCheck } : {}),
  };
}
