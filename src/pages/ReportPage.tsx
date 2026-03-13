import { useState } from 'react';
import { RedTeamPanel } from '../components/analysis/RedTeamPanel';
import { PhaseTabs } from '../components/ui/PhaseTabs';
import { isEnglishUi, useUiLanguage } from '../hooks/useUiLanguage';
import type {
  SandboxFutureTimelineItem,
  SandboxMemorySignal,
  SandboxRedTeamReport,
  SandboxReport,
  SandboxTrajectorySignal,
} from '../../shared/sandbox';
import { getSandboxLabels } from '../lib/sandboxLabels';

type ReportPageProps = {
  report: SandboxReport;
  redTeam: SandboxRedTeamReport;
  memorySignals: SandboxMemorySignal[];
  futureTimeline: SandboxFutureTimelineItem[];
  trajectorySignals: SandboxTrajectorySignal[];
  pipeline: string[];
};

function getTabs(isEnglish: boolean) {
  return [
    { id: 'conclusion', label: isEnglish ? 'Conclusion' : '结论', hint: isEnglish ? 'Start with the final call' : '先看最终判断' },
    { id: 'outlook', label: isEnglish ? 'Outlook' : '三拍', hint: isEnglish ? 'Then scan the next beats' : '再看未来三拍' },
    { id: 'signals', label: isEnglish ? 'Signals' : '信号', hint: isEnglish ? 'Review inflection signs' : '看走势转折' },
    { id: 'redteam', label: isEnglish ? 'Red Team' : '反方', hint: isEnglish ? 'Check the worst case' : '看最坏情况' },
    { id: 'actions', label: isEnglish ? 'Actions' : '行动', hint: isEnglish ? 'Finish with next moves' : '最后看下一步' },
  ] as const;
}

export function ReportPage({
  report,
  redTeam,
  memorySignals,
  futureTimeline,
  trajectorySignals,
  pipeline,
}: ReportPageProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const { directionLabels } = getSandboxLabels(language);
  const tabs = getTabs(isEnglish);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('conclusion');

  return (
    <section className="page-grid">
      <article className="hero-panel report-hero">
        <p className="eyebrow">{isEnglish ? 'Final Forecast' : '最终预测'}</p>
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

      <section className="panel staged-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Report Stages' : '报告阶段'}</p>
            <h3>{isEnglish ? 'Review the formal report stage by stage' : '逐阶段查看正式报告'}</h3>
          </div>
        </div>

        <PhaseTabs tabs={[...tabs]} activeTab={activeTab} onChange={(next) => setActiveTab(next as typeof activeTab)} />

        {activeTab === 'conclusion' ? (
          <section className="stage-panel-body">
            <div className="report-grid">
              <div className="report-card">
                <p className="eyebrow">{isEnglish ? 'Conclusion' : '结论'}</p>
                <h4>{isEnglish ? 'Forecast conclusion' : '走势结论'}</h4>
                <p>{report.conclusion}</p>
              </div>
              <div className="report-card">
                <p className="eyebrow">{isEnglish ? 'Why Now' : '当下判断'}</p>
                <h4>{isEnglish ? 'Why it matters now' : '为什么现在看'}</h4>
                <p>{report.whyNow}</p>
              </div>
              <div className="report-card">
                <p className="eyebrow">{isEnglish ? 'Risk' : '风险'}</p>
                <h4>{isEnglish ? 'Primary risk' : '当前主风险'}</h4>
                <p>{report.risk}</p>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'outlook' ? (
          <section className="stage-panel-body">
            <div className="report-timeline-grid">
              {futureTimeline.slice(0, 3).map((beat) => (
                <article key={`${beat.phase}-${beat.timing}`} className="report-card">
                  <div className="card-topline">
                    <span className="tiny-chip">{beat.phase}</span>
                    <span className="meta-chip">{beat.timing}</span>
                  </div>
                  <h4>{beat.expectedReaction}</h4>
                  <p>{beat.likelyShift}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'signals' ? (
          <section className="stage-panel-body">
            <div className="stack-list">
              {trajectorySignals.map((signal) => (
                <article key={`${signal.signal}-${signal.timing}`} className="stack-card">
                  <div className="card-topline">
                    <span className="tiny-chip">{signal.timing}</span>
                    <span className="meta-chip">{directionLabels[signal.direction]}</span>
                  </div>
                  <h4>{signal.signal}</h4>
                  <p>{signal.impact}</p>
                  <small>{signal.recommendedMove}</small>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'redteam' ? (
          <section className="stage-panel-body">
            <RedTeamPanel redTeam={redTeam} memorySignals={memorySignals} />
          </section>
        ) : null}

        {activeTab === 'actions' ? (
          <section className="stage-panel-body">
            <section className="panel action-panel inner-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{isEnglish ? 'Two-Week Actions' : '两周动作'}</p>
                  <h3>{isEnglish ? 'Two-week action list' : '两周行动清单'}</h3>
                </div>
              </div>
              <ol className="action-list">
                {report.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ol>
            </section>
          </section>
        ) : null}
      </section>
    </section>
  );
}
