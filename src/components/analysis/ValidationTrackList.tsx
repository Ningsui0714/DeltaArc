import type {
  SandboxContrarianMove,
  SandboxUnknown,
  SandboxValidationTrack,
} from '../../../shared/sandbox';
import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';
import { getSandboxLabels } from '../../lib/sandboxLabels';

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
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const { priorityLabels } = getSandboxLabels(language);

  return (
    <section className="page-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Validation Tracks' : '验证轨道'}</p>
            <h3>{isEnglish ? 'Validation tracks' : '验证轨道'}</h3>
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
                  <dt>{isEnglish ? 'Method' : '方法'}</dt>
                  <dd>{track.method}</dd>
                </div>
                <div>
                  <dt>{isEnglish ? 'Success Signal' : '成功信号'}</dt>
                  <dd>{track.successSignal}</dd>
                </div>
                <div>
                  <dt>{isEnglish ? 'Failure Signal' : '失败信号'}</dt>
                  <dd>{track.failureSignal}</dd>
                </div>
                <div>
                  <dt>{isEnglish ? 'Cost / Time' : '成本 / 时间'}</dt>
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
              <p className="eyebrow">{isEnglish ? 'Contrarian Moves' : '逆向动作'}</p>
              <h3>{isEnglish ? 'Contrarian moves' : '逆向动作'}</h3>
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
              <p className="eyebrow">{isEnglish ? 'Unknowns' : '待确认未知项'}</p>
              <h3>{isEnglish ? 'Open unknowns' : '待确认未知项'}</h3>
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
