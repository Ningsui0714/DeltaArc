import type { VariableImpactScanJob } from '../../../shared/variableSandbox';
import {
  formatModeLabel,
  formatTimestamp,
} from './impactScanViewModel';

type ImpactScanHistorySectionProps = {
  activeHistoryScanId: string | null;
  history: VariableImpactScanJob[];
  historyStatus: 'idle' | 'loading' | 'error';
  historyError: string | null;
  isEnglish: boolean;
  language: 'zh' | 'en';
  onOpenHistoryScan: (scanId: string) => void;
};

export function ImpactScanHistorySection({
  activeHistoryScanId,
  history,
  historyStatus,
  historyError,
  isEnglish,
  language,
  onOpenHistoryScan,
}: ImpactScanHistorySectionProps) {
  return (
    <section className="panel staged-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{isEnglish ? 'Recent Scans' : '最近推演'}</p>
          <h3>
            {isEnglish
              ? 'Saved variable runs stay reusable'
              : '已经跑过的变量结果会保留下来'}
          </h3>
        </div>
        {history.length > 0 ? (
          <span className="panel-badge">
            {isEnglish ? `${history.length} saved` : `已保存 ${history.length} 条`}
          </span>
        ) : null}
      </div>

      {historyStatus === 'loading' ? (
        <p>{isEnglish ? 'Loading recent scan history...' : '正在加载最近的推演记录...'}</p>
      ) : history.length > 0 ? (
        <div className="stack-list">
          {history.slice(0, 6).map((scan) => (
            <article key={scan.id} className="stack-card">
              <div className="card-topline">
                <span className="meta-chip">
                  {scan.variable?.name || (isEnglish ? 'Untitled variable' : '未命名变量')}
                </span>
                <span className="tiny-chip">
                  {scan.id === activeHistoryScanId
                    ? isEnglish
                      ? 'Current'
                      : '当前'
                    : formatModeLabel(scan.mode, isEnglish)}
                </span>
              </div>
              <h4>
                {scan.result?.summary ||
                  scan.message ||
                  (isEnglish ? 'Saved scan result' : '已保存的推演结果')}
              </h4>
              <p>
                {isEnglish
                  ? `Saved at ${formatTimestamp(scan.updatedAt, language)}`
                  : `保存于 ${formatTimestamp(scan.updatedAt, language)}`}
              </p>
              <div className="chip-row">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onOpenHistoryScan(scan.id)}
                  disabled={scan.id === activeHistoryScanId}
                >
                  {scan.id === activeHistoryScanId
                    ? isEnglish
                      ? 'Viewing'
                      : '正在查看'
                    : isEnglish
                      ? 'Open Result'
                      : '查看结果'}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p>
          {isEnglish
            ? 'No saved scans yet. Once a variable run finishes, it will stay here for later comparison.'
            : '还没有保存过推演结果。等第一轮变量推演完成后，它会留在这里方便后续回看。'}
        </p>
      )}

      {historyError ? <p className="status-error">{historyError}</p> : null}
    </section>
  );
}
