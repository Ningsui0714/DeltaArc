import type {
  SandboxAnalysisMeta,
  SandboxAnalysisRequest,
  SandboxAnalysisResult,
  SandboxNecessaryCondition,
} from '../../../shared/sandbox';
import { clampPercent } from '../normalizeSandboxResult';
import { normalizeFinalAnalysis } from '../normalizeSandboxResult';
import type { ExecutionPlan } from './executionPlan';
import { normalizeCandidateSelection } from './normalize';
import {
  buildModelSummary,
  emitProgress,
  logStageResult,
  mapSettledWithConcurrency,
  OrchestrationStageError,
  type ProgressUpdate,
} from './orchestrationCore';
import {
  buildActionBriefMessages,
  buildActionBriefSelectionMessages,
  buildFutureEvolutionMessages,
  buildRefinementMessages,
  buildReverseCheckMessages,
} from './prompts';
import {
  createRefinePreview,
  createSynthesisPreview,
} from './progressPreview';
import { runJsonStage } from './runStage';
import type { Dossier, SpecialistOutput } from './types';
import { dedupeBy } from './utils';
import type { ActionBriefFlavor } from './prompts/synthesis';

const futureEvolutionMaxTokens = 3600;
const actionBriefMaxTokens = 3200;
const actionBriefSelectionMaxTokens = 2200;
const reverseCheckMaxTokens = 2600;
const refineMaxTokens = 5500;

type SynthesisStageResult = {
  provisional: SandboxAnalysisResult;
  pipelineEntry?: string;
  warnings: string[];
  degraded: boolean;
};

type RefineStageResult = {
  finalResult: SandboxAnalysisResult;
  pipelineEntry?: string;
  warnings: string[];
  degraded: boolean;
};

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    : [];
}

function buildSynthesisPipelineEntry(models: string[]) {
  const uniqueModels = Array.from(new Set(models.filter(Boolean)));
  return `synthesis@${uniqueModels.join('+') || 'unknown-model'}`;
}

type ActionBriefCandidateRun = {
  candidateId: string;
  flavor: ActionBriefFlavor;
  data: Record<string, unknown>;
  model: string;
  durationMs: number;
  warnings: string[];
  degraded: boolean;
};

type ActionBriefSelectionResult = {
  data: Record<string, unknown>;
  warnings: string[];
  models: string[];
  degraded: boolean;
  selectionSummary?: SandboxAnalysisMeta['actionBriefSelection'];
};

const actionBriefCandidateBlueprints: Array<{
  candidateId: string;
  flavor: ActionBriefFlavor;
  label: string;
  temperature: {
    balanced: number;
    reasoning: number;
  };
}> = [
  {
    candidateId: 'brief_balanced',
    flavor: 'balanced',
    label: 'balanced',
    temperature: {
      balanced: 0.2,
      reasoning: 0.14,
    },
  },
  {
    candidateId: 'brief_skeptical',
    flavor: 'skeptical',
    label: 'skeptical',
    temperature: {
      balanced: 0.16,
      reasoning: 0.1,
    },
  },
  {
    candidateId: 'brief_execution_first',
    flavor: 'execution_first',
    label: 'execution-first',
    temperature: {
      balanced: 0.18,
      reasoning: 0.12,
    },
  },
];

function pickFallbackActionBriefCandidate(candidates: ActionBriefCandidateRun[]) {
  return [...candidates]
    .sort((left, right) => {
      const leftActions =
        typeof left.data.report === 'object' &&
        left.data.report !== null &&
        Array.isArray((left.data.report as { actions?: unknown[] }).actions)
          ? ((left.data.report as { actions: unknown[] }).actions?.length ?? 0)
          : 0;
      const rightActions =
        typeof right.data.report === 'object' &&
        right.data.report !== null &&
        Array.isArray((right.data.report as { actions?: unknown[] }).actions)
          ? ((right.data.report as { actions: unknown[] }).actions?.length ?? 0)
          : 0;
      const actionDelta = rightActions - leftActions;

      if (actionDelta !== 0) {
        return actionDelta;
      }

      const leftSignal =
        clampPercent(left.data.confidence, 50) +
        clampPercent(left.data.supportRatio, 50) -
        left.warnings.length * 4;
      const rightSignal =
        clampPercent(right.data.confidence, 50) +
        clampPercent(right.data.supportRatio, 50) -
        right.warnings.length * 4;

      if (rightSignal !== leftSignal) {
        return rightSignal - leftSignal;
      }

      return left.flavor === 'balanced' ? -1 : right.flavor === 'balanced' ? 1 : 0;
    })[0];
}

async function runActionBriefCandidateSelection(
  request: SandboxAnalysisRequest,
  executionPlan: ExecutionPlan,
  dossier: Dossier,
  provisional: SandboxAnalysisResult,
): Promise<ActionBriefSelectionResult> {
  const settled = await mapSettledWithConcurrency(
    actionBriefCandidateBlueprints,
    Math.min(3, actionBriefCandidateBlueprints.length),
    async (blueprint) => {
      const stage = await runJsonStage(
        request,
        `synthesis-brief-${blueprint.label}`,
        executionPlan.synthesisPreference,
        request.mode === 'reasoning'
          ? blueprint.temperature.reasoning
          : blueprint.temperature.balanced,
        buildActionBriefMessages(request, dossier, provisional, blueprint.flavor),
        executionPlan.synthesisTimeoutMs,
        actionBriefMaxTokens,
      );
      logStageResult(
        `synthesis-brief-${blueprint.label}`,
        stage.model,
        stage.durationMs,
        stage.warnings,
      );

      return {
        candidateId: blueprint.candidateId,
        flavor: blueprint.flavor,
        data: stage.data,
        model: stage.model,
        durationMs: stage.durationMs,
        warnings: [...stage.warnings, ...readStringArray(stage.data.warnings)],
        degraded: stage.degraded,
      } satisfies ActionBriefCandidateRun;
    },
  );

  const candidates: ActionBriefCandidateRun[] = [];
  const warnings: string[] = [];
  let degraded = false;

  settled.forEach((result, index) => {
    const blueprint = actionBriefCandidateBlueprints[index];

    if (result.status === 'fulfilled') {
      candidates.push(result.value);
      warnings.push(...result.value.warnings);
      degraded = degraded || result.value.degraded;
      return;
    }

    const message =
      result.reason instanceof Error
        ? result.reason.message
        : `${blueprint.label} action brief candidate failed.`;
    warnings.push(`${blueprint.label} action brief candidate failed: ${message}`);
    degraded = true;
    console.warn(`[orchestration] action brief candidate ${blueprint.label} failed because ${message}`);
  });

  if (candidates.length === 0) {
    throw new Error('No action brief candidate succeeded.');
  }

  if (candidates.length === 1) {
    return {
      data: candidates[0].data,
      warnings: dedupeBy(warnings, (item) => item, 12),
      models: [candidates[0].model],
      degraded,
      selectionSummary: {
        stage: 'action_brief',
        candidateCount: 1,
        selectedCandidateId: candidates[0].candidateId,
        selectedFlavor: candidates[0].flavor,
        decisionMode: 'single',
        rationale: 'Only one action brief candidate completed, so it was promoted directly.',
        rankings: [],
      },
    };
  }

  const fallbackCandidate = pickFallbackActionBriefCandidate(candidates);

  try {
    const selectionStage = await runJsonStage(
      request,
      'synthesis-brief-select',
      executionPlan.synthesisPreference,
      request.mode === 'reasoning' ? 0.08 : 0,
      buildActionBriefSelectionMessages(
        request,
        dossier,
        provisional,
        candidates.map((candidate) => ({
          candidateId: candidate.candidateId,
          flavor: candidate.flavor,
          brief: candidate.data,
        })),
      ),
      executionPlan.synthesisTimeoutMs,
      actionBriefSelectionMaxTokens,
    );
    logStageResult(
      'synthesis-brief-select',
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
      data: selected.data,
      warnings: dedupeBy(
        [
          ...warnings,
          ...selectionStage.warnings,
          ...selection.warnings,
          `Action brief verifier selected ${selected.flavor} candidate: ${selection.rationale}`,
        ],
        (item) => item,
        12,
      ),
      models: [selected.model, selectionStage.model],
      degraded: degraded || selectionStage.degraded || selected.degraded,
      selectionSummary: {
        stage: 'action_brief',
        candidateCount: candidates.length,
        selectedCandidateId: selected.candidateId,
        selectedFlavor: selected.flavor,
        decisionMode: 'verifier',
        rationale: selection.rationale,
        rankings: selection.rankings,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Action brief candidate verification failed.';
    console.warn(`[orchestration] action brief verifier failed because ${message}`);

    return {
      data: fallbackCandidate.data,
      warnings: dedupeBy(
        [
          ...warnings,
          `Action brief verifier failed: ${message}`,
          `Fell back to ${fallbackCandidate.flavor} action brief candidate based on local ranking.`,
        ],
        (item) => item,
        12,
      ),
      models: [fallbackCandidate.model],
      degraded: true,
      selectionSummary: {
        stage: 'action_brief',
        candidateCount: candidates.length,
        selectedCandidateId: fallbackCandidate.candidateId,
        selectedFlavor: fallbackCandidate.flavor,
        decisionMode: 'fallback',
        rationale: `Verifier failed, so the local ranking promoted the ${fallbackCandidate.flavor} action brief candidate. ${message}`,
        rankings: [],
      },
    };
  }
}

function readReverseCheckConditions(value: unknown): SandboxNecessaryCondition[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (typeof item !== 'object' || item === null) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const statusValue = typeof record.status === 'string' ? record.status.trim() : '';
      const status =
        statusValue === 'supported' || statusValue === 'uncertain' || statusValue === 'unsupported'
          ? statusValue
          : 'uncertain';

      return {
        condition:
          typeof record.condition === 'string' && record.condition.trim()
            ? record.condition.trim()
            : `必要条件 ${index + 1}`,
        status,
        evidenceRefs: readStringArray(record.evidenceRefs),
        impact:
          typeof record.impact === 'string' && record.impact.trim()
            ? record.impact.trim()
            : '影响仍需补充。',
      } satisfies SandboxNecessaryCondition;
    })
    .filter((item): item is SandboxNecessaryCondition => item !== null);
}

function hasReverseCheckTightened(
  previous: SandboxAnalysisResult,
  next: SandboxAnalysisResult,
) {
  if (
    previous.summary !== next.summary ||
    previous.systemVerdict !== next.systemVerdict ||
    previous.primaryRisk !== next.primaryRisk ||
    previous.nextStep !== next.nextStep
  ) {
    return true;
  }

  if (
    previous.report.headline !== next.report.headline ||
    previous.report.summary !== next.report.summary ||
    previous.report.conclusion !== next.report.conclusion ||
    previous.report.whyNow !== next.report.whyNow ||
    previous.report.risk !== next.report.risk
  ) {
    return true;
  }

  return previous.report.actions.join('\n') !== next.report.actions.join('\n');
}

export function applyReverseCheckToProvisional(
  provisional: SandboxAnalysisResult,
  reverseData: Record<string, unknown>,
  stageWarnings: string[] = [],
) {
  const conditions = readReverseCheckConditions(reverseData.necessaryConditions);
  const derivedWarnings = conditions
    .filter((condition) => condition.status !== 'supported')
    .slice(0, 3)
    .map((condition) => {
      const prefix = condition.status === 'unsupported' ? 'Reverse check blocked' : 'Reverse check pending';
      return `${prefix}: ${condition.condition}`;
    });
  const fragilitySummary =
    typeof reverseData.fragilitySummary === 'string' ? reverseData.fragilitySummary.trim() : '';
  const mergedWarnings = dedupeBy(
    [
      ...provisional.warnings,
      ...stageWarnings,
      ...readStringArray(reverseData.warnings),
      ...derivedWarnings,
      ...(fragilitySummary ? [`Reverse check: ${fragilitySummary}`] : []),
    ],
    (item) => item,
    16,
  );

  const nextProvisional = normalizeFinalAnalysis(
    {
      ...(typeof reverseData.summary === 'string' ? { summary: reverseData.summary } : {}),
      ...(typeof reverseData.systemVerdict === 'string'
        ? { systemVerdict: reverseData.systemVerdict }
        : {}),
      ...(typeof reverseData.primaryRisk === 'string'
        ? { primaryRisk: reverseData.primaryRisk }
        : {}),
      ...(typeof reverseData.nextStep === 'string' ? { nextStep: reverseData.nextStep } : {}),
      ...(typeof reverseData.report === 'object' && reverseData.report !== null
        ? { report: reverseData.report }
        : {}),
      warnings: mergedWarnings,
    },
    {
      ...provisional,
      warnings: mergedWarnings,
    },
  );
  const reverseCheckSummary =
    fragilitySummary || conditions.length > 0
      ? {
          tightened: hasReverseCheckTightened(provisional, nextProvisional),
          fragilitySummary,
          necessaryConditions: conditions,
        }
      : undefined;

  return {
    provisional: nextProvisional,
    reverseCheckSummary,
  };
}

export function assembleSynthesisProvisional(params: {
  provisional: SandboxAnalysisResult;
  pipeline: string[];
  models: string[];
  futureData?: Record<string, unknown>;
  actionData?: Record<string, unknown>;
  warnings?: string[];
}) {
  const { provisional, pipeline, models, futureData, actionData, warnings = [] } = params;
  const pipelineEntry = buildSynthesisPipelineEntry(models);
  const nextPipeline = [...pipeline, pipelineEntry];
  const mergedWarnings = dedupeBy(
    [
      ...provisional.warnings,
      ...readStringArray(futureData?.warnings),
      ...readStringArray(actionData?.warnings),
      ...warnings,
    ],
    (item) => item,
    16,
  );
  const assembledData: Record<string, unknown> = {
    ...(actionData && 'summary' in actionData ? { summary: actionData.summary } : {}),
    ...(actionData && 'systemVerdict' in actionData
      ? { systemVerdict: actionData.systemVerdict }
      : {}),
    ...(actionData && 'primaryRisk' in actionData
      ? { primaryRisk: actionData.primaryRisk }
      : {}),
    ...(actionData && 'nextStep' in actionData ? { nextStep: actionData.nextStep } : {}),
    ...(actionData && 'playerAcceptance' in actionData
      ? { playerAcceptance: actionData.playerAcceptance }
      : {}),
    ...(actionData && 'confidence' in actionData
      ? { confidence: actionData.confidence }
      : {}),
    ...(actionData && 'supportRatio' in actionData
      ? { supportRatio: actionData.supportRatio }
      : {}),
    ...(actionData && 'strategies' in actionData ? { strategies: actionData.strategies } : {}),
    ...(actionData && 'report' in actionData ? { report: actionData.report } : {}),
    ...(futureData && 'futureTimeline' in futureData
      ? { futureTimeline: futureData.futureTimeline }
      : {}),
    ...(futureData && 'communityRhythms' in futureData
      ? { communityRhythms: futureData.communityRhythms }
      : {}),
    ...(futureData && 'trajectorySignals' in futureData
      ? { trajectorySignals: futureData.trajectorySignals }
      : {}),
    warnings: mergedWarnings,
  };

  return {
    pipelineEntry,
    provisional: normalizeFinalAnalysis(assembledData, {
      ...provisional,
      pipeline: nextPipeline,
      model: buildModelSummary(nextPipeline),
      warnings: mergedWarnings,
    }),
  };
}

export async function runSynthesisStage(
  request: SandboxAnalysisRequest,
  executionPlan: ExecutionPlan,
  dossier: Dossier,
  specialistOutputs: SpecialistOutput[],
  pipeline: string[],
  provisional: SandboxAnalysisResult,
  onProgress: ((update: ProgressUpdate) => void) | undefined,
): Promise<SynthesisStageResult> {
  if (!executionPlan.shouldRunSynthesis) {
    return {
      provisional,
      warnings: [],
      degraded: false,
    };
  }

  emitProgress(onProgress, {
    key: 'synthesis',
    label: 'Synthesis',
    detail: 'Running future evolution and action brief slices in parallel.',
    status: 'running',
  });

  try {
    const futureSlicePromise = runJsonStage(
      request,
      'synthesis-future',
      executionPlan.synthesisPreference,
      request.mode === 'reasoning' ? 0.16 : 0.22,
      buildFutureEvolutionMessages(request, dossier, provisional),
      executionPlan.synthesisTimeoutMs,
      futureEvolutionMaxTokens,
    );
    const actionSlicePromise = runActionBriefCandidateSelection(
      request,
      executionPlan,
      dossier,
      provisional,
    );
    const [futureSlice, actionSlice] = await Promise.allSettled([
      futureSlicePromise,
      actionSlicePromise,
    ]);
    const sliceWarnings: string[] = [];
    const sliceFailures: string[] = [];
    const sliceModels: string[] = [];
    let degraded = false;
    let futureData: Record<string, unknown> | undefined;
    let actionData: Record<string, unknown> | undefined;
    let actionBriefSelection: SandboxAnalysisMeta['actionBriefSelection'] | undefined;

    if (futureSlice.status === 'fulfilled') {
      logStageResult(
        'synthesis-future',
        futureSlice.value.model,
        futureSlice.value.durationMs,
        futureSlice.value.warnings,
      );
      sliceModels.push(futureSlice.value.model);
      sliceWarnings.push(...futureSlice.value.warnings);
      degraded = degraded || futureSlice.value.degraded;
      futureData = futureSlice.value.data;
    } else {
      const message =
        futureSlice.reason instanceof Error
          ? futureSlice.reason.message
          : 'Future evolution slice failed.';
      console.warn(`[orchestration] synthesis-future failed because ${message}; stopping synthesis before any local assembly leaks out`);
      sliceFailures.push(`Future evolution slice failed: ${message}`);
    }

    if (actionSlice.status === 'fulfilled') {
      sliceModels.push(...actionSlice.value.models);
      sliceWarnings.push(...actionSlice.value.warnings);
      degraded = degraded || actionSlice.value.degraded;
      actionData = actionSlice.value.data;
      actionBriefSelection = actionSlice.value.selectionSummary;
    } else {
      const message =
        actionSlice.reason instanceof Error
          ? actionSlice.reason.message
          : 'Action brief slice failed.';
      console.warn(`[orchestration] synthesis-brief failed because ${message}; stopping synthesis before any local assembly leaks out`);
      sliceFailures.push(`Action brief slice failed: ${message}`);
    }

    if (sliceFailures.length > 0) {
      const combinedMessage = dedupeBy(sliceFailures, (item) => item, 6).join(' | ');
      throw new OrchestrationStageError(
        'synthesis',
        'Synthesis',
        `Synthesis stage failed: ${combinedMessage}`,
      );
    }

    const assembled = assembleSynthesisProvisional({
      provisional,
      pipeline,
      models: sliceModels,
      futureData,
      actionData,
      warnings: sliceWarnings,
    });
    const pipelineEntry = assembled.pipelineEntry;
    let nextProvisional = actionBriefSelection
      ? {
          ...assembled.provisional,
          meta: {
            ...assembled.provisional.meta,
            actionBriefSelection,
          },
        }
      : assembled.provisional;

    if (request.mode === 'reasoning') {
      try {
        const reverseCheckStage = await runJsonStage(
          request,
          'synthesis-reverse-check',
          executionPlan.synthesisPreference,
          0.08,
          buildReverseCheckMessages(request, dossier, nextProvisional),
          executionPlan.synthesisTimeoutMs,
          reverseCheckMaxTokens,
        );
        logStageResult(
          'synthesis-reverse-check',
          reverseCheckStage.model,
          reverseCheckStage.durationMs,
          reverseCheckStage.warnings,
        );
        sliceModels.push(reverseCheckStage.model);
        sliceWarnings.push(...reverseCheckStage.warnings);
        degraded = degraded || reverseCheckStage.degraded;
        const reverseChecked = applyReverseCheckToProvisional(
          nextProvisional,
          reverseCheckStage.data,
          reverseCheckStage.warnings,
        );
        nextProvisional = reverseChecked.reverseCheckSummary
          ? {
              ...reverseChecked.provisional,
              meta: {
                ...reverseChecked.provisional.meta,
                reverseCheck: reverseChecked.reverseCheckSummary,
              },
            }
          : reverseChecked.provisional;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Reverse check failed and the provisional synthesis result was kept.';
        console.warn(`[orchestration] synthesis-reverse-check failed because ${message}; keeping pre-check synthesis result`);
        degraded = true;
        sliceWarnings.push(`Reverse check failed and the pre-check synthesis result was kept: ${message}`);
      }
    }

    emitProgress(onProgress, {
      key: 'synthesis',
      label: 'Synthesis',
      detail:
        request.mode === 'reasoning'
          ? 'Cross-perspective synthesis finished after reverse checking the draft verdict.'
          : 'Cross-perspective synthesis finished.',
      status: 'completed',
      preview: createSynthesisPreview(nextProvisional),
      model: buildModelSummary([...pipeline, pipelineEntry]),
    });

    return {
      provisional: nextProvisional,
      pipelineEntry,
      warnings: dedupeBy(sliceWarnings, (item) => item, 12),
      degraded,
    };
  } catch (error) {
    const message =
      error instanceof OrchestrationStageError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Synthesis failed.';
    console.warn(`[orchestration] synthesis failed because ${message}`);
    emitProgress(onProgress, {
      key: 'synthesis',
      label: 'Synthesis',
      detail: message,
      status: 'error',
    });
    if (error instanceof OrchestrationStageError) {
      throw error;
    }
    throw new OrchestrationStageError('synthesis', 'Synthesis', `Synthesis stage failed: ${message}`);
  }
}

export async function runRefineStage(
  request: SandboxAnalysisRequest,
  executionPlan: ExecutionPlan,
  provisional: SandboxAnalysisResult,
  pipeline: string[],
  modelSummary: string,
  synthesisWarnings: string[],
  onProgress: ((update: ProgressUpdate) => void) | undefined,
): Promise<RefineStageResult> {
  if (!executionPlan.shouldRunRefine) {
    return {
      finalResult: provisional,
      warnings: [],
      degraded: false,
    };
  }

  emitProgress(onProgress, {
    key: 'refine',
    label: 'Refine',
    detail: 'Tightening the final write-up and removing generic advice.',
    status: 'running',
  });

  try {
    const refinementStage = await runJsonStage(
      request,
      'refine',
      executionPlan.refinePreference,
      0.15,
      buildRefinementMessages(provisional),
      executionPlan.refineTimeoutMs,
      refineMaxTokens,
    );

    logStageResult('refine', refinementStage.model, refinementStage.durationMs, refinementStage.warnings);
    const pipelineEntry = `refine@${refinementStage.model}`;
    const nextPipeline = [...pipeline, pipelineEntry];
    const finalResult = normalizeFinalAnalysis(refinementStage.data, {
      ...provisional,
      pipeline: nextPipeline,
      model: modelSummary,
      warnings: dedupeBy(
        [...provisional.warnings, ...synthesisWarnings, ...refinementStage.warnings],
        (item) => item,
        12,
      ),
    });
    emitProgress(onProgress, {
      key: 'refine',
      label: 'Refine',
      detail: 'Final refinement finished.',
      status: 'completed',
      preview: createRefinePreview(finalResult),
      model: refinementStage.model,
      durationMs: refinementStage.durationMs,
    });

    return {
      finalResult,
      pipelineEntry,
      warnings: refinementStage.warnings,
      degraded: refinementStage.degraded,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Refine failed and the synthesis result was kept.';
    console.warn(`[orchestration] refine failed because ${error instanceof Error ? error.message : 'Refine failed.'}`);
    emitProgress(onProgress, {
      key: 'refine',
      label: 'Refine',
      detail: 'Refine failed; keeping the last successful remote synthesis result.',
      status: 'error',
    });

    return {
      finalResult: provisional,
      warnings: [message],
      degraded: true,
    };
  }
}
