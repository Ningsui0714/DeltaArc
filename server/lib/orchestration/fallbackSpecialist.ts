import type { SpecialistBlueprint } from './specialists';
import type { Dossier, SpecialistOutput } from './types';
import { createGameplaySpecialistOutput } from './fallbackSpecialistGameplay';
import { createStrategySpecialistOutput } from './fallbackSpecialistStrategy';

type LocalSpecialistVariant = 'quick_scan' | 'fallback';

function createLocalSpecialistOutput(
  blueprint: SpecialistBlueprint,
  dossier: Dossier,
  variant: LocalSpecialistVariant,
): SpecialistOutput {
  const primaryConcern =
    dossier.coreTensions[0] ?? 'Evidence is still too thin to treat the current direction as proven.';
  const nextQuestion =
    dossier.openQuestions[0] ?? 'Turn the next uncertain assumption into a concrete validation task.';
  const evidenceRefs = dossier.evidenceDigest.slice(0, 2).map((item) => item.title);
  const warning =
    variant === 'fallback' ? `${blueprint.label} 使用本地启发式视角继续推演。` : undefined;

  const gameplayOutput = createGameplaySpecialistOutput(
    blueprint,
    dossier,
    primaryConcern,
    nextQuestion,
    evidenceRefs,
    warning,
  );

  if (gameplayOutput) {
    return gameplayOutput;
  }

  return createStrategySpecialistOutput(
    blueprint,
    dossier,
    primaryConcern,
    nextQuestion,
    evidenceRefs,
    warning,
  );
}

export function createQuickScanSpecialistOutput(
  blueprint: SpecialistBlueprint,
  dossier: Dossier,
): SpecialistOutput {
  return createLocalSpecialistOutput(blueprint, dossier, 'quick_scan');
}

export function createSpecialistFallback(blueprint: SpecialistBlueprint, dossier: Dossier): SpecialistOutput {
  return createLocalSpecialistOutput(blueprint, dossier, 'fallback');
}
