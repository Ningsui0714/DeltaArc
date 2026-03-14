import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import { WorkspaceStageContent } from './WorkspaceStageContent';
import { useWorkspaceController } from './useWorkspaceController';

export function AppContent() {
  const workspace = useWorkspaceController();

  return (
    <div className="app-shell">
      <div className="app-backdrop" />

      <main className="mission-control">
        <WorkspaceHeader
          activePhase={workspace.activePhase}
          inputStep={workspace.activeInputStep}
          outputStep={workspace.activeOutputStep}
          project={workspace.project}
          evidenceCount={workspace.evidenceItems.length}
          analysis={workspace.analysis}
          hasViewableAnalysis={workspace.hasViewableAnalysis}
          isAnalysisFresh={workspace.isAnalysisFresh}
          isAnalysisStale={workspace.isAnalysisStale}
          isAnalysisDegraded={workspace.isAnalysisDegraded}
          canRunAnalysis={workspace.canRunAnalysis}
          isLoading={workspace.status === 'loading'}
          status={workspace.status}
          error={workspace.error}
          progress={workspace.progress}
          lastRequestedMode={workspace.lastRequestedAnalysisMode}
          visibleAnalysisMode={workspace.visibleAnalysisMode}
          isShowingFallbackAnalysis={workspace.isShowingFallbackAnalysis}
          baselineCount={workspace.baselines.length}
          onSelectPhase={workspace.selectPhase}
          onSelectInputStep={workspace.navigate}
          onSelectOutputStep={workspace.navigate}
        />

        <section className="workflow-shell">
          <WorkspaceStageContent workspace={workspace} />
        </section>
      </main>
    </div>
  );
}
