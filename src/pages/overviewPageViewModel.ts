import { getProjectReadiness } from '../lib/projectReadiness';
import { buildOverviewHeroViewModel, buildOverviewImportCardViewModel } from './overviewPageHero';
import {
  buildOverviewLaunchpadViewModel,
  buildOverviewRunStatusViewModel,
} from './overviewPageGuidance';
import { buildOverviewMetricsViewModel } from './overviewPageMetrics';
import { buildOverviewTimelineViewModel } from './overviewPageTimeline';
import type { OverviewPageViewModel, OverviewPageViewModelInput } from './overviewPageTypes';

export type { OverviewPageViewModel, OverviewPageViewModelInput } from './overviewPageTypes';

export function createOverviewPageViewModel(
  input: OverviewPageViewModelInput,
): OverviewPageViewModel {
  const readiness = getProjectReadiness(input.project, input.evidenceCount);

  return {
    hero: buildOverviewHeroViewModel(input, readiness.filledFieldCount),
    launchpad: buildOverviewLaunchpadViewModel(
      input,
      readiness.setupFieldCount,
      readiness.projectReady,
      readiness.evidenceReady,
    ),
    importCard: buildOverviewImportCardViewModel(input.language),
    runStatus: buildOverviewRunStatusViewModel(input, readiness.setupFieldCount),
    metrics: buildOverviewMetricsViewModel(
      input,
      readiness.setupFieldCount,
      readiness.projectReady,
      readiness.evidenceReady,
    ),
    timeline: buildOverviewTimelineViewModel(input.language),
  };
}
