import type {
  PreflightJobStage,
  PreflightJobStageKey,
  PreflightJobStageStatus,
  PreflightSimulationJob,
  PreflightSimulationRequest,
  PreflightSimulationResult,
} from '../../../shared/preflightSimulation';

type PreflightJobRecord = {
  job: PreflightSimulationJob;
  request: PreflightSimulationRequest;
};

const jobs = new Map<string, PreflightJobRecord>();
const latestJobIdByWorkspace = new Map<string, string>();
const ttlMs = 1000 * 60 * 30;

const stageBlueprints: Array<Pick<PreflightJobStage, 'key' | 'label' | 'detail'>> = [
  {
    key: 'content_read',
    label: '读取输入材料',
    detail: '等待开始。',
  },
  {
    key: 'image_read',
    label: '读取图片 / 素材',
    detail: '等待开始。',
  },
  {
    key: 'push_model',
    label: '模拟反馈视角',
    detail: '等待开始。',
  },
  {
    key: 'reply_simulation',
    label: '生成模拟反馈',
    detail: '等待开始。',
  },
  {
    key: 'synthesis',
    label: '整理行动建议',
    detail: '等待开始。',
  },
  {
    key: 'complete',
    label: '完成',
    detail: '等待开始。',
  },
];

function now() {
  return new Date().toISOString();
}

function createJobId() {
  return `preflight_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function cloneStages(stages: PreflightJobStage[]) {
  return stages.map((stage) => ({ ...stage }));
}

function cloneResult(result: PreflightSimulationResult | undefined) {
  return result ? JSON.parse(JSON.stringify(result)) : undefined;
}

function cloneJob(job: PreflightSimulationJob): PreflightSimulationJob {
  return {
    ...job,
    stages: cloneStages(job.stages),
    result: cloneResult(job.result),
  };
}

function pruneJobs() {
  const cutoff = Date.now() - ttlMs;
  jobs.forEach((record, id) => {
    if (Date.parse(record.job.updatedAt) < cutoff) {
      jobs.delete(id);
      if (latestJobIdByWorkspace.get(record.request.workspaceId) === id) {
        latestJobIdByWorkspace.delete(record.request.workspaceId);
      }
    }
  });
}

function updateStage(
  stages: PreflightJobStage[],
  key: PreflightJobStageKey,
  updater: (stage: PreflightJobStage) => PreflightJobStage,
) {
  return stages.map((stage) => (stage.key === key ? updater(stage) : stage));
}

function buildStages() {
  return stageBlueprints.map<PreflightJobStage>((stage) => ({
    ...stage,
    status: 'pending',
  }));
}

export function createPreflightJob(request: PreflightSimulationRequest) {
  pruneJobs();
  const createdAt = now();
  const job: PreflightSimulationJob = {
    id: createJobId(),
    workspaceId: request.workspaceId,
    status: 'queued',
    currentStageKey: 'queued',
    currentStageLabel: '排队中',
    message: '等待开始模拟。',
    createdAt,
    updatedAt: createdAt,
    stages: buildStages(),
  };

  jobs.set(job.id, {
    job,
    request,
  });
  latestJobIdByWorkspace.set(request.workspaceId, job.id);

  return cloneJob(job);
}

export function getPreflightJob(jobId: string) {
  pruneJobs();
  const record = jobs.get(jobId);
  return record ? cloneJob(record.job) : null;
}

export function getLatestPreflightJob(workspaceId: string) {
  pruneJobs();
  const latestJobId = latestJobIdByWorkspace.get(workspaceId);
  if (!latestJobId) {
    return null;
  }

  const record = jobs.get(latestJobId);
  if (!record) {
    latestJobIdByWorkspace.delete(workspaceId);
    return null;
  }

  return cloneJob(record.job);
}

export function markPreflightJobRunning(jobId: string) {
  const record = jobs.get(jobId);
  if (!record) {
    return;
  }

  record.job.status = 'running';
  record.job.currentStageKey = 'content_read';
  record.job.currentStageLabel = '读取输入材料';
  record.job.message = record.request.goal === 'follower_growth' ? '开始推演传播发展。' : '开始模拟提交前反馈。';
  record.job.updatedAt = now();
}

export function updatePreflightJobStage(params: {
  jobId: string;
  key: PreflightJobStageKey;
  label: string;
  detail: string;
  status: PreflightJobStageStatus;
}) {
  const record = jobs.get(params.jobId);
  if (!record) {
    return;
  }

  const timestamp = now();
  record.job.status =
    params.status === 'error'
      ? 'error'
      : record.job.status === 'completed' || record.job.status === 'degraded'
        ? record.job.status
        : 'running';
  record.job.currentStageKey = params.key;
  record.job.currentStageLabel = params.label;
  record.job.message = params.detail;
  record.job.updatedAt = timestamp;
  record.job.stages = updateStage(record.job.stages, params.key, (stage) => ({
    ...stage,
    status: params.status,
    detail: params.detail,
    startedAt: stage.startedAt ?? (params.status === 'running' ? timestamp : stage.startedAt),
    completedAt: params.status === 'completed' || params.status === 'error' ? timestamp : stage.completedAt,
  }));
}

export function completePreflightJob(jobId: string, result: PreflightSimulationResult) {
  const record = jobs.get(jobId);
  if (!record) {
    return;
  }

  const timestamp = now();
  const completionMessage = result.degraded
    ? '远端模型不可用，已用本地模拟兜底完成。'
    : record.request.goal === 'follower_growth'
      ? '传播发展推演已完成。'
      : '提交前模拟已完成。';

  record.job.status = result.degraded ? 'degraded' : 'completed';
  record.job.currentStageKey = 'complete';
  record.job.currentStageLabel = result.degraded ? '兜底完成' : '完成';
  record.job.message = completionMessage;
  record.job.updatedAt = timestamp;
  record.job.result = cloneResult(result);
  record.job.error = undefined;
  record.job.fallbackReason = result.fallbackReason;
  record.job.stages = updateStage(record.job.stages, 'complete', (stage) => ({
    ...stage,
    status: 'completed',
    detail: completionMessage,
    startedAt: stage.startedAt ?? timestamp,
    completedAt: timestamp,
  }));
}

export function failPreflightJob(jobId: string, errorMessage: string, failedStageKey: PreflightJobStageKey = 'reply_simulation') {
  const record = jobs.get(jobId);
  if (!record) {
    return;
  }

  const timestamp = now();
  record.job.status = 'error';
  record.job.error = errorMessage;
  record.job.fallbackReason = undefined;
  record.job.currentStageKey = failedStageKey;
  record.job.currentStageLabel = stageBlueprints.find((stage) => stage.key === failedStageKey)?.label ?? failedStageKey;
  record.job.message = errorMessage;
  record.job.updatedAt = timestamp;
  record.job.stages = updateStage(record.job.stages, failedStageKey, (stage) => ({
    ...stage,
    status: 'error',
    detail: errorMessage,
    completedAt: timestamp,
  }));
}

export function resetPreflightJobStoreForTests() {
  jobs.clear();
  latestJobIdByWorkspace.clear();
}
