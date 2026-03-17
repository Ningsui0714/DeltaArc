import { getAnalysisModeLabel } from '../../lib/analysisModeLabels';
import { getWorkflowStep } from '../../lib/workflowSteps';
import { isEnglishUi } from '../../hooks/useUiLanguage';
import {
  formatJobDuration,
  getJobProgressStats,
} from '../../lib/jobProgress';
import { trimCopy } from '../../lib/trimCopy';
import type { WorkspaceHeaderViewModelParams, WorkspaceJourneyStepId } from './workspaceHeaderTypes';

type ProgressStats = ReturnType<typeof getJobProgressStats>;

export function buildWorkspaceHeaderCopy(
  params: Pick<
    WorkspaceHeaderViewModelParams,
    | 'activePhase'
    | 'analysis'
    | 'canRunAnalysis'
    | 'error'
    | 'hasViewableAnalysis'
    | 'inputStep'
    | 'isAnalysisDegraded'
    | 'isAnalysisFresh'
    | 'isShowingFallbackAnalysis'
    | 'language'
    | 'lastRequestedMode'
    | 'outputStep'
    | 'progress'
    | 'project'
    | 'visibleAnalysisMode'
  > & {
    hasRunError: boolean;
    isRunActive: boolean;
    progressStats: ProgressStats | null;
  },
) {
  const {
    activePhase,
    analysis,
    canRunAnalysis,
    error,
    hasRunError,
    hasViewableAnalysis,
    inputStep,
    isAnalysisDegraded,
    isAnalysisFresh,
    isRunActive,
    isShowingFallbackAnalysis,
    language,
    lastRequestedMode,
    outputStep,
    progress,
    progressStats,
    project,
    visibleAnalysisMode,
  } = params;
  const isEnglish = isEnglishUi(language);
  const visibleModeLabel =
    hasViewableAnalysis && visibleAnalysisMode
      ? getAnalysisModeLabel(visibleAnalysisMode, language)
      : isEnglish
        ? 'Locked'
        : '未解锁';
  const requestedModeLabel = lastRequestedMode
    ? getAnalysisModeLabel(lastRequestedMode, language)
    : null;
  const isShowingDifferentModeFallback =
    Boolean(requestedModeLabel) &&
    hasViewableAnalysis &&
    isShowingFallbackAnalysis &&
    lastRequestedMode !== visibleAnalysisMode;
  const activeStep = activePhase === 'output' ? outputStep : inputStep;
  const currentStep = getWorkflowStep(activeStep, language);
  const activeJourneyStep: WorkspaceJourneyStepId =
    activePhase === 'analysis'
      ? 'analysis'
      : activePhase === 'output'
        ? outputStep === 'sandbox'
          ? 'sandbox'
          : 'results'
        : inputStep;
  const currentGoalTitle =
    activePhase === 'analysis'
      ? isEnglish
        ? 'Step 3 · Inference'
        : '第3步·正式推演'
      : activePhase === 'output'
        ? outputStep === 'sandbox'
          ? isEnglish
            ? 'Step 5 · Sandbox'
            : '第5步·变量推演'
          : isEnglish
            ? 'Step 4 · Results'
            : '第4步·正式结果'
        : inputStep === 'overview'
          ? isEnglish
            ? 'Step 1 · Setup'
            : '第1步·项目设定'
          : isEnglish
            ? 'Step 2 · Evidence'
            : '第2步·证据信号';
  const headline =
    activePhase === 'analysis'
      ? isRunActive || hasRunError
        ? progress?.message ?? (isEnglish ? 'Formal inference is running.' : '正式推演进行中。')
        : hasViewableAnalysis
          ? isAnalysisFresh
            ? trimCopy(
                analysis.report.headline || analysis.systemVerdict,
                isEnglish ? 'Formal inference is ready.' : '正式推演已完成。',
              )
            : isAnalysisDegraded
              ? isEnglish
                ? 'A stabilized formal output is preserved'
                : '已保留一份经过回退稳定的正式结果'
              : isEnglish
                ? 'Previous formal output is still viewable'
                : '上一份正式结果仍可继续查看'
          : isEnglish
            ? 'Formal inference has not started yet.'
            : '正式推演还没开始。'
      : activePhase === 'output'
        ? hasViewableAnalysis
          ? outputStep === 'sandbox'
            ? isEnglish
              ? 'Use the formal result as the launch point for a new variable test.'
              : '用正式结果作为起点，继续试一个新变量。'
            : trimCopy(analysis.report.headline || analysis.systemVerdict, currentStep.brief)
          : currentStep.brief
        : trimCopy(project.ideaSummary, currentStep.brief);
  const statusLine =
    activePhase === 'analysis'
      ? isRunActive && progressStats
        ? isEnglish
          ? `${progressStats.completedStageCount}/${progressStats.actionableStageCount} done · ${formatJobDuration(progressStats.elapsedMs, language)}`
          : `已完成 ${progressStats.completedStageCount}/${progressStats.actionableStageCount} · ${formatJobDuration(progressStats.elapsedMs, language)}`
        : isShowingFallbackAnalysis && hasViewableAnalysis && requestedModeLabel
          ? isShowingDifferentModeFallback
            ? isEnglish
              ? `Latest ${requestedModeLabel} failed. Showing previous ${visibleModeLabel}.`
              : `最近一次${requestedModeLabel}失败，当前仍显示上一份${visibleModeLabel}。`
            : isEnglish
              ? `Latest ${requestedModeLabel} failed. Showing last ${visibleModeLabel}.`
              : `最近一次${requestedModeLabel}失败，当前仍显示上一份${visibleModeLabel}结果。`
          : hasRunError
            ? progress?.retryable
              ? isEnglish
                ? 'Latest run failed. Resume is available.'
                : '最近一次运行失败，可从失败阶段继续。'
              : isEnglish
                ? 'Latest run failed. Start a new run.'
                : '最近一次运行失败，请重新发起。'
            : hasViewableAnalysis
              ? isEnglish
                ? 'Formal inference is complete.'
                : '正式推演已完成。'
              : canRunAnalysis
                ? isEnglish
                  ? 'The minimum gate is ready.'
                  : '门槛已达标，可以开始运行。'
                : isEnglish
                  ? 'Finish 4/4 setup and 3 evidence first.'
                  : '先补齐 4/4 设定和 3 条证据。'
      : activePhase === 'intake'
        ? hasViewableAnalysis
          ? isEnglish
            ? 'A formal result already exists.'
            : '当前已经有正式结果。'
          : isEnglish
            ? 'Start with project setup and evidence.'
            : '先整理项目和证据。'
        : isShowingFallbackAnalysis && hasViewableAnalysis && requestedModeLabel
          ? isShowingDifferentModeFallback
            ? isEnglish
              ? `Latest ${requestedModeLabel} failed. Showing previous ${visibleModeLabel}.`
              : `最近一次${requestedModeLabel}失败，当前仍显示上一份${visibleModeLabel}。`
            : isEnglish
              ? `Latest ${requestedModeLabel} failed. Showing last ${visibleModeLabel}.`
              : `最近一次${requestedModeLabel}失败，当前仍显示上一份${visibleModeLabel}结果。`
          : hasViewableAnalysis
            ? outputStep === 'sandbox'
              ? isAnalysisFresh
                ? isEnglish
                  ? 'You are in Step 5: Variable Sandbox.'
                  : '你现在在第5步：变量推演。'
                : isAnalysisDegraded
                  ? isEnglish
                    ? 'You are in Step 5. The source result used fallback handling.'
                    : '你现在在第5步，依赖结果触发过回退。'
                  : isEnglish
                    ? 'You are in Step 5. The source result is stale.'
                    : '你现在在第5步，依赖结果已经过期。'
              : isAnalysisFresh
                ? isEnglish
                  ? `You are in Step 4. View: ${currentStep.label}.`
                  : `你现在在第4步。当前视图：${currentStep.label}。`
                : isAnalysisDegraded
                  ? isEnglish
                    ? `You are in Step 4. View: ${currentStep.label}. Rerun recommended.`
                    : `你现在在第4步。当前视图：${currentStep.label}，建议重跑。`
                  : isEnglish
                    ? `You are in Step 4. View: ${currentStep.label}. Output is stale.`
                    : `你现在在第4步。当前视图：${currentStep.label}，结果已过期。`
            : isEnglish
              ? `Run formal inference first. Step ${outputStep === 'sandbox' ? '5' : '4'} is still locked.`
              : `先完成正式推演，第${outputStep === 'sandbox' ? '5' : '4'}步才会解锁。`;

  return {
    activeJourneyStep,
    currentGoalTitle,
    headline,
    requestedModeLabel,
    showObjectiveError: Boolean(isShowingFallbackAnalysis && error),
    statusLine,
    visibleModeLabel,
  };
}
