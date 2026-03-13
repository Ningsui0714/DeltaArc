import { useEffect, useState } from 'react';
import { initialEvidence } from '../data/mockData';
import { isEnglishUi, useUiLanguage } from './useUiLanguage';
import type { EvidenceItem } from '../types';

const storageKey = 'wind-tunnel-evidence';

function isDemoEvidence(items: EvidenceItem[]) {
  return JSON.stringify(items) === JSON.stringify(initialEvidence);
}

function readStoredEvidence() {
  if (typeof window === 'undefined') {
    return [];
  }

  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved) as EvidenceItem[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return isDemoEvidence(parsed) ? [] : parsed;
  } catch {
    return [];
  }
}

export function useEvidence() {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>(readStoredEvidence);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(evidenceItems));
  }, [evidenceItems]);

  function addEvidenceEntries(lines: string[]) {
    const entries = lines
      .map((line) => line.trim())
      .filter(Boolean)
      .map((summary, index) => ({
        id: `evi_${Date.now()}_${index}`,
        type: 'note' as const,
        title: isEnglish ? `Quick Note ${evidenceItems.length + index + 1}` : `快速记录 ${evidenceItems.length + index + 1}`,
        source: isEnglish ? 'Quick Paste' : '快速粘贴',
        trust: 'medium' as const,
        summary,
        createdAt: new Date().toLocaleTimeString(isEnglish ? 'en-US' : 'zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      }));

    if (entries.length === 0) {
      return 0;
    }

    setEvidenceItems((current) => [...entries, ...current]);
    return entries.length;
  }

  function clearEvidence() {
    setEvidenceItems([]);
  }

  function appendEvidenceItems(nextItems: EvidenceItem[]) {
    if (nextItems.length === 0) {
      return;
    }

    setEvidenceItems((current) => [...nextItems, ...current]);
  }

  function replaceEvidenceItems(nextItems: EvidenceItem[]) {
    setEvidenceItems(nextItems);
  }

  return {
    evidenceItems,
    addEvidenceEntries,
    clearEvidence,
    appendEvidenceItems,
    replaceEvidenceItems,
  };
}
