import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';

type AnalysisStatePanelProps = {
  title: string;
  description: string;
  trustNote?: string;
  canRunAnalysis?: boolean;
  onRunQuickForecast?: () => void;
  onRunDeepForecast?: () => void;
};

export function AnalysisStatePanel({
  title,
  description,
  trustNote,
  canRunAnalysis = true,
  onRunQuickForecast,
  onRunDeepForecast,
}: AnalysisStatePanelProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);

  return (
    <section className="panel analysis-state-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{isEnglish ? 'Formal Run Required' : '需要先完成正式推理'}</p>
          <h3>{title}</h3>
        </div>
        <span className="panel-badge">{isEnglish ? 'Only formal outputs appear here' : '这里只显示正式结果'}</span>
      </div>
      <p className="analysis-state-copy">{description}</p>
      {trustNote ? <p className="analysis-trust-note">{trustNote}</p> : null}
      {!canRunAnalysis ? (
        <p className="analysis-trust-note">
          {isEnglish
            ? 'Rerun is locked until the 4/4 setup and 3 evidence gate are ready again.'
            : '想重新运行的话，需要先把 4/4 关键设定和 3 条证据门槛补回来。'}
        </p>
      ) : null}
      <div className="analysis-state-actions">
        {onRunQuickForecast ? (
          <button
            type="button"
            className="ghost-button"
            disabled={!canRunAnalysis}
            onClick={onRunQuickForecast}
          >
            {isEnglish ? 'Run Quick Scan' : '开始快速扫描'}
          </button>
        ) : null}
        {onRunDeepForecast ? (
          <button
            type="button"
            className="accent-button"
            disabled={!canRunAnalysis}
            onClick={onRunDeepForecast}
          >
            {isEnglish ? 'Run Deep Dive' : '开始深度推演'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
