import type {
  DesignVariableV1,
  FrozenBaseline,
  VariableImpactScanJob,
  VariableImpactScanResult,
} from '../../../shared/variableSandbox';
import {
  isEnglishUi,
  useUiLanguage,
} from '../../hooks/useUiLanguage';
import { MetricCard } from '../ui/MetricCard';
import { GuardrailChecklist } from './GuardrailChecklist';

type ImpactScanPanelProps = {
  baseline: FrozenBaseline | null;
  variable: DesignVariableV1;
  job: VariableImpactScanJob | null;
  result: VariableImpactScanResult | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  history: VariableImpactScanJob[];
  historyStatus: 'idle' | 'loading' | 'error';
  historyError: string | null;
  onOpenHistoryScan: (scanId: string) => void;
};

function formatEvidenceLevel(value: VariableImpactScanResult['evidenceLevel'], isEnglish: boolean) {
  if (isEnglish) {
    return value;
  }

  if (value === 'high') {
    return '高';
  }

  if (value === 'medium') {
    return '中';
  }

  return '低';
}

function formatRiskLevel(value: 'low' | 'medium' | 'high', isEnglish: boolean) {
  if (isEnglish) {
    return value;
  }

  if (value === 'high') {
    return '高风险';
  }

  if (value === 'medium') {
    return '中风险';
  }

  return '低风险';
}

function formatJobStageStatus(
  value: VariableImpactScanJob['stages'][number]['status'],
  isEnglish: boolean,
) {
  if (isEnglish) {
    return value;
  }

  if (value === 'running') {
    return '进行中';
  }

  if (value === 'completed') {
    return '已完成';
  }

  if (value === 'error') {
    return '失败';
  }

  return '待开始';
}

function formatJobStageLabel(
  stage: VariableImpactScanJob['stages'][number],
  isEnglish: boolean,
) {
  if (isEnglish) {
    return stage.label;
  }

  if (stage.key === 'queued') {
    return '排队中';
  }

  if (stage.key === 'baseline_read') {
    return '读取基线';
  }

  if (stage.key === 'impact_scan') {
    return '变量推演';
  }

  return '完成';
}

function formatJobStageDetail(
  stage: VariableImpactScanJob['stages'][number],
  isEnglish: boolean,
) {
  if (isEnglish) {
    return stage.detail;
  }

  if (stage.key === 'queued') {
    return '等待启动变量推演。';
  }

  if (stage.key === 'baseline_read') {
    return stage.status === 'completed'
      ? '已读取冻结后的基线。'
      : '正在读取冻结后的基线。';
  }

  if (stage.key === 'impact_scan') {
    return stage.status === 'completed'
      ? '直接影响、护栏和验证动作已经生成。'
      : stage.status === 'error'
        ? '变量推演未能顺利完成。'
        : '正在整理直接影响、护栏和验证动作。';
  }

  return '变量推演已完成。';
}

function formatTargetLabel(value: string, isEnglish: boolean) {
  const labels: Record<string, { zh: string; en: string }> = {
    core_loop: { zh: '核心循环', en: 'Core Loop' },
    session_pacing: { zh: '局内节奏', en: 'Session Pacing' },
    player_cooperation: { zh: '玩家协作', en: 'Player Cooperation' },
    resource_flow: { zh: '资源流转', en: 'Resource Flow' },
    progression_curve: { zh: '成长曲线', en: 'Progression Curve' },
    failure_recovery: { zh: '失败恢复', en: 'Failure Recovery' },
    event_rhythm: { zh: '活动节奏', en: 'Event Rhythm' },
    return_triggers: { zh: '回流触发', en: 'Return Triggers' },
    community_coordination: { zh: '社区协同', en: 'Community Coordination' },
    value_perception: { zh: '价值感知', en: 'Value Perception' },
    conversion_moment: { zh: '转化时刻', en: 'Conversion Moment' },
    retention_tradeoff: { zh: '留存权衡', en: 'Retention Tradeoff' },
  };

  const entry = labels[value];
  if (!entry) {
    return value;
  }

  return isEnglish ? entry.en : entry.zh;
}

function formatModeLabel(value: VariableImpactScanJob['mode'], isEnglish: boolean) {
  if (value === 'reasoning') {
    return isEnglish ? 'Deep' : '深度';
  }

  return isEnglish ? 'Quick' : '快速';
}

function formatTimestamp(value: string, language: 'zh' | 'en') {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

function getScanFlowStateLabel(
  state: 'done' | 'current' | 'upcoming',
  isEnglish: boolean,
) {
  if (state === 'done') {
    return isEnglish ? 'Done' : '已完成';
  }

  if (state === 'current') {
    return isEnglish ? 'Current' : '当前';
  }

  return isEnglish ? 'Next' : '下一步';
}

export function ImpactScanPanel({
  baseline,
  variable,
  job,
  result,
  status,
  error,
  history,
  historyStatus,
  historyError,
  onOpenHistoryScan,
}: ImpactScanPanelProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const currentStage = job?.stages.find((stage) => stage.status === 'running') ?? null;
  const activeHistoryScanId = job?.id ?? null;
  const isHydratingHistory = !result && !job && historyStatus === 'loading' && status === 'idle';
  const flow = [
    {
      id: 'baseline',
      index: '01',
      title: isEnglish ? 'Baseline loaded' : '读取基线',
      state: 'done' as const,
      detail: isEnglish ? `Using ${baseline?.id ?? 'baseline'}` : `使用 ${baseline?.id ?? '基线'}`,
    },
    {
      id: 'idea',
      index: '02',
      title: isEnglish ? 'Idea submitted' : '提交想法',
      state:
        variable.name.trim() && variable.changeStatement.trim() && variable.intent.trim()
          ? ('done' as const)
          : ('current' as const),
      detail: variable.name.trim()
        ? variable.name
        : isEnglish
          ? 'Waiting for the idea fields to be completed.'
          : '等待把想法字段补完整。',
    },
    {
      id: 'scan',
      index: '03',
      title: isEnglish ? 'Impact scan' : '影响扫描',
      state:
        result
          ? ('done' as const)
          : status === 'loading' || status === 'error' || Boolean(job)
            ? ('current' as const)
            : ('upcoming' as const),
      detail: status === 'loading'
        ? currentStage?.label ?? (isEnglish ? 'Scan is running now.' : '推演正在运行。')
        : status === 'error'
          ? isEnglish
            ? 'The latest scan stopped with an error.'
            : '最近一次推演在中途失败。'
          : isEnglish
            ? 'The system will turn the idea into direct effects and guardrails here.'
            : '系统会在这里把想法整理成直接影响和关键护栏。',
    },
    {
      id: 'result',
      index: '04',
      title: isEnglish ? 'Read result' : '查看结果',
      state: result ? ('done' as const) : Boolean(job) || status === 'error' ? ('current' as const) : ('upcoming' as const),
      detail: result
        ? result.summary
        : isEnglish
          ? 'The result area will explain direct impact, affected groups, and next actions.'
          : '结果区会解释直接影响、受影响人群和下一步动作。',
    },
  ];

  if (!baseline) {
    return null;
  }

  if (!result && !job && status === 'idle' && historyStatus !== 'loading' && !historyError && history.length === 0) {
    return (
      <section className="panel empty-state-panel sandbox-result-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Scan Result' : '推演结果'}</p>
            <h3>{isEnglish ? 'The result will land here next' : '下一步的推演结果会落在这里'}</h3>
          </div>
        </div>
        <p>
          {isEnglish
            ? `Once ${variable.name || 'the variable'} is submitted, this area will show the direct effects, affected groups, guardrails, and validation steps against baseline ${baseline.id}.`
            : `当 ${variable.name || '变量'} 提交后，这里会基于基线 ${baseline.id} 展示直接影响、受影响人群、护栏和验证步骤。`}
        </p>
      </section>
    );
  }

  return (
    <section className="page-grid sandbox-result-panel">
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
              className={`sandbox-flow-card ${item.state === 'done' ? 'is-done' : item.state === 'current' ? 'is-current' : 'is-upcoming'}`}
            >
              <div className="card-topline">
                <span className="sandbox-flow-index">{item.index}</span>
                <span className="tiny-chip">{getScanFlowStateLabel(item.state, isEnglish)}</span>
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
                className={`stage-item ${stage.status === 'running' ? 'stage-running' : stage.status === 'completed' ? 'stage-completed' : stage.status === 'error' ? 'stage-error' : ''}`}
              >
                <div className="card-topline">
                  <strong>{formatJobStageLabel(stage, isEnglish)}</strong>
                  <span className="tiny-chip">{formatJobStageStatus(stage.status, isEnglish)}</span>
                </div>
                <p>{formatJobStageDetail(stage, isEnglish)}</p>
              </article>
            ))}
          </div>
        ) : null}

        {error ? <p className="status-error">{error}</p> : null}
      </section>

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

      {result ? (
        <>
          <section className="metrics-row">
            <MetricCard
              label={isEnglish ? 'Confidence' : '置信度'}
              value={`${result.confidence}%`}
              tone={result.confidence >= 70 ? 'good' : 'alert'}
            />
            <MetricCard
              label={isEnglish ? 'Evidence Level' : '证据等级'}
              value={formatEvidenceLevel(result.evidenceLevel, isEnglish)}
              tone={result.evidenceLevel === 'high' ? 'good' : 'info'}
            />
            <MetricCard
              label={isEnglish ? 'Impacted Targets' : '影响目标'}
              value={`${result.impactScan.length}`}
              tone="info"
            />
          </section>

          <section className="panel split-panel">
            <div>
              <p className="eyebrow">{isEnglish ? 'Summary' : '摘要'}</p>
              <h4>{isEnglish ? 'What changes first' : '首先变化的是什么'}</h4>
              <p>{result.summary}</p>
            </div>
            <div>
              <p className="eyebrow">{isEnglish ? 'Baseline Read' : '基线解读'}</p>
              <h4>{isEnglish ? 'What the frozen truth source still says' : '冻结真相源当前仍在表达什么'}</h4>
              <p>{result.baselineRead.summary}</p>
              <ul className="bullet-list">
                <li>
                  {isEnglish
                    ? `Primary risk: ${result.baselineRead.primaryRisk}`
                    : `核心风险：${result.baselineRead.primaryRisk}`}
                </li>
                <li>
                  {isEnglish
                    ? `Evidence level: ${formatEvidenceLevel(result.baselineRead.evidenceLevel, true)}`
                    : `证据等级：${formatEvidenceLevel(result.baselineRead.evidenceLevel, false)}`}
                </li>
              </ul>
            </div>
          </section>

          <section className="panel staged-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isEnglish ? 'Direct Effects' : '直接影响'}</p>
                <h3>{isEnglish ? 'The first-order change map' : '第一层变化地图'}</h3>
              </div>
            </div>
            <div className="stack-list">
              {result.impactScan.map((item) => (
                <article key={`${item.target}-${item.directEffect}`} className="stack-card">
                  <div className="card-topline">
                    <span className="meta-chip">{formatTargetLabel(item.target, isEnglish)}</span>
                    <span className="tiny-chip">{item.confidence}%</span>
                  </div>
                  <h4>{item.directEffect}</h4>
                  <p>{item.upside}</p>
                  <small>{item.downside}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="dual-analysis-grid">
            <section className="panel inner-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{isEnglish ? 'Affected Personas' : '受影响人群'}</p>
                  <h4>{isEnglish ? 'Who reacts first' : '最先被影响的是谁'}</h4>
                </div>
              </div>
              <div className="stack-list">
                {result.affectedPersonas.map((persona) => (
                  <article
                    key={`${persona.personaName}-${persona.primaryTrigger}`}
                    className="stack-card"
                  >
                    <div className="card-topline">
                      <span className="meta-chip">{persona.personaName}</span>
                      <span className="tiny-chip">{formatRiskLevel(persona.riskLevel, isEnglish)}</span>
                    </div>
                    <h4>{persona.likelyReaction}</h4>
                    <p>{persona.primaryTrigger}</p>
                  </article>
                ))}
              </div>
            </section>

            <GuardrailChecklist guardrails={result.guardrails} />
          </section>

          <section className="dual-analysis-grid">
            <section className="panel inner-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{isEnglish ? 'Validation Plan' : '验证计划'}</p>
                  <h4>{isEnglish ? 'Minimum next experiments' : '最小下一步实验'}</h4>
                </div>
              </div>
              <div className="stack-list">
                {result.validationPlan.map((step) => (
                  <article key={`${step.step}-${step.goal}`} className="stack-card">
                    <h4>{step.step}</h4>
                    <p>{step.goal}</p>
                    <ul className="bullet-list">
                      <li>
                        {isEnglish
                          ? `Success: ${step.successSignal}`
                          : `成功信号：${step.successSignal}`}
                      </li>
                      <li>
                        {isEnglish
                          ? `Failure: ${step.failureSignal}`
                          : `失败信号：${step.failureSignal}`}
                      </li>
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel inner-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{isEnglish ? 'Assumptions' : '假设与提醒'}</p>
                  <h4>{isEnglish ? 'Things that still need proving' : '还需要被证明的地方'}</h4>
                </div>
              </div>
              <ul className="bullet-list">
                {result.assumptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {result.warnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </section>
        </>
      ) : null}
    </section>
  );
}
