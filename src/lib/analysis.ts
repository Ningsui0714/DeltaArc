import type { TrustLevel } from '../types';

export function getTrustLabel(trust: TrustLevel) {
  if (trust === 'high') {
    return '高可信';
  }

  if (trust === 'medium') {
    return '中可信';
  }

  return '低可信';
}
