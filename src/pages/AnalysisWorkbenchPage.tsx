import type { SandboxAnalysisJob, SandboxAnalysisResult } from '../../shared/sandbox';
import { ForecastTimelinePanel } from '../components/analysis/ForecastTimelinePanel';
import { PredictionGraphPanel } from '../components/analysis/PredictionGraphPanel';
import { isEnglishUi, useUiLanguage } from '../hooks/useUiLanguage';
import {
  formatJobDuration,
  getJobProgressStats,
  isAnalysisJobActive,
  isAnalysisJobFailed,
} from '../lib/jobProgress';
import { getProjectReadiness } from '../lib/projectReadiness';
import { trimCopy } from '../lib/trimCopy';
import type { OutputStep } from '../lib/processPhases';
import type { EvidenceItem, ProjectSnapshot, StepId } from '../types';

type AnalysisWorkbenchPageProps = {
  project: ProjectSnapshot;
  evidenceItems: EvidenceItem[];
  analysis: SandboxAnalysisResult;
  progress: SandboxAnalysisJob | null;
  hasViewableAnalysis: boolean;
  isAnalysisFresh: boolean;
  isAnalysisStale: boolean;
  isAnalysisDegraded: boolean;
  requiresAnalysisRerun: boolean;
  lastCompletedAt: string;
  error: string | null;
  warnings: string[];
  isLoading: boolean;
  focusStep: StepId;
  canRetryFromFailure: boolean;
  retryStageLabel: string | null;
  onRunQuickForecast: () => void;
  onRunDeepForecast: () => void;
  onRetryFromFailure: () => void;
  onBackToInputs: () => void;
  onOpenOutput: (step: OutputStep) => void;
};

function formatAbsoluteTime(value: string, language: 'zh' | 'en') {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return value || (language === 'en' ? 'No record yet' : '暂无记录');
  }

  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

export function AnalysisWorkbenchPage({
  project,
  evidenceItems,
  analysis,
  progress,
  hasViewableAnalysis,
  isAnalysisFresh,
  isAnalysisStale,
  isAnalysisDegraded,
  requiresAnalysisRerun,
  lastCompletedAt,
  error,
  warnings,
  isLoading,
  focusStep,
  canRetryFromFailure,
  retryStageLabel,
  onRunQuickForecast,
  onRunDeepForecast,
  onRetryFromFailure,
  onBackToInputs,
  onOpenOutput,
}: AnalysisWorkbenchPageProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const progressStats = progress ? getJobProgressStats(progress) : null;
  const isRunActive = isAnalysisJobActive(progress);
  const hasRunError = isAnalysisJobFailed(progress);
  const { setupFieldCount, projectReady, evidenceReady } = getProjectReadiness(project, evidenceItems.length);
  const canRunAnalysis = projectReady && evidenceReady;
  const runHeadline = isRunActive || hasRunError
    ? progress?.currentStageLabel ?? (isEnglish ? 'Diagnosis Desk' : '诊断台')
    : hasViewableAnalysis
      ? isAnalysisFresh
        ? trimCopy(
            analysis.report.headline || analysis.systemVerdict,
            isEnglish ? 'Latest strategy report is ready' : '最新策略报告已就绪',
          )
        : isAnalysisDegraded
          ? isEnglish
            ? 'Fallback-stabilized report is preserved'
            : '已保留一份经回退稳定的策略结果'
          : isAnalysisStale
            ? isEnglish
              ? 'Previous strategy result is still viewable'
              : '上一版策略结果仍可查看'
            : isEnglish
              ? 'Strategy output is available'
              : '策略输出可查看'
      : isEnglish
        ? 'Formal diagnosis has not started yet'
        : '尚未启动正式诊断';
  const runSummary = isRunActive || hasRunError
    ? progress?.message ?? (isEnglish ? 'Diagnosis desk is standing by.' : '诊断台待命中。')
    : hasViewableAnalysis
      ? isAnalysisFresh
        ? trimCopy(
            analysis.summary,
            isEnglish
              ? 'The latest strategy output is ready. Step 4 provides parallel views, and Step 5 opens Variable Experiments for continued testing.'
              : '最新策略结果已准备好。第 4 步提供并行视图，第 5 步可进入变量实验继续验证。',
          )
        : isAnalysisDegraded
          ? isEnglish
            ? 'This run completed with fallback/repair in some stages. Review now and rerun when ready.'
            : '本轮已完成，但部分阶段触发了回退或修复。可先查看结果，再择机重跑。'
          : isAnalysisStale
            ? isEnglish
              ? 'Inputs changed after the last run. Old outputs are viewable, but rerun is recommended.'
              : '当前输入在上次运行后已变化。旧结果仍可查看，但建议重跑。'
            : isEnglish
              ? 'A strategy output is available in Outputs.'
              : '输出区已有可查看的策略结果。'
      : isEnglish
        ? 'Run and observe KOC strategy diagnosis here. Once 4/4 setup fields and 3 evidence signals are ready, start Quick Diagnosis or Deep Simulation.'
        : '这里用于运行并观察 KOC 内容策略诊断。满足 4/4 设置字段和 3 条证据信号后，可启动快速诊断或深度推演。';
  const runStatusLabel = isRunActive
    ? isEnglish
      ? 'Strategy running'
      : '策略生成中'
    : hasRunError
      ? progress?.retryable
        ? isEnglish
          ? 'Run failed, resume available'
          : '运行失败，可续跑'
        : isEnglish
          ? 'Run failed'
          : '运行失败'
    : hasViewableAnalysis
      ? isAnalysisFresh
        ? isEnglish
          ? 'Fresh output ready'
          : '最新结果就绪'
        : isAnalysisDegraded
          ? isEnglish
            ? 'Degraded output'
            : '降级结果'
          : isEnglish
            ? 'Stale output'
            : '过期结果'
      : isEnglish
        ? 'Waiting to start'
        : '等待启动';

  return (
    <section className="page-grid analysis-workbench-page">
      <article className="hero-panel analysis-workbench-hero">
        <div className="analysis-workbench-topline">
          <div>
            <p className="eyebrow">{isEnglish ? 'Diagnosis Desk' : '诊断台'}</p>
            <h3>{runHeadline}</h3>
            <p className="hero-copy">{runSummary}</p>
          </div>
          <div className="chip-row">
            <span className="meta-chip">{isEnglish ? `Setup fields ${setupFieldCount}/4` : `设置字段 ${setupFieldCount}/4`}</span>
            <span className="meta-chip">{isEnglish ? `Evidence signals ${evidenceItems.length}/3+` : `证据信号 ${evidenceItems.length}/3+`}</span>
            <span className={`trust-chip ${hasViewableAnalysis ? (isAnalysisFresh ? 'trust-high' : 'trust-medium') : isRunActive ? 'trust-medium' : 'trust-low'}`}>
              {runStatusLabel}
            </span>
          </div>
        </div>
      </article>

      <section className="analysis-launch-grid">
        <section className="panel analysis-launch-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isEnglish ? 'Run Modes' : '运行模式'}</p>
              <h3>{isEnglish ? 'Run diagnosis first, then review outputs' : '先跑诊断，再看输出'}</h3>
            </div>
            <span className="panel-badge">
              {canRunAnalysis
                ? isEnglish
                  ? '4/4 setup and evidence gate are ready'
                  : '4/4 设置与证据门槛已达标'
                : isEnglish
                  ? 'Requires 4/4 setup + 3 evidence'
                  : '需要 4/4 设置 + 3 条证据'}
            </span>
          </div>

          <div className="analysis-readiness-grid">
            <article className={`analysis-readiness-card ${projectReady ? 'is-ready' : ''}`}>
              <span>{isEnglish ? 'Task Setup' : '传播任务设置'}</span>
              <strong>{setupFieldCount}/4</strong>
              <p>{isEnglish ? 'Campaign goal, growth loop, target audience, and validation goal are the minimum launch line.' : '一句话传播目标、内容增长回路、目标受众、验证目标是最小起跑线。'}</p>
            </article>
            <article className={`analysis-readiness-card ${evidenceReady ? 'is-ready' : ''}`}>
              <span>{isEnglish ? 'Evidence Signals' : '证据信号'}</span>
              <strong>{evidenceItems.length}/3+</strong>
              <p>{isEnglish ? 'With 3+ evidence signals, blind spots and validation actions become more reliable.' : '达到 3 条以上证据信号后，盲点判断和验证动作会更可信。'}</p>
            </article>
            <article className={`analysis-readiness-card ${hasViewableAnalysis ? 'is-ready' : ''}`}>
              <span>{isEnglish ? 'Outputs Available' : '输出可见状态'}</span>
              <strong>
                {hasViewableAnalysis
                  ? isAnalysisFresh
                    ? isEnglish
                      ? 'Fresh'
                      : '最新'
                    : isAnalysisDegraded
                      ? isEnglish
                        ? 'Degraded'
                        : '降级'
                      : isEnglish
                        ? 'Stale'
                        : '过期'
                  : isEnglish
                    ? 'Locked'
                    : '未解锁'}
              </strong>
              <p>{isEnglish ? 'Outputs remain viewable after input changes, while freshness is tracked independently.' : '输入变化后结果仍可查看，但“可查看”和“是否最新”会分开追踪。'}</p>
            </article>
          </div>

          <div className="analysis-mode-list">
            <article className="analysis-mode-card">
              <p className="eyebrow">{isEnglish ? 'Quick Diagnosis' : '快速诊断'}</p>
              <h4>{isEnglish ? 'Get the first structured diagnosis' : '先拿第一版结构化诊断'}</h4>
              <p>{isEnglish ? 'Use this to quickly identify blind spots, primary risk, and the next validation action with minimal cost.' : '适合先用最小成本确认盲点、主风险和下一步验证动作。'}</p>
              <p>{isEnglish ? 'The first brief is grounded, compared across candidates, and verified before output.' : '首轮摘要会先做证据对齐、多候选比较和校验，再对外输出。'}</p>
              <button type="button" className="ghost-button" disabled={isLoading || !canRunAnalysis} onClick={onRunQuickForecast}>
                {isLoading && progress?.mode === 'balanced' ? (isEnglish ? 'Quick Diagnosis running' : '快速诊断运行中') : isEnglish ? 'Run Quick Diagnosis' : '启动快速诊断'}
              </button>
            </article>

            <article className="analysis-mode-card analysis-mode-card-featured">
              <p className="eyebrow">{isEnglish ? 'Deep Simulation' : '深度推演'}</p>
              <h4>{isEnglish ? 'Run the full multi-stage strategy chain' : '完整执行多阶段策略链路'}</h4>
              <p>{isEnglish ? 'Use this when inputs are richer and you need diffusion evolution plus final strategy report.' : '适合在输入更完整时生成扩散演化与最终策略报告。'}</p>
              <p>{isEnglish ? 'Deep mode adds verifier-selected action briefs and reverse checks to reduce overconfident conclusions.' : '深度模式会加入校验器选出的行动摘要与反向检查，收敛过度自信结论。'}</p>
              <button type="button" className="accent-button" disabled={isLoading || !canRunAnalysis} onClick={onRunDeepForecast}>
                {isLoading && progress?.mode === 'reasoning' ? (isEnglish ? 'Deep Simulation running' : '深度推演运行中') : isEnglish ? 'Run Deep Simulation' : '启动深度推演'}
              </button>
            </article>
          </div>
        </section>

        <section className="panel analysis-ops-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isEnglish ? 'Desk Status' : '诊断台状态'}</p>
              <h3>{isEnglish ? 'Current diagnosis desk status' : '当前诊断台状态'}</h3>
            </div>
            <span className="panel-badge">
              {progressStats
                ? `${progressStats.percent}%`
                : hasRunError
                  ? isEnglish
                    ? 'Failed'
                    : '失败'
                : hasViewableAnalysis
                  ? isAnalysisFresh
                    ? isEnglish
                      ? 'Fresh'
                      : '最新'
                    : isAnalysisDegraded
                      ? isEnglish
                        ? 'Degraded'
                        : '降级'
                      : isEnglish
                        ? 'Stale'
                        : '过期'
                  : isEnglish
                    ? 'Idle'
                    : '空闲'}
            </span>
          </div>

          <div className="analysis-ops-list">
            <article className="analysis-ops-card">
              <span>{isEnglish ? 'Current Diagnosis' : '当前诊断'}</span>
              <strong>{progress ? progress.currentStageLabel : runStatusLabel}</strong>
              <p>{progress ? progress.message : hasViewableAnalysis ? runSummary : isEnglish ? 'Start by refining task setup and evidence signals.' : '先从传播任务设置和证据信号整理开始。'}</p>
            </article>
            <article className="analysis-ops-card">
              <span>{isEnglish ? 'This Run Duration' : '本次运行时长'}</span>
              <strong>{progressStats ? formatJobDuration(progressStats.elapsedMs, language) : isEnglish ? 'Idle' : '空闲'}</strong>
              <p>{progressStats ? (isEnglish ? `${progressStats.completedStageCount}/${progressStats.actionableStageCount} stages completed.` : `已完成 ${progressStats.completedStageCount}/${progressStats.actionableStageCount} 个阶段。`) : isEnglish ? 'No backend run is currently active.' : '当前没有进行中的后端任务。'}</p>
            </article>
            <article className="analysis-ops-card">
              <span>{isEnglish ? 'Last Completed' : '上次完成时间'}</span>
              <strong>{lastCompletedAt ? formatAbsoluteTime(lastCompletedAt, language) : isEnglish ? 'No record yet' : '暂无记录'}</strong>
              <p>{hasViewableAnalysis ? (requiresAnalysisRerun ? (isEnglish ? 'Visible outputs are no longer latest truth source. Rerun is recommended.' : '当前可见输出已不是最新真相源，建议重跑。') : isEnglish ? 'This timestamp reflects the last completed strategy run.' : '该时间表示上一次策略运行完成时刻。') : isEnglish ? 'Completion time appears after the first successful run.' : '首次成功运行后，这里会显示完成时间。'}</p>
            </article>
          </div>

          <div className="analysis-ops-actions">
            <button type="button" className="inline-button" onClick={onBackToInputs}>
              {isEnglish ? 'Back to Inputs' : '回到输入区继续整理'}
            </button>
            {canRetryFromFailure ? (
              <button type="button" className="ghost-button" onClick={onRetryFromFailure}>
                {isEnglish
                  ? `Resume from ${retryStageLabel ?? 'failed stage'}`
                  : `从 ${retryStageLabel ?? '失败阶段'} 继续重试`}
              </button>
            ) : null}
            {hasViewableAnalysis ? (
              <>
                <button type="button" className="ghost-button" onClick={() => onOpenOutput('report')}>
                  {isEnglish ? 'Open Strategy Report' : '进入策略报告'}
                </button>
                <button type="button" className="accent-button" onClick={() => onOpenOutput('sandbox')}>
                  {isEnglish ? 'Open Variable Lab' : '进入变量实验'}
                </button>
              </>
            ) : null}
          </div>
        </section>
      </section>

      <section className="analysis-workbench-grid">
        <PredictionGraphPanel
          activeStep={focusStep}
          project={project}
          evidenceItems={evidenceItems}
          analysis={analysis}
          progress={progress}
          hasViewableAnalysis={hasViewableAnalysis}
          isAnalysisFresh={isAnalysisFresh}
          isAnalysisStale={isAnalysisStale}
          isAnalysisDegraded={isAnalysisDegraded}
        />

        <ForecastTimelinePanel
          project={project}
          evidenceItems={evidenceItems}
          analysis={analysis}
          progress={progress}
          hasViewableAnalysis={hasViewableAnalysis}
          isAnalysisFresh={isAnalysisFresh}
          isAnalysisStale={isAnalysisStale}
          isAnalysisDegraded={isAnalysisDegraded}
          lastCompletedAt={lastCompletedAt}
          error={error}
          warnings={warnings}
        />
      </section>
    </section>
  );
}
