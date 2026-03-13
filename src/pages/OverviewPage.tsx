import { FileImportCard, type ImportFeedback } from '../components/import/FileImportCard';
import { ProjectEditorCard } from '../components/project/ProjectEditorCard';
import { MetricCard } from '../components/ui/MetricCard';
import { TimelineItem } from '../components/ui/TimelineItem';
import { isEnglishUi, useUiLanguage } from '../hooks/useUiLanguage';
import type { ProjectSnapshot, StepId } from '../types';

type OverviewPageProps = {
  project: ProjectSnapshot;
  evidenceCount: number;
  hasCompletedAnalysis: boolean;
  playerAcceptance: number;
  confidence: number;
  supportRatio: number;
  systemVerdict: string;
  summary: string;
  nextStep: string;
  onProjectChange: (patch: Partial<ProjectSnapshot>) => void;
  onResetProject: () => void;
  onClearEvidence: () => void;
  projectImportFeedback: ImportFeedback | null;
  onImportProjectFile: (file: File) => Promise<void>;
  onNavigate: (step: StepId) => void;
};

function countFilledFields(project: ProjectSnapshot) {
  return [
    project.ideaSummary,
    project.coreLoop,
    project.coreFantasy,
    project.genre,
    project.targetPlayers.join(' '),
    project.validationGoal,
    project.productionConstraints,
    project.currentStatus,
  ].filter((item) => item.trim().length > 0).length;
}

function countSetupFields(project: ProjectSnapshot) {
  return [project.ideaSummary, project.coreLoop, project.targetPlayers.join(' '), project.validationGoal].filter(
    (item) => item.trim().length > 0,
  ).length;
}

export function OverviewPage({
  project,
  evidenceCount,
  hasCompletedAnalysis,
  playerAcceptance,
  confidence,
  supportRatio,
  systemVerdict,
  summary,
  nextStep,
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
  const filledProjectFieldCount = countFilledFields(project);
  const setupFieldCount = countSetupFields(project);
  const projectReady = setupFieldCount >= 3;
  const evidenceReady = evidenceCount >= 3;
  const displayIdeaSummary = project.ideaSummary || (isEnglish ? 'Start from a blank project and define what this round is trying to validate.' : '从空白项目开始，先定义这次要验证什么。');
  const displayCoreLoop = project.coreLoop || (isEnglish ? 'Write the core loop first, for example: explore -> fight -> collect -> grow.' : '先写核心循环，例如：探索 -> 战斗 -> 收集 -> 成长。');
  const displayCoreFantasy = project.coreFantasy || (isEnglish ? 'Explain why players stay and what they should feel.' : '先写玩家为什么愿意留下来，以及想感受到什么。');
  const displayValidationGoal = project.validationGoal || (isEnglish ? 'Turn this round into one sentence with a clear success or failure bar.' : '先把这轮验证目标写成一句可判断输赢的话。');
  const displayCurrentStatus = project.currentStatus || (isEnglish ? 'Write the main concern right now, such as onboarding cost, differentiation, or retention risk.' : '先写你现在最担心的问题，例如上手成本、差异化或留存风险。');
  const displayTargetPlayers =
    project.targetPlayers.length > 0 ? project.targetPlayers.join(' / ') : isEnglish ? 'Define the target audience layers first.' : '先定义目标玩家分层。';
  const displayReferenceGames =
    project.referenceGames.length > 0 ? project.referenceGames.join(' / ') : isEnglish ? 'List reference games and substitutes first.' : '先列出参考游戏和替代品。';
  const displayProductionConstraints =
    project.productionConstraints || (isEnglish ? 'Spell out the production constraints first or every later judgment will drift.' : '先写清制作约束，否则后续判断会持续失真。');
  const heroCopy = hasCompletedAnalysis
    ? summary
    : isEnglish
      ? `No template content is injected here anymore. Build the project frame, load evidence, then run ${quickScanLabel} from the Inference Desk.`
      : '这里不再自动塞示例模板。先写项目骨架、补证据，再进入推理台运行快速扫描。';
  const decisionTitle = hasCompletedAnalysis ? systemVerdict : isEnglish ? 'It is too early for conclusions. Define the problem first.' : '还没到看结论的时候，先把问题定义清楚。';
  const guideSteps = [
    {
      id: 'project',
      number: '01',
      title: isEnglish ? 'Fill the project frame' : '填项目骨架',
      description: isEnglish ? 'At minimum, add the one-line concept, core loop, target audience, and validation goal so the system knows what it is testing.' : '至少补一句话想法、核心循环、目标玩家、验证目标，系统才知道在验证什么。',
      metric: isEnglish ? `Core fields ${setupFieldCount}/4` : `关键字段 ${setupFieldCount}/4`,
      status: projectReady ? 'done' : 'current',
      actionLabel: isEnglish ? 'Continue Editing' : '继续填写项目',
      actionStep: 'overview' as StepId,
    },
    {
      id: 'evidence',
      number: '02',
      title: isEnglish ? 'Add at least three evidence items' : '补三条以上证据',
      description: isEnglish ? 'Interview quotes, playtest notes, competitor reviews, and design excerpts all count. Keep each item to one observation.' : '访谈原话、试玩观察、竞品评论、设计摘录都可以，每条只写一个观察。',
      metric: isEnglish ? `Evidence ${evidenceCount}` : `当前证据 ${evidenceCount} 条`,
      status: evidenceReady ? 'done' : projectReady ? 'current' : 'upcoming',
      actionLabel: isEnglish ? 'Add Evidence' : '去补证据',
      actionStep: 'evidence' as StepId,
    },
    {
      id: 'scan',
      number: '03',
      title: isEnglish ? `Run ${quickScanLabel} first` : '先跑快速扫描',
      description: isEnglish
        ? `${quickScanLabel} is for the first blind spots, risks, and next moves. Do not jump straight into a deep pass.`
        : '快速扫描用来快速看盲点、风险和下一步，不建议一开始就直接深挖。',
      metric: hasCompletedAnalysis ? (isEnglish ? 'Latest analysis already available' : '已有最新分析结果') : isEnglish ? `Ready to run ${quickScanLabel} from the Inference Desk` : '准备好后进入推理台运行快速扫描',
      status: hasCompletedAnalysis ? 'done' : evidenceReady ? 'current' : 'upcoming',
    },
    {
      id: 'review',
      number: '04',
      title: isEnglish ? `Decide whether to continue with ${deepDiveLabel}` : '再决定要不要深度推演',
      description: isEnglish
        ? 'Review the modeling and strategy pages first, confirm the problem boundary, then decide whether a full report is necessary.'
        : '先看建模页和策略页，确认问题边界，再决定是否需要完整报告。',
      metric: hasCompletedAnalysis ? (isEnglish ? 'You can continue into modeling now' : '现在可以继续看建模结果') : isEnglish ? `Finish ${quickScanLabel} first` : '先完成快速扫描',
      status: hasCompletedAnalysis ? 'current' : 'upcoming',
      actionLabel: hasCompletedAnalysis ? (isEnglish ? 'Open Modeling' : '查看建模结果') : undefined,
      actionStep: hasCompletedAnalysis ? ('modeling' as StepId) : undefined,
    },
  ];
  const decisionBullets = hasCompletedAnalysis
    ? [
        isEnglish ? `Target audience: ${displayTargetPlayers}` : `目标玩家：${displayTargetPlayers}`,
        isEnglish ? `Reference games: ${displayReferenceGames}` : `参考游戏：${displayReferenceGames}`,
        isEnglish ? `Production constraints: ${displayProductionConstraints}` : `制作约束：${displayProductionConstraints}`,
        isEnglish ? `Suggested next move: ${nextStep}` : `当前建议下一步：${nextStep}`,
        isEnglish
          ? `${quickScanLabel} is best for finding the first problems. ${deepDiveLabel} is better after the evidence is complete enough to produce actions.`
          : '快速扫描适合先找问题，深度推演更适合在证据完整后生成可执行策略。',
      ]
    : [
        isEnglish
          ? `${setupFieldCount}/4 core fields are filled. Add the one-line concept, core loop, target audience, and validation goal first.`
          : `当前已完成 ${setupFieldCount}/4 个关键字段，建议先补齐一句话想法、核心循环、目标玩家、验证目标。`,
        isEnglish
          ? `There are ${evidenceCount} evidence items now. Aim for at least 3 before running ${quickScanLabel}.`
          : `当前证据 ${evidenceCount} 条，建议先累计到 3 条以上再跑快速扫描。`,
        isEnglish
          ? 'You can import a project JSON bundle, design Markdown, or TXT directly. There is no need to refill a sample template.'
          : '可以直接导入项目包 JSON、设计文档 Markdown 或 TXT，不需要按示例模板重填。',
        isEnglish
          ? 'The evidence page supports line-by-line pasted interviews, competitor notes, and playtest conclusions. One observation per line is clearest.'
          : '证据页支持逐行粘贴访谈、竞品观察、试玩结论，每行一条最清晰。',
        isEnglish
          ? `When ready, move to the Inference Desk and run ${quickScanLabel} for the first structured judgment.`
          : '准备好后进入“推理台”运行快速扫描，拿第一轮结构化判断。',
      ];

  return (
    <section className="page-grid">
      <article className="hero-panel">
        <p className="eyebrow">{isEnglish ? 'Mission Brief' : '任务简报'}</p>
        <h3>{displayIdeaSummary}</h3>
        <p className="hero-copy">{heroCopy}</p>
        <div className="signal-band">
          <div>
            <span>{isEnglish ? 'Core Fields' : '关键字段'}</span>
            <strong>{filledProjectFieldCount}/8</strong>
          </div>
          <div>
            <span>{isEnglish ? 'Evidence' : '当前证据'}</span>
            <strong>{isEnglish ? evidenceCount : `${evidenceCount} 条`}</strong>
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
          <span className="panel-badge">{isEnglish ? 'Blank start, no seeded sample' : '空白起步，不再默认示例'}</span>
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
        description={isEnglish ? 'Upload a project JSON bundle, design Markdown, or requirement TXT. Recognized project fields fill automatically, and the body is also converted into evidence cards.' : '上传项目包 JSON、设计文档 Markdown 或需求 TXT，命中项目字段时会自动回填；正文也会同步沉淀成证据卡。'}
        accept=".json,.md,.markdown,.txt"
        hint={isEnglish ? 'Recommended: project JSON bundle / design Markdown / requirement TXT' : '推荐上传：项目包 JSON / 设计文档 Markdown / 需求说明 TXT'}
        buttonLabel={isEnglish ? 'Choose Project File' : '选择项目文件'}
        feedback={projectImportFeedback}
        onImport={onImportProjectFile}
      />

      <section className="panel split-panel">
        <div>
          <p className="eyebrow">{isEnglish ? 'Decision Snapshot' : '判断快照'}</p>
          <h4>{decisionTitle}</h4>
          <p>{hasCompletedAnalysis ? summary : isEnglish ? 'Define the problem boundary first so the system is not forced to guess.' : '先把问题边界写清楚，系统给出的判断才不会像在猜。'}</p>
        </div>
        <ul className="bullet-list">
          {decisionBullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="metrics-row">
        {hasCompletedAnalysis ? (
          <>
            <MetricCard label={isEnglish ? 'Estimated Acceptance' : '玩家接受度预估'} value={`${playerAcceptance}%`} tone="good" />
            <MetricCard label={isEnglish ? 'Current Confidence' : '当前置信度'} value={`${confidence}%`} tone="info" />
            <MetricCard label={isEnglish ? 'Evidence Coverage' : '证据覆盖率'} value={`${supportRatio}%`} tone="alert" />
          </>
        ) : (
          <>
            <MetricCard label={isEnglish ? 'Project Readiness' : '项目准备度'} value={`${setupFieldCount}/4`} tone={projectReady ? 'good' : 'alert'} />
            <MetricCard label={isEnglish ? 'Evidence Count' : '证据数量'} value={isEnglish ? `${evidenceCount}` : `${evidenceCount} 条`} tone={evidenceReady ? 'good' : 'info'} />
            <MetricCard
              label={isEnglish ? 'Suggested Next Step' : '推荐下一步'}
              value={
                projectReady
                  ? evidenceReady
                    ? isEnglish
                      ? 'Open Inference Desk'
                      : '进入推理台'
                    : isEnglish
                      ? 'Add Evidence'
                      : '补证据'
                  : isEnglish
                    ? 'Fill Project'
                    : '填项目'
              }
              tone="info"
            />
          </>
        )}
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
                ? `${quickScanLabel} is better for the first structured read. Leave ${deepDiveLabel} for when the boundary is clearer and the evidence is fuller.`
                : '快速扫描更适合拿第一轮结构化判断。深度推演留到问题边界更清楚、证据更完整的时候。'
            }
          />
          <TimelineItem
            time="04"
            title={isEnglish ? 'Keep narrowing after the result' : '根据结果继续收敛'}
            detail={
              isEnglish
                ? 'Review modeling and strategy first, then decide whether to add evidence, rewrite the goal, or move into the full report.'
                : '先看建模和策略，再决定是继续补证据、重写目标，还是进入完整报告。'
            }
          />
        </div>
      </section>
    </section>
  );
}
