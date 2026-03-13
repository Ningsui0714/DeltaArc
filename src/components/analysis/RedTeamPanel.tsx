import type { SandboxMemorySignal, SandboxRedTeamReport } from '../../../shared/sandbox';
import { memoryStrengthLabels } from '../../lib/sandboxLabels';

type RedTeamPanelProps = {
  redTeam: SandboxRedTeamReport;
  memorySignals: SandboxMemorySignal[];
};

export function RedTeamPanel({ redTeam, memorySignals }: RedTeamPanelProps) {
  return (
    <section className="dual-analysis-grid">
      <section className="panel inner-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Red Team</p>
            <h3>反方拆解</h3>
          </div>
        </div>
        <article className="stack-card red-team-card">
          <h4>{redTeam.thesis}</h4>
          <div className="stack-pairs">
            <div>
              <strong>攻击向量</strong>
              <ul className="bullet-list compact-bullets">
                {redTeam.attackVectors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>失败模式</strong>
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
            <p className="eyebrow">Memory Signals</p>
            <h3>历史记忆信号</h3>
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
