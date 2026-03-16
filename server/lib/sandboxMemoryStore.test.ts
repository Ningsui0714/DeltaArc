import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { ProjectSnapshot } from '../../shared/domain';
import type { SandboxAnalysisResult } from '../../shared/sandbox';
import { createJsonMemoryStore } from './sandboxMemoryStore';

function createProject(
  name: string,
  overrides: Partial<ProjectSnapshot> = {},
): ProjectSnapshot {
  return {
    name,
    mode: 'Concept',
    genre: 'Co-op survival',
    platforms: ['PC'],
    targetPlayers: ['Co-op players'],
    coreFantasy: 'Recover a collapsing run together.',
    ideaSummary: 'A compact co-op extraction loop.',
    coreLoop: 'Scout -> collect -> escape',
    sessionLength: '15 minutes',
    differentiators: 'High-pressure rescue beats.',
    progressionHook: 'Unlock rescue kit upgrades.',
    socialHook: 'Partner coordination under pressure.',
    monetization: 'Premium',
    referenceGames: ['Deep Rock Galactic'],
    validationGoal: 'Verify the co-op rescue payoff.',
    productionConstraints: 'Two-person team, six weeks.',
    currentStatus: 'Prototype planning',
    ...overrides,
  };
}

function createAnalysis(summary: string, primaryRisk: string): SandboxAnalysisResult {
  return {
    generatedAt: new Date().toISOString(),
    mode: 'balanced',
    model: 'test-model',
    pipeline: ['dossier@test-model'],
    meta: {
      source: 'remote',
      status: 'fresh',
      requestId: `analysis_${summary}`,
    },
    summary,
    systemVerdict: 'Promising but still needs sharper validation.',
    evidenceLevel: 'medium',
    primaryRisk,
    nextStep: 'Run one focused prototype test.',
    playerAcceptance: 58,
    confidence: 55,
    supportRatio: 57,
    scores: {
      coreFun: 60,
      learningCost: 52,
      novelty: 64,
      acceptanceRisk: 48,
      prototypeCost: 51,
    },
    personas: [],
    hypotheses: [],
    strategies: [],
    perspectives: [],
    blindSpots: [],
    secondOrderEffects: [],
    scenarioVariants: [],
    futureTimeline: [],
    communityRhythms: [],
    trajectorySignals: [],
    decisionLenses: [],
    validationTracks: [],
    contrarianMoves: [],
    unknowns: [],
    redTeam: {
      thesis: 'The core loop could still be too thin.',
      attackVectors: [],
      failureModes: [],
      mitigation: 'Keep the test slice narrow.',
    },
    memorySignals: [],
    report: {
      headline: 'Keep the scope tight.',
      summary: 'The concept is viable if the first-session payoff lands quickly.',
      conclusion: 'Validate the first retained session before broadening scope.',
      whyNow: 'The current risk is mostly clarity, not ambition.',
      risk: primaryRisk,
      actions: ['Prototype the rescue beat.'],
    },
    warnings: [],
  };
}

test('createJsonMemoryStore serializes concurrent writes so both records survive', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'wind-tunnel-memory-'));
  const memoryFilePath = path.join(tempDir, 'sandbox-memory.json');
  const store = createJsonMemoryStore(memoryFilePath);
  const project = createProject('Memory Test');

  try {
    await Promise.all([
      store.persist(project, createAnalysis('Summary A', 'Risk A')),
      store.persist(project, createAnalysis('Summary B', 'Risk B')),
    ]);

    const content = JSON.parse(await readFile(memoryFilePath, 'utf8')) as Array<{ summary: string }>;

    assert.equal(content.length, 2);
    assert.deepEqual(
      new Set(content.map((record) => record.summary)),
      new Set(['Summary A', 'Summary B']),
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('createJsonMemoryStore keeps memories for the same project name even after the project draft changes', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'wind-tunnel-memory-'));
  const memoryFilePath = path.join(tempDir, 'sandbox-memory.json');
  const store = createJsonMemoryStore(memoryFilePath);

  try {
    await store.persist(
      createProject('Project Orion', {
        genre: 'Stealth tactics',
        referenceGames: ['Invisible, Inc.'],
      }),
      createAnalysis('Old Orion summary', 'Old Orion risk'),
    );

    const relevant = await store.loadRelevant(
      createProject('Project Orion', {
        genre: 'Urban mystery',
        referenceGames: ['Disco Elysium'],
        targetPlayers: ['Narrative players'],
      }),
    );

    assert.equal(relevant.length, 1);
    assert.equal(relevant[0]?.projectName, 'Project Orion');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('createJsonMemoryStore ignores unrelated projects that only overlap on one broad reference token', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'wind-tunnel-memory-'));
  const memoryFilePath = path.join(tempDir, 'sandbox-memory.json');
  const store = createJsonMemoryStore(memoryFilePath);

  try {
    await store.persist(
      createProject('Mixologist', {
        genre: 'Narrative bartending',
        coreFantasy: 'Read emotions and answer them with drinks.',
        ideaSummary: 'Verify whether AI memory can support long-term emotional continuity.',
        validationGoal: 'Prove the emotional memory loop before scaling.',
        targetPlayers: ['Narrative players'],
      }),
      createAnalysis('Mixologist summary', 'Mixologist risk'),
    );

    const relevant = await store.loadRelevant(
      createProject('City Driver', {
        genre: 'Urban action RPG',
        coreFantasy: 'Drive through a supernatural city and solve anomalies.',
        ideaSummary: 'Verify whether city driving and anomaly quests can support retention.',
        validationGoal: 'Turn launch heat into durable retention.',
        targetPlayers: ['Open-world players'],
      }),
    );

    assert.equal(relevant.length, 0);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
