import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';

type AnalysisStatePanelProps = {
  title: string;
  description: string;
  trustNote?: string;
  onRunQuickForecast?: () => void;
  onRunDeepForecast?: () => void;
};

export function AnalysisStatePanel({
  title,
  description,
  trustNote,
  onRunQuickForecast,
  onRunDeepForecast,
}: AnalysisStatePanelProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);

  return (
    <section className="panel analysis-state-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{isEnglish ? 'Formal Run Required' : '需要正式预测'}</p>
          <h3>{title}</h3>
        </div>
        <span className="panel-badge">{isEnglish ? 'Only formal outputs appear here' : '只显示正式结果'}</span>
      </div>
      <p className="analysis-state-copy">{description}</p>
      {trustNote ? <p className="analysis-trust-note">{trustNote}</p> : null}
      <div className="analysis-state-actions">
        {onRunQuickForecast ? (
          <button type="button" className="ghost-button" onClick={onRunQuickForecast}>
            {isEnglish ? 'Run Quick Scan' : '运行快速扫描'}
          </button>
        ) : null}
        {onRunDeepForecast ? (
          <button type="button" className="accent-button" onClick={onRunDeepForecast}>
            {isEnglish ? 'Run Deep Dive' : '运行深度推演'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
