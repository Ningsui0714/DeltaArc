import type { SandboxAnalysisJob, SandboxAnalysisResult } from '../../shared/sandbox';
import { AnalysisQualityPanel } from '../components/analysis/AnalysisQualityPanel';
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
    return value || (language === 'en' ? 'No record yet' : '尚无记录');
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
    ? progress?.currentStageLabel ?? (isEnglish ? 'Inference Desk' : '推理台')
    : hasViewableAnalysis
      ? isAnalysisFresh
        ? trimCopy(
            analysis.report.headline || analysis.systemVerdict,
            isEnglish ? 'Fresh formal forecast is ready' : '最新正式结果已经就绪',
          )
        : isAnalysisDegraded
          ? isEnglish
            ? 'Partial formal result is preserved'
            : '已保留一份降级正式结果'
          : isAnalysisStale
            ? isEnglish
              ? 'Previous formal result is still viewable'
              : '上一份正式结果仍可继续查看'
            : isEnglish
              ? 'Formal output is available'
              : '正式结果可查看'
      : isEnglish
        ? 'Formal inference has not started yet'
        : '还没启动正式推理';
  const runSummary = isRunActive || hasRunError
    ? progress?.message ?? (isEnglish ? 'Inference desk is standing by.' : '推理台待命中。')
    : hasViewableAnalysis
      ? isAnalysisFresh
        ? trimCopy(
            analysis.summary,
            isEnglish
              ? 'The latest formal result is ready. Step 4 contains three parallel views, and Step 5 opens Variable Sandbox for continued testing.'
              : '最新正式结果已经准备好。第 4 步承载三个并列结果视图，第 5 步则打开变量推演继续测试。',
          )
        : isAnalysisDegraded
          ? isEnglish
            ? 'A later stage failed, but cached earlier outputs were preserved. Review them now and rerun when ready.'
            : '后续阶段曾失败，但已缓存的前置结果被保留下来了。你可以先查看，再在准备好后重跑。'
          : isAnalysisStale
            ? isEnglish
              ? 'Current inputs changed after the last formal run. The old outputs remain viewable, but rerunning is recommended.'
              : '当前输入在上次正式推理后发生了变化。旧输出仍可查看，但建议重新运行。'
            : isEnglish
              ? 'A formal output is available in Outputs.'
              : '输出区已有一份正式结果。'
      : isEnglish
        ? 'This desk is for running and observing inference. Once the 4/4 setup and 3 evidence gate are ready, start Quick Scan or Deep Dive here.'
        : '这里专门负责运行和观察正式推理过程。等 4/4 关键字段和 3 条证据达标后，再在这里启动快速扫描或深度推演。';
  const runStatusLabel = isRunActive
    ? isEnglish
      ? 'Inference running'
      : '推理进行中'
    : hasRunError
      ? progress?.retryable
        ? isEnglish
          ? 'Run failed, resume available'
          : '运行失败，可继续重试'
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
            <p className="eyebrow">{isEnglish ? 'Inference Desk' : '推理台'}</p>
            <h3>{runHeadline}</h3>
            <p className="hero-copy">{runSummary}</p>
          </div>
          <div className="chip-row">
            <span className="meta-chip">{isEnglish ? `Project fields ${setupFieldCount}/4` : `项目字段 ${setupFieldCount}/4`}</span>
            <span className="meta-chip">{isEnglish ? `Evidence ${evidenceItems.length}/3+` : `证据 ${evidenceItems.length}/3+`}</span>
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
              <h3>{isEnglish ? 'Run inference first, then review outputs' : '先跑推理，再看结果'}</h3>
            </div>
            <span className="panel-badge">
              {canRunAnalysis
                ? isEnglish
                  ? '4/4 setup and evidence gate are ready'
                  : '4/4 设定和证据门槛已达标'
                : isEnglish
                  ? 'Requires 4/4 setup + 3 evidence'
                  : '需要 4/4 设定 + 3 条证据'}
            </span>
          </div>

          <div className="analysis-readiness-grid">
            <article className={`analysis-readiness-card ${projectReady ? 'is-ready' : ''}`}>
              <span>{isEnglish ? 'Project Setup' : '项目设定'}</span>
              <strong>{setupFieldCount}/4</strong>
              <p>{isEnglish ? 'The one-line concept, core loop, target audience, and validation goal are the minimum launch line.' : '一句话想法、核心循环、目标玩家、验证目标是最小起跑线。'}</p>
            </article>
            <article className={`analysis-readiness-card ${evidenceReady ? 'is-ready' : ''}`}>
              <span>{isEnglish ? 'Evidence Signals' : '证据信号'}</span>
              <strong>{evidenceItems.length}/3+</strong>
              <p>{isEnglish ? 'With three or more evidence items, blind spots and validation moves become much more credible.' : '3 条以上证据时，盲点和验证动作会更可信。'}</p>
            </article>
            <article className={`analysis-readiness-card ${hasViewableAnalysis ? 'is-ready' : ''}`}>
              <span>{isEnglish ? 'Outputs Available' : '输出可见性'}</span>
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
              <p>{isEnglish ? 'Outputs can stay viewable even after inputs change, but freshness and viewability are tracked separately now.' : '结果现在允许在输入变化后继续查看，但“可查看”和“是否最新”已经拆成两个独立状态。'}</p>
            </article>
          </div>

          <div className="analysis-mode-list">
            <article className="analysis-mode-card">
              <p className="eyebrow">{isEnglish ? 'Quick Scan' : '快速扫描'}</p>
              <h4>{isEnglish ? 'Get the first structured read' : '先拿第一轮结构化判断'}</h4>
              <p>{isEnglish ? 'Use this first to confirm blind spots, primary risk, and the next validation move with the smallest run cost.' : '适合先用最小成本确认盲点、主要风险和下一步验证动作。'}</p>
              <p>{isEnglish ? 'The first-stage brief now goes through grounding, multiple candidates, and a verifier before the formal result is surfaced.' : '第一阶段简报现在会先经过依据对齐、多候选生成和校验器挑选，再把正式结果抛出来。'}</p>
              <button type="button" className="ghost-button" disabled={isLoading || !canRunAnalysis} onClick={onRunQuickForecast}>
                {isLoading && progress?.mode === 'balanced' ? (isEnglish ? 'Quick Scan running' : '快速扫描运行中') : isEnglish ? 'Run Quick Scan' : '开始快速扫描'}
              </button>
            </article>

            <article className="analysis-mode-card analysis-mode-card-featured">
              <p className="eyebrow">{isEnglish ? 'Deep Dive' : '深度推演'}</p>
              <h4>{isEnglish ? 'Run the full multi-stage reasoning chain' : '完整走完多阶段推理链'}</h4>
              <p>{isEnglish ? 'Use this once the inputs are fuller and you want future evolution plus the final report.' : '适合在输入更完整时生成未来演化和最终报告。'}</p>
              <p>{isEnglish ? 'Deep Dive now adds verifier-selected action briefs and a reverse check that can tighten overconfident conclusions before the report lands.' : '深度推演现在还会加入校验器选出的行动摘要，以及一轮会主动收紧过度自信结论的反向核验。'}</p>
              <button type="button" className="accent-button" disabled={isLoading || !canRunAnalysis} onClick={onRunDeepForecast}>
                {isLoading && progress?.mode === 'reasoning' ? (isEnglish ? 'Deep Dive running' : '深度推演运行中') : isEnglish ? 'Run Deep Dive' : '开始深度推演'}
              </button>
            </article>
          </div>
        </section>

        <section className="panel analysis-ops-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isEnglish ? 'Desk Status' : '推理台状态'}</p>
              <h3>{isEnglish ? 'Current desk status' : '当前推理台状态'}</h3>
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
              <span>{isEnglish ? 'Current State' : '当前状态'}</span>
              <strong>{progress ? progress.currentStageLabel : runStatusLabel}</strong>
              <p>{progress ? progress.message : hasViewableAnalysis ? runSummary : isEnglish ? 'Start by cleaning up the project setup and evidence inputs.' : '先从输入区整理项目和证据。'}</p>
            </article>
            <article className="analysis-ops-card">
              <span>{isEnglish ? 'This Run Duration' : '本次已运行'}</span>
              <strong>{progressStats ? formatJobDuration(progressStats.elapsedMs, language) : isEnglish ? 'Idle' : '空闲'}</strong>
              <p>{progressStats ? (isEnglish ? `${progressStats.completedStageCount}/${progressStats.actionableStageCount} stages completed.` : `已完成 ${progressStats.completedStageCount}/${progressStats.actionableStageCount} 个阶段。`) : isEnglish ? 'No backend run is currently active.' : '当前没有进行中的后端运行。'}</p>
            </article>
            <article className="analysis-ops-card">
              <span>{isEnglish ? 'Last Completed' : '上次完成于'}</span>
              <strong>{lastCompletedAt ? formatAbsoluteTime(lastCompletedAt, language) : isEnglish ? 'No record yet' : '尚无记录'}</strong>
              <p>{hasViewableAnalysis ? (requiresAnalysisRerun ? (isEnglish ? 'The visible outputs are not the latest truth anymore. A rerun is recommended.' : '当前可见输出已经不是最新真相源，建议重新运行。') : isEnglish ? 'This timestamp reflects the last completed formal run.' : '这个时间表示上一次正式推理完成的绝对时间。') : isEnglish ? 'A formal completion time will appear after the first successful run.' : '第一次正式推理完成后，这里会显示绝对完成时间。'}</p>
            </article>
          </div>

          <div className="analysis-ops-actions">
            <button type="button" className="inline-button" onClick={onBackToInputs}>
              {isEnglish ? 'Back to Inputs' : '回输入区继续整理'}
            </button>
            {canRetryFromFailure ? (
              <button type="button" className="ghost-button" onClick={onRetryFromFailure}>
                {isEnglish
                  ? `Resume from ${retryStageLabel ?? 'failed stage'}`
                  : `从${retryStageLabel ?? '失败阶段'}继续重试`}
              </button>
            ) : null}
            {hasViewableAnalysis ? (
              <>
                <button type="button" className="ghost-button" onClick={() => onOpenOutput('report')}>
                  {isEnglish ? 'Open Formal Results' : '进入正式结果'}
                </button>
                <button type="button" className="accent-button" onClick={() => onOpenOutput('sandbox')}>
                  {isEnglish ? 'Open Variable Sandbox' : '进入变量推演'}
                </button>
              </>
            ) : null}
          </div>
        </section>
      </section>

      {hasViewableAnalysis ? (
        <AnalysisQualityPanel
          meta={analysis.meta}
          mode={analysis.mode}
          variant="compact"
          showEmpty
        />
      ) : null}

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
