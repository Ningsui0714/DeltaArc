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
      label: '传播任务',
      kicker: '任务',
      brief: '先定这次要打什么仗。',
    },
    {
      id: 'evidence',
      label: '证据信号',
      kicker: '证据',
      brief: '先补够证据。',
    },
    {
      id: 'modeling',
      label: '当前诊断',
      kicker: '诊断',
      brief: '先看当前诊断。',
    },
    {
      id: 'strategy',
      label: '扩散演化',
      kicker: '扩散',
      brief: '再看内容会怎么扩散。',
    },
    {
      id: 'report',
      label: '策略报告',
      kicker: '策略',
      brief: '最后看策略报告。',
    },
    {
      id: 'sandbox',
      label: '变量实验',
      kicker: '实验',
      brief: '冻结基线再试一个内容变量。',
    },
  ],
  en: [
    {
      id: 'overview',
      label: 'Campaign Brief',
      kicker: 'Brief',
      brief: 'Define the campaign first.',
    },
    {
      id: 'evidence',
      label: 'Evidence Signals',
      kicker: 'Evidence',
      brief: 'Load enough evidence.',
    },
    {
      id: 'modeling',
      label: 'Current Diagnosis',
      kicker: 'Diagnose',
      brief: 'Review the current diagnosis.',
    },
    {
      id: 'strategy',
      label: 'Spread Outlook',
      kicker: 'Spread',
      brief: 'Review the spread outlook.',
    },
    {
      id: 'report',
      label: 'Strategy Report',
      kicker: 'Decide',
      brief: 'Review the strategy report.',
    },
    {
      id: 'sandbox',
      label: 'Variable Lab',
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
