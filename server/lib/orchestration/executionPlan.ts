import type { SandboxAnalysisMode } from '../../../shared/sandbox';
import { specialistBlueprints } from './specialists';

const fastScanSpecialistKeys = new Set(['systems', 'psychology', 'market', 'red_team']);
const deepDiveReasoningSpecialistKeys = new Set(['red_team']);

export function createExecutionPlan(mode: SandboxAnalysisMode) {
  if (mode === 'balanced') {
    return {
      specialists: specialistBlueprints.filter((blueprint) => fastScanSpecialistKeys.has(blueprint.key)),
      specialistStrategy: 'local' as const,
      dossierPreference: 'balanced' as const,
      specialistReasoningKeys: new Set<string>(),
      synthesisPreference: 'balanced' as const,
      refinePreference: 'balanced' as const,
      dossierTimeoutMs: 60000,
      specialistTimeoutMs: 12000,
      synthesisTimeoutMs: 0,
      refineTimeoutMs: 0,
      shouldRunSynthesis: false,
      shouldRunRefine: false,
    };
  }

  return {
    specialists: specialistBlueprints,
    specialistStrategy: 'remote' as const,
    dossierPreference: 'balanced' as const,
    specialistReasoningKeys: deepDiveReasoningSpecialistKeys,
    synthesisPreference: 'balanced' as const,
    refinePreference: 'balanced' as const,
    dossierTimeoutMs: 70000,
    specialistTimeoutMs: 85000,
    synthesisTimeoutMs: 70000,
    refineTimeoutMs: 50000,
    shouldRunSynthesis: true,
    shouldRunRefine: true,
  };
}

export function buildExecutionStages(mode: SandboxAnalysisMode) {
  const executionPlan = createExecutionPlan(mode);

  return [
    {
      key: 'dossier' as const,
      label: 'Dossier',
      detail: 'Extracting a shared dossier from project and evidence.',
    },
    ...executionPlan.specialists.map((blueprint) => ({
      key: blueprint.key,
      label: blueprint.label,
      detail: `Running the ${blueprint.label} perspective.`,
    })),
    ...(executionPlan.shouldRunSynthesis
      ? [
          {
            key: 'synthesis' as const,
            label: 'Synthesis',
            detail: 'Merging perspective outputs into a single recommendation.',
          },
        ]
      : []),
    ...(executionPlan.shouldRunRefine
      ? [
          {
            key: 'refine' as const,
            label: 'Refine',
            detail: 'Tightening the final result and removing vague advice.',
          },
        ]
      : []),
    {
      key: 'complete' as const,
      label: 'Complete',
      detail: 'Analysis finished.',
    },
  ];
}
