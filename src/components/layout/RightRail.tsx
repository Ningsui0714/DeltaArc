import type { SandboxAnalysisJob, SandboxAnalysisMeta, SandboxAnalysisResult } from '../../../shared/sandbox';
import { AgentCollaborationPanel } from '../analysis/AgentCollaborationPanel';
import { LiveOutputFeed } from '../analysis/LiveOutputFeed';
import { formatJobDuration, getJobProgressStats } from '../../lib/jobProgress';
import { analysisSourceLabels, analysisStatusLabels, evidenceLevelLabels } from '../../lib/sandboxLabels';
import type { StepId } from '../../types';

type RightRailProps = {
  activeStep: StepId;
  hasOfficialAnalysis: boolean;
  evidenceLevel: SandboxAnalysisResult['evidenceLevel'];
  lastAnalysisAt: string;
  meta: SandboxAnalysisMeta;
  playerAcceptance: number;
  primaryRisk: string;
  nextStep: string;
  model: string;
  pipeline: string[];
  progress: SandboxAnalysisJob | null;
  error: string | null;
  warnings: string[];
};

export function RightRail({
  activeStep,
  hasOfficialAnalysis,
  evidenceLevel,
  lastAnalysisAt,
  meta,
  playerAcceptance,
  primaryRisk,
  nextStep,
  model,
  pipeline,
  progress,
  error,
  warnings,
}: RightRailProps) {
  const progressStats = progress ? getJobProgressStats(progress) : null;

  return (
    <aside className="right-rail">
      <section className="intel-card">
        <p className="eyebrow">可信状态</p>
        <h3>{activeStep === 'report' ? '报告可信度' : '当前可信度'}</h3>
        <div className="chip-row">
          {hasOfficialAnalysis ? (
            <>
              <span className="meta-chip">{analysisSourceLabels[meta.source]}</span>
              <span className="meta-chip">{analysisStatusLabels[meta.status]}</span>
            </>
          ) : (
            <>
              <span className="panel-badge">还没有正式预测结果</span>
              <span className="meta-chip">尚未运行 LLM</span>
            </>
          )}
          {progress ? <span className="meta-chip">{progress.status}</span> : null}
          {progressStats ? <span className="meta-chip">{progressStats.percent}%</span> : null}
        </div>

        {hasOfficialAnalysis ? (
          <dl className="intel-list">
            <div>
              <dt>证据覆盖</dt>
              <dd>{evidenceLevelLabels[evidenceLevel]}</dd>
            </div>
            <div>
              <dt>接受度</dt>
              <dd>{playerAcceptance}%</dd>
            </div>
            <div>
              <dt>主风险</dt>
              <dd>{primaryRisk}</dd>
            </div>
            <div>
              <dt>下一步</dt>
              <dd>{nextStep}</dd>
            </div>
            <div>
              <dt>上次最新运行</dt>
              <dd>{lastAnalysisAt || '还没有完全最新的远端运行。'}</dd>
            </div>
            <div>
              <dt>模型摘要</dt>
              <dd>{model}</dd>
            </div>
          </dl>
        ) : (
          <div className="trust-note-block">
            <p>这里现在不会再展示“没调用 LLM 也自动生成”的结论。正式结果只会在远端分析完成后出现。</p>
            <p>在此之前，你看到的只会是输入状态、执行进度和运行中产出的阶段摘要，不会把本地预设文本伪装成预测结果。</p>
          </div>
        )}
      </section>

      <section className="intel-card compact">
        <p className="eyebrow">执行轨迹</p>
        <h3>{progress ? progress.currentStageLabel : hasOfficialAnalysis ? '最新链路' : '等待运行'}</h3>
        {progress ? <p className="progress-copy">{progress.message}</p> : null}
        {progress && progressStats ? (
          <div className="run-overview">
            <div className="run-overview-header">
              <strong className="run-overview-percent">{progressStats.percent}%</strong>
              <span>已运行 {formatJobDuration(progressStats.elapsedMs)}</span>
            </div>
            <div className="run-progress-track" aria-hidden="true">
              <div className="run-progress-fill" style={{ width: `${progressStats.percent}%` }} />
            </div>
            <div className="run-overview-grid">
              <div className="run-overview-metric">
                <span>已完成</span>
                <strong>
                  {progressStats.completedStageCount}/{progressStats.actionableStageCount}
                </strong>
              </div>
              <div className="run-overview-metric">
                <span>并行通道</span>
                <strong>{progressStats.runningStageCount}</strong>
              </div>
              <div className="run-overview-metric">
                <span>兜底阶段</span>
                <strong>{progressStats.fallbackStageCount}</strong>
              </div>
            </div>
            {progressStats.runningStages.length > 0 ? (
              <div className="stage-pill-row">
                {progressStats.runningStages.map((stage) => (
                  <span key={stage.key} className="stage-pill stage-pill-running">
                    {stage.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {progress ? <AgentCollaborationPanel job={progress} /> : null}
        {progress ? <LiveOutputFeed job={progress} /> : null}

        {progress ? (
          <div className="stage-list">
            {progress.stages.map((stage) => (
              <article key={stage.key} className={`stage-item stage-${stage.status}`}>
                <div className="stage-heading">
                  <strong>{stage.label}</strong>
                  <span>{stage.status}</span>
                </div>
                <p>{stage.detail}</p>
                {stage.model || stage.durationMs ? (
                  <small>
                    {[stage.model, stage.durationMs ? formatJobDuration(stage.durationMs) : ''].filter(Boolean).join(' 路 ')}
                  </small>
                ) : null}
              </article>
            ))}
          </div>
        ) : hasOfficialAnalysis ? (
          <div className="chip-row">
            {pipeline.map((step) => (
              <span key={step} className="meta-chip">
                {step}
              </span>
            ))}
          </div>
        ) : (
          <p className="progress-copy">
            还没有执行分析链路。运行快速扫描或深度推演后，这里会先显示真实执行轨迹，再逐段显示运行中产出的内容。
          </p>
        )}
        {error ? <p className="status-error">{error}</p> : null}
        {warnings.length > 0 ? (
          <ul className="bullet-list">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </section>
    </aside>
  );
}
