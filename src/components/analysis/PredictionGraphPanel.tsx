import type { SandboxAnalysisJob, SandboxAnalysisResult } from '../../../shared/sandbox';
import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';
import type { EvidenceItem, ProjectSnapshot, StepId } from '../../types';
import {
  buildPredictionGraphViewModel,
  type GraphCardStatus,
  getColumnClass,
  getStatusLabel,
} from './predictionGraphViewModel';

type PredictionGraphPanelProps = {
  activeStep: StepId;
  project: ProjectSnapshot;
  evidenceItems: EvidenceItem[];
  analysis: SandboxAnalysisResult;
  progress: SandboxAnalysisJob | null;
  hasViewableAnalysis: boolean;
  isAnalysisFresh: boolean;
  isAnalysisStale: boolean;
  isAnalysisDegraded: boolean;
};

function resolveAggregateStatus(statuses: GraphCardStatus[]): GraphCardStatus {
  if (statuses.some((status) => status === 'error')) {
    return 'error';
  }

  if (statuses.some((status) => status === 'running')) {
    return 'running';
  }

  if (statuses.every((status) => status === 'completed')) {
    return 'completed';
  }

  return 'pending';
}

export function PredictionGraphPanel({
  activeStep,
  project,
  evidenceItems,
  analysis,
  progress,
  hasViewableAnalysis,
  isAnalysisFresh,
  isAnalysisStale,
  isAnalysisDegraded,
}: PredictionGraphPanelProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const view = buildPredictionGraphViewModel({
    activeStep,
    project,
    evidenceItems,
    analysis,
    progress,
    hasViewableAnalysis,
    isAnalysisFresh,
    isAnalysisStale,
    isAnalysisDegraded,
    language,
  });
  const stageCards = [
    {
      zone: 'inputs',
      index: '01',
      title: isEnglish ? 'Input Load' : '输入装载',
      summary: `${view.projectCard.title} / ${view.evidenceCard.title}`,
      detail: `${view.inputsStat} · ${view.projectModeLabel}`,
      status: resolveAggregateStatus([view.projectCard.status, view.evidenceCard.status]),
    },
    {
      zone: 'brief',
      index: '02',
      title: isEnglish ? 'Shared Brief' : '共享简报',
      summary: view.dossierCard.title,
      detail: view.liveRun.isActive ? view.liveRun.label : isEnglish ? 'Waiting for formal run' : '等待正式推理',
      status: view.dossierCard.status,
    },
    {
      zone: 'agents',
      index: '03',
      title: isEnglish ? 'Agent Run' : '多代理推演',
      summary: isEnglish ? `${view.agentCards.length} specialists working in parallel` : `${view.agentCards.length} 个专项代理并行工作`,
      detail: view.agentsStat,
      status: resolveAggregateStatus(view.agentCards.map((card) => card.status)),
    },
    {
      zone: 'forecast',
      index: '04',
      title: isEnglish ? 'Output Closure' : '结果收束',
      summary: view.reportCard.title,
      detail: hasViewableAnalysis ? (isEnglish ? 'Formal output connected' : '正式结果已接入') : view.timelineStat,
      status: resolveAggregateStatus([view.synthesisCard.status, view.refineCard.status, view.reportCard.status]),
    },
  ] as const;

  return (
    <section className="graph-panel compact-graph">
      <div className="graph-panel-heading">
        <div>
          <p className="eyebrow">{isEnglish ? 'Prediction Graph' : '预测图谱'}</p>
          <h2>{isEnglish ? 'Left Inference Console' : '左侧推理控制台'}</h2>
          <p className="graph-panel-copy">
            {isEnglish
              ? 'This is no longer a loose diagram. It compresses input loading, the shared brief, agent collaboration, and output closure into one dense work console.'
              : '这里不再做松散示意图，而是把输入装载、共享简报、多代理协作和结果收束压成一个高密度工作台。'}
          </p>
        </div>
        <div className="chip-row">
          <span className="meta-chip">{view.progressChip}</span>
          <span className={`trust-chip ${view.trustTone}`}>{view.trustLabel}</span>
        </div>
      </div>

      <div className="graph-inspector compact">
        <div className="graph-inspector-copy">
          <p className="eyebrow">{isEnglish ? 'Live Status' : '实时状态'}</p>
          <h3>{view.graphHeadline}</h3>
          <p>{view.graphSummary}</p>
        </div>
        <dl className="graph-stats compact">
          <div>
            <dt>{isEnglish ? 'Inputs' : '输入'}</dt>
            <dd>{view.inputsStat}</dd>
          </div>
          <div>
            <dt>{isEnglish ? 'Agents' : '代理'}</dt>
            <dd>{view.agentsStat}</dd>
          </div>
          <div>
            <dt>{isEnglish ? 'Timeline' : '时间线'}</dt>
            <dd>{view.timelineStat}</dd>
          </div>
        </dl>
      </div>

      <div className="graph-stage-strip">
        {stageCards.map((stage) => (
          <article
            key={stage.zone}
            className={`graph-stage-card ${stage.zone === view.focusZone ? 'is-focused' : ''} ${stage.zone === view.liveZone ? 'is-live' : ''}`}
          >
            <div className="graph-stage-card-topline">
              <span className="graph-stage-index">{stage.index}</span>
              <span className="tiny-chip">{getStatusLabel(stage.status, language)}</span>
            </div>
            <strong>{stage.title}</strong>
            <p>{stage.summary}</p>
            <small>{stage.detail}</small>
          </article>
        ))}
      </div>

      <div className="graph-scroll-window">
        <div className="graph-console-grid">
          <section className={`${getColumnClass('inputs', view.focusZone, view.liveZone)} graph-console-zone graph-zone-inputs`}>
            <div className="graph-flow-heading">
              <div>
                <p className="eyebrow">{isEnglish ? '01 Inputs' : '01 输入层'}</p>
                <h3>{isEnglish ? 'Project and Evidence Load' : '项目与证据装载'}</h3>
              </div>
              <span className="tiny-chip">{view.projectModeLabel}</span>
            </div>

            <div className="graph-zone-stack">
              <article className={`graph-module status-${view.projectCard.status}`}>
                <div className="graph-module-topline">
                  <span className="graph-module-label">{isEnglish ? 'Project Brief' : '项目简述'}</span>
                  <span className="tiny-chip">{getStatusLabel(view.projectCard.status, language)}</span>
                </div>
                <h4>{view.projectCard.title}</h4>
                <p>{view.projectCard.summary}</p>
                <div className="graph-module-metrics">
                  {view.projectCard.metrics.map((metric) => (
                    <span key={metric} className="meta-chip">
                      {metric}
                    </span>
                  ))}
                </div>
              </article>

              <article className={`graph-module status-${view.evidenceCard.status}`}>
                <div className="graph-module-topline">
                  <span className="graph-module-label">{isEnglish ? 'Evidence Pack' : '证据包'}</span>
                  <span className="tiny-chip">{getStatusLabel(view.evidenceCard.status, language)}</span>
                </div>
                <h4>{view.evidenceCard.title}</h4>
                <p>{view.evidenceCard.summary}</p>
                <div className="graph-module-metrics">
                  {view.evidenceCard.metrics.map((metric) => (
                    <span key={metric} className="meta-chip">
                      {metric}
                    </span>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section className={`${getColumnClass('brief', view.focusZone, view.liveZone)} graph-console-zone graph-zone-brief`}>
            <div className="graph-flow-heading">
              <div>
                <p className="eyebrow">{isEnglish ? '02 Shared Brief' : '02 共享简报'}</p>
                <h3>{isEnglish ? 'Dossier Hub' : '共享简报中枢'}</h3>
              </div>
              <span className="tiny-chip">{getStatusLabel(view.dossierCard.status, language)}</span>
            </div>

            <article className={`graph-module graph-module-bridge status-${view.dossierCard.status}`}>
              <div className="graph-module-topline">
                <span className="graph-module-label">{isEnglish ? 'Coordination Hub' : '协调中枢'}</span>
                <span className="graph-module-role">{view.dossierRole}</span>
              </div>
              <h4>{view.dossierCard.title}</h4>
              <p>{view.dossierCard.summary}</p>
            </article>

            {view.liveRun.isActive ? (
              <div className="graph-mini-progress">
                <div className="run-progress-track" aria-hidden="true">
                  <div className="run-progress-fill" style={{ width: `${view.liveRun.percent}%` }} />
                </div>
                <div className="graph-mini-progress-copy">
                  <strong>{view.liveRun.label}</strong>
                  <span>{view.liveRun.message}</span>
                </div>
              </div>
            ) : (
              <div className="graph-mini-progress is-idle">
                <strong>{isEnglish ? 'Formal Run Gate' : '正式推理闸门'}</strong>
                <span>{isEnglish ? 'Future evolution content will not appear here before the backend run starts.' : '没有启动后端前，这里不会自己长出未来演化内容。'}</span>
              </div>
            )}
          </section>

          <section className={`${getColumnClass('agents', view.focusZone, view.liveZone)} graph-console-zone graph-zone-agents`}>
            <div className="graph-flow-heading">
              <div>
                <p className="eyebrow">{isEnglish ? '03 Agents' : '03 多代理层'}</p>
                <h3>{isEnglish ? 'Collaborative Run' : '协作推演'}</h3>
              </div>
              <div className="graph-module-metrics">
                <span className="tiny-chip">{isEnglish ? `${view.agentCards.length} agents` : `${view.agentCards.length} 个代理`}</span>
                <span className="meta-chip">{view.agentsStat}</span>
              </div>
            </div>

            <div className="graph-module-grid graph-agent-grid graph-agent-grid-dense">
              {view.agentCards.map((card) => (
                <article key={card.key} className={`graph-module graph-agent-card status-${card.status}`}>
                  <div className="graph-module-topline">
                    <span className="graph-module-label">{card.role}</span>
                    <span className="tiny-chip">{getStatusLabel(card.status, language)}</span>
                  </div>
                  <h4>{card.title}</h4>
                  <p>{card.summary}</p>
                  {card.metrics.length > 0 ? (
                    <div className="graph-module-metrics">
                      {card.metrics.map((metric) => (
                        <span key={metric} className="meta-chip">
                          {metric}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className={`${getColumnClass('forecast', view.focusZone, view.liveZone)} graph-console-zone graph-zone-forecast`}>
            <div className="graph-flow-heading">
              <div>
                <p className="eyebrow">{isEnglish ? '04 Outputs' : '04 输出层'}</p>
                <h3>{isEnglish ? 'Forecast Output Closure' : '预测结果收束'}</h3>
              </div>
              <span className="tiny-chip">{hasViewableAnalysis ? (isEnglish ? 'Connected' : '已接入') : isEnglish ? 'Incomplete' : '未完成'}</span>
            </div>

            <div className="graph-module-grid graph-output-grid">
              <article className={`graph-module status-${view.synthesisCard.status}`}>
                <div className="graph-module-topline">
                  <span className="graph-module-label">{isEnglish ? 'Synthesis' : '综合推演'}</span>
                  <span className="tiny-chip">{getStatusLabel(view.synthesisCard.status, language)}</span>
                </div>
                <h4>{view.synthesisCard.title}</h4>
                <p>{view.synthesisCard.summary}</p>
              </article>

              <article className={`graph-module status-${view.refineCard.status}`}>
                <div className="graph-module-topline">
                  <span className="graph-module-label">{isEnglish ? 'Refine' : '结果收束'}</span>
                  <span className="tiny-chip">{getStatusLabel(view.refineCard.status, language)}</span>
                </div>
                <h4>{view.refineCard.title}</h4>
                <p>{view.refineCard.summary}</p>
              </article>

              <article className={`graph-module status-${view.reportCard.status}`}>
                <div className="graph-module-topline">
                  <span className="graph-module-label">{isEnglish ? 'Forecast Report' : '预测报告'}</span>
                  <span className="tiny-chip">{getStatusLabel(view.reportCard.status, language)}</span>
                </div>
                <h4>{view.reportCard.title}</h4>
                <p>{view.reportCard.summary}</p>
                <div className="graph-module-metrics">
                  {view.reportCard.metrics.map((metric) => (
                    <span key={metric} className="meta-chip">
                      {metric}
                    </span>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
