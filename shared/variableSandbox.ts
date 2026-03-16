import type { EvidenceItem, HypothesisCard, PersonaCard, ProjectSnapshot } from './domain';
import type {
  AnalysisStatus,
  SandboxAnalysisResult,
  SandboxAnalysisMode,
  SandboxBlindSpot,
  SandboxEvidenceLevel,
  SandboxPerspective,
  SandboxScoreSet,
  SandboxValidationPriority,
  SandboxValidationTrack,
} from './sandbox';

export type FrozenBaselineSourceAnalysisStatus = Extract<AnalysisStatus, 'fresh' | 'degraded'>;
export const frozenBaselineSourceStatuses = ['fresh', 'degraded'] as const satisfies readonly FrozenBaselineSourceAnalysisStatus[];

export function isFrozenBaselineSourceAnalysisStatus(
  status: AnalysisStatus,
): status is FrozenBaselineSourceAnalysisStatus {
  return frozenBaselineSourceStatuses.includes(status as FrozenBaselineSourceAnalysisStatus);
}

export type DesignVariableV1Category = 'gameplay' | 'system' | 'live_ops' | 'monetization';
export type DesignVariableActivationStage = 'early' | 'mid' | 'late';
export type VariableImpactRiskLevel = 'low' | 'medium' | 'high';

export type FrozenBaselineAnalysisSnapshot = {
  summary: string;
  systemVerdict: string;
  evidenceLevel: SandboxEvidenceLevel;
  primaryRisk: string;
  nextStep: string;
  scores: SandboxScoreSet;
  personas: PersonaCard[];
  hypotheses: HypothesisCard[];
  perspectives: SandboxPerspective[];
  blindSpots: SandboxBlindSpot[];
  validationTracks: SandboxValidationTrack[];
  warnings: string[];
};

export type FrozenBaseline = {
  id: string;
  projectId: string;
  createdAt: string;
  sourceAnalysisRequestId: string;
  sourceAnalysisMode: SandboxAnalysisMode;
  sourceAnalysisGeneratedAt: string;
  sourceAnalysisStatus: FrozenBaselineSourceAnalysisStatus;
  projectSnapshot: ProjectSnapshot;
  evidenceSnapshot: EvidenceItem[];
  analysisSnapshot: FrozenBaselineAnalysisSnapshot;
};

export type DesignVariableV1 = {
  id: string;
  baselineId: string;
  name: string;
  category: DesignVariableV1Category;
  intent: string;
  changeStatement: string;
  injectionTargets: string[];
  expectedBenefits: string[];
  knownCosts: string[];
  activationStage: DesignVariableActivationStage;
  dependencies: string[];
  successSignals: string[];
  failureSignals: string[];
};

export type VariableImpactScanItem = {
  target: string;
  directEffect: string;
  upside: string;
  downside: string;
  confidence: number;
};

export type VariableImpactPersonaEffect = {
  personaName: string;
  likelyReaction: string;
  primaryTrigger: string;
  riskLevel: VariableImpactRiskLevel;
};

export type VariableImpactGuardrail = {
  title: string;
  reason: string;
  priority: SandboxValidationPriority;
};

export type VariableImpactValidationStep = {
  step: string;
  goal: string;
  successSignal: string;
  failureSignal: string;
};

export type VariableImpactScanResult = {
  summary: string;
  baselineRead: {
    summary: string;
    evidenceLevel: SandboxEvidenceLevel;
    primaryRisk: string;
    scores: SandboxScoreSet;
  };
  impactScan: VariableImpactScanItem[];
  affectedPersonas: VariableImpactPersonaEffect[];
  guardrails: VariableImpactGuardrail[];
  validationPlan: VariableImpactValidationStep[];
  assumptions: string[];
  warnings: string[];
  confidence: number;
  evidenceLevel: SandboxEvidenceLevel;
};

export type VariableImpactScanRequest = {
  baselineId: string;
  variable: DesignVariableV1;
  mode: SandboxAnalysisMode;
};

export type VariableImpactScanStageKey =
  | 'queued'
  | 'baseline_read'
  | 'impact_scan'
  | 'complete';

export type VariableImpactScanJobStatus = 'queued' | 'running' | 'completed' | 'error';
export type VariableImpactScanJobStageStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'error';

export type VariableImpactScanJobStage = {
  key: VariableImpactScanStageKey;
  label: string;
  detail: string;
  status: VariableImpactScanJobStageStatus;
  startedAt?: string;
  completedAt?: string;
};

export type VariableImpactScanJob = {
  id: string;
  workspaceId: string;
  baselineId: string;
  variableId: string;
  variable?: DesignVariableV1;
  mode: SandboxAnalysisMode;
  status: VariableImpactScanJobStatus;
  currentStageKey: VariableImpactScanStageKey;
  currentStageLabel: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  stages: VariableImpactScanJobStage[];
  result?: VariableImpactScanResult;
  error?: string;
};

export type CreateFrozenBaselineRequest = {
  project: ProjectSnapshot;
  evidenceItems: EvidenceItem[];
  analysis: SandboxAnalysisResult;
};

export type PersistedLatestAnalysis = {
  workspaceId: string;
  updatedAt: string;
  runStartedAt?: string;
  analysisJobId?: string;
  inputSignature: string;
  projectSnapshot: ProjectSnapshot;
  evidenceSnapshot: EvidenceItem[];
  analysis: SandboxAnalysisResult;
};

export function createWorkspaceInputSignature(
  project: ProjectSnapshot,
  evidenceItems: EvidenceItem[],
) {
  return JSON.stringify({
    project: {
      name: project.name,
      mode: project.mode,
      genre: project.genre,
      platforms: [...project.platforms],
      targetPlayers: [...project.targetPlayers],
      coreFantasy: project.coreFantasy,
      ideaSummary: project.ideaSummary,
      coreLoop: project.coreLoop,
      sessionLength: project.sessionLength,
      differentiators: project.differentiators,
      progressionHook: project.progressionHook,
      socialHook: project.socialHook,
      monetization: project.monetization,
      referenceGames: [...project.referenceGames],
      validationGoal: project.validationGoal,
      productionConstraints: project.productionConstraints,
      currentStatus: project.currentStatus,
    },
    evidenceItems: evidenceItems.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      source: item.source,
      trust: item.trust,
      summary: item.summary,
      createdAt: item.createdAt,
    })),
  });
}
