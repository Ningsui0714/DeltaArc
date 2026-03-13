import type { SandboxAnalysisRequest, SandboxAnalysisResult } from '../../../shared/sandbox';
import { normalizeFinalAnalysis } from '../normalizeSandboxResult';
import type { ExecutionPlan } from './executionPlan';
import {
  buildModelSummary,
  createNormalizationFallback,
  emitProgress,
  logStageResult,
  type ProgressUpdate,
} from './orchestrationCore';
import {
  buildRefinementMessages,
  buildSynthesisMessages,
} from './prompts';
import {
  createRefinePreview,
  createSynthesisPreview,
} from './progressPreview';
import { runJsonStage } from './runStage';
import type { Dossier, SpecialistOutput } from './types';
import { dedupeBy } from './utils';

const synthesisMaxTokens = 7000;
const refineMaxTokens = 5500;

type SynthesisStageResult = {
  provisional: SandboxAnalysisResult;
  pipelineEntry?: string;
  warnings: string[];
};

type RefineStageResult = {
  finalResult: SandboxAnalysisResult;
  pipelineEntry?: string;
  warnings: string[];
};

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
    };
  }

  emitProgress(onProgress, {
    key: 'synthesis',
    label: 'Synthesis',
    detail: 'Merging perspective outputs into a single recommendation.',
    status: 'running',
  });

  try {
    const synthesisStage = await runJsonStage(
      request,
      'synthesis',
      executionPlan.synthesisPreference,
      request.mode === 'reasoning' ? 0.18 : 0.25,
      buildSynthesisMessages(request, dossier, specialistOutputs, pipeline),
      executionPlan.synthesisTimeoutMs,
      synthesisMaxTokens,
    );

    logStageResult('synthesis', synthesisStage.model, synthesisStage.durationMs, synthesisStage.warnings);
    const pipelineEntry = `synthesis@${synthesisStage.model}`;
    const nextPipeline = [...pipeline, pipelineEntry];
    const nextProvisional = normalizeFinalAnalysis(
      synthesisStage.data,
      createNormalizationFallback(request, nextPipeline, buildModelSummary(nextPipeline)),
    );
    emitProgress(onProgress, {
      key: 'synthesis',
      label: 'Synthesis',
      detail: 'Cross-perspective synthesis finished.',
      status: 'completed',
      preview: createSynthesisPreview(nextProvisional),
      model: synthesisStage.model,
      durationMs: synthesisStage.durationMs,
    });

    return {
      provisional: nextProvisional,
      pipelineEntry,
      warnings: synthesisStage.warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Synthesis failed.';
    console.warn(`[orchestration] synthesis failed because ${message}`);
    emitProgress(onProgress, {
      key: 'synthesis',
      label: 'Synthesis',
      detail: message,
      status: 'error',
    });
    throw new Error(`Synthesis stage failed: ${message}`);
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
    };
  }
}
