export type StepId = 'overview' | 'evidence' | 'modeling' | 'strategy' | 'report' | 'sandbox';

export type EvidenceType = 'note' | 'interview' | 'review' | 'design_doc' | 'metric_snapshot';
export type TrustLevel = 'low' | 'medium' | 'high';
export type GameProjectMode = 'Concept' | 'Validation' | 'Live';

export type EvidenceItem = {
  id: string;
  type: EvidenceType;
  title: string;
  source: string;
  trust: TrustLevel;
  summary: string;
  createdAt: string;
};

export type PersonaCard = {
  name: string;
  motive: string;
  accepts: string;
  rejects: string;
  verdict: string;
};

export type HypothesisCard = {
  title: string;
  evidence: string;
  confidence: number;
  gap: string;
};

export type StrategyCard = {
  name: string;
  type: string;
  cost: string;
  timeToValue: string;
  acceptance: number;
  risk: string;
  recommendation: string;
};

export type ProjectSnapshot = {
  name: string;
  mode: GameProjectMode;
  genre: string;
  platforms: string[];
  targetPlayers: string[];
  coreFantasy: string;
  ideaSummary: string;
  coreLoop: string;
  sessionLength: string;
  differentiators: string;
  progressionHook: string;
  socialHook: string;
  monetization: string;
  referenceGames: string[];
  validationGoal: string;
  productionConstraints: string;
  currentStatus: string;
};

export type StepLabel = {
  id: StepId;
  label: string;
  kicker: string;
};
