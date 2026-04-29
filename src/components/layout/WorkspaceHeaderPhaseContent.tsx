import { getWorkflowStep } from '../../lib/workflowSteps';
import {
  inputSteps,
  type InputStep,
  type OutputStep,
  type ProcessPhase,
} from '../../lib/processPhases';
import { isEnglishUi, type UiLanguage } from '../../hooks/useUiLanguage';
import { PhaseTabs } from '../ui/PhaseTabs';

type WorkspaceHeaderPhaseContentProps = {
  activePhase: ProcessPhase;
  inputStep: InputStep;
  outputStep: OutputStep;
  hasViewableAnalysis: boolean;
  progressLabel: string | null;
  language: UiLanguage;
  onSelectInputStep: (step: InputStep) => void;
  onSelectOutputStep: (step: OutputStep) => void;
};

export function WorkspaceHeaderPhaseContent({
  activePhase,
  inputStep,
  outputStep,
  hasViewableAnalysis,
  progressLabel,
  language,
  onSelectInputStep,
  onSelectOutputStep,
}: WorkspaceHeaderPhaseContentProps) {
  const isEnglish = isEnglishUi(language);

  if (activePhase === 'intake') {
    return (
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
    );
  }

  if (activePhase === 'output' && outputStep !== 'sandbox') {
    return (
      <div className="workspace-phase-subnav">
        <div className="workspace-subnav-intro">
          <span className="meta-chip">{isEnglish ? 'Inside Step 4' : '第 4 步内视图'}</span>
          <p>
            {isEnglish
              ? 'These tabs are parallel strategy views produced by the formal diagnosis, not extra workflow stages. Current Diagnosis, Spread Outlook, and Strategy Report are peers here.'
              : '下面这些标签是正式诊断产出的并列策略视图，不是额外的新流程。当前诊断、扩散演化、策略报告在这里是并列关系。'}
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
    );
  }

  if (activePhase === 'output' && outputStep === 'sandbox') {
    return (
      <div className="workspace-phase-banner">
        <span className="meta-chip">{isEnglish ? 'Step 5' : '第 5 步'}</span>
        <p>
          {isEnglish
            ? 'Variable Lab is a core workflow of its own. It starts from the formal strategy result, freezes a baseline, then lets you inject and observe one new content variable.'
            : '变量实验是一条独立的核心流程。它从正式策略结果出发，先冻结基线，再让你注入并观察一个新的内容变量。'}
        </p>
      </div>
    );
  }

  if (activePhase === 'analysis') {
    return (
      <div className="workspace-phase-banner">
        <span className="meta-chip">
          {progressLabel ?? (isEnglish ? 'Desk standing by' : '诊断台待命')}
        </span>
        <p>
          {isEnglish
            ? 'This step only handles the formal diagnosis itself. Once it finishes, Step 4 shows the strategy results and Step 5 opens the variable lab.'
            : '第 3 步只负责把正式诊断跑完。跑完之后，第 4 步会展示策略结果，第 5 步则进入变量实验。'}
        </p>
      </div>
    );
  }

  if (!hasViewableAnalysis) {
    return null;
  }

  return null;
}
