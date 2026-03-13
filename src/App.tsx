import { startTransition, useState } from 'react';
import type { SandboxAnalysisMode } from '../shared/sandbox';
import { AnalysisStatePanel } from './components/analysis/AnalysisStatePanel';
import { WorkspaceHeader } from './components/layout/WorkspaceHeader';
import type { ImportFeedback } from './components/import/FileImportCard';
import { useEvidence } from './hooks/useEvidence';
import { useProject } from './hooks/useProject';
import { UiLanguageProvider, isEnglishUi, useUiLanguage } from './hooks/useUiLanguage';
import { useSandboxAnalysis } from './hooks/useSandboxAnalysis';
import {
  getPhaseForStep,
  isInputStep,
  type InputStep,
  type OutputStep,
  type ProcessPhase,
} from './lib/processPhases';
import { importStructuredFile } from './lib/import/importFile';
import { getWorkflowStep } from './lib/workflowSteps';
import { AnalysisWorkbenchPage } from './pages/AnalysisWorkbenchPage';
import { EvidencePage } from './pages/EvidencePage';
import { ModelingPage } from './pages/ModelingPage';
import { OverviewPage } from './pages/OverviewPage';
import { ReportPage } from './pages/ReportPage';
import { StrategyPage } from './pages/StrategyPage';
import type { StepId } from './types';

function AppContent() {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const [activePhase, setActivePhase] = useState<ProcessPhase>('intake');
  const [activeInputStep, setActiveInputStep] = useState<InputStep>('overview');
  const [activeOutputStep, setActiveOutputStep] = useState<OutputStep>('modeling');
  const [projectImportFeedback, setProjectImportFeedback] = useState<ImportFeedback | null>(null);
  const [evidenceImportFeedback, setEvidenceImportFeedback] = useState<ImportFeedback | null>(null);
  const { project, updateProject, replaceProject, resetToBlankProject } = useProject();
  const { evidenceItems, addEvidenceEntries, clearEvidence, appendEvidenceItems, replaceEvidenceItems } =
    useEvidence();
  const { analysis, progress, error, status, runAnalysis } = useSandboxAnalysis({ project, evidenceItems });
  const hasOfficialAnalysis = analysis.meta.source === 'remote';
  const hasFreshAnalysis = hasOfficialAnalysis && analysis.meta.status === 'fresh';
  const lastAnalysisAt = hasFreshAnalysis ? analysis.generatedAt : '';

  function navigate(step: StepId) {
    startTransition(() => {
      if (isInputStep(step)) {
        setActiveInputStep(step);
      } else {
        setActiveOutputStep(step);
      }

      setActivePhase(getPhaseForStep(step));
    });
  }

  function selectPhase(phase: ProcessPhase) {
    startTransition(() => {
      if (phase === 'output' && !hasOfficialAnalysis) {
        setActivePhase('analysis');
        return;
      }

      setActivePhase(phase);
    });
  }

  async function refreshAnalysis(mode: SandboxAnalysisMode, nextStep?: StepId) {
    startTransition(() => {
      setActivePhase('analysis');
    });

    const result = await runAnalysis(mode);
    if (nextStep && result) {
      navigate(nextStep);
    }
  }

  async function importProjectFile(file: File) {
    try {
      const payload = await importStructuredFile(file, language);
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

      setProjectImportFeedback({
        tone: payload.warnings.length > 0 ? 'warning' : 'success',
        message: messages.join(' ') || (isEnglish ? 'File imported.' : '文件已导入。'),
      });
    } catch (caughtError) {
      setProjectImportFeedback({
        tone: 'error',
        message: caughtError instanceof Error ? caughtError.message : isEnglish ? 'Project file import failed.' : '项目文件导入失败。',
      });
    }
  }

  async function importEvidenceFile(file: File) {
    try {
      const payload = await importStructuredFile(file, language);
      const nextItems = payload.evidenceItems ?? [];

      if (nextItems.length === 0) {
        throw new Error(isEnglish ? 'This file did not contain any evidence items to import.' : '这个文件里没有可导入的证据内容。');
      }

      appendEvidenceItems(nextItems);
      setEvidenceImportFeedback({
        tone: payload.warnings.length > 0 ? 'warning' : 'success',
        message: [
          isEnglish ? `Imported ${nextItems.length} evidence items.` : `已导入 ${nextItems.length} 条证据。`,
          ...payload.warnings,
        ].join(' '),
      });
    } catch (caughtError) {
      setEvidenceImportFeedback({
        tone: 'error',
        message: caughtError instanceof Error ? caughtError.message : isEnglish ? 'Evidence file import failed.' : '证据文件导入失败。',
      });
    }
  }

  function resetWorkspace() {
    resetToBlankProject();
    clearEvidence();
    setProjectImportFeedback(null);
    setEvidenceImportFeedback(null);
    setActivePhase('intake');
    setActiveInputStep('overview');
    setActiveOutputStep('modeling');
  }

  function clearEvidenceOnly() {
    clearEvidence();
    setEvidenceImportFeedback(null);
  }

  function renderIntakePage() {
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
        hasCompletedAnalysis={hasOfficialAnalysis}
        playerAcceptance={analysis.playerAcceptance}
        confidence={analysis.confidence}
        supportRatio={analysis.supportRatio}
        systemVerdict={analysis.systemVerdict}
        summary={analysis.summary}
        nextStep={analysis.nextStep}
        onProjectChange={updateProject}
        onResetProject={resetWorkspace}
        onClearEvidence={clearEvidenceOnly}
        projectImportFeedback={projectImportFeedback}
        onImportProjectFile={importProjectFile}
        onNavigate={navigate}
      />
    );
  }

  function renderOutputPage() {
    if (activeOutputStep === 'modeling') {
      if (!hasOfficialAnalysis) {
        return (
          <AnalysisStatePanel
            title={isEnglish ? 'Run the inference desk before reviewing the current model.' : '先去推理台生成正式判断，再看当前建模'}
            description={
              isEnglish
                ? 'The output area only shows content from the formal backend run. Switch to the Inference Desk and run Quick Scan or Deep Dive first.'
                : '结果区只展示正式后端分析后的内容。现在请先切到“推理台”运行快速扫描或深度推演。'
            }
            trustNote={
              isEnglish
                ? 'Inputs, inference, and outputs are now separated. Until a formal run completes, nothing here will pretend to be a conclusion.'
                : '输入、推理、输出现在已经拆开。没有正式运行前，这里不会先长出看起来像结论的文案。'
            }
            onRunQuickForecast={() => void refreshAnalysis('balanced', 'modeling')}
            onRunDeepForecast={() => void refreshAnalysis('reasoning', 'modeling')}
          />
        );
      }

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

    if (activeOutputStep === 'strategy') {
      if (!hasOfficialAnalysis) {
        return (
          <AnalysisStatePanel
            title={isEnglish ? 'Run the inference desk before reviewing future evolution.' : '先去推理台生成正式预测，再看未来演化'}
            description={
              isEnglish
                ? 'Future beats, community rhythms, and inflection signals only come from the formal backend result, not from the intake pages.'
                : '未来时间线、社区节奏和转折信号都来自正式后端结果，不再和输入页混在一起。'
            }
            trustNote={
              isEnglish
                ? 'If the formal run has not started yet, go to the Inference Desk first. That is the only place where the full process runs.'
                : '如果还没跑正式推理，请先切到“推理台”。那里才是运行和观察全过程的地方。'
            }
            onRunQuickForecast={() => void refreshAnalysis('balanced', 'strategy')}
            onRunDeepForecast={() => void refreshAnalysis('reasoning', 'strategy')}
          />
        );
      }

      return (
        <StrategyPage
          strategies={analysis.strategies}
          scenarioVariants={analysis.scenarioVariants}
          secondOrderEffects={analysis.secondOrderEffects}
          futureTimeline={analysis.futureTimeline}
          communityRhythms={analysis.communityRhythms}
          trajectorySignals={analysis.trajectorySignals}
          validationTracks={analysis.validationTracks}
          contrarianMoves={analysis.contrarianMoves}
          unknowns={analysis.unknowns}
          onGenerateReport={() => refreshAnalysis('reasoning', 'report')}
        />
      );
    }

    if (!hasOfficialAnalysis) {
      return (
        <AnalysisStatePanel
          title={isEnglish ? 'Run the inference desk before opening the forecast report.' : '先去推理台生成正式预测报告'}
          description={
            isEnglish
              ? 'The report area only shows conclusions, timelines, trajectory signals, and actions after the formal run is complete.'
              : '报告区只展示正式分析完成后的结论、时间线、走势信号和行动建议。'
          }
          trustNote={
            isEnglish
              ? 'Without the remote analysis pipeline, this area will not show anything that looks like a conclusion.'
              : '如果没有触发远端分析链路，这里不会再提前展示任何看起来像结论的内容。'
          }
          onRunQuickForecast={() => void refreshAnalysis('balanced', 'report')}
          onRunDeepForecast={() => void refreshAnalysis('reasoning', 'report')}
        />
      );
    }

    return (
      <ReportPage
        report={analysis.report}
        redTeam={analysis.redTeam}
        memorySignals={analysis.memorySignals}
        futureTimeline={analysis.futureTimeline}
        trajectorySignals={analysis.trajectorySignals}
        pipeline={analysis.pipeline}
      />
    );
  }

  function renderPhaseShell() {
    if (activePhase === 'analysis') {
      return (
        <AnalysisWorkbenchPage
          project={project}
          evidenceItems={evidenceItems}
          analysis={analysis}
          progress={progress}
          hasOfficialAnalysis={hasOfficialAnalysis}
          lastAnalysisAt={lastAnalysisAt}
          error={error}
          warnings={analysis.warnings}
          isLoading={status === 'loading'}
          focusStep={hasOfficialAnalysis ? activeOutputStep : activeInputStep}
          onRunQuickForecast={() => void refreshAnalysis('balanced', 'modeling')}
          onRunDeepForecast={() => void refreshAnalysis('reasoning', 'report')}
          onBackToInputs={() => selectPhase('intake')}
          onOpenOutput={(step) => navigate(step)}
        />
      );
    }

    const currentStep = getWorkflowStep(activePhase === 'intake' ? activeInputStep : activeOutputStep, language);

    return (
      <section className="focus-stage-panel workflow-focus-panel">
        <div className="focus-stage-header workflow-stage-header">
          <div>
            <p className="eyebrow">{activePhase === 'intake' ? (isEnglish ? 'Intake Phase' : '输入阶段') : isEnglish ? 'Output Phase' : '结果阶段'}</p>
            <h2>{currentStep.label}</h2>
            <p className="focus-stage-copy">{currentStep.brief}</p>
          </div>
          <div className="chip-row workflow-stage-actions">
            {activePhase === 'intake' ? (
              <>
                <span className="meta-chip">{isEnglish ? `${evidenceItems.length} evidence items` : `${evidenceItems.length} 条证据`}</span>
                <button type="button" className="accent-button" onClick={() => selectPhase('analysis')}>
                  {isEnglish ? 'Open Inference Desk' : '进入推理台'}
                </button>
              </>
            ) : (
              <>
                <span className={`trust-chip ${hasOfficialAnalysis ? 'trust-high' : 'trust-low'}`}>
                  {hasOfficialAnalysis ? (isEnglish ? 'Formal output ready' : '正式结果已接入') : isEnglish ? 'Outputs locked' : '结果待解锁'}
                </span>
                <button type="button" className="ghost-button" onClick={() => selectPhase('analysis')}>
                  {isEnglish ? 'Back to Desk' : '回推理台'}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="focus-stage-body workflow-stage-body">
          {activePhase === 'intake' ? renderIntakePage() : renderOutputPage()}
        </div>
      </section>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-backdrop" />

      <main className="mission-control">
        <WorkspaceHeader
          activePhase={activePhase}
          inputStep={activeInputStep}
          outputStep={activeOutputStep}
          project={project}
          evidenceCount={evidenceItems.length}
          analysis={analysis}
          hasOfficialAnalysis={hasOfficialAnalysis}
          isLoading={status === 'loading'}
          progress={progress}
          onSelectPhase={selectPhase}
          onSelectInputStep={(step) => navigate(step)}
          onSelectOutputStep={(step) => navigate(step)}
        />

        <section className="workflow-shell">{renderPhaseShell()}</section>
      </main>
    </div>
  );
}

function App() {
  return (
    <UiLanguageProvider>
      <AppContent />
    </UiLanguageProvider>
  );
}

export default App;
