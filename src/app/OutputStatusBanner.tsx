import { isEnglishUi, useUiLanguage } from '../hooks/useUiLanguage';
import { getAnalysisModeLabel } from '../lib/analysisModeLabels';
import type { WorkspaceController } from './useWorkspaceController';

type OutputStatusBannerProps = {
  error: string | null;
  status: WorkspaceController['status'];
  lastRequestedAnalysisMode: WorkspaceController['lastRequestedAnalysisMode'];
  visibleAnalysisMode: WorkspaceController['visibleAnalysisMode'];
  isShowingFallbackAnalysis: WorkspaceController['isShowingFallbackAnalysis'];
  hasViewableAnalysis: boolean;
  isAnalysisStale: boolean;
  isAnalysisDegraded: boolean;
  canRunAnalysis: boolean;
  onRunQuickForecast: () => void;
  onRunDeepForecast: () => void;
};

export function OutputStatusBanner({
  error,
  status,
  lastRequestedAnalysisMode,
  visibleAnalysisMode,
  isShowingFallbackAnalysis,
  hasViewableAnalysis,
  isAnalysisStale,
  isAnalysisDegraded,
  canRunAnalysis,
  onRunQuickForecast,
  onRunDeepForecast,
}: OutputStatusBannerProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const visibleModeLabel =
    hasViewableAnalysis && visibleAnalysisMode
      ? getAnalysisModeLabel(visibleAnalysisMode, language)
      : null;
  const requestedModeLabel = lastRequestedAnalysisMode
    ? getAnalysisModeLabel(lastRequestedAnalysisMode, language)
    : null;
  const showFallbackAnalysisWarning =
    status === 'error' &&
    hasViewableAnalysis &&
    isShowingFallbackAnalysis &&
    Boolean(visibleModeLabel) &&
    Boolean(requestedModeLabel);

  if (!isAnalysisStale && !isAnalysisDegraded && !showFallbackAnalysisWarning) {
    return null;
  }

  const title = showFallbackAnalysisWarning
    ? requestedModeLabel !== visibleModeLabel
      ? isEnglish
        ? `Latest ${requestedModeLabel} failed. Still showing previous ${visibleModeLabel} output`
        : `最近一次${requestedModeLabel}失败了，当前仍在显示上一份${visibleModeLabel}结果`
      : isEnglish
        ? `Latest ${requestedModeLabel} failed. Still showing the last viewable ${visibleModeLabel} output`
        : `最近一次${requestedModeLabel}失败了，当前仍在显示上一份可查看的${visibleModeLabel}结果`
    : isAnalysisDegraded
      ? isEnglish
        ? 'Current outputs needed fallback handling during the formal run'
        : '当前输出在正式推理中触发了回退或修复'
      : isEnglish
        ? 'Current outputs are stale'
        : '当前输出结果已过期';
  const description = showFallbackAnalysisWarning
    ? requestedModeLabel !== visibleModeLabel
      ? isEnglish
        ? `The page did not switch to a new ${requestedModeLabel} result. What you are reading is still the previous ${visibleModeLabel} output.${error ? ` Error: ${error}` : ''}`
        : `页面没有切换到新的${requestedModeLabel}结果。你现在读到的仍是上一份${visibleModeLabel}输出。${error ? `错误：${error}` : ''}`
      : isEnglish
        ? `The latest rerun did not produce a replacement result, so the last viewable ${visibleModeLabel} output remains on screen.${error ? ` Error: ${error}` : ''}`
        : `最近一次重跑没有产出可替换的新结果，所以当前屏幕上仍保留着上一份可查看的${visibleModeLabel}输出。${error ? `错误：${error}` : ''}`
    : isAnalysisDegraded
      ? isEnglish
        ? 'The run still completed, but one or more stages needed timeout fallback or JSON repair. The result stays readable, though rerunning is recommended before treating it as a final truth source.'
        : '这轮推理已经完成，但其中一个或多个阶段触发了超时回退或 JSON 修复。结果仍可阅读，不过在把它当成最终真相源之前，建议再重跑一次。'
      : isEnglish
        ? 'The latest visible outputs were generated before the current inputs changed. They stay viewable, but rerunning will refresh the decision surface.'
        : '当前可见输出生成于本轮输入变化之前。旧结果仍可查看，但建议重跑以刷新决策面。';
  const runGuardrailCopy = !canRunAnalysis
    ? isEnglish
      ? 'Rerun is temporarily locked because the current draft no longer meets the 4/4 setup and 3 evidence gate.'
      : '当前草稿已经不满足 4/4 设定和 3 条证据门槛，所以这里暂时不能直接重跑。'
    : null;

  return (
    <section className="panel split-panel">
      <div>
        <p className="eyebrow">
          {showFallbackAnalysisWarning
            ? isEnglish
              ? 'Latest Rerun Failed'
              : '最近一次重跑失败'
            : isEnglish
              ? 'Rerun Recommended'
              : '建议重跑'}
        </p>
        <h4>{title}</h4>
        <p>{description}</p>
        {runGuardrailCopy ? <p>{runGuardrailCopy}</p> : null}
      </div>
      <div className="chip-row">
        {visibleModeLabel ? (
          <span className="meta-chip">
            {isEnglish ? `Visible: ${visibleModeLabel}` : `当前显示：${visibleModeLabel}`}
          </span>
        ) : null}
        {showFallbackAnalysisWarning && requestedModeLabel ? (
          <span className="meta-chip">
            {isEnglish
              ? `Latest request: ${requestedModeLabel}`
              : `最近请求：${requestedModeLabel}`}
          </span>
        ) : null}
        <button
          type="button"
          className="ghost-button"
          disabled={!canRunAnalysis}
          onClick={onRunQuickForecast}
        >
          {isEnglish ? 'Run Quick Scan Again' : '重新运行快速扫描'}
        </button>
        <button
          type="button"
          className="accent-button"
          disabled={!canRunAnalysis}
          onClick={onRunDeepForecast}
        >
          {isEnglish ? 'Run Deep Dive Again' : '重新运行深度推演'}
        </button>
      </div>
    </section>
  );
}
