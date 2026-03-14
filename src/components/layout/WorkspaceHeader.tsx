import type { SandboxAnalysisJob, SandboxAnalysisMode, SandboxAnalysisResult } from '../../../shared/sandbox';
import { getAnalysisModeLabel } from '../../lib/analysisModeLabels';
import { isEnglishUi, useUiLanguage, type UiLanguage } from '../../hooks/useUiLanguage';
import {
  formatJobDuration,
  getJobProgressStats,
  isAnalysisJobActive,
  isAnalysisJobFailed,
} from '../../lib/jobProgress';
import { getProjectReadiness } from '../../lib/projectReadiness';
import { trimCopy } from '../../lib/trimCopy';
import { inputSteps, type InputStep, type OutputStep, type ProcessPhase } from '../../lib/processPhases';
import { getWorkflowStep } from '../../lib/workflowSteps';
import type { ProjectSnapshot } from '../../types';
import { PhaseTabs } from '../ui/PhaseTabs';
import { UiLanguageToggle } from './UiLanguageToggle';

type WorkspaceHeaderProps = {
  activePhase: ProcessPhase;
  inputStep: InputStep;
  outputStep: OutputStep;
  project: ProjectSnapshot;
  evidenceCount: number;
  analysis: SandboxAnalysisResult;
  hasViewableAnalysis: boolean;
  isAnalysisFresh: boolean;
  isAnalysisStale: boolean;
  isAnalysisDegraded: boolean;
  canRunAnalysis: boolean;
  isLoading: boolean;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  progress: SandboxAnalysisJob | null;
  lastRequestedMode: SandboxAnalysisMode | null;
  visibleAnalysisMode: SandboxAnalysisMode | null;
  isShowingFallbackAnalysis: boolean;
  baselineCount: number;
  onSelectPhase: (phase: ProcessPhase) => void;
  onSelectInputStep: (step: InputStep) => void;
  onSelectOutputStep: (step: OutputStep) => void;
};

function getOutputStateLabel(
  hasViewableAnalysis: boolean,
  isAnalysisFresh: boolean,
  isAnalysisDegraded: boolean,
  language: UiLanguage,
) {
  const isEnglish = isEnglishUi(language);

  if (!hasViewableAnalysis) {
    return isEnglish ? 'Locked' : '未生成';
  }

  if (isAnalysisFresh) {
    return isEnglish ? 'Fresh' : '最新';
  }

  return isAnalysisDegraded ? (isEnglish ? 'Degraded' : '降级') : isEnglish ? 'Stale' : '过期';
}

function getPhaseStatusLabel(
  phase: ProcessPhase,
  hasViewableAnalysis: boolean,
  isAnalysisFresh: boolean,
  isAnalysisStale: boolean,
  isAnalysisDegraded: boolean,
  canRunAnalysis: boolean,
  progress: SandboxAnalysisJob | null,
  evidenceCount: number,
  language: UiLanguage,
) {
  const isEnglish = isEnglishUi(language);
  const isRunActive = isAnalysisJobActive(progress);
  const hasRunError = isAnalysisJobFailed(progress);

  if (phase === 'intake') {
    if (hasViewableAnalysis && isAnalysisFresh) {
      return isEnglish ? 'Inputs plus fresh outputs' : '输入中且有最新结果';
    }

    if (evidenceCount > 0) {
      return isEnglish ? 'Collecting inputs' : '输入进行中';
    }

    return isEnglish ? 'Needs inputs' : '待补输入';
  }

  if (phase === 'analysis') {
    if (isRunActive) {
      return isEnglish ? 'Inference running' : '推理运行中';
    }

    if (hasRunError) {
      return progress?.retryable
        ? isEnglish
          ? 'Run failed, resume available'
          : '运行失败，可继续重试'
        : isEnglish
          ? 'Run failed'
          : '运行失败';
    }

    if (!canRunAnalysis) {
      return isEnglish ? 'Waiting for minimum gate' : '等待最小门槛';
    }

    if (!hasViewableAnalysis) {
      return isEnglish ? 'Ready to start' : '待启动';
    }

    return isAnalysisFresh
      ? isEnglish
        ? 'Ready to rerun'
        : '可重新运行'
      : isAnalysisDegraded
        ? isEnglish
          ? 'Rerun recommended'
          : '建议重跑'
        : isAnalysisStale
          ? isEnglish
            ? 'Stale, rerun recommended'
            : '结果过期，建议重跑'
          : isEnglish
            ? 'Viewable output available'
            : '已有可查看结果';
  }

  if (!hasViewableAnalysis) {
    return isEnglish ? 'Waiting on inference' : '等待推理完成';
  }

  return isAnalysisFresh
    ? isEnglish
      ? 'Outputs ready'
      : '结果已解锁'
    : isAnalysisDegraded
      ? isEnglish
        ? 'Partial outputs ready'
        : '部分结果可查看'
      : isAnalysisStale
        ? isEnglish
          ? 'Stale outputs ready'
          : '旧结果仍可查看'
        : isEnglish
          ? 'Outputs ready'
          : '结果可查看';
}

function getPhaseMetric(
  phase: ProcessPhase,
  hasViewableAnalysis: boolean,
  isAnalysisFresh: boolean,
  isAnalysisStale: boolean,
  isAnalysisDegraded: boolean,
  canRunAnalysis: boolean,
  progress: SandboxAnalysisJob | null,
  evidenceCount: number,
  analysis: SandboxAnalysisResult,
  language: UiLanguage,
) {
  const progressStats = progress ? getJobProgressStats(progress) : null;
  const isEnglish = isEnglishUi(language);
  const isRunActive = isAnalysisJobActive(progress);
  const hasRunError = isAnalysisJobFailed(progress);

  if (phase === 'intake') {
    return isEnglish ? `${evidenceCount} items` : `${evidenceCount} 条信号`;
  }

  if (phase === 'analysis') {
    if (isRunActive && progressStats) {
      return `${progressStats.percent}%`;
    }

    if (hasRunError) {
      return progress?.retryable
        ? isEnglish
          ? 'Resume'
          : '可续跑'
        : isEnglish
          ? 'Failed'
          : '失败';
    }

    if (!canRunAnalysis) {
      return isEnglish ? '4/4 + 3 needed' : '需要 4/4 + 3';
    }

    if (!hasViewableAnalysis) {
      return isEnglish ? 'Unlocked' : '已解锁';
    }

    return isAnalysisFresh
      ? isEnglish
        ? 'Fresh'
        : '最新'
      : isAnalysisDegraded
        ? isEnglish
          ? 'Degraded'
          : '降级'
        : isAnalysisStale
          ? isEnglish
            ? 'Stale'
            : '过期'
          : isEnglish
            ? 'Viewable'
            : '可查看';
  }

  return hasViewableAnalysis
    ? isEnglish
      ? `${analysis.futureTimeline.length} beats`
      : `${analysis.futureTimeline.length} 个节点`
    : isEnglish
      ? 'Locked'
      : '未解锁';
}

export function WorkspaceHeader({
  activePhase,
  inputStep,
  outputStep,
  project,
  evidenceCount,
  analysis,
  hasViewableAnalysis,
  isAnalysisFresh,
  isAnalysisStale,
  isAnalysisDegraded,
  canRunAnalysis,
  isLoading,
  status,
  error,
  progress,
  lastRequestedMode,
  visibleAnalysisMode,
  isShowingFallbackAnalysis,
  baselineCount,
  onSelectPhase,
  onSelectInputStep,
  onSelectOutputStep,
}: WorkspaceHeaderProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const progressStats = progress ? getJobProgressStats(progress) : null;
  const isRunActive = isAnalysisJobActive(progress);
  const hasRunError = isAnalysisJobFailed(progress);
  const readiness = getProjectReadiness(project, evidenceCount);
  const projectTitle = trimCopy(project.name, isEnglish ? 'Untitled Forecast Task' : '未命名预测任务');
  const visibleModeLabel =
    hasViewableAnalysis && visibleAnalysisMode
      ? getAnalysisModeLabel(visibleAnalysisMode, language)
      : isEnglish
        ? 'Locked'
        : '未解锁';
  const requestedModeLabel = lastRequestedMode ? getAnalysisModeLabel(lastRequestedMode, language) : null;
  const isShowingDifferentModeFallback =
    Boolean(requestedModeLabel) &&
    hasViewableAnalysis &&
    isShowingFallbackAnalysis &&
    lastRequestedMode !== visibleAnalysisMode;
  const activeStep = activePhase === 'output' ? outputStep : inputStep;
  const currentStep = getWorkflowStep(activeStep, language);
  const activeJourneyStep: 'overview' | 'evidence' | 'analysis' | 'results' | 'sandbox' =
    activePhase === 'analysis'
      ? 'analysis'
      : activePhase === 'output'
        ? outputStep === 'sandbox'
          ? 'sandbox'
          : 'results'
        : inputStep;
  const currentGoalTitle =
    activePhase === 'analysis'
      ? isEnglish
        ? 'Step 3 · Formal Inference'
        : '第 3 步 · 正式推演'
      : activePhase === 'output'
        ? outputStep === 'sandbox'
          ? isEnglish
            ? 'Step 5 · Variable Sandbox'
            : '第 5 步 · 变量推演'
          : isEnglish
            ? 'Step 4 · Formal Results'
            : '第 4 步 · 正式结果'
        : inputStep === 'overview'
          ? isEnglish
            ? 'Step 1 · Project Setup'
            : '第 1 步 · 项目设定'
          : isEnglish
            ? 'Step 2 · Evidence Signals'
            : '第 2 步 · 证据信号';
  const journeySteps = [
    {
      id: 'overview' as const,
      label: isEnglish ? 'Project Setup' : '项目设定',
      brief: isEnglish ? 'Define the problem and baseline context.' : '先把这次要判断的问题写清楚。',
      status:
        readiness.setupFieldCount >= 4
          ? isEnglish
            ? 'Core setup is ready'
            : '核心设定已达标'
          : isEnglish
            ? 'Fill the 4 required fields'
            : '补齐 4 个关键字段',
      metric: `${readiness.setupFieldCount}/4`,
      locked: false,
      onSelect: () => onSelectInputStep('overview'),
    },
    {
      id: 'evidence' as const,
      label: isEnglish ? 'Evidence Signals' : '证据信号',
      brief: isEnglish ? 'Load enough signals before formal inference.' : '先补到足够支撑正式推演的证据量。',
      status:
        evidenceCount >= 3
          ? isEnglish
            ? 'Evidence gate is ready'
            : '证据门槛已达标'
          : isEnglish
            ? 'Keep adding evidence'
            : '继续补证据',
      metric: `${evidenceCount}/3+`,
      locked: false,
      onSelect: () => onSelectInputStep('evidence'),
    },
    {
      id: 'analysis' as const,
      label: isEnglish ? 'Formal Inference' : '正式推演',
      brief: isEnglish ? 'Run the formal chain and watch it complete.' : '运行正式推理链，并清楚看到它进行到哪一步。',
      status: getPhaseStatusLabel(
        'analysis',
        hasViewableAnalysis,
        isAnalysisFresh,
        isAnalysisStale,
        isAnalysisDegraded,
        canRunAnalysis,
        progress,
        evidenceCount,
        language,
      ),
      metric: getPhaseMetric(
        'analysis',
        hasViewableAnalysis,
        isAnalysisFresh,
        isAnalysisStale,
        isAnalysisDegraded,
        canRunAnalysis,
        progress,
        evidenceCount,
        analysis,
        language,
      ),
      locked: false,
      onSelect: () => onSelectPhase('analysis'),
    },
    {
      id: 'results' as const,
      label: isEnglish ? 'Formal Results' : '正式结果',
      brief: isEnglish
        ? 'Current Judgment, Future Evolution, and Forecast Report live here side by side.'
        : '当前判断、未来演化、预测报告都在这里并列查看。',
      status: !hasViewableAnalysis
        ? isEnglish
          ? 'Waiting for formal result'
          : '等待正式结果'
        : isAnalysisDegraded
          ? isEnglish
            ? 'Partial results are available'
            : '已有降级结果'
          : isAnalysisStale
            ? isEnglish
              ? 'Older results are still viewable'
              : '旧结果仍可查看'
            : activePhase === 'output' && outputStep !== 'sandbox'
              ? isEnglish
                ? `Current view: ${currentStep.label}`
                : `当前视图：${currentStep.label}`
              : isEnglish
                ? 'Three result views are ready'
                : '三个结果视图已就绪',
      metric: !hasViewableAnalysis
        ? isEnglish
          ? 'Locked'
          : '未解锁'
        : outputStep === 'sandbox'
          ? isEnglish
            ? '3 views'
            : '3 个视图'
          : currentStep.label,
      locked: !hasViewableAnalysis,
      onSelect: () => onSelectOutputStep('report'),
    },
    {
      id: 'sandbox' as const,
      label: isEnglish ? 'Variable Sandbox' : '变量推演',
      brief: isEnglish
        ? 'Freeze a baseline from the formal result, then test one new variable.'
        : '从正式结果冻结基线，再继续测试一个新变量。',
      status: !hasViewableAnalysis
        ? isEnglish
          ? 'Waiting for formal result'
          : '等待正式结果'
        : baselineCount > 0
          ? outputStep === 'sandbox'
            ? isEnglish
              ? 'Core sandbox flow is open'
              : '核心推演流程已打开'
            : isEnglish
              ? 'Baseline is ready for new tests'
              : '基线已就绪，可继续试变量'
          : isEnglish
            ? 'Freeze the first baseline'
            : '先冻结第一份基线',
      metric: !hasViewableAnalysis
        ? isEnglish
          ? 'Locked'
          : '未解锁'
        : baselineCount > 0
          ? isEnglish
            ? `${baselineCount} baseline${baselineCount > 1 ? 's' : ''}`
            : `${baselineCount} 份基线`
          : isEnglish
            ? 'No baseline'
            : '暂无基线',
      locked: !hasViewableAnalysis,
      onSelect: () => onSelectOutputStep('sandbox'),
    },
  ];

  const headline =
    activePhase === 'analysis'
      ? isRunActive || hasRunError
        ? progress?.message ?? (isEnglish ? 'Formal inference is running.' : '正式推演进行中。')
        : hasViewableAnalysis
          ? isAnalysisFresh
            ? trimCopy(
                analysis.report.headline || analysis.systemVerdict,
                isEnglish ? 'Formal inference is ready.' : '正式推演已完成。',
              )
            : isAnalysisDegraded
              ? isEnglish
                ? 'Partial formal output is preserved'
                : '已保留一份降级正式结果'
              : isEnglish
                ? 'Previous formal output is still viewable'
                : '上一份正式结果仍可继续查看'
          : isEnglish
            ? 'Formal inference has not started yet.'
            : '正式推演还没开始。'
      : activePhase === 'output'
        ? hasViewableAnalysis
          ? outputStep === 'sandbox'
            ? isEnglish
              ? 'Use the formal result as the launch point for a new variable test.'
              : '用正式结果作为起点，继续试一个新变量。'
            : trimCopy(analysis.report.headline || analysis.systemVerdict, currentStep.brief)
          : currentStep.brief
        : trimCopy(project.ideaSummary, currentStep.brief);

  const statusLine =
    activePhase === 'analysis'
      ? isRunActive && progressStats
        ? isEnglish
          ? `${progressStats.completedStageCount}/${progressStats.actionableStageCount} stages finished in ${formatJobDuration(progressStats.elapsedMs, language)}.`
          : `已完成 ${progressStats.completedStageCount}/${progressStats.actionableStageCount} 个阶段，累计运行 ${formatJobDuration(progressStats.elapsedMs, language)}`
        : isShowingFallbackAnalysis && hasViewableAnalysis && requestedModeLabel
          ? isShowingDifferentModeFallback
            ? isEnglish
              ? `The latest ${requestedModeLabel} failed. You are still looking at the previous ${visibleModeLabel} result.`
              : `最近一次${requestedModeLabel}失败了。你现在看到的仍是上一份${visibleModeLabel}结果。`
            : isEnglish
              ? `The latest ${requestedModeLabel} failed. You are still looking at the last viewable ${visibleModeLabel} result.`
              : `最近一次${requestedModeLabel}失败了。你现在看到的仍是上一份可查看的${visibleModeLabel}结果。`
        : hasRunError
          ? progress?.retryable
            ? isEnglish
              ? 'The latest run failed after caching earlier stages. Resume from the failed stage or start a fresh run if the inputs changed.'
              : '最近一次运行在缓存前置阶段后失败了。输入没变时可以从失败阶段继续；如果输入已变化，直接发起一轮新运行更稳妥。'
            : isEnglish
              ? 'The latest run failed before producing a resumable checkpoint. Adjust the inputs if needed, then start a new run.'
              : '最近一次运行失败，且没有留下可续跑的 checkpoint。必要时先调整输入，再重新发起一轮运行。'
          : hasViewableAnalysis
            ? isEnglish
              ? 'Formal inference is complete. Step 4 now holds the formal result views, and Step 5 is ready for variable testing.'
              : '正式推演已经跑完。第 4 步里是正式结果视图，第 5 步则用于继续做变量推演。'
            : canRunAnalysis
              ? isEnglish
                ? 'The minimum gate is ready. Start Quick Scan or Deep Dive from the desk.'
                : '最小门槛已经达标，现在可以从推理台启动快速扫描或深度推演。'
              : isEnglish
                ? 'Finish the 4/4 setup and 3 evidence gate first, then come back to run inference.'
                : '先补齐 4/4 关键字段和 3 条证据，再回来运行推理。'
      : activePhase === 'intake'
        ? hasViewableAnalysis
          ? isEnglish
            ? 'A formal result already exists, but Steps 1 and 2 still stay focused on project setup and evidence.'
            : '虽然已经有正式结果，但第 1、2 步仍只专注项目设定和证据整理。'
          : isEnglish
            ? 'The graph, timeline, and inputs no longer share one long page. Move forward stage by stage.'
            : '现在不再把图谱、时间线和输入混在一个大页面里，而是按流程往前推进。'
        : isShowingFallbackAnalysis && hasViewableAnalysis && requestedModeLabel
          ? isShowingDifferentModeFallback
            ? isEnglish
              ? `The latest ${requestedModeLabel} did not replace the current output. Step 4 is still showing the previous ${visibleModeLabel} result.`
              : `最近一次${requestedModeLabel}没有替换掉当前结果。第 4 步里仍然显示的是上一份${visibleModeLabel}结果。`
            : isEnglish
              ? `The latest ${requestedModeLabel} failed. Step 4 is still showing the last viewable ${visibleModeLabel} result.`
              : `最近一次${requestedModeLabel}失败了。第 4 步里仍然显示的是上一份可查看的${visibleModeLabel}结果。`
        : hasViewableAnalysis
          ? outputStep === 'sandbox'
            ? isAnalysisFresh
              ? isEnglish
                ? 'You are inside Step 5. Variable Sandbox is a first-class workflow built on top of the formal result.'
                : '你现在在第 5 步。变量推演是建立在正式结果之上的一条独立主流程。'
              : isAnalysisDegraded
                ? isEnglish
                  ? 'You are inside Step 5, but the connected formal result is partial. Rerun before trusting the sandbox as a final decision surface.'
                  : '你现在在第 5 步，但当前依赖的正式结果是不完整的。先重跑，再把变量推演当成最终决策面。'
                : isEnglish
                  ? 'You are inside Step 5, but the connected formal result is stale. The sandbox is still readable, though rerunning is recommended.'
                  : '你现在在第 5 步，但当前依赖的正式结果已经过期。变量推演仍可查看，不过建议先重跑。'
            : isAnalysisFresh
              ? isEnglish
                ? `You are inside Step 4. Current view: ${currentStep.label}. Current Judgment, Future Evolution, and Forecast Report are parallel result views produced by the formal run.`
                : `你现在在第 4 步。当前视图：${currentStep.label}。当前判断、未来演化、预测报告都是正式推演产出的并列结果视图。`
              : isAnalysisDegraded
                ? isEnglish
                  ? `You are inside Step 4 with a partial preserved output. Current view: ${currentStep.label}. These result views are still parallel, but rerun before treating them as final.`
                  : `你现在在第 4 步，但当前只有一份保留下来的降级结果。当前视图：${currentStep.label}。这些结果视图仍然是并列的，但在当成最终结论前请先重跑。`
                : isEnglish
                  ? `You are inside Step 4 with a stale output. Current view: ${currentStep.label}. The result views remain parallel, but rerunning is recommended.`
                  : `你现在在第 4 步，当前看到的是旧结果。当前视图：${currentStep.label}。这些结果视图仍然并列可看，但建议重跑。`
          : isEnglish
            ? `Run formal inference first. Step ${outputStep === 'sandbox' ? '5' : '4'} unlocks only after a formal result exists.`
            : `先完成正式推演。只有正式结果出现后，第 ${outputStep === 'sandbox' ? '5' : '4'} 步才会解锁。`;

  return (
    <header className="workspace-header">
      <div className="workspace-command-deck process-command-deck">
        <div className="workspace-brand">
          <div className="workspace-brand-mark">{isEnglish ? 'DA' : '观'}</div>
          <div className="workspace-brand-copy">
            <p className="eyebrow">{isEnglish ? 'DeltaArc' : '观变'}</p>
            <h1>{projectTitle}</h1>
            <p>{headline}</p>
          </div>
        </div>

        <div className="workspace-command-summary">
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Current Step' : '当前步骤'}</span>
            <strong>{currentGoalTitle}</strong>
          </article>
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Evidence' : '证据信号'}</span>
            <strong>{evidenceCount}</strong>
          </article>
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Formal Output' : '正式结果'}</span>
            <strong>{getOutputStateLabel(hasViewableAnalysis, isAnalysisFresh, isAnalysisDegraded, language)}</strong>
          </article>
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Visible Mode' : '当前结果模式'}</span>
            <strong>{visibleModeLabel}</strong>
          </article>
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Run State' : '运行状态'}</span>
            <strong>
              {isRunActive && progressStats
                ? `${progressStats.percent}%`
                : hasRunError
                  ? progress?.retryable
                    ? isEnglish
                      ? 'Resume'
                      : '可续跑'
                    : isEnglish
                      ? 'Failed'
                      : '失败'
                  : status === 'error'
                    ? isEnglish
                      ? 'Error'
                      : '异常'
                  : isLoading
                    ? isEnglish
                      ? 'Starting'
                      : '启动中'
                    : isEnglish
                      ? 'Idle'
                      : '空闲'}
            </strong>
          </article>
        </div>

        <div className="workspace-command-actions">
          <UiLanguageToggle />
        </div>
      </div>

      <div className="workspace-objective-row">
        <div className="workspace-objective">
          <p className="eyebrow">{isEnglish ? 'Current Goal' : '当前目标'}</p>
          <h2>{currentGoalTitle}</h2>
          <p className="workspace-subtitle">{statusLine}</p>
          {isShowingFallbackAnalysis && error ? (
            <p className="workspace-subtitle">{error}</p>
          ) : null}
        </div>

        {progress && progressStats ? (
          <div className="workspace-progress-card">
            <div className="run-progress-track" aria-hidden="true">
              <div className="run-progress-fill" style={{ width: `${progressStats.percent}%` }} />
            </div>
            <div className="workspace-progress-meta">
              <strong>{progressStats.percent}%</strong>
              <span>{progress.currentStageLabel}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="workspace-process-rail" aria-label={isEnglish ? 'process navigation' : '流程导航'}>
        {journeySteps.map((step) => {
          const isActive = step.id === activeJourneyStep;
          const isLocked = step.locked;

          return (
            <button
              key={step.id}
              type="button"
              className={`workspace-process-card ${isActive ? 'is-active' : ''} ${isLocked ? 'is-locked' : ''}`}
              onClick={step.onSelect}
              disabled={isLocked}
            >
              <span className="workspace-process-index">
                {step.id === 'overview'
                  ? '01'
                  : step.id === 'evidence'
                    ? '02'
                    : step.id === 'analysis'
                      ? '03'
                      : step.id === 'results'
                        ? '04'
                        : '05'}
              </span>
              <span className="workspace-process-copy">
                <strong>{step.label}</strong>
                <small>{step.brief}</small>
              </span>
              <span className="workspace-process-meta">
                <em>{step.status}</em>
                <b>{step.metric}</b>
              </span>
            </button>
          );
        })}
      </div>

      {activePhase === 'intake' ? (
        <div className="workspace-phase-subnav">
          <PhaseTabs
            tabs={inputSteps.map((step) => {
              const meta = getWorkflowStep(step, language);
              return { id: step, label: meta.label, hint: meta.kicker };
            })}
            activeTab={inputStep}
            onChange={(nextStep) => onSelectInputStep(nextStep as InputStep)}
          />
        </div>
      ) : null}

      {activePhase === 'output' && outputStep !== 'sandbox' ? (
        <div className="workspace-phase-subnav">
          <div className="workspace-subnav-intro">
            <span className="meta-chip">{isEnglish ? 'Inside Step 4' : '第 4 步内视图'}</span>
            <p>
              {isEnglish
                ? 'These tabs are parallel result views produced by the formal run, not extra workflow stages. Current Judgment, Future Evolution, and Forecast Report are peers here.'
                : '下面这些标签是正式推演产出的并列结果视图，不是额外的新流程。当前判断、未来演化、预测报告在这里是并列关系。'}
            </p>
          </div>
          <PhaseTabs
            tabs={(['report', 'modeling', 'strategy'] as OutputStep[]).map((step) => {
              const meta = getWorkflowStep(step, language);
              return {
                id: step,
                label: meta.label,
                hint: step === 'report' ? (isEnglish ? 'Start here' : '先看这里') : meta.kicker,
              };
            })}
            activeTab={outputStep}
            onChange={(nextStep) => onSelectOutputStep(nextStep as OutputStep)}
          />
        </div>
      ) : null}

      {activePhase === 'output' && outputStep === 'sandbox' ? (
        <div className="workspace-phase-banner">
          <span className="meta-chip">{isEnglish ? 'Step 5' : '第 5 步'}</span>
          <p>
            {isEnglish
              ? 'Variable Sandbox is a core workflow of its own. It starts from the formal result, freezes a baseline, then lets you inject and observe one new variable.'
              : '变量推演是一条独立的核心流程。它从正式结果出发，先冻结基线，再让你注入并观察一个新变量。'}
          </p>
        </div>
      ) : null}

      {activePhase === 'analysis' ? (
        <div className="workspace-phase-banner">
          <span className="meta-chip">{progress ? progress.currentStageLabel : isEnglish ? 'Desk standing by' : '推理台待命'}</span>
          <p>
            {isEnglish
              ? 'This step only handles the formal run itself. Once it finishes, Step 4 shows the formal results and Step 5 opens the variable sandbox.'
              : '第 3 步只负责把正式推演跑完。跑完之后，第 4 步会展示正式结果，第 5 步则进入变量推演。'}
          </p>
        </div>
      ) : null}
    </header>
  );
}
