import assert from 'node:assert/strict';
import test from 'node:test';
import { createBlankProject } from '../data/mockData';
import {
  getProjectIntakeInsights,
  getProjectPositioningSummary,
  getRecommendedRefinementFieldIds,
} from './projectIntake';

test('guided refinement prioritizes missing judgment fields before completed ones', () => {
  const project = createBlankProject();
  project.coreFantasy = '玩家会为了高压配合的翻盘感反复开局。';
  project.currentStatus = '担心前十分钟教学成本太高。';

  const orderedFields = getRecommendedRefinementFieldIds(project);

  assert.deepEqual(orderedFields.slice(0, 4), [
    'differentiators',
    'progressionHook',
    'socialHook',
    'productionConstraints',
  ]);
  assert.deepEqual(orderedFields.slice(-2), ['coreFantasy', 'currentStatus']);
});

test('project intake insights expose current strengths, risks, and missing gaps from the draft', () => {
  const project = createBlankProject();
  project.ideaSummary = '验证双人协作机关是否能制造可复述的救场时刻。';
  project.targetPlayers = ['轻度合作玩家', '直播传播型玩家'];
  project.differentiators = '高频合作机关比长线刷资源更容易产生高光。';
  project.currentStatus = '担心第一次失败后玩家把问题归因到队友。';

  const insights = getProjectIntakeInsights(project);

  assert.equal(
    getProjectPositioningSummary(project),
    '验证双人协作机关是否能制造可复述的救场时刻。 / 轻度合作玩家, 直播传播型玩家',
  );
  assert.deepEqual(
    insights.strengths.map((item) => item.field),
    ['ideaSummary', 'differentiators'],
  );
  assert.deepEqual(
    insights.risks.map((item) => item.field),
    ['currentStatus'],
  );
  assert.equal(insights.missingFieldIds.includes('validationGoal'), true);
  assert.equal(insights.missingFieldIds.includes('productionConstraints'), true);
});
