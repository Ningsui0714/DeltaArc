import { buildVariableSandboxBaselineViewModel } from './variableSandboxPageBaseline';
import { buildVariableSandboxFlowViewModel } from './variableSandboxPageFlow';
import type {
  VariableSandboxPageViewModel,
  VariableSandboxPageViewModelInput,
} from './variableSandboxPageTypes';

export type {
  FlowState,
  FreezeBaselineSourceStatus,
  ScanStatus,
  VariableSandboxFlowItemViewModel,
  VariableSandboxPageViewModel,
  VariableSandboxPageViewModelInput,
} from './variableSandboxPageTypes';

export function createVariableSandboxPageViewModel(
  input: VariableSandboxPageViewModelInput,
): VariableSandboxPageViewModel {
  const latestBaseline = input.baselines[0] ?? null;

  return {
    latestBaseline,
    hero: {
      eyebrow: input.language === 'en' ? 'Variable Sandbox' : '变量推演',
      title:
        input.language === 'en'
          ? 'Test one new variable on top of the formal result'
          : '基于正式结果继续测试一个新变量',
      summary: input.reportSummary,
      backButtonLabel:
        input.language === 'en' ? 'Back to Forecast Report' : '回到预测报告',
    },
    flow: buildVariableSandboxFlowViewModel(input),
    baseline: buildVariableSandboxBaselineViewModel(input, latestBaseline),
  };
}
