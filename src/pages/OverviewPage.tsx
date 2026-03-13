import type { StepId } from '../types';
import { MetricCard } from '../components/ui/MetricCard';
import { TimelineItem } from '../components/ui/TimelineItem';
import type { ProjectSnapshot } from '../types';
import { ProjectEditorCard } from '../components/project/ProjectEditorCard';
import { FileImportCard, type ImportFeedback } from '../components/import/FileImportCard';

type OverviewPageProps = {
  project: ProjectSnapshot;
  playerAcceptance: number;
  confidence: number;
  supportRatio: number;
  systemVerdict: string;
  summary: string;
  nextStep: string;
  onProjectChange: (patch: Partial<ProjectSnapshot>) => void;
  onResetProject: () => void;
  onLoadDemoProject: () => void;
  onClearEvidence: () => void;
  onLoadDemoEvidence: () => void;
  projectImportFeedback: ImportFeedback | null;
  onImportProjectFile: (file: File) => Promise<void>;
  onNavigate: (step: StepId) => void;
};

export function OverviewPage({
  project,
  playerAcceptance,
  confidence,
  supportRatio,
  systemVerdict,
  summary,
  nextStep,
  onProjectChange,
  onResetProject,
  onLoadDemoProject,
  onClearEvidence,
  onLoadDemoEvidence,
  projectImportFeedback,
  onImportProjectFile,
  onNavigate,
}: OverviewPageProps) {
  const displayIdeaSummary = project.ideaSummary || '先填写你的游戏玩法或系统想法，再开始做沙盒推演。';
  const displayCoreLoop = project.coreLoop || '先补充核心循环，例如：探索 -> 战斗 -> 收集 -> 成长。';
  const displayCoreFantasy = project.coreFantasy || '先写清楚玩家为什么愿意留下来。';
  const displayValidationGoal = project.validationGoal || '先把这轮验证目标写成一句能判输赢的话。';
  const displayCurrentStatus = project.currentStatus || '先写下当前最担心的问题，例如学习成本、数值风险或玩家接受度。';
  const displayTargetPlayers =
    project.targetPlayers.length > 0 ? project.targetPlayers.join(' / ') : '先定义目标玩家分层。';
  const displayReferenceGames =
    project.referenceGames.length > 0 ? project.referenceGames.join(' / ') : '先列出参考游戏和替代品。';
  const displayProductionConstraints =
    project.productionConstraints || '先写清制作约束，否则后续判断很容易虚高。';

  return (
    <section className="page-grid">
      <article className="hero-panel">
        <p className="eyebrow">Mission Brief</p>
        <h3>{displayIdeaSummary}</h3>
        <p className="hero-copy">{summary}</p>
        <div className="signal-band">
          <div>
            <span>核心循环</span>
            <strong>{displayCoreLoop}</strong>
          </div>
          <div>
            <span>核心体验</span>
            <strong>{displayCoreFantasy}</strong>
          </div>
          <div>
            <span>验证目标</span>
            <strong>{displayValidationGoal}</strong>
          </div>
          <div>
            <span>当前状态</span>
            <strong>{displayCurrentStatus}</strong>
          </div>
        </div>
      </article>

      <ProjectEditorCard
        project={project}
        onProjectChange={onProjectChange}
        onResetProject={onResetProject}
        onLoadDemoProject={onLoadDemoProject}
        onClearEvidence={onClearEvidence}
        onLoadDemoEvidence={onLoadDemoEvidence}
      />

      <FileImportCard
        title="导入项目文件"
        description="上传项目包 JSON，或上传你的设计文档 Markdown。命中项目模板时会自动回填项目字段；正文也会同时沉淀成证据卡。"
        accept=".json,.md,.markdown,.txt"
        hint="推荐上传：项目包 JSON / 设计文档 Markdown / 需求说明 TXT"
        buttonLabel="选择项目文件"
        feedback={projectImportFeedback}
        onImport={onImportProjectFile}
      />

      <section className="panel split-panel">
        <div>
          <p className="eyebrow">Decision Snapshot</p>
          <h4>{systemVerdict}</h4>
        </div>
        <ul className="bullet-list">
          <li>目标玩家：{displayTargetPlayers}</li>
          <li>参考游戏：{displayReferenceGames}</li>
          <li>制作约束：{displayProductionConstraints}</li>
          <li>当前建议下一步：{nextStep}</li>
          <li>这一版项目输入已经卡死在游戏产品语境，不再是泛产品表单。</li>
        </ul>
      </section>

      <section className="metrics-row">
        <MetricCard label="玩家接受度预估" value={`${playerAcceptance}%`} tone="good" />
        <MetricCard label="当前置信度" value={`${confidence}%`} tone="info" />
        <MetricCard label="证据覆盖率" value={`${supportRatio}%`} tone="alert" />
      </section>

      <section className="panel timeline-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Recent Runs</p>
            <h4>最近推演记录</h4>
          </div>
          <button type="button" className="inline-button" onClick={() => onNavigate('evidence')}>
            继续补证据
          </button>
        </div>
        <div className="timeline-list">
          <TimelineItem time="现在" title="多阶段沙盒推演" detail="会先抽取 dossier，再分视角拆解，最后综合与自修正。" />
          <TimelineItem time="前一轮" title="证据导入与编辑" detail="项目字段、Markdown、JSON 和证据卡都可以直接导入。" />
          <TimelineItem time="起点" title="项目定义" detail="先写清楚你要验证的核心体验，再让推演替你扩张问题边界。" />
        </div>
      </section>
    </section>
  );
}
