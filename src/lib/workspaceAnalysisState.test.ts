import assert from 'node:assert/strict';
import test from 'node:test';
import { createAnalysisMeta, createFallbackAnalysis } from '../../shared/schema';
import {
  deriveWorkspaceAnalysisState,
  markAnalysisStale,
  resetWorkspaceAnalysis,
} from './workspaceAnalysisState';

function createRemoteAnalysis() {
  return createFallbackAnalysis(
    'balanced',
    'fixture-model',
    ['dossier@remote', 'synthesis@remote'],
    createAnalysisMeta('remote', 'fresh', 'analysis_fixture_remote'),
  );
}

test('workspace analysis state unlocks outputs for fresh remote results', () => {
  const analysis = createRemoteAnalysis();

  const state = deriveWorkspaceAnalysisState(analysis);

  assert.equal(state.hasViewableOutput, true);
  assert.equal(state.isFresh, true);
  assert.equal(state.isStale, false);
  assert.equal(state.requiresRerun, false);
  assert.equal(state.lastCompletedAt, analysis.generatedAt);
});

test('markAnalysisStale keeps the last remote result viewable after inputs change', () => {
  const analysis = createRemoteAnalysis();

  const staleAnalysis = markAnalysisStale(analysis);
  const state = deriveWorkspaceAnalysisState(staleAnalysis);

  assert.equal(staleAnalysis.meta.source, 'remote');
  assert.equal(staleAnalysis.meta.status, 'stale');
  assert.equal(staleAnalysis.summary, analysis.summary);
  assert.equal(state.hasViewableOutput, true);
  assert.equal(state.isFresh, false);
  assert.equal(state.isStale, true);
  assert.equal(state.requiresRerun, true);
});

test('workspace analysis state marks a fresh remote result stale when current inputs no longer match', () => {
  const analysis = createRemoteAnalysis();

  const state = deriveWorkspaceAnalysisState(analysis, { matchesCurrentInputs: false });

  assert.equal(state.hasViewableOutput, true);
  assert.equal(state.isFresh, false);
  assert.equal(state.isStale, true);
  assert.equal(state.requiresRerun, true);
});

test('resetWorkspaceAnalysis clears outputs when the whole workspace is reset', () => {
  const resetAnalysis = resetWorkspaceAnalysis('reasoning');
  const state = deriveWorkspaceAnalysisState(resetAnalysis);

  assert.equal(resetAnalysis.mode, 'reasoning');
  assert.equal(resetAnalysis.meta.source, 'local_fallback');
  assert.equal(state.hasViewableOutput, false);
  assert.equal(state.lastCompletedAt, '');
});
