import {
  formatVariableSandboxTimestamp,
} from './variableSandboxPageFormatting';
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
      ? 'The latest visible result is degraded, but it can still be frozen as a cautious baseline.'
      : '当前可见的是最新降级结果，仍可先冻结成基线，但后续变量结论要更谨慎解读。';
  }

  if (sourceStatus === 'stale') {
    return language === 'en'
      ? 'The visible result is stale. Rerun formal inference before freezing a new baseline.'
      : '当前可见结果已经过期，先重跑正式推演，再冻结新的基线。';
  }

  return language === 'en'
    ? 'Turn the latest formal result into a reusable truth source first.'
    : '先把最新正式结果冻结成可复用真相源。';
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
      title: input.language === 'en' ? 'Freeze baseline' : '冻结基线',
      state: latestBaseline ? 'done' : input.canFreezeBaseline ? 'current' : 'upcoming',
      detail: latestBaseline
        ? input.language === 'en'
          ? `Latest baseline saved at ${formatVariableSandboxTimestamp(
              latestBaseline.createdAt,
              input.language,
            )}`
          : `最新基线已冻结于 ${formatVariableSandboxTimestamp(
              latestBaseline.createdAt,
              input.language,
            )}`
        : getFreezeFlowCopy(input.freezeBaselineSourceStatus, input.language),
    },
    {
      id: 'idea',
      index: '02',
      title: input.language === 'en' ? 'Describe one idea' : '写下一个变量想法',
      state: !latestBaseline
        ? 'upcoming'
        : input.canRunImpactScan || hasStartedScan
          ? 'done'
          : 'current',
      detail: !latestBaseline
        ? input.language === 'en'
          ? 'This unlocks after a baseline exists.'
          : '等基线就绪后才会解锁。'
        : input.canRunImpactScan || hasStartedScan
          ? input.language === 'en'
            ? `Idea ready: ${variableName || 'untitled variable'}`
            : `想法已就绪：${variableName || '未命名变量'}`
          : input.language === 'en'
            ? 'Fill the idea name, change, intent, and main concern.'
            : '先补齐变量名、改动、目标和主要担心点。',
    },
    {
      id: 'scan',
      index: '03',
      title: input.language === 'en' ? 'Run the scan' : '启动推演',
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
            (input.language === 'en' ? 'Scan is running now.' : '推演正在运行。')
          : input.scanStatus === 'error'
            ? input.language === 'en'
              ? 'The last scan failed. Adjust the idea and rerun.'
              : '上一轮推演失败了，调整想法后再跑一次。'
            : input.scanResult
              ? input.language === 'en'
                ? 'The direct-impact scan already finished.'
                : '这一轮影响扫描已经完成。'
              : input.language === 'en'
                ? 'Start with the quick scan. Use deep mode only when you need more detail.'
                : '默认先跑快速扫描，只有需要更细时再切到深度推演。',
    },
    {
      id: 'result',
      index: '04',
      title: input.language === 'en' ? 'Read the result' : '查看结果',
      state: input.scanResult ? 'done' : hasStartedScan ? 'current' : 'upcoming',
      detail: input.scanResult
        ? input.scanResult.summary
        : input.language === 'en'
          ? 'Direct effects, guardrails, and validation steps will appear here.'
          : '直接影响、关键护栏和验证动作会在这里出现。',
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
    eyebrow: input.language === 'en' ? 'Sandbox Flow' : '推演流程',
    title:
      input.language === 'en'
        ? 'This is a first-class workflow, not a hidden extra'
        : '这是第 5 步的主流程，不是藏在报告后的附带动作',
    copy:
      input.language === 'en'
        ? 'Freeze the formal result into a baseline, describe one idea, run one scan, then read direct impact and guardrails.'
        : '先把正式结果冻结成基线，再写一个变量想法，跑一轮影响扫描，然后查看直接影响和关键护栏。',
    items: buildFlowItems(input),
  };
}
