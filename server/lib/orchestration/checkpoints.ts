import type {
  SandboxAnalysisMeta,
  SandboxAnalysisResult,
  SandboxAnalysisResumeStageKey,
  SandboxPerspectiveKey,
} from '../../../shared/sandbox';
import type { ExecutionPlan } from './executionPlan';
import type { Dossier, SpecialistOutput } from './types';

export type DossierCheckpoint = {
  dossier: Dossier;
  pipelineEntry: string;
  warnings: string[];
  degraded: boolean;
  selectionSummary?: SandboxAnalysisMeta['dossierSelection'];
};

export type SpecialistCheckpoint = {
  key: SandboxPerspectiveKey;
  output: SpecialistOutput;
  pipelineEntry: string;
  warnings: string[];
  degraded: boolean;
};

export type SynthesisCheckpoint = {
  provisional: SandboxAnalysisResult;
  pipelineEntry?: string;
  warnings: string[];
  degraded: boolean;
};

export type AnalysisCheckpointState = {
  dossier?: DossierCheckpoint;
  specialists: SpecialistCheckpoint[];
  synthesis?: SynthesisCheckpoint;
};

export type SpecialistResumeState = {
  reusedCheckpoints: SpecialistCheckpoint[];
  remainingSpecialists: ExecutionPlan['specialists'];
};

export function createEmptyCheckpointState(): AnalysisCheckpointState {
  return {
    specialists: [],
  };
}

export function cloneCheckpointState(checkpoints: AnalysisCheckpointState): AnalysisCheckpointState {
  return {
    dossier: checkpoints.dossier
      ? {
          ...checkpoints.dossier,
          dossier: {
            ...checkpoints.dossier.dossier,
            scores: { ...checkpoints.dossier.dossier.scores },
            personas: checkpoints.dossier.dossier.personas.map((item) => ({ ...item })),
            hypotheses: checkpoints.dossier.dossier.hypotheses.map((item) => ({ ...item })),
            evidenceDigest: checkpoints.dossier.dossier.evidenceDigest.map((item) => ({ ...item })),
            coreTensions: [...checkpoints.dossier.dossier.coreTensions],
            openQuestions: [...checkpoints.dossier.dossier.openQuestions],
            memorySignals: checkpoints.dossier.dossier.memorySignals.map((item) => ({ ...item })),
            warnings: [...checkpoints.dossier.dossier.warnings],
          },
          warnings: [...checkpoints.dossier.warnings],
          selectionSummary: checkpoints.dossier.selectionSummary
            ? {
                ...checkpoints.dossier.selectionSummary,
                rankings: checkpoints.dossier.selectionSummary.rankings.map((item) => ({ ...item })),
              }
            : undefined,
        }
      : undefined,
    specialists: checkpoints.specialists.map((checkpoint) => ({
      ...checkpoint,
      output: {
        ...checkpoint.output,
        perspective: { ...checkpoint.output.perspective, evidenceRefs: [...checkpoint.output.perspective.evidenceRefs] },
        blindSpots: checkpoint.output.blindSpots.map((item) => ({ ...item })),
        secondOrderEffects: checkpoint.output.secondOrderEffects.map((item) => ({ ...item })),
        scenarioVariants: checkpoint.output.scenarioVariants.map((item) => ({
          ...item,
          watchSignals: [...item.watchSignals],
        })),
        decisionLenses: checkpoint.output.decisionLenses.map((item) => ({ ...item })),
        validationTracks: checkpoint.output.validationTracks.map((item) => ({ ...item })),
        contrarianMoves: checkpoint.output.contrarianMoves.map((item) => ({ ...item })),
        unknowns: checkpoint.output.unknowns.map((item) => ({ ...item })),
        strategyIdeas: checkpoint.output.strategyIdeas.map((item) => ({ ...item })),
        redTeam: checkpoint.output.redTeam
          ? {
              ...checkpoint.output.redTeam,
              attackVectors: [...checkpoint.output.redTeam.attackVectors],
              failureModes: [...checkpoint.output.redTeam.failureModes],
            }
          : undefined,
        warnings: [...checkpoint.output.warnings],
      },
      warnings: [...checkpoint.warnings],
    })),
    synthesis: checkpoints.synthesis
      ? {
          ...checkpoints.synthesis,
          provisional: {
            ...checkpoints.synthesis.provisional,
            pipeline: [...checkpoints.synthesis.provisional.pipeline],
            meta: {
              ...checkpoints.synthesis.provisional.meta,
              dossierSelection: checkpoints.synthesis.provisional.meta.dossierSelection
                ? {
                    ...checkpoints.synthesis.provisional.meta.dossierSelection,
                    rankings: checkpoints.synthesis.provisional.meta.dossierSelection.rankings.map((item) => ({ ...item })),
                  }
                : undefined,
              actionBriefSelection: checkpoints.synthesis.provisional.meta.actionBriefSelection
                ? {
                    ...checkpoints.synthesis.provisional.meta.actionBriefSelection,
                    rankings: checkpoints.synthesis.provisional.meta.actionBriefSelection.rankings.map((item) => ({ ...item })),
                  }
                : undefined,
              reverseCheck: checkpoints.synthesis.provisional.meta.reverseCheck
                ? {
                    ...checkpoints.synthesis.provisional.meta.reverseCheck,
                    necessaryConditions: checkpoints.synthesis.provisional.meta.reverseCheck.necessaryConditions.map((item) => ({
                      ...item,
                      evidenceRefs: [...item.evidenceRefs],
                    })),
                  }
                : undefined,
            },
            scores: { ...checkpoints.synthesis.provisional.scores },
            personas: checkpoints.synthesis.provisional.personas.map((item) => ({ ...item })),
            hypotheses: checkpoints.synthesis.provisional.hypotheses.map((item) => ({ ...item })),
            strategies: checkpoints.synthesis.provisional.strategies.map((item) => ({ ...item })),
            perspectives: checkpoints.synthesis.provisional.perspectives.map((item) => ({
              ...item,
              evidenceRefs: [...item.evidenceRefs],
            })),
            blindSpots: checkpoints.synthesis.provisional.blindSpots.map((item) => ({ ...item })),
            secondOrderEffects: checkpoints.synthesis.provisional.secondOrderEffects.map((item) => ({ ...item })),
            scenarioVariants: checkpoints.synthesis.provisional.scenarioVariants.map((item) => ({
              ...item,
              watchSignals: [...item.watchSignals],
            })),
            futureTimeline: checkpoints.synthesis.provisional.futureTimeline.map((item) => ({
              ...item,
              watchSignals: [...item.watchSignals],
            })),
            communityRhythms: checkpoints.synthesis.provisional.communityRhythms.map((item) => ({ ...item })),
            trajectorySignals: checkpoints.synthesis.provisional.trajectorySignals.map((item) => ({ ...item })),
            decisionLenses: checkpoints.synthesis.provisional.decisionLenses.map((item) => ({ ...item })),
            validationTracks: checkpoints.synthesis.provisional.validationTracks.map((item) => ({ ...item })),
            contrarianMoves: checkpoints.synthesis.provisional.contrarianMoves.map((item) => ({ ...item })),
            unknowns: checkpoints.synthesis.provisional.unknowns.map((item) => ({ ...item })),
            redTeam: {
              ...checkpoints.synthesis.provisional.redTeam,
              attackVectors: [...checkpoints.synthesis.provisional.redTeam.attackVectors],
              failureModes: [...checkpoints.synthesis.provisional.redTeam.failureModes],
            },
            memorySignals: checkpoints.synthesis.provisional.memorySignals.map((item) => ({ ...item })),
            report: {
              ...checkpoints.synthesis.provisional.report,
              actions: [...checkpoints.synthesis.provisional.report.actions],
            },
            warnings: [...checkpoints.synthesis.provisional.warnings],
          },
          warnings: [...checkpoints.synthesis.warnings],
        }
      : undefined,
  };
}

export function getCachedStageKeys(checkpoints: AnalysisCheckpointState): SandboxAnalysisResumeStageKey[] {
  const keys: SandboxAnalysisResumeStageKey[] = [];

  if (checkpoints.dossier) {
    keys.push('dossier');
  }

  checkpoints.specialists.forEach((checkpoint) => {
    keys.push(checkpoint.key);
  });

  if (checkpoints.synthesis) {
    keys.push('synthesis');
  }

  return keys;
}

function findCheckpointBySpecialistKey(
  checkpoints: AnalysisCheckpointState,
  key: SandboxPerspectiveKey,
) {
  return checkpoints.specialists.find((checkpoint) => checkpoint.key === key) ?? null;
}

export function getOrderedSpecialistCheckpoints(
  executionPlan: Pick<ExecutionPlan, 'specialists'>,
  checkpoints: AnalysisCheckpointState,
) {
  const ordered = orderSpecialistCheckpoints(executionPlan, checkpoints);

  return ordered.length === executionPlan.specialists.length ? ordered : null;
}

export function orderSpecialistCheckpoints(
  executionPlan: Pick<ExecutionPlan, 'specialists'>,
  checkpoints: AnalysisCheckpointState,
) {
  return executionPlan.specialists.flatMap((blueprint) => {
    const checkpoint = findCheckpointBySpecialistKey(checkpoints, blueprint.key);
    return checkpoint ? [checkpoint] : [];
  });
}

export function getSpecialistResumeState(
  executionPlan: Pick<ExecutionPlan, 'specialists'>,
  checkpoints: AnalysisCheckpointState,
  resumeStageKey: SandboxAnalysisResumeStageKey,
): SpecialistResumeState | null {
  const resumeIndex = executionPlan.specialists.findIndex(
    (blueprint) => blueprint.key === resumeStageKey,
  );

  if (resumeIndex < 0 || !checkpoints.dossier) {
    return null;
  }

  const reusedCheckpoints = orderSpecialistCheckpoints(executionPlan, checkpoints);
  const reusedKeys = new Set(reusedCheckpoints.map((checkpoint) => checkpoint.key));

  return {
    reusedCheckpoints,
    remainingSpecialists: executionPlan.specialists.filter(
      (blueprint) => !reusedKeys.has(blueprint.key),
    ),
  };
}
