import type {
  SandboxContrarianMove,
  SandboxUnknown,
  SandboxValidationTrack,
} from '../../../shared/sandbox';
import { priorityLabels } from '../../lib/sandboxLabels';

type ValidationTrackListProps = {
  validationTracks: SandboxValidationTrack[];
  contrarianMoves: SandboxContrarianMove[];
  unknowns: SandboxUnknown[];
};

export function ValidationTrackList({
  validationTracks,
  contrarianMoves,
  unknowns,
}: ValidationTrackListProps) {
  return (
    <section className="page-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Validation Tracks</p>
            <h3>验证轨道</h3>
          </div>
        </div>
        <div className="validation-track-list">
          {validationTracks.map((track) => (
            <article key={track.name} className="validation-card">
              <div className="card-topline">
                <span className="tiny-chip">{track.priority}</span>
                <span className="meta-chip">{priorityLabels[track.priority]}</span>
              </div>
              <h4>{track.name}</h4>
              <p>{track.goal}</p>
              <dl className="detail-list">
                <div>
                  <dt>方法</dt>
                  <dd>{track.method}</dd>
                </div>
                <div>
                  <dt>成功信号</dt>
                  <dd>{track.successSignal}</dd>
                </div>
                <div>
                  <dt>失败信号</dt>
                  <dd>{track.failureSignal}</dd>
                </div>
                <div>
                  <dt>成本 / 时间</dt>
                  <dd>
                    {track.cost} / {track.timeframe}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="dual-analysis-grid">
        <section className="panel inner-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Contrarian Moves</p>
              <h3>逆向动作</h3>
            </div>
          </div>
          <div className="stack-list">
            {contrarianMoves.map((move) => (
              <article key={move.title} className="stack-card">
                <h4>{move.title}</h4>
                <p>{move.thesis}</p>
                <small>{move.whenToUse}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel inner-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Unknowns</p>
              <h3>待确认未知项</h3>
            </div>
          </div>
          <div className="stack-list">
            {unknowns.map((unknown) => (
              <article key={unknown.topic} className="stack-card">
                <h4>{unknown.topic}</h4>
                <p>{unknown.whyUnknown}</p>
                <small>{unknown.resolveBy}</small>
              </article>
            ))}
          </div>
        </section>
      </section>
    </section>
  );
}
