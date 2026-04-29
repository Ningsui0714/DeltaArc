import type {
  DesignVariableV1,
  FrozenBaseline,
  VariableImpactScanJob,
  VariableImpactScanResult,
} from '../../../shared/variableSandbox';

export type ImpactScanFlowState = 'done' | 'current' | 'upcoming';

export type ImpactScanFlowItem = {
  id: 'baseline' | 'idea' | 'scan' | 'result';
  index: '01' | '02' | '03' | '04';
  title: string;
  state: ImpactScanFlowState;
  detail: string;
};

export function formatEvidenceLevel(
  value: VariableImpactScanResult['evidenceLevel'],
  isEnglish: boolean,
) {
  if (isEnglish) {
    return value;
  }

  if (value === 'high') {
    return '高';
  }

  if (value === 'medium') {
    return '中';
  }

  return '低';
}

export function formatRiskLevel(
  value: 'low' | 'medium' | 'high',
  isEnglish: boolean,
) {
  if (isEnglish) {
    return value;
  }

  if (value === 'high') {
    return '高风险';
  }

  if (value === 'medium') {
    return '中风险';
  }

  return '低风险';
}

export function formatJobStageStatus(
  value: VariableImpactScanJob['stages'][number]['status'],
  isEnglish: boolean,
) {
  if (isEnglish) {
    return value;
  }

  if (value === 'running') {
    return '进行中';
  }

  if (value === 'completed') {
    return '已完成';
  }

  if (value === 'error') {
    return '失败';
  }

  return '待开始';
}

export function formatJobStageLabel(
  stage: VariableImpactScanJob['stages'][number],
  isEnglish: boolean,
) {
  if (isEnglish) {
    return stage.label;
  }

  if (stage.key === 'queued') {
    return '排队中';
  }

  if (stage.key === 'baseline_read') {
    return '读取策略基线';
  }

  if (stage.key === 'impact_scan') {
    return '变量实验扫描';
  }

  return '已完成';
}

export function formatJobStageDetail(
  stage: VariableImpactScanJob['stages'][number],
  isEnglish: boolean,
) {
  if (isEnglish) {
    return stage.detail;
  }

  if (stage.key === 'queued') {
    return '等待启动变量实验。';
  }

  if (stage.key === 'baseline_read') {
    return stage.status === 'completed'
      ? '已读取冻结后的策略基线。'
      : '正在读取冻结后的策略基线。';
  }

  if (stage.key === 'impact_scan') {
    return stage.status === 'completed'
      ? '直接影响、guardrail 和 validation plan 已生成。'
      : stage.status === 'error'
        ? '变量实验未能顺利完成。'
        : '正在整理直接影响、guardrail 和 validation plan。';
  }

  return '变量实验已完成。';
}

export function formatTargetLabel(value: string, isEnglish: boolean) {
  const labels: Record<string, { zh: string; en: string }> = {
    core_loop: { zh: '核心内容循环', en: 'Core Content Loop' },
    session_pacing: { zh: '发布节奏', en: 'Publishing Pace' },
    player_cooperation: { zh: '协作传播', en: 'Collaborative Diffusion' },
    resource_flow: { zh: '资源流转', en: 'Resource Flow' },
    progression_curve: { zh: '转化曲线', en: 'Conversion Curve' },
    failure_recovery: { zh: '失效恢复', en: 'Failure Recovery' },
    event_rhythm: { zh: '活动节奏', en: 'Campaign Rhythm' },
    return_triggers: { zh: '回流触发', en: 'Return Triggers' },
    community_coordination: { zh: '社群协同', en: 'Community Coordination' },
    value_perception: { zh: '价值感知', en: 'Value Perception' },
    conversion_moment: { zh: '转化时刻', en: 'Conversion Moment' },
    retention_tradeoff: { zh: '留存权衡', en: 'Retention Tradeoff' },
  };

  const entry = labels[value];
  if (!entry) {
    return value;
  }

  return isEnglish ? entry.en : entry.zh;
}

export function formatModeLabel(
  value: VariableImpactScanJob['mode'],
  isEnglish: boolean,
) {
  if (value === 'reasoning') {
    return isEnglish ? 'Deep' : '深度';
  }

  return isEnglish ? 'Quick' : '快速';
}

export function formatTimestamp(value: string, language: 'zh' | 'en') {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

export function getScanFlowStateLabel(
  state: ImpactScanFlowState,
  isEnglish: boolean,
) {
  if (state === 'done') {
    return isEnglish ? 'Done' : '已完成';
  }

  if (state === 'current') {
    return isEnglish ? 'Current' : '当前';
  }

  return isEnglish ? 'Next' : '下一步';
}

export function buildImpactScanFlow(params: {
  baseline: FrozenBaseline | null;
  variable: DesignVariableV1;
  currentStageLabel: string | null;
  result: VariableImpactScanResult | null;
  status: 'idle' | 'loading' | 'error';
  job: VariableImpactScanJob | null;
  isEnglish: boolean;
}) {
  const { baseline, variable, currentStageLabel, result, status, job, isEnglish } = params;

  return [
    {
      id: 'baseline',
      index: '01',
      title: isEnglish ? 'Baseline loaded' : '策略基线就绪',
      state: 'done' as const,
      detail: isEnglish
        ? `Using ${baseline?.id ?? 'baseline'}`
        : `当前使用 ${baseline?.id ?? '基线'}`,
    },
    {
      id: 'idea',
      index: '02',
      title: isEnglish ? 'Variable submitted' : '提交内容变量',
      state:
        variable.name.trim() && variable.changeStatement.trim() && variable.intent.trim()
          ? ('done' as const)
          : ('current' as const),
      detail: variable.name.trim()
        ? variable.name
        : isEnglish
          ? 'Waiting for variable fields to be completed.'
          : '等待补全变量字段。',
    },
    {
      id: 'scan',
      index: '03',
      title: isEnglish ? 'Impact scan' : '变量实验扫描',
      state:
        result
          ? ('done' as const)
          : status === 'loading' || status === 'error' || Boolean(job)
            ? ('current' as const)
            : ('upcoming' as const),
      detail: status === 'loading'
        ? currentStageLabel ?? (isEnglish ? 'Scan is running now.' : '扫描任务运行中。')
        : status === 'error'
          ? isEnglish
            ? 'The latest scan stopped with an error.'
            : '最近一次扫描因错误中断。'
          : isEnglish
            ? 'This step turns variable changes into direct effects, guardrails, and validation plan.'
            : '此步骤会将变量变化整理为直接影响、guardrail 与 validation plan。',
    },
    {
      id: 'result',
      index: '04',
      title: isEnglish ? 'Read result' : '查看实验结果',
      state: result
        ? ('done' as const)
        : Boolean(job) || status === 'error'
          ? ('current' as const)
          : ('upcoming' as const),
      detail: result
        ? result.summary
        : isEnglish
          ? 'Result shows direct impact, affected groups, and next actions.'
          : '结果区会展示直接影响、受影响人群与下一步动作。',
    },
  ] satisfies ImpactScanFlowItem[];
}
