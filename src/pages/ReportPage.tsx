import { RedTeamPanel } from '../components/analysis/RedTeamPanel';
import type { SandboxMemorySignal, SandboxRedTeamReport, SandboxReport } from '../../shared/sandbox';

type ReportPageProps = {
  report: SandboxReport;
  redTeam: SandboxRedTeamReport;
  memorySignals: SandboxMemorySignal[];
  pipeline: string[];
};

export function ReportPage({ report, redTeam, memorySignals, pipeline }: ReportPageProps) {
  return (
    <section className="page-grid">
      <article className="hero-panel report-hero">
        <p className="eyebrow">Final Brief</p>
        <h3>{report.headline}</h3>
        <p className="hero-copy">{report.summary}</p>
        <div className="chip-row">
          {pipeline.map((step) => (
            <span key={step} className="meta-chip">
              {step}
            </span>
          ))}
        </div>
      </article>

      <section className="panel report-grid">
        <div className="report-card">
          <p className="eyebrow">Conclusion</p>
          <h4>最终判断</h4>
          <p>{report.conclusion}</p>
        </div>
        <div className="report-card">
          <p className="eyebrow">Why Now</p>
          <h4>为什么现在做</h4>
          <p>{report.whyNow}</p>
        </div>
        <div className="report-card">
          <p className="eyebrow">Risk</p>
          <h4>当前主风险</h4>
          <p>{report.risk}</p>
        </div>
      </section>

      <RedTeamPanel redTeam={redTeam} memorySignals={memorySignals} />

      <section className="panel action-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Two-Week Actions</p>
            <h3>两周行动清单</h3>
          </div>
        </div>
        <ol className="action-list">
          {report.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ol>
      </section>
    </section>
  );
}
