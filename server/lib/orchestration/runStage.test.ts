import assert from 'node:assert/strict';
import test from 'node:test';
import type { SandboxAnalysisRequest } from '../../../shared/sandbox';
import { serverConfig } from '../../config';
import { runJsonStage } from './runStage';

function createRequest(): SandboxAnalysisRequest {
  return {
    workspaceId: 'workspace_test_run_stage',
    mode: 'reasoning',
    project: {
      name: 'Campfire Co-op',
      mode: 'Concept',
      genre: 'survival',
      platforms: ['PC'],
      targetPlayers: ['co-op players'],
      coreFantasy: 'survive together',
      ideaSummary: 'A co-op survival concept',
      coreLoop: 'explore -> gather -> build',
      sessionLength: '20m',
      differentiators: 'shared traps',
      progressionHook: 'base upgrades',
      socialHook: 'paired actions',
      monetization: 'premium',
      referenceGames: ['Dont Starve Together'],
      validationGoal: 'Check if co-op rituals improve mid-game retention.',
      productionConstraints: '2 devs',
      currentStatus: 'concept',
    },
    evidenceItems: [],
  };
}

test('runJsonStage falls back to the balanced model when the reasoning model returns empty JSON content', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = serverConfig.deepseekApiKey;
  const calls: string[] = [];

  serverConfig.deepseekApiKey = 'test-key';
  globalThis.fetch = (async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as { model: string };
    calls.push(body.model);

    if (body.model === serverConfig.reasoningModel) {
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: '',
              },
              finish_reason: 'stop',
            },
          ],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: '{"summary":"fallback ok","warnings":["balanced warning"]}',
            },
          },
        ],
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }) as typeof fetch;

  try {
    const result = await runJsonStage(
      createRequest(),
      'synthesis-future',
      'reasoning',
      0.12,
      [
        {
          role: 'system',
          content: 'Return one JSON object only.',
        },
        {
          role: 'user',
          content: 'Return {"summary":"ok"}',
        },
      ],
      1_000,
      300,
    );

    assert.equal(result.model, serverConfig.balancedModel);
    assert.deepEqual(result.data, {
      summary: 'fallback ok',
      warnings: ['balanced warning'],
    });
    assert.deepEqual(calls, [serverConfig.reasoningModel, serverConfig.balancedModel]);
    assert.equal(result.degraded, true);
    assert.ok(
      result.warnings.some((warning) =>
        warning.includes('returned no usable content on the reasoning model'),
      ),
    );
  } finally {
    globalThis.fetch = originalFetch;
    serverConfig.deepseekApiKey = originalApiKey;
  }
});

test('runJsonStage gives reasoning requests extra max_tokens headroom for chain-of-thought output', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = serverConfig.deepseekApiKey;
  let capturedMaxTokens: number | undefined;

  serverConfig.deepseekApiKey = 'test-key';
  globalThis.fetch = (async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as { max_tokens?: number };
    capturedMaxTokens = body.max_tokens;

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: '{"summary":"ok"}',
            },
          },
        ],
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }) as typeof fetch;

  try {
    await runJsonStage(
      createRequest(),
      'systems',
      'reasoning',
      0.12,
      [
        {
          role: 'system',
          content: 'Return one JSON object only.',
        },
        {
          role: 'user',
          content: 'Return {"summary":"ok"}',
        },
      ],
      1_000,
      3_000,
    );

    assert.equal(capturedMaxTokens, 11_192);
  } finally {
    globalThis.fetch = originalFetch;
    serverConfig.deepseekApiKey = originalApiKey;
  }
});
