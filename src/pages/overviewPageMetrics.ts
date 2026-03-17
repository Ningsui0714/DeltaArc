import type { OverviewPageViewModel, OverviewPageViewModelInput } from './overviewPageTypes';

function getFormalRunStatusValue(input: OverviewPageViewModelInput) {
  if (!input.hasViewableAnalysis) {
    return input.language === 'en' ? 'Locked' : '未运行';
  }

  if (input.isAnalysisFresh) {
    return input.language === 'en' ? 'Fresh' : '最新';
  }

  if (input.isAnalysisDegraded) {
    return input.language === 'en' ? 'Degraded' : '降级';
  }

  if (input.isAnalysisStale) {
    return input.language === 'en' ? 'Stale' : '过期';
  }

  return input.language === 'en' ? 'Viewable' : '可查看';
}

export function buildOverviewMetricsViewModel(
  input: OverviewPageViewModelInput,
  setupFieldCount: number,
  projectReady: boolean,
  evidenceReady: boolean,
): OverviewPageViewModel['metrics'] {
  return [
    {
      label: input.language === 'en' ? 'Project Readiness' : '项目准备度',
      value: `${setupFieldCount}/4`,
      tone: projectReady ? 'good' : 'alert',
    },
    {
      label: input.language === 'en' ? 'Evidence Gate' : '证据门槛',
      value: `${input.evidenceCount}/3+`,
      tone: evidenceReady ? 'good' : 'info',
    },
    {
      label: input.language === 'en' ? 'Formal Run Status' : '正式推理状态',
      value: getFormalRunStatusValue(input),
      tone: input.hasViewableAnalysis
        ? input.isAnalysisFresh
          ? 'good'
          : 'alert'
        : 'info',
    },
  ];
}
