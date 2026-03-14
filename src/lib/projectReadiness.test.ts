import assert from 'node:assert/strict';
import test from 'node:test';
import { createBlankProject } from '../data/mockData';
import {
  getProjectReadiness,
  MINIMUM_EVIDENCE_COUNT,
  MINIMUM_SETUP_FIELD_COUNT,
} from './projectReadiness';

function withSetupFieldCount(count: number) {
  const project = createBlankProject();
  const fillers = [
    () => {
      project.ideaSummary = '验证双人协作机关是否能提升中期留存。';
    },
    () => {
      project.coreLoop = '探索 -> 收集 -> 协作机关 -> 防守';
    },
    () => {
      project.targetPlayers = ['轻度合作玩家'];
    },
    () => {
      project.validationGoal = '确认首局 10 分钟内是否会出现合作高光。';
    },
  ];

  fillers.slice(0, count).forEach((applyField) => applyField());
  return project;
}

test('project readiness follows the configured minimum setup field threshold', () => {
  const belowThreshold = getProjectReadiness(
    withSetupFieldCount(Math.max(0, MINIMUM_SETUP_FIELD_COUNT - 1)),
    0,
  );
  const atThreshold = getProjectReadiness(
    withSetupFieldCount(MINIMUM_SETUP_FIELD_COUNT),
    0,
  );

  assert.equal(belowThreshold.projectReady, false);
  assert.equal(atThreshold.projectReady, true);
  assert.equal(atThreshold.setupFieldCount, MINIMUM_SETUP_FIELD_COUNT);
});

test('evidence readiness unlocks exactly at the configured evidence threshold', () => {
  const project = withSetupFieldCount(MINIMUM_SETUP_FIELD_COUNT);
  const belowThreshold = getProjectReadiness(
    project,
    Math.max(0, MINIMUM_EVIDENCE_COUNT - 1),
  );
  const atThreshold = getProjectReadiness(project, MINIMUM_EVIDENCE_COUNT);

  assert.equal(belowThreshold.evidenceReady, false);
  assert.equal(atThreshold.evidenceReady, true);
});
