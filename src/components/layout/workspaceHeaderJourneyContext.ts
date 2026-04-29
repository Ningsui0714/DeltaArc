import { isEnglishUi } from '../../hooks/useUiLanguage';
import {
  getJobProgressStats,
  isAnalysisJobActive,
  isAnalysisJobFailed,
} from '../../lib/jobProgress';
import { getProjectReadiness } from '../../lib/projectReadiness';
import type { WorkspaceHeaderViewModelParams } from './workspaceHeaderTypes';

export type WorkspaceHeaderJourneyParams = Pick<
  WorkspaceHeaderViewModelParams,
  | 'activePhase'
  | 'analysis'
  | 'baselineCount'
  | 'canRunAnalysis'
  | 'evidenceCount'
  | 'hasViewableAnalysis'
  | 'inputStep'
  | 'isAnalysisDegraded'
  | 'isAnalysisFresh'
  | 'isAnalysisStale'
  | 'language'
  | 'onSelectInputStep'
  | 'onSelectOutputStep'
  | 'onSelectPhase'
  | 'outputStep'
  | 'progress'
  | 'project'
>;

export type WorkspaceHeaderJourneyContext = WorkspaceHeaderJourneyParams & {
  currentViewLabel: string;
  hasRunError: boolean;
  isEnglish: boolean;
  isRunActive: boolean;
  progressStats: ReturnType<typeof getJobProgressStats> | null;
  readiness: ReturnType<typeof getProjectReadiness>;
};

function getCurrentViewLabel(params: WorkspaceHeaderJourneyParams) {
  const { activePhase, inputStep, language, outputStep } = params;
  const isEnglish = isEnglishUi(language);

  if (activePhase === 'output' && outputStep !== 'sandbox') {
    if (outputStep === 'report') {
      return isEnglish ? 'Strategy Report' : '策略报告';
    }

    if (outputStep === 'modeling') {
      return isEnglish ? 'Current Diagnosis' : '当前诊断';
    }

    return isEnglish ? 'Spread Outlook' : '扩散演化';
  }

  return inputStep === 'overview'
    ? isEnglish
      ? 'Campaign Brief'
      : '传播任务'
    : isEnglish
      ? 'Evidence Signals'
      : '证据信号';
}

export function createWorkspaceHeaderJourneyContext(
  params: WorkspaceHeaderJourneyParams,
): WorkspaceHeaderJourneyContext {
  const progressStats = params.progress ? getJobProgressStats(params.progress) : null;

  return {
    ...params,
    currentViewLabel: getCurrentViewLabel(params),
    hasRunError: isAnalysisJobFailed(params.progress),
    isEnglish: isEnglishUi(params.language),
    isRunActive: isAnalysisJobActive(params.progress),
    progressStats,
    readiness: getProjectReadiness(params.project, params.evidenceCount),
  };
}
