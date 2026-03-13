import type { SandboxAnalysisJob } from '../../../shared/sandbox';
import { getAgentStageMeta } from '../../lib/agentStageMeta';
import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';

type AgentCollaborationPanelProps = {
  job: SandboxAnalysisJob;
};

export function AgentCollaborationPanel({ job }: AgentCollaborationPanelProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const agentStageMeta = getAgentStageMeta(language);
  const visibleStages = job.stages.filter((stage) => stage.key !== 'complete' && agentStageMeta[stage.key]);

  if (visibleStages.length === 0) {
    return null;
  }

  return (
    <section className="collaboration-panel" aria-label={isEnglish ? 'agent collaboration' : '代理协作'}>
      <div className="collaboration-panel-heading">
        <p className="eyebrow">{isEnglish ? 'Agent Collaboration' : '代理协作'}</p>
        <strong>{isEnglish ? 'Who is handing off to whom' : '谁在和谁接力'}</strong>
      </div>
      <div className="collaboration-grid">
        {visibleStages.map((stage, index) => {
          const meta = agentStageMeta[stage.key];

          if (!meta) {
            return null;
          }

          return (
            <article key={stage.key} className={`collaboration-card status-${stage.status}`}>
              <div className="collaboration-card-topline">
                <span className="tiny-chip">{String(index + 1).padStart(2, '0')}</span>
                <span className="meta-chip">
                  {stage.status === 'running'
                    ? isEnglish
                      ? 'Running'
                      : '进行中'
                    : stage.status === 'completed'
                      ? isEnglish
                        ? 'Done'
                        : '已完成'
                      : stage.status === 'error'
                        ? isEnglish
                          ? 'Error'
                          : '异常'
                        : isEnglish
                          ? 'Pending'
                          : '排队中'}
                </span>
              </div>
              <h4>{meta.agent}</h4>
              <p className="collaboration-role">{meta.role}</p>
              <p>{meta.handoff}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
