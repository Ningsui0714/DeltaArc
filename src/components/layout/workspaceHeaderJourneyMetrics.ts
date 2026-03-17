import type { WorkspaceHeaderJourneyContext } from './workspaceHeaderJourneyContext';

export function getOverviewStepMetric(context: WorkspaceHeaderJourneyContext) {
  return `${context.readiness.setupFieldCount}/4`;
}

export function getEvidenceStepMetric(context: WorkspaceHeaderJourneyContext) {
  return `${context.evidenceCount}/3+`;
}

export function getAnalysisStepMetric(context: WorkspaceHeaderJourneyContext) {
  if (context.isRunActive && context.progressStats) {
    return `${context.progressStats.percent}%`;
  }

  if (context.hasRunError) {
    return context.progress?.retryable
      ? context.isEnglish
        ? 'Resume'
        : '可续跑'
      : context.isEnglish
        ? 'Failed'
        : '失败';
  }

  if (!context.canRunAnalysis) {
    return context.isEnglish ? '4/4 + 3 needed' : '需要 4/4 + 3';
  }

  if (!context.hasViewableAnalysis) {
    return context.isEnglish ? 'Unlocked' : '已解锁';
  }

  if (context.isAnalysisFresh) {
    return context.isEnglish ? 'Fresh' : '最新';
  }

  if (context.isAnalysisDegraded) {
    return context.isEnglish ? 'Degraded' : '降级';
  }

  if (context.isAnalysisStale) {
    return context.isEnglish ? 'Stale' : '过期';
  }

  return context.isEnglish ? 'Viewable' : '可查看';
}

export function getResultsStepMetric(context: WorkspaceHeaderJourneyContext) {
  if (!context.hasViewableAnalysis) {
    return context.isEnglish ? 'Locked' : '未解锁';
  }

  return context.outputStep === 'sandbox'
    ? context.isEnglish
      ? '3 views'
      : '3 个视图'
    : context.currentViewLabel;
}

export function getSandboxStepMetric(context: WorkspaceHeaderJourneyContext) {
  if (!context.hasViewableAnalysis) {
    return context.isEnglish ? 'Locked' : '未解锁';
  }

  if (context.baselineCount > 0) {
    return context.isEnglish
      ? `${context.baselineCount} baseline${context.baselineCount > 1 ? 's' : ''}`
      : `${context.baselineCount} 份基线`;
  }

  return context.isEnglish ? 'No baseline' : '暂无基线';
}
