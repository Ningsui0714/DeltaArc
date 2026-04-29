import {
  createWorkspaceHeaderJourneyContext,
  type WorkspaceHeaderJourneyParams,
} from './workspaceHeaderJourneyContext';
import {
  getAnalysisStepMetric,
  getEvidenceStepMetric,
  getOverviewStepMetric,
  getResultsStepMetric,
  getSandboxStepMetric,
} from './workspaceHeaderJourneyMetrics';
import {
  getAnalysisStepStatus,
  getEvidenceStepStatus,
  getOverviewStepStatus,
  getResultsStepStatus,
  getSandboxStepStatus,
} from './workspaceHeaderJourneyStatus';
import type { WorkspaceJourneyStep } from './workspaceHeaderTypes';

export { getOutputStateLabel } from './workspaceHeaderJourneyStatus';

export function buildJourneySteps(
  params: WorkspaceHeaderJourneyParams,
) {
  const context = createWorkspaceHeaderJourneyContext(params);

  return [
    {
      id: 'overview',
      label: context.isEnglish ? 'Campaign Brief' : '传播任务',
      brief: context.isEnglish ? 'Define the campaign.' : '先定传播任务。',
      status: getOverviewStepStatus(context),
      metric: getOverviewStepMetric(context),
      locked: false,
      onSelect: () => context.onSelectInputStep('overview'),
    },
    {
      id: 'evidence',
      label: context.isEnglish ? 'Evidence Signals' : '证据信号',
      brief: context.isEnglish ? 'Load enough evidence.' : '先补够证据。',
      status: getEvidenceStepStatus(context),
      metric: getEvidenceStepMetric(context),
      locked: false,
      onSelect: () => context.onSelectInputStep('evidence'),
    },
    {
      id: 'analysis',
      label: context.isEnglish ? 'Formal Diagnosis' : '正式诊断',
      brief: context.isEnglish ? 'Run the formal diagnosis.' : '运行正式诊断。',
      status: getAnalysisStepStatus(context),
      metric: getAnalysisStepMetric(context),
      locked: false,
      onSelect: () => context.onSelectPhase('analysis'),
    },
    {
      id: 'results',
      label: context.isEnglish ? 'Strategy Results' : '策略结果',
      brief: context.isEnglish ? 'Review the result views.' : '查看诊断和策略。',
      status: getResultsStepStatus(context),
      metric: getResultsStepMetric(context),
      locked: !context.hasViewableAnalysis,
      onSelect: () => context.onSelectOutputStep('report'),
    },
    {
      id: 'sandbox',
      label: context.isEnglish ? 'Variable Lab' : '变量实验',
      brief: context.isEnglish
        ? 'Freeze a baseline and test one variable.'
        : '冻结基线再试一个内容变量。',
      status: getSandboxStepStatus(context),
      metric: getSandboxStepMetric(context),
      locked: !context.hasViewableAnalysis,
      onSelect: () => context.onSelectOutputStep('sandbox'),
    },
  ] satisfies WorkspaceJourneyStep[];
}
