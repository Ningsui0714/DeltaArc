import type { SandboxAnalysisJob } from '../../../shared/sandbox';
import { formatJobDuration } from '../../lib/jobProgress';
import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';

type LiveOutputFeedProps = {
  job: SandboxAnalysisJob;
};

export function LiveOutputFeed({ job }: LiveOutputFeedProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const previewStages = [...job.stages]
    .filter((stage) => stage.preview)
    .sort((left, right) => {
      const leftTime = Date.parse(left.completedAt ?? left.startedAt ?? job.createdAt);
      const rightTime = Date.parse(right.completedAt ?? right.startedAt ?? job.createdAt);
      return rightTime - leftTime;
    });
  const runningStage = job.stages.find((stage) => stage.status === 'running');

  if (previewStages.length === 0 && !runningStage) {
    return null;
  }

  return (
    <section className="live-output-feed" aria-label={isEnglish ? 'live forecast output' : '实时预测输出'}>
      {runningStage ? (
        <article className="live-output-card is-running">
          <div className="live-output-topline">
            <span className="tiny-chip">{isEnglish ? 'Running' : '运行中'}</span>
            <span className="meta-chip">{runningStage.label}</span>
          </div>
          <h4>{isEnglish ? 'Generating the next stage preview' : '正在生成新的阶段内容'}</h4>
          <p>{runningStage.detail}</p>
        </article>
      ) : null}

      {previewStages.map((stage) => (
        <article
          key={stage.key}
          className={`live-output-card ${stage.status === 'error' ? 'is-error' : 'is-completed'}`}
        >
          <div className="live-output-topline">
            <span className="tiny-chip">{stage.label}</span>
            <span className="meta-chip">
              {[stage.model, stage.durationMs ? formatJobDuration(stage.durationMs, language) : '']
                .filter(Boolean)
                .join(' · ') || stage.status}
            </span>
          </div>
          <h4>{stage.preview?.headline}</h4>
          {stage.preview?.summary ? <p>{stage.preview.summary}</p> : null}
          {stage.preview && stage.preview.bullets.length > 0 ? (
            <ul className="compact-bullets">
              {stage.preview.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </section>
  );
}
