import { serverConfig } from '../../config';
import { extractJsonObject, repairJsonObjectLocally } from '../normalizeSandboxResult';
import {
  PreflightProviderError,
  type PreflightModelProvider,
  type PreflightProviderInput,
} from './modelProvider';

type DoubaoChatCompletionResponse = {
  output?: Array<{
    type?: string | null;
    role?: string | null;
    content?: Array<{
      type?: string | null;
      text?: string | null;
    }>;
    status?: string | null;
  }>;
  status?: string | null;
};

type DoubaoContentBlock =
  | {
      type: 'input_text';
      text: string;
    }
  | {
      type: 'input_image';
      image_url: string;
    };

const quickSensitiveRetryInstruction = [
  '安全重试要求：只输出低风险的小红书发布前模拟 JSON。',
  '评论和建议用温和、抽象的用户反馈表达，避免人身攻击、真实个人信息、危险行为、暴力细节、仇恨、色情、医疗金融法律判断。',
  '如果素材里有冲突或失败场景，请改写成轻量试玩反馈、默契观察或内容理解偏差。',
].join('\n');

const quickShortJsonRetryInstruction = [
  '短草图重试要求：上一次 JSON 太长或不完整。',
  '只返回一层紧凑 JSON，不要输出完整 schema，不要输出 markdown。',
  '只包含 schemaVersion, scenario, contentRead, visualRead, imageInsight, simulatedReplies, actions, metrics, quality, safety, risks, warnings。',
  'simulatedReplies 只给 core/broad/weak/misfire 各一条，每条只含 tier, text, hiddenNeed, contentAction。',
  '每个中文字符串不超过 24 个字。',
].join('\n');

function createUserContent(input: PreflightProviderInput, userPrompt = input.userPrompt) {
  const content: DoubaoContentBlock[] = [];

  input.images.forEach((image) => {
    content.push({
      type: 'input_image',
      image_url: image.url,
    });
  });

  content.push({
    type: 'input_text',
    text: userPrompt,
  });

  return content;
}

function isSensitiveOutputBlocked(status: number, errorText: string) {
  return status === 400 && /OutputTextSensitiveContentDetected|sensitive information/i.test(errorText);
}

function appendWarning(result: Record<string, unknown>, warning: string) {
  const warnings = Array.isArray(result.warnings)
    ? result.warnings.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  return {
    ...result,
    warnings: Array.from(new Set([...warnings, warning])),
  };
}

async function fetchDoubaoResponse(input: PreflightProviderInput, model: string, userPrompt: string, maxOutputTokens: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), serverConfig.doubaoTimeoutMs);

  try {
    return await fetch(`${serverConfig.doubaoBaseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverConfig.doubaoApiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        max_output_tokens: maxOutputTokens,
        store: false,
        thinking: {
          type: 'disabled',
        },
        text: {
          format: {
            type: 'json_object',
          },
        },
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: input.systemPrompt,
              },
            ],
          },
          {
            role: 'user',
            content: createUserContent(input, userPrompt),
          },
        ],
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new PreflightProviderError(
        'DOUBAO_TIMEOUT',
        `豆包/火山方舟调用超时，已等待 ${serverConfig.doubaoTimeoutMs}ms。`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function parseDoubaoResponse(response: Response) {
  const payload = (await response.json()) as DoubaoChatCompletionResponse;
  const content = payload.output
    ?.filter((item) => item.type === 'message')
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n\n') ?? '';

  if (!content) {
    throw new PreflightProviderError(
      'DOUBAO_EMPTY_CONTENT',
      `豆包/火山方舟返回为空${payload.status ? `，status=${payload.status}` : ''}。`,
    );
  }

  try {
    return extractJsonObject(content);
  } catch (error) {
    try {
      const repaired = extractJsonObject(repairJsonObjectLocally(content));
      const warnings = Array.isArray(repaired.warnings) ? repaired.warnings : [];

      return {
        ...repaired,
        warnings: [
          ...warnings,
          '豆包/火山方舟返回 JSON 已通过本地修复后解析。',
        ],
      };
    } catch {
      // Fall through to the provider error below with the original parse message.
    }

    throw new PreflightProviderError(
      'DOUBAO_JSON_PARSE_FAILED',
      `豆包/火山方舟返回了非标准 JSON：${
        error instanceof Error ? error.message : '未知解析错误'
      }`,
    );
  }
}

function createRequestFailedError(status: number, errorText: string) {
  return new PreflightProviderError(
    'DOUBAO_REQUEST_FAILED',
    `豆包/火山方舟调用失败：${status} ${errorText.slice(0, 500)}${
      status === 404
        ? '。如果你使用的是受控模型或私有开通能力，请改配 DOUBAO_TEXT_ENDPOINT_ID / DOUBAO_VISION_ENDPOINT_ID。'
        : ''
    }`,
  );
}

async function retryQuickShortJson(input: PreflightProviderInput, model: string, warning: string) {
  const retryResponse = await fetchDoubaoResponse(
    input,
    model,
    `${input.userPrompt}\n\n${quickShortJsonRetryInstruction}`,
    1200,
  );

  if (!retryResponse.ok) {
    const retryErrorText = await retryResponse.text().catch(() => '');
    throw createRequestFailedError(retryResponse.status, retryErrorText);
  }

  return appendWarning(await parseDoubaoResponse(retryResponse), warning);
}

async function requestDoubaoJson(input: PreflightProviderInput, model: string) {
  if (!serverConfig.doubaoApiKey) {
    throw new PreflightProviderError(
      'DOUBAO_API_KEY_MISSING',
      'DOUBAO_API_KEY 未配置，无法调用豆包/火山方舟多模态链路。',
    );
  }

  const maxOutputTokens = input.request.mode === 'deep' ? 9000 : 2200;

  try {
    const response = await fetchDoubaoResponse(input, model, input.userPrompt, maxOutputTokens);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');

      if (input.request.mode === 'quick' && isSensitiveOutputBlocked(response.status, errorText)) {
        const retryResponse = await fetchDoubaoResponse(
          input,
          model,
          `${input.userPrompt}\n\n${quickSensitiveRetryInstruction}`,
          1400,
        );

        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text().catch(() => '');
          throw createRequestFailedError(retryResponse.status, retryErrorText || errorText);
        }

        return appendWarning(
          await parseDoubaoResponse(retryResponse),
          '豆包输出安全拦截后已用温和版本重试完成。',
        );
      }

      throw createRequestFailedError(response.status, errorText);
    }

    try {
      return await parseDoubaoResponse(response);
    } catch (error) {
      if (
        input.request.mode === 'quick'
        && error instanceof PreflightProviderError
        && error.code === 'DOUBAO_JSON_PARSE_FAILED'
      ) {
        return retryQuickShortJson(input, model, '豆包 JSON 过长或不完整后已用短草图重试完成。');
      }

      throw error;
    }
  } catch (error) {
    if (error instanceof PreflightProviderError) {
      throw error;
    }

    throw error;
  }
}

export function createDoubaoPreflightProvider(): PreflightModelProvider {
  return {
    provider: 'doubao',
    model: serverConfig.doubaoVisionEndpointId || serverConfig.doubaoVisionModel,
    generateJson(input) {
      const model = input.images.length > 0
        ? serverConfig.doubaoVisionEndpointId || serverConfig.doubaoVisionModel
        : serverConfig.doubaoTextEndpointId || serverConfig.doubaoTextModel;
      return requestDoubaoJson(input, model);
    },
  };
}
