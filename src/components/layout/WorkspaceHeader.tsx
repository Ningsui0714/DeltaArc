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
        ? 'Stabilized outputs ready'
        : '稳定化结果可查看'
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
        ? 'Step 3 · Inference'
        : '第3步·正式推演'
      : activePhase === 'output'
        ? outputStep === 'sandbox'
          ? isEnglish
            ? 'Step 5 · Sandbox'
            : '第5步·变量推演'
          : isEnglish
            ? 'Step 4 · Results'
            : '第4步·正式结果'
        : inputStep === 'overview'
          ? isEnglish
            ? 'Step 1 · Setup'
            : '第1步·项目设定'
          : isEnglish
            ? 'Step 2 · Evidence'
            : '第2步·证据信号';
  const journeySteps = [
    {
      id: 'overview' as const,
      label: isEnglish ? 'Project Setup' : '项目设定',
      brief: isEnglish ? 'Define the problem.' : '先定问题。',
      status:
        readiness.setupFieldCount >= 4
          ? isEnglish
            ? 'Core setup is ready'
            : '核心设定已达标'
          : isEnglish
            ? 'Fill required fields'
            : '补齐关键字段',
      metric: `${readiness.setupFieldCount}/4`,
      locked: false,
      onSelect: () => onSelectInputStep('overview'),
    },
    {
      id: 'evidence' as const,
      label: isEnglish ? 'Evidence Signals' : '证据信号',
      brief: isEnglish ? 'Load enough evidence.' : '先补够证据。',
      status:
        evidenceCount >= 3
          ? isEnglish
            ? 'Evidence is ready'
            : '证据已达标'
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
      brief: isEnglish ? 'Run the formal chain.' : '运行正式推演。',
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
        ? 'Review the result views.'
        : '查看正式结果。',
      status: !hasViewableAnalysis
        ? isEnglish
          ? 'Waiting for formal result'
          : '等待正式结果'
        : isAnalysisDegraded
        ? isEnglish
            ? 'Stabilized results are available'
            : '已有稳定化结果'
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
        ? 'Freeze a baseline and test one variable.'
        : '冻结基线再试变量。',
      status: !hasViewableAnalysis
        ? isEnglish
          ? 'Waiting for formal result'
          : '等待正式结果'
        : baselineCount > 0
          ? outputStep === 'sandbox'
            ? isEnglish
              ? 'Sandbox is open'
              : '流程已打开'
            : isEnglish
              ? 'Baseline is ready'
              : '基线已就绪'
          : isEnglish
            ? 'Freeze the first baseline'
            : '先冻结基线',
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
                ? 'A stabilized formal output is preserved'
                : '已保留一份经过回退稳定的正式结果'
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
          ? `${progressStats.completedStageCount}/${progressStats.actionableStageCount} done · ${formatJobDuration(progressStats.elapsedMs, language)}`
          : `已完成 ${progressStats.completedStageCount}/${progressStats.actionableStageCount} · ${formatJobDuration(progressStats.elapsedMs, language)}`
        : isShowingFallbackAnalysis && hasViewableAnalysis && requestedModeLabel
          ? isShowingDifferentModeFallback
            ? isEnglish
              ? `Latest ${requestedModeLabel} failed. Showing previous ${visibleModeLabel}.`
              : `最近一次${requestedModeLabel}失败，当前仍显示上一份${visibleModeLabel}。`
            : isEnglish
              ? `Latest ${requestedModeLabel} failed. Showing last ${visibleModeLabel}.`
              : `最近一次${requestedModeLabel}失败，当前仍显示上一份${visibleModeLabel}结果。`
        : hasRunError
          ? progress?.retryable
            ? isEnglish
              ? 'Latest run failed. Resume is available.'
              : '最近一次运行失败，可从失败阶段继续。'
            : isEnglish
              ? 'Latest run failed. Start a new run.'
              : '最近一次运行失败，请重新发起。'
          : hasViewableAnalysis
            ? isEnglish
              ? 'Formal inference is complete.'
              : '正式推演已完成。'
            : canRunAnalysis
              ? isEnglish
                ? 'The minimum gate is ready.'
                : '门槛已达标，可以开始运行。'
              : isEnglish
                ? 'Finish 4/4 setup and 3 evidence first.'
                : '先补齐 4/4 设定和 3 条证据。'
      : activePhase === 'intake'
        ? hasViewableAnalysis
          ? isEnglish
            ? 'A formal result already exists.'
            : '当前已经有正式结果。'
          : isEnglish
            ? 'Start with project setup and evidence.'
            : '先整理项目和证据。'
        : isShowingFallbackAnalysis && hasViewableAnalysis && requestedModeLabel
          ? isShowingDifferentModeFallback
            ? isEnglish
              ? `Latest ${requestedModeLabel} failed. Showing previous ${visibleModeLabel}.`
              : `最近一次${requestedModeLabel}失败，当前仍显示上一份${visibleModeLabel}。`
            : isEnglish
              ? `Latest ${requestedModeLabel} failed. Showing last ${visibleModeLabel}.`
              : `最近一次${requestedModeLabel}失败，当前仍显示上一份${visibleModeLabel}结果。`
        : hasViewableAnalysis
          ? outputStep === 'sandbox'
            ? isAnalysisFresh
              ? isEnglish
                ? 'You are in Step 5: Variable Sandbox.'
                : '你现在在第5步：变量推演。'
              : isAnalysisDegraded
                ? isEnglish
                  ? 'You are in Step 5. The source result used fallback handling.'
                  : '你现在在第5步，依赖结果触发过回退。'
                : isEnglish
                  ? 'You are in Step 5. The source result is stale.'
                  : '你现在在第5步，依赖结果已经过期。'
            : isAnalysisFresh
              ? isEnglish
                ? `You are in Step 4. View: ${currentStep.label}.`
                : `你现在在第4步。当前视图：${currentStep.label}。`
              : isAnalysisDegraded
                ? isEnglish
                  ? `You are in Step 4. View: ${currentStep.label}. Rerun recommended.`
                  : `你现在在第4步。当前视图：${currentStep.label}，建议重跑。`
                : isEnglish
                  ? `You are in Step 4. View: ${currentStep.label}. Output is stale.`
                  : `你现在在第4步。当前视图：${currentStep.label}，结果已过期。`
          : isEnglish
            ? `Run formal inference first. Step ${outputStep === 'sandbox' ? '5' : '4'} is still locked.`
            : `先完成正式推演，第${outputStep === 'sandbox' ? '5' : '4'}步才会解锁。`;

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
