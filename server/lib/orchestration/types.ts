import type { HypothesisCard, PersonaCard, StrategyCard } from '../../../shared/domain';
import type {
  SandboxAnalysisResult,
  SandboxBlindSpot,
  SandboxContrarianMove,
  SandboxDecisionLens,
  SandboxMemorySignal,
  SandboxPerspective,
  SandboxRedTeamReport,
  SandboxScenarioVariant,
  SandboxScoreSet,
  SandboxSecondOrderEffect,
  SandboxUnknown,
  SandboxValidationTrack,
} from '../../../shared/sandbox';

export type Dossier = {
  systemFrame: string;
  opportunityThesis: string;
  evidenceLevel: SandboxAnalysisResult['evidenceLevel'];
  playerAcceptance: number;
  confidence: number;
  supportRatio: number;
  scores: SandboxScoreSet;
  personas: PersonaCard[];
  hypotheses: HypothesisCard[];
  evidenceDigest: Array<{
    title: string;
    signal: string;
    implication: string;
  }>;
  coreTensions: string[];
  openQuestions: string[];
  memorySignals: SandboxMemorySignal[];
  warnings: string[];
};

export type DossierGrounding = {
  facts: Array<{
    dimension: string;
    statement: string;
    evidenceRefs: string[];
  }>;
  tensions: Array<{
    title: string;
    detail: string;
  }>;
  audiences: Array<{
    name: string;
    need: string;
    risk: string;
  }>;
  constraints: string[];
  unknowns: Array<{
    topic: string;
    whyUnknown: string;
  }>;
  memorySignals: SandboxMemorySignal[];
  warnings: string[];
};

export type CandidateSelection = {
  selectedCandidateId: string;
  rationale: string;
  rankings: Array<{
    candidateId: string;
    overallScore: number;
    strength: string;
    risk: string;
  }>;
  warnings: string[];
};

export type SpecialistOutput = {
  perspective: SandboxPerspective;
  blindSpots: SandboxBlindSpot[];
  secondOrderEffects: SandboxSecondOrderEffect[];
  scenarioVariants: SandboxScenarioVariant[];
  decisionLenses: SandboxDecisionLens[];
  validationTracks: SandboxValidationTrack[];
  contrarianMoves: SandboxContrarianMove[];
  unknowns: SandboxUnknown[];
  strategyIdeas: StrategyCard[];
  redTeam?: SandboxRedTeamReport;
  warnings: string[];
};

export type StageResult<T> = {
  data: T;
  model: string;
  durationMs: number;
  warnings: string[];
  degraded: boolean;
};
