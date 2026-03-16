import type { StepId } from '../types';
import type { UiLanguage } from '../hooks/useUiLanguage';

type WorkflowStepDescriptor = {
  id: StepId;
  label: string;
  kicker: string;
  brief: string;
};

const localizedWorkflowSteps: Record<UiLanguage, WorkflowStepDescriptor[]> = {
  zh: [
    {
      id: 'overview',
      label: '项目设定',
      kicker: '定义',
      brief: '先定问题。',
    },
    {
      id: 'evidence',
      label: '证据信号',
      kicker: '证据',
      brief: '先补够证据。',
    },
    {
      id: 'modeling',
      label: '当前判断',
      kicker: '建模',
      brief: '先看当前判断。',
    },
    {
      id: 'strategy',
      label: '未来演化',
      kicker: '推演',
      brief: '再看未来演化。',
    },
    {
      id: 'report',
      label: '预测报告',
      kicker: '决策',
      brief: '最后看预测报告。',
    },
    {
      id: 'sandbox',
      label: '变量推演',
      kicker: '实验',
      brief: '冻结基线再试变量。',
    },
  ],
  en: [
    {
      id: 'overview',
      label: 'Project Setup',
      kicker: 'Define',
      brief: 'Define the problem.',
    },
    {
      id: 'evidence',
      label: 'Evidence Signals',
      kicker: 'Evidence',
      brief: 'Load enough evidence.',
    },
    {
      id: 'modeling',
      label: 'Current Judgment',
      kicker: 'Model',
      brief: 'Review the current judgment.',
    },
    {
      id: 'strategy',
      label: 'Future Evolution',
      kicker: 'Forecast',
      brief: 'Review future evolution.',
    },
    {
      id: 'report',
      label: 'Forecast Report',
      kicker: 'Decide',
      brief: 'Review the report.',
    },
    {
      id: 'sandbox',
      label: 'Variable Sandbox',
      kicker: 'Test',
      brief: 'Freeze a baseline and test one variable.',
    },
  ],
};

export const workflowSteps: WorkflowStepDescriptor[] = localizedWorkflowSteps.zh;

export function getWorkflowSteps(language: UiLanguage = 'zh') {
  return localizedWorkflowSteps[language];
}

export function getWorkflowStep(stepId: StepId, language: UiLanguage = 'zh') {
  const steps = getWorkflowSteps(language);
  return steps.find((step) => step.id === stepId) ?? steps[0];
}
