import type {
  SandboxAnalysisJob,
  SandboxAnalysisJobStageStatus,
  SandboxAnalysisResult,
  SandboxTrajectorySignal,
} from '../../../shared/sandbox';
import { filterVisibleAnalysisWarnings } from '../../../shared/analysisWarnings';
import { type UiLanguage, isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';
import type { EvidenceItem, ProjectSnapshot } from '../../types';
import { getAgentStageMeta } from '../../lib/agentStageMeta';
import {
  formatJobDuration,
  getJobProgressStats,
  isAnalysisJobActive,
  isAnalysisJobFailed,
} from '../../lib/jobProgress';
import { trimCopy } from '../../lib/trimCopy';

type ForecastTimelinePanelProps = {
  project: ProjectSnapshot;
  evidenceItems: EvidenceItem[];
  analysis: SandboxAnalysisResult;
  progress: SandboxAnalysisJob | null;
  hasViewableAnalysis: boolean;
  isAnalysisFresh: boolean;
  isAnalysisStale: boolean;
  isAnalysisDegraded: boolean;
  lastCompletedAt: string;
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
    return isEnglish ? 'No evidence imported yet.' : '还没有导入证据。';
  }

  const topSources = evidenceItems
    .slice(0, 3)
    .map((item) => item.title)
    .join(' / ');

  return isEnglish ? `${evidenceItems.length} signals loaded: ${topSources}` : `已装载 ${evidenceItems.length} 条信号：${topSources}`;
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
  hasViewableAnalysis: boolean,
  isAnalysisFresh: boolean,
  isAnalysisStale: boolean,
  isAnalysisDegraded: boolean,
  analysis: SandboxAnalysisResult,
  lastCompletedAt: string,
  language: UiLanguage,
): FeedItem[] {
  const isEnglish = isEnglishUi(language);
  const agentStageMeta = getAgentStageMeta(language);

  if (!progress) {
    if (!hasViewableAnalysis) {
      return [
        {
          id: 'runtime-awaiting',
          lane: 'runtime',
          state: 'pending',
          eyebrow: isEnglish ? 'Run State' : '运行状态',
          title: isEnglish ? 'Waiting for the formal diagnosis to start' : '等待正式诊断启动',
          summary: isEnglish ? 'Not started yet.' : '尚未启动。',
          caption: isEnglish ? 'Not started' : '尚未启动',
          badge: isEnglish ? 'Waiting' : '等待中',
          bullets: [],
        },
      ];
    }

    const runtimeBadge = isAnalysisFresh
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

    return [
      {
        id: 'runtime-complete',
        lane: 'runtime',
        state: 'completed',
        eyebrow: isEnglish ? 'Formal Diagnosis' : '正式诊断',
        title: trimCopy(
          analysis.report.headline || analysis.systemVerdict,
          isEnglish ? 'Formal strategy result has been locked.' : '正式策略结果已经锁定',
        ),
        summary: isAnalysisFresh
          ? trimCopy(
            analysis.summary || analysis.report.summary,
              isEnglish ? 'Formal strategy result ready.' : '正式策略结果已就绪。',
            )
          : isAnalysisDegraded
            ? isEnglish
              ? 'Fallback was used in part of the run. Review with caution.'
              : '本次结果包含回退处理，解读时请更谨慎。'
            : isAnalysisStale
              ? isEnglish
                ? 'Inputs changed after this run. Result is viewable but not fresh.'
                : '运行完成后输入已变化，这份结果可看但不再是最新。'
              : isEnglish
                ? 'Formal result is available.'
                : '正式策略结果可查看。',
        caption: lastCompletedAt
          ? isEnglish
            ? `Completed at ${formatClock(lastCompletedAt, language)}`
            : `完成于 ${formatClock(lastCompletedAt, language)}`
          : isEnglish
            ? 'Latest formal output'
            : '最新正式策略结果',
        badge: runtimeBadge,
        bullets: [
          analysis.model,
          isEnglish ? `${analysis.pipeline.length} stages executed` : `共执行 ${analysis.pipeline.length} 个阶段`,
          isAnalysisFresh
            ? isEnglish
              ? 'This output matches the current inputs.'
              : '这份输出仍与当前输入一致。'
            : isEnglish
              ? 'Rerun recommended before treating this as the latest truth source.'
              : '把它当成最新真相源之前，建议先重跑。',
        ],
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
      const caption = [
        formatClock(stage.completedAt ?? stage.startedAt, language),
        stage.durationMs ? formatJobDuration(stage.durationMs, language) : '',
        stage.model ?? '',
      ]
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
  hasViewableAnalysis,
  isAnalysisFresh,
  isAnalysisStale,
  isAnalysisDegraded,
  lastCompletedAt,
  error,
  warnings,
}: ForecastTimelinePanelProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const evidenceLevelLabel = getEvidenceLevelLabel(language);
  const trajectoryDirectionLabel = getTrajectoryDirectionLabel(language);
  const agentStageMeta = getAgentStageMeta(language);
  const progressStats = progress ? getJobProgressStats(progress) : null;
  const isProgressActive = isAnalysisJobActive(progress);
  const hasProgressError = isAnalysisJobFailed(progress);
  const laneStages = stageOrder.map((key) => {
    const liveStage = progress?.stages.find((stage) => stage.key === key);

    return {
      key,
      status: liveStage?.status ?? (hasViewableAnalysis ? 'completed' : 'pending'),
      label: agentStageMeta[key]?.agent ?? key,
      role: agentStageMeta[key]?.role ?? key,
    };
  });

  const resultStateLabel = hasViewableAnalysis
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
      ? 'Waiting'
      : '等待中';
  const visibleWarnings = filterVisibleAnalysisWarnings(warnings);

  const feedItems: FeedItem[] = [
    {
      id: 'intake-project',
      lane: 'intake',
      state: project.ideaSummary.trim().length > 0 ? 'completed' : 'pending',
      eyebrow: isEnglish ? 'Project Input' : '项目输入',
      title: trimCopy(project.name, isEnglish ? 'Untitled Project' : '未命名项目'),
      summary: trimCopy(project.ideaSummary, isEnglish ? 'Add the strategy question.' : '请补充策略问题。'),
      caption: `${project.mode}${project.genre ? ` / ${project.genre}` : ''}`,
      badge: isEnglish ? 'Input' : '输入',
      bullets: [
        trimCopy(project.coreFantasy, isEnglish ? 'Core experience not written yet.' : '核心体验尚未填写。'),
        trimCopy(project.validationGoal, isEnglish ? 'Validation goal not written yet.' : '验证目标尚未填写。'),
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
    ...buildRuntimeItems(
      progress,
      hasViewableAnalysis,
      isAnalysisFresh,
      isAnalysisStale,
      isAnalysisDegraded,
      analysis,
      lastCompletedAt,
      language,
    ),
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
          <h2>{isEnglish ? 'Right-Side Strategy Stream' : '右侧策略流'}</h2>
        </div>
        <div className="chip-row">
          <span className="meta-chip">
            {hasViewableAnalysis
              ? isAnalysisFresh
                ? isEnglish
                  ? 'Fresh formal output'
                  : '最新正式策略结果'
                : isAnalysisDegraded
                  ? isEnglish
                    ? 'Degraded output'
                    : '降级结果'
                  : isAnalysisStale
                    ? isEnglish
                      ? 'Stale output'
                      : '过期结果'
                    : isEnglish
                      ? 'Viewable output'
                      : '可查看结果'
              : isEnglish
                ? 'Waiting for output'
                : '等待正式策略结果'}
          </span>
          <span className="meta-chip">
            {progressStats
              ? isProgressActive
                ? isEnglish
                  ? `Live ${progressStats.percent}%`
                  : `实时 ${progressStats.percent}%`
                : hasProgressError
                  ? isEnglish
                    ? `Failed ${progressStats.percent}%`
                    : `失败于 ${progressStats.percent}%`
                  : isEnglish
                    ? `Live ${progressStats.percent}%`
                    : `实时 ${progressStats.percent}%`
              : isEnglish
                ? `${analysis.futureTimeline.length} beats`
                : `${analysis.futureTimeline.length} 个节点`}
          </span>
        </div>
      </div>

      <section className="timeline-meta-strip">
        <article className="timeline-meta-pill">
          <span>{isEnglish ? 'Result State' : '结果状态'}</span>
          <strong>{resultStateLabel}</strong>
        </article>
        <article className="timeline-meta-pill">
          <span>{isEnglish ? 'Evidence Coverage' : '证据覆盖'}</span>
          <strong>{hasViewableAnalysis ? evidenceLevelLabel[analysis.evidenceLevel] : evidenceItems.length}</strong>
        </article>
        <article className="timeline-meta-pill">
          <span>{isEnglish ? 'This Run Duration' : '本次已运行'}</span>
          <strong>{progressStats ? formatJobDuration(progressStats.elapsedMs, language) : isEnglish ? 'Idle' : '空闲'}</strong>
        </article>
      </section>

      <section className="timeline-lane">
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
            <span>{`${progressStats.percent}% / ${formatJobDuration(progressStats.elapsedMs, language)}`}</span>
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
        {visibleWarnings.length > 0 ? (
          <ul className="bullet-list">
            {visibleWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
