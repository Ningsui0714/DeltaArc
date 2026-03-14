import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { EvidenceItem, ProjectSnapshot } from '../../shared/domain';
import type { SandboxAnalysisMode, SandboxAnalysisResult } from '../../shared/sandbox';
import {
  createWorkspaceInputSignature,
  type DesignVariableV1,
  type FrozenBaseline,
  type PersistedLatestAnalysis,
  type VariableImpactScanResult,
} from '../../shared/variableSandbox';
import {
  parseDesignVariableV1,
  parseFrozenBaseline,
  parsePersistedLatestAnalysis,
  parseVariableImpactScanResult,
  requireRecord,
  requireString,
} from '../../shared/schema';

const defaultProjectsRoot = path.resolve(process.cwd(), 'server/data/projects');

export class ProjectTruthStoreConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectTruthStoreConflictError';
  }
}

function now() {
  return new Date().toISOString();
}

function createBaselineId() {
  return `baseline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizePathToken(value: string, label: string) {
  const trimmed = value.trim();

  if (!trimmed || !/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    throw new Error(`${label} is invalid.`);
  }

  return trimmed;
}

async function readJsonFile<TValue>(
  filePath: string,
  parser: (input: unknown) => TValue,
): Promise<TValue | null> {
  try {
    const content = await readFile(filePath, 'utf8');
    return parser(JSON.parse(content));
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'ENOENT'
    ) {
      return null;
    }

    throw error;
  }
}

async function writeJsonFile(filePath: string, payload: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

function buildBaselineAnalysisSnapshot(
  analysis: SandboxAnalysisResult,
): FrozenBaseline['analysisSnapshot'] {
  return {
    summary: analysis.summary,
    systemVerdict: analysis.systemVerdict,
    evidenceLevel: analysis.evidenceLevel,
    primaryRisk: analysis.primaryRisk,
    nextStep: analysis.nextStep,
    scores: { ...analysis.scores },
    personas: analysis.personas.map((item) => ({ ...item })),
    hypotheses: analysis.hypotheses.map((item) => ({ ...item })),
    perspectives: analysis.perspectives.map((item) => ({
      ...item,
      evidenceRefs: [...item.evidenceRefs],
    })),
    blindSpots: analysis.blindSpots.map((item) => ({ ...item })),
    validationTracks: analysis.validationTracks.map((item) => ({ ...item })),
    warnings: [...analysis.warnings],
  };
}

function getRunOrder(record: PersistedLatestAnalysis) {
  const runStartedAt = record.runStartedAt ?? record.analysis.generatedAt ?? record.updatedAt;
  const analysisJobId = record.analysisJobId ?? `legacy:${record.analysis.meta.requestId}`;

  return {
    runStartedAt,
    analysisJobId,
  };
}

function compareRunOrder(
  left: {
    runStartedAt: string;
    analysisJobId: string;
  },
  right: {
    runStartedAt: string;
    analysisJobId: string;
  },
) {
  if (left.runStartedAt !== right.runStartedAt) {
    return left.runStartedAt.localeCompare(right.runStartedAt);
  }

  return left.analysisJobId.localeCompare(right.analysisJobId);
}

type PersistedImpactScanRecord = {
  id: string;
  workspaceId: string;
  baselineId: string;
  variableId: string;
  mode: SandboxAnalysisMode;
  createdAt: string;
  variable: DesignVariableV1;
};

export type PersistedImpactScanResultRecord = PersistedImpactScanRecord & {
  completedAt: string;
  result: VariableImpactScanResult;
};

function parsePersistedImpactScanResultRecord(
  input: unknown,
): PersistedImpactScanResultRecord {
  const record = requireRecord(input, 'persisted impact scan result');

  return {
    id: requireString(record.id, 'id'),
    workspaceId: requireString(record.workspaceId, 'workspaceId'),
    baselineId: requireString(record.baselineId, 'baselineId'),
    variableId: requireString(record.variableId, 'variableId'),
    mode:
      requireString(record.mode, 'mode') === 'reasoning'
        ? 'reasoning'
        : 'balanced',
    createdAt: requireString(record.createdAt, 'createdAt'),
    completedAt: requireString(record.completedAt, 'completedAt'),
    variable: parseDesignVariableV1(record.variable),
    result: parseVariableImpactScanResult(record.result),
  };
}

function comparePersistedImpactScans(
  left: PersistedImpactScanResultRecord,
  right: PersistedImpactScanResultRecord,
) {
  const completedOrder = Date.parse(right.completedAt) - Date.parse(left.completedAt);
  if (completedOrder !== 0) {
    return completedOrder;
  }

  const createdOrder = Date.parse(right.createdAt) - Date.parse(left.createdAt);
  if (createdOrder !== 0) {
    return createdOrder;
  }

  return right.id.localeCompare(left.id);
}

export function createProjectTruthStore(projectsRoot = defaultProjectsRoot) {
  let writeQueue: Promise<unknown> = Promise.resolve();

  function getWorkspaceDir(workspaceId: string) {
    return path.join(projectsRoot, sanitizePathToken(workspaceId, 'workspaceId'));
  }

  function getLatestAnalysisPath(workspaceId: string) {
    return path.join(getWorkspaceDir(workspaceId), 'latest-analysis.json');
  }

  function getBaselinesDir(workspaceId: string) {
    return path.join(getWorkspaceDir(workspaceId), 'baselines');
  }

  function getVariablesDir(workspaceId: string) {
    return path.join(getWorkspaceDir(workspaceId), 'variables');
  }

  function getImpactScansDir(workspaceId: string) {
    return path.join(getWorkspaceDir(workspaceId), 'impact-scans');
  }

  function getVariablePath(workspaceId: string, variableId: string) {
    return path.join(
      getVariablesDir(workspaceId),
      `${sanitizePathToken(variableId, 'variableId')}.json`,
    );
  }

  function getImpactScanPath(workspaceId: string, scanId: string) {
    return path.join(
      getImpactScansDir(workspaceId),
      `${sanitizePathToken(scanId, 'scanId')}.json`,
    );
  }

  function getImpactScanResultPath(workspaceId: string, scanId: string) {
    return path.join(
      getImpactScansDir(workspaceId),
      `${sanitizePathToken(scanId, 'scanId')}.result.json`,
    );
  }

  function enqueueWrite<TValue>(task: () => Promise<TValue>) {
    const next = writeQueue.then(task, task);
    writeQueue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  return {
    async loadLatestAnalysis(workspaceId: string) {
      return readJsonFile(getLatestAnalysisPath(workspaceId), parsePersistedLatestAnalysis);
    },
    persistLatestAnalysis(params: {
      workspaceId: string;
      runStartedAt: string;
      analysisJobId: string;
      projectSnapshot: ProjectSnapshot;
      evidenceSnapshot: EvidenceItem[];
      analysis: SandboxAnalysisResult;
    }) {
      return enqueueWrite(async () => {
        const workspaceId = sanitizePathToken(params.workspaceId, 'workspaceId');
        const latestAnalysisPath = getLatestAnalysisPath(workspaceId);
        const existing = await readJsonFile(latestAnalysisPath, parsePersistedLatestAnalysis);
        const incomingRunOrder = {
          runStartedAt: params.runStartedAt,
          analysisJobId: params.analysisJobId,
        };

        if (existing) {
          const existingRunOrder = getRunOrder(existing);

          if (compareRunOrder(incomingRunOrder, existingRunOrder) < 0) {
            return {
              persisted: false as const,
              record: existing,
            };
          }
        }

        const record: PersistedLatestAnalysis = {
          workspaceId,
          updatedAt: now(),
          runStartedAt: params.runStartedAt,
          analysisJobId: params.analysisJobId,
          inputSignature: createWorkspaceInputSignature(
            params.projectSnapshot,
            params.evidenceSnapshot,
          ),
          projectSnapshot: params.projectSnapshot,
          evidenceSnapshot: params.evidenceSnapshot,
          analysis: params.analysis,
        };

        await writeJsonFile(latestAnalysisPath, record);
        return {
          persisted: true as const,
          record,
        };
      });
    },
    freezeLatestBaseline(workspaceId: string) {
      return enqueueWrite(async () => {
        const safeWorkspaceId = sanitizePathToken(workspaceId, 'workspaceId');
        const latest = await readJsonFile(
          getLatestAnalysisPath(safeWorkspaceId),
          parsePersistedLatestAnalysis,
        );

        if (!latest) {
          throw new ProjectTruthStoreConflictError(
            'No persisted latest analysis is available to freeze yet.',
          );
        }

        if (latest.analysis.meta.source !== 'remote') {
          throw new ProjectTruthStoreConflictError(
            'Only a remote latest analysis can be frozen as a baseline.',
          );
        }

        if (latest.analysis.meta.status !== 'fresh') {
          throw new ProjectTruthStoreConflictError(
            'Only a fresh latest analysis can be frozen as a baseline.',
          );
        }

        const baseline: FrozenBaseline = {
          id: createBaselineId(),
          projectId: latest.workspaceId,
          createdAt: now(),
          sourceAnalysisRequestId: latest.analysis.meta.requestId,
          sourceAnalysisMode: latest.analysis.mode,
          sourceAnalysisGeneratedAt: latest.analysis.generatedAt,
          sourceAnalysisStatus: 'fresh',
          projectSnapshot: latest.projectSnapshot,
          evidenceSnapshot: latest.evidenceSnapshot,
          analysisSnapshot: buildBaselineAnalysisSnapshot(latest.analysis),
        };

        await writeJsonFile(
          path.join(getBaselinesDir(safeWorkspaceId), `${baseline.id}.json`),
          baseline,
        );

        return baseline;
      });
    },
    async listBaselines(workspaceId: string) {
      const baselinesDir = getBaselinesDir(workspaceId);

      try {
        const fileNames = await readdir(baselinesDir);
        const baselines = await Promise.all(
          fileNames
            .filter((fileName) => fileName.endsWith('.json'))
            .map((fileName) =>
              readJsonFile(path.join(baselinesDir, fileName), parseFrozenBaseline),
            ),
        );

        return baselines
          .filter((baseline): baseline is FrozenBaseline => baseline !== null)
          .sort(
            (left, right) =>
              Date.parse(right.createdAt) - Date.parse(left.createdAt),
          );
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: string }).code === 'ENOENT'
        ) {
          return [];
        }

        throw error;
      }
    },
    async loadBaseline(workspaceId: string, baselineId: string) {
      const safeWorkspaceId = sanitizePathToken(workspaceId, 'workspaceId');
      const safeBaselineId = sanitizePathToken(baselineId, 'baselineId');

      return readJsonFile(
        path.join(projectsRoot, safeWorkspaceId, 'baselines', `${safeBaselineId}.json`),
        parseFrozenBaseline,
      );
    },
    persistVariable(workspaceId: string, variable: DesignVariableV1) {
      return enqueueWrite(async () => {
        await writeJsonFile(getVariablePath(workspaceId, variable.id), variable);
        return variable;
      });
    },
    loadVariable(workspaceId: string, variableId: string) {
      return readJsonFile(getVariablePath(workspaceId, variableId), parseDesignVariableV1);
    },
    persistImpactScan(params: {
      workspaceId: string;
      scanId: string;
      baselineId: string;
      mode: SandboxAnalysisMode;
      variable: DesignVariableV1;
      result: VariableImpactScanResult;
    }) {
      return enqueueWrite(async () => {
        const requestRecord: PersistedImpactScanRecord = {
          id: params.scanId,
          workspaceId: sanitizePathToken(params.workspaceId, 'workspaceId'),
          baselineId: params.baselineId,
          variableId: params.variable.id,
          mode: params.mode,
          createdAt: now(),
          variable: params.variable,
        };
        const resultRecord: PersistedImpactScanResultRecord = {
          ...requestRecord,
          completedAt: now(),
          result: params.result,
        };

        await writeJsonFile(
          getImpactScanPath(requestRecord.workspaceId, params.scanId),
          requestRecord,
        );
        await writeJsonFile(
          getImpactScanResultPath(requestRecord.workspaceId, params.scanId),
          resultRecord,
        );

        return resultRecord;
      });
    },
    loadImpactScanResult(workspaceId: string, scanId: string) {
      return readJsonFile(
        getImpactScanResultPath(workspaceId, scanId),
        parsePersistedImpactScanResultRecord,
      );
    },
    async listImpactScanResults(
      workspaceId: string,
      options?: {
        baselineId?: string;
      },
    ) {
      const safeWorkspaceId = sanitizePathToken(workspaceId, 'workspaceId');
      const safeBaselineId = options?.baselineId
        ? sanitizePathToken(options.baselineId, 'baselineId')
        : null;
      const impactScansDir = getImpactScansDir(safeWorkspaceId);

      try {
        const fileNames = await readdir(impactScansDir);
        const results = await Promise.all(
          fileNames
            .filter((fileName) => fileName.endsWith('.result.json'))
            .map((fileName) =>
              readJsonFile(
                path.join(impactScansDir, fileName),
                parsePersistedImpactScanResultRecord,
              ),
            ),
        );

        return results
          .filter((record): record is PersistedImpactScanResultRecord => record !== null)
          .filter((record) => !safeBaselineId || record.baselineId === safeBaselineId)
          .sort(comparePersistedImpactScans);
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: string }).code === 'ENOENT'
        ) {
          return [];
        }

        throw error;
      }
    },
    async clearWorkspace(workspaceId: string) {
      await rm(getWorkspaceDir(workspaceId), {
        recursive: true,
        force: true,
      });
    },
  };
}

export const projectTruthStore = createProjectTruthStore();
