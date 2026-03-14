import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createAnalysisMeta,
  createFallbackAnalysis,
  normalizeFinalAnalysis,
  parseCreateFrozenBaselineRequest,
  parseDesignVariableV1,
  parseFrozenBaseline,
  parsePersistedLatestAnalysis,
  parseSandboxAnalysisRequest,
  parseSandboxAnalysisResult,
  parseVariableImpactScanRequest,
  parseVariableImpactScanResult,
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

  const createBaselineRequest = parseCreateFrozenBaselineRequest(
    await readJson('examples/baselines/create-frozen-baseline-request.json'),
  );
  assert.equal(createBaselineRequest.analysis.meta.status, 'fresh');
  assert.equal(createBaselineRequest.evidenceItems.length, 2);

  const frozenBaseline = parseFrozenBaseline(await readJson('examples/baselines/valid-frozen-baseline.json'));
  assert.equal(frozenBaseline.projectId, 'project_yuanaan_001');
  assert.equal(frozenBaseline.analysisSnapshot.validationTracks.length, 1);

  const persistedLatestAnalysis = parsePersistedLatestAnalysis(
    await readJson('examples/baselines/valid-persisted-latest-analysis.json'),
  );
  assert.equal(persistedLatestAnalysis.workspaceId, 'workspace_yuanaan_001');
  assert.equal(persistedLatestAnalysis.analysis.meta.requestId, 'analysis_yuanaan_001');

  const designVariable = parseDesignVariableV1(
    await readJson('examples/variables/valid-design-variable-v1.json'),
  );
  assert.equal(designVariable.category, 'gameplay');
  assert.equal(designVariable.activationStage, 'mid');

  const impactScanRequest = parseVariableImpactScanRequest(
    await readJson('examples/impact-scans/valid-impact-scan-request.json'),
  );
  assert.equal(impactScanRequest.baselineId, 'baseline_yuanaan_001');
  assert.equal(impactScanRequest.variable.name, '双人协作机关');

  const impactScanResult = parseVariableImpactScanResult(
    await readJson('examples/impact-scans/valid-impact-scan-result.json'),
  );
  assert.equal(impactScanResult.impactScan.length, 2);
  assert.equal(impactScanResult.guardrails[0]?.priority, 'P0');

  console.log('Fixture verification passed.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Fixture verification failed.');
  process.exitCode = 1;
});
