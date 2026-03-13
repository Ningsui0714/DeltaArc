import type { TrustLevel } from '../types';
import type { UiLanguage } from '../hooks/useUiLanguage';

export function getTrustLabel(trust: TrustLevel, language: UiLanguage = 'zh') {
  const isEnglish = language === 'en';

  if (trust === 'high') {
    return isEnglish ? 'High Trust' : '高可信';
  }

  if (trust === 'medium') {
    return isEnglish ? 'Medium Trust' : '中可信';
  }

  return isEnglish ? 'Low Trust' : '低可信';
}
