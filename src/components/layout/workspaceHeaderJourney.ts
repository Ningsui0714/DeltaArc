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
      label: context.isEnglish ? 'Project Setup' : '项目设定',
      brief: context.isEnglish ? 'Define the problem.' : '先定问题。',
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
      label: context.isEnglish ? 'Formal Inference' : '正式推演',
      brief: context.isEnglish ? 'Run the formal chain.' : '运行正式推演。',
      status: getAnalysisStepStatus(context),
      metric: getAnalysisStepMetric(context),
      locked: false,
      onSelect: () => context.onSelectPhase('analysis'),
    },
    {
      id: 'results',
      label: context.isEnglish ? 'Formal Results' : '正式结果',
      brief: context.isEnglish ? 'Review the result views.' : '查看正式结果。',
      status: getResultsStepStatus(context),
      metric: getResultsStepMetric(context),
      locked: !context.hasViewableAnalysis,
      onSelect: () => context.onSelectOutputStep('report'),
    },
    {
      id: 'sandbox',
      label: context.isEnglish ? 'Variable Sandbox' : '变量推演',
      brief: context.isEnglish
        ? 'Freeze a baseline and test one variable.'
        : '冻结基线再试变量。',
      status: getSandboxStepStatus(context),
      metric: getSandboxStepMetric(context),
      locked: !context.hasViewableAnalysis,
      onSelect: () => context.onSelectOutputStep('sandbox'),
    },
  ] satisfies WorkspaceJourneyStep[];
}
