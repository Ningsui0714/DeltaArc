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
      eyebrow: input.language === 'en' ? 'Variable Lab' : '变量实验',
      title:
        input.language === 'en'
          ? 'Test one content variable on top of the formal strategy result'
          : '基于正式策略结果继续测试一个内容变量',
      summary: input.reportSummary,
      backButtonLabel:
        input.language === 'en' ? 'Back to Strategy Report' : '回到策略报告',
    },
    flow: buildVariableSandboxFlowViewModel(input),
    baseline: buildVariableSandboxBaselineViewModel(input, latestBaseline),
  };
}
