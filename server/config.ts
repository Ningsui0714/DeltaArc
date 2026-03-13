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

export const serverConfig = {
  port: parsePositiveInteger(process.env.PORT, 5001),
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
