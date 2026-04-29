import assert from 'node:assert/strict';
import test from 'node:test';
import { serverConfig } from '../../config';
import { createDoubaoPreflightProvider } from './doubaoProvider';

test('doubao provider sends multimodal content blocks when images are present', async () => {
  const originalApiKey = serverConfig.doubaoApiKey;
  const originalBaseUrl = serverConfig.doubaoBaseUrl;
  const originalVisionModel = serverConfig.doubaoVisionModel;
  const originalVisionEndpointId = serverConfig.doubaoVisionEndpointId;
  const originalFetch = globalThis.fetch;
  let capturedBody = '';

  serverConfig.doubaoApiKey = 'test-key';
  serverConfig.doubaoBaseUrl = 'https://example.test/api/v3';
  serverConfig.doubaoVisionModel = 'vision-test-model';
  serverConfig.doubaoVisionEndpointId = '';
  globalThis.fetch = (async (_input, init) => {
    capturedBody = typeof init?.body === 'string' ? init.body : '';
    return {
      ok: true,
      async json() {
        return {
          output: [
            {
              type: 'message',
              content: [
                {
                  type: 'output_text',
                  text: JSON.stringify({
                    contentRead: {
                      oneLineIntent: '测试',
                    },
                  }),
                },
              ],
            },
          ],
        };
      },
    } as Response;
  }) as typeof fetch;

  try {
    const provider = createDoubaoPreflightProvider();
    await provider.generateJson({
      request: {
        workspaceId: 'test',
        platform: 'xiaohongshu',
        goal: 'store_visit',
        mode: 'quick',
        contentDraft: {
          title: '标题',
          body: '正文',
          script: '',
        },
        mediaAssets: [],
        accountContext: '',
        targetAudience: '',
        desiredAction: '',
        brandGuardrails: '',
      },
      systemPrompt: 'system',
      userPrompt: 'user',
      images: [
        {
          id: 'image-1',
          name: 'cover.png',
          mimeType: 'image/png',
          url: 'data:image/png;base64,AAA',
        },
      ],
    });

    const payload = JSON.parse(capturedBody) as {
      model: string;
      max_output_tokens: number;
      thinking: { type: string };
      text: { format: { type: string } };
      input: Array<{
        role: string;
        content: Array<{ type: string }>;
      }>;
    };

    assert.equal(payload.model, 'vision-test-model');
    assert.equal(payload.max_output_tokens, 2200);
    assert.equal(payload.thinking.type, 'disabled');
    assert.equal(payload.text.format.type, 'json_object');
    assert.equal(payload.input[1]?.role, 'user');
    assert.ok(Array.isArray(payload.input[1]?.content));
    assert.equal(payload.input[1]?.content[0]?.type, 'input_image');
    assert.equal(payload.input[1]?.content[1]?.type, 'input_text');
  } finally {
    serverConfig.doubaoApiKey = originalApiKey;
    serverConfig.doubaoBaseUrl = originalBaseUrl;
    serverConfig.doubaoVisionModel = originalVisionModel;
    serverConfig.doubaoVisionEndpointId = originalVisionEndpointId;
    globalThis.fetch = originalFetch;
  }
});

test('doubao provider locally repairs minor malformed JSON responses', async () => {
  const originalApiKey = serverConfig.doubaoApiKey;
  const originalBaseUrl = serverConfig.doubaoBaseUrl;
  const originalFetch = globalThis.fetch;

  serverConfig.doubaoApiKey = 'test-key';
  serverConfig.doubaoBaseUrl = 'https://example.test/api/v3';
  globalThis.fetch = (async () => ({
    ok: true,
    async json() {
      return {
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: '{"contentRead":{"oneLineIntent":"他说 "你好" 并继续"},"warnings":[]}',
              },
            ],
          },
        ],
      };
    },
  } as Response)) as typeof fetch;

  try {
    const provider = createDoubaoPreflightProvider();
    const result = await provider.generateJson({
      request: {
        workspaceId: 'test',
        platform: 'xiaohongshu',
        goal: 'follower_growth',
        mode: 'quick',
        contentDraft: {
          title: '标题',
          body: '正文',
          script: '',
        },
        mediaAssets: [],
        accountContext: '',
        targetAudience: '',
        desiredAction: '',
        brandGuardrails: '',
      },
      systemPrompt: 'system',
      userPrompt: 'user',
      images: [],
    });

    assert.equal((result.contentRead as { oneLineIntent?: string }).oneLineIntent, '他说 "你好" 并继续');
    assert.deepEqual(result.warnings, ['豆包/火山方舟返回 JSON 已通过本地修复后解析。']);
  } finally {
    serverConfig.doubaoApiKey = originalApiKey;
    serverConfig.doubaoBaseUrl = originalBaseUrl;
    globalThis.fetch = originalFetch;
  }
});

test('doubao provider retries quick output safety blocks with a softer prompt', async () => {
  const originalApiKey = serverConfig.doubaoApiKey;
  const originalBaseUrl = serverConfig.doubaoBaseUrl;
  const originalFetch = globalThis.fetch;
  const capturedBodies: string[] = [];

  serverConfig.doubaoApiKey = 'test-key';
  serverConfig.doubaoBaseUrl = 'https://example.test/api/v3';
  globalThis.fetch = (async (_input, init) => {
    capturedBodies.push(typeof init?.body === 'string' ? init.body : '');

    if (capturedBodies.length === 1) {
      return {
        ok: false,
        status: 400,
        async text() {
          return '{"error":{"code":"OutputTextSensitiveContentDetected","message":"output text may contain sensitive information"}}';
        },
      } as Response;
    }

    return {
      ok: true,
      async json() {
        return {
          output: [
            {
              type: 'message',
              content: [
                {
                  type: 'output_text',
                  text: JSON.stringify({
                    contentRead: {
                      oneLineIntent: 'safe retry',
                    },
                  }),
                },
              ],
            },
          ],
        };
      },
    } as Response;
  }) as typeof fetch;

  try {
    const provider = createDoubaoPreflightProvider();
    const result = await provider.generateJson({
      request: {
        workspaceId: 'test',
        platform: 'xiaohongshu',
        goal: 'comment',
        mode: 'quick',
        contentDraft: {
          title: '标题',
          body: '正文',
          script: '',
        },
        mediaAssets: [],
        accountContext: '',
        targetAudience: '',
        desiredAction: '',
        brandGuardrails: '',
      },
      systemPrompt: 'system',
      userPrompt: 'user',
      images: [],
    });

    const retryPayload = JSON.parse(capturedBodies[1] ?? '') as {
      max_output_tokens: number;
      input: Array<{
        content: Array<{ type: string; text?: string }>;
      }>;
    };

    assert.equal(capturedBodies.length, 2);
    assert.equal(retryPayload.max_output_tokens, 1400);
    assert.match(retryPayload.input[1]?.content[0]?.text ?? '', /安全重试要求/);
    assert.deepEqual(result.warnings, ['豆包输出安全拦截后已用温和版本重试完成。']);
  } finally {
    serverConfig.doubaoApiKey = originalApiKey;
    serverConfig.doubaoBaseUrl = originalBaseUrl;
    globalThis.fetch = originalFetch;
  }
});

test('doubao provider retries truncated quick JSON with a short sketch prompt', async () => {
  const originalApiKey = serverConfig.doubaoApiKey;
  const originalBaseUrl = serverConfig.doubaoBaseUrl;
  const originalFetch = globalThis.fetch;
  const capturedBodies: string[] = [];

  serverConfig.doubaoApiKey = 'test-key';
  serverConfig.doubaoBaseUrl = 'https://example.test/api/v3';
  globalThis.fetch = (async (_input, init) => {
    capturedBodies.push(typeof init?.body === 'string' ? init.body : '');

    return {
      ok: true,
      async json() {
        return {
          output: [
            {
              type: 'message',
              content: [
                {
                  type: 'output_text',
                  text: capturedBodies.length === 1
                    ? 'plain text without a json object'
                    : JSON.stringify({
                        contentRead: {
                          oneLineIntent: 'short retry',
                        },
                      }),
                },
              ],
            },
          ],
        };
      },
    } as Response;
  }) as typeof fetch;

  try {
    const provider = createDoubaoPreflightProvider();
    const result = await provider.generateJson({
      request: {
        workspaceId: 'test',
        platform: 'xiaohongshu',
        goal: 'comment',
        mode: 'quick',
        contentDraft: {
          title: '标题',
          body: '正文',
          script: '',
        },
        mediaAssets: [],
        accountContext: '',
        targetAudience: '',
        desiredAction: '',
        brandGuardrails: '',
      },
      systemPrompt: 'system',
      userPrompt: 'user',
      images: [],
    });

    const retryPayload = JSON.parse(capturedBodies[1] ?? '') as {
      max_output_tokens: number;
      input: Array<{
        content: Array<{ type: string; text?: string }>;
      }>;
    };

    assert.equal(capturedBodies.length, 2);
    assert.equal(retryPayload.max_output_tokens, 1200);
    assert.match(retryPayload.input[1]?.content[0]?.text ?? '', /短草图重试要求/);
    assert.deepEqual(result.warnings, ['豆包 JSON 过长或不完整后已用短草图重试完成。']);
  } finally {
    serverConfig.doubaoApiKey = originalApiKey;
    serverConfig.doubaoBaseUrl = originalBaseUrl;
    globalThis.fetch = originalFetch;
  }
});
