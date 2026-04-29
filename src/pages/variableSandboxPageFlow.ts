import { formatVariableSandboxTimestamp } from './variableSandboxPageFormatting';
import type {
  FlowState,
  FreezeBaselineSourceStatus,
  VariableSandboxFlowItemViewModel,
  VariableSandboxPageViewModel,
  VariableSandboxPageViewModelInput,
} from './variableSandboxPageTypes';

function getFlowStateLabel(state: FlowState, language: VariableSandboxPageViewModelInput['language']) {
  if (state === 'done') {
    return language === 'en' ? 'Done' : '已完成';
  }

  if (state === 'current') {
    return language === 'en' ? 'Current' : '当前';
  }

  return language === 'en' ? 'Next' : '下一步';
}

function getFreezeFlowCopy(
  sourceStatus: FreezeBaselineSourceStatus,
  language: VariableSandboxPageViewModelInput['language'],
) {
  if (sourceStatus === 'degraded') {
    return language === 'en'
      ? 'The latest visible result is degraded, but it can still be frozen as a cautious strategy baseline.'
      : '当前可见的是最新降级结果，仍可先冻结成策略基线，但后续变量结论要更谨慎解读。';
  }

  if (sourceStatus === 'stale') {
    return language === 'en'
      ? 'The visible result is stale. Rerun formal diagnosis before freezing a new baseline.'
      : '当前可见结果已经过期，先重跑正式诊断，再冻结新的策略基线。';
  }

  return language === 'en'
    ? 'Turn the latest formal strategy result into a reusable truth source first.'
    : '先把最新正式策略结果冻结成可复用真相源。';
}

function buildFlowItems(
  input: VariableSandboxPageViewModelInput,
): VariableSandboxFlowItemViewModel[] {
  const latestBaseline = input.baselines[0] ?? null;
  const hasStartedScan =
    Boolean(input.scanJob) ||
    Boolean(input.scanResult) ||
    input.scanStatus !== 'idle';
  const runningStage =
    input.scanJob?.stages.find((stage) => stage.status === 'running')?.label ?? null;
  const variableName = input.variableName.trim();
  const items: Array<Omit<VariableSandboxFlowItemViewModel, 'stateLabel'>> = [
    {
      id: 'baseline',
      index: '01',
      title: input.language === 'en' ? 'Freeze strategy baseline' : '冻结策略基线',
      state: latestBaseline ? 'done' : input.canFreezeBaseline ? 'current' : 'upcoming',
      detail: latestBaseline
        ? input.language === 'en'
          ? `Latest baseline saved at ${formatVariableSandboxTimestamp(
              latestBaseline.createdAt,
              input.language,
            )}`
          : `最新策略基线已冻结于 ${formatVariableSandboxTimestamp(
              latestBaseline.createdAt,
              input.language,
            )}`
        : getFreezeFlowCopy(input.freezeBaselineSourceStatus, input.language),
    },
    {
      id: 'idea',
      index: '02',
      title: input.language === 'en' ? 'Describe one content variable' : '写下一个内容变量',
      state: !latestBaseline
        ? 'upcoming'
        : input.canRunImpactScan || hasStartedScan
          ? 'done'
          : 'current',
      detail: !latestBaseline
        ? input.language === 'en'
          ? 'This unlocks after a strategy baseline exists.'
          : '等策略基线就绪后才会解锁。'
        : input.canRunImpactScan || hasStartedScan
          ? input.language === 'en'
            ? `Variable ready: ${variableName || 'untitled content variable'}`
            : `内容变量已就绪：${variableName || '未命名内容变量'}`
          : input.language === 'en'
            ? 'Fill the variable name, change, intent, and main concern.'
            : '先补齐变量名、改动、目标和主要担心点。',
    },
    {
      id: 'scan',
      index: '03',
      title: input.language === 'en' ? 'Run the experiment' : '启动变量实验',
      state: !latestBaseline
        ? 'upcoming'
        : input.scanResult
          ? 'done'
          : input.scanStatus === 'loading' ||
              input.scanStatus === 'error' ||
              input.canRunImpactScan
            ? 'current'
            : 'upcoming',
      detail:
        input.scanStatus === 'loading'
          ? runningStage ??
            (input.language === 'en' ? 'Experiment is running now.' : '变量实验正在运行。')
          : input.scanStatus === 'error'
            ? input.language === 'en'
              ? 'The last experiment failed. Adjust the variable and rerun.'
              : '上一轮变量实验失败了，调整内容变量后再跑一次。'
            : input.scanResult
              ? input.language === 'en'
                ? 'The direct-impact experiment already finished.'
                : '这一轮直接影响实验已经完成。'
              : input.language === 'en'
                ? 'Start with quick mode. Use deep mode only when you need more detail.'
                : '默认先跑快速模式，只有需要更细时再切到深度推演。',
    },
    {
      id: 'result',
      index: '04',
      title: input.language === 'en' ? 'Read the result' : '查看实验结果',
      state: input.scanResult ? 'done' : hasStartedScan ? 'current' : 'upcoming',
      detail: input.scanResult
        ? input.scanResult.summary
        : input.language === 'en'
          ? 'Direct effects, guardrails, and validation steps will appear here.'
          : '直接影响、关键 guardrail 和 validation plan 会在这里出现。',
    },
  ];

  return items.map((item) => ({
    ...item,
    stateLabel: getFlowStateLabel(item.state, input.language),
  }));
}

export function buildVariableSandboxFlowViewModel(
  input: VariableSandboxPageViewModelInput,
): VariableSandboxPageViewModel['flow'] {
  return {
    eyebrow: input.language === 'en' ? 'Variable Lab Flow' : '变量实验流程',
    title:
      input.language === 'en'
        ? 'Freeze the baseline, then test one content variable'
        : '先冻结基线，再测试一个内容变量',
    copy:
      input.language === 'en'
        ? 'Freeze the formal strategy result into a baseline, describe one content variable, run one experiment, then read direct impact and guardrails.'
        : '先把正式策略结果冻结成基线，再写一个内容变量，跑一轮实验，然后查看直接影响和关键 guardrail。',
    items: buildFlowItems(input),
  };
}
