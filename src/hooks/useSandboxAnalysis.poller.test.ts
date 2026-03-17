import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptySandboxAnalysis } from '../lib/workspaceAnalysisState';
import { createSandboxAnalysisPoller } from './useSandboxAnalysis.poller';

test('poller clears stale progress when polling the active job fails', async () => {
  let activeJobId: string | null = 'job_active_001';
  let activeJobInputSignature: string | null = 'input_sig_001';
  const progressUpdates: Array<unknown> = [];
  const statusUpdates: string[] = [];
  const errorUpdates: Array<string | null> = [];

  const pollJob = createSandboxAnalysisPoller({
    fetchJob: async () => {
      throw new Error('Analysis job not found.');
    },
    getActiveJobId: () => activeJobId,
    setActiveJobId: (jobId) => {
      activeJobId = jobId;
    },
    getActiveJobInputSignature: () => activeJobInputSignature,
    setActiveJobInputSignature: (inputSignature) => {
      activeJobInputSignature = inputSignature;
    },
    getCurrentInputSignature: () => 'input_sig_001',
    clearPolling: () => {},
    schedulePoll: () => {},
    cacheRemoteAnalysis: () => {},
    cacheRetryableJob: () => {},
    clearRetryableJob: () => {},
    setProgress: (job) => {
      progressUpdates.push(job);
    },
    setAnalysis: () => {},
    setStatus: (status) => {
      statusUpdates.push(status);
    },
    setError: (error) => {
      errorUpdates.push(error);
    },
    resolveVisibleAnalysis: (mode) => createEmptySandboxAnalysis(mode),
    resolveFallbackAnalysis: (mode) => createEmptySandboxAnalysis(mode),
  });

  const result = await pollJob('job_active_001', 'reasoning');

  assert.equal(result, null);
  assert.equal(activeJobId, null);
  assert.equal(activeJobInputSignature, null);
  assert.deepEqual(progressUpdates, [null]);
  assert.deepEqual(statusUpdates, ['error']);
  assert.deepEqual(errorUpdates, ['Analysis job not found.']);
});
