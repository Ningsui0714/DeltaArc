import { EvidencePage } from '../pages/EvidencePage';
import { OverviewPage } from '../pages/OverviewPage';
import type { WorkspaceController } from './useWorkspaceController';

type IntakeStageContentProps = Pick<
  WorkspaceController,
  | 'activeInputStep'
  | 'project'
  | 'evidenceItems'
  | 'hasViewableAnalysis'
  | 'isAnalysisFresh'
  | 'isAnalysisStale'
  | 'isAnalysisDegraded'
  | 'evidenceImportFeedback'
  | 'projectImportFeedback'
  | 'addEvidenceEntries'
  | 'importEvidenceFile'
  | 'updateProject'
  | 'resetWorkspace'
  | 'clearEvidenceOnly'
  | 'importProjectFile'
  | 'navigate'
>;

export function IntakeStageContent({
  activeInputStep,
  project,
  evidenceItems,
  hasViewableAnalysis,
  isAnalysisFresh,
  isAnalysisStale,
  isAnalysisDegraded,
  evidenceImportFeedback,
  projectImportFeedback,
  addEvidenceEntries,
  importEvidenceFile,
  updateProject,
  resetWorkspace,
  clearEvidenceOnly,
  importProjectFile,
  navigate,
}: IntakeStageContentProps) {
  if (activeInputStep === 'evidence') {
    return (
      <EvidencePage
        evidenceItems={evidenceItems}
        onAddEvidence={addEvidenceEntries}
        evidenceImportFeedback={evidenceImportFeedback}
        onImportEvidenceFile={importEvidenceFile}
        onNavigate={navigate}
      />
    );
  }

  return (
    <OverviewPage
      project={project}
      evidenceCount={evidenceItems.length}
      hasViewableAnalysis={hasViewableAnalysis}
      isAnalysisFresh={isAnalysisFresh}
      isAnalysisStale={isAnalysisStale}
      isAnalysisDegraded={isAnalysisDegraded}
      onProjectChange={updateProject}
      onResetProject={resetWorkspace}
      onClearEvidence={clearEvidenceOnly}
      projectImportFeedback={projectImportFeedback}
      onImportProjectFile={importProjectFile}
      onNavigate={navigate}
    />
  );
}
