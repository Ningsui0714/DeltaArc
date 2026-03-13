import type { SandboxAnalysisRequest } from '../../../shared/sandbox';
import { serverConfig } from '../../config';
import { requestDeepseekJson, type DeepseekMessage } from '../deepseekApi';
import type { StageResult } from './types';
import { isAbortError } from './utils';

export async function runJsonStage(
  request: SandboxAnalysisRequest,
  label: string,
  preferred: 'balanced' | 'reasoning',
  temperature: number,
  messages: DeepseekMessage[],
  timeoutMs?: number,
): Promise<StageResult<Record<string, unknown>>> {
  const preferredModel =
    preferred === 'reasoning' && request.mode === 'reasoning'
      ? serverConfig.reasoningModel
      : serverConfig.balancedModel;
  const preferredTimeout =
    timeoutMs ??
    (preferred === 'reasoning' && request.mode === 'reasoning'
      ? serverConfig.reasoningTimeoutMs
      : serverConfig.balancedTimeoutMs);
  const startedAt = Date.now();

  try {
    const data = await requestDeepseekJson({
      label,
      model: preferredModel,
      temperature,
      timeoutMs: preferredTimeout,
      messages,
    });

    return {
      data,
      model: preferredModel,
      durationMs: Date.now() - startedAt,
      warnings: [],
    };
  } catch (error) {
    const shouldFallback =
      preferred === 'reasoning' &&
      request.mode === 'reasoning' &&
      isAbortError(error) &&
      preferredModel !== serverConfig.balancedModel;

    if (!shouldFallback) {
      throw error;
    }

    const fallbackTimeout = timeoutMs ?? serverConfig.balancedTimeoutMs;
    const fallbackData = await requestDeepseekJson({
      label,
      model: serverConfig.balancedModel,
      temperature,
      timeoutMs: fallbackTimeout,
      messages,
    });

    return {
      data: fallbackData,
      model: serverConfig.balancedModel,
      durationMs: Date.now() - startedAt,
      warnings: [`${label} timed out on the reasoning model and fell back to ${serverConfig.balancedModel}.`],
    };
  }
}
