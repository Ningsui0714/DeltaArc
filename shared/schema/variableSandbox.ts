import type {
  CreateFrozenBaselineRequest,
  DesignVariableActivationStage,
  DesignVariableV1,
  DesignVariableV1Category,
  FrozenBaseline,
  FrozenBaselineAnalysisSnapshot,
  FrozenBaselineSourceAnalysisStatus,
  PersistedLatestAnalysis,
  VariableImpactRiskLevel,
  VariableImpactScanJob,
  VariableImpactScanJobStage,
  VariableImpactScanJobStageStatus,
  VariableImpactScanStageKey,
  VariableImpactScanRequest,
  VariableImpactScanResult,
} from '../variableSandbox';
import {
  clampPercent,
  ensureRecordArray,
  ensureString,
  ensureStringArray,
  requireArray,
  requireOneOf,
  requirePercent,
  requireRecord,
  requireString,
  requireStringArray,
  SchemaError,
} from './common';
import { parseEvidenceList } from './evidence';
import { parseProjectSnapshot } from './project';
import {
  normalizeBlindSpots,
  normalizeHypothesisCards,
  normalizePersonaCards,
  normalizePerspectives,
  parseSandboxAnalysisResult,
  normalizeScoreSet,
  normalizeValidationTracks,
} from './sandboxResult';
import { analysisModes, evidenceLevels, validationPriorities } from './sandboxResultOptions';

const baselineSourceStatuses: FrozenBaselineSourceAnalysisStatus[] = ['fresh', 'degraded'];
const designVariableCategories: DesignVariableV1Category[] = [
  'gameplay',
  'system',
  'live_ops',
  'monetization',
];
const activationStages: DesignVariableActivationStage[] = ['early', 'mid', 'late'];
const variableImpactRiskLevels: VariableImpactRiskLevel[] = ['low', 'medium', 'high'];
const impactScanStageKeys: VariableImpactScanStageKey[] = [
  'queued',
  'baseline_read',
  'impact_scan',
  'complete',
];
const impactScanStageStatuses: VariableImpactScanJobStageStatus[] = [
  'pending',
  'running',
  'completed',
  'error',
];

const emptyScoreSet = {
  coreFun: 0,
  learningCost: 0,
  novelty: 0,
  acceptanceRisk: 0,
  prototypeCost: 0,
};

function parseFrozenBaselineAnalysisSnapshot(input: unknown): FrozenBaselineAnalysisSnapshot {
  const record = requireRecord(input, 'analysisSnapshot');

  return {
    summary: requireString(record.summary, 'analysisSnapshot.summary'),
    systemVerdict: requireString(record.systemVerdict, 'analysisSnapshot.systemVerdict'),
    evidenceLevel: requireOneOf(
      record.evidenceLevel,
      evidenceLevels,
      'analysisSnapshot.evidenceLevel',
    ),
    primaryRisk: requireString(record.primaryRisk, 'analysisSnapshot.primaryRisk'),
    nextStep: requireString(record.nextStep, 'analysisSnapshot.nextStep'),
    scores: normalizeScoreSet(
      requireRecord(record.scores, 'analysisSnapshot.scores'),
      emptyScoreSet,
    ),
    personas: normalizePersonaCards(requireArray(record.personas, 'analysisSnapshot.personas')),
    hypotheses: normalizeHypothesisCards(
      requireArray(record.hypotheses, 'analysisSnapshot.hypotheses'),
    ),
    perspectives: normalizePerspectives(
      requireArray(record.perspectives, 'analysisSnapshot.perspectives'),
    ),
    blindSpots: normalizeBlindSpots(
      requireArray(record.blindSpots, 'analysisSnapshot.blindSpots'),
    ),
    validationTracks: normalizeValidationTracks(
      requireArray(record.validationTracks, 'analysisSnapshot.validationTracks'),
    ),
    warnings: requireStringArray(record.warnings, 'analysisSnapshot.warnings'),
  };
}

function isFrozenBaselineSourceStatus(
  status: string,
): status is FrozenBaselineSourceAnalysisStatus {
  return baselineSourceStatuses.includes(status as FrozenBaselineSourceAnalysisStatus);
}

export function parseCreateFrozenBaselineRequest(input: unknown): CreateFrozenBaselineRequest {
  const record = requireRecord(input, 'create frozen baseline request');
  const analysis = parseSandboxAnalysisResult(record.analysis);

  if (analysis.meta.source !== 'remote') {
    throw new SchemaError('analysis 必须来自正式远端结果。');
  }

  if (!isFrozenBaselineSourceStatus(analysis.meta.status)) {
    throw new SchemaError('analysis.meta.status 必须是 fresh 或 degraded。');
  }

  return {
    project: parseProjectSnapshot(record.project),
    evidenceItems: parseEvidenceList(record.evidenceItems),
    analysis,
  };
}

export function parseFrozenBaseline(input: unknown): FrozenBaseline {
  const record = requireRecord(input, 'frozen baseline');

  return {
    id: requireString(record.id, 'id'),
    projectId: requireString(record.projectId, 'projectId'),
    createdAt: requireString(record.createdAt, 'createdAt'),
    sourceAnalysisRequestId: requireString(
      record.sourceAnalysisRequestId,
      'sourceAnalysisRequestId',
    ),
    sourceAnalysisMode: requireOneOf(
      record.sourceAnalysisMode,
      analysisModes,
      'sourceAnalysisMode',
    ),
    sourceAnalysisGeneratedAt: requireString(
      record.sourceAnalysisGeneratedAt,
      'sourceAnalysisGeneratedAt',
    ),
    sourceAnalysisStatus: requireOneOf(
      record.sourceAnalysisStatus,
      baselineSourceStatuses,
      'sourceAnalysisStatus',
    ),
    projectSnapshot: parseProjectSnapshot(record.projectSnapshot),
    evidenceSnapshot: parseEvidenceList(record.evidenceSnapshot),
    analysisSnapshot: parseFrozenBaselineAnalysisSnapshot(record.analysisSnapshot),
  };
}

export function parseDesignVariableV1(input: unknown): DesignVariableV1 {
  const record = requireRecord(input, 'variable');

  return {
    id: requireString(record.id, 'variable.id'),
    baselineId: requireString(record.baselineId, 'variable.baselineId'),
    name: requireString(record.name, 'variable.name'),
    category: requireOneOf(
      record.category,
      designVariableCategories,
      'variable.category',
    ),
    intent: requireString(record.intent, 'variable.intent'),
    changeStatement: requireString(record.changeStatement, 'variable.changeStatement'),
    injectionTargets: requireStringArray(
      record.injectionTargets,
      'variable.injectionTargets',
    ),
    expectedBenefits: requireStringArray(
      record.expectedBenefits,
      'variable.expectedBenefits',
    ),
    knownCosts: requireStringArray(record.knownCosts, 'variable.knownCosts'),
    activationStage: requireOneOf(
      record.activationStage,
      activationStages,
      'variable.activationStage',
    ),
    dependencies: requireStringArray(record.dependencies, 'variable.dependencies'),
    successSignals: requireStringArray(
      record.successSignals,
      'variable.successSignals',
    ),
    failureSignals: requireStringArray(
      record.failureSignals,
      'variable.failureSignals',
    ),
  };
}

export function parseVariableImpactScanRequest(input: unknown): VariableImpactScanRequest {
  const record = requireRecord(input, 'impact scan request');
  const baselineId = requireString(record.baselineId, 'baselineId');
  const variable = parseDesignVariableV1(record.variable);

  if (variable.baselineId !== baselineId) {
    throw new SchemaError('variable.baselineId 必须和 baselineId 一致。');
  }

  return {
    baselineId,
    variable,
    mode: requireOneOf(record.mode, analysisModes, 'mode'),
  };
}

export function parseVariableImpactScanResult(input: unknown): VariableImpactScanResult {
  const record = requireRecord(input, 'impact scan result');
  const baselineRead = requireRecord(record.baselineRead, 'baselineRead');

  requireString(record.summary, 'summary');
  requireString(baselineRead.summary, 'baselineRead.summary');
  requireString(baselineRead.primaryRisk, 'baselineRead.primaryRisk');
  requireRecord(baselineRead.scores, 'baselineRead.scores');
  requireArray(record.impactScan, 'impactScan');
  requireArray(record.affectedPersonas, 'affectedPersonas');
  requireArray(record.guardrails, 'guardrails');
  requireArray(record.validationPlan, 'validationPlan');
  requireArray(record.assumptions, 'assumptions');
  requireArray(record.warnings, 'warnings');
  requirePercent(record.confidence, 'confidence');

  return {
    summary: requireString(record.summary, 'summary'),
    baselineRead: {
      summary: requireString(baselineRead.summary, 'baselineRead.summary'),
      evidenceLevel: requireOneOf(
        baselineRead.evidenceLevel,
        evidenceLevels,
        'baselineRead.evidenceLevel',
      ),
      primaryRisk: requireString(baselineRead.primaryRisk, 'baselineRead.primaryRisk'),
      scores: normalizeScoreSet(baselineRead.scores, emptyScoreSet),
    },
    impactScan: ensureRecordArray(record.impactScan).map((item, index) => ({
      target: ensureString(item.target, `Target ${index + 1}`),
      directEffect: ensureString(
        item.directEffect,
        'The direct effect still needs clarification.',
      ),
      upside: ensureString(item.upside, 'The upside is still unclear.'),
      downside: ensureString(item.downside, 'The downside is still unclear.'),
      confidence: clampPercent(item.confidence, 60),
    })),
    affectedPersonas: ensureRecordArray(record.affectedPersonas).map((item, index) => ({
      personaName: ensureString(item.personaName, `Persona ${index + 1}`),
      likelyReaction: ensureString(
        item.likelyReaction,
        'The likely reaction still needs clarification.',
      ),
      primaryTrigger: ensureString(
        item.primaryTrigger,
        'The primary trigger is still unclear.',
      ),
      riskLevel: oneOf(item.riskLevel, variableImpactRiskLevels, 'medium'),
    })),
    guardrails: ensureRecordArray(record.guardrails).map((item, index) => ({
      title: ensureString(item.title, `Guardrail ${index + 1}`),
      reason: ensureString(item.reason, 'The guardrail reason is still unclear.'),
      priority: oneOf(item.priority, validationPriorities, 'P1'),
    })),
    validationPlan: ensureRecordArray(record.validationPlan).map((item, index) => ({
      step: ensureString(item.step, `Validation step ${index + 1}`),
      goal: ensureString(item.goal, 'The validation goal is still unclear.'),
      successSignal: ensureString(
        item.successSignal,
        'The success signal is still unclear.',
      ),
      failureSignal: ensureString(
        item.failureSignal,
        'The failure signal is still unclear.',
      ),
    })),
    assumptions: ensureStringArray(record.assumptions),
    warnings: ensureStringArray(record.warnings),
    confidence: requirePercent(record.confidence, 'confidence'),
    evidenceLevel: requireOneOf(record.evidenceLevel, evidenceLevels, 'evidenceLevel'),
  };
}

export function parsePersistedLatestAnalysis(input: unknown): PersistedLatestAnalysis {
  const record = requireRecord(input, 'persisted latest analysis');

  return {
    workspaceId: requireString(record.workspaceId, 'workspaceId'),
    updatedAt: requireString(record.updatedAt, 'updatedAt'),
    runStartedAt: ensureString(record.runStartedAt) || undefined,
    analysisJobId: ensureString(record.analysisJobId) || undefined,
    inputSignature: requireString(record.inputSignature, 'inputSignature'),
    projectSnapshot: parseProjectSnapshot(record.projectSnapshot),
    evidenceSnapshot: parseEvidenceList(record.evidenceSnapshot),
    analysis: parseSandboxAnalysisResult(record.analysis),
  };
}

function parseVariableImpactScanJobStage(input: unknown): VariableImpactScanJobStage {
  const record = requireRecord(input, 'impact scan job stage');

  return {
    key: requireOneOf(record.key, impactScanStageKeys, 'stage.key'),
    label: requireString(record.label, 'stage.label'),
    detail: requireString(record.detail, 'stage.detail'),
    status: requireOneOf(record.status, impactScanStageStatuses, 'stage.status'),
    startedAt: ensureString(record.startedAt) || undefined,
    completedAt: ensureString(record.completedAt) || undefined,
  };
}

export function parseVariableImpactScanJob(input: unknown): VariableImpactScanJob {
  const record = requireRecord(input, 'impact scan job');

  return {
    id: requireString(record.id, 'id'),
    workspaceId: requireString(record.workspaceId, 'workspaceId'),
    baselineId: requireString(record.baselineId, 'baselineId'),
    variableId: requireString(record.variableId, 'variableId'),
    variable: record.variable ? parseDesignVariableV1(record.variable) : undefined,
    mode: requireOneOf(record.mode, analysisModes, 'mode'),
    status: requireOneOf(
      record.status,
      ['queued', 'running', 'completed', 'error'] as const,
      'status',
    ),
    currentStageKey: requireOneOf(
      record.currentStageKey,
      impactScanStageKeys,
      'currentStageKey',
    ),
    currentStageLabel: requireString(record.currentStageLabel, 'currentStageLabel'),
    message: requireString(record.message, 'message'),
    createdAt: requireString(record.createdAt, 'createdAt'),
    updatedAt: requireString(record.updatedAt, 'updatedAt'),
    stages: requireArray(record.stages, 'stages').map((stage) =>
      parseVariableImpactScanJobStage(stage),
    ),
    result: record.result ? parseVariableImpactScanResult(record.result) : undefined,
    error: ensureString(record.error) || undefined,
  };
}

function oneOf<TValue>(
  value: unknown,
  candidates: readonly TValue[],
  fallback: TValue,
) {
  return candidates.includes(value as TValue) ? (value as TValue) : fallback;
}
