import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ProjectSnapshot } from '../../shared/domain';
import type { SandboxAnalysisResult } from '../../shared/sandbox';
import type { MemoryStore, SandboxMemoryRecord } from './orchestration/memoryStore';

const defaultMemoryFilePath = path.resolve(process.cwd(), 'server/data/sandbox-memory.json');
const maxRecords = 48;
const minRelevantMemoryScore = 4;
const genericMemoryTokens = new Set([
  'can',
  'concept',
  'core',
  'current',
  'game',
  'games',
  'idea',
  'live',
  'loop',
  'mode',
  'player',
  'players',
  'project',
  'prototype',
  'risk',
  'summary',
  'support',
  'validate',
  'validation',
  'verify',
  'whether',
]);

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fa5]+/u)
    .filter((token) => token.length >= 2 && !genericMemoryTokens.has(token));
}

function normalizeComparableText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildProjectTokens(project: ProjectSnapshot) {
  return tokenize(
    [
      project.name,
      project.genre,
      project.ideaSummary,
      project.coreFantasy,
      project.validationGoal,
      project.targetPlayers.join(' '),
      project.referenceGames.join(' '),
    ].join(' '),
  );
}

function buildProjectKey(project: ProjectSnapshot) {
  return buildProjectTokens(project)
    .slice(0, 24)
    .join('_');
}

function scoreRecord(record: SandboxMemoryRecord, project: ProjectSnapshot) {
  const projectTokens = new Set(buildProjectTokens(project));
  const recordTokens = new Set(tokenize([record.projectName, record.projectKey].join(' ')));
  let score = 0;

  if (
    project.name.trim().length > 0 &&
    normalizeComparableText(record.projectName) === normalizeComparableText(project.name)
  ) {
    score += 12;
  }

  recordTokens.forEach((token) => {
    if (projectTokens.has(token)) {
      score += 1;
    }
  });

  return score;
}

function buildMemoryRecord(project: ProjectSnapshot, analysis: SandboxAnalysisResult): SandboxMemoryRecord {
  return {
    id: `memory_${Date.now()}`,
    projectKey: buildProjectKey(project),
    projectName: project.name || 'Untitled project',
    createdAt: analysis.generatedAt,
    verdict: analysis.systemVerdict,
    primaryRisk: analysis.primaryRisk,
    summary: analysis.summary,
    blindSpots: analysis.blindSpots.slice(0, 3).map((item) => item.area),
    validationFocus: analysis.validationTracks.slice(0, 3).map((item) => item.goal),
    contrarianMoves: analysis.contrarianMoves.slice(0, 2).map((item) => item.title),
  };
}

export function createJsonMemoryStore(memoryFilePath = defaultMemoryFilePath): MemoryStore {
  let persistQueue: Promise<unknown> = Promise.resolve();

  async function readMemoryRecords() {
    try {
      const content = await readFile(memoryFilePath, 'utf8');
      const parsed = JSON.parse(content) as SandboxMemoryRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async function writeMemoryRecords(records: SandboxMemoryRecord[]) {
    await mkdir(path.dirname(memoryFilePath), { recursive: true });
    await writeFile(memoryFilePath, JSON.stringify(records.slice(-maxRecords), null, 2), 'utf8');
  }

  function enqueuePersist<T>(task: () => Promise<T>) {
    const next = persistQueue.then(task, task);
    persistQueue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  return {
    async loadRelevant(project) {
      const projectKey = buildProjectKey(project);
      const records = await readMemoryRecords();

      return records
        .map((record) => ({
          record,
          score: record.projectKey === projectKey ? 99 : scoreRecord(record, project),
        }))
        .filter((entry) => entry.score >= minRelevantMemoryScore)
        .sort((left, right) => right.score - left.score)
        .slice(0, 4)
        .map((entry) => entry.record);
    },
    persist(project, analysis) {
      return enqueuePersist(async () => {
        const records = await readMemoryRecords();
        const nextRecord = buildMemoryRecord(project, analysis);
        const deduped = records.filter(
          (record) =>
            !(
              record.projectKey === nextRecord.projectKey &&
              record.summary === nextRecord.summary &&
              record.primaryRisk === nextRecord.primaryRisk
            ),
        );

        await writeMemoryRecords([...deduped, nextRecord]);
      });
    },
  };
}

const defaultMemoryStore = createJsonMemoryStore();

export async function loadRelevantMemories(project: ProjectSnapshot) {
  return defaultMemoryStore.loadRelevant(project);
}

export function persistAnalysisMemory(project: ProjectSnapshot, analysis: SandboxAnalysisResult) {
  return defaultMemoryStore.persist(project, analysis);
}

export const jsonMemoryStore: MemoryStore = defaultMemoryStore;
