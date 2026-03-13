import type { SandboxAnalysisRequest, SandboxMemorySignal } from '../../../shared/sandbox';
import type { Dossier } from './types';
import { summarizeEvidenceLevel, uniqueStrings } from './fallbackShared';

export function createDossierFallback(
  request: SandboxAnalysisRequest,
  memorySignals: SandboxMemorySignal[],
  reason = 'The remote dossier stage failed.',
): Dossier {
  const evidenceLevel = summarizeEvidenceLevel(request);
  const primaryAudience = request.project.targetPlayers[0] ?? 'the target audience';
  const evidenceDigest = request.evidenceItems.slice(0, 3).map((item) => ({
    title: item.title,
    signal: `${item.type} from ${item.source} (${item.trust} trust, ${item.createdAt || 'unknown date'})`,
    implication: item.summary,
  }));
  const confidence = evidenceLevel === 'high' ? 61 : evidenceLevel === 'medium' ? 54 : 46;
  const playerAcceptance = evidenceLevel === 'high' ? 64 : evidenceLevel === 'medium' ? 58 : 52;
  const supportRatio = evidenceLevel === 'high' ? 62 : evidenceLevel === 'medium' ? 56 : 49;

  return {
    systemFrame: `${request.project.name} is in ${request.project.mode} mode and is currently trying to validate ${request.project.validationGoal}.`,
    opportunityThesis: `The strongest near-term bet is to make ${request.project.coreFantasy || request.project.ideaSummary} feel immediately legible for ${primaryAudience}.`,
    evidenceLevel,
    playerAcceptance,
    confidence,
    supportRatio,
    scores: {
      coreFun: request.project.coreLoop ? 64 : 56,
      learningCost: request.project.sessionLength ? 57 : 52,
      novelty: request.project.differentiators ? 67 : 59,
      acceptanceRisk: evidenceLevel === 'high' ? 55 : evidenceLevel === 'medium' ? 50 : 45,
      prototypeCost: request.project.productionConstraints ? 49 : 57,
    },
    personas: request.project.targetPlayers.slice(0, 3).map((player, index) => ({
      name: player || `Persona ${index + 1}`,
      motive: `Wants ${request.project.coreFantasy || 'a clear promise'} without extra setup friction.`,
      accepts: request.project.coreLoop || request.project.ideaSummary,
      rejects:
        request.project.progressionHook ||
        request.project.productionConstraints ||
        'Loose scope and unclear payoff.',
      verdict: `Worth testing if the first-session payoff is obvious for ${player || 'this audience'}.`,
    })),
    hypotheses: [
      {
        title: 'Core fantasy can carry the first session',
        evidence:
          evidenceDigest[0]?.implication ?? 'No imported evidence yet; this is inferred from the project snapshot.',
        confidence,
        gap: `Need a focused test that proves whether players respond to ${request.project.validationGoal}.`,
      },
      {
        title: 'Scope discipline is as important as novelty',
        evidence:
          request.project.productionConstraints ||
          'Production constraints were not detailed, so scope risk remains under-specified.',
        confidence: Math.max(35, confidence - 12),
        gap: 'Need a prototype slice that confirms the differentiator survives under current production limits.',
      },
    ],
    evidenceDigest:
      evidenceDigest.length > 0
        ? evidenceDigest
        : [
            {
              title: 'Project snapshot',
              signal: 'No evidence items were imported for this run.',
              implication:
                'The quick scan is continuing from the project fields only, so conclusions should stay provisional.',
            },
          ],
    coreTensions: uniqueStrings(
      [
        request.project.productionConstraints
          ? `Production constraint: ${request.project.productionConstraints}`
          : undefined,
        request.project.differentiators
          ? `Differentiation has to stay visible without bloating onboarding: ${request.project.differentiators}`
          : undefined,
        request.project.monetization
          ? `Monetization should not outrun trust in the first retained session: ${request.project.monetization}`
          : undefined,
      ],
      4,
    ),
    openQuestions: uniqueStrings(
      [
        request.project.validationGoal
          ? `Can the next test directly prove: ${request.project.validationGoal}`
          : undefined,
        request.project.targetPlayers[0]
          ? `What makes ${request.project.targetPlayers[0]} stay after the first session?`
          : undefined,
        request.project.productionConstraints
          ? `Which scope cut best protects the core loop under this constraint: ${request.project.productionConstraints}?`
          : undefined,
        request.project.referenceGames[0]
          ? `Which expectation borrowed from ${request.project.referenceGames[0]} should be matched, and which should be rejected?`
          : undefined,
      ],
      5,
    ),
    memorySignals,
    warnings: uniqueStrings(
      [
        'Dossier stage fell back to a local summary built from the current project snapshot.',
        reason,
        request.evidenceItems.length === 0 ? 'No evidence items were imported for this run.' : undefined,
      ],
      4,
    ),
  };
}
