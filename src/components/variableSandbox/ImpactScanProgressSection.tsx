import type {
  DesignVariableV1,
  FrozenBaseline,
  VariableImpactScanJob,
  VariableImpactScanResult,
} from '../../../shared/variableSandbox';
import {
  buildImpactScanFlow,
  formatJobStageDetail,
  formatJobStageLabel,
  formatJobStageStatus,
  getScanFlowStateLabel,
} from './impactScanViewModel';

type ImpactScanProgressSectionProps = {
  baseline: FrozenBaseline;
  variable: DesignVariableV1;
  job: VariableImpactScanJob | null;
  result: VariableImpactScanResult | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  historyStatus: 'idle' | 'loading' | 'error';
  isEnglish: boolean;
};

export function ImpactScanProgressSection({
  baseline,
  variable,
  job,
  result,
  status,
  error,
  historyStatus,
  isEnglish,
}: ImpactScanProgressSectionProps) {
  const currentStage = job?.stages.find((stage) => stage.status === 'running') ?? null;
  const isHydratingHistory =
    !result && !job && historyStatus === 'loading' && status === 'idle';
  const flow = buildImpactScanFlow({
    baseline,
    variable,
    currentStageLabel: currentStage?.label ?? null,
    result,
    status,
    job,
    isEnglish,
  });

  return (
    <section className="panel staged-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{isEnglish ? 'Scan Progress' : '推演进度'}</p>
          <h3>
            {result
              ? isEnglish
                ? 'The variable result is ready'
                : '变量推演结果已经就绪'
              : isHydratingHistory
                ? isEnglish
                  ? 'Loading recent saved results'
                  : '正在加载最近保存的结果'
                : status === 'loading'
                  ? isEnglish
                    ? currentStage?.label ?? 'The scan is running'
                    : currentStage?.label ?? '推演正在运行'
                  : isEnglish
                    ? 'The scan needs attention'
                    : '这轮推演需要处理'}
          </h3>
        </div>
        <span className="panel-badge">
          {status === 'loading'
            ? isEnglish
              ? 'Running'
              : '运行中'
            : isHydratingHistory
              ? isEnglish
                ? 'Loading'
                : '加载中'
              : result
                ? isEnglish
                  ? 'Ready'
                  : '已完成'
                : isEnglish
                  ? 'Error'
                  : '失败'}
        </span>
      </div>

      <div className="sandbox-flow-grid sandbox-flow-grid-compact">
        {flow.map((item) => (
          <article
            key={item.id}
            className={`sandbox-flow-card ${
              item.state === 'done'
                ? 'is-done'
                : item.state === 'current'
                  ? 'is-current'
                  : 'is-upcoming'
            }`}
          >
            <div className="card-topline">
              <span className="sandbox-flow-index">{item.index}</span>
              <span className="tiny-chip">
                {getScanFlowStateLabel(item.state, isEnglish)}
              </span>
            </div>
            <h4>{item.title}</h4>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>

      {job ? (
        <div className="stage-list">
          {job.stages.map((stage) => (
            <article
              key={stage.key}
              className={`stage-item ${
                stage.status === 'running'
                  ? 'stage-running'
                  : stage.status === 'completed'
                    ? 'stage-completed'
                    : stage.status === 'error'
                      ? 'stage-error'
                      : ''
              }`}
            >
              <div className="card-topline">
                <strong>{formatJobStageLabel(stage, isEnglish)}</strong>
                <span className="tiny-chip">
                  {formatJobStageStatus(stage.status, isEnglish)}
                </span>
              </div>
              <p>{formatJobStageDetail(stage, isEnglish)}</p>
            </article>
          ))}
        </div>
      ) : null}

      {error ? <p className="status-error">{error}</p> : null}
    </section>
  );
}
