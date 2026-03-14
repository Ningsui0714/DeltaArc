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
      brief: '先把这次要预测的问题写清楚，后面的图谱和时间线都会围绕这个目标展开。',
    },
    {
      id: 'evidence',
      label: '证据信号',
      kicker: '证据',
      brief: '把访谈、评测、试玩观察和设计稿沉淀成可被推演引用的输入。',
    },
    {
      id: 'modeling',
      label: '当前判断',
      kicker: '建模',
      brief: '多代理先对当前接受度、风险和盲点给出结构化判断。',
    },
    {
      id: 'strategy',
      label: '未来演化',
      kicker: '推演',
      brief: '开始模拟发布后反响、社区节奏和后续几拍会怎么发展。',
    },
    {
      id: 'report',
      label: '预测报告',
      kicker: '决策',
      brief: '把整个过程收束成可执行结论、关键风险和下一步动作。',
    },
    {
      id: 'sandbox',
      label: '变量推演',
      kicker: '实验',
      brief: '基于正式结果冻结基线，再注入一个新变量继续试。',
    },
  ],
  en: [
    {
      id: 'overview',
      label: 'Project Setup',
      kicker: 'Define',
      brief: 'Write down the prediction target first so every later stage knows what to evaluate.',
    },
    {
      id: 'evidence',
      label: 'Evidence Signals',
      kicker: 'Evidence',
      brief: 'Turn interviews, reviews, playtest notes, and design docs into usable analysis inputs.',
    },
    {
      id: 'modeling',
      label: 'Current Judgment',
      kicker: 'Model',
      brief: 'Specialist agents produce a structured read on acceptance, risk, and blind spots.',
    },
    {
      id: 'strategy',
      label: 'Future Evolution',
      kicker: 'Forecast',
      brief: 'Simulate launch reactions, community rhythms, and what unfolds over the next beats.',
    },
    {
      id: 'report',
      label: 'Forecast Report',
      kicker: 'Decide',
      brief: 'Collapse the whole run into usable conclusions, key risks, and next actions.',
    },
    {
      id: 'sandbox',
      label: 'Variable Sandbox',
      kicker: 'Test',
      brief: 'Freeze the formal result into a baseline, then test one new variable on top of it.',
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
