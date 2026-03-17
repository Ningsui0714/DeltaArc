import type {
  WorkspaceJourneyStep,
  WorkspaceJourneyStepId,
} from './workspaceHeaderViewModel';

type WorkspaceJourneyRailProps = {
  activeStep: WorkspaceJourneyStepId;
  ariaLabel: string;
  steps: WorkspaceJourneyStep[];
};

function getJourneyStepIndex(stepId: WorkspaceJourneyStepId) {
  if (stepId === 'overview') {
    return '01';
  }

  if (stepId === 'evidence') {
    return '02';
  }

  if (stepId === 'analysis') {
    return '03';
  }

  return stepId === 'results' ? '04' : '05';
}

export function WorkspaceJourneyRail({
  activeStep,
  ariaLabel,
  steps,
}: WorkspaceJourneyRailProps) {
  return (
    <div className="workspace-process-rail" aria-label={ariaLabel}>
      {steps.map((step) => {
        const isActive = step.id === activeStep;

        return (
          <button
            key={step.id}
            type="button"
            className={`workspace-process-card ${isActive ? 'is-active' : ''} ${
              step.locked ? 'is-locked' : ''
            }`}
            onClick={step.onSelect}
            disabled={step.locked}
          >
            <span className="workspace-process-index">
              {getJourneyStepIndex(step.id)}
            </span>
            <span className="workspace-process-copy">
              <strong>{step.label}</strong>
            </span>
            <span className="workspace-process-meta">
              <em>{step.status}</em>
              <b>{step.metric}</b>
            </span>
          </button>
        );
      })}
    </div>
  );
}
