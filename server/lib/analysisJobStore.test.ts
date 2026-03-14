import assert from 'node:assert/strict';
import { beforeEach } from 'node:test';
import test from 'node:test';
import type { ProjectSnapshot } from '../../shared/domain';
import type { SandboxAnalysisRequest } from '../../shared/sandbox';
import { createWorkspaceInputSignature } from '../../shared/variableSandbox';
import {
  clearAnalysisJobsForWorkspace,
  createAnalysisJob,
  failAnalysisJob,
  getAnalysisJob,
  getLatestActiveAnalysisJob,
  getLatestRetryableAnalysisJob,
  markJobRunning,
  resetAnalysisJobStoreForTests,
} from './analysisJobStore';

const baseProject: ProjectSnapshot = {
  name: 'Project Demo',
  mode: 'Concept',
  genre: 'Strategy',
  platforms: ['PC'],
  targetPlayers: ['Strategy Players'],
  coreFantasy: 'Read the map and outsmart the opponent.',
  ideaSummary: 'Test whether shorter sessions improve retention.',
  coreLoop: 'Scout -> decide -> execute -> review',
  sessionLength: '15 minutes',
  differentiators: 'Fast strategic feedback.',
  progressionHook: 'Unlock smarter tools.',
  socialHook: 'Players compare route choices.',
  monetization: 'Not in scope',
  referenceGames: ['Into the Breach'],
  validationGoal: 'See whether players ask for another run after one match.',
  productionConstraints: 'Two week prototype window.',
  currentStatus: 'Need to verify whether the shorter loop still feels meaningful.',
};

const baseRequest: SandboxAnalysisRequest = {
  workspaceId: 'workspace_demo_001',
  mode: 'balanced',
  project: baseProject,
  evidenceItems: [],
};

beforeEach(() => {
  resetAnalysisJobStoreForTests();
});

test('failAnalysisJob marks the failed stage as error', () => {
  const job = createAnalysisJob(baseRequest);

  markJobRunning(job.id);
  failAnalysisJob(job.id, 'Market stage failed.', {
    failedStageKey: 'market',
    failedStageLabel: 'Market',
  });

  const failedJob = getAnalysisJob(job.id);
  const failedStage = failedJob?.stages.find((stage) => stage.key === 'market');

  assert.equal(failedJob?.status, 'error');
  assert.equal(failedJob?.currentStageKey, 'market');
  assert.equal(failedStage?.status, 'error');
  assert.equal(failedStage?.detail, 'Market stage failed.');
});

test('getLatestRetryableAnalysisJob returns the latest failed retryable job for a workspace', () => {
  const job = createAnalysisJob(baseRequest);

  markJobRunning(job.id);
  failAnalysisJob(job.id, 'Market stage failed.', {
    failedStageKey: 'market',
    failedStageLabel: 'Market',
    retryable: true,
    resumeFromStageKey: 'market',
  });

  const latestRetryableJob = getLatestRetryableAnalysisJob(baseRequest.workspaceId);

  assert.equal(latestRetryableJob?.job.id, job.id);
  assert.equal(latestRetryableJob?.job.retryable, true);
  assert.equal(
    latestRetryableJob?.inputSignature,
    createWorkspaceInputSignature(baseRequest.project, baseRequest.evidenceItems),
  );
});

test('getLatestActiveAnalysisJob returns the newest in-flight job for a workspace', () => {
  const job = createAnalysisJob(baseRequest);

  markJobRunning(job.id);

  const latestActiveJob = getLatestActiveAnalysisJob(baseRequest.workspaceId);

  assert.equal(latestActiveJob?.job.id, job.id);
  assert.equal(latestActiveJob?.job.status, 'running');
  assert.equal(
    latestActiveJob?.inputSignature,
    createWorkspaceInputSignature(baseRequest.project, baseRequest.evidenceItems),
  );
});

test('getLatestRetryableAnalysisJob does not surface an older failed job after a newer run starts', () => {
  const firstJob = createAnalysisJob(baseRequest);

  markJobRunning(firstJob.id);
  failAnalysisJob(firstJob.id, 'Market stage failed.', {
    failedStageKey: 'market',
    failedStageLabel: 'Market',
    retryable: true,
    resumeFromStageKey: 'market',
  });

  const secondJob = createAnalysisJob(baseRequest);

  assert.ok(secondJob.id !== firstJob.id);
  assert.equal(getLatestRetryableAnalysisJob(baseRequest.workspaceId), null);
});

test('getLatestActiveAnalysisJob does not surface a failed latest job as active', () => {
  const job = createAnalysisJob(baseRequest);

  markJobRunning(job.id);
  failAnalysisJob(job.id, 'Market stage failed.', {
    failedStageKey: 'market',
    failedStageLabel: 'Market',
    retryable: true,
    resumeFromStageKey: 'market',
  });

  assert.equal(getLatestActiveAnalysisJob(baseRequest.workspaceId), null);
});

test('getLatestRetryableAnalysisJob follows the newest retryable failure in the workspace', () => {
  const firstJob = createAnalysisJob(baseRequest);

  markJobRunning(firstJob.id);
  failAnalysisJob(firstJob.id, 'Market stage failed.', {
    failedStageKey: 'market',
    failedStageLabel: 'Market',
    retryable: true,
    resumeFromStageKey: 'market',
  });

  const secondJob = createAnalysisJob(baseRequest);

  markJobRunning(secondJob.id);
  failAnalysisJob(secondJob.id, 'Synthesis stage failed.', {
    failedStageKey: 'synthesis',
    failedStageLabel: 'Synthesis',
    retryable: true,
    resumeFromStageKey: 'synthesis',
  });

  const latestRetryableJob = getLatestRetryableAnalysisJob(baseRequest.workspaceId);

  assert.equal(latestRetryableJob?.job.id, secondJob.id);
  assert.equal(latestRetryableJob?.job.currentStageKey, 'synthesis');
});

test('getLatestRetryableAnalysisJob does not let an older concurrent failure override the newer run', () => {
  const firstJob = createAnalysisJob(baseRequest);
  const secondJob = createAnalysisJob(baseRequest);

  markJobRunning(firstJob.id);
  failAnalysisJob(firstJob.id, 'Market stage failed.', {
    failedStageKey: 'market',
    failedStageLabel: 'Market',
    retryable: true,
    resumeFromStageKey: 'market',
  });

  assert.equal(getLatestRetryableAnalysisJob(baseRequest.workspaceId), null);

  markJobRunning(secondJob.id);
  failAnalysisJob(secondJob.id, 'Refine stage failed.', {
    failedStageKey: 'refine',
    failedStageLabel: 'Refine',
    retryable: true,
    resumeFromStageKey: 'refine',
  });

  const latestRetryableJob = getLatestRetryableAnalysisJob(baseRequest.workspaceId);

  assert.equal(latestRetryableJob?.job.id, secondJob.id);
  assert.equal(latestRetryableJob?.job.currentStageKey, 'refine');
});

test('clearAnalysisJobsForWorkspace removes active and retryable jobs for one workspace only', () => {
  const retainedWorkspaceId = 'workspace_demo_002';
  const activeJob = createAnalysisJob(baseRequest);
  const retryableJob = createAnalysisJob(baseRequest);
  const retainedJob = createAnalysisJob({
    ...baseRequest,
    workspaceId: retainedWorkspaceId,
  });

  markJobRunning(activeJob.id);
  markJobRunning(retryableJob.id);
  markJobRunning(retainedJob.id);
  failAnalysisJob(retryableJob.id, 'Refine stage failed.', {
    failedStageKey: 'refine',
    failedStageLabel: 'Refine',
    retryable: true,
    resumeFromStageKey: 'refine',
  });

  clearAnalysisJobsForWorkspace(baseRequest.workspaceId);

  assert.equal(getAnalysisJob(activeJob.id), null);
  assert.equal(getAnalysisJob(retryableJob.id), null);
  assert.equal(getLatestActiveAnalysisJob(baseRequest.workspaceId), null);
  assert.equal(getLatestRetryableAnalysisJob(baseRequest.workspaceId), null);
  assert.equal(getAnalysisJob(retainedJob.id)?.id, retainedJob.id);
  assert.equal(getLatestActiveAnalysisJob(retainedWorkspaceId)?.job.id, retainedJob.id);
});
