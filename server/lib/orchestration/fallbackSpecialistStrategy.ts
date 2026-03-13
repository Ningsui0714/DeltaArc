import type { SpecialistBlueprint } from './specialists';
import type { Dossier, SpecialistOutput } from './types';
import { createEconomySpecialistOutput } from './fallbackSpecialistEconomy';
import { createMarketSpecialistOutput } from './fallbackSpecialistMarket';
import { createProductionSpecialistOutput } from './fallbackSpecialistProduction';
import { createRedTeamSpecialistOutput } from './fallbackSpecialistRedTeam';

export function createStrategySpecialistOutput(
  blueprint: SpecialistBlueprint,
  dossier: Dossier,
  primaryConcern: string,
  nextQuestion: string,
  evidenceRefs: string[],
  warning?: string,
): SpecialistOutput {
  if (blueprint.key === 'market') {
    return createMarketSpecialistOutput(blueprint, dossier, evidenceRefs, warning);
  }

  if (blueprint.key === 'production') {
    return createProductionSpecialistOutput(blueprint, dossier, primaryConcern, evidenceRefs, warning);
  }

  if (blueprint.key === 'economy') {
    return createEconomySpecialistOutput(blueprint, dossier, evidenceRefs, warning);
  }

  return createRedTeamSpecialistOutput(
    blueprint,
    dossier,
    primaryConcern,
    nextQuestion,
    evidenceRefs,
    warning,
  );
}
