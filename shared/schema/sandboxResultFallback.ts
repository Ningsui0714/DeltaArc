import type { SandboxAnalysisMeta, SandboxAnalysisMode, SandboxAnalysisResult } from '../sandbox';
import { createAnalysisMeta } from './sandboxResultMeta';

export function createFallbackAnalysis(
  mode: SandboxAnalysisMode,
  model: string,
  pipeline: string[],
  meta: SandboxAnalysisMeta = createAnalysisMeta('local_fallback', 'degraded'),
): SandboxAnalysisResult {
  return {
    generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    mode,
    model,
    pipeline,
    meta,
    summary:
      'This run produced only a partial structure, so the result is still operating in a guarded fallback mode.',
    systemVerdict:
      'Keep the direction open, but narrow the next validation question before treating the current narrative as proven.',
    evidenceLevel: 'medium',
    primaryRisk:
      'Evidence coverage is still patchy, so isolated bright spots can easily be mistaken for a durable trajectory.',
    nextStep:
      'Collect the most decision-relevant counter-evidence and failure paths before rerunning the multi-stage forecast.',
    playerAcceptance: 60,
    confidence: 55,
    supportRatio: 58,
    scores: {
      coreFun: 62,
      learningCost: 56,
      novelty: 68,
      acceptanceRisk: 54,
      prototypeCost: 52,
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
      thesis: 'There is not enough evidence yet to support a sharp red-team case.',
      attackVectors: [],
      failureModes: [],
      mitigation: 'Preserve the counter-evidence lens and keep the next test small.',
    },
    memorySignals: [],
    report: {
      headline: 'Keep moving, but shrink the question before scaling the story.',
      summary:
        'This fallback output is useful as a structural preview, not as a final strategic call.',
      conclusion:
        'The direction may still work, but only if the project turns its success and failure conditions into observable signals.',
      whyNow:
        'Right now the highest leverage move is to sharpen the prediction structure, not to add more generic explanation.',
      risk:
        'Without explicit time-based forecasting and counter-evidence, the result can drift back into static analysis.',
      actions: [
        'Add the most important missing evidence.',
        'Rerun the multi-stage forecast.',
        'Compare the key timeline branches.',
        'Turn the next two weeks into concrete validation moves.',
      ],
    },
    warnings: [],
  };
}
