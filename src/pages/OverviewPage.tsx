import { FileImportCard, type ImportFeedback } from '../components/import/FileImportCard';
import { ProjectEditorCard } from '../components/project/ProjectEditorCard';
import { MetricCard } from '../components/ui/MetricCard';
import { TimelineItem } from '../components/ui/TimelineItem';
import { isEnglishUi, useUiLanguage } from '../hooks/useUiLanguage';
import { getProjectReadiness } from '../lib/projectReadiness';
import type { ProjectSnapshot, StepId } from '../types';

type OverviewPageProps = {
  project: ProjectSnapshot;
  evidenceCount: number;
  hasViewableAnalysis: boolean;
  isAnalysisFresh: boolean;
  isAnalysisStale: boolean;
  isAnalysisDegraded: boolean;
  onProjectChange: (patch: Partial<ProjectSnapshot>) => void;
  onResetProject: () => void;
  onClearEvidence: () => void;
  projectImportFeedback: ImportFeedback | null;
  onImportProjectFile: (file: File) => Promise<void>;
  onNavigate: (step: StepId) => void;
};

export function OverviewPage({
  project,
  evidenceCount,
  hasViewableAnalysis,
  isAnalysisFresh,
  isAnalysisStale,
  isAnalysisDegraded,
  onProjectChange,
  onResetProject,
  onClearEvidence,
  projectImportFeedback,
  onImportProjectFile,
  onNavigate,
}: OverviewPageProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const quickScanLabel = isEnglish ? 'Quick Scan' : '快速扫描';
  const deepDiveLabel = isEnglish ? 'Deep Dive' : '深度推演';
  const { filledFieldCount, setupFieldCount, projectReady, evidenceReady } = getProjectReadiness(
    project,
    evidenceCount,
  );
  const canRunAnalysis = projectReady && evidenceReady;
  const displayIdeaSummary =
    project.ideaSummary ||
    (isEnglish
      ? 'Start from a blank project and define what this round is trying to validate.'
      : '从空白项目开始，先定义这次要验证什么。');
  const displayCoreLoop =
    project.coreLoop ||
    (isEnglish
      ? 'Write the core loop first, for example: explore -> fight -> collect -> grow.'
      : '先写核心循环，例如：探索 -> 战斗 -> 收集 -> 成长。');
  const displayCoreFantasy =
    project.coreFantasy ||
    (isEnglish
      ? 'Explain why players stay and what they should feel.'
      : '先写玩家为什么愿意留下来，以及想感受到什么。');
  const displayValidationGoal =
    project.validationGoal ||
    (isEnglish
      ? 'Turn this round into one sentence with a clear success or failure bar.'
      : '先把这轮验证目标写成一句可判断输赢的话。');
  const displayCurrentStatus =
    project.currentStatus ||
    (isEnglish
      ? 'Write the main concern right now, such as onboarding cost, differentiation, or retention risk.'
      : '先写你现在最担心的问题，例如上手成本、差异化或留存风险。');
  const runStatusTitle = hasViewableAnalysis
    ? isAnalysisFresh
      ? isEnglish
        ? 'Latest formal result is ready in Outputs'
        : '最新正式结果已在输出区就绪'
      : isAnalysisDegraded
        ? isEnglish
          ? 'A partial formal result is still viewable'
          : '一份降级正式结果仍可继续查看'
        : isAnalysisStale
          ? isEnglish
            ? 'A previous formal result is still viewable'
            : '上一份正式结果仍可继续查看'
          : isEnglish
            ? 'A previous formal result is still viewable'
            : '上一份正式结果仍可继续查看'
    : isEnglish
      ? 'No formal result is shown during intake'
      : '输入阶段不会直接展示正式结论';
  const runStatusCopy = hasViewableAnalysis
    ? isAnalysisFresh
      ? isEnglish
        ? 'Keep intake focused on project inputs. Review modeling, strategy, and the report from Outputs only.'
        : '输入阶段继续专注项目和证据；建模、策略和报告请到输出区查看。'
      : isAnalysisDegraded
        ? isEnglish
          ? 'The current outputs come from a partial formal run. They stay viewable, but a rerun is recommended before freezing or deciding.'
          : '当前输出来自一次未完整结束的正式推理。结果仍可查看，但在冻结或决策前建议重跑。'
        : isEnglish
          ? 'Current inputs have changed since the last formal run. The previous outputs stay viewable, but a rerun is recommended.'
          : '自上次正式推理后，当前输入已经变化。旧结果仍可查看，但建议重新运行。'
    : isEnglish
      ? `Fill the 4/4 minimum setup and 3 evidence items first, then go to the Inference Desk to run ${quickScanLabel}.`
      : '先补齐 4/4 最小起跑线和 3 条证据，再进入推理台开始快速扫描。';
  const guideSteps = [
    {
      id: 'project',
      number: '01',
      title: isEnglish ? 'Fill the project frame' : '填项目骨架',
      description: isEnglish
        ? 'At minimum, add the one-line concept, core loop, target audience, and validation goal so the system knows what it is testing.'
        : '至少补一句话想法、核心循环、目标玩家、验证目标，系统才知道在验证什么。',
      metric: isEnglish ? `Core fields ${setupFieldCount}/4` : `关键字段 ${setupFieldCount}/4`,
      status: projectReady ? 'done' : 'current',
      actionLabel: isEnglish ? 'Continue Editing' : '继续填写项目',
      actionStep: 'overview' as StepId,
    },
    {
      id: 'evidence',
      number: '02',
      title: isEnglish ? 'Add at least three evidence items' : '补三条以上证据',
      description: isEnglish
        ? 'Interview quotes, playtest notes, competitor reviews, and design excerpts all count. Keep each item to one observation.'
        : '访谈原话、试玩观察、竞品评论、设计摘录都可以，每条只写一个观察。',
      metric: isEnglish ? `Evidence ${evidenceCount}/3+` : `当前证据 ${evidenceCount}/3+`,
      status: evidenceReady ? 'done' : projectReady ? 'current' : 'upcoming',
      actionLabel: isEnglish ? 'Add Evidence' : '去补证据',
      actionStep: 'evidence' as StepId,
    },
    {
      id: 'scan',
      number: '03',
      title: isEnglish ? `Run ${quickScanLabel}` : '开始快速扫描',
      description: isEnglish
        ? `${quickScanLabel} is the first formal pass for blind spots, risks, and next moves. It only unlocks after the minimum setup and evidence gate are both ready.`
        : '快速扫描是第一轮正式盲点、风险和下一步判断，只有最小设定和证据门槛都达标后才会解锁。',
      metric: hasViewableAnalysis
        ? isAnalysisFresh
          ? isEnglish
            ? 'Latest formal run already available'
            : '已有最新正式结果'
          : isEnglish
            ? 'Older formal run available, rerun recommended'
            : '已有旧正式结果，建议重跑'
        : canRunAnalysis
          ? isEnglish
            ? `Ready to open ${quickScanLabel} from the Inference Desk`
            : '已达标，可进入推理台开始快速扫描'
          : isEnglish
            ? 'Requires 4/4 setup fields and 3 evidence items'
            : '需要 4/4 关键字段和 3 条证据',
      status: hasViewableAnalysis ? 'done' : canRunAnalysis ? 'current' : 'upcoming',
    },
    {
      id: 'review',
      number: '04',
      title: isEnglish ? 'Review outputs in the output phase' : '去输出阶段看结果',
      description: isEnglish
        ? 'Modeling, strategy, and the report stay in Outputs only. Intake gives you status and readiness, not conclusion copy.'
        : '建模、策略和报告只放在输出阶段。输入阶段只给状态和准备度，不直接展示结论文案。',
      metric: hasViewableAnalysis
        ? isAnalysisFresh
          ? isEnglish
            ? 'Outputs are ready to open'
            : '输出区已可查看'
          : isEnglish
            ? 'Outputs stay viewable, rerun recommended'
            : '输出区仍可查看，但建议重跑'
        : isEnglish
          ? `Finish ${quickScanLabel} first`
          : '先完成快速扫描',
      status: hasViewableAnalysis ? 'current' : 'upcoming',
      actionLabel: hasViewableAnalysis ? (isEnglish ? 'Open Outputs' : '打开输出区') : undefined,
      actionStep: hasViewableAnalysis ? ('modeling' as StepId) : undefined,
    },
  ];
  const intakeBullets = hasViewableAnalysis
    ? [
        isAnalysisFresh
          ? isEnglish
            ? 'The latest formal result is current. Keep intake focused on inputs, and open Outputs when you need the judgment.'
            : '最新正式结果仍是当前版本。输入阶段继续专注输入整理，真正查看判断时再打开输出区。'
          : isAnalysisDegraded
            ? isEnglish
              ? 'The visible result is degraded because a later stage failed. Earlier completed stages were preserved for review.'
              : '当前可见结果是降级结果，因为后续阶段失败了；已完成的前置阶段已被保留下来。'
            : isEnglish
              ? 'The visible result is stale because current inputs no longer match the last formal run.'
              : '当前可见结果已经过期，因为当前输入与上次正式推理时不再一致。',
        isEnglish
          ? 'Only the output phase shows the actual summary, verdict, confidence, and report.'
          : '真正的摘要、结论、置信度和报告只会在输出阶段展示。',
        isEnglish
          ? 'If you want a new conclusion, rerun from the Inference Desk after the inputs are ready again.'
          : '如果要拿新结论，请在输入再次达标后回推理台重跑。',
      ]
    : [
        isEnglish
          ? `${setupFieldCount}/4 core fields are filled. Add the one-line concept, core loop, target audience, and validation goal first.`
          : `当前已完成 ${setupFieldCount}/4 个关键字段，建议先补齐一句话想法、核心循环、目标玩家、验证目标。`,
        isEnglish
          ? `There are ${evidenceCount} evidence items now. Aim for at least 3 before formal inference unlocks.`
          : `当前证据 ${evidenceCount} 条，建议先累计到 3 条以上再解锁正式推理。`,
        isEnglish
          ? 'You can import a project JSON bundle, design Markdown, or TXT directly. There is no need to refill a sample template.'
          : '可以直接导入项目包 JSON、设计文档 Markdown 或 TXT，不需要按示例模板重填。',
        isEnglish
          ? 'The evidence page supports line-by-line pasted interviews, competitor notes, and playtest conclusions. One observation per line is clearest.'
          : '证据页支持逐行粘贴访谈、竞品观察、试玩结论，每行一条最清晰。',
      ];
  const formalRunStatusValue = hasViewableAnalysis
    ? isAnalysisFresh
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
            : '可查看'
    : isEnglish
      ? 'Locked'
      : '未运行';

  return (
    <section className="page-grid">
      <article className="hero-panel">
        <p className="eyebrow">{isEnglish ? 'Mission Brief' : '任务简报'}</p>
        <h3>{displayIdeaSummary}</h3>
        <p className="hero-copy">
          {isEnglish
            ? `This stage is only for project setup, evidence loading, and import feedback. When the minimum gate is ready, move to the Inference Desk for ${quickScanLabel}.`
            : '这一阶段只负责项目设定、证据装载和导入反馈。最小门槛达标后，再进入推理台开始快速扫描。'}
        </p>
        <div className="signal-band">
          <div>
            <span>{isEnglish ? 'Core Fields' : '关键字段'}</span>
            <strong>{filledFieldCount}/8</strong>
          </div>
          <div>
            <span>{isEnglish ? 'Evidence' : '当前证据'}</span>
            <strong>{isEnglish ? `${evidenceCount}` : `${evidenceCount} 条`}</strong>
          </div>
          <div>
            <span>{isEnglish ? 'Core Loop' : '核心循环'}</span>
            <strong>{displayCoreLoop}</strong>
          </div>
          <div>
            <span>{isEnglish ? 'Core Fantasy' : '核心体验'}</span>
            <strong>{displayCoreFantasy}</strong>
          </div>
          <div>
            <span>{isEnglish ? 'Validation Goal' : '验证目标'}</span>
            <strong>{displayValidationGoal}</strong>
          </div>
          <div>
            <span>{isEnglish ? 'Current Concern' : '当前状态'}</span>
            <strong>{displayCurrentStatus}</strong>
          </div>
        </div>
      </article>

      <section className="panel launchpad-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Getting Started' : '开始使用'}</p>
            <h3>{isEnglish ? 'Start with these four steps' : '第一次使用，按这 4 步走'}</h3>
          </div>
          <span className="panel-badge">
            {isEnglish ? '4/4 setup + 3 evidence to unlock inference' : '4/4 关键字段 + 3 条证据后解锁推理'}
          </span>
        </div>
        <div className="launchpad-grid">
          {guideSteps.map((step) => {
            const actionStep = step.actionStep;

            return (
              <article key={step.id} className={`guide-card is-${step.status}`}>
                <div className="guide-card-topline">
                  <span className="guide-index">{step.number}</span>
                  <span className={`guide-status status-${step.status}`}>
                    {step.status === 'done'
                      ? isEnglish
                        ? 'Done'
                        : '已完成'
                      : step.status === 'current'
                        ? isEnglish
                          ? 'Recommended Now'
                          : '当前建议'
                        : isEnglish
                          ? 'Later'
                          : '稍后再做'}
                  </span>
                </div>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
                <strong className="guide-metric">{step.metric}</strong>
                {step.actionLabel && actionStep ? (
                  <button
                    type="button"
                    className={step.status === 'current' ? 'accent-button' : 'inline-button'}
                    onClick={() => onNavigate(actionStep)}
                  >
                    {step.actionLabel}
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <ProjectEditorCard
        project={project}
        onProjectChange={onProjectChange}
        onResetProject={onResetProject}
        onClearEvidence={onClearEvidence}
      />

      <FileImportCard
        title={isEnglish ? 'Import Project File' : '导入项目文件'}
        description={
          isEnglish
            ? 'Upload a project JSON bundle, design Markdown, or requirement TXT. Recognized project fields fill automatically, and the body is also converted into evidence cards.'
            : '上传项目包 JSON、设计文档 Markdown 或需求 TXT，命中项目字段时会自动回填；正文也会同步沉淀成证据卡。'
        }
        accept=".json,.md,.markdown,.txt"
        hint={
          isEnglish
            ? 'Recommended: project JSON bundle / design Markdown / requirement TXT'
            : '推荐上传：项目包 JSON / 设计文档 Markdown / 需求说明 TXT'
        }
        buttonLabel={isEnglish ? 'Choose Project File' : '选择项目文件'}
        feedback={projectImportFeedback}
        onImport={onImportProjectFile}
      />

      <section className="panel split-panel">
        <div>
          <p className="eyebrow">{isEnglish ? 'Formal Run Status' : '正式推理状态'}</p>
          <h4>{runStatusTitle}</h4>
          <p>{runStatusCopy}</p>
        </div>
        <ul className="bullet-list">
          {intakeBullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="metrics-row">
        <MetricCard
          label={isEnglish ? 'Project Readiness' : '项目准备度'}
          value={`${setupFieldCount}/4`}
          tone={projectReady ? 'good' : 'alert'}
        />
        <MetricCard
          label={isEnglish ? 'Evidence Gate' : '证据门槛'}
          value={isEnglish ? `${evidenceCount}/3+` : `${evidenceCount}/3+`}
          tone={evidenceReady ? 'good' : 'info'}
        />
        <MetricCard
          label={isEnglish ? 'Formal Run Status' : '正式推理状态'}
          value={formalRunStatusValue}
          tone={hasViewableAnalysis ? (isAnalysisFresh ? 'good' : 'alert') : 'info'}
        />
      </section>

      <section className="panel timeline-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'How It Works' : '使用流程'}</p>
            <h4>{isEnglish ? 'Recommended ramp-up path' : '推荐上手路线'}</h4>
          </div>
          <button type="button" className="inline-button" onClick={() => onNavigate('evidence')}>
            {isEnglish ? 'Open Evidence' : '去证据页'}
          </button>
        </div>
        <div className="timeline-list">
          <TimelineItem
            time="01"
            title={isEnglish ? 'Define the project question first' : '先定义项目问题'}
            detail={
              isEnglish
                ? 'Write the one-line concept, core loop, target audience, and validation goal so the system knows what to watch.'
                : '至少写清一句话想法、核心循环、目标玩家和验证目标，系统才知道该盯什么。'
            }
          />
          <TimelineItem
            time="02"
            title={isEnglish ? 'Load the evidence' : '把证据丢进来'}
            detail={
              isEnglish
                ? 'You can paste interviews and playtest notes, or import Markdown, TXT, and JSON. Keep each item to one observation.'
                : '支持粘贴访谈/试玩观察，也支持导入 Markdown、TXT、JSON。每条证据尽量只写一个观察。'
            }
          />
          <TimelineItem
            time="03"
            title={isEnglish ? `Run ${quickScanLabel} first` : '先跑快速扫描'}
            detail={
              isEnglish
                ? `${quickScanLabel} is better for the first structured read. Leave ${deepDiveLabel} for after the minimum gate and the first output review are complete.`
                : '快速扫描更适合拿第一轮结构化判断。深度推演留到最小门槛达标并完成第一轮结果查看之后。'
            }
          />
          <TimelineItem
            time="04"
            title={isEnglish ? 'Open Outputs for decisions' : '去输出阶段做判断'}
            detail={
              isEnglish
                ? 'Review modeling and strategy first, then decide whether to add evidence, rewrite the goal, or open the full report.'
                : '先看建模和策略，再决定是继续补证据、重写目标，还是进入完整报告。'
            }
          />
        </div>
      </section>
    </section>
  );
}
