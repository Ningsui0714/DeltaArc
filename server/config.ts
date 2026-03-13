export const serverConfig = {
  port: Number(process.env.PORT ?? 5001),
  deepseekApiKey: process.env.DEEPSEEK_API_KEY?.trim() ?? '',
  deepseekBaseUrl: (process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com').replace(/\/$/, ''),
  balancedModel: process.env.DEEPSEEK_CHAT_MODEL ?? 'deepseek-chat',
  reasoningModel: process.env.DEEPSEEK_REASONING_MODEL ?? 'deepseek-reasoner',
  balancedTimeoutMs: Number(process.env.LLM_BALANCED_TIMEOUT_MS ?? 60000),
  reasoningTimeoutMs: Number(process.env.LLM_REASONING_TIMEOUT_MS ?? 150000),
};
