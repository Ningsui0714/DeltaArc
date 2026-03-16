import type { SandboxAnalysisRequest } from '../../../shared/sandbox';
import { serverConfig } from '../../config';
import {
  isDeepseekNoUsableContentError,
  requestDeepseekJson,
  type DeepseekMessage,
} from '../deepseekApi';
import type { StageResult } from './types';
import { isAbortError } from './utils';

export async function runJsonStage(
  request: SandboxAnalysisRequest,
  label: string,
  preferred: 'balanced' | 'reasoning',
  temperature: number,
  messages: DeepseekMessage[],
  timeoutMs?: number,
  maxTokens?: number,
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
    const response = await requestDeepseekJson({
      label,
      model: preferredModel,
      temperature,
      timeoutMs: preferredTimeout,
      maxTokens,
      messages,
    });

    return {
      data: response.data,
      model: preferredModel,
      durationMs: Date.now() - startedAt,
      warnings: response.warnings,
      degraded: response.degraded,
    };
  } catch (error) {
    const shouldFallback =
      preferred === 'reasoning' &&
      request.mode === 'reasoning' &&
      (isAbortError(error) || isDeepseekNoUsableContentError(error)) &&
      preferredModel !== serverConfig.balancedModel;

    if (!shouldFallback) {
      throw error;
    }

    const fallbackTimeout = timeoutMs ?? serverConfig.balancedTimeoutMs;
    const fallbackResponse = await requestDeepseekJson({
      label,
      model: serverConfig.balancedModel,
      temperature,
      timeoutMs: fallbackTimeout,
      maxTokens,
      messages,
    });

    return {
      data: fallbackResponse.data,
      model: serverConfig.balancedModel,
      durationMs: Date.now() - startedAt,
      warnings: [
        isAbortError(error)
          ? `${label} timed out on the reasoning model and fell back to ${serverConfig.balancedModel}.`
          : `${label} returned no usable content on the reasoning model and fell back to ${serverConfig.balancedModel}.`,
        ...fallbackResponse.warnings,
      ],
      degraded: true,
    };
  }
}
