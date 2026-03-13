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
import type { UiLanguage } from '../hooks/useUiLanguage';

const zhLabels = {
  evidenceLevelLabels: {
    low: '低',
    medium: '中',
    high: '高',
  } satisfies Record<SandboxAnalysisResult['evidenceLevel'], string>,
  analysisSourceLabels: {
    remote: '远端结果',
    local_fallback: '本地兜底',
  } satisfies Record<AnalysisSource, string>,
  analysisStatusLabels: {
    fresh: '最新',
    stale: '已过期',
    degraded: '已降级',
    error: '请求失败',
  } satisfies Record<AnalysisStatus, string>,
  stanceLabels: {
    bullish: '偏乐观',
    mixed: '拉扯中',
    bearish: '偏谨慎',
  } satisfies Record<SandboxPerspectiveStance, string>,
  horizonLabels: {
    near: '近期',
    mid: '中期',
    long: '长期',
  } satisfies Record<SandboxEffectHorizon, string>,
  directionLabels: {
    positive: '正向',
    mixed: '双刃',
    negative: '负向',
  } satisfies Record<SandboxEffectDirection, string>,
  priorityLabels: {
    P0: '最高优先级',
    P1: '中等优先级',
    P2: '观察优先级',
  } satisfies Record<SandboxValidationPriority, string>,
  memoryStrengthLabels: {
    fresh: '新近',
    recurring: '反复出现',
    warning: '预警',
  } satisfies Record<SandboxMemoryStrength, string>,
};

const enLabels = {
  evidenceLevelLabels: {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  } satisfies Record<SandboxAnalysisResult['evidenceLevel'], string>,
  analysisSourceLabels: {
    remote: 'Remote',
    local_fallback: 'Fallback',
  } satisfies Record<AnalysisSource, string>,
  analysisStatusLabels: {
    fresh: 'Fresh',
    stale: 'Stale',
    degraded: 'Degraded',
    error: 'Failed',
  } satisfies Record<AnalysisStatus, string>,
  stanceLabels: {
    bullish: 'Bullish',
    mixed: 'Mixed',
    bearish: 'Cautious',
  } satisfies Record<SandboxPerspectiveStance, string>,
  horizonLabels: {
    near: 'Near',
    mid: 'Mid',
    long: 'Long',
  } satisfies Record<SandboxEffectHorizon, string>,
  directionLabels: {
    positive: 'Positive',
    mixed: 'Mixed',
    negative: 'Negative',
  } satisfies Record<SandboxEffectDirection, string>,
  priorityLabels: {
    P0: 'Highest',
    P1: 'Medium',
    P2: 'Watch',
  } satisfies Record<SandboxValidationPriority, string>,
  memoryStrengthLabels: {
    fresh: 'Fresh',
    recurring: 'Recurring',
    warning: 'Warning',
  } satisfies Record<SandboxMemoryStrength, string>,
};

export function getSandboxLabels(language: UiLanguage = 'zh') {
  return language === 'en' ? enLabels : zhLabels;
}

export const evidenceLevelLabels = zhLabels.evidenceLevelLabels;
export const analysisSourceLabels = zhLabels.analysisSourceLabels;
export const analysisStatusLabels = zhLabels.analysisStatusLabels;
export const stanceLabels = zhLabels.stanceLabels;
export const horizonLabels = zhLabels.horizonLabels;
export const directionLabels = zhLabels.directionLabels;
export const priorityLabels = zhLabels.priorityLabels;
export const memoryStrengthLabels = zhLabels.memoryStrengthLabels;
