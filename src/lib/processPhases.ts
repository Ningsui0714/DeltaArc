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
      brief: '先整理输入。',
    },
    {
      id: 'analysis',
      label: '推理台',
      kicker: '02',
      brief: '在这里运行推理。',
    },
    {
      id: 'output',
      label: '结果输出',
      kicker: '03',
      brief: '在这里看结果。',
    },
  ],
  en: [
    {
      id: 'intake',
      label: 'Intake',
      kicker: '01',
      brief: 'Prepare the inputs.',
    },
    {
      id: 'analysis',
      label: 'Inference Desk',
      kicker: '02',
      brief: 'Run inference here.',
    },
    {
      id: 'output',
      label: 'Outputs',
      kicker: '03',
      brief: 'Review the outputs here.',
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
