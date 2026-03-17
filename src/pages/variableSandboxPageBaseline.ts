import type { FrozenBaseline } from '../../shared/variableSandbox';
import {
  formatBaselineSourceStatus,
  formatVariableSandboxTimestamp,
} from './variableSandboxPageFormatting';
import type {
  FreezeBaselineSourceStatus,
  VariableSandboxPageViewModel,
  VariableSandboxPageViewModelInput,
} from './variableSandboxPageTypes';

function getEmptyBaselineTitle(
  sourceStatus: FreezeBaselineSourceStatus,
  language: VariableSandboxPageViewModelInput['language'],
) {
  if (sourceStatus === 'degraded') {
    return language === 'en'
      ? 'Freeze this latest degraded result into the first reusable baseline'
      : '把这份最新降级结果冻结成第一份可复用基线';
  }

  if (sourceStatus === 'stale') {
    return language === 'en'
      ? 'A current remote result is required before freezing the first baseline'
      : '需要一份当前最新远端结果，才能冻结第一份基线';
  }

  return language === 'en'
    ? 'Freeze this formal result into the first reusable baseline'
    : '把这份正式结果冻结成第一份可复用基线';
}

function getEmptyBaselineDescription(
  sourceStatus: FreezeBaselineSourceStatus,
  language: VariableSandboxPageViewModelInput['language'],
) {
  if (sourceStatus === 'degraded') {
    return language === 'en'
      ? 'Freeze it first so later variable scans stop depending on a transient job, but treat follow-up conclusions more cautiously.'
      : '先冻结下来，避免后续变量推演继续依赖临时任务，但把后续结论当作更谨慎的验证基线。';
  }

  if (sourceStatus === 'stale') {
    return language === 'en'
      ? 'The visible result is no longer the latest truth source. Rerun formal inference before freezing.'
      : '当前可见结果已经不是最新真相源，必须先重跑正式推演，才能继续冻结基线。';
  }

  return language === 'en'
    ? 'Once frozen, later variable scans no longer depend on a transient in-memory job. Refreshes and restarts will still find the same truth source.'
    : '一旦冻结完成，后续变量推演就不再依赖临时的内存任务。刷新页面或重启服务后，仍会读到同一份真相源。';
}

function getExistingBaselineDescription(
  sourceStatus: FreezeBaselineSourceStatus,
  latestBaseline: FrozenBaseline,
  language: VariableSandboxPageViewModelInput['language'],
) {
  const frozenAt = formatVariableSandboxTimestamp(
    latestBaseline.createdAt,
    language,
  );
  const sourceAt = formatVariableSandboxTimestamp(
    latestBaseline.sourceAnalysisGeneratedAt,
    language,
  );

  if (language === 'en') {
    let suffix =
      ' The current visible result can still be frozen into a newer snapshot.';

    if (sourceStatus === 'degraded') {
      suffix =
        ' The current visible result is degraded but still eligible for freezing as a new snapshot.';
    } else if (sourceStatus === 'stale') {
      suffix =
        ' The current visible result is stale, so rerun formal inference before freezing another snapshot.';
    }

    return `Latest baseline frozen at ${frozenAt} from the formal result completed at ${sourceAt}.${suffix}`;
  }

  let suffix = ' 当前这份可见结果也可以继续冻结成更新快照。';

  if (sourceStatus === 'degraded') {
    suffix = ' 当前可见结果虽然是降级结果，但仍可继续冻结成新快照。';
  } else if (sourceStatus === 'stale') {
    suffix = ' 当前可见结果已经过期，需先重跑正式推演后才能再冻结新快照。';
  }

  return `最新基线冻结于 ${frozenAt}，来源正式结果完成于 ${sourceAt}。${suffix}`;
}

function getEmptyBaselineBullet(
  sourceStatus: FreezeBaselineSourceStatus,
  language: VariableSandboxPageViewModelInput['language'],
) {
  if (sourceStatus === 'degraded') {
    return language === 'en'
      ? 'Degraded results can still be frozen, but they work best as cautious validation baselines.'
      : '降级结果也可以冻结，但更适合作为谨慎验证基线。';
  }

  if (sourceStatus === 'stale') {
    return language === 'en'
      ? 'The visible result is stale now. A newer remote run must land before freezing.'
      : '当前可见结果已过期，必须先拿到更新的远端结果才能冻结。';
  }

  return language === 'en'
    ? 'Freeze once, and this area becomes the stable truth source for the sandbox.'
    : '完成第一次冻结后，这里就会成为变量推演稳定可复用的真相源。';
}

function buildBaselineBullets(
  latestBaseline: FrozenBaseline | null,
  baselineError: string | null,
  sourceStatus: FreezeBaselineSourceStatus,
  language: VariableSandboxPageViewModelInput['language'],
) {
  const bullets: string[] = [];

  if (latestBaseline) {
    bullets.push(
      language === 'en'
        ? `Source verdict: ${latestBaseline.analysisSnapshot.systemVerdict}`
        : `来源结论：${latestBaseline.analysisSnapshot.systemVerdict}`,
    );
    bullets.push(
      language === 'en'
        ? `Primary risk: ${latestBaseline.analysisSnapshot.primaryRisk}`
        : `核心风险：${latestBaseline.analysisSnapshot.primaryRisk}`,
    );
    bullets.push(
      language === 'en'
        ? `Snapshot status: ${formatBaselineSourceStatus(
            latestBaseline.sourceAnalysisStatus,
            language,
          )}`
        : `快照状态：${formatBaselineSourceStatus(
            latestBaseline.sourceAnalysisStatus,
            language,
          )}`,
    );
  } else {
    bullets.push(getEmptyBaselineBullet(sourceStatus, language));
  }

  if (baselineError) {
    bullets.push(baselineError);
  }

  return bullets;
}

function getFreezeButtonLabel(
  baselineStatus: VariableSandboxPageViewModelInput['baselineStatus'],
  baselineCount: number,
  language: VariableSandboxPageViewModelInput['language'],
) {
  if (baselineStatus === 'saving') {
    return language === 'en' ? 'Freezing Baseline' : '正在冻结基线';
  }

  if (baselineCount > 0) {
    return language === 'en' ? 'Freeze New Snapshot' : '再冻结一份最新快照';
  }

  return language === 'en' ? 'Freeze as Baseline' : '冻结成基线';
}

export function buildVariableSandboxBaselineViewModel(
  input: VariableSandboxPageViewModelInput,
  latestBaseline: FrozenBaseline | null,
): VariableSandboxPageViewModel['baseline'] {
  return {
    eyebrow: input.language === 'en' ? 'Baseline Source' : '基线来源',
    title: latestBaseline
      ? input.language === 'en'
        ? `${input.baselines.length} baseline snapshot(s) are already available`
        : `当前已经有 ${input.baselines.length} 份基线快照`
      : getEmptyBaselineTitle(input.freezeBaselineSourceStatus, input.language),
    description: latestBaseline
      ? getExistingBaselineDescription(
          input.freezeBaselineSourceStatus,
          latestBaseline,
          input.language,
        )
      : getEmptyBaselineDescription(
          input.freezeBaselineSourceStatus,
          input.language,
        ),
    bullets: buildBaselineBullets(
      latestBaseline,
      input.baselineError,
      input.freezeBaselineSourceStatus,
      input.language,
    ),
    freezeButtonLabel: getFreezeButtonLabel(
      input.baselineStatus,
      input.baselines.length,
      input.language,
    ),
  };
}
