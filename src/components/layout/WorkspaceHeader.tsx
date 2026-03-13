import type { SandboxAnalysisJob, SandboxAnalysisResult } from '../../../shared/sandbox';
import { formatJobDuration, getJobProgressStats } from '../../lib/jobProgress';
import {
  getProcessPhases,
  inputSteps,
  outputSteps,
  type InputStep,
  type OutputStep,
  type ProcessPhase,
} from '../../lib/processPhases';
import { getWorkflowStep } from '../../lib/workflowSteps';
import { isEnglishUi, useUiLanguage, type UiLanguage } from '../../hooks/useUiLanguage';
import type { ProjectSnapshot } from '../../types';
import { UiLanguageToggle } from './UiLanguageToggle';
import { PhaseTabs } from '../ui/PhaseTabs';

type WorkspaceHeaderProps = {
  activePhase: ProcessPhase;
  inputStep: InputStep;
  outputStep: OutputStep;
  project: ProjectSnapshot;
  evidenceCount: number;
  analysis: SandboxAnalysisResult;
  hasOfficialAnalysis: boolean;
  isLoading: boolean;
  progress: SandboxAnalysisJob | null;
  onSelectPhase: (phase: ProcessPhase) => void;
  onSelectInputStep: (step: InputStep) => void;
  onSelectOutputStep: (step: OutputStep) => void;
};

function trimCopy(value: string, fallback: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function getPhaseStatusLabel(
  phase: ProcessPhase,
  hasOfficialAnalysis: boolean,
  progress: SandboxAnalysisJob | null,
  evidenceCount: number,
  language: UiLanguage,
) {
  const isEnglish = isEnglishUi(language);

  if (phase === 'intake') {
    return evidenceCount > 0 ? (isEnglish ? 'Collecting inputs' : '输入进行中') : isEnglish ? 'Needs inputs' : '待补输入';
  }

  if (phase === 'analysis') {
    if (progress) {
      return isEnglish ? 'Inference running' : '推理运行中';
    }

    return hasOfficialAnalysis ? (isEnglish ? 'Ready to rerun' : '可重新运行') : isEnglish ? 'Ready to start' : '待启动';
  }

  return hasOfficialAnalysis ? (isEnglish ? 'Outputs ready' : '结果已解锁') : isEnglish ? 'Waiting on inference' : '等待推理完成';
}

function getPhaseMetric(
  phase: ProcessPhase,
  hasOfficialAnalysis: boolean,
  progress: SandboxAnalysisJob | null,
  evidenceCount: number,
  analysis: SandboxAnalysisResult,
  language: UiLanguage,
) {
  const progressStats = progress ? getJobProgressStats(progress) : null;
  const isEnglish = isEnglishUi(language);

  if (phase === 'intake') {
    return isEnglish ? `${evidenceCount} items` : `${evidenceCount} 条信号`;
  }

  if (phase === 'analysis') {
    return progressStats ? `${progressStats.percent}%` : hasOfficialAnalysis ? (isEnglish ? 'Complete' : '已完成') : isEnglish ? 'Not run' : '待运行';
  }

  return hasOfficialAnalysis ? (isEnglish ? `${analysis.futureTimeline.length} beats` : `${analysis.futureTimeline.length} 个节点`) : isEnglish ? 'Locked' : '未解锁';
}

export function WorkspaceHeader({
  activePhase,
  inputStep,
  outputStep,
  project,
  evidenceCount,
  analysis,
  hasOfficialAnalysis,
  isLoading,
  progress,
  onSelectPhase,
  onSelectInputStep,
  onSelectOutputStep,
}: WorkspaceHeaderProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const progressStats = progress ? getJobProgressStats(progress) : null;
  const processPhases = getProcessPhases(language);
  const projectTitle = trimCopy(project.name, isEnglish ? 'Untitled Forecast Task' : '未命名预测任务');
  const activeStep = activePhase === 'output' ? outputStep : inputStep;
  const currentStep = getWorkflowStep(activeStep, language);
  const headline =
    activePhase === 'analysis'
      ? progress
        ? progress.message
        : hasOfficialAnalysis
          ? trimCopy(analysis.report.headline || analysis.systemVerdict, processPhases[1].brief)
          : processPhases[1].brief
      : hasOfficialAnalysis
        ? trimCopy(analysis.report.headline || analysis.systemVerdict, currentStep.brief)
        : trimCopy(project.ideaSummary, currentStep.brief);
  const statusLine =
    activePhase === 'analysis'
      ? progressStats
        ? isEnglish
          ? `${progressStats.completedStageCount}/${progressStats.actionableStageCount} stages finished in ${formatJobDuration(progressStats.elapsedMs, language)}.`
          : `已完成 ${progressStats.completedStageCount}/${progressStats.actionableStageCount} 个阶段，累计运行 ${formatJobDuration(progressStats.elapsedMs, language)}`
        : hasOfficialAnalysis
          ? isEnglish
            ? 'Inference is complete. The next step is to review modeling, strategy, and the report in Outputs.'
            : '推理已经跑完，下一步应该去结果输出区看建模、演化和报告。'
          : isEnglish
            ? 'Finish the inputs first, then run Quick Scan or Deep Dive from the Inference Desk.'
            : '先完成输入，再到推理台手动运行快速扫描或深度推演。'
      : hasOfficialAnalysis
        ? isEnglish
          ? 'Inputs, inference, and outputs are separated. Stay focused on the current stage only.'
          : '输入、推理、输出已经拆开；现在只需要在当前阶段处理这一类任务。'
        : isEnglish
          ? 'The graph, timeline, and inputs no longer share one long page. Move forward stage by stage.'
          : '现在不再把图谱、时间线和输入混在一个大页面里，而是按流程往前推进。';

  return (
    <header className="workspace-header">
      <div className="workspace-command-deck process-command-deck">
        <div className="workspace-brand">
          <div className="workspace-brand-mark">{isEnglish ? 'GB' : '观'}</div>
          <div className="workspace-brand-copy">
            <p className="eyebrow">{isEnglish ? 'Guanbian' : '观变'}</p>
            <h1>{projectTitle}</h1>
            <p>{headline}</p>
          </div>
        </div>

        <div className="workspace-command-summary">
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Phase' : '当前流程'}</span>
            <strong>{processPhases.find((phase) => phase.id === activePhase)?.label}</strong>
          </article>
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Evidence' : '证据信号'}</span>
            <strong>{evidenceCount}</strong>
          </article>
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Formal Output' : '正式结果'}</span>
            <strong>{hasOfficialAnalysis ? (isEnglish ? 'Ready' : '已生成') : isEnglish ? 'Locked' : '未生成'}</strong>
          </article>
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Run State' : '运行状态'}</span>
            <strong>{progressStats ? `${progressStats.percent}%` : isLoading ? (isEnglish ? 'Starting' : '启动中') : isEnglish ? 'Idle' : '空闲'}</strong>
          </article>
        </div>

        <div className="workspace-command-actions">
          <UiLanguageToggle />
        </div>
      </div>

      <div className="workspace-objective-row">
        <div className="workspace-objective">
          <p className="eyebrow">{isEnglish ? 'Current Goal' : '当前目标'}</p>
          <h2>{activePhase === 'analysis' ? (isEnglish ? 'Inference Desk' : '推理台') : currentStep.label}</h2>
          <p className="workspace-subtitle">{statusLine}</p>
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
        {processPhases.map((phase) => {
          const isActive = phase.id === activePhase;
          const isLocked = phase.id === 'output' && !hasOfficialAnalysis;

          return (
            <button
              key={phase.id}
              type="button"
              className={`workspace-process-card ${isActive ? 'is-active' : ''} ${isLocked ? 'is-locked' : ''}`}
              onClick={() => onSelectPhase(phase.id)}
              disabled={isLocked}
            >
              <span className="workspace-process-index">{phase.kicker}</span>
              <span className="workspace-process-copy">
                <strong>{phase.label}</strong>
                <small>{phase.brief}</small>
              </span>
              <span className="workspace-process-meta">
                <em>{getPhaseStatusLabel(phase.id, hasOfficialAnalysis, progress, evidenceCount, language)}</em>
                <b>{getPhaseMetric(phase.id, hasOfficialAnalysis, progress, evidenceCount, analysis, language)}</b>
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

      {activePhase === 'output' ? (
        <div className="workspace-phase-subnav">
          <PhaseTabs
            tabs={outputSteps.map((step) => {
              const meta = getWorkflowStep(step, language);
              return { id: step, label: meta.label, hint: meta.kicker };
            })}
            activeTab={outputStep}
            onChange={(nextStep) => onSelectOutputStep(nextStep as OutputStep)}
          />
        </div>
      ) : null}

      {activePhase === 'analysis' ? (
        <div className="workspace-phase-banner">
          <span className="meta-chip">{progress ? progress.currentStageLabel : isEnglish ? 'Desk standing by' : '推理台待命'}</span>
          <p>
            {isEnglish
              ? 'This area is only for the run, the graph, and the live timeline. After the run finishes, move to Outputs instead of mixing inputs with conclusions.'
              : '这里专门看运行、图谱和时间线。运行完成后，再切到结果输出区，不再把输入和结论堆在一起。'}
          </p>
        </div>
      ) : null}
    </header>
  );
}
