import type { UiLanguage } from '../../hooks/useUiLanguage';
import type { WorkspaceHeaderJourneyContext } from './workspaceHeaderJourneyContext';

export function getOutputStateLabel(
  hasViewableAnalysis: boolean,
  isAnalysisFresh: boolean,
  isAnalysisDegraded: boolean,
  language: UiLanguage,
) {
  const isEnglish = language === 'en';

  if (!hasViewableAnalysis) {
    return isEnglish ? 'Locked' : '未生成';
  }

  if (isAnalysisFresh) {
    return isEnglish ? 'Fresh' : '最新';
  }

  return isAnalysisDegraded ? (isEnglish ? 'Degraded' : '降级') : isEnglish ? 'Stale' : '过期';
}

export function getOverviewStepStatus(context: WorkspaceHeaderJourneyContext) {
  return context.readiness.setupFieldCount >= 4
    ? context.isEnglish
      ? 'Core setup is ready'
      : '核心设定已达标'
    : context.isEnglish
      ? 'Fill required fields'
      : '补齐关键字段';
}

export function getEvidenceStepStatus(context: WorkspaceHeaderJourneyContext) {
  return context.evidenceCount >= 3
    ? context.isEnglish
      ? 'Evidence is ready'
      : '证据已达标'
    : context.isEnglish
      ? 'Keep adding evidence'
      : '继续补证据';
}

export function getAnalysisStepStatus(context: WorkspaceHeaderJourneyContext) {
  if (context.isRunActive) {
    return context.isEnglish ? 'Inference running' : '推理运行中';
  }

  if (context.hasRunError) {
    return context.progress?.retryable
      ? context.isEnglish
        ? 'Run failed, resume available'
        : '运行失败，可继续重试'
      : context.isEnglish
        ? 'Run failed'
        : '运行失败';
  }

  if (!context.canRunAnalysis) {
    return context.isEnglish ? 'Waiting for minimum gate' : '等待最小门槛';
  }

  if (!context.hasViewableAnalysis) {
    return context.isEnglish ? 'Ready to start' : '待启动';
  }

  if (context.isAnalysisFresh) {
    return context.isEnglish ? 'Ready to rerun' : '可重新运行';
  }

  if (context.isAnalysisDegraded) {
    return context.isEnglish ? 'Rerun recommended' : '建议重跑';
  }

  if (context.isAnalysisStale) {
    return context.isEnglish ? 'Stale, rerun recommended' : '结果过期，建议重跑';
  }

  return context.isEnglish ? 'Viewable output available' : '已有可查看结果';
}

export function getResultsStepStatus(context: WorkspaceHeaderJourneyContext) {
  if (!context.hasViewableAnalysis) {
    return context.isEnglish ? 'Waiting for formal result' : '等待正式结果';
  }

  if (context.isAnalysisDegraded) {
    return context.isEnglish ? 'Stabilized results are available' : '已有稳定化结果';
  }

  if (context.isAnalysisStale) {
    return context.isEnglish ? 'Older results are still viewable' : '旧结果仍可查看';
  }

  if (context.activePhase === 'output' && context.outputStep !== 'sandbox') {
    return context.isEnglish
      ? `Current view: ${context.currentViewLabel}`
      : `当前视图：${context.currentViewLabel}`;
  }

  return context.isEnglish ? 'Three result views are ready' : '三个结果视图已就绪';
}

export function getSandboxStepStatus(context: WorkspaceHeaderJourneyContext) {
  if (!context.hasViewableAnalysis) {
    return context.isEnglish ? 'Waiting for formal result' : '等待正式结果';
  }

  if (context.baselineCount > 0) {
    if (context.outputStep === 'sandbox') {
      return context.isEnglish ? 'Sandbox is open' : '流程已打开';
    }

    return context.isEnglish ? 'Baseline is ready' : '基线已就绪';
  }

  return context.isEnglish ? 'Freeze the first baseline' : '先冻结基线';
}
