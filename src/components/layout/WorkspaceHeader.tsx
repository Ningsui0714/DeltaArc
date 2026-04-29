import type {
  SandboxAnalysisJob,
  SandboxAnalysisMode,
  SandboxAnalysisResult,
} from '../../../shared/sandbox';
import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';
import type { ProjectSnapshot } from '../../types';
import type {
  InputStep,
  OutputStep,
  ProcessPhase,
} from '../../lib/processPhases';
import { UiLanguageToggle } from './UiLanguageToggle';
import { WorkspaceHeaderPhaseContent } from './WorkspaceHeaderPhaseContent';
import { WorkspaceJourneyRail } from './WorkspaceJourneyRail';
import { buildWorkspaceHeaderViewModel } from './workspaceHeaderViewModel';

export type WorkspaceHeaderProps = {
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

export function WorkspaceHeader(props: WorkspaceHeaderProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const viewModel = buildWorkspaceHeaderViewModel({
    ...props,
    language,
  });

  return (
    <header className="workspace-header">
      <div className="workspace-command-deck process-command-deck">
        <div className="workspace-brand">
          <div className="workspace-brand-mark">{isEnglish ? 'DA' : '风'}</div>
          <div className="workspace-brand-copy">
            <p className="eyebrow">{isEnglish ? 'DeltaArc' : '内容风洞'}</p>
            <h1>{viewModel.projectTitle}</h1>
            <p>{viewModel.headline}</p>
          </div>
        </div>

        <div className="workspace-command-summary">
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Current Step' : '当前步骤'}</span>
            <strong>{viewModel.currentGoalTitle}</strong>
          </article>
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Evidence' : '证据信号'}</span>
            <strong>{props.evidenceCount}</strong>
          </article>
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Formal Output' : '正式结果'}</span>
            <strong>{viewModel.outputStateLabel}</strong>
          </article>
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Visible Mode' : '当前结果模式'}</span>
            <strong>{viewModel.visibleModeLabel}</strong>
          </article>
          <article className="workspace-summary-pill">
            <span>{isEnglish ? 'Run State' : '运行状态'}</span>
            <strong>{viewModel.runStateLabel}</strong>
          </article>
        </div>

        <div className="workspace-command-actions">
          <UiLanguageToggle />
        </div>
      </div>

      <div className="workspace-objective-row">
        <div className="workspace-objective">
          <p className="eyebrow">{isEnglish ? 'Current Goal' : '当前目标'}</p>
          <h2>{viewModel.currentGoalTitle}</h2>
          <p className="workspace-subtitle">{viewModel.statusLine}</p>
          {viewModel.showObjectiveError ? (
            <p className="workspace-subtitle">{props.error}</p>
          ) : null}
        </div>

        {props.progress && viewModel.progressStats ? (
          <div className="workspace-progress-card">
            <div className="run-progress-track" aria-hidden="true">
              <div
                className="run-progress-fill"
                style={{ width: `${viewModel.progressStats.percent}%` }}
              />
            </div>
            <div className="workspace-progress-meta">
              <strong>{viewModel.progressStats.percent}%</strong>
              <span>{props.progress.currentStageLabel}</span>
            </div>
          </div>
        ) : null}
      </div>

      <WorkspaceJourneyRail
        activeStep={viewModel.activeJourneyStep}
        ariaLabel={isEnglish ? 'process navigation' : '流程导航'}
        steps={viewModel.journeySteps}
      />

      <WorkspaceHeaderPhaseContent
        activePhase={props.activePhase}
        inputStep={props.inputStep}
        outputStep={props.outputStep}
        hasViewableAnalysis={props.hasViewableAnalysis}
        progressLabel={props.progress?.currentStageLabel ?? null}
        language={language}
        onSelectInputStep={props.onSelectInputStep}
        onSelectOutputStep={props.onSelectOutputStep}
      />
    </header>
  );
}
