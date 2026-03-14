import { serverConfig } from '../config';
import { extractJsonObject, repairJsonObjectLocally } from './normalizeSandboxResult';

export type DeepseekMessage = {
  role: 'system' | 'user';
  content: string;
};

export type DeepseekJsonRequest = {
  label: string;
  model: string;
  temperature: number;
  timeoutMs: number;
  maxTokens?: number;
  messages: DeepseekMessage[];
};

export type DeepseekJsonResponse = {
  data: Record<string, unknown>;
  warnings: string[];
  degraded: boolean;
};

type DeepseekCompletionRequest = {
  label: string;
  model: string;
  temperature?: number;
  timeoutMs: number;
  maxTokens?: number;
  messages: DeepseekMessage[];
};

type DeepseekCompletionPayload = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function clampRepairPayload(content: string) {
  const trimmed = content.trim();
  const maxLength = 24000;

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.slice(0, maxLength);
}

async function requestDeepseekCompletion(request: DeepseekCompletionRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs);

  try {
    const isReasoningModel = request.model === serverConfig.reasoningModel;
    const requestBody = {
      model: request.model,
      response_format: {
        type: 'json_object' as const,
      },
      messages: request.messages,
      ...(typeof request.temperature === 'number' && !isReasoningModel
        ? { temperature: request.temperature }
        : {}),
      ...(typeof request.maxTokens === 'number' ? { max_tokens: request.maxTokens } : {}),
    };

    const response = await fetch(`${serverConfig.deepseekBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverConfig.deepseekApiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek ${request.label} call failed: ${response.status} ${errorText}`);
    }

    const responseBody = (await response.json()) as DeepseekCompletionPayload;
    const content = responseBody.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(`DeepSeek ${request.label} returned no usable content.`);
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}

async function repairMalformedJson(
  request: DeepseekJsonRequest,
  malformedContent: string,
  originalError: unknown,
) {
  const repairMessages: DeepseekMessage[] = [
    {
      role: 'system',
      content:
        'You repair malformed JSON objects. Return one valid JSON object only. Preserve keys, arrays, and wording whenever possible. Do not add explanations or markdown fences.',
    },
    {
      role: 'user',
      content: `Repair the malformed JSON below so it becomes valid JSON.

Original parse error:
${originalError instanceof Error ? originalError.message : 'Unknown JSON parse error.'}

Malformed JSON:
${clampRepairPayload(malformedContent)}`,
    },
  ];

  const repairedContent = await requestDeepseekCompletion({
    label: `${request.label}-json-repair`,
    model: serverConfig.balancedModel,
    temperature: 0,
    timeoutMs: Math.min(Math.max(90000, Math.floor(request.timeoutMs * 0.75)), 180000),
    maxTokens: request.maxTokens,
    messages: repairMessages,
  });

  return extractJsonObject(repairedContent);
}

export async function requestDeepseekJson(request: DeepseekJsonRequest): Promise<DeepseekJsonResponse> {
  if (!serverConfig.deepseekApiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured.');
  }

  const content = await requestDeepseekCompletion({
    label: request.label,
    model: request.model,
    temperature: request.temperature,
    timeoutMs: request.timeoutMs,
    maxTokens: request.maxTokens,
    messages: request.messages,
  });

  try {
    return {
      data: extractJsonObject(content),
      warnings: [],
      degraded: false,
    };
  } catch (parseError) {
    let localRepairMessage = 'Local repair was not attempted.';

    console.warn(
      `[deepseek] ${request.label} returned malformed JSON, attempting repair: ${
        parseError instanceof Error ? parseError.message : 'Unknown parse error.'
      }`,
    );

    try {
      const locallyRepaired = extractJsonObject(repairJsonObjectLocally(content));
      return {
        data: locallyRepaired,
        warnings: [`${request.label} JSON required one local repair pass after the initial parse failed.`],
        degraded: true,
      };
    } catch (localRepairError) {
      localRepairMessage =
        localRepairError instanceof Error ? localRepairError.message : 'Unknown local repair error.';
      console.warn(
        `[deepseek] ${request.label} local JSON repair failed, attempting remote repair: ${localRepairMessage}`,
      );
    }

    try {
      const repaired = await repairMalformedJson(request, content, parseError);
      return {
        data: repaired,
        warnings: [`${request.label} JSON required one repair pass after the initial parse failed.`],
        degraded: true,
      };
    } catch (repairError) {
      const originalMessage =
        parseError instanceof Error ? parseError.message : 'Unknown initial parse error.';
      const repairMessage =
        repairError instanceof Error ? repairError.message : 'Unknown repair error.';
      throw new Error(
        `DeepSeek ${request.label} returned malformed JSON and repair failed. Initial parse: ${originalMessage}. Local repair: ${localRepairMessage}. Repair: ${repairMessage}`,
      );
    }
  }
}
