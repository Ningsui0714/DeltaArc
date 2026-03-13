import type { SandboxAnalysisJob, SandboxAnalysisMeta, SandboxAnalysisResult } from '../../../shared/sandbox';
import { formatJobDuration, getJobProgressStats } from '../../lib/jobProgress';
import { analysisSourceLabels, analysisStatusLabels, evidenceLevelLabels } from '../../lib/sandboxLabels';
import type { StepId } from '../../types';

type RightRailProps = {
  activeStep: StepId;
  evidenceLevel: SandboxAnalysisResult['evidenceLevel'];
  lastAnalysisAt: string;
  meta: SandboxAnalysisMeta;
  playerAcceptance: number;
  primaryRisk: string;
  nextStep: string;
  model: string;
  pipeline: string[];
  progress: SandboxAnalysisJob | null;
  error: string | null;
  warnings: string[];
};

export function RightRail({
  activeStep,
  evidenceLevel,
  lastAnalysisAt,
  meta,
  playerAcceptance,
  primaryRisk,
  nextStep,
  model,
  pipeline,
  progress,
  error,
  warnings,
}: RightRailProps) {
  const progressStats = progress ? getJobProgressStats(progress) : null;

  return (
    <aside className="right-rail">
      <section className="intel-card">
        <p className="eyebrow">Run Status</p>
        <h3>{activeStep === 'report' ? 'Final Snapshot' : 'Current Snapshot'}</h3>
        <div className="chip-row">
          <span className="meta-chip">{analysisSourceLabels[meta.source]}</span>
          <span className="meta-chip">{analysisStatusLabels[meta.status]}</span>
          {progress ? <span className="meta-chip">{progress.status}</span> : null}
          {progressStats ? <span className="meta-chip">{progressStats.percent}%</span> : null}
        </div>
        <dl className="intel-list">
          <div>
            <dt>Evidence</dt>
            <dd>{evidenceLevelLabels[evidenceLevel]}</dd>
          </div>
          <div>
            <dt>Acceptance</dt>
            <dd>{playerAcceptance}%</dd>
          </div>
          <div>
            <dt>Primary Risk</dt>
            <dd>{primaryRisk}</dd>
          </div>
          <div>
            <dt>Next Step</dt>
            <dd>{nextStep}</dd>
          </div>
          <div>
            <dt>Last Fresh Run</dt>
            <dd>{lastAnalysisAt || 'No fresh remote run yet.'}</dd>
          </div>
          <div>
            <dt>Model Summary</dt>
            <dd>{model}</dd>
          </div>
        </dl>
      </section>

      <section className="intel-card compact">
        <p className="eyebrow">Execution Trace</p>
        <h3>{progress ? progress.currentStageLabel : 'Latest Pipeline'}</h3>
        {progress ? <p className="progress-copy">{progress.message}</p> : null}
        {progress && progressStats ? (
          <div className="run-overview">
            <div className="run-overview-header">
              <strong className="run-overview-percent">{progressStats.percent}%</strong>
              <span>{formatJobDuration(progressStats.elapsedMs)} elapsed</span>
            </div>
            <div className="run-progress-track" aria-hidden="true">
              <div className="run-progress-fill" style={{ width: `${progressStats.percent}%` }} />
            </div>
            <div className="run-overview-grid">
              <div className="run-overview-metric">
                <span>Completed</span>
                <strong>
                  {progressStats.completedStageCount}/{progressStats.actionableStageCount}
                </strong>
              </div>
              <div className="run-overview-metric">
                <span>Parallel Lanes</span>
                <strong>{progressStats.runningStageCount}</strong>
              </div>
              <div className="run-overview-metric">
                <span>Fallbacks</span>
                <strong>{progressStats.fallbackStageCount}</strong>
              </div>
            </div>
            {progressStats.runningStages.length > 0 ? (
              <div className="stage-pill-row">
                {progressStats.runningStages.map((stage) => (
                  <span key={stage.key} className="stage-pill stage-pill-running">
                    {stage.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        {progress ? (
          <div className="stage-list">
            {progress.stages.map((stage) => (
              <article key={stage.key} className={`stage-item stage-${stage.status}`}>
                <div className="stage-heading">
                  <strong>{stage.label}</strong>
                  <span>{stage.status}</span>
                </div>
                <p>{stage.detail}</p>
                {stage.model || stage.durationMs ? (
                  <small>
                    {[stage.model, stage.durationMs ? formatJobDuration(stage.durationMs) : ''].filter(Boolean).join(' · ')}
                  </small>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="chip-row">
            {pipeline.map((step) => (
              <span key={step} className="meta-chip">
                {step}
              </span>
            ))}
          </div>
        )}
        {error ? <p className="status-error">{error}</p> : null}
        {warnings.length > 0 ? (
          <ul className="bullet-list">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </section>
    </aside>
  );
}
