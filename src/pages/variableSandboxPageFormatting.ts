import type { FrozenBaseline } from '../../shared/variableSandbox';
import type { UiLanguage } from '../hooks/useUiLanguage';

export function formatVariableSandboxTimestamp(
  value: string,
  language: UiLanguage,
) {
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

export function formatBaselineSourceStatus(
  sourceStatus: FrozenBaseline['sourceAnalysisStatus'],
  language: UiLanguage,
) {
  if (language === 'en') {
    return sourceStatus === 'degraded' ? 'Degraded result' : 'Fresh result';
  }

  return sourceStatus === 'degraded' ? '降级结果' : '最新结果';
}
