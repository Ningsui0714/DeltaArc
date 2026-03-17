import { startTransition } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { SandboxAnalysisMode } from '../../shared/sandbox';
import type { EvidenceItem, ProjectSnapshot, StepId } from '../types';
import type { ImportFeedback } from '../components/import/FileImportCard';
import { clearStoredEvidence } from '../hooks/useEvidence';
import { importStructuredFile } from '../lib/import/importFile';
import type { ImportedPayload } from '../lib/import/types';
import {
  getPhaseForStep,
  isInputStep,
  type InputStep,
  type OutputStep,
  type ProcessPhase,
} from '../lib/processPhases';
import {
  buildEvidenceImportErrorFeedback,
  buildEvidenceImportFeedback,
  buildProjectImportErrorFeedback,
  buildProjectImportFeedback,
} from './workspaceImportFeedback';
import {
  clearPersistedWorkspaceState,
} from './workspaceStateClearCoordinator';
export {
  clearPersistedWorkspaceState,
  createWorkspaceStateClearCoordinator,
  waitForPendingWorkspaceStateClear,
} from './workspaceStateClearCoordinator';

type ImportLanguage = Parameters<typeof importStructuredFile>[1];

type NavigationDependencies = {
  hasViewableAnalysis: boolean;
  setActivePhase: Dispatch<SetStateAction<ProcessPhase>>;
  setActiveInputStep: Dispatch<SetStateAction<InputStep>>;
  setActiveOutputStep: Dispatch<SetStateAction<OutputStep>>;
};

type AnalysisRefreshDependencies = {
  workspaceId: string;
  canRunAnalysis: boolean;
  setActivePhase: Dispatch<SetStateAction<ProcessPhase>>;
  waitForPendingWorkspaceStateClear?: (workspaceId: string) => Promise<void>;
  runAnalysis: (mode: SandboxAnalysisMode) => Promise<unknown>;
  navigate: (step: StepId) => void;
};

type ProjectUpdateDependencies = {
  workspaceId: string;
  project: ProjectSnapshot;
  updateProject: (patch: Partial<ProjectSnapshot>) => void;
  resetAnalysisState: () => void;
  resetBaselines: () => void;
  setActivePhase: Dispatch<SetStateAction<ProcessPhase>>;
  setActiveOutputStep: Dispatch<SetStateAction<OutputStep>>;
  clearPersistedWorkspaceState?: (workspaceId: string) => Promise<void> | void;
};

type ProjectImportDependencies = {
  workspaceId: string;
  language: ImportLanguage;
  isEnglish: boolean;
  replaceProject: (project: ProjectSnapshot) => void;
  replaceEvidenceItems: (items: EvidenceItem[]) => void;
  appendEvidenceItems: (items: EvidenceItem[]) => void;
  resetAnalysisState: () => void;
  resetBaselines: () => void;
  setProjectImportFeedback: Dispatch<SetStateAction<ImportFeedback | null>>;
};

type EvidenceImportDependencies = {
  language: ImportLanguage;
  isEnglish: boolean;
  appendEvidenceItems: (items: EvidenceItem[]) => void;
  setEvidenceImportFeedback: Dispatch<SetStateAction<ImportFeedback | null>>;
};

type ResetWorkspaceDependencies = {
  workspaceId: string;
  clearEvidence: () => void;
  resetAnalysisState: () => void;
  resetBaselines: () => void;
  resetToBlankProject: () => void;
  setProjectImportFeedback: Dispatch<SetStateAction<ImportFeedback | null>>;
  setEvidenceImportFeedback: Dispatch<SetStateAction<ImportFeedback | null>>;
  setActivePhase: Dispatch<SetStateAction<ProcessPhase>>;
  setActiveInputStep: Dispatch<SetStateAction<InputStep>>;
  setActiveOutputStep: Dispatch<SetStateAction<OutputStep>>;
};
export function shouldResetWorkspaceStateAfterProjectImport(payload: ImportedPayload) {
  return Boolean(payload.project) || payload.evidenceMode === 'replace';
}

function areProjectFieldValuesEqual(
  left: ProjectSnapshot[keyof ProjectSnapshot] | undefined,
  right: ProjectSnapshot[keyof ProjectSnapshot] | undefined,
) {
  if (Array.isArray(left) || Array.isArray(right)) {
    return JSON.stringify(left ?? []) === JSON.stringify(right ?? []);
  }

  return left === right;
}

export function shouldResetWorkspaceStateAfterProjectEdit(
  project: ProjectSnapshot,
  patch: Partial<ProjectSnapshot>,
) {
  return Object.entries(patch).some(([field, nextValue]) => {
    const currentValue = project[field as keyof ProjectSnapshot];
    return !areProjectFieldValuesEqual(
      currentValue,
      nextValue as ProjectSnapshot[keyof ProjectSnapshot] | undefined,
    );
  });
}

export function createWorkspaceNavigation(dependencies: NavigationDependencies) {
  function navigate(step: StepId) {
    startTransition(() => {
      if (isInputStep(step)) {
        dependencies.setActiveInputStep(step);
      } else {
        dependencies.setActiveOutputStep(step);
      }

      dependencies.setActivePhase(getPhaseForStep(step));
    });
  }

  function selectPhase(phase: ProcessPhase) {
    startTransition(() => {
      if (phase === 'output' && !dependencies.hasViewableAnalysis) {
        dependencies.setActivePhase('analysis');
        return;
      }

      dependencies.setActivePhase(phase);
    });
  }

  return {
    navigate,
    selectPhase,
  };
}

export function createRefreshAnalysisAction(
  dependencies: AnalysisRefreshDependencies,
) {
  return async function refreshAnalysis(
    mode: SandboxAnalysisMode,
    nextStep?: StepId,
  ) {
    if (!dependencies.canRunAnalysis) {
      return;
    }

    startTransition(() => {
      dependencies.setActivePhase('analysis');
    });

    await (
      dependencies.waitForPendingWorkspaceStateClear?.(dependencies.workspaceId) ??
      Promise.resolve()
    );

    const result = await dependencies.runAnalysis(mode);
    if (nextStep && result) {
      dependencies.navigate(nextStep);
    }
  };
}

export function createProjectUpdateAction(
  dependencies: ProjectUpdateDependencies,
) {
  return function updateProject(patch: Partial<ProjectSnapshot>) {
    if (!shouldResetWorkspaceStateAfterProjectEdit(dependencies.project, patch)) {
      dependencies.updateProject(patch);
      return;
    }

    const clearWorkspaceState =
      dependencies.clearPersistedWorkspaceState ?? clearPersistedWorkspaceState;
    clearWorkspaceState(dependencies.workspaceId);
    dependencies.resetAnalysisState();
    dependencies.resetBaselines();
    startTransition(() => {
      dependencies.setActivePhase('intake');
      dependencies.setActiveOutputStep('report');
    });
    dependencies.updateProject(patch);
  };
}

export function createProjectImportAction(
  dependencies: ProjectImportDependencies,
) {
  return async function importProjectFile(file: File) {
    try {
      const payload = await importStructuredFile(file, dependencies.language);
      const nextEvidenceItems = payload.evidenceItems ?? [];

      if (payload.project) {
        dependencies.replaceProject(payload.project);
      }

      if (payload.evidenceMode === 'replace') {
        dependencies.replaceEvidenceItems(nextEvidenceItems);
      } else if (payload.evidenceMode === 'append' && nextEvidenceItems.length > 0) {
        dependencies.appendEvidenceItems(nextEvidenceItems);
      }

      if (shouldResetWorkspaceStateAfterProjectImport(payload)) {
        clearPersistedWorkspaceState(dependencies.workspaceId);
        dependencies.resetAnalysisState();
        dependencies.resetBaselines();
      }

      dependencies.setProjectImportFeedback(
        buildProjectImportFeedback(payload, nextEvidenceItems, dependencies.isEnglish),
      );
    } catch (caughtError) {
      dependencies.setProjectImportFeedback(
        buildProjectImportErrorFeedback(caughtError, dependencies.isEnglish),
      );
    }
  };
}

export function createEvidenceImportAction(
  dependencies: EvidenceImportDependencies,
) {
  return async function importEvidenceFile(file: File) {
    try {
      const payload = await importStructuredFile(file, dependencies.language);
      const nextItems = payload.evidenceItems ?? [];

      if (nextItems.length === 0) {
        throw new Error(
          dependencies.isEnglish
            ? 'This file did not contain any evidence items to import.'
            : '这个文件里没有可导入的证据内容。',
        );
      }

      dependencies.appendEvidenceItems(nextItems);
      dependencies.setEvidenceImportFeedback(
        buildEvidenceImportFeedback(payload, nextItems, dependencies.isEnglish),
      );
    } catch (caughtError) {
      dependencies.setEvidenceImportFeedback(
        buildEvidenceImportErrorFeedback(caughtError, dependencies.isEnglish),
      );
    }
  };
}

export function createResetWorkspaceAction(
  dependencies: ResetWorkspaceDependencies,
) {
  return function resetWorkspace() {
    clearPersistedWorkspaceState(dependencies.workspaceId);

    dependencies.clearEvidence();
    clearStoredEvidence(dependencies.workspaceId);
    dependencies.resetAnalysisState();
    dependencies.resetBaselines();
    dependencies.resetToBlankProject();
    dependencies.setProjectImportFeedback(null);
    dependencies.setEvidenceImportFeedback(null);
    dependencies.setActivePhase('intake');
    dependencies.setActiveInputStep('overview');
    dependencies.setActiveOutputStep('report');
  };
}

export function createClearEvidenceOnlyAction(
  clearEvidence: () => void,
  setEvidenceImportFeedback: Dispatch<SetStateAction<ImportFeedback | null>>,
) {
  return function clearEvidenceOnly() {
    clearEvidence();
    setEvidenceImportFeedback(null);
  };
}
