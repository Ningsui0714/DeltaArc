import { serverConfig } from '../config';
import { extractJsonObject } from './normalizeSandboxResult';

export type DeepseekMessage = {
  role: 'system' | 'user';
  content: string;
};

export type DeepseekJsonRequest = {
  label: string;
  model: string;
  temperature: number;
  timeoutMs: number;
  messages: DeepseekMessage[];
};

export async function requestDeepseekJson(request: DeepseekJsonRequest) {
  if (!serverConfig.deepseekApiKey) {
    throw new Error('DEEPSEEK_API_KEY 尚未配置。');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs);

  try {
    const response = await fetch(`${serverConfig.deepseekBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverConfig.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        temperature: request.temperature,
        response_format: {
          type: 'json_object',
        },
        messages: request.messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek ${request.label} 调用失败: ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(`DeepSeek ${request.label} 没有返回可用内容。`);
    }

    return extractJsonObject(content);
  } finally {
    clearTimeout(timeout);
  }
}
