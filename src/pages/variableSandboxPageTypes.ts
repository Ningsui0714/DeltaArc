import type {
  FrozenBaseline,
  VariableImpactScanJob,
  VariableImpactScanResult,
} from '../../shared/variableSandbox';
import type { UiLanguage } from '../hooks/useUiLanguage';

export type FreezeBaselineSourceStatus = 'fresh' | 'degraded' | 'stale';
export type ScanStatus = 'idle' | 'loading' | 'error';
export type FlowState = 'done' | 'current' | 'upcoming';

export type VariableSandboxFlowItemViewModel = {
  id: 'baseline' | 'idea' | 'scan' | 'result';
  index: '01' | '02' | '03' | '04';
  title: string;
  detail: string;
  state: FlowState;
  stateLabel: string;
};

export type VariableSandboxPageViewModelInput = {
  language: UiLanguage;
  reportSummary: string;
  baselines: FrozenBaseline[];
  baselineStatus: 'idle' | 'loading' | 'saving' | 'error';
  baselineError: string | null;
  canFreezeBaseline: boolean;
  freezeBaselineSourceStatus: FreezeBaselineSourceStatus;
  variableName: string;
  canRunImpactScan: boolean;
  scanJob: VariableImpactScanJob | null;
  scanResult: VariableImpactScanResult | null;
  scanStatus: ScanStatus;
};

export type VariableSandboxPageViewModel = {
  latestBaseline: FrozenBaseline | null;
  hero: {
    eyebrow: string;
    title: string;
    summary: string;
    backButtonLabel: string;
  };
  flow: {
    eyebrow: string;
    title: string;
    copy: string;
    items: VariableSandboxFlowItemViewModel[];
  };
  baseline: {
    eyebrow: string;
    title: string;
    description: string;
    bullets: string[];
    freezeButtonLabel: string;
  };
};
