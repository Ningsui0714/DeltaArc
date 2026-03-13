import type {
  SandboxAnalysisJob,
  SandboxAnalysisJobStageStatus,
  SandboxAnalysisResult,
  SandboxTrajectorySignal,
} from '../../../shared/sandbox';
import { type UiLanguage, isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';
import type { EvidenceItem, ProjectSnapshot } from '../../types';
import { getAgentStageMeta } from '../../lib/agentStageMeta';
import { formatJobDuration, getJobProgressStats } from '../../lib/jobProgress';

type ForecastTimelinePanelProps = {
  project: ProjectSnapshot;
  evidenceItems: EvidenceItem[];
  analysis: SandboxAnalysisResult;
  progress: SandboxAnalysisJob | null;
  hasOfficialAnalysis: boolean;
  lastAnalysisAt: string;
  error: string | null;
  warnings: string[];
};

type FeedItem = {
  id: string;
  lane: 'intake' | 'runtime' | 'forecast' | 'community' | 'signal';
  state: 'pending' | 'running' | 'completed' | 'future' | 'error';
  eyebrow: string;
  title: string;
  summary: string;
  caption: string;
  badge: string;
  bullets: string[];
};

function getEvidenceLevelLabel(language: UiLanguage) {
  return {
    low: isEnglishUi(language) ? 'Low' : '低',
    medium: isEnglishUi(language) ? 'Medium' : '中',
    high: isEnglishUi(language) ? 'High' : '高',
  } as const;
}

function getTrajectoryDirectionLabel(language: UiLanguage): Record<SandboxTrajectorySignal['direction'], string> {
  const isEnglish = isEnglishUi(language);

  return {
    positive: isEnglish ? 'Positive' : '正向',
    mixed: isEnglish ? 'Mixed' : '双向',
    negative: isEnglish ? 'Negative' : '负向',
  };
}

const stageOrder = [
  'dossier',
  'systems',
  'psychology',
  'market',
  'production',
  'economy',
  'red_team',
  'synthesis',
  'refine',
] as const;

function trimCopy(value: string, fallback: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function shorten(value: string, maxLength = 96) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function formatClock(value: string | undefined, language: UiLanguage) {
  if (!value) {
    return isEnglishUi(language) ? 'Live' : '实时';
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat(isEnglishUi(language) ? 'en-US' : 'zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

function summarizeEvidence(evidenceItems: EvidenceItem[], language: UiLanguage) {
  const isEnglish = isEnglishUi(language);

  if (evidenceItems.length === 0) {
    return isEnglish
      ? 'No evidence has been imported yet, so the right-side timeline only shows missing inputs and the real run state.'
      : '还没有导入证据，右侧时间线目前只会显示输入缺口和真实运行状态。';
  }

  const topSources = evidenceItems
    .slice(0, 3)
    .map((item) => item.title)
    .join(' / ');

  return isEnglish
    ? `${evidenceItems.length} signals are loaded. The leading sources are ${topSources}.`
    : `已装载 ${evidenceItems.length} 条信号，当前最靠前的是 ${topSources}。`;
}

function getStageBadge(status: SandboxAnalysisJobStageStatus, language: UiLanguage) {
  const isEnglish = isEnglishUi(language);

  if (status === 'running') {
    return isEnglish ? 'Running' : '进行中';
  }

  if (status === 'completed') {
    return isEnglish ? 'Done' : '已完成';
  }

  if (status === 'error') {
    return isEnglish ? 'Error' : '异常';
  }

  return isEnglish ? 'Pending' : '排队中';
}

function buildRuntimeItems(
  progress: SandboxAnalysisJob | null,
  hasOfficialAnalysis: boolean,
  analysis: SandboxAnalysisResult,
  lastAnalysisAt: string,
  language: UiLanguage,
): FeedItem[] {
  const isEnglish = isEnglishUi(language);
  const agentStageMeta = getAgentStageMeta(language);
  if (!progress) {
    if (!hasOfficialAnalysis) {
      return [
        {
          id: 'runtime-awaiting',
          lane: 'runtime',
          state: 'pending',
          eyebrow: isEnglish ? 'Run State' : '运行状态',
          title: isEnglish ? 'Waiting for the formal forecast run' : '等待正式预测运行',
          summary: isEnglish
            ? 'Summaries only appear here after real LLM stages finish. The timeline will not be fabricated in advance.'
            : '这里只有真实 LLM 阶段完成后才会插入摘要，不会预先伪造时间线内容。',
          caption: isEnglish ? 'Not started' : '尚未启动',
          badge: isEnglish ? 'Guardrail' : '护栏',
          bullets: isEnglish
            ? ['Quick Scan will reveal the first structured read.', 'Deep Dive continues into timeline beats, community rhythms, and inflection signals.']
            : ['快速预测会先出现首轮结构化输出。', '深度预测会继续生成时间线、社区节奏和转折信号。'],
        },
      ];
    }

    return [
      {
        id: 'runtime-complete',
        lane: 'runtime',
        state: 'completed',
        eyebrow: isEnglish ? 'Formal Run' : '正式运行',
        title: trimCopy(analysis.report.headline || analysis.systemVerdict, isEnglish ? 'Formal forecast has been locked.' : '正式预测已经锁定'),
        summary: trimCopy(analysis.summary || analysis.report.summary, isEnglish ? 'This result comes from the full backend forecast pipeline.' : '这份结果来自后端完整预测链路。'),
        caption: lastAnalysisAt ? (isEnglish ? `Finished at ${lastAnalysisAt}` : `完成于 ${lastAnalysisAt}`) : isEnglish ? 'Latest formal output' : '最新正式结果',
        badge: isEnglish ? 'Formal' : '正式',
        bullets: [analysis.model, isEnglish ? `${analysis.pipeline.length} stages executed` : `共执行 ${analysis.pipeline.length} 个阶段`],
      },
    ];
  }

  return progress.stages
    .filter((stage) => stage.key !== 'complete' && stage.status !== 'pending')
    .map((stage) => {
      const meta = agentStageMeta[stage.key];
      const headline = stage.preview?.headline || meta?.agent || stage.label;
      const summary = stage.preview?.summary || meta?.handoff || stage.detail;
      const bullets = stage.preview?.bullets?.slice(0, 4) ?? [];
      const caption = [formatClock(stage.completedAt ?? stage.startedAt, language), stage.durationMs ? formatJobDuration(stage.durationMs, language) : '', stage.model ?? '']
        .filter(Boolean)
        .join(' / ');

      return {
        id: `runtime-${stage.key}`,
        lane: 'runtime',
        state: stage.status === 'running' ? 'running' : stage.status === 'error' ? 'error' : 'completed',
        eyebrow: meta ? `${meta.agent} / ${meta.role}` : stage.label,
        title: headline,
        summary,
        caption: caption || getStageBadge(stage.status, language),
        badge: getStageBadge(stage.status, language),
        bullets: bullets.length > 0 ? bullets : [meta?.handoff ?? stage.detail],
      };
    });
}

export function ForecastTimelinePanel({
  project,
  evidenceItems,
  analysis,
  progress,
  hasOfficialAnalysis,
  lastAnalysisAt,
  error,
  warnings,
}: ForecastTimelinePanelProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const evidenceLevelLabel = getEvidenceLevelLabel(language);
  const trajectoryDirectionLabel = getTrajectoryDirectionLabel(language);
  const agentStageMeta = getAgentStageMeta(language);
  const progressStats = progress ? getJobProgressStats(progress) : null;
  const laneStages = stageOrder.map((key) => {
    const liveStage = progress?.stages.find((stage) => stage.key === key);

    return {
      key,
      status: liveStage?.status ?? (hasOfficialAnalysis ? 'completed' : 'pending'),
      label: agentStageMeta[key]?.agent ?? key,
      role: agentStageMeta[key]?.role ?? key,
    };
  });

  const feedItems: FeedItem[] = [
    {
      id: 'intake-project',
      lane: 'intake',
      state: project.ideaSummary.trim().length > 0 ? 'completed' : 'pending',
      eyebrow: isEnglish ? 'Project Input' : '项目输入',
      title: trimCopy(project.name, isEnglish ? 'Untitled Project' : '未命名项目'),
      summary: trimCopy(project.ideaSummary, isEnglish ? 'Write the release question you want to predict in one clear sentence.' : '先把你要预测的发布问题写成一句话。'),
      caption: `${project.mode}${project.genre ? ` / ${project.genre}` : ''}`,
      badge: isEnglish ? 'Input' : '输入',
      bullets: [
        trimCopy(project.coreFantasy, isEnglish ? 'The core experience promise has not been defined yet.' : '核心体验还没有被明确定义。'),
        trimCopy(project.validationGoal, isEnglish ? 'The validation goal is still missing.' : '验证目标还没有写出来。'),
      ],
    },
    {
      id: 'intake-evidence',
      lane: 'intake',
      state: evidenceItems.length > 0 ? 'completed' : 'pending',
      eyebrow: isEnglish ? 'Evidence Input' : '证据输入',
      title: evidenceItems.length > 0 ? (isEnglish ? `${evidenceItems.length} evidence items loaded` : `${evidenceItems.length} 条证据已装载`) : isEnglish ? 'Evidence pack is still empty' : '证据包仍然为空',
      summary: summarizeEvidence(evidenceItems, language),
      caption: evidenceItems.length > 0 ? (isEnglish ? `${evidenceItems.length} inputs` : `${evidenceItems.length} 条输入`) : isEnglish ? 'Waiting for signals' : '等待信号',
      badge: isEnglish ? 'Evidence' : '证据',
      bullets: evidenceItems.slice(0, 3).map((item) => `${item.type}：${item.title}`),
    },
    ...buildRuntimeItems(progress, hasOfficialAnalysis, analysis, lastAnalysisAt, language),
    ...analysis.futureTimeline.slice(0, 4).map<FeedItem>((beat, index) => ({
      id: `forecast-${index}`,
      lane: 'forecast',
      state: 'future',
      eyebrow: isEnglish ? `Future Beat / ${beat.phase}` : `未来节点 / ${beat.phase}`,
      title: beat.expectedReaction,
      summary: beat.likelyShift,
      caption: beat.timing,
      badge: isEnglish ? 'Timeline' : '时间线',
      bullets: [
        isEnglish ? `Risk: ${beat.risk}` : `风险：${beat.risk}`,
        isEnglish ? `Move: ${beat.recommendedResponse}` : `动作：${beat.recommendedResponse}`,
        ...beat.watchSignals.slice(0, 2),
      ],
    })),
    ...analysis.communityRhythms.slice(0, 3).map<FeedItem>((rhythm, index) => ({
      id: `rhythm-${index}`,
      lane: 'community',
      state: 'future',
      eyebrow: isEnglish ? 'Community Rhythm' : '社区节奏',
      title: rhythm.name,
      summary: rhythm.pattern,
      caption: rhythm.timing,
      badge: isEnglish ? 'Rhythm' : '节奏',
      bullets: [
        isEnglish ? `Trigger: ${rhythm.trigger}` : `触发：${rhythm.trigger}`,
        isEnglish ? `Impact: ${rhythm.implication}` : `影响：${rhythm.implication}`,
      ],
    })),
    ...analysis.trajectorySignals.slice(0, 3).map<FeedItem>((signal, index) => ({
      id: `signal-${index}`,
      lane: 'signal',
      state: 'future',
      eyebrow: isEnglish ? `Trajectory Signal / ${trajectoryDirectionLabel[signal.direction]}` : `走势信号 / ${trajectoryDirectionLabel[signal.direction]}`,
      title: signal.signal,
      summary: signal.impact,
      caption: signal.timing,
      badge: isEnglish ? 'Signal' : '信号',
      bullets: [isEnglish ? `Suggested move: ${signal.recommendedMove}` : `建议动作：${signal.recommendedMove}`],
    })),
  ];

  return (
    <aside className="timeline-panel">
      <div className="timeline-panel-header">
        <div>
          <p className="eyebrow">{isEnglish ? 'Timeline Window' : '时间线窗口'}</p>
          <h2>{isEnglish ? 'Right-Side Forecast Stream' : '右侧推演流'}</h2>
          <p className="timeline-panel-copy">{isEnglish ? 'This side prioritizes run traces, stage summaries, and future beats instead of stacking long explanations.' : '这里优先展示运行轨迹、阶段摘要和未来节点，不再堆叠过多说明文字。'}</p>
        </div>
        <div className="chip-row">
          <span className="meta-chip">{hasOfficialAnalysis ? (isEnglish ? 'Formal outputs only' : '仅显示正式结果') : isEnglish ? 'No fabricated forecast' : '不伪造预测'}</span>
          <span className="meta-chip">
            {progressStats ? (isEnglish ? `Live ${progressStats.percent}%` : `实时 ${progressStats.percent}%`) : isEnglish ? `${analysis.futureTimeline.length} beats` : `${analysis.futureTimeline.length} 个节点`}
          </span>
        </div>
      </div>

      <section className="timeline-meta-strip">
        <article className="timeline-meta-pill">
          <span>{isEnglish ? 'Confidence' : '可信度'}</span>
          <strong>{hasOfficialAnalysis ? (isEnglish ? 'Locked' : '已锁定') : isEnglish ? 'Waiting' : '等待中'}</strong>
          <small>{hasOfficialAnalysis ? (isEnglish ? 'Remote formal output connected' : '已接入远端正式结果') : isEnglish ? 'No conclusion is written before a run starts' : '未运行前不会写结论'}</small>
        </article>
        <article className="timeline-meta-pill">
          <span>{isEnglish ? 'Evidence Coverage' : '证据覆盖'}</span>
          <strong>{hasOfficialAnalysis ? evidenceLevelLabel[analysis.evidenceLevel] : evidenceItems.length}</strong>
          <small>{hasOfficialAnalysis ? (isEnglish ? 'Coverage level' : '覆盖等级') : isEnglish ? 'Current signal count' : '当前信号数'}</small>
        </article>
        <article className="timeline-meta-pill">
          <span>{isEnglish ? 'Run Progress' : '运行阶段'}</span>
          <strong>{progressStats ? `${progressStats.completedStageCount}/${progressStats.actionableStageCount}` : isEnglish ? 'Idle' : '空闲'}</strong>
          <small>{progressStats ? formatJobDuration(progressStats.elapsedMs, language) : isEnglish ? 'Waiting to start' : '等待启动'}</small>
        </article>
      </section>

      <section className="timeline-lane">
        <div className="timeline-lane-heading">
          <p className="eyebrow">{isEnglish ? 'Agent Stages' : '代理阶段'}</p>
          <span className="meta-chip">{progress ? progress.currentStageLabel : isEnglish ? 'Stage Overview' : '阶段总览'}</span>
        </div>
        <div className="timeline-lane-strip">
          {laneStages.map((stage) => (
            <article key={stage.key} className={`timeline-lane-node status-${stage.status}`}>
              <span>{stage.label}</span>
              <small>{stage.role}</small>
            </article>
          ))}
        </div>
      </section>

      {progress && progressStats ? (
        <section className="timeline-live-run">
          <div className="run-progress-track" aria-hidden="true">
            <div className="run-progress-fill" style={{ width: `${progressStats.percent}%` }} />
          </div>
          <div className="timeline-live-run-copy">
            <strong>{progress.currentStageLabel}</strong>
            <span>{progress.message}</span>
          </div>
        </section>
      ) : null}

      <div className="timeline-scroll-window">
        <div className="timeline-feed">
          {feedItems.map((item) => (
            <article key={item.id} className={`timeline-feed-item state-${item.state} lane-${item.lane}`}>
              <div className="timeline-feed-rail" aria-hidden="true">
                <span className="timeline-feed-dot" />
              </div>
              <div className="timeline-feed-body">
                <div className="timeline-feed-topline">
                  <span className="timeline-feed-eyebrow">{item.eyebrow}</span>
                  <span className="meta-chip">{item.caption}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                {item.bullets.length > 0 ? (
                  <ul className="compact-bullets">
                    {item.bullets.map((bullet) => (
                      <li key={bullet}>{shorten(bullet, 108)}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="timeline-feed-footer">
                  <span className="tiny-chip">{item.badge}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {error ? <p className="status-error">{error}</p> : null}
        {warnings.length > 0 ? (
          <ul className="bullet-list">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
