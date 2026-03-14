import type {
  SandboxAnalysisMeta,
  SandboxMemorySignal,
  SandboxAnalysisRequest,
} from '../../../shared/sandbox';
import type { ExecutionPlan } from './executionPlan';
import {
  normalizeCandidateSelection,
  normalizeDossier,
  normalizeDossierGrounding,
} from './normalize';
import {
  buildDossierGroundingMessages,
  buildDossierMessages,
  buildDossierSelectionMessages,
  buildGroundedDossierMessages,
} from './prompts';
import { createDossierPreview } from './progressPreview';
import { runJsonStage } from './runStage';
import type { Dossier, DossierGrounding } from './types';
import {
  emitProgress,
  formatDuration,
  logStageResult,
  mapSettledWithConcurrency,
  OrchestrationStageError,
  type ProgressUpdate,
} from './orchestrationCore';
import { dedupeBy } from './utils';
import type { DossierCandidateFlavor } from './prompts/dossier';

const dossierGroundingMaxTokens = 2400;
const groundedDossierMaxTokens = 3200;
const dossierSelectionMaxTokens = 2200;
const dossierMonolithMaxTokens = 4000;

type DossierStageResult = {
  dossier: Dossier;
  pipelineEntry: string;
  warnings: string[];
  degraded: boolean;
  selectionSummary?: SandboxAnalysisMeta['dossierSelection'];
};

function buildDossierPipelineEntry(models: string[]) {
  const uniqueModels = Array.from(new Set(models.filter(Boolean)));
  return `dossier@${uniqueModels.join('+') || 'unknown-model'}`;
}

function buildDossierModelLabel(models: string[]) {
  const uniqueModels = Array.from(new Set(models.filter(Boolean)));
  return uniqueModels.join(' + ') || 'unknown-model';
}

type DossierCandidateRun = {
  candidateId: string;
  flavor: DossierCandidateFlavor;
  dossier: Dossier;
  model: string;
  durationMs: number;
  warnings: string[];
  degraded: boolean;
};

const dossierCandidateBlueprints: Array<{
  candidateId: string;
  flavor: DossierCandidateFlavor;
  label: string;
  temperature: {
    balanced: number;
    reasoning: number;
  };
}> = [
  {
    candidateId: 'candidate_balanced',
    flavor: 'balanced',
    label: 'balanced',
    temperature: {
      balanced: 0.24,
      reasoning: 0.18,
    },
  },
  {
    candidateId: 'candidate_skeptic',
    flavor: 'skeptic',
    label: 'skeptic',
    temperature: {
      balanced: 0.2,
      reasoning: 0.14,
    },
  },
  {
    candidateId: 'candidate_feasibility',
    flavor: 'feasibility',
    label: 'feasibility',
    temperature: {
      balanced: 0.18,
      reasoning: 0.12,
    },
  },
];

function pickFallbackDossierCandidate(candidates: DossierCandidateRun[]) {
  return [...candidates]
    .sort((left, right) => {
      const warningDelta = left.warnings.length - right.warnings.length;
      if (warningDelta !== 0) {
        return warningDelta;
      }

      const confidenceDelta =
        right.dossier.confidence + right.dossier.supportRatio - (left.dossier.confidence + left.dossier.supportRatio);
      if (confidenceDelta !== 0) {
        return confidenceDelta;
      }

      return left.flavor === 'balanced' ? -1 : right.flavor === 'balanced' ? 1 : 0;
    })[0];
}

async function runDossierCandidates(
  request: SandboxAnalysisRequest,
  executionPlan: ExecutionPlan,
  groundingPack: DossierGrounding,
  memorySignals: SandboxMemorySignal[],
) {
  const settled = await mapSettledWithConcurrency(
    dossierCandidateBlueprints,
    Math.min(3, dossierCandidateBlueprints.length),
    async (blueprint) => {
      const stage = await runJsonStage(
        request,
        `dossier-compose-${blueprint.label}`,
        executionPlan.dossierPreference,
        request.mode === 'reasoning'
          ? blueprint.temperature.reasoning
          : blueprint.temperature.balanced,
        buildGroundedDossierMessages(request, groundingPack, blueprint.flavor),
        executionPlan.dossierTimeoutMs,
        groundedDossierMaxTokens,
      );
      logStageResult(
        `dossier-compose-${blueprint.label}`,
        stage.model,
        stage.durationMs,
        stage.warnings,
      );

      const dossier = normalizeDossier(stage.data, memorySignals);

      return {
        candidateId: blueprint.candidateId,
        flavor: blueprint.flavor,
        dossier,
        model: stage.model,
        durationMs: stage.durationMs,
        warnings: dedupeBy([...stage.warnings, ...dossier.warnings], (item) => item, 10),
        degraded: stage.degraded,
      } satisfies DossierCandidateRun;
    },
  );

  const candidates: DossierCandidateRun[] = [];
  const warnings: string[] = [];
  let degraded = false;

  settled.forEach((result, index) => {
    const blueprint = dossierCandidateBlueprints[index];

    if (result.status === 'fulfilled') {
      candidates.push(result.value);
      degraded = degraded || result.value.degraded;
      warnings.push(...result.value.warnings);
      return;
    }

    const message =
      result.reason instanceof Error
        ? result.reason.message
        : `${blueprint.label} dossier candidate failed.`;
    warnings.push(`${blueprint.label} dossier candidate failed: ${message}`);
    degraded = true;
    console.warn(`[orchestration] dossier candidate ${blueprint.label} failed because ${message}`);
  });

  return {
    candidates,
    warnings: dedupeBy(warnings, (item) => item, 12),
    degraded,
  };
}

async function selectDossierCandidate(
  request: SandboxAnalysisRequest,
  executionPlan: ExecutionPlan,
  groundingPack: DossierGrounding,
  candidates: DossierCandidateRun[],
) {
  if (candidates.length === 1) {
    return {
      selected: candidates[0],
      selectionWarnings: [] as string[],
      models: [candidates[0].model],
      degraded: candidates[0].degraded,
      selectionSummary: {
        stage: 'dossier',
        candidateCount: 1,
        selectedCandidateId: candidates[0].candidateId,
        selectedFlavor: candidates[0].flavor,
        decisionMode: 'single',
        rationale: 'Only one dossier candidate completed, so it was promoted directly.',
        rankings: [],
      } satisfies NonNullable<SandboxAnalysisMeta['dossierSelection']>,
    };
  }

  const fallbackCandidate = pickFallbackDossierCandidate(candidates);

  try {
    const selectionStage = await runJsonStage(
      request,
      'dossier-select',
      executionPlan.dossierPreference,
      request.mode === 'reasoning' ? 0.12 : 0.08,
      buildDossierSelectionMessages(
        request,
        groundingPack,
        candidates.map((candidate) => ({
          candidateId: candidate.candidateId,
          flavor: candidate.flavor,
          dossier: candidate.dossier,
        })),
      ),
      executionPlan.dossierTimeoutMs,
      dossierSelectionMaxTokens,
    );
    logStageResult(
      'dossier-select',
      selectionStage.model,
      selectionStage.durationMs,
      selectionStage.warnings,
    );
    const selection = normalizeCandidateSelection(
      selectionStage.data,
      candidates.map((candidate) => candidate.candidateId),
    );
    const selected =
      candidates.find((candidate) => candidate.candidateId === selection.selectedCandidateId) ??
      fallbackCandidate;

    return {
      selected,
      selectionWarnings: dedupeBy(
        [
          ...selectionStage.warnings,
          ...selection.warnings,
          `Dossier verifier selected ${selected.flavor} candidate: ${selection.rationale}`,
        ],
        (item) => item,
        10,
      ),
      models: [selected.model, selectionStage.model],
      degraded: selected.degraded || selectionStage.degraded,
      selectionSummary: {
        stage: 'dossier',
        candidateCount: candidates.length,
        selectedCandidateId: selected.candidateId,
        selectedFlavor: selected.flavor,
        decisionMode: 'verifier',
        rationale: selection.rationale,
        rankings: selection.rankings,
      } satisfies NonNullable<SandboxAnalysisMeta['dossierSelection']>,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Dossier candidate verification failed.';
    console.warn(`[orchestration] dossier candidate verifier failed because ${message}`);

    return {
      selected: fallbackCandidate,
      selectionWarnings: [
        `Dossier candidate verifier failed: ${message}`,
        `Fell back to ${fallbackCandidate.flavor} dossier candidate based on local ranking.`,
      ],
      models: [fallbackCandidate.model],
      degraded: true,
      selectionSummary: {
        stage: 'dossier',
        candidateCount: candidates.length,
        selectedCandidateId: fallbackCandidate.candidateId,
        selectedFlavor: fallbackCandidate.flavor,
        decisionMode: 'fallback',
        rationale: `Verifier failed, so the local ranking promoted the ${fallbackCandidate.flavor} dossier candidate. ${message}`,
        rankings: [],
      } satisfies NonNullable<SandboxAnalysisMeta['dossierSelection']>,
    };
  }
}

export async function runDossierStage(
  request: SandboxAnalysisRequest,
  executionPlan: ExecutionPlan,
  memoryContext: string,
  memorySignals: SandboxMemorySignal[],
  onProgress: ((update: ProgressUpdate) => void) | undefined,
): Promise<DossierStageResult> {
  emitProgress(onProgress, {
    key: 'dossier',
    label: 'Dossier',
    detail: 'Extracting a shared dossier from the current project and evidence.',
    status: 'running',
  });
  const dossierStartedAt = Date.now();

  try {
    try {
      const groundingStage = await runJsonStage(
        request,
        'dossier-grounding',
        executionPlan.dossierPreference,
        request.mode === 'reasoning' ? 0.14 : 0.2,
        buildDossierGroundingMessages(request, memoryContext),
        executionPlan.dossierTimeoutMs,
        dossierGroundingMaxTokens,
      );
      logStageResult(
        'dossier-grounding',
        groundingStage.model,
        groundingStage.durationMs,
        groundingStage.warnings,
      );
      const groundingPack = normalizeDossierGrounding(groundingStage.data, memorySignals);
      const candidateRun = await runDossierCandidates(
        request,
        executionPlan,
        groundingPack,
        memorySignals,
      );
      if (candidateRun.candidates.length === 0) {
        throw new Error('No grounded dossier candidate succeeded.');
      }
      const selection = await selectDossierCandidate(
        request,
        executionPlan,
        groundingPack,
        candidateRun.candidates,
      );
      const dossier = selection.selected.dossier;
      const models = [groundingStage.model, ...selection.models];
      const pipelineEntry = buildDossierPipelineEntry(models);
      const warnings = dedupeBy(
        [
          ...groundingStage.warnings,
          ...groundingPack.warnings,
          ...candidateRun.warnings,
          ...selection.selected.warnings,
          ...selection.selectionWarnings,
        ],
        (item) => item,
        12,
      );
      const degraded = groundingStage.degraded || candidateRun.degraded || selection.degraded;
      const durationMs = Date.now() - dossierStartedAt;

      emitProgress(onProgress, {
        key: 'dossier',
        label: 'Dossier',
        detail: 'Shared dossier ready after multi-candidate verification.',
        status: 'completed',
        preview: createDossierPreview(dossier),
        model: buildDossierModelLabel(models),
        durationMs,
      });

      return {
        dossier,
        pipelineEntry,
        warnings,
        degraded,
        selectionSummary: selection.selectionSummary,
      };
    } catch (splitError) {
      const splitMessage =
        splitError instanceof Error
          ? splitError.message
          : 'Split dossier pipeline failed.';

      console.warn(
        `[orchestration] dossier split pipeline failed ${formatDuration(
          Date.now() - dossierStartedAt,
        )} because ${splitMessage}; falling back to the legacy dossier path`,
      );

      try {
        const dossierStage = await runJsonStage(
          request,
          'dossier',
          executionPlan.dossierPreference,
          request.mode === 'reasoning' ? 0.22 : 0.3,
          buildDossierMessages(request, memoryContext),
          executionPlan.dossierTimeoutMs,
          dossierMonolithMaxTokens,
        );

        logStageResult('dossier', dossierStage.model, dossierStage.durationMs, dossierStage.warnings);
        const dossier = normalizeDossier(dossierStage.data, memorySignals);
        const durationMs = Date.now() - dossierStartedAt;
        emitProgress(onProgress, {
          key: 'dossier',
          label: 'Dossier',
          detail: 'Shared dossier ready after falling back to the legacy dossier path.',
          status: 'completed',
          preview: createDossierPreview(dossier),
          model: dossierStage.model,
          durationMs,
        });

        return {
          dossier,
          pipelineEntry: `dossier@${dossierStage.model}`,
          warnings: dedupeBy(
            [
              'dossier split pipeline failed and fell back to the legacy single-pass dossier path.',
              splitMessage,
              ...dossierStage.warnings,
              ...dossier.warnings,
            ],
            (item) => item,
            12,
          ),
          degraded: true,
          selectionSummary: undefined,
        };
      } catch (monolithError) {
        const monolithMessage =
          monolithError instanceof Error
            ? monolithError.message
            : 'Legacy dossier path failed.';

        console.warn(
          `[orchestration] dossier remote paths failed ${formatDuration(
            Date.now() - dossierStartedAt,
          )}; stopping before any local fallback is assembled`,
        );
        throw new Error(
          `Split dossier path failed: ${splitMessage}; legacy dossier path failed: ${monolithMessage}`,
        );
      }
    }
  } catch (error) {
    const durationMs = Date.now() - dossierStartedAt;
    const message = error instanceof Error ? error.message : 'Dossier stage failed.';

    console.warn(`[orchestration] dossier failed ${formatDuration(durationMs)} because ${message}`);
    emitProgress(onProgress, {
      key: 'dossier',
      label: 'Dossier',
      detail: message,
      status: 'error',
      durationMs,
    });
    throw new OrchestrationStageError('dossier', 'Dossier', `Dossier stage failed: ${message}`);
  }
}
