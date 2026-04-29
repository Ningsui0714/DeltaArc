import { useState } from 'react';
import type { SandboxAnalysisMeta, SandboxAnalysisMode } from '../../shared/sandbox';
import { AnalysisQualityPanel } from '../components/analysis/AnalysisQualityPanel';
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
  summary: string;
  systemVerdict: string;
  primaryRisk: string;
  nextStep: string;
  report: SandboxReport;
  redTeam: SandboxRedTeamReport;
  memorySignals: SandboxMemorySignal[];
  futureTimeline: SandboxFutureTimelineItem[];
  trajectorySignals: SandboxTrajectorySignal[];
  pipeline: string[];
  analysisMeta: SandboxAnalysisMeta;
  analysisMode: SandboxAnalysisMode;
  onOpenSandbox: () => void;
};

function getTabs(isEnglish: boolean) {
  return [
    { id: 'conclusion', label: isEnglish ? 'Conclusion' : '结论', hint: isEnglish ? 'Start with the final call' : '先看最终判断' },
    { id: 'outlook', label: isEnglish ? 'Outlook' : '三拍', hint: isEnglish ? 'Then scan the next beats' : '再看未来三拍' },
    { id: 'signals', label: isEnglish ? 'Signals' : '信号', hint: isEnglish ? 'Review inflection signs' : '看走势转折' },
    { id: 'redteam', label: isEnglish ? 'Red Team' : '反方', hint: isEnglish ? 'Check the worst case' : '看最坏情况' },
    { id: 'actions', label: isEnglish ? 'Actions' : '行动', hint: isEnglish ? 'Finish with next moves' : '最后看下一步' },
    { id: 'verifier', label: isEnglish ? 'Verifier' : '校验', hint: isEnglish ? 'See why this answer survived' : '看它为什么能过关' },
  ] as const;
}

export function ReportPage({
  summary,
  systemVerdict,
  primaryRisk,
  nextStep,
  report,
  redTeam,
  memorySignals,
  futureTimeline,
  trajectorySignals,
  pipeline,
  analysisMeta,
  analysisMode,
  onOpenSandbox,
}: ReportPageProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const { directionLabels } = getSandboxLabels(language);
  const tabs = getTabs(isEnglish);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('conclusion');

  return (
    <section className="page-grid">
      <article className="hero-panel report-hero">
        <p className="eyebrow">{isEnglish ? 'Strategy Report' : '策略报告'}</p>
        <h3>{systemVerdict}</h3>
        <p className="hero-copy">{summary}</p>
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
            <p className="eyebrow">{isEnglish ? 'Formal Report' : '正式报告'}</p>
            <h3>{isEnglish ? 'Read the strategy result first' : '先把策略结果看完'}</h3>
          </div>
        </div>

        <PhaseTabs tabs={[...tabs]} activeTab={activeTab} onChange={(next) => setActiveTab(next as typeof activeTab)} />

        {activeTab === 'conclusion' ? (
          <section className="stage-panel-body">
            <div className="report-grid">
              <div className="report-card">
                <p className="eyebrow">{isEnglish ? 'Conclusion' : '结论'}</p>
                <h4>{isEnglish ? 'Current strategy call' : '当前策略判断'}</h4>
                <p>{summary}</p>
                <strong>{systemVerdict}</strong>
              </div>
              <div className="report-card">
                <p className="eyebrow">{isEnglish ? 'Next Step' : '下一步'}</p>
                <h4>{isEnglish ? 'What to validate now' : '现在先验证什么'}</h4>
                <p>{nextStep}</p>
              </div>
              <div className="report-card">
                <p className="eyebrow">{isEnglish ? 'Risk' : '风险'}</p>
                <h4>{isEnglish ? 'Primary risk' : '当前主风险'}</h4>
                <p>{primaryRisk}</p>
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

        {activeTab === 'verifier' ? (
          <section className="stage-panel-body">
            <AnalysisQualityPanel
              meta={analysisMeta}
              mode={analysisMode}
              showEmpty
            />
          </section>
        ) : null}
      </section>

      <section className="panel split-panel sandbox-entry-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Step 5' : '第 5 步'}</p>
            <h3>{isEnglish ? 'Open the Variable Lab next' : '下一步进入变量实验'}</h3>
            <p className="panel-copy">
              {isEnglish
                ? 'Variable Lab is a first-class Step 5 workflow, not a hidden appendix. Freeze the strategy result into a baseline, inject a new content variable, and inspect direct effects, risks, guardrails, and validation steps.'
                : '变量实验是独立的第 5 步核心流程，不是藏在报告后的附录。你可以把策略结果冻结成基线，再注入一个新的内容变量，继续查看直接影响、风险、护栏和验证动作。'}
            </p>
          </div>
        </div>
        <div className="sandbox-entry-side">
          <div className="chip-row">
            <button type="button" className="accent-button" onClick={onOpenSandbox}>
              {isEnglish ? 'Open Variable Lab' : '进入变量实验'}
            </button>
          </div>
          <ul className="bullet-list">
            <li>{isEnglish ? 'Start from the latest strategy result and freeze one baseline' : '从最新策略结果出发并冻结一份基线'}</li>
            <li>{isEnglish ? 'Describe one new content variable with the lightweight idea-first form' : '用轻量表单写一个新的内容变量想法'}</li>
            <li>{isEnglish ? 'Run one quick or deep impact scan' : '先跑一轮快速扫描，需要更细时再做深度推演'}</li>
          </ul>
        </div>
      </section>
    </section>
  );
}
