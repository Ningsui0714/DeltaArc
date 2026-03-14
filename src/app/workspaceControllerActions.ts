import { startTransition } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { SandboxAnalysisMode } from '../../shared/sandbox';
import type { EvidenceItem, ProjectSnapshot, StepId } from '../types';
import { clearSandboxWorkspace } from '../api/sandbox';
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

type ImportLanguage = Parameters<typeof importStructuredFile>[1];

type NavigationDependencies = {
  hasViewableAnalysis: boolean;
  setActivePhase: Dispatch<SetStateAction<ProcessPhase>>;
  setActiveInputStep: Dispatch<SetStateAction<InputStep>>;
  setActiveOutputStep: Dispatch<SetStateAction<OutputStep>>;
};

type AnalysisRefreshDependencies = {
  canRunAnalysis: boolean;
  setActivePhase: Dispatch<SetStateAction<ProcessPhase>>;
  runAnalysis: (mode: SandboxAnalysisMode) => Promise<unknown>;
  navigate: (step: StepId) => void;
};

type ProjectImportDependencies = {
  language: ImportLanguage;
  isEnglish: boolean;
  replaceProject: (project: ProjectSnapshot) => void;
  replaceEvidenceItems: (items: EvidenceItem[]) => void;
  appendEvidenceItems: (items: EvidenceItem[]) => void;
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

function buildProjectImportFeedback(
  payload: ImportedPayload,
  nextEvidenceItems: EvidenceItem[],
  isEnglish: boolean,
): ImportFeedback {
  const messages = [
    payload.project ? (isEnglish ? 'Project fields were updated.' : '项目字段已更新。') : '',
    payload.evidenceMode === 'replace'
      ? isEnglish
        ? `Evidence was replaced with ${nextEvidenceItems.length} items.`
        : `证据已替换为 ${nextEvidenceItems.length} 条。`
      : payload.evidenceMode === 'append' && nextEvidenceItems.length > 0
        ? isEnglish
          ? `${nextEvidenceItems.length} evidence items were appended.`
          : `已追加 ${nextEvidenceItems.length} 条证据。`
        : '',
    ...payload.warnings,
  ].filter(Boolean);

  return {
    tone: payload.warnings.length > 0 ? 'warning' : 'success',
    message: messages.join(' ') || (isEnglish ? 'File imported.' : '文件已导入。'),
  };
}

function buildProjectImportErrorFeedback(
  error: unknown,
  isEnglish: boolean,
): ImportFeedback {
  return {
    tone: 'error',
    message:
      error instanceof Error
        ? error.message
        : isEnglish
          ? 'Project file import failed.'
          : '项目文件导入失败。',
  };
}

function buildEvidenceImportFeedback(
  payload: ImportedPayload,
  nextItems: EvidenceItem[],
  isEnglish: boolean,
): ImportFeedback {
  return {
    tone: payload.warnings.length > 0 ? 'warning' : 'success',
    message: [
      isEnglish
        ? `Imported ${nextItems.length} evidence items.`
        : `已导入 ${nextItems.length} 条证据。`,
      ...payload.warnings,
    ].join(' '),
  };
}

function buildEvidenceImportErrorFeedback(
  error: unknown,
  isEnglish: boolean,
): ImportFeedback {
  return {
    tone: 'error',
    message:
      error instanceof Error
        ? error.message
        : isEnglish
          ? 'Evidence file import failed.'
          : '证据文件导入失败。',
  };
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

    const result = await dependencies.runAnalysis(mode);
    if (nextStep && result) {
      dependencies.navigate(nextStep);
    }
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
    void clearSandboxWorkspace(dependencies.workspaceId).catch((caughtError) => {
      console.warn(
        '[sandbox] clearing persisted workspace failed',
        caughtError instanceof Error ? caughtError.message : caughtError,
      );
    });

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
