import type { SandboxAnalysisJob, SandboxAnalysisResult } from '../../shared/sandbox';
import { ForecastTimelinePanel } from '../components/analysis/ForecastTimelinePanel';
import { PredictionGraphPanel } from '../components/analysis/PredictionGraphPanel';
import { isEnglishUi, useUiLanguage } from '../hooks/useUiLanguage';
import { formatJobDuration, getJobProgressStats } from '../lib/jobProgress';
import type { OutputStep } from '../lib/processPhases';
import type { EvidenceItem, ProjectSnapshot, StepId } from '../types';

type AnalysisWorkbenchPageProps = {
  project: ProjectSnapshot;
  evidenceItems: EvidenceItem[];
  analysis: SandboxAnalysisResult;
  progress: SandboxAnalysisJob | null;
  hasOfficialAnalysis: boolean;
  lastAnalysisAt: string;
  error: string | null;
  warnings: string[];
  isLoading: boolean;
  focusStep: StepId;
  onRunQuickForecast: () => void;
  onRunDeepForecast: () => void;
  onBackToInputs: () => void;
  onOpenOutput: (step: OutputStep) => void;
};

function countSetupFields(project: ProjectSnapshot) {
  return [project.ideaSummary, project.coreLoop, project.targetPlayers.join(' '), project.validationGoal].filter(
    (item) => item.trim().length > 0,
  ).length;
}

function trimCopy(value: string, fallback: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

export function AnalysisWorkbenchPage({
  project,
  evidenceItems,
  analysis,
  progress,
  hasOfficialAnalysis,
  lastAnalysisAt,
  error,
  warnings,
  isLoading,
  focusStep,
  onRunQuickForecast,
  onRunDeepForecast,
  onBackToInputs,
  onOpenOutput,
}: AnalysisWorkbenchPageProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const progressStats = progress ? getJobProgressStats(progress) : null;
  const setupFieldCount = countSetupFields(project);
  const projectReady = setupFieldCount >= 3;
  const evidenceReady = evidenceItems.length >= 3;
  const canConfidentlyRun = projectReady && evidenceReady;
  const runHeadline = progress
    ? progress.currentStageLabel
    : hasOfficialAnalysis
      ? trimCopy(analysis.report.headline || analysis.systemVerdict, isEnglish ? 'Formal forecast is ready' : '正式预测已经完成')
      : isEnglish
        ? 'Formal inference has not started yet'
        : '还没启动正式推理';
  const runSummary = progress
    ? progress.message
    : hasOfficialAnalysis
      ? trimCopy(analysis.summary, isEnglish ? 'The latest formal result is available in Outputs.' : '最新正式结果已经挂到输出区。')
      : isEnglish
        ? 'This desk is for running and observing inference. Once inputs are ready, start Quick Scan or Deep Dive here.'
        : '这里专门负责运行和观察推理过程。输入准备好后，再在这里启动快速扫描或深度推演。';

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
            <span className="meta-chip">{isEnglish ? `Evidence ${evidenceItems.length}` : `证据 ${evidenceItems.length} 条`}</span>
            <span className={`trust-chip ${hasOfficialAnalysis ? 'trust-high' : progress ? 'trust-medium' : 'trust-low'}`}>
              {hasOfficialAnalysis ? (isEnglish ? 'Formal output ready' : '已有正式结果') : progress ? (isEnglish ? 'Inference running' : '推理进行中') : isEnglish ? 'Waiting to start' : '等待启动'}
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
            <span className="panel-badge">{canConfidentlyRun ? (isEnglish ? 'Inputs look solid' : '输入已成型') : isEnglish ? 'A first pass is still possible' : '仍可先跑一轮'}</span>
          </div>

          <div className="analysis-readiness-grid">
            <article className={`analysis-readiness-card ${projectReady ? 'is-ready' : ''}`}>
              <span>{isEnglish ? 'Project Setup' : '项目设定'}</span>
              <strong>{setupFieldCount}/4</strong>
              <p>{isEnglish ? 'The one-line concept, core loop, target audience, and validation goal are the minimum launch line.' : '一句话想法、核心循环、目标玩家、验证目标是最小起跑线。'}</p>
            </article>
            <article className={`analysis-readiness-card ${evidenceReady ? 'is-ready' : ''}`}>
              <span>{isEnglish ? 'Evidence Signals' : '证据信号'}</span>
              <strong>{evidenceItems.length}</strong>
              <p>{isEnglish ? 'With three or more evidence items, blind spots and validation moves become much more credible.' : '3 条以上证据时，盲点和验证动作会更可信。'}</p>
            </article>
            <article className={`analysis-readiness-card ${hasOfficialAnalysis ? 'is-ready' : ''}`}>
              <span>{isEnglish ? 'Outputs Unlocked' : '输出解锁'}</span>
              <strong>{hasOfficialAnalysis ? (isEnglish ? 'Complete' : '已完成') : isEnglish ? 'Not Yet' : '未完成'}</strong>
              <p>{isEnglish ? 'Move into Outputs after the run completes so inputs and conclusions stay on separate surfaces.' : '运行结束后再进入输出区，不让输入和结论混在一个页面里。'}</p>
            </article>
          </div>

          <div className="analysis-mode-list">
            <article className="analysis-mode-card">
              <p className="eyebrow">{isEnglish ? 'Quick Scan' : '快速扫描'}</p>
              <h4>{isEnglish ? 'Get the first structured read' : '先拿第一轮结构化判断'}</h4>
              <p>{isEnglish ? 'Use this first to confirm blind spots, primary risk, and the next validation move before opening Current Judgment.' : '适合先确认盲点、主要风险和下一步验证动作，跑完后直接进入“当前判断”。'}</p>
              <button type="button" className="ghost-button" disabled={isLoading} onClick={onRunQuickForecast}>
                {isLoading && progress?.mode === 'balanced' ? (isEnglish ? 'Quick Scan running' : '快速扫描运行中') : isEnglish ? 'Run Quick Scan' : '运行快速扫描'}
              </button>
            </article>

            <article className="analysis-mode-card analysis-mode-card-featured">
              <p className="eyebrow">{isEnglish ? 'Deep Dive' : '深度推演'}</p>
              <h4>{isEnglish ? 'Run the full multi-stage reasoning chain' : '完整走完多阶段推理链'}</h4>
              <p>{isEnglish ? 'Use this once the inputs are fuller and you want future evolution plus the final report.' : '适合在输入更完整时生成未来演化和最终报告，跑完后直接进入“预测报告”。'}</p>
              <button type="button" className="accent-button" disabled={isLoading} onClick={onRunDeepForecast}>
                {isLoading && progress?.mode === 'reasoning' ? (isEnglish ? 'Deep Dive running' : '深度推演运行中') : isEnglish ? 'Run Deep Dive' : '运行深度推演'}
              </button>
            </article>
          </div>
        </section>

        <section className="panel analysis-ops-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isEnglish ? 'Desk Status' : '桌面状态'}</p>
              <h3>{isEnglish ? 'Current desk status' : '当前桌面状态'}</h3>
            </div>
            <span className="panel-badge">{progressStats ? `${progressStats.percent}%` : hasOfficialAnalysis ? (isEnglish ? 'Complete' : '已完成') : isEnglish ? 'Idle' : '空闲'}</span>
          </div>

          <div className="analysis-ops-list">
            <article className="analysis-ops-card">
              <span>{isEnglish ? 'Current State' : '当前状态'}</span>
              <strong>{progress ? progress.currentStageLabel : hasOfficialAnalysis ? (isEnglish ? 'Outputs ready to review' : '结果待查看') : isEnglish ? 'Waiting to start' : '等待启动'}</strong>
              <p>{progress ? progress.message : hasOfficialAnalysis ? (isEnglish ? 'You can move directly into Outputs now.' : '可以直接切到输出区看结果。') : isEnglish ? 'Start by cleaning up the project setup and evidence inputs.' : '先从输入区整理项目和证据。'}</p>
            </article>
            <article className="analysis-ops-card">
              <span>{isEnglish ? 'Run Time' : '累计运行'}</span>
              <strong>{progressStats ? formatJobDuration(progressStats.elapsedMs, language) : lastAnalysisAt || (isEnglish ? 'No record yet' : '尚无记录')}</strong>
              <p>{progressStats ? (isEnglish ? `${progressStats.completedStageCount}/${progressStats.actionableStageCount} stages completed.` : `已完成 ${progressStats.completedStageCount}/${progressStats.actionableStageCount} 个阶段。`) : isEnglish ? 'No backend run is currently active.' : '还没有进行中的后端运行。'}</p>
            </article>
            <article className="analysis-ops-card">
              <span>{isEnglish ? 'Next Move' : '下一步'}</span>
              <strong>{hasOfficialAnalysis ? (isEnglish ? 'Go to Outputs' : '去输出区') : isEnglish ? 'Add inputs or start inference' : '补输入或启动推理'}</strong>
              <p>{hasOfficialAnalysis ? trimCopy(analysis.nextStep, isEnglish ? 'Review the current judgment first, then decide whether to open the report.' : '可以先看当前判断，再决定是否继续看报告。') : isEnglish ? 'If you only need the first direction, Quick Scan is enough.' : '如果你只是想先看方向，快速扫描就够了。'}</p>
            </article>
          </div>

          <div className="analysis-ops-actions">
            <button type="button" className="inline-button" onClick={onBackToInputs}>
              {isEnglish ? 'Back to Inputs' : '回输入区继续整理'}
            </button>
            {hasOfficialAnalysis ? (
              <>
                <button type="button" className="ghost-button" onClick={() => onOpenOutput('modeling')}>
                  {isEnglish ? 'Open Current Judgment' : '看当前判断'}
                </button>
                <button type="button" className="accent-button" onClick={() => onOpenOutput('report')}>
                  {isEnglish ? 'Open Forecast Report' : '去预测报告'}
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
          hasOfficialAnalysis={hasOfficialAnalysis}
        />

        <ForecastTimelinePanel
          project={project}
          evidenceItems={evidenceItems}
          analysis={analysis}
          progress={progress}
          hasOfficialAnalysis={hasOfficialAnalysis}
          lastAnalysisAt={lastAnalysisAt}
          error={error}
          warnings={warnings}
        />
      </section>
    </section>
  );
}
