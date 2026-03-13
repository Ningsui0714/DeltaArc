import type { ProjectSnapshot, StepId } from '../../types';

const workflowSteps: Array<{ id: StepId; label: string; kicker: string }> = [
  { id: 'overview', label: '项目设定', kicker: '定义' },
  { id: 'evidence', label: '证据信号', kicker: '证据' },
  { id: 'modeling', label: '当前判断', kicker: '建模' },
  { id: 'strategy', label: '未来演化', kicker: '推演' },
  { id: 'report', label: '预测报告', kicker: '报告' },
];

type LeftRailProps = {
  activeStep: StepId;
  project: ProjectSnapshot;
  onNavigate: (step: StepId) => void;
};

function formatProjectMode(mode: ProjectSnapshot['mode']) {
  if (mode === 'Concept') {
    return '概念阶段';
  }

  if (mode === 'Validation') {
    return '验证阶段';
  }

  return '上线阶段';
}

export function LeftRail({ activeStep, project, onNavigate }: LeftRailProps) {
  return (
    <aside className="left-rail">
      <div className="brand-block">
        <div className="brand-mark">PF</div>
        <div>
          <p className="eyebrow">预测沙盘</p>
          <h1>把项目做成未来演化预测器</h1>
        </div>
      </div>

      <section className="project-chip">
        <p className="eyebrow">当前项目</p>
        <div className="project-chip-header">
          <h2>{project.name}</h2>
          <div className="chip-row">
            <span className="mode-chip">{formatProjectMode(project.mode)}</span>
            <span className="meta-chip">{project.genre || '类型待补充'}</span>
          </div>
        </div>
        <p className="project-summary">
          {project.ideaSummary || '先写清楚这次发布后你希望社区先怎么反应，再让系统去模拟时间线。'}
        </p>
      </section>

      <nav className="step-list" aria-label="工作流">
        {workflowSteps.map((step, index) => {
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
