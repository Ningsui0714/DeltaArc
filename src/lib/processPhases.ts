import type { StepId } from '../types';
import type { UiLanguage } from '../hooks/useUiLanguage';

export type ProcessPhase = 'intake' | 'analysis' | 'output';
export type InputStep = Extract<StepId, 'overview' | 'evidence'>;
export type OutputStep = Extract<StepId, 'modeling' | 'strategy' | 'report' | 'sandbox'>;

export const inputSteps: InputStep[] = ['overview', 'evidence'];
export const outputSteps: OutputStep[] = ['modeling', 'strategy', 'report', 'sandbox'];

type ProcessPhaseDescriptor = {
  id: ProcessPhase;
  label: string;
  kicker: string;
  brief: string;
};

const localizedProcessPhases: Record<UiLanguage, ProcessPhaseDescriptor[]> = {
  zh: [
    {
      id: 'intake',
      label: '输入与导入',
      kicker: '01',
      brief: '先定义项目、导入文档和补证据，不在这里提前长出结论。',
    },
    {
      id: 'analysis',
      label: '推理台',
      kicker: '02',
      brief: '让推理中枢、多代理和收束阶段真正运行，再看过程和进度。',
    },
    {
      id: 'output',
      label: '结果输出',
      kicker: '03',
      brief: '在这里查看正式结果集，并继续进入变量推演，不再和输入混在一起。',
    },
  ],
  en: [
    {
      id: 'intake',
      label: 'Intake',
      kicker: '01',
      brief: 'Define the project, import materials, and load evidence before any conclusion appears.',
    },
    {
      id: 'analysis',
      label: 'Inference Desk',
      kicker: '02',
      brief: 'Run the dossier hub, specialist agents, and synthesis stages before reviewing the process.',
    },
    {
      id: 'output',
      label: 'Outputs',
      kicker: '03',
      brief: 'Review the formal result set and continue into the Variable Sandbox without mixing them with inputs.',
    },
  ],
};

export const processPhases: ProcessPhaseDescriptor[] = localizedProcessPhases.zh;

export function getProcessPhases(language: UiLanguage = 'zh') {
  return localizedProcessPhases[language];
}

export function isInputStep(step: StepId): step is InputStep {
  return inputSteps.includes(step as InputStep);
}

export function isOutputStep(step: StepId): step is OutputStep {
  return outputSteps.includes(step as OutputStep);
}

export function getPhaseForStep(step: StepId): ProcessPhase {
  return isInputStep(step) ? 'intake' : 'output';
}
