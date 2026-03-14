import type {
  LatestActiveSandboxAnalysisJob,
  LatestRetryableSandboxAnalysisJob,
  SandboxAnalysisJob,
  SandboxAnalysisJobStage,
  SandboxAnalysisJobStageStatus,
  SandboxAnalysisMode,
  SandboxAnalysisRequest,
  SandboxAnalysisResult,
  SandboxAnalysisResumeStageKey,
  SandboxAnalysisStagePreview,
} from '../../shared/sandbox';
import { createWorkspaceInputSignature } from '../../shared/variableSandbox';
import {
  cloneCheckpointState,
  createEmptyCheckpointState,
  getCachedStageKeys,
  type AnalysisCheckpointState,
} from './orchestration/checkpoints';
import { buildExecutionStages } from './orchestration/executionPlan';

type AnalysisJobRecord = {
  job: SandboxAnalysisJob;
  request: SandboxAnalysisRequest;
  checkpoints: AnalysisCheckpointState;
  startStageKey: SandboxAnalysisResumeStageKey;
};

const jobs = new Map<string, AnalysisJobRecord>();
const latestJobIdsByWorkspace = new Map<string, string>();
const jobTtlMs = 1000 * 60 * 30;

function createJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function cloneStages(stages: SandboxAnalysisJobStage[]) {
  return stages.map((stage) => ({
    ...stage,
    preview: stage.preview
      ? {
          ...stage.preview,
          bullets: [...stage.preview.bullets],
        }
      : undefined,
  }));
}

function cloneAnalysisMeta(meta: SandboxAnalysisResult['meta']) {
  return {
    ...meta,
    dossierSelection: meta.dossierSelection
      ? {
          ...meta.dossierSelection,
          rankings: meta.dossierSelection.rankings.map((item) => ({ ...item })),
        }
      : undefined,
    actionBriefSelection: meta.actionBriefSelection
      ? {
          ...meta.actionBriefSelection,
          rankings: meta.actionBriefSelection.rankings.map((item) => ({ ...item })),
        }
      : undefined,
    reverseCheck: meta.reverseCheck
      ? {
          ...meta.reverseCheck,
          necessaryConditions: meta.reverseCheck.necessaryConditions.map((item) => ({
            ...item,
            evidenceRefs: [...item.evidenceRefs],
          })),
        }
      : undefined,
  };
}

function cloneJob(job: SandboxAnalysisJob) {
  return {
    ...job,
    cachedStageKeys: job.cachedStageKeys ? [...job.cachedStageKeys] : undefined,
    stages: cloneStages(job.stages),
    result: job.result
      ? {
          ...job.result,
          pipeline: [...job.result.pipeline],
          meta: cloneAnalysisMeta(job.result.meta),
          scores: { ...job.result.scores },
          personas: job.result.personas.map((item) => ({ ...item })),
          hypotheses: job.result.hypotheses.map((item) => ({ ...item })),
          strategies: job.result.strategies.map((item) => ({ ...item })),
          perspectives: job.result.perspectives.map((item) => ({ ...item, evidenceRefs: [...item.evidenceRefs] })),
          blindSpots: job.result.blindSpots.map((item) => ({ ...item })),
          secondOrderEffects: job.result.secondOrderEffects.map((item) => ({ ...item })),
          scenarioVariants: job.result.scenarioVariants.map((item) => ({ ...item, watchSignals: [...item.watchSignals] })),
          futureTimeline: job.result.futureTimeline.map((item) => ({ ...item, watchSignals: [...item.watchSignals] })),
          communityRhythms: job.result.communityRhythms.map((item) => ({ ...item })),
          trajectorySignals: job.result.trajectorySignals.map((item) => ({ ...item })),
          decisionLenses: job.result.decisionLenses.map((item) => ({ ...item })),
          validationTracks: job.result.validationTracks.map((item) => ({ ...item })),
          contrarianMoves: job.result.contrarianMoves.map((item) => ({ ...item })),
          unknowns: job.result.unknowns.map((item) => ({ ...item })),
          redTeam: {
            ...job.result.redTeam,
            attackVectors: [...job.result.redTeam.attackVectors],
            failureModes: [...job.result.redTeam.failureModes],
          },
          memorySignals: job.result.memorySignals.map((item) => ({ ...item })),
          report: {
            ...job.result.report,
            actions: [...job.result.report.actions],
          },
          warnings: [...job.result.warnings],
        }
      : undefined,
  };
}

function pruneJobs() {
  const cutoff = Date.now() - jobTtlMs;

  jobs.forEach((record, id) => {
    if (Date.parse(record.job.updatedAt) < cutoff) {
      jobs.delete(id);

      if (latestJobIdsByWorkspace.get(record.request.workspaceId) === id) {
        latestJobIdsByWorkspace.delete(record.request.workspaceId);
      }
    }
  });
}

function updateStage(
  stages: SandboxAnalysisJobStage[],
  key: SandboxAnalysisJobStage['key'],
  updater: (stage: SandboxAnalysisJobStage) => SandboxAnalysisJobStage,
) {
  return stages.map((stage) => (stage.key === key ? updater(stage) : stage));
}

function getStageByKey(stages: SandboxAnalysisJobStage[], key: SandboxAnalysisJobStage['key']) {
  return stages.find((stage) => stage.key === key);
}

function buildJobStages(
  mode: SandboxAnalysisMode,
  resumeStages?: SandboxAnalysisJobStage[],
) {
  const resumeStageMap = new Map((resumeStages ?? []).map((stage) => [stage.key, stage]));

  return buildExecutionStages(mode).map<SandboxAnalysisJobStage>((stage) => {
    const cachedStage = resumeStageMap.get(stage.key);

    if (cachedStage?.status === 'completed' && stage.key !== 'complete') {
      return {
        ...stage,
        status: 'completed',
        preview: cachedStage.preview
          ? {
              ...cachedStage.preview,
              bullets: [...cachedStage.preview.bullets],
            }
          : undefined,
        model: cachedStage.model,
        durationMs: cachedStage.durationMs,
        startedAt: cachedStage.startedAt,
        completedAt: cachedStage.completedAt,
      };
    }

    return {
      ...stage,
      status: 'pending',
    };
  });
}

export function createAnalysisJob(
  request: SandboxAnalysisRequest,
  options?: {
    startStageKey?: SandboxAnalysisResumeStageKey;
    resumeCheckpoints?: AnalysisCheckpointState;
    resumeStages?: SandboxAnalysisJobStage[];
    resumedFromJobId?: string;
  },
) {
  pruneJobs();

  const createdAt = now();
  const startStageKey = options?.startStageKey ?? 'dossier';
  const checkpoints = cloneCheckpointState(options?.resumeCheckpoints ?? createEmptyCheckpointState());
  const job: SandboxAnalysisJob = {
    id: createJobId(),
    mode: request.mode,
    status: 'queued',
    currentStageKey: 'queued',
    currentStageLabel: 'Queued',
    message: 'Waiting to start analysis.',
    createdAt,
    updatedAt: createdAt,
    retryable: false,
    resumeFromStageKey: startStageKey,
    resumedFromJobId: options?.resumedFromJobId,
    cachedStageKeys: getCachedStageKeys(checkpoints),
    stages: buildJobStages(request.mode, options?.resumeStages),
  };

  jobs.set(job.id, {
    job,
    request,
    checkpoints,
    startStageKey,
  });
  latestJobIdsByWorkspace.set(request.workspaceId, job.id);

  return cloneJob(job);
}

export function getAnalysisJob(jobId: string) {
  pruneJobs();
  const record = jobs.get(jobId);
  return record ? cloneJob(record.job) : null;
}

export function hasAnalysisJob(jobId: string) {
  pruneJobs();
  return jobs.has(jobId);
}

export function getAnalysisJobRetryContext(jobId: string) {
  pruneJobs();
  const record = jobs.get(jobId);

  if (!record?.job.retryable || !record.job.resumeFromStageKey) {
    return null;
  }

  return {
    request: record.request,
    checkpoints: cloneCheckpointState(record.checkpoints),
    resumeFromStageKey: record.job.resumeFromStageKey,
    resumeStages: cloneStages(record.job.stages),
  };
}

export function getLatestRetryableAnalysisJob(
  workspaceId: string,
): LatestRetryableSandboxAnalysisJob | null {
  pruneJobs();
  const latestJobId = latestJobIdsByWorkspace.get(workspaceId);

  if (!latestJobId) {
    return null;
  }

  const record = jobs.get(latestJobId);

  if (!record) {
    latestJobIdsByWorkspace.delete(workspaceId);
    return null;
  }

  if (record.job.status !== 'error' || !record.job.retryable) {
    return null;
  }

  return {
    job: cloneJob(record.job),
    inputSignature: createWorkspaceInputSignature(
      record.request.project,
      record.request.evidenceItems,
    ),
  };
}

export function getLatestActiveAnalysisJob(
  workspaceId: string,
): LatestActiveSandboxAnalysisJob | null {
  pruneJobs();
  const latestJobId = latestJobIdsByWorkspace.get(workspaceId);

  if (!latestJobId) {
    return null;
  }

  const record = jobs.get(latestJobId);

  if (!record) {
    latestJobIdsByWorkspace.delete(workspaceId);
    return null;
  }

  if (record.job.status !== 'queued' && record.job.status !== 'running') {
    return null;
  }

  return {
    job: cloneJob(record.job),
    inputSignature: createWorkspaceInputSignature(
      record.request.project,
      record.request.evidenceItems,
    ),
  };
}

export function markJobRunning(jobId: string) {
  const record = jobs.get(jobId);
  if (!record) {
    return;
  }

  const { job, startStageKey } = record;
  const timestamp = now();
  const startingStage = getStageByKey(job.stages, startStageKey);

  job.status = 'running';
  job.currentStageKey = startStageKey;
  job.currentStageLabel = startingStage?.label ?? startStageKey;
  job.message = startingStage?.detail ?? 'Starting analysis.';
  job.updatedAt = timestamp;
  job.error = undefined;
  job.retryable = false;

  job.stages = updateStage(job.stages, startStageKey, (stage) => ({
    ...stage,
    status: stage.status === 'completed' ? stage.status : 'running',
    startedAt: stage.startedAt ?? timestamp,
  }));
}

export function updateAnalysisJobStage(params: {
  jobId: string;
  key: SandboxAnalysisJobStage['key'];
  label: string;
  detail: string;
  status: SandboxAnalysisJobStageStatus;
  preview?: SandboxAnalysisStagePreview;
  model?: string;
  durationMs?: number;
}) {
  const record = jobs.get(params.jobId);
  if (!record) {
    return;
  }

  const job = record.job;
  const timestamp = now();
  if (job.status !== 'completed' && job.status !== 'error') {
    job.status = 'running';
  }
  job.currentStageKey = params.key;
  job.currentStageLabel = params.label;
  job.message = params.detail;
  job.updatedAt = timestamp;
  job.stages = updateStage(job.stages, params.key, (stage) => ({
    ...stage,
    status: params.status,
    detail: params.detail,
    preview: params.preview ?? stage.preview,
    model: params.model ?? stage.model,
    durationMs: params.durationMs ?? stage.durationMs,
    startedAt: stage.startedAt ?? (params.status === 'running' ? timestamp : stage.startedAt),
    completedAt: params.status === 'completed' || params.status === 'error' ? timestamp : stage.completedAt,
  }));
}

export function completeAnalysisJob(jobId: string, result: SandboxAnalysisResult) {
  const record = jobs.get(jobId);
  if (!record) {
    return;
  }

  const job = record.job;
  const timestamp = now();
  job.status = 'completed';
  job.currentStageKey = 'complete';
  job.currentStageLabel = 'Complete';
  job.message = 'Analysis finished.';
  job.updatedAt = timestamp;
  job.result = result;
  job.error = undefined;
  job.retryable = false;
  job.stages = updateStage(job.stages, 'complete', (stage) => ({
    ...stage,
    status: 'completed',
    startedAt: stage.startedAt ?? timestamp,
    completedAt: timestamp,
  }));
}

export function failAnalysisJob(
  jobId: string,
  errorMessage: string,
  options?: {
    failedStageKey?: SandboxAnalysisResumeStageKey;
    failedStageLabel?: string;
    result?: SandboxAnalysisResult | null;
    retryable?: boolean;
    resumeFromStageKey?: SandboxAnalysisResumeStageKey;
    checkpoints?: AnalysisCheckpointState;
  },
) {
  const record = jobs.get(jobId);
  if (!record) {
    return;
  }

  const { job } = record;
  const timestamp = now();
  job.status = 'error';
  job.error = errorMessage;
  job.message = errorMessage;
  job.updatedAt = timestamp;
  job.retryable = options?.retryable ?? false;
  job.resumeFromStageKey = options?.resumeFromStageKey ?? job.resumeFromStageKey;

  if (options?.result) {
    job.result = options.result;
  }

  if (options?.checkpoints) {
    record.checkpoints = cloneCheckpointState(options.checkpoints);
    job.cachedStageKeys = getCachedStageKeys(options.checkpoints);
  }

  if (options?.failedStageKey) {
    const failedStage = getStageByKey(job.stages, options.failedStageKey);
    job.currentStageKey = options.failedStageKey;
    job.currentStageLabel = options?.failedStageLabel ?? failedStage?.label ?? options.failedStageKey;
    job.stages = updateStage(job.stages, options.failedStageKey, (stage) => ({
      ...stage,
      detail: errorMessage,
      status: 'error',
      completedAt: timestamp,
    }));
  }
}

export function clearAnalysisJobsForWorkspace(workspaceId: string) {
  jobs.forEach((record, id) => {
    if (record.request.workspaceId === workspaceId) {
      jobs.delete(id);
    }
  });

  latestJobIdsByWorkspace.delete(workspaceId);
}

export function resetAnalysisJobStoreForTests() {
  jobs.clear();
  latestJobIdsByWorkspace.clear();
}
