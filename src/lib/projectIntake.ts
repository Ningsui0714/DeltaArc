import type { ProjectSnapshot } from '../types';

export const starterFieldIds = ['ideaSummary', 'coreLoop', 'targetPlayers', 'validationGoal'] as const;
export const guidedRefinementFieldIds = [
  'coreFantasy',
  'differentiators',
  'currentStatus',
  'progressionHook',
  'socialHook',
  'productionConstraints',
] as const;
export const supportingFieldIds = [
  'name',
  'mode',
  'genre',
  'platforms',
  'sessionLength',
  'referenceGames',
  'monetization',
] as const;

export type StarterFieldId = (typeof starterFieldIds)[number];
export type GuidedRefinementFieldId = (typeof guidedRefinementFieldIds)[number];
export type SupportingFieldId = (typeof supportingFieldIds)[number];
export type ProjectIntakeFieldId = StarterFieldId | GuidedRefinementFieldId | SupportingFieldId;

type InsightFieldId = StarterFieldId | GuidedRefinementFieldId;

type FieldInsight = {
  field: InsightFieldId;
  value: string;
};

function normalizeFieldValue(value: string | string[]) {
  return Array.isArray(value)
    ? value
        .map((item) => item.trim())
        .filter(Boolean)
        .join(', ')
    : value.trim();
}

export function getProjectFieldValue(project: ProjectSnapshot, field: ProjectIntakeFieldId) {
  return normalizeFieldValue(project[field]);
}

export function hasProjectFieldValue(project: ProjectSnapshot, field: ProjectIntakeFieldId) {
  return getProjectFieldValue(project, field).length > 0;
}

export function getCompletedIntakeFieldCount(
  project: ProjectSnapshot,
  fields: readonly ProjectIntakeFieldId[],
) {
  return fields.filter((field) => hasProjectFieldValue(project, field)).length;
}

export function getProjectPositioningSummary(project: ProjectSnapshot) {
  const ideaSummary = getProjectFieldValue(project, 'ideaSummary');
  const targetPlayers = getProjectFieldValue(project, 'targetPlayers');
  const genre = getProjectFieldValue(project, 'genre');

  if (ideaSummary && targetPlayers) {
    return `${ideaSummary} / ${targetPlayers}`;
  }

  if (ideaSummary && genre) {
    return `${genre} / ${ideaSummary}`;
  }

  return ideaSummary || targetPlayers || genre;
}

export function getRecommendedRefinementFieldIds(project: ProjectSnapshot) {
  const missingFirst = guidedRefinementFieldIds.filter((field) => !hasProjectFieldValue(project, field));
  const filledAfter = guidedRefinementFieldIds.filter((field) => hasProjectFieldValue(project, field));

  return [...missingFirst, ...filledAfter];
}

export function getProjectIntakeInsights(project: ProjectSnapshot) {
  const strengthFieldIds: readonly InsightFieldId[] = [
    'ideaSummary',
    'coreFantasy',
    'differentiators',
    'progressionHook',
    'socialHook',
  ];
  const riskFieldIds: readonly InsightFieldId[] = ['currentStatus', 'productionConstraints'];

  const strengths: FieldInsight[] = [
    ...strengthFieldIds,
  ]
    .filter((field) => hasProjectFieldValue(project, field))
    .map((field) => ({
      field,
      value: getProjectFieldValue(project, field),
    }))
    .slice(0, 4);

  const risks: FieldInsight[] = [...riskFieldIds]
    .filter((field) => hasProjectFieldValue(project, field))
    .map((field) => ({
      field,
      value: getProjectFieldValue(project, field),
    }))
    .slice(0, 4);

  const missingFieldIds = [...starterFieldIds, ...guidedRefinementFieldIds].filter(
    (field) => !hasProjectFieldValue(project, field),
  );

  return {
    positioning: getProjectPositioningSummary(project),
    strengths,
    risks,
    missingFieldIds,
    recommendedRefinementFieldIds: getRecommendedRefinementFieldIds(project),
  };
}

export type ProjectIntakeInsights = ReturnType<typeof getProjectIntakeInsights>;
