import type { UiLanguage } from '../hooks/useUiLanguage';
import type { ProjectSnapshot, StepId } from '../types';

type GuideStepStatus = 'done' | 'current' | 'upcoming';
type MetricTone = 'good' | 'info' | 'alert';

export type OverviewPageViewModelInput = {
  language: UiLanguage;
  project: ProjectSnapshot;
  evidenceCount: number;
  hasViewableAnalysis: boolean;
  isAnalysisFresh: boolean;
  isAnalysisStale: boolean;
  isAnalysisDegraded: boolean;
};

export type OverviewPageViewModel = {
  hero: {
    eyebrow: string;
    title: string;
    copy: string;
    signalItems: Array<{
      label: string;
      value: string;
    }>;
  };
  launchpad: {
    eyebrow: string;
    title: string;
    badge: string;
    steps: Array<{
      id: 'project' | 'evidence' | 'scan' | 'review';
      number: '01' | '02' | '03' | '04';
      title: string;
      description: string;
      metric: string;
      status: GuideStepStatus;
      statusLabel: string;
      actionLabel?: string;
      actionStep?: StepId;
    }>;
  };
  importCard: {
    title: string;
    description: string;
    hint: string;
    buttonLabel: string;
  };
  runStatus: {
    eyebrow: string;
    title: string;
    copy: string;
    bullets: string[];
  };
  metrics: Array<{
    label: string;
    value: string;
    tone: MetricTone;
  }>;
  timeline: {
    eyebrow: string;
    title: string;
    buttonLabel: string;
    buttonStep: StepId;
    steps: Array<{
      time: '01' | '02' | '03' | '04';
      title: string;
      detail: string;
    }>;
  };
};

export type OverviewGuideStep = OverviewPageViewModel['launchpad']['steps'][number];
export type OverviewGuideStepDraft = Omit<OverviewGuideStep, 'statusLabel'>;
