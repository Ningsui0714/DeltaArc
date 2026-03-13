import type { SandboxAnalysisJob, SandboxAnalysisMode } from '../../../shared/sandbox';
import { stepLabels } from '../../data/mockData';
import { formatJobDuration, getJobProgressStats } from '../../lib/jobProgress';
import type { StepId } from '../../types';

type WorkspaceHeaderProps = {
  activeStep: StepId;
  isLoading: boolean;
  progress: SandboxAnalysisJob | null;
  onRunAnalysis: (mode: SandboxAnalysisMode, step: StepId) => void;
};

export function WorkspaceHeader({ activeStep, isLoading, progress, onRunAnalysis }: WorkspaceHeaderProps) {
  const currentStep = stepLabels.find((step) => step.id === activeStep);
  const progressStats = progress ? getJobProgressStats(progress) : null;
  const progressMessage = progress
    ? progressStats && progressStats.runningStageCount > 1
      ? `${progress.message} ${progressStats.runningStageCount} parallel lanes are active.`
      : progress.message
    : 'Quick scan runs a trimmed path. Deep dive runs the full chain.';
  const progressDetail = progressStats
    ? `${progressStats.completedStageCount}/${progressStats.actionableStageCount} stages completed · ${formatJobDuration(progressStats.elapsedMs)} elapsed`
    : 'Choose quick scan for a lighter pass or deep dive for the full multi-stage chain.';
  const runningStages = progressStats?.runningStages ?? [];

  return (
    <header className="workspace-header">
      <div className="workspace-title-block">
        <p className="eyebrow">Current Objective</p>
        <h2>{currentStep?.label}</h2>
        <p className="workspace-subtitle">{progressMessage}</p>
        <p className="workspace-progress-detail">{progressDetail}</p>
        {progressStats ? (
          <div className="run-progress">
            <div className="run-progress-track" aria-hidden="true">
              <div className="run-progress-fill" style={{ width: `${progressStats.percent}%` }} />
            </div>
            <div className="run-progress-meta">
              <strong>{progressStats.percent}% complete</strong>
              <span>
                {progressStats.runningStageCount > 0
                  ? `${progressStats.runningStageCount} active`
                  : `${progressStats.pendingStageCount} pending`}
              </span>
            </div>
          </div>
        ) : null}
        {runningStages.length > 0 ? (
          <div className="stage-pill-row">
            {runningStages.map((stage) => (
              <span key={stage.key} className="stage-pill stage-pill-running">
                {stage.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="header-actions">
        <button
          type="button"
          className="ghost-button"
          disabled={isLoading}
          onClick={() => onRunAnalysis('balanced', 'modeling')}
        >
          {isLoading && progress?.mode === 'balanced' ? 'Quick Scan Running' : 'Quick Scan'}
        </button>
        <button
          type="button"
          className="accent-button"
          disabled={isLoading}
          onClick={() => onRunAnalysis('reasoning', 'report')}
        >
          {isLoading && progress?.mode === 'reasoning' ? 'Deep Dive Running' : 'Deep Dive'}
        </button>
      </div>
    </header>
  );
}
