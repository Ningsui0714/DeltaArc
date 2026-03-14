import type {
  EvidenceItem,
  HypothesisCard,
  PersonaCard,
  ProjectSnapshot,
  StrategyCard,
} from './domain';

export type SandboxAnalysisMode = 'balanced' | 'reasoning';
export type AnalysisSource = 'remote' | 'local_fallback';
export type AnalysisStatus = 'fresh' | 'stale' | 'degraded' | 'error';
export type SandboxAnalysisStageKey = 'queued' | 'dossier' | SandboxPerspectiveKey | 'synthesis' | 'refine' | 'complete';
export type SandboxAnalysisResumeStageKey = Exclude<SandboxAnalysisStageKey, 'queued' | 'complete'>;
export type SandboxAnalysisJobStatus = 'queued' | 'running' | 'completed' | 'error';
export type SandboxAnalysisJobStageStatus = 'pending' | 'running' | 'completed' | 'error';
export type SandboxEvidenceLevel = 'low' | 'medium' | 'high';
export type SandboxPerspectiveKey =
  | 'systems'
  | 'psychology'
  | 'economy'
  | 'market'
  | 'production'
  | 'red_team';
export type SandboxPerspectiveStance = 'bullish' | 'mixed' | 'bearish';
export type SandboxEffectHorizon = 'near' | 'mid' | 'long';
export type SandboxEffectDirection = 'positive' | 'mixed' | 'negative';
export type SandboxValidationPriority = 'P0' | 'P1' | 'P2';
export type SandboxMemoryStrength = 'fresh' | 'recurring' | 'warning';

export type SandboxScoreSet = {
  coreFun: number;
  learningCost: number;
  novelty: number;
  acceptanceRisk: number;
  prototypeCost: number;
};

export type SandboxPerspective = {
  key: SandboxPerspectiveKey;
  label: string;
  stance: SandboxPerspectiveStance;
  confidence: number;
  verdict: string;
  opportunity: string;
  concern: string;
  leverage: string;
  evidenceRefs: string[];
};

export type SandboxBlindSpot = {
  area: string;
  whyItMatters: string;
  missingEvidence: string;
};

export type SandboxSecondOrderEffect = {
  trigger: string;
  outcome: string;
  horizon: SandboxEffectHorizon;
  direction: SandboxEffectDirection;
};

export type SandboxScenarioVariant = {
  name: string;
  premise: string;
  upside: string;
  downside: string;
  watchSignals: string[];
  recommendedMove: string;
};

export type SandboxFutureTimelineItem = {
  phase: string;
  timing: string;
  expectedReaction: string;
  likelyShift: string;
  risk: string;
  watchSignals: string[];
  recommendedResponse: string;
};

export type SandboxCommunityRhythm = {
  name: string;
  timing: string;
  pattern: string;
  trigger: string;
  implication: string;
};

export type SandboxTrajectorySignal = {
  signal: string;
  direction: SandboxEffectDirection;
  timing: string;
  impact: string;
  recommendedMove: string;
};

export type SandboxDecisionLens = {
  name: string;
  keyQuestion: string;
  answer: string;
};

export type SandboxValidationTrack = {
  name: string;
  priority: SandboxValidationPriority;
  goal: string;
  method: string;
  successSignal: string;
  failureSignal: string;
  cost: string;
  timeframe: string;
};

export type SandboxContrarianMove = {
  title: string;
  thesis: string;
  whenToUse: string;
};

export type SandboxUnknown = {
  topic: string;
  whyUnknown: string;
  resolveBy: string;
};

export type SandboxRedTeamReport = {
  thesis: string;
  attackVectors: string[];
  failureModes: string[];
  mitigation: string;
};

export type SandboxMemorySignal = {
  title: string;
  summary: string;
  signalStrength: SandboxMemoryStrength;
};

export type SandboxReport = {
  headline: string;
  summary: string;
  conclusion: string;
  whyNow: string;
  risk: string;
  actions: string[];
};

export type SandboxVerifierDecisionMode = 'verifier' | 'fallback' | 'single';

export type SandboxSelectionRanking = {
  candidateId: string;
  overallScore: number;
  strength: string;
  risk: string;
};

export type SandboxSelectionSummary = {
  stage: 'dossier' | 'action_brief';
  candidateCount: number;
  selectedCandidateId: string;
  selectedFlavor: string;
  decisionMode: SandboxVerifierDecisionMode;
  rationale: string;
  rankings: SandboxSelectionRanking[];
};

export type SandboxNecessaryConditionStatus =
  | 'supported'
  | 'uncertain'
  | 'unsupported';

export type SandboxNecessaryCondition = {
  condition: string;
  status: SandboxNecessaryConditionStatus;
  evidenceRefs: string[];
  impact: string;
};

export type SandboxReverseCheckSummary = {
  tightened: boolean;
  fragilitySummary: string;
  necessaryConditions: SandboxNecessaryCondition[];
};

export type SandboxAnalysisMeta = {
  source: AnalysisSource;
  status: AnalysisStatus;
  requestId: string;
  dossierSelection?: SandboxSelectionSummary;
  actionBriefSelection?: SandboxSelectionSummary;
  reverseCheck?: SandboxReverseCheckSummary;
};

export type SandboxAnalysisStagePreview = {
  headline: string;
  summary: string;
  bullets: string[];
};

export type SandboxAnalysisRequest = {
  workspaceId: string;
  mode: SandboxAnalysisMode;
  project: ProjectSnapshot;
  evidenceItems: EvidenceItem[];
};

export type SandboxAnalysisJobStage = {
  key: SandboxAnalysisStageKey;
  label: string;
  detail: string;
  status: SandboxAnalysisJobStageStatus;
  preview?: SandboxAnalysisStagePreview;
  model?: string;
  durationMs?: number;
  startedAt?: string;
  completedAt?: string;
};

export type SandboxAnalysisResult = {
  generatedAt: string;
  mode: SandboxAnalysisMode;
  model: string;
  pipeline: string[];
  meta: SandboxAnalysisMeta;
  summary: string;
  systemVerdict: string;
  evidenceLevel: SandboxEvidenceLevel;
  primaryRisk: string;
  nextStep: string;
  playerAcceptance: number;
  confidence: number;
  supportRatio: number;
  scores: SandboxScoreSet;
  personas: PersonaCard[];
  hypotheses: HypothesisCard[];
  strategies: StrategyCard[];
  perspectives: SandboxPerspective[];
  blindSpots: SandboxBlindSpot[];
  secondOrderEffects: SandboxSecondOrderEffect[];
  scenarioVariants: SandboxScenarioVariant[];
  futureTimeline: SandboxFutureTimelineItem[];
  communityRhythms: SandboxCommunityRhythm[];
  trajectorySignals: SandboxTrajectorySignal[];
  decisionLenses: SandboxDecisionLens[];
  validationTracks: SandboxValidationTrack[];
  contrarianMoves: SandboxContrarianMove[];
  unknowns: SandboxUnknown[];
  redTeam: SandboxRedTeamReport;
  memorySignals: SandboxMemorySignal[];
  report: SandboxReport;
  warnings: string[];
};

export type SandboxAnalysisJob = {
  id: string;
  mode: SandboxAnalysisMode;
  status: SandboxAnalysisJobStatus;
  currentStageKey: SandboxAnalysisStageKey;
  currentStageLabel: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  stages: SandboxAnalysisJobStage[];
  result?: SandboxAnalysisResult;
  error?: string;
  retryable?: boolean;
  resumeFromStageKey?: SandboxAnalysisResumeStageKey;
  resumedFromJobId?: string;
  cachedStageKeys?: SandboxAnalysisResumeStageKey[];
};

export type LatestRetryableSandboxAnalysisJob = {
  job: SandboxAnalysisJob;
  inputSignature: string;
};

export type LatestActiveSandboxAnalysisJob = {
  job: SandboxAnalysisJob;
  inputSignature: string;
};
