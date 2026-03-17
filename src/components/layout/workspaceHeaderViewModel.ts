import {
  getJobProgressStats,
  isAnalysisJobActive,
  isAnalysisJobFailed,
} from '../../lib/jobProgress';
import { trimCopy } from '../../lib/trimCopy';
import { isEnglishUi } from '../../hooks/useUiLanguage';
import { buildWorkspaceHeaderCopy } from './workspaceHeaderCopy';
import { buildJourneySteps, getOutputStateLabel } from './workspaceHeaderJourney';
import type { WorkspaceHeaderViewModelParams } from './workspaceHeaderTypes';

export type {
  WorkspaceHeaderViewModelParams,
  WorkspaceJourneyStep,
  WorkspaceJourneyStepId,
} from './workspaceHeaderTypes';

export function buildWorkspaceHeaderViewModel(
  params: WorkspaceHeaderViewModelParams,
) {
  const {
    hasViewableAnalysis,
    isAnalysisDegraded,
    isAnalysisFresh,
    isLoading,
    language,
    progress,
    project,
    status,
  } = params;
  const isEnglish = isEnglishUi(language);
  const progressStats = progress ? getJobProgressStats(progress) : null;
  const isRunActive = isAnalysisJobActive(progress);
  const hasRunError = isAnalysisJobFailed(progress);
  const copy = buildWorkspaceHeaderCopy({
    ...params,
    hasRunError,
    isRunActive,
    progressStats,
  });

  return {
    ...copy,
    outputStateLabel: getOutputStateLabel(
      hasViewableAnalysis,
      isAnalysisFresh,
      isAnalysisDegraded,
      language,
    ),
    progressStats,
    projectTitle: trimCopy(
      project.name,
      isEnglish ? 'Untitled Forecast Task' : '未命名预测任务',
    ),
    runStateLabel:
      isRunActive && progressStats
        ? `${progressStats.percent}%`
        : hasRunError
          ? progress?.retryable
            ? isEnglish
              ? 'Resume'
              : '可续跑'
            : isEnglish
              ? 'Failed'
              : '失败'
          : status === 'error'
            ? isEnglish
              ? 'Error'
              : '异常'
            : isLoading
              ? isEnglish
                ? 'Starting'
                : '启动中'
              : isEnglish
                ? 'Idle'
                : '空闲',
    journeySteps: buildJourneySteps(params),
  };
}
