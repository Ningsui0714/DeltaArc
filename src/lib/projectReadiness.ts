import type { ProjectSnapshot } from '../types';

export const MINIMUM_SETUP_FIELD_COUNT = 4;
export const MINIMUM_EVIDENCE_COUNT = 3;

function hasValue(value: string) {
  return value.trim().length > 0;
}

export function countFilledProjectFields(project: ProjectSnapshot) {
  return [
    project.ideaSummary,
    project.coreLoop,
    project.coreFantasy,
    project.genre,
    project.targetPlayers.join(' '),
    project.validationGoal,
    project.productionConstraints,
    project.currentStatus,
  ].filter(hasValue).length;
}

export function countSetupProjectFields(project: ProjectSnapshot) {
  return [
    project.ideaSummary,
    project.coreLoop,
    project.targetPlayers.join(' '),
    project.validationGoal,
  ].filter(hasValue).length;
}

export function getProjectReadiness(project: ProjectSnapshot, evidenceCount: number) {
  const filledFieldCount = countFilledProjectFields(project);
  const setupFieldCount = countSetupProjectFields(project);

  return {
    filledFieldCount,
    setupFieldCount,
    projectReady: setupFieldCount >= MINIMUM_SETUP_FIELD_COUNT,
    evidenceReady: evidenceCount >= MINIMUM_EVIDENCE_COUNT,
  };
}
