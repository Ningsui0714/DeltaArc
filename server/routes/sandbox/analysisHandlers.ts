import type { RequestHandler } from 'express';
import {
  SchemaError,
  parseSandboxAnalysisRequest,
  parseSandboxAnalysisResult,
} from '../../../shared/schema';
import type { SandboxAnalysisResumeStageKey } from '../../../shared/sandbox';
import {
  completeAnalysisJob,
  createAnalysisJob,
  failAnalysisJob,
  getAnalysisJob,
  getAnalysisJobRetryContext,
  getLatestActiveAnalysisJob,
  getLatestRetryableAnalysisJob,
  hasAnalysisJob,
  markJobRunning,
  updateAnalysisJobStage,
} from '../../lib/analysisJobStore';
import { runDeepseekSandboxAnalysis } from '../../lib/deepseekClient';
import type { AnalysisCheckpointState } from '../../lib/orchestration/checkpoints';
import { isOrchestrationRetryableError } from '../../lib/orchestration/orchestrationCore';
import { projectTruthStore } from '../../lib/projectTruthStore';
import { getServerErrorMessage, parseRouteToken, sendSchemaError } from './routeUtils';

type ParsedSandboxAnalysisRequest = ReturnType<typeof parseSandboxAnalysisRequest>;
type AnalysisResumeState = {
  startStageKey: SandboxAnalysisResumeStageKey;
  checkpoints: AnalysisCheckpointState;
};
type AnalysisRunDependencies = NonNullable<Parameters<typeof runDeepseekSandboxAnalysis>[1]>;

const automaticResumeAttemptLimit = 1;

function getAutomaticResumeDetail(stageLabel: string) {
  return `${stageLabel} failed late in the run. Retrying once from the cached stage.`;
}

export async function runAnalysisWithAutomaticResume(params: {
  jobId: string;
  request: ParsedSandboxAnalysisRequest;
  resume?: AnalysisResumeState;
  onProgress?: AnalysisRunDependencies['onProgress'];
  runAnalysis?: typeof runDeepseekSandboxAnalysis;
}) {
  const runAnalysis = params.runAnalysis ?? runDeepseekSandboxAnalysis;
  let resume = params.resume;
  let attempt = 0;

  while (true) {
    try {
      return await runAnalysis(params.request, {
        onProgress: params.onProgress,
        ...(resume ? { resume } : {}),
      });
    } catch (error) {
      if (
        !isOrchestrationRetryableError(error) ||
        attempt >= automaticResumeAttemptLimit ||
        !hasAnalysisJob(params.jobId)
      ) {
        throw error;
      }

      attempt += 1;
      updateAnalysisJobStage({
        jobId: params.jobId,
        key: error.stageKey,
        label: error.stageLabel,
        detail: getAutomaticResumeDetail(error.stageLabel),
        status: 'running',
      });
      resume = {
        startStageKey: error.stageKey,
        checkpoints: error.checkpoints,
      };
    }
  }
}

function appendPersistenceWarning(
  result: ReturnType<typeof parseSandboxAnalysisResult>,
  message: string,
) {
  if (!result.warnings.includes(message)) {
    result.warnings = [...result.warnings, message];
  }
}

async function persistLatestAnalysisOrWarn(
  request: ParsedSandboxAnalysisRequest,
  result: ReturnType<typeof parseSandboxAnalysisResult>,
  options: {
    runStartedAt: string;
    analysisJobId: string;
  },
) {
  try {
    const persisted = await projectTruthStore.persistLatestAnalysis({
      workspaceId: request.workspaceId,
      runStartedAt: options.runStartedAt,
      analysisJobId: options.analysisJobId,
      projectSnapshot: request.project,
      evidenceSnapshot: request.evidenceItems,
      analysis: result,
    });

    if (!persisted.persisted) {
      appendPersistenceWarning(
        result,
        'Latest analysis was not promoted because a newer run for this workspace had already finished first.',
      );
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? `Latest analysis persistence failed: ${error.message}`
        : 'Latest analysis persistence failed after the run completed.';
    appendPersistenceWarning(result, message);
    console.warn(`[project-truth] ${message}`);
  }
}

async function handleAnalysisJobSuccess(
  jobId: string,
  request: ParsedSandboxAnalysisRequest,
  runStartedAt: string,
  result: Awaited<ReturnType<typeof runDeepseekSandboxAnalysis>>,
) {
  if (!hasAnalysisJob(jobId)) {
    return;
  }

  const parsedResult = parseSandboxAnalysisResult(result);
  await persistLatestAnalysisOrWarn(request, parsedResult, {
    runStartedAt,
    analysisJobId: jobId,
  });
  completeAnalysisJob(jobId, parsedResult);
}

async function handleAnalysisJobFailure(
  jobId: string,
  request: ParsedSandboxAnalysisRequest,
  runStartedAt: string,
  error: unknown,
) {
  if (!hasAnalysisJob(jobId)) {
    return;
  }

  const message = error instanceof Error ? error.message : 'Analysis failed.';

  if (isOrchestrationRetryableError(error)) {
    const partialResult = error.partialResult
      ? parseSandboxAnalysisResult(error.partialResult)
      : null;

    if (partialResult) {
      await persistLatestAnalysisOrWarn(request, partialResult, {
        runStartedAt,
        analysisJobId: jobId,
      });
    }

    failAnalysisJob(jobId, message, {
      failedStageKey: error.stageKey,
      failedStageLabel: error.stageLabel,
      result: partialResult,
      retryable: true,
      resumeFromStageKey: error.stageKey,
      checkpoints: error.checkpoints,
    });
    return;
  }

  failAnalysisJob(jobId, message);
}

function startAnalysisJob(options: {
  jobId: string;
  request: ParsedSandboxAnalysisRequest;
  runStartedAt: string;
  resume?: AnalysisResumeState;
}) {
  markJobRunning(options.jobId);

  const onProgress: AnalysisRunDependencies['onProgress'] = (update) => {
    updateAnalysisJobStage({
      jobId: options.jobId,
      ...update,
    });
  };

  void runAnalysisWithAutomaticResume({
    jobId: options.jobId,
    request: options.request,
    resume: options.resume,
    onProgress,
  })
    .then((result) =>
      handleAnalysisJobSuccess(
        options.jobId,
        options.request,
        options.runStartedAt,
        result,
      ),
    )
    .catch((error) =>
      handleAnalysisJobFailure(
        options.jobId,
        options.request,
        options.runStartedAt,
        error,
      ),
    );
}

function parseWorkspaceId(
  rawWorkspaceId: string | string[] | undefined,
  res: Parameters<RequestHandler>[1],
) {
  try {
    return parseRouteToken(rawWorkspaceId, 'workspaceId');
  } catch (error) {
    sendSchemaError(res, error, 'Invalid workspace id.');
    return null;
  }
}

function parseJobId(
  rawJobId: string | string[] | undefined,
  res: Parameters<RequestHandler>[1],
) {
  try {
    return parseRouteToken(rawJobId, 'jobId');
  } catch (error) {
    sendSchemaError(res, error, 'Invalid analysis job id.');
    return null;
  }
}

export const postAnalyze: RequestHandler = (req, res) => {
  let request: ParsedSandboxAnalysisRequest;
  try {
    request = parseSandboxAnalysisRequest(req.body);
  } catch (error) {
    sendSchemaError(
      res,
      error,
      error instanceof SchemaError ? error.message : 'Invalid analysis request.',
    );
    return;
  }

  const job = createAnalysisJob(request);
  res.status(202).json(job);

  startAnalysisJob({
    jobId: job.id,
    request,
    runStartedAt: job.createdAt,
  });
};

export const retryAnalyze: RequestHandler = (req, res) => {
  const jobId = parseJobId(req.params.jobId, res);

  if (!jobId) {
    return;
  }

  const retryContext = getAnalysisJobRetryContext(jobId);

  if (!retryContext) {
    res.status(409).json({
      error: 'This analysis job cannot be resumed from a cached stage.',
    });
    return;
  }

  const job = createAnalysisJob(retryContext.request, {
    startStageKey: retryContext.resumeFromStageKey,
    resumeCheckpoints: retryContext.checkpoints,
    resumeStages: retryContext.resumeStages,
    resumedFromJobId: jobId,
  });
  res.status(202).json(job);

  startAnalysisJob({
    jobId: job.id,
    request: retryContext.request,
    runStartedAt: job.createdAt,
    resume: {
      startStageKey: retryContext.resumeFromStageKey,
      checkpoints: retryContext.checkpoints,
    },
  });
};

export const getAnalyzeJob: RequestHandler = (req, res) => {
  const jobId = parseJobId(req.params.jobId, res);

  if (!jobId) {
    return;
  }

  const job = getAnalysisJob(jobId);

  if (!job) {
    res.status(404).json({
      error: 'Analysis job not found.',
    });
    return;
  }

  res.json(job);
};

export const getLatestPersistedAnalysis: RequestHandler = async (req, res) => {
  const workspaceId = parseWorkspaceId(req.params.workspaceId, res);

  if (!workspaceId) {
    return;
  }

  try {
    const latestAnalysis = await projectTruthStore.loadLatestAnalysis(workspaceId);
    res.json({ latestAnalysis });
  } catch (error) {
    res.status(500).json({
      error: getServerErrorMessage(error, 'Loading the latest analysis failed.'),
    });
  }
};

export const getLatestAnalysisJobForWorkspace: RequestHandler = (req, res) => {
  const workspaceId = parseWorkspaceId(req.params.workspaceId, res);

  if (!workspaceId) {
    return;
  }

  res.json({
    latestActiveJob: getLatestActiveAnalysisJob(workspaceId),
  });
};

export const getLatestRetryableAnalysisJobForWorkspace: RequestHandler = (req, res) => {
  const workspaceId = parseWorkspaceId(req.params.workspaceId, res);

  if (!workspaceId) {
    return;
  }

  res.json({
    latestRetryableJob: getLatestRetryableAnalysisJob(workspaceId),
  });
};
