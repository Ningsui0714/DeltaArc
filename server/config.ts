function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

export function parseListenHost(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

export function resolveDoubaoApiKey(env: NodeJS.ProcessEnv = process.env) {
  return (env.DOUBAO_API_KEY?.trim() || env.ARK_API_KEY?.trim() || '');
}

export const serverConfig = {
  host: parseListenHost(process.env.HOST, '127.0.0.1'),
  port: parsePositiveInteger(process.env.PORT, 5001),
  preflightProvider:
    process.env.PREFLIGHT_PROVIDER?.trim().toLowerCase() === 'mock' ? 'mock' : 'doubao',
  doubaoApiKey: resolveDoubaoApiKey(),
  doubaoBaseUrl: (process.env.DOUBAO_BASE_URL ?? 'https://ark.cn-beijing.volces.com/api/v3').replace(
    /\/$/,
    '',
  ),
  doubaoTextEndpointId: process.env.DOUBAO_TEXT_ENDPOINT_ID?.trim() ?? '',
  doubaoVisionEndpointId: process.env.DOUBAO_VISION_ENDPOINT_ID?.trim() ?? '',
  doubaoTextModel: process.env.DOUBAO_TEXT_MODEL ?? 'doubao-seed-2-0-lite-260215',
  doubaoVisionModel: process.env.DOUBAO_VISION_MODEL ?? 'doubao-seed-2-0-lite-260215',
  doubaoTimeoutMs: parsePositiveInteger(process.env.DOUBAO_TIMEOUT_MS, 150000),
  deepseekApiKey: process.env.DEEPSEEK_API_KEY?.trim() ?? '',
  deepseekBaseUrl: (process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com').replace(/\/$/, ''),
  balancedModel: process.env.DEEPSEEK_CHAT_MODEL ?? 'deepseek-chat',
  reasoningModel: process.env.DEEPSEEK_REASONING_MODEL ?? 'deepseek-reasoner',
  balancedTimeoutMs: parsePositiveInteger(process.env.LLM_BALANCED_TIMEOUT_MS, 60000),
  reasoningTimeoutMs: parsePositiveInteger(process.env.LLM_REASONING_TIMEOUT_MS, 150000),
  balancedSpecialistConcurrency: parsePositiveInteger(
    process.env.LLM_BALANCED_SPECIALIST_CONCURRENCY,
    3,
  ),
  reasoningSpecialistConcurrency: parsePositiveInteger(
    process.env.LLM_REASONING_SPECIALIST_CONCURRENCY,
    4,
  ),
  enableReasoningRefineStage: parseBoolean(process.env.LLM_ENABLE_REASONING_REFINE_STAGE, false),
};
