import type { FrozenBaseline } from '../../shared/variableSandbox';
import type { SandboxReport } from '../../shared/sandbox';
import { ImpactScanPanel } from '../components/variableSandbox/ImpactScanPanel';
import { VariableEditorCard } from '../components/variableSandbox/VariableEditorCard';
import { useVariableImpactScan } from '../hooks/useVariableImpactScan';
import { useUiLanguage } from '../hooks/useUiLanguage';
import { createVariableSandboxPageViewModel } from './variableSandboxPageViewModel';

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
  const isFreezingBaseline = baselineStatus === 'saving';
  const variableSandbox = useVariableImpactScan({
    workspaceId,
    baseline: baselines[0] ?? null,
  });
  const viewModel = createVariableSandboxPageViewModel({
    language,
    reportSummary: report.summary,
    baselines,
    baselineStatus,
    baselineError,
    canFreezeBaseline,
    freezeBaselineSourceStatus,
    variableName: variableSandbox.variableDraft.name,
    canRunImpactScan: variableSandbox.canRunImpactScan,
    scanJob: variableSandbox.job,
    scanResult: variableSandbox.result,
    scanStatus: variableSandbox.status,
  });
  const latestBaseline = viewModel.latestBaseline;

  return (
    <section className="page-grid">
      <article className="hero-panel report-hero">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{viewModel.hero.eyebrow}</p>
            <h3>{viewModel.hero.title}</h3>
            <p className="hero-copy">{viewModel.hero.summary}</p>
          </div>
          <button type="button" className="ghost-button" onClick={onBackToReport}>
            {viewModel.hero.backButtonLabel}
          </button>
        </div>
      </article>

      <section className="panel staged-panel sandbox-next-step-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{viewModel.flow.eyebrow}</p>
            <h3>{viewModel.flow.title}</h3>
            <p className="panel-copy">{viewModel.flow.copy}</p>
          </div>
        </div>

        <div className="sandbox-flow-grid">
          {viewModel.flow.items.map((item) => (
            <article
              key={item.id}
              className={`sandbox-flow-card ${item.state === 'done' ? 'is-done' : item.state === 'current' ? 'is-current' : 'is-upcoming'}`}
            >
              <div className="card-topline">
                <span className="sandbox-flow-index">{item.index}</span>
                <span className="tiny-chip">{item.stateLabel}</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel split-panel sandbox-baseline-panel">
        <div>
          <p className="eyebrow">{viewModel.baseline.eyebrow}</p>
          <h4>{viewModel.baseline.title}</h4>
          <p>{viewModel.baseline.description}</p>
        </div>

        <div className="sandbox-baseline-side">
          <ul className="bullet-list">
            {viewModel.baseline.bullets.map((bullet, index) => (
              <li key={`${index}-${bullet}`}>{bullet}</li>
            ))}
          </ul>

          <div className="chip-row">
            <button
              type="button"
              className="accent-button"
              disabled={!canFreezeBaseline || isFreezingBaseline}
              onClick={onFreezeBaseline}
            >
              {viewModel.baseline.freezeButtonLabel}
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
