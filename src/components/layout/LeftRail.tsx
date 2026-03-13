import { stepLabels } from '../../data/mockData';
import type { ProjectSnapshot, StepId } from '../../types';

type LeftRailProps = {
  activeStep: StepId;
  project: ProjectSnapshot;
  onNavigate: (step: StepId) => void;
};

export function LeftRail({ activeStep, project, onNavigate }: LeftRailProps) {
  return (
    <aside className="left-rail">
      <div className="brand-block">
        <div className="brand-mark">WT</div>
        <div>
          <p className="eyebrow">Game Wind Tunnel</p>
          <h1>Decision Sandbox for Game Concepts</h1>
        </div>
      </div>

      <section className="project-chip">
        <p className="eyebrow">Current Project</p>
        <div className="project-chip-header">
          <h2>{project.name}</h2>
          <div className="chip-row">
            <span className="mode-chip">{project.mode}</span>
            <span className="meta-chip">{project.genre || 'Genre pending'}</span>
          </div>
        </div>
        <p className="project-summary">
          {project.ideaSummary || 'Describe the core idea first, then pressure-test it with evidence and analysis.'}
        </p>
      </section>

      <nav className="step-list" aria-label="workflow">
        {stepLabels.map((step, index) => {
          const isActive = activeStep === step.id;

          return (
            <button
              key={step.id}
              className={`step-item ${isActive ? 'is-active' : ''}`}
              onClick={() => onNavigate(step.id)}
              type="button"
            >
              <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
              <span>
                <strong>{step.label}</strong>
                <small>{step.kicker}</small>
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
