import type {
  VariableImpactScanJob,
  VariableImpactScanJobStage,
  VariableImpactScanJobStageStatus,
  VariableImpactScanRequest,
} from '../../shared/variableSandbox';
import type { PersistedImpactScanResultRecord } from './projectTruthStore';

const jobs = new Map<string, VariableImpactScanJob>();
const latestJobIdsByScope = new Map<string, string>();
const jobTtlMs = 1000 * 60 * 30;

function now() {
  return new Date().toISOString();
}

function createJobId() {
  return `impact_scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildStages(): VariableImpactScanJobStage[] {
  return [
    {
      key: 'queued',
      label: 'Queued',
      detail: 'Waiting to start impact scan.',
      status: 'pending',
    },
    {
      key: 'baseline_read',
      label: 'Read Baseline',
      detail: 'Loading the frozen baseline.',
      status: 'pending',
    },
    {
      key: 'impact_scan',
      label: 'Impact Scan',
      detail: 'Synthesizing direct effects, guardrails, and validation moves.',
      status: 'pending',
    },
    {
      key: 'complete',
      label: 'Complete',
      detail: 'Impact scan finished.',
      status: 'pending',
    },
  ];
}

function buildCompletedStages(record: PersistedImpactScanResultRecord): VariableImpactScanJobStage[] {
  return [
    {
      key: 'queued',
      label: 'Queued',
      detail: 'Waiting to start impact scan.',
      status: 'completed',
      startedAt: record.createdAt,
      completedAt: record.createdAt,
    },
    {
      key: 'baseline_read',
      label: 'Read Baseline',
      detail: 'Frozen baseline loaded.',
      status: 'completed',
      startedAt: record.createdAt,
      completedAt: record.createdAt,
    },
    {
      key: 'impact_scan',
      label: 'Impact Scan',
      detail: 'Direct effects and guardrails are ready.',
      status: 'completed',
      startedAt: record.createdAt,
      completedAt: record.completedAt,
    },
    {
      key: 'complete',
      label: 'Complete',
      detail: 'Impact scan finished.',
      status: 'completed',
      startedAt: record.completedAt,
      completedAt: record.completedAt,
    },
  ];
}

function cloneStages(stages: VariableImpactScanJobStage[]) {
  return stages.map((stage) => ({ ...stage }));
}

function cloneJob(job: VariableImpactScanJob): VariableImpactScanJob {
  return {
    ...job,
    variable: job.variable
      ? {
          ...job.variable,
          injectionTargets: [...job.variable.injectionTargets],
          expectedBenefits: [...job.variable.expectedBenefits],
          knownCosts: [...job.variable.knownCosts],
          dependencies: [...job.variable.dependencies],
          successSignals: [...job.variable.successSignals],
          failureSignals: [...job.variable.failureSignals],
        }
      : undefined,
    stages: cloneStages(job.stages),
    result: job.result
      ? {
          ...job.result,
          baselineRead: {
            ...job.result.baselineRead,
            scores: { ...job.result.baselineRead.scores },
          },
          impactScan: job.result.impactScan.map((item) => ({ ...item })),
          affectedPersonas: job.result.affectedPersonas.map((item) => ({ ...item })),
          guardrails: job.result.guardrails.map((item) => ({ ...item })),
          validationPlan: job.result.validationPlan.map((item) => ({ ...item })),
          assumptions: [...job.result.assumptions],
          warnings: [...job.result.warnings],
        }
      : undefined,
  };
}

function pruneJobs() {
  const cutoff = Date.now() - jobTtlMs;

  jobs.forEach((job, id) => {
    if (Date.parse(job.updatedAt) < cutoff) {
      jobs.delete(id);

      const scopeKey = `${job.workspaceId}:${job.baselineId}`;
      if (latestJobIdsByScope.get(scopeKey) === id) {
        latestJobIdsByScope.delete(scopeKey);
      }
    }
  });
}

function updateStage(
  stages: VariableImpactScanJobStage[],
  key: VariableImpactScanJobStage['key'],
  updater: (stage: VariableImpactScanJobStage) => VariableImpactScanJobStage,
) {
  return stages.map((stage) => (stage.key === key ? updater(stage) : stage));
}

export function createVariableImpactScanJob(
  workspaceId: string,
  request: VariableImpactScanRequest,
) {
  pruneJobs();

  const createdAt = now();
  const job: VariableImpactScanJob = {
    id: createJobId(),
    workspaceId,
    baselineId: request.baselineId,
    variableId: request.variable.id,
    variable: {
      ...request.variable,
      injectionTargets: [...request.variable.injectionTargets],
      expectedBenefits: [...request.variable.expectedBenefits],
      knownCosts: [...request.variable.knownCosts],
      dependencies: [...request.variable.dependencies],
      successSignals: [...request.variable.successSignals],
      failureSignals: [...request.variable.failureSignals],
    },
    mode: request.mode,
    status: 'queued',
    currentStageKey: 'queued',
    currentStageLabel: 'Queued',
    message: 'Waiting to start impact scan.',
    createdAt,
    updatedAt: createdAt,
    stages: buildStages(),
  };

  jobs.set(job.id, job);
  latestJobIdsByScope.set(`${workspaceId}:${request.baselineId}`, job.id);
  return cloneJob(job);
}

export function getVariableImpactScanJob(jobId: string) {
  pruneJobs();
  const job = jobs.get(jobId);
  return job ? cloneJob(job) : null;
}

export function hasVariableImpactScanJob(jobId: string) {
  pruneJobs();
  return jobs.has(jobId);
}

export function getLatestOpenVariableImpactScanJob(
  workspaceId: string,
  baselineId: string,
) {
  pruneJobs();
  const scopeKey = `${workspaceId}:${baselineId}`;
  const latestJobId = latestJobIdsByScope.get(scopeKey);

  if (!latestJobId) {
    return null;
  }

  const job = jobs.get(latestJobId);

  if (!job) {
    latestJobIdsByScope.delete(scopeKey);
    return null;
  }

  if (job.status === 'completed') {
    return null;
  }

  return cloneJob(job);
}

export function buildPersistedVariableImpactScanJob(
  record: PersistedImpactScanResultRecord,
): VariableImpactScanJob {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    baselineId: record.baselineId,
    variableId: record.variableId,
    variable: {
      ...record.variable,
      injectionTargets: [...record.variable.injectionTargets],
      expectedBenefits: [...record.variable.expectedBenefits],
      knownCosts: [...record.variable.knownCosts],
      dependencies: [...record.variable.dependencies],
      successSignals: [...record.variable.successSignals],
      failureSignals: [...record.variable.failureSignals],
    },
    mode: record.mode,
    status: 'completed',
    currentStageKey: 'complete',
    currentStageLabel: 'Complete',
    message: 'Impact scan finished.',
    createdAt: record.createdAt,
    updatedAt: record.completedAt,
    stages: buildCompletedStages(record),
    result: record.result,
  };
}

export function markVariableImpactScanJobRunning(jobId: string) {
  const job = jobs.get(jobId);

  if (!job) {
    return;
  }

  const timestamp = now();
  job.status = 'running';
  job.currentStageKey = 'baseline_read';
  job.currentStageLabel = 'Read Baseline';
  job.message = 'Loading the frozen baseline.';
  job.updatedAt = timestamp;
  job.error = undefined;
  job.stages = updateStage(job.stages, 'queued', (stage) => ({
    ...stage,
    status: 'completed',
    startedAt: stage.startedAt ?? timestamp,
    completedAt: timestamp,
  }));
  job.stages = updateStage(job.stages, 'baseline_read', (stage) => ({
    ...stage,
    status: 'running',
    startedAt: stage.startedAt ?? timestamp,
  }));
}

export function updateVariableImpactScanStage(params: {
  jobId: string;
  key: VariableImpactScanJobStage['key'];
  label: string;
  detail: string;
  status: VariableImpactScanJobStageStatus;
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
    detail: params.detail,
    status: params.status,
    startedAt: stage.startedAt ?? (params.status === 'running' ? timestamp : stage.startedAt),
    completedAt:
      params.status === 'completed' || params.status === 'error'
        ? timestamp
        : stage.completedAt,
  }));
}

export function completeVariableImpactScanJob(
  jobId: string,
  result: VariableImpactScanJob['result'],
) {
  const job = jobs.get(jobId);

  if (!job || !result) {
    return;
  }

  const timestamp = now();
  job.status = 'completed';
  job.currentStageKey = 'complete';
  job.currentStageLabel = 'Complete';
  job.message = 'Impact scan finished.';
  job.updatedAt = timestamp;
  job.result = result;
  job.error = undefined;
  job.stages = updateStage(job.stages, 'complete', (stage) => ({
    ...stage,
    status: 'completed',
    startedAt: stage.startedAt ?? timestamp,
    completedAt: timestamp,
  }));
}

export function failVariableImpactScanJob(jobId: string, errorMessage: string) {
  const job = jobs.get(jobId);

  if (!job) {
    return;
  }

  const timestamp = now();
  job.status = 'error';
  job.error = errorMessage;
  job.message = errorMessage;
  job.updatedAt = timestamp;
  job.stages = updateStage(job.stages, job.currentStageKey, (stage) => ({
    ...stage,
    detail: errorMessage,
    status: 'error',
    completedAt: timestamp,
  }));
}

export function clearVariableImpactScanJobsForWorkspace(workspaceId: string) {
  jobs.forEach((job, id) => {
    if (job.workspaceId === workspaceId) {
      jobs.delete(id);
    }
  });

  latestJobIdsByScope.forEach((jobId, scopeKey) => {
    const [scopeWorkspaceId] = scopeKey.split(':');

    if (scopeWorkspaceId === workspaceId) {
      latestJobIdsByScope.delete(scopeKey);
    } else if (!jobs.has(jobId)) {
      latestJobIdsByScope.delete(scopeKey);
    }
  });
}

export function resetVariableImpactScanJobStoreForTests() {
  jobs.clear();
  latestJobIdsByScope.clear();
}
