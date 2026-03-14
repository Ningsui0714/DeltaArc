import { ModelingPage } from '../pages/ModelingPage';
import { ReportPage } from '../pages/ReportPage';
import { StrategyPage } from '../pages/StrategyPage';
import { VariableSandboxPage } from '../pages/VariableSandboxPage';
import { OutputLockedState } from './OutputLockedState';
import { OutputStatusBanner } from './OutputStatusBanner';
import type { WorkspaceController } from './useWorkspaceController';

type OutputStageContentProps = Pick<
  WorkspaceController,
  | 'workspaceId'
  | 'activeOutputStep'
  | 'analysis'
  | 'error'
  | 'status'
  | 'lastRequestedAnalysisMode'
  | 'visibleAnalysisMode'
  | 'isShowingFallbackAnalysis'
  | 'baselines'
  | 'baselineStatus'
  | 'baselineError'
  | 'freezeLatestBaseline'
  | 'hasViewableAnalysis'
  | 'isAnalysisFresh'
  | 'isAnalysisStale'
  | 'isAnalysisDegraded'
  | 'requiresAnalysisRerun'
  | 'canRunAnalysis'
  | 'navigate'
  | 'runQuickForecast'
  | 'runDeepForecast'
>;

export function OutputStageContent({
  workspaceId,
  activeOutputStep,
  analysis,
  error,
  status,
  lastRequestedAnalysisMode,
  visibleAnalysisMode,
  isShowingFallbackAnalysis,
  baselines,
  baselineStatus,
  baselineError,
  freezeLatestBaseline,
  hasViewableAnalysis,
  isAnalysisFresh,
  isAnalysisStale,
  isAnalysisDegraded,
  requiresAnalysisRerun,
  canRunAnalysis,
  navigate,
  runQuickForecast,
  runDeepForecast,
}: OutputStageContentProps) {
  const rerunActions = {
    onRunQuickForecast: () => void runQuickForecast('report'),
    onRunDeepForecast: () => void runDeepForecast('report'),
  };

  if (activeOutputStep === 'modeling') {
    if (!hasViewableAnalysis) {
      return (
        <OutputLockedState
          step="modeling"
          canRunAnalysis={canRunAnalysis}
          {...rerunActions}
        />
      );
    }

    return (
      <>
        <OutputStatusBanner
          error={error}
          status={status}
          lastRequestedAnalysisMode={lastRequestedAnalysisMode}
          visibleAnalysisMode={visibleAnalysisMode}
          isShowingFallbackAnalysis={isShowingFallbackAnalysis}
          hasViewableAnalysis={hasViewableAnalysis}
          isAnalysisStale={isAnalysisStale}
          isAnalysisDegraded={isAnalysisDegraded}
          canRunAnalysis={canRunAnalysis}
          {...rerunActions}
        />
        <ModelingPage
          hypotheses={analysis.hypotheses}
          personas={analysis.personas}
          scores={analysis.scores}
          perspectives={analysis.perspectives}
          blindSpots={analysis.blindSpots}
          decisionLenses={analysis.decisionLenses}
          onNavigateToStrategy={() => navigate('strategy')}
        />
      </>
    );
  }

  if (activeOutputStep === 'strategy') {
    if (!hasViewableAnalysis) {
      return (
        <OutputLockedState
          step="strategy"
          canRunAnalysis={canRunAnalysis}
          {...rerunActions}
        />
      );
    }

    return (
      <>
        <OutputStatusBanner
          error={error}
          status={status}
          lastRequestedAnalysisMode={lastRequestedAnalysisMode}
          visibleAnalysisMode={visibleAnalysisMode}
          isShowingFallbackAnalysis={isShowingFallbackAnalysis}
          hasViewableAnalysis={hasViewableAnalysis}
          isAnalysisStale={isAnalysisStale}
          isAnalysisDegraded={isAnalysisDegraded}
          canRunAnalysis={canRunAnalysis}
          {...rerunActions}
        />
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
          canGenerateReport={canRunAnalysis}
          onGenerateReport={() => void runDeepForecast('report')}
        />
      </>
    );
  }

  if (activeOutputStep === 'sandbox') {
    if (!hasViewableAnalysis) {
      return (
        <OutputLockedState
          step="sandbox"
          canRunAnalysis={canRunAnalysis}
          {...rerunActions}
        />
      );
    }

    return (
      <>
        <OutputStatusBanner
          error={error}
          status={status}
          lastRequestedAnalysisMode={lastRequestedAnalysisMode}
          visibleAnalysisMode={visibleAnalysisMode}
          isShowingFallbackAnalysis={isShowingFallbackAnalysis}
          hasViewableAnalysis={hasViewableAnalysis}
          isAnalysisStale={isAnalysisStale}
          isAnalysisDegraded={isAnalysisDegraded}
          canRunAnalysis={canRunAnalysis}
          {...rerunActions}
        />
        <VariableSandboxPage
          workspaceId={workspaceId}
          report={analysis.report}
          baselines={baselines}
          baselineStatus={baselineStatus}
          baselineError={baselineError}
          canFreezeBaseline={isAnalysisFresh && !requiresAnalysisRerun}
          onFreezeBaseline={() => void freezeLatestBaseline()}
          onBackToReport={() => navigate('report')}
        />
      </>
    );
  }

  if (!hasViewableAnalysis) {
    return (
      <OutputLockedState
        step="report"
        canRunAnalysis={canRunAnalysis}
        {...rerunActions}
      />
    );
  }

  return (
    <>
      <OutputStatusBanner
        error={error}
        status={status}
        lastRequestedAnalysisMode={lastRequestedAnalysisMode}
        visibleAnalysisMode={visibleAnalysisMode}
        isShowingFallbackAnalysis={isShowingFallbackAnalysis}
        hasViewableAnalysis={hasViewableAnalysis}
        isAnalysisStale={isAnalysisStale}
        isAnalysisDegraded={isAnalysisDegraded}
        canRunAnalysis={canRunAnalysis}
        {...rerunActions}
      />
      <ReportPage
        report={analysis.report}
        redTeam={analysis.redTeam}
        memorySignals={analysis.memorySignals}
        futureTimeline={analysis.futureTimeline}
        trajectorySignals={analysis.trajectorySignals}
        pipeline={analysis.pipeline}
        analysisMeta={analysis.meta}
        analysisMode={analysis.mode}
        onOpenSandbox={() => navigate('sandbox')}
      />
    </>
  );
}
