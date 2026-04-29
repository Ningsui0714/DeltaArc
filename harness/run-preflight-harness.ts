import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parsePreflightSimulationRequest,
  type PreflightMediaAsset,
  type PreflightSimulationRequest,
  type PreflightSimulationResult,
} from '../shared/preflightSimulation';
import { createMockPreflightProvider } from '../server/lib/preflight/mockProvider';
import { runPreflightSimulation } from '../server/lib/preflight/runPreflightSimulation';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(__dirname, 'fixtures');
const outputDir = path.join(__dirname, 'output');

type StableSnapshot = {
  provider: string;
  mode: string;
  cohortShares: Array<{
    tier: string;
    share: number;
  }>;
  replyCounts: Record<string, number>;
  firstReplies: Record<string, string>;
  riskTitles: string[];
  interventionTargets: string[];
  attentionScore: number;
};

function getMimeTypeFromPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.svg') {
    return 'image/svg+xml';
  }
  if (ext === '.png') {
    return 'image/png';
  }
  if (ext === '.webp') {
    return 'image/webp';
  }
  return 'image/jpeg';
}

async function resolveMediaAssets(
  fixturePath: string,
  mediaAssets: PreflightMediaAsset[],
): Promise<PreflightMediaAsset[]> {
  const fixtureFolder = path.dirname(fixturePath);

  return Promise.all(
    mediaAssets.map(async (asset) => {
      if (!asset.imagePath) {
        return asset;
      }

      const absoluteImagePath = path.resolve(fixtureFolder, asset.imagePath);
      const buffer = await readFile(absoluteImagePath);
      const mimeType = asset.mimeType || getMimeTypeFromPath(absoluteImagePath);

      return {
        ...asset,
        mimeType,
        base64: buffer.toString('base64'),
        imagePath: undefined,
      };
    }),
  );
}

function createStableSnapshot(result: PreflightSimulationResult): StableSnapshot {
  const replyCounts = result.simulatedReplies.reduce<Record<string, number>>((accumulator, reply) => {
    accumulator[reply.relevanceTier] = (accumulator[reply.relevanceTier] ?? 0) + 1;
    return accumulator;
  }, {});

  const firstReplies = result.simulatedReplies.reduce<Record<string, string>>((accumulator, reply) => {
    if (!accumulator[reply.relevanceTier]) {
      accumulator[reply.relevanceTier] = reply.text;
    }
    return accumulator;
  }, {});

  return {
    provider: result.provider,
    mode: result.mode,
    cohortShares: result.pushModel.cohorts.map((cohort) => ({
      tier: cohort.relevanceTier,
      share: cohort.exposureShare,
    })),
    replyCounts,
    firstReplies,
    riskTitles: result.risks.map((risk) => risk.title),
    interventionTargets: result.interventions.map((intervention) => intervention.target),
    attentionScore: result.imageInsight.attentionScore,
  };
}

async function loadRequest(fixturePath: string) {
  const rawFixture = await readFile(fixturePath, 'utf8');
  const parsedFixture = parsePreflightSimulationRequest(JSON.parse(rawFixture));
  const mediaAssets = await resolveMediaAssets(fixturePath, parsedFixture.mediaAssets);

  return {
    ...parsedFixture,
    mediaAssets,
  } satisfies PreflightSimulationRequest;
}

async function runFixture(fixturePath: string, updateExpected: boolean) {
  const request = await loadRequest(fixturePath);
  const result = await runPreflightSimulation(request, {
    provider: createMockPreflightProvider(),
  });
  const snapshot = createStableSnapshot(result);
  const fixtureBaseName = path.basename(fixturePath, '.request.json');
  const expectedPath = path.join(path.dirname(fixturePath), `${fixtureBaseName}.expected.json`);
  const actualPath = path.join(outputDir, `${fixtureBaseName}.actual.json`);

  await mkdir(outputDir, { recursive: true });
  await writeFile(actualPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  if (updateExpected) {
    await writeFile(expectedPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    return {
      fixtureBaseName,
      actualPath,
      expectedPath,
      updated: true,
    };
  }

  const expectedRaw = await readFile(expectedPath, 'utf8');
  const expectedSnapshot = JSON.parse(expectedRaw) as StableSnapshot;
  const actualJson = JSON.stringify(snapshot);
  const expectedJson = JSON.stringify(expectedSnapshot);

  if (actualJson !== expectedJson) {
    throw new Error(
      `Fixture ${fixtureBaseName} snapshot mismatch.\nExpected: ${expectedPath}\nActual: ${actualPath}`,
    );
  }

  return {
    fixtureBaseName,
    actualPath,
    expectedPath,
    updated: false,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const updateExpected = args.includes('--update');
  const fixtureArg = args.find((arg) => !arg.startsWith('--'));
  const fixturePaths = fixtureArg
    ? [path.resolve(process.cwd(), fixtureArg)]
    : [path.join(fixtureDir, 'campus-coffee-demo.request.json')];

  for (const fixturePath of fixturePaths) {
    const result = await runFixture(fixturePath, updateExpected);
    console.log(
      `${result.updated ? 'Updated' : 'Verified'} ${result.fixtureBaseName}\n- expected: ${result.expectedPath}\n- actual: ${result.actualPath}`,
    );
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
