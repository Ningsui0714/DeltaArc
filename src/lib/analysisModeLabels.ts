import type { SandboxAnalysisMode } from '../../shared/sandbox';
import type { UiLanguage } from '../hooks/useUiLanguage';

export function getAnalysisModeLabel(
  mode: SandboxAnalysisMode,
  language: UiLanguage = 'zh',
) {
  if (language === 'en') {
    return mode === 'reasoning' ? 'Deep Dive' : 'Quick Scan';
  }

  return mode === 'reasoning' ? '深度推演' : '快速扫描';
}
