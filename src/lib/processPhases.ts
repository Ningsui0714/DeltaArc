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
      label: '任务输入',
      kicker: '01',
      brief: '先整理 brief 和证据。',
    },
    {
      id: 'analysis',
      label: '诊断台',
      kicker: '02',
      brief: '在这里跑正式诊断。',
    },
    {
      id: 'output',
      label: '策略输出',
      kicker: '03',
      brief: '在这里看诊断和策略。',
    },
  ],
  en: [
    {
      id: 'intake',
      label: 'Brief Intake',
      kicker: '01',
      brief: 'Prepare the brief and evidence.',
    },
    {
      id: 'analysis',
      label: 'Diagnosis Desk',
      kicker: '02',
      brief: 'Run the formal diagnosis here.',
    },
    {
      id: 'output',
      label: 'Strategy Outputs',
      kicker: '03',
      brief: 'Review the diagnosis and strategy outputs.',
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
