import type {
  SandboxAnalysisJob,
  SandboxAnalysisJobStage,
  SandboxAnalysisJobStageStatus,
  SandboxAnalysisMode,
  SandboxAnalysisResult,
} from '../../shared/sandbox';
import { buildExecutionStages } from './orchestration/executionPlan';

const jobs = new Map<string, SandboxAnalysisJob>();
const jobTtlMs = 1000 * 60 * 30;

function createJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function cloneJob(job: SandboxAnalysisJob) {
  return {
    ...job,
    stages: job.stages.map((stage) => ({ ...stage })),
  };
}

function pruneJobs() {
  const cutoff = Date.now() - jobTtlMs;

  jobs.forEach((job, id) => {
    if (Date.parse(job.updatedAt) < cutoff) {
      jobs.delete(id);
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

export function createAnalysisJob(mode: SandboxAnalysisMode) {
  pruneJobs();

  const createdAt = now();
  const stages = buildExecutionStages(mode).map<SandboxAnalysisJobStage>((stage) => ({
    ...stage,
    status: stage.key === 'dossier' ? 'pending' : 'pending',
  }));

  const job: SandboxAnalysisJob = {
    id: createJobId(),
    mode,
    status: 'queued',
    currentStageKey: 'queued',
    currentStageLabel: 'Queued',
    message: 'Waiting to start analysis.',
    createdAt,
    updatedAt: createdAt,
    stages,
  };

  jobs.set(job.id, job);

  return cloneJob(job);
}

export function getAnalysisJob(jobId: string) {
  pruneJobs();
  const job = jobs.get(jobId);
  return job ? cloneJob(job) : null;
}

export function markJobRunning(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) {
    return;
  }

  job.status = 'running';
  job.updatedAt = now();
}

export function updateAnalysisJobStage(params: {
  jobId: string;
  key: SandboxAnalysisJobStage['key'];
  label: string;
  detail: string;
  status: SandboxAnalysisJobStageStatus;
  model?: string;
  durationMs?: number;
}) {
  const job = jobs.get(params.jobId);
  if (!job) {
    return;
  }

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
    model: params.model ?? stage.model,
    durationMs: params.durationMs ?? stage.durationMs,
    startedAt: stage.startedAt ?? (params.status === 'running' ? timestamp : stage.startedAt),
    completedAt: params.status === 'completed' || params.status === 'error' ? timestamp : stage.completedAt,
  }));
}

export function completeAnalysisJob(jobId: string, result: SandboxAnalysisResult) {
  const job = jobs.get(jobId);
  if (!job) {
    return;
  }

  const timestamp = now();
  job.status = 'completed';
  job.currentStageKey = 'complete';
  job.currentStageLabel = 'Complete';
  job.message = 'Analysis finished.';
  job.updatedAt = timestamp;
  job.result = result;
  job.stages = updateStage(job.stages, 'complete', (stage) => ({
    ...stage,
    status: 'completed',
    startedAt: stage.startedAt ?? timestamp,
    completedAt: timestamp,
  }));
}

export function failAnalysisJob(jobId: string, errorMessage: string) {
  const job = jobs.get(jobId);
  if (!job) {
    return;
  }

  job.status = 'error';
  job.error = errorMessage;
  job.message = errorMessage;
  job.updatedAt = now();
}
