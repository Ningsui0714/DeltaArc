import { useEffect, useState } from 'react';
import { initialEvidence } from '../data/mockData';
import { isEnglishUi, useUiLanguage } from './useUiLanguage';
import { ensureCurrentWorkspaceStorageEpoch } from '../lib/workspaceStorage';
import type { EvidenceItem } from '../types';

const legacyEvidenceStorageKey = 'wind-tunnel-evidence';

function buildEvidenceStorageKey(workspaceId: string) {
  return `wind-tunnel-evidence:${workspaceId}`;
}

export function clearStoredEvidence(workspaceId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  ensureCurrentWorkspaceStorageEpoch();

  window.localStorage.removeItem(buildEvidenceStorageKey(workspaceId));
  window.localStorage.removeItem(legacyEvidenceStorageKey);
}

type WorkspaceEvidenceState = {
  workspaceId: string;
  evidenceItems: EvidenceItem[];
};

function isDemoEvidence(items: EvidenceItem[]) {
  return JSON.stringify(items) === JSON.stringify(initialEvidence);
}

function readStoredEvidence(workspaceId: string) {
  if (typeof window === 'undefined') {
    return [];
  }

  ensureCurrentWorkspaceStorageEpoch();

  const saved =
    window.localStorage.getItem(buildEvidenceStorageKey(workspaceId)) ??
    window.localStorage.getItem(legacyEvidenceStorageKey);
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

function readStoredEvidenceState(workspaceId: string): WorkspaceEvidenceState {
  return {
    workspaceId,
    evidenceItems: readStoredEvidence(workspaceId),
  };
}

export function useEvidence(workspaceId: string) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const [state, setState] = useState<WorkspaceEvidenceState>(() =>
    readStoredEvidenceState(workspaceId),
  );
  const evidenceItems = state.workspaceId === workspaceId ? state.evidenceItems : [];

  useEffect(() => {
    if (state.workspaceId !== workspaceId) {
      setState(readStoredEvidenceState(workspaceId));
    }
  }, [state.workspaceId, workspaceId]);

  useEffect(() => {
    if (state.workspaceId !== workspaceId) {
      return;
    }

    window.localStorage.setItem(buildEvidenceStorageKey(workspaceId), JSON.stringify(state.evidenceItems));
  }, [state, workspaceId]);

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

    setState((current) => ({
      ...current,
      evidenceItems: [...entries, ...current.evidenceItems],
    }));
    return entries.length;
  }

  function clearEvidence() {
    setState((current) => ({
      ...current,
      evidenceItems: [],
    }));
  }

  function appendEvidenceItems(nextItems: EvidenceItem[]) {
    if (nextItems.length === 0) {
      return;
    }

    setState((current) => ({
      ...current,
      evidenceItems: [...nextItems, ...current.evidenceItems],
    }));
  }

  function replaceEvidenceItems(nextItems: EvidenceItem[]) {
    setState((current) => ({
      ...current,
      evidenceItems: nextItems,
    }));
  }

  return {
    evidenceItems,
    addEvidenceEntries,
    clearEvidence,
    appendEvidenceItems,
    replaceEvidenceItems,
  };
}
