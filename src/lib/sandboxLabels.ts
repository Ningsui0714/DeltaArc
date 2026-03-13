import type {
  AnalysisSource,
  AnalysisStatus,
  SandboxAnalysisResult,
  SandboxEffectDirection,
  SandboxEffectHorizon,
  SandboxMemoryStrength,
  SandboxPerspectiveStance,
  SandboxValidationPriority,
} from '../../shared/sandbox';

export const evidenceLevelLabels: Record<SandboxAnalysisResult['evidenceLevel'], string> = {
  low: '低',
  medium: '中',
  high: '高',
};

export const analysisSourceLabels: Record<AnalysisSource, string> = {
  remote: '远端结果',
  local_fallback: '本地兜底',
};

export const analysisStatusLabels: Record<AnalysisStatus, string> = {
  fresh: '最新',
  stale: '已过期',
  degraded: '已降级',
  error: '请求失败',
};

export const stanceLabels: Record<SandboxPerspectiveStance, string> = {
  bullish: '偏乐观',
  mixed: '拉扯中',
  bearish: '偏谨慎',
};

export const horizonLabels: Record<SandboxEffectHorizon, string> = {
  near: '近期',
  mid: '中期',
  long: '长期',
};

export const directionLabels: Record<SandboxEffectDirection, string> = {
  positive: '正向',
  mixed: '双刃',
  negative: '负向',
};

export const priorityLabels: Record<SandboxValidationPriority, string> = {
  P0: '最高优先级',
  P1: '中等优先级',
  P2: '观察优先级',
};

export const memoryStrengthLabels: Record<SandboxMemoryStrength, string> = {
  fresh: '新近',
  recurring: '反复出现',
  warning: '预警',
};
