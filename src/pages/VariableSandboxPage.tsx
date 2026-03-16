import type { FrozenBaseline } from '../../shared/variableSandbox';
import type { SandboxReport } from '../../shared/sandbox';
import { ImpactScanPanel } from '../components/variableSandbox/ImpactScanPanel';
import { VariableEditorCard } from '../components/variableSandbox/VariableEditorCard';
import { useVariableImpactScan } from '../hooks/useVariableImpactScan';
import { isEnglishUi, useUiLanguage } from '../hooks/useUiLanguage';

type VariableSandboxPageProps = {
  workspaceId: string;
  report: SandboxReport;
  baselines: FrozenBaseline[];
  baselineStatus: 'idle' | 'loading' | 'saving' | 'error';
  baselineError: string | null;
  canFreezeBaseline: boolean;
  freezeBaselineSourceStatus: 'fresh' | 'degraded' | 'stale';
  onFreezeBaseline: () => void;
  onBackToReport: () => void;
};

function formatTimestamp(value: string, language: 'zh' | 'en') {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

function formatBaselineSourceStatus(value: FrozenBaseline['sourceAnalysisStatus'], isEnglish: boolean) {
  if (isEnglish) {
    return value === 'degraded' ? 'Degraded result' : 'Fresh result';
  }

  return value === 'degraded' ? '降级结果' : '最新结果';
}

function getSandboxFlowStateLabel(
  state: 'done' | 'current' | 'upcoming',
  isEnglish: boolean,
) {
  if (state === 'done') {
    return isEnglish ? 'Done' : '已完成';
  }

  if (state === 'current') {
    return isEnglish ? 'Current' : '当前';
  }

  return isEnglish ? 'Next' : '下一步';
}

function getFreezeBaselineFlowCopy(
  sourceStatus: VariableSandboxPageProps['freezeBaselineSourceStatus'],
  isEnglish: boolean,
) {
  if (sourceStatus === 'degraded') {
    return isEnglish
      ? 'The latest visible result is degraded, but it can still be frozen as a cautious baseline.'
      : '当前可见的是最新降级结果，仍可先冻结成基线，但后续变量结论要更谨慎解读。';
  }

  if (sourceStatus === 'stale') {
    return isEnglish
      ? 'The visible result is stale. Rerun formal inference before freezing a new baseline.'
      : '当前可见结果已经过期，先重跑正式推演，再冻结新的基线。';
  }

  return isEnglish
    ? 'Turn the latest formal result into a reusable truth source first.'
    : '先把最新正式结果冻结成可复用真相源。';
}

function getFreezeBaselineEmptyTitle(
  sourceStatus: VariableSandboxPageProps['freezeBaselineSourceStatus'],
  isEnglish: boolean,
) {
  if (sourceStatus === 'degraded') {
    return isEnglish
      ? 'Freeze this latest degraded result into the first reusable baseline'
      : '把这份最新降级结果冻结成第一份可复用基线';
  }

  if (sourceStatus === 'stale') {
    return isEnglish
      ? 'A current remote result is required before freezing the first baseline'
      : '需要一份当前最新远端结果，才能冻结第一份基线';
  }

  return isEnglish
    ? 'Freeze this formal result into the first reusable baseline'
    : '把这份正式结果冻结成第一份可复用基线';
}

function getFreezeBaselineEmptyDescription(
  sourceStatus: VariableSandboxPageProps['freezeBaselineSourceStatus'],
  isEnglish: boolean,
) {
  if (sourceStatus === 'degraded') {
    return isEnglish
      ? 'Freeze it first so later variable scans stop depending on a transient job, but treat follow-up conclusions more cautiously.'
      : '先冻结下来，避免后续变量推演继续依赖临时任务，但把后续结论当作更谨慎的验证基线。';
  }

  if (sourceStatus === 'stale') {
    return isEnglish
      ? 'The visible result is no longer the latest truth source. Rerun formal inference before freezing.'
      : '当前可见结果已经不是最新真相源，必须先重跑正式推演，才能继续冻结基线。';
  }

  return isEnglish
    ? 'Once frozen, later variable scans no longer depend on a transient in-memory job. Refreshes and restarts will still find the same truth source.'
    : '一旦冻结完成，后续变量推演就不再依赖临时的内存任务。刷新页面或重启服务后，仍会读到同一份真相源。';
}

function getFreezeBaselineExistingDescription(
  sourceStatus: VariableSandboxPageProps['freezeBaselineSourceStatus'],
  latestBaseline: FrozenBaseline,
  language: 'zh' | 'en',
  isEnglish: boolean,
) {
  const frozenAt = formatTimestamp(latestBaseline.createdAt, language);
  const sourceAt = formatTimestamp(latestBaseline.sourceAnalysisGeneratedAt, language);

  if (isEnglish) {
    const suffix =
      sourceStatus === 'degraded'
        ? ' The current visible result is degraded but still eligible for freezing as a new snapshot.'
        : sourceStatus === 'stale'
          ? ' The current visible result is stale, so rerun formal inference before freezing another snapshot.'
          : ' The current visible result can still be frozen into a newer snapshot.';

    return `Latest baseline frozen at ${frozenAt} from the formal result completed at ${sourceAt}.${suffix}`;
  }

  const suffix =
    sourceStatus === 'degraded'
      ? ' 当前可见结果虽然是降级结果，但仍可继续冻结成新快照。'
      : sourceStatus === 'stale'
        ? ' 当前可见结果已经过期，需先重跑正式推演后才能再冻结新快照。'
        : ' 当前这份可见结果也可以继续冻结成更新快照。';

  return `最新基线冻结于 ${frozenAt}，来源正式结果完成于 ${sourceAt}。${suffix}`;
}

function getFreezeBaselineEmptyBullet(
  sourceStatus: VariableSandboxPageProps['freezeBaselineSourceStatus'],
  isEnglish: boolean,
) {
  if (sourceStatus === 'degraded') {
    return isEnglish
      ? 'Degraded results can still be frozen, but they work best as cautious validation baselines.'
      : '降级结果也可以冻结，但更适合作为谨慎验证基线。';
  }

  if (sourceStatus === 'stale') {
    return isEnglish
      ? 'The visible result is stale now. A newer remote run must land before freezing.'
      : '当前可见结果已过期，必须先拿到更新的远端结果才能冻结。';
  }

  return isEnglish
    ? 'Freeze once, and this area becomes the stable truth source for the sandbox.'
    : '完成第一次冻结后，这里就会成为变量推演稳定可复用的真相源。';
}

export function VariableSandboxPage({
  workspaceId,
  report,
  baselines,
  baselineStatus,
  baselineError,
  canFreezeBaseline,
  freezeBaselineSourceStatus,
  onFreezeBaseline,
  onBackToReport,
}: VariableSandboxPageProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const latestBaseline = baselines[0] ?? null;
  const isFreezingBaseline = baselineStatus === 'saving';
  const variableSandbox = useVariableImpactScan({
    workspaceId,
    baseline: latestBaseline,
  });
  const hasStartedScan =
    Boolean(variableSandbox.job) || Boolean(variableSandbox.result) || variableSandbox.status !== 'idle';
  const currentScanStage = variableSandbox.job?.stages.find((stage) => stage.status === 'running')?.label ?? null;
  const sandboxFlow = [
    {
      id: 'baseline',
      index: '01',
      title: isEnglish ? 'Freeze baseline' : '冻结基线',
      state: latestBaseline ? 'done' : canFreezeBaseline ? 'current' : 'upcoming',
      detail: latestBaseline
        ? isEnglish
          ? `Latest baseline saved at ${formatTimestamp(latestBaseline.createdAt, language)}`
          : `最新基线已冻结于 ${formatTimestamp(latestBaseline.createdAt, language)}`
        : getFreezeBaselineFlowCopy(freezeBaselineSourceStatus, isEnglish),
    },
    {
      id: 'idea',
      index: '02',
      title: isEnglish ? 'Describe one idea' : '写下一个变量想法',
      state: !latestBaseline
        ? 'upcoming'
        : variableSandbox.canRunImpactScan || hasStartedScan
          ? 'done'
          : 'current',
      detail: !latestBaseline
        ? isEnglish
          ? 'This unlocks after a baseline exists.'
          : '等基线就绪后才会解锁。'
        : variableSandbox.canRunImpactScan || hasStartedScan
          ? isEnglish
            ? `Idea ready: ${variableSandbox.variableDraft.name || 'untitled variable'}`
            : `想法已就绪：${variableSandbox.variableDraft.name || '未命名变量'}`
          : isEnglish
            ? 'Fill the idea name, change, intent, and main concern.'
            : '先补齐变量名、改动、目标和主要担心点。',
    },
    {
      id: 'scan',
      index: '03',
      title: isEnglish ? 'Run the scan' : '启动推演',
      state: !latestBaseline
        ? 'upcoming'
        : variableSandbox.result
          ? 'done'
          : variableSandbox.status === 'loading' || variableSandbox.status === 'error' || variableSandbox.canRunImpactScan
            ? 'current'
            : 'upcoming',
      detail: variableSandbox.status === 'loading'
        ? currentScanStage ?? (isEnglish ? 'Scan is running now.' : '推演正在运行。')
        : variableSandbox.status === 'error'
          ? isEnglish
            ? 'The last scan failed. Adjust the idea and rerun.'
            : '上一轮推演失败了，调整想法后再跑一次。'
          : variableSandbox.result
            ? isEnglish
              ? 'The direct-impact scan already finished.'
              : '这一轮影响扫描已经完成。'
            : isEnglish
              ? 'Start with the quick scan. Use deep mode only when you need more detail.'
              : '默认先跑快速扫描，只有需要更细时再切到深度推演。',
    },
    {
      id: 'result',
      index: '04',
      title: isEnglish ? 'Read the result' : '查看结果',
      state: variableSandbox.result ? 'done' : hasStartedScan ? 'current' : 'upcoming',
      detail: variableSandbox.result
        ? variableSandbox.result.summary
        : isEnglish
          ? 'Direct effects, guardrails, and validation steps will appear here.'
          : '直接影响、关键护栏和验证动作会在这里出现。',
    },
  ] as const;

  return (
    <section className="page-grid">
      <article className="hero-panel report-hero">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Variable Sandbox' : '变量推演'}</p>
            <h3>{isEnglish ? 'Test one new variable on top of the formal result' : '基于正式结果继续测试一个新变量'}</h3>
            <p className="hero-copy">{report.summary}</p>
          </div>
          <button type="button" className="ghost-button" onClick={onBackToReport}>
            {isEnglish ? 'Back to Forecast Report' : '回到预测报告'}
          </button>
        </div>
      </article>

      <section className="panel staged-panel sandbox-next-step-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Sandbox Flow' : '推演流程'}</p>
            <h3>{isEnglish ? 'This is a first-class workflow, not a hidden extra' : '这是第 5 步的主流程，不是藏在报告后的附带动作'}</h3>
            <p className="panel-copy">
              {isEnglish
                ? 'Freeze the formal result into a baseline, describe one idea, run one scan, then read direct impact and guardrails.'
                : '先把正式结果冻结成基线，再写一个变量想法，跑一轮影响扫描，然后查看直接影响和关键护栏。'}
            </p>
          </div>
        </div>

        <div className="sandbox-flow-grid">
          {sandboxFlow.map((item) => (
            <article
              key={item.id}
              className={`sandbox-flow-card ${item.state === 'done' ? 'is-done' : item.state === 'current' ? 'is-current' : 'is-upcoming'}`}
            >
              <div className="card-topline">
                <span className="sandbox-flow-index">{item.index}</span>
                <span className="tiny-chip">{getSandboxFlowStateLabel(item.state, isEnglish)}</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel split-panel sandbox-baseline-panel">
        <div>
          <p className="eyebrow">{isEnglish ? 'Baseline Source' : '基线来源'}</p>
          <h4>
            {latestBaseline
              ? isEnglish
                ? `${baselines.length} baseline snapshot(s) are already available`
                : `当前已经有 ${baselines.length} 份基线快照`
              : getFreezeBaselineEmptyTitle(freezeBaselineSourceStatus, isEnglish)}
          </h4>
          <p>
            {latestBaseline
              ? getFreezeBaselineExistingDescription(
                  freezeBaselineSourceStatus,
                  latestBaseline,
                  language,
                  isEnglish,
                )
              : getFreezeBaselineEmptyDescription(
                  freezeBaselineSourceStatus,
                  isEnglish,
                )}
          </p>
        </div>

        <div className="sandbox-baseline-side">
          <ul className="bullet-list">
            {latestBaseline ? (
              <>
                <li>
                  {isEnglish
                    ? `Source verdict: ${latestBaseline.analysisSnapshot.systemVerdict}`
                    : `来源结论：${latestBaseline.analysisSnapshot.systemVerdict}`}
                </li>
                <li>
                  {isEnglish
                    ? `Primary risk: ${latestBaseline.analysisSnapshot.primaryRisk}`
                    : `核心风险：${latestBaseline.analysisSnapshot.primaryRisk}`}
                </li>
                <li>
                  {isEnglish
                    ? `Snapshot status: ${formatBaselineSourceStatus(latestBaseline.sourceAnalysisStatus, true)}`
                    : `快照状态：${formatBaselineSourceStatus(latestBaseline.sourceAnalysisStatus, false)}`}
                </li>
              </>
            ) : (
              <li>
                {getFreezeBaselineEmptyBullet(
                  freezeBaselineSourceStatus,
                  isEnglish,
                )}
              </li>
            )}
            {baselineError ? <li>{baselineError}</li> : null}
          </ul>

          <div className="chip-row">
            <button
              type="button"
              className="accent-button"
              disabled={!canFreezeBaseline || isFreezingBaseline}
              onClick={onFreezeBaseline}
            >
              {isFreezingBaseline
                ? isEnglish
                  ? 'Freezing Baseline'
                  : '正在冻结基线'
                : baselines.length > 0
                  ? isEnglish
                    ? 'Freeze New Snapshot'
                    : '再冻结一份最新快照'
                  : isEnglish
                    ? 'Freeze as Baseline'
                    : '冻结成基线'}
            </button>
          </div>
        </div>
      </section>

      {latestBaseline ? (
        <>
          <VariableEditorCard
            baseline={latestBaseline}
            variable={variableSandbox.variableDraft}
            resolvedVariable={variableSandbox.resolvedVariableDraft}
            primaryConcern={variableSandbox.primaryConcern}
            status={variableSandbox.status}
            error={variableSandbox.error}
            canRunImpactScan={variableSandbox.canRunImpactScan}
            onChange={variableSandbox.updateVariable}
            onCategoryChange={variableSandbox.updateCategory}
            onPrimaryConcernChange={variableSandbox.updatePrimaryConcern}
            onListChange={variableSandbox.updateListField}
            onReset={variableSandbox.resetVariableDraft}
            onRunQuickScan={() => void variableSandbox.runQuickImpactScan()}
            onRunDeepScan={() => void variableSandbox.runDeepImpactScan()}
          />

          <ImpactScanPanel
            baseline={latestBaseline}
            variable={variableSandbox.variableDraft}
            job={variableSandbox.job}
            result={variableSandbox.result}
            status={variableSandbox.status}
            error={variableSandbox.error}
            history={variableSandbox.history}
            historyStatus={variableSandbox.historyStatus}
            historyError={variableSandbox.historyError}
            onOpenHistoryScan={variableSandbox.openHistoryScan}
          />
        </>
      ) : null}
    </section>
  );
}
