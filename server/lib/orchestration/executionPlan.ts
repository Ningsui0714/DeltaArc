import { serverConfig } from '../../config';
import type { SandboxAnalysisMode } from '../../../shared/sandbox';
import { specialistBlueprints } from './specialists';

const fastScanSpecialistKeys = new Set(['systems', 'psychology', 'market', 'red_team']);
const deepDiveReasoningSpecialistKeys = new Set(['systems', 'psychology', 'red_team']);

function getReasoningStageTimeoutMs() {
  return Math.max(serverConfig.reasoningTimeoutMs, 300000);
}

export function createExecutionPlan(mode: SandboxAnalysisMode) {
  if (mode === 'balanced') {
    return {
      specialists: specialistBlueprints.filter((blueprint) => fastScanSpecialistKeys.has(blueprint.key)),
      specialistStrategy: 'remote' as const,
      dossierPreference: 'balanced' as const,
      specialistReasoningKeys: new Set<string>(),
      specialistConcurrency: serverConfig.balancedSpecialistConcurrency,
      synthesisPreference: 'balanced' as const,
      refinePreference: 'balanced' as const,
      dossierTimeoutMs: 90000,
      specialistTimeoutMs: 120000,
      synthesisTimeoutMs: 300000,
      refineTimeoutMs: undefined,
      shouldRunSynthesis: true,
      shouldRunRefine: false,
    };
  }

  const reasoningStageTimeoutMs = getReasoningStageTimeoutMs();

  return {
    specialists: specialistBlueprints,
    specialistStrategy: 'remote' as const,
    dossierPreference: 'reasoning' as const,
    specialistReasoningKeys: deepDiveReasoningSpecialistKeys,
    specialistConcurrency: Math.max(
      1,
      Math.min(serverConfig.reasoningSpecialistConcurrency, 2),
    ),
    synthesisPreference: 'reasoning' as const,
    refinePreference: 'reasoning' as const,
    dossierTimeoutMs: reasoningStageTimeoutMs,
    specialistTimeoutMs: reasoningStageTimeoutMs,
    synthesisTimeoutMs: Math.max(reasoningStageTimeoutMs + 120000, 420000),
    refineTimeoutMs: reasoningStageTimeoutMs,
    shouldRunSynthesis: true,
    shouldRunRefine: serverConfig.enableReasoningRefineStage,
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

export type ExecutionPlan = ReturnType<typeof createExecutionPlan>;
