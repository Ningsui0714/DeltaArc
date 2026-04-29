import { isEnglishUi, useUiLanguage } from '../hooks/useUiLanguage';
import { getWorkflowStep } from '../lib/workflowSteps';
import { AnalysisWorkbenchPage } from '../pages/AnalysisWorkbenchPage';
import { IntakeStageContent } from './IntakeStageContent';
import { OutputStageContent } from './OutputStageContent';
import type { WorkspaceController } from './useWorkspaceController';

type WorkspaceStageContentProps = {
  workspace: WorkspaceController;
};

export function WorkspaceStageContent({ workspace }: WorkspaceStageContentProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const isSandboxStep = workspace.activePhase === 'output' && workspace.activeOutputStep === 'sandbox';

  if (workspace.activePhase === 'analysis') {
    return (
      <AnalysisWorkbenchPage
        project={workspace.project}
        evidenceItems={workspace.evidenceItems}
        analysis={workspace.analysis}
        progress={workspace.progress}
        hasViewableAnalysis={workspace.hasViewableAnalysis}
        isAnalysisFresh={workspace.isAnalysisFresh}
        isAnalysisStale={workspace.isAnalysisStale}
        isAnalysisDegraded={workspace.isAnalysisDegraded}
        requiresAnalysisRerun={workspace.requiresAnalysisRerun}
        lastCompletedAt={workspace.lastCompletedAt}
        error={workspace.error}
        warnings={workspace.analysis.warnings}
        isLoading={workspace.status === 'loading'}
        focusStep={workspace.hasViewableAnalysis ? workspace.activeOutputStep : workspace.activeInputStep}
        canRetryFromFailure={workspace.status === 'error' && workspace.canRetryAnalysisFromFailure}
        retryStageLabel={workspace.progress?.resumeFromStageKey ? workspace.progress.currentStageLabel : null}
        onRunQuickForecast={() => void workspace.runQuickForecast('report')}
        onRunDeepForecast={() => void workspace.runDeepForecast('report')}
        onRetryFromFailure={() => void workspace.retryAnalysisFromFailure()}
        onBackToInputs={() => workspace.selectPhase('intake')}
        onOpenOutput={(step) => workspace.navigate(step)}
      />
    );
  }

  const currentStep = getWorkflowStep(
    workspace.activePhase === 'intake' ? workspace.activeInputStep : workspace.activeOutputStep,
    language,
  );
  const outputStageTitle = isSandboxStep
    ? currentStep.label
    : isEnglish
      ? 'Strategy Outputs'
      : '策略输出';
  const outputStageEyebrow = isSandboxStep
    ? isEnglish
      ? 'Step 5'
      : '第 5 步'
    : isEnglish
      ? 'Step 4'
      : '第 4 步';
  const outputStageCopy = isSandboxStep
    ? isEnglish
      ? 'Current view: Variable Lab. This is a first-class Step 5 workflow built on top of the formal strategy result. Step 4 keeps the formal result set, while Step 5 freezes a baseline and tests one new content variable.'
      : '当前视图：变量实验。这是建立在正式策略结果之上的第 5 步核心流程。第 4 步承载策略结果，第 5 步则冻结基线并继续测试一个内容变量。'
    : isEnglish
      ? `Current view: ${currentStep.label}. Current Diagnosis, Spread Outlook, and Strategy Report are parallel views inside Step 4. Variable Lab stays visible as its own Step 5 workflow.`
      : `当前视图：${currentStep.label}。当前诊断、扩散演化、策略报告都在第 4 步里并列查看；变量实验则作为独立的第 5 步持续可见。`;

  return (
    <section className="focus-stage-panel workflow-focus-panel">
      <div className="focus-stage-header workflow-stage-header">
        <div>
          <p className="eyebrow">
            {workspace.activePhase === 'intake'
              ? isEnglish
                ? workspace.activeInputStep === 'overview'
                  ? 'Step 1'
                  : 'Step 2'
                : workspace.activeInputStep === 'overview'
                  ? '第 1 步'
                  : '第 2 步'
              : outputStageEyebrow}
          </p>
          <h2>
            {workspace.activePhase === 'intake'
              ? currentStep.label
              : outputStageTitle}
          </h2>
          <p className="focus-stage-copy">
            {workspace.activePhase === 'intake'
              ? currentStep.brief
              : outputStageCopy}
          </p>
        </div>
        <div className="chip-row workflow-stage-actions">
          {workspace.activePhase === 'intake' ? (
            <>
              <span className="meta-chip">
                {isEnglish
                  ? `${workspace.evidenceItems.length} evidence items`
                  : `${workspace.evidenceItems.length} 条证据`}
              </span>
              <button
                type="button"
                className="accent-button"
                disabled={!workspace.canRunAnalysis}
                onClick={() => workspace.selectPhase('analysis')}
              >
                {isEnglish ? 'Open Diagnosis Desk' : '进入诊断台'}
              </button>
            </>
          ) : (
            <>
              <span className={`trust-chip ${workspace.hasViewableAnalysis ? (workspace.isAnalysisFresh ? 'trust-high' : 'trust-medium') : 'trust-low'}`}>
                {workspace.hasViewableAnalysis
                  ? workspace.isAnalysisFresh
                    ? isEnglish
                      ? 'Fresh output ready'
                      : '最新结果已接入'
                    : workspace.isAnalysisDegraded
                      ? isEnglish
                        ? 'Degraded output'
                        : '降级结果已接入'
                      : isEnglish
                        ? 'Stale output'
                        : '旧结果仍可查看'
                  : isEnglish
                    ? 'Outputs locked'
                    : '结果待解锁'}
              </span>
              {workspace.activeOutputStep === 'sandbox' ? (
                <button type="button" className="accent-button" onClick={() => workspace.navigate('report')}>
                  {isEnglish ? 'Back to Strategy Report' : '回策略报告'}
                </button>
              ) : workspace.activeOutputStep !== 'report' ? (
                <button type="button" className="accent-button" onClick={() => workspace.navigate('report')}>
                  {isEnglish ? 'Back to Report' : '先回报告'}
                </button>
              ) : null}
              {!isSandboxStep && workspace.hasViewableAnalysis ? (
                <button type="button" className="ghost-button" onClick={() => workspace.navigate('sandbox')}>
                  {isEnglish ? 'Open Variable Lab' : '进入变量实验'}
                </button>
              ) : null}
              <button type="button" className="ghost-button" onClick={() => workspace.selectPhase('analysis')}>
                {isEnglish ? 'Back to Desk' : '回诊断台'}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="focus-stage-body workflow-stage-body">
        {workspace.activePhase === 'intake' ? (
          <IntakeStageContent
            activeInputStep={workspace.activeInputStep}
            project={workspace.project}
            evidenceItems={workspace.evidenceItems}
            hasViewableAnalysis={workspace.hasViewableAnalysis}
            isAnalysisFresh={workspace.isAnalysisFresh}
            isAnalysisStale={workspace.isAnalysisStale}
            isAnalysisDegraded={workspace.isAnalysisDegraded}
            evidenceImportFeedback={workspace.evidenceImportFeedback}
            projectImportFeedback={workspace.projectImportFeedback}
            addEvidenceEntries={workspace.addEvidenceEntries}
            importEvidenceFile={workspace.importEvidenceFile}
            updateProject={workspace.updateProject}
            resetWorkspace={workspace.resetWorkspace}
            clearEvidenceOnly={workspace.clearEvidenceOnly}
            importProjectFile={workspace.importProjectFile}
            navigate={workspace.navigate}
          />
        ) : (
          <OutputStageContent
            workspaceId={workspace.workspaceId}
            activeOutputStep={workspace.activeOutputStep}
            analysis={workspace.analysis}
            error={workspace.error}
            status={workspace.status}
            lastRequestedAnalysisMode={workspace.lastRequestedAnalysisMode}
            visibleAnalysisMode={workspace.visibleAnalysisMode}
            isShowingFallbackAnalysis={workspace.isShowingFallbackAnalysis}
            baselines={workspace.baselines}
            baselineStatus={workspace.baselineStatus}
            baselineError={workspace.baselineError}
            freezeLatestBaseline={workspace.freezeLatestBaseline}
            hasViewableAnalysis={workspace.hasViewableAnalysis}
            isAnalysisFresh={workspace.isAnalysisFresh}
            isAnalysisStale={workspace.isAnalysisStale}
            isAnalysisDegraded={workspace.isAnalysisDegraded}
            requiresAnalysisRerun={workspace.requiresAnalysisRerun}
            canRunAnalysis={workspace.canRunAnalysis}
            navigate={workspace.navigate}
            runQuickForecast={workspace.runQuickForecast}
            runDeepForecast={workspace.runDeepForecast}
          />
        )}
      </div>
    </section>
  );
}
