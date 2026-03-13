import type {
  AnalysisSource,
  AnalysisStatus,
  SandboxAnalysisMode,
  SandboxEffectDirection,
  SandboxEffectHorizon,
  SandboxEvidenceLevel,
  SandboxMemoryStrength,
  SandboxPerspectiveKey,
  SandboxPerspectiveStance,
  SandboxValidationPriority,
} from '../sandbox';

export const analysisModes: SandboxAnalysisMode[] = ['balanced', 'reasoning'];
export const analysisSources: AnalysisSource[] = ['remote', 'local_fallback'];
export const analysisStatuses: AnalysisStatus[] = ['fresh', 'stale', 'degraded', 'error'];
export const perspectiveKeys: SandboxPerspectiveKey[] = [
  'systems',
  'psychology',
  'economy',
  'market',
  'production',
  'red_team',
];
export const perspectiveStances: SandboxPerspectiveStance[] = ['bullish', 'mixed', 'bearish'];
export const evidenceLevels: SandboxEvidenceLevel[] = ['low', 'medium', 'high'];
export const effectHorizons: SandboxEffectHorizon[] = ['near', 'mid', 'long'];
export const effectDirections: SandboxEffectDirection[] = ['positive', 'mixed', 'negative'];
export const validationPriorities: SandboxValidationPriority[] = ['P0', 'P1', 'P2'];
export const memoryStrengths: SandboxMemoryStrength[] = ['fresh', 'recurring', 'warning'];
