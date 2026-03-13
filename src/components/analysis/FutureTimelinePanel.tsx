import type {
  SandboxCommunityRhythm,
  SandboxFutureTimelineItem,
  SandboxTrajectorySignal,
} from '../../../shared/sandbox';
import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';
import { getSandboxLabels } from '../../lib/sandboxLabels';

type FutureTimelinePanelProps = {
  futureTimeline: SandboxFutureTimelineItem[];
  communityRhythms: SandboxCommunityRhythm[];
  trajectorySignals: SandboxTrajectorySignal[];
};

export function FutureTimelinePanel({
  futureTimeline,
  communityRhythms,
  trajectorySignals,
}: FutureTimelinePanelProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const { directionLabels } = getSandboxLabels(language);

  return (
    <section className="timeline-stage-layout">
      <section className="panel timeline-stage-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Future Timeline' : '未来时间线'}</p>
            <h3>{isEnglish ? 'Launch timeline simulation' : '发布时间线模拟'}</h3>
          </div>
        </div>
        <div className="forecast-timeline-window">
          <div className="forecast-timeline">
            {futureTimeline.map((beat, index) => (
              <article key={`${beat.phase}-${beat.timing}`} className="forecast-beat-card">
                <div className="forecast-rail" aria-hidden="true">
                  <span className="forecast-node">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="forecast-beat-body">
                  <div className="card-topline">
                    <span className="tiny-chip">{beat.phase}</span>
                    <span className="meta-chip">{beat.timing}</span>
                  </div>
                  <h4>{beat.expectedReaction}</h4>
                  <p>{beat.likelyShift}</p>
                  <dl className="detail-list">
                    <div>
                      <dt>{isEnglish ? 'Primary Risk' : '主要风险'}</dt>
                      <dd>{beat.risk}</dd>
                    </div>
                    <div>
                      <dt>{isEnglish ? 'Suggested Move' : '建议动作'}</dt>
                      <dd>{beat.recommendedResponse}</dd>
                    </div>
                  </dl>
                  {beat.watchSignals.length > 0 ? (
                    <div className="chip-row">
                      {beat.watchSignals.map((signal) => (
                        <span key={signal} className="meta-chip">
                          {signal}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="timeline-side-stack">
        <section className="panel inner-panel timeline-side-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isEnglish ? 'Community Rhythm' : '社区节奏'}</p>
              <h3>{isEnglish ? 'Community rhythms' : '社区节奏'}</h3>
            </div>
          </div>
          <div className="stack-scroll-window">
            <div className="stack-list">
              {communityRhythms.map((rhythm) => (
                <article key={`${rhythm.name}-${rhythm.timing}`} className="stack-card">
                  <div className="card-topline">
                    <span className="tiny-chip">{rhythm.name}</span>
                    <span className="meta-chip">{rhythm.timing}</span>
                  </div>
                  <p>{rhythm.pattern}</p>
                  <dl className="detail-list">
                    <div>
                      <dt>{isEnglish ? 'Trigger' : '触发点'}</dt>
                      <dd>{rhythm.trigger}</dd>
                    </div>
                    <div>
                      <dt>{isEnglish ? 'Implication' : '意味着什么'}</dt>
                      <dd>{rhythm.implication}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="panel inner-panel timeline-side-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isEnglish ? 'Trajectory Signals' : '走势转折信号'}</p>
              <h3>{isEnglish ? 'Trajectory inflection signals' : '走势转折信号'}</h3>
            </div>
          </div>
          <div className="stack-scroll-window">
            <div className="stack-list">
              {trajectorySignals.map((signal) => (
                <article key={`${signal.signal}-${signal.timing}`} className="stack-card">
                  <div className="card-topline">
                    <span className="tiny-chip">{signal.timing}</span>
                    <span className="meta-chip">{directionLabels[signal.direction]}</span>
                  </div>
                  <h4>{signal.signal}</h4>
                  <p>{signal.impact}</p>
                  <small>{signal.recommendedMove}</small>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </section>
  );
}
