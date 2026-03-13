import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ProjectSnapshot } from '../../shared/domain';
import type { SandboxAnalysisResult } from '../../shared/sandbox';
import type { MemoryStore, SandboxMemoryRecord } from './orchestration/memoryStore';

const defaultMemoryFilePath = path.resolve(process.cwd(), 'server/data/sandbox-memory.json');
const maxRecords = 48;

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fa5]+/u)
    .filter((token) => token.length >= 2);
}

function buildProjectKey(project: ProjectSnapshot) {
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
  )
    .slice(0, 24)
    .join('_');
}

function scoreRecord(record: SandboxMemoryRecord, project: ProjectSnapshot) {
  const projectTokens = new Set(
    tokenize(
      [
        project.name,
        project.genre,
        project.ideaSummary,
        project.coreFantasy,
        project.validationGoal,
        project.targetPlayers.join(' '),
        project.referenceGames.join(' '),
      ].join(' '),
    ),
  );
  const recordTokens = tokenize([record.projectName, record.projectKey].join(' '));

  return recordTokens.reduce((score, token) => score + (projectTokens.has(token) ? 1 : 0), 0);
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
        .filter((entry) => entry.score > 0)
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
