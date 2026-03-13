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
};
