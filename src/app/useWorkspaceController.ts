import { useState } from 'react';
import type { ImportFeedback } from '../components/import/FileImportCard';
import { useBaselineLibrary } from '../hooks/useBaselineLibrary';
import { useEvidence } from '../hooks/useEvidence';
import { useProject } from '../hooks/useProject';
import { isEnglishUi, useUiLanguage } from '../hooks/useUiLanguage';
import { useSandboxAnalysis } from '../hooks/useSandboxAnalysis';
import { getProjectReadiness } from '../lib/projectReadiness';
import { deriveWorkspaceAnalysisState } from '../lib/workspaceAnalysisState';
import {
  type InputStep,
  type OutputStep,
  type ProcessPhase,
} from '../lib/processPhases';
import type { StepId } from '../types';
import {
  createClearEvidenceOnlyAction,
  createEvidenceImportAction,
  createProjectImportAction,
  createProjectUpdateAction,
  createRefreshAnalysisAction,
  createResetWorkspaceAction,
  createWorkspaceNavigation,
} from './workspaceControllerActions';

export type WorkspaceController = {
  workspaceId: string;
  activePhase: ProcessPhase;
  activeInputStep: InputStep;
  activeOutputStep: OutputStep;
  projectImportFeedback: ImportFeedback | null;
  evidenceImportFeedback: ImportFeedback | null;
  project: ReturnType<typeof useProject>['project'];
  evidenceItems: ReturnType<typeof useEvidence>['evidenceItems'];
  analysis: ReturnType<typeof useSandboxAnalysis>['analysis'];
  progress: ReturnType<typeof useSandboxAnalysis>['progress'];
  error: ReturnType<typeof useSandboxAnalysis>['error'];
  status: ReturnType<typeof useSandboxAnalysis>['status'];
  lastRequestedAnalysisMode: ReturnType<typeof useSandboxAnalysis>['lastRequestedMode'];
  visibleAnalysisMode: ReturnType<typeof useSandboxAnalysis>['visibleAnalysisMode'];
  isShowingFallbackAnalysis: ReturnType<typeof useSandboxAnalysis>['isShowingFallbackAnalysis'];
  canRetryAnalysisFromFailure: ReturnType<typeof useSandboxAnalysis>['canRetryAnalysisFromFailure'];
  baselines: ReturnType<typeof useBaselineLibrary>['baselines'];
  baselineStatus: ReturnType<typeof useBaselineLibrary>['status'];
  baselineError: ReturnType<typeof useBaselineLibrary>['error'];
  hasViewableAnalysis: boolean;
  isAnalysisFresh: boolean;
  isAnalysisStale: boolean;
  isAnalysisDegraded: boolean;
  requiresAnalysisRerun: boolean;
  lastCompletedAt: string;
  canRunAnalysis: boolean;
  navigate: (step: StepId) => void;
  selectPhase: (phase: ProcessPhase) => void;
  runQuickForecast: (nextStep?: StepId) => Promise<void>;
  runDeepForecast: (nextStep?: StepId) => Promise<void>;
  retryAnalysisFromFailure: () => Promise<unknown>;
  freezeLatestBaseline: ReturnType<typeof useBaselineLibrary>['freezeLatestBaseline'];
  updateProject: ReturnType<typeof useProject>['updateProject'];
  addEvidenceEntries: ReturnType<typeof useEvidence>['addEvidenceEntries'];
  resetWorkspace: () => void;
  clearEvidenceOnly: () => void;
  importProjectFile: (file: File) => Promise<void>;
  importEvidenceFile: (file: File) => Promise<void>;
};

export function useWorkspaceController(): WorkspaceController {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const [activePhase, setActivePhase] = useState<ProcessPhase>('intake');
  const [activeInputStep, setActiveInputStep] = useState<InputStep>('overview');
  const [activeOutputStep, setActiveOutputStep] = useState<OutputStep>('report');
  const [projectImportFeedback, setProjectImportFeedback] = useState<ImportFeedback | null>(null);
  const [evidenceImportFeedback, setEvidenceImportFeedback] = useState<ImportFeedback | null>(null);
  const { workspaceId, project, updateProject, replaceProject, resetToBlankProject } = useProject();
  const { evidenceItems, addEvidenceEntries, clearEvidence, appendEvidenceItems, replaceEvidenceItems } =
    useEvidence(workspaceId);
  const {
    analysis,
    progress,
    error,
    status,
    lastRequestedMode,
    visibleAnalysisMode,
    isShowingFallbackAnalysis,
    canRetryAnalysisFromFailure,
    analysisMatchesCurrentDraft,
    runAnalysis,
    retryAnalysisFromFailure,
    resetAnalysisState,
  } = useSandboxAnalysis({
    workspaceId,
    project,
    evidenceItems,
  });
  const {
    baselines,
    status: baselineStatus,
    error: baselineError,
    freezeLatestBaseline,
    resetBaselines,
  } = useBaselineLibrary(workspaceId);
  const readiness = getProjectReadiness(project, evidenceItems.length);
  const canRunAnalysis = readiness.projectReady && readiness.evidenceReady;
  const analysisState = deriveWorkspaceAnalysisState(analysis, {
    matchesCurrentInputs: analysisMatchesCurrentDraft,
  });
  const hasViewableAnalysis = analysisState.hasViewableOutput;
  const lastCompletedAt = analysisState.lastCompletedAt;
  const { navigate, selectPhase } = createWorkspaceNavigation({
    hasViewableAnalysis,
    setActivePhase,
    setActiveInputStep,
    setActiveOutputStep,
  });
  const refreshAnalysis = createRefreshAnalysisAction({
    canRunAnalysis,
    setActivePhase,
    runAnalysis,
    navigate,
  });
  const updateProjectAction = createProjectUpdateAction({
    workspaceId,
    project,
    updateProject,
    resetAnalysisState,
    resetBaselines,
    setActivePhase,
    setActiveOutputStep,
  });
  const importProjectFile = createProjectImportAction({
    workspaceId,
    language,
    isEnglish,
    replaceProject,
    replaceEvidenceItems,
    appendEvidenceItems,
    resetAnalysisState,
    resetBaselines,
    setProjectImportFeedback,
  });
  const importEvidenceFile = createEvidenceImportAction({
    language,
    isEnglish,
    appendEvidenceItems,
    setEvidenceImportFeedback,
  });
  const resetWorkspace = createResetWorkspaceAction({
    workspaceId,
    clearEvidence,
    resetAnalysisState,
    resetBaselines,
    resetToBlankProject,
    setProjectImportFeedback,
    setEvidenceImportFeedback,
    setActivePhase,
    setActiveInputStep,
    setActiveOutputStep,
  });
  const clearEvidenceOnly = createClearEvidenceOnlyAction(
    clearEvidence,
    setEvidenceImportFeedback,
  );

  return {
    workspaceId,
    activePhase,
    activeInputStep,
    activeOutputStep,
    projectImportFeedback,
    evidenceImportFeedback,
    project,
    evidenceItems,
    analysis,
    progress,
    error,
    status,
    lastRequestedAnalysisMode: lastRequestedMode,
    visibleAnalysisMode,
    isShowingFallbackAnalysis,
    canRetryAnalysisFromFailure,
    baselines,
    baselineStatus,
    baselineError,
    hasViewableAnalysis,
    isAnalysisFresh: analysisState.isFresh,
    isAnalysisStale: analysisState.isStale,
    isAnalysisDegraded: analysisState.isDegraded,
    requiresAnalysisRerun: analysisState.requiresRerun,
    lastCompletedAt,
    canRunAnalysis,
    navigate,
    selectPhase,
    runQuickForecast: (nextStep) => refreshAnalysis('balanced', nextStep),
    runDeepForecast: (nextStep) => refreshAnalysis('reasoning', nextStep),
    retryAnalysisFromFailure,
    freezeLatestBaseline,
    updateProject: updateProjectAction,
    addEvidenceEntries,
    resetWorkspace,
    clearEvidenceOnly,
    importProjectFile,
    importEvidenceFile,
  };
}
