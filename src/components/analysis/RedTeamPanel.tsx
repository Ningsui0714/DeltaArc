import type { SandboxMemorySignal, SandboxRedTeamReport } from '../../../shared/sandbox';
import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';
import { getSandboxLabels } from '../../lib/sandboxLabels';

type RedTeamPanelProps = {
  redTeam: SandboxRedTeamReport;
  memorySignals: SandboxMemorySignal[];
};

export function RedTeamPanel({ redTeam, memorySignals }: RedTeamPanelProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const { memoryStrengthLabels } = getSandboxLabels(language);

  return (
    <section className="dual-analysis-grid">
      <section className="panel inner-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Red Team' : '反方拆解'}</p>
            <h3>{isEnglish ? 'Counter-argument breakdown' : '反方拆解'}</h3>
          </div>
        </div>
        <article className="stack-card red-team-card">
          <h4>{redTeam.thesis}</h4>
          <div className="stack-pairs">
            <div>
              <strong>{isEnglish ? 'Attack vectors' : '攻击向量'}</strong>
              <ul className="bullet-list compact-bullets">
                {redTeam.attackVectors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>{isEnglish ? 'Failure modes' : '失败模式'}</strong>
              <ul className="bullet-list compact-bullets">
                {redTeam.failureModes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <p>{redTeam.mitigation}</p>
        </article>
      </section>

      <section className="panel inner-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Memory Signals' : '历史记忆信号'}</p>
            <h3>{isEnglish ? 'Historical memory signals' : '历史记忆信号'}</h3>
          </div>
        </div>
        <div className="stack-list">
          {memorySignals.map((signal) => (
            <article key={`${signal.title}-${signal.summary}`} className="stack-card">
              <div className="card-topline">
                <span className="tiny-chip">{signal.title}</span>
                <span className="meta-chip">{memoryStrengthLabels[signal.signalStrength]}</span>
              </div>
              <p>{signal.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
