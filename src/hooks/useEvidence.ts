import { useEffect, useState } from 'react';
import { initialEvidence } from '../data/mockData';
import type { EvidenceItem } from '../types';

const storageKey = 'wind-tunnel-evidence';

function readStoredEvidence() {
  if (typeof window === 'undefined') {
    return initialEvidence;
  }

  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    return initialEvidence;
  }

  try {
    const parsed = JSON.parse(saved) as EvidenceItem[];
    return Array.isArray(parsed) ? parsed : initialEvidence;
  } catch {
    return initialEvidence;
  }
}

export function useEvidence() {
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
        title: `快速记录 ${evidenceItems.length + index + 1}`,
        source: '快速粘贴',
        trust: 'medium' as const,
        summary,
        createdAt: new Date().toLocaleTimeString('zh-CN', {
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

  function loadDemoEvidence() {
    setEvidenceItems(initialEvidence);
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
    loadDemoEvidence,
    appendEvidenceItems,
    replaceEvidenceItems,
  };
}
