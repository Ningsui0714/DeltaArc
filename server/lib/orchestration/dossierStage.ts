import type { SandboxMemorySignal, SandboxAnalysisRequest } from '../../../shared/sandbox';
import type { ExecutionPlan } from './executionPlan';
import { normalizeDossier } from './normalize';
import { buildDossierMessages } from './prompts';
import { createDossierPreview } from './progressPreview';
import { runJsonStage } from './runStage';
import type { Dossier } from './types';
import {
  emitProgress,
  formatDuration,
  logStageResult,
  type ProgressUpdate,
} from './orchestrationCore';

const dossierMaxTokens = 4000;

type DossierStageResult = {
  dossier: Dossier;
  pipelineEntry: string;
  warnings: string[];
};

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
    const dossierStage = await runJsonStage(
      request,
      'dossier',
      executionPlan.dossierPreference,
      request.mode === 'reasoning' ? 0.22 : 0.3,
      buildDossierMessages(request, memoryContext),
      executionPlan.dossierTimeoutMs,
      dossierMaxTokens,
    );

    logStageResult('dossier', dossierStage.model, dossierStage.durationMs, dossierStage.warnings);
    const dossier = normalizeDossier(dossierStage.data, memorySignals);
    emitProgress(onProgress, {
      key: 'dossier',
      label: 'Dossier',
      detail: 'Shared dossier ready for the downstream perspectives.',
      status: 'completed',
      preview: createDossierPreview(dossier),
      model: dossierStage.model,
      durationMs: dossierStage.durationMs,
    });

    return {
      dossier,
      pipelineEntry: `dossier@${dossierStage.model}`,
      warnings: [...dossierStage.warnings, ...dossier.warnings],
    };
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
    throw new Error(`Dossier stage failed: ${message}`);
  }
}
