import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSandboxAnalysisRequest } from '../../../shared/schema';
import { createAnalysisMeta, createFallbackAnalysis } from '../../lib/normalizeSandboxResult';
import {
  createAnalysisJob,
  getAnalysisJob,
  markJobRunning,
  resetAnalysisJobStoreForTests,
} from '../../lib/analysisJobStore';
import { createEmptyCheckpointState } from '../../lib/orchestration/checkpoints';
import { OrchestrationRetryableError } from '../../lib/orchestration/orchestrationCore';
import { runAnalysisWithAutomaticResume } from './analysisHandlers';

function createParsedRequest() {
  return parseSandboxAnalysisRequest({
    workspaceId: 'workspace_analysis_handlers_retry',
    mode: 'reasoning',
    project: {
      name: 'Campfire Co-op',
      mode: 'Concept',
      genre: 'survival',
      platforms: ['PC'],
      targetPlayers: ['co-op players'],
      coreFantasy: 'survive together',
      ideaSummary: 'A co-op survival concept',
      coreLoop: 'explore -> gather -> build',
      sessionLength: '20m',
      differentiators: 'shared traps',
      progressionHook: 'base upgrades',
      socialHook: 'paired actions',
      monetization: 'premium',
      referenceGames: ['Dont Starve Together'],
      validationGoal: 'Check if co-op rituals improve mid-game retention.',
      productionConstraints: '2 devs',
      currentStatus: 'concept',
    },
    evidenceItems: [],
  });
}

function createRemoteResult() {
  return createFallbackAnalysis(
    'reasoning',
    'multi-stage: deepseek-chat',
    ['dossier@deepseek-chat', 'synthesis@deepseek-chat'],
    createAnalysisMeta('remote', 'degraded', 'analysis_auto_resume_test'),
  );
}

test('runAnalysisWithAutomaticResume retries once from the cached stage after a retryable failure', async () => {
  resetAnalysisJobStoreForTests();
  const request = createParsedRequest();
  const job = createAnalysisJob(request);
  markJobRunning(job.id);

  const checkpoints = createEmptyCheckpointState();
  const expectedResult = createRemoteResult();
  const calls: Array<{
    resumeStartStageKey?: string;
  }> = [];
  let attempt = 0;

  const result = await runAnalysisWithAutomaticResume({
    jobId: job.id,
    request,
    runAnalysis: async (_request, dependencies) => {
      calls.push({
        resumeStartStageKey: dependencies?.resume?.startStageKey,
      });

      if (attempt === 0) {
        attempt += 1;
        throw new OrchestrationRetryableError(
          'synthesis',
          'Synthesis',
          'Synthesis stage failed: simulated empty content',
          checkpoints,
          null,
        );
      }

      return expectedResult;
    },
  });

  assert.equal(result.summary, expectedResult.summary);
  assert.deepEqual(calls, [
    { resumeStartStageKey: undefined },
    { resumeStartStageKey: 'synthesis' },
  ]);

  const updatedJob = getAnalysisJob(job.id);
  assert.equal(updatedJob?.currentStageKey, 'synthesis');
  assert.match(updatedJob?.message ?? '', /Retrying once from the cached stage/);
  assert.equal(updatedJob?.stages.find((stage) => stage.key === 'synthesis')?.status, 'running');
});

test('runAnalysisWithAutomaticResume stops after one automatic retry attempt', async () => {
  resetAnalysisJobStoreForTests();
  const request = createParsedRequest();
  const job = createAnalysisJob(request);
  markJobRunning(job.id);

  const checkpoints = createEmptyCheckpointState();
  let callCount = 0;

  await assert.rejects(
    () =>
      runAnalysisWithAutomaticResume({
        jobId: job.id,
        request,
        runAnalysis: async () => {
          callCount += 1;
          throw new OrchestrationRetryableError(
            'refine',
            'Refine',
            'Refine stage failed: simulated timeout',
            checkpoints,
            null,
          );
        },
      }),
    (error: unknown) => {
      assert.equal((error as { name?: string })?.name, 'OrchestrationRetryableError');
      assert.equal(callCount, 2);
      return true;
    },
  );
});
