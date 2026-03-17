import type {
  SandboxAnalysisJob,
  SandboxAnalysisMode,
  SandboxAnalysisResult,
} from '../../../shared/sandbox';
import type { ProjectSnapshot } from '../../types';
import type { InputStep, OutputStep, ProcessPhase } from '../../lib/processPhases';
import type { UiLanguage } from '../../hooks/useUiLanguage';

export type WorkspaceJourneyStepId =
  | 'overview'
  | 'evidence'
  | 'analysis'
  | 'results'
  | 'sandbox';

export type WorkspaceJourneyStep = {
  id: WorkspaceJourneyStepId;
  label: string;
  brief: string;
  status: string;
  metric: string;
  locked: boolean;
  onSelect: () => void;
};

export type WorkspaceHeaderViewModelParams = {
  activePhase: ProcessPhase;
  inputStep: InputStep;
  outputStep: OutputStep;
  project: ProjectSnapshot;
  evidenceCount: number;
  analysis: SandboxAnalysisResult;
  hasViewableAnalysis: boolean;
  isAnalysisFresh: boolean;
  isAnalysisStale: boolean;
  isAnalysisDegraded: boolean;
  canRunAnalysis: boolean;
  isLoading: boolean;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  progress: SandboxAnalysisJob | null;
  lastRequestedMode: SandboxAnalysisMode | null;
  visibleAnalysisMode: SandboxAnalysisMode | null;
  isShowingFallbackAnalysis: boolean;
  baselineCount: number;
  language: UiLanguage;
  onSelectPhase: (phase: ProcessPhase) => void;
  onSelectInputStep: (step: InputStep) => void;
  onSelectOutputStep: (step: OutputStep) => void;
};
