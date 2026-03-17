import { FileImportCard, type ImportFeedback } from '../components/import/FileImportCard';
import { ProjectEditorCard } from '../components/project/ProjectEditorCard';
import { MetricCard } from '../components/ui/MetricCard';
import { TimelineItem } from '../components/ui/TimelineItem';
import { useUiLanguage } from '../hooks/useUiLanguage';
import type { ProjectSnapshot, StepId } from '../types';
import { createOverviewPageViewModel } from './overviewPageViewModel';

type OverviewPageProps = {
  project: ProjectSnapshot;
  evidenceCount: number;
  hasViewableAnalysis: boolean;
  isAnalysisFresh: boolean;
  isAnalysisStale: boolean;
  isAnalysisDegraded: boolean;
  onProjectChange: (patch: Partial<ProjectSnapshot>) => void;
  onResetProject: () => void;
  onClearEvidence: () => void;
  projectImportFeedback: ImportFeedback | null;
  onImportProjectFile: (file: File) => Promise<void>;
  onNavigate: (step: StepId) => void;
};

export function OverviewPage({
  project,
  evidenceCount,
  hasViewableAnalysis,
  isAnalysisFresh,
  isAnalysisStale,
  isAnalysisDegraded,
  onProjectChange,
  onResetProject,
  onClearEvidence,
  projectImportFeedback,
  onImportProjectFile,
  onNavigate,
}: OverviewPageProps) {
  const { language } = useUiLanguage();
  const viewModel = createOverviewPageViewModel({
    language,
    project,
    evidenceCount,
    hasViewableAnalysis,
    isAnalysisFresh,
    isAnalysisStale,
    isAnalysisDegraded,
  });

  return (
    <section className="page-grid">
      <article className="hero-panel">
        <p className="eyebrow">{viewModel.hero.eyebrow}</p>
        <h3>{viewModel.hero.title}</h3>
        <p className="hero-copy">{viewModel.hero.copy}</p>
        <div className="signal-band">
          {viewModel.hero.signalItems.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </article>

      <section className="panel launchpad-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{viewModel.launchpad.eyebrow}</p>
            <h3>{viewModel.launchpad.title}</h3>
          </div>
          <span className="panel-badge">{viewModel.launchpad.badge}</span>
        </div>
        <div className="launchpad-grid">
          {viewModel.launchpad.steps.map((step) => {
            const actionStep = step.actionStep;

            return (
              <article key={step.id} className={`guide-card is-${step.status}`}>
                <div className="guide-card-topline">
                  <span className="guide-index">{step.number}</span>
                  <span className={`guide-status status-${step.status}`}>{step.statusLabel}</span>
                </div>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
                <strong className="guide-metric">{step.metric}</strong>
                {step.actionLabel && actionStep ? (
                  <button
                    type="button"
                    className={step.status === 'current' ? 'accent-button' : 'inline-button'}
                    onClick={() => onNavigate(actionStep)}
                  >
                    {step.actionLabel}
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <FileImportCard
        title={viewModel.importCard.title}
        description={viewModel.importCard.description}
        accept=".json,.md,.markdown,.txt"
        hint={viewModel.importCard.hint}
        buttonLabel={viewModel.importCard.buttonLabel}
        feedback={projectImportFeedback}
        onImport={onImportProjectFile}
      />

      <ProjectEditorCard
        project={project}
        onProjectChange={onProjectChange}
        onResetProject={onResetProject}
        onClearEvidence={onClearEvidence}
      />

      <section className="panel split-panel">
        <div>
          <p className="eyebrow">{viewModel.runStatus.eyebrow}</p>
          <h4>{viewModel.runStatus.title}</h4>
          <p>{viewModel.runStatus.copy}</p>
        </div>
        <ul className="bullet-list">
          {viewModel.runStatus.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="metrics-row">
        {viewModel.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            tone={metric.tone}
          />
        ))}
      </section>

      <section className="panel timeline-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{viewModel.timeline.eyebrow}</p>
            <h4>{viewModel.timeline.title}</h4>
          </div>
          <button
            type="button"
            className="inline-button"
            onClick={() => onNavigate(viewModel.timeline.buttonStep)}
          >
            {viewModel.timeline.buttonLabel}
          </button>
        </div>
        <div className="timeline-list">
          {viewModel.timeline.steps.map((step) => (
            <TimelineItem
              key={step.time}
              time={step.time}
              title={step.title}
              detail={step.detail}
            />
          ))}
        </div>
      </section>
    </section>
  );
}
