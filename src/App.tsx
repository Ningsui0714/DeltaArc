import { startTransition, useState } from 'react';
import { LeftRail } from './components/layout/LeftRail';
import { RightRail } from './components/layout/RightRail';
import { WorkspaceHeader } from './components/layout/WorkspaceHeader';
import type { ImportFeedback } from './components/import/FileImportCard';
import { useEvidence } from './hooks/useEvidence';
import { useProject } from './hooks/useProject';
import { useSandboxAnalysis } from './hooks/useSandboxAnalysis';
import { importStructuredFile } from './lib/import/importFile';
import { EvidencePage } from './pages/EvidencePage';
import { ModelingPage } from './pages/ModelingPage';
import { OverviewPage } from './pages/OverviewPage';
import { ReportPage } from './pages/ReportPage';
import { StrategyPage } from './pages/StrategyPage';
import type { StepId } from './types';
import type { SandboxAnalysisMode } from '../shared/sandbox';

function App() {
  const [activeStep, setActiveStep] = useState<StepId>('overview');
  const [lastAnalysisAt, setLastAnalysisAt] = useState('');
  const [projectImportFeedback, setProjectImportFeedback] = useState<ImportFeedback | null>(null);
  const [evidenceImportFeedback, setEvidenceImportFeedback] = useState<ImportFeedback | null>(null);
  const { project, updateProject, replaceProject, loadDemoProject, resetToBlankProject } = useProject();
  const {
    evidenceItems,
    addEvidenceEntries,
    clearEvidence,
    loadDemoEvidence,
    appendEvidenceItems,
    replaceEvidenceItems,
  } = useEvidence();
  const { analysis, progress, error, status, runAnalysis } = useSandboxAnalysis({ project, evidenceItems });

  function navigate(step: StepId) {
    startTransition(() => {
      setActiveStep(step);
    });
  }

  async function refreshAnalysis(mode: SandboxAnalysisMode, nextStep?: StepId) {
    const result = await runAnalysis(mode);
    if (result?.meta.source === 'remote' && result.meta.status === 'fresh') {
      setLastAnalysisAt(result.generatedAt);
    }
    if (nextStep && result) {
      navigate(nextStep);
    }
  }

  async function importProjectFile(file: File) {
    try {
      const payload = await importStructuredFile(file);
      const nextEvidenceItems = payload.evidenceItems ?? [];

      if (payload.project) {
        replaceProject(payload.project);
      }

      if (payload.evidenceMode === 'replace') {
        replaceEvidenceItems(nextEvidenceItems);
      } else if (payload.evidenceMode === 'append' && nextEvidenceItems.length > 0) {
        appendEvidenceItems(nextEvidenceItems);
      }

      const messages = [
        payload.project ? 'Project fields updated.' : '',
        payload.evidenceMode === 'replace'
          ? `Replaced evidence with ${nextEvidenceItems.length} items.`
          : payload.evidenceMode === 'append' && nextEvidenceItems.length > 0
            ? `Imported ${nextEvidenceItems.length} evidence items.`
            : '',
        ...payload.warnings,
      ].filter(Boolean);

      setProjectImportFeedback({
        tone: payload.warnings.length > 0 ? 'warning' : 'success',
        message: messages.join(' ') || 'File imported.',
      });
    } catch (caughtError) {
      setProjectImportFeedback({
        tone: 'error',
        message: caughtError instanceof Error ? caughtError.message : 'Project file import failed.',
      });
    }
  }

  async function importEvidenceFile(file: File) {
    try {
      const payload = await importStructuredFile(file);
      const nextItems = payload.evidenceItems ?? [];

      if (nextItems.length === 0) {
        throw new Error('This file did not contain any importable evidence.');
      }

      appendEvidenceItems(nextItems);
      setEvidenceImportFeedback({
        tone: payload.warnings.length > 0 ? 'warning' : 'success',
        message: [`Imported ${nextItems.length} evidence items.`, ...payload.warnings].join(' '),
      });
    } catch (caughtError) {
      setEvidenceImportFeedback({
        tone: 'error',
        message: caughtError instanceof Error ? caughtError.message : 'Evidence file import failed.',
      });
    }
  }

  function renderPage() {
    if (activeStep === 'overview') {
      return (
        <OverviewPage
          project={project}
          playerAcceptance={analysis.playerAcceptance}
          confidence={analysis.confidence}
          supportRatio={analysis.supportRatio}
          systemVerdict={analysis.systemVerdict}
          summary={analysis.summary}
          nextStep={analysis.nextStep}
          onProjectChange={updateProject}
          onResetProject={() => {
            resetToBlankProject();
            clearEvidence();
          }}
          onLoadDemoProject={loadDemoProject}
          onClearEvidence={clearEvidence}
          onLoadDemoEvidence={loadDemoEvidence}
          projectImportFeedback={projectImportFeedback}
          onImportProjectFile={importProjectFile}
          onNavigate={navigate}
        />
      );
    }

    if (activeStep === 'evidence') {
      return (
        <EvidencePage
          evidenceItems={evidenceItems}
          onAddEvidence={addEvidenceEntries}
          onRefreshAnalysis={() => refreshAnalysis('balanced')}
          evidenceImportFeedback={evidenceImportFeedback}
          onImportEvidenceFile={importEvidenceFile}
        />
      );
    }

    if (activeStep === 'modeling') {
      return (
        <ModelingPage
          hypotheses={analysis.hypotheses}
          personas={analysis.personas}
          scores={analysis.scores}
          perspectives={analysis.perspectives}
          blindSpots={analysis.blindSpots}
          decisionLenses={analysis.decisionLenses}
          onNavigateToStrategy={() => navigate('strategy')}
        />
      );
    }

    if (activeStep === 'strategy') {
      return (
        <StrategyPage
          strategies={analysis.strategies}
          scenarioVariants={analysis.scenarioVariants}
          secondOrderEffects={analysis.secondOrderEffects}
          validationTracks={analysis.validationTracks}
          contrarianMoves={analysis.contrarianMoves}
          unknowns={analysis.unknowns}
          onGenerateReport={() => refreshAnalysis('reasoning', 'report')}
        />
      );
    }

    return (
      <ReportPage
        report={analysis.report}
        redTeam={analysis.redTeam}
        memorySignals={analysis.memorySignals}
        pipeline={analysis.pipeline}
      />
    );
  }

  return (
    <div className="app-shell">
      <div className="app-backdrop" />
      <LeftRail activeStep={activeStep} project={project} onNavigate={navigate} />

      <main className="workspace">
        <WorkspaceHeader
          activeStep={activeStep}
          isLoading={status === 'loading'}
          progress={progress}
          onRunAnalysis={refreshAnalysis}
        />
        <RightRail
          activeStep={activeStep}
          evidenceLevel={analysis.evidenceLevel}
          lastAnalysisAt={lastAnalysisAt}
          meta={analysis.meta}
          playerAcceptance={analysis.playerAcceptance}
          primaryRisk={analysis.primaryRisk}
          nextStep={analysis.nextStep}
          model={analysis.model}
          pipeline={analysis.pipeline}
          progress={progress}
          error={error}
          warnings={analysis.warnings}
        />
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
