import assert from 'node:assert/strict';
import { beforeEach } from 'node:test';
import test from 'node:test';
import type { VariableImpactScanRequest } from '../../shared/variableSandbox';
import {
  clearVariableImpactScanJobsForWorkspace,
  createVariableImpactScanJob,
  failVariableImpactScanJob,
  getLatestOpenVariableImpactScanJob,
  markVariableImpactScanJobRunning,
  resetVariableImpactScanJobStoreForTests,
} from './impactScanJobStore';

const baseRequest: VariableImpactScanRequest = {
  baselineId: 'baseline_demo_001',
  mode: 'balanced',
  variable: {
    id: 'var_demo_001',
    baselineId: 'baseline_demo_001',
    name: '双人协作机关',
    category: 'gameplay',
    intent: '提升中期合作高光',
    changeStatement: '加入必须双人配合才能通过的限时机关',
    injectionTargets: ['core_loop', 'player_cooperation'],
    expectedBenefits: ['合作记忆点更强'],
    knownCosts: ['等待队友时会放大挫败'],
    activationStage: 'mid',
    dependencies: ['补单人补位机制'],
    successSignals: ['玩家主动复述合作瞬间'],
    failureSignals: ['玩家抱怨必须等人'],
  },
};

beforeEach(() => {
  resetVariableImpactScanJobStoreForTests();
});

test('getLatestOpenVariableImpactScanJob returns the latest in-flight job for one baseline', () => {
  const job = createVariableImpactScanJob('workspace_demo_001', baseRequest);

  markVariableImpactScanJobRunning(job.id);

  const latestJob = getLatestOpenVariableImpactScanJob(
    'workspace_demo_001',
    baseRequest.baselineId,
  );

  assert.equal(latestJob?.id, job.id);
  assert.equal(latestJob?.status, 'running');
  assert.equal(latestJob?.variable?.name, baseRequest.variable.name);
});

test('getLatestOpenVariableImpactScanJob ignores completed jobs and keeps scope isolation', () => {
  const firstJob = createVariableImpactScanJob('workspace_demo_001', baseRequest);
  markVariableImpactScanJobRunning(firstJob.id);
  failVariableImpactScanJob(firstJob.id, 'Impact scan failed.');

  const secondJob = createVariableImpactScanJob('workspace_demo_001', {
    ...baseRequest,
    baselineId: 'baseline_demo_002',
    variable: {
      ...baseRequest.variable,
      id: 'var_demo_002',
      baselineId: 'baseline_demo_002',
    },
  });
  markVariableImpactScanJobRunning(secondJob.id);

  assert.equal(
    getLatestOpenVariableImpactScanJob('workspace_demo_001', 'baseline_demo_001')?.id,
    firstJob.id,
  );
  assert.equal(
    getLatestOpenVariableImpactScanJob('workspace_demo_001', 'baseline_demo_002')?.id,
    secondJob.id,
  );
  assert.equal(
    getLatestOpenVariableImpactScanJob('workspace_demo_001', 'baseline_missing'),
    null,
  );
});

test('clearVariableImpactScanJobsForWorkspace removes every open job for one workspace only', () => {
  const firstJob = createVariableImpactScanJob('workspace_demo_001', baseRequest);
  const secondJob = createVariableImpactScanJob('workspace_demo_001', {
    ...baseRequest,
    baselineId: 'baseline_demo_002',
    variable: {
      ...baseRequest.variable,
      id: 'var_demo_002',
      baselineId: 'baseline_demo_002',
    },
  });
  const retainedJob = createVariableImpactScanJob('workspace_demo_002', baseRequest);

  markVariableImpactScanJobRunning(firstJob.id);
  markVariableImpactScanJobRunning(secondJob.id);
  markVariableImpactScanJobRunning(retainedJob.id);

  clearVariableImpactScanJobsForWorkspace('workspace_demo_001');

  assert.equal(
    getLatestOpenVariableImpactScanJob('workspace_demo_001', baseRequest.baselineId),
    null,
  );
  assert.equal(
    getLatestOpenVariableImpactScanJob('workspace_demo_001', 'baseline_demo_002'),
    null,
  );
  assert.equal(
    getLatestOpenVariableImpactScanJob('workspace_demo_002', baseRequest.baselineId)?.id,
    retainedJob.id,
  );
});
