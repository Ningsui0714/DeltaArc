import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createAnalysisMeta,
  createFallbackAnalysis,
  normalizeFinalAnalysis,
  parseSandboxAnalysisRequest,
  parseSandboxAnalysisResult,
  SchemaError,
} from '../shared/schema';
import { parseJsonImport } from '../src/lib/import/parseJsonImport';
import { parseMarkdownImport } from '../src/lib/import/parseMarkdownImport';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readText(relativePath: string) {
  return readFile(path.join(rootDir, relativePath), 'utf8');
}

async function readJson(relativePath: string) {
  return JSON.parse(await readText(relativePath)) as unknown;
}

async function main() {
  const validRequest = parseSandboxAnalysisRequest(await readJson('examples/requests/valid-analysis-request.json'));
  assert.equal(validRequest.project.name, '代号：远岸旅团');
  assert.equal(validRequest.evidenceItems.length, 2);

  let invalidErrored = false;
  try {
    parseSandboxAnalysisRequest(await readJson('examples/requests/invalid-analysis-request-missing-project.json'));
  } catch (error) {
    invalidErrored = error instanceof SchemaError;
  }
  assert.equal(invalidErrored, true);

  const jsonImport = parseJsonImport(await readText('examples/project-bundle-upload-sample.json'));
  assert.equal(jsonImport.project?.name, '代号：远岸旅团');
  assert.equal(jsonImport.evidenceItems?.length, 3);

  const markdownImport = parseMarkdownImport(
    await readText('examples/coop-camp-upload-sample.md'),
    'coop-camp-upload-sample.md',
  );
  assert.ok(markdownImport.project);
  assert.equal(markdownImport.evidenceItems?.length, 1);

  const partialModelResponse = (await readJson(
    'examples/expected/model-response-missing-fields.json',
  )) as Record<string, unknown>;
  const normalizedResult = normalizeFinalAnalysis(
    partialModelResponse,
    createFallbackAnalysis(
      'balanced',
      'fixture-model',
      ['dossier@fixture'],
      createAnalysisMeta('remote', 'degraded', 'analysis_fixture_partial'),
    ),
  );
  assert.equal(normalizedResult.summary, '模型只返回了摘要。');
  assert.equal(normalizedResult.meta.status, 'degraded');
  assert.ok(normalizedResult.report.actions.length >= 4);

  const degradedResult = parseSandboxAnalysisResult(await readJson('examples/expected/degraded-analysis-result.json'));
  assert.equal(degradedResult.meta.source, 'remote');
  assert.equal(degradedResult.meta.status, 'degraded');
  assert.ok(degradedResult.pipeline.some((step) => step.includes('@local-fallback')));

  console.log('Fixture verification passed.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Fixture verification failed.');
  process.exitCode = 1;
});
