import type {
  SandboxAnalysisJob,
  SandboxAnalysisJobStage,
  SandboxAnalysisResult,
  SandboxAnalysisStageKey,
} from '../../../shared/sandbox';
import { type UiLanguage, isEnglishUi } from '../../hooks/useUiLanguage';
import { getAgentStageMeta } from '../../lib/agentStageMeta';
import {
  formatJobDuration,
  getJobProgressStats,
  isAnalysisJobActive,
  isAnalysisJobFailed,
} from '../../lib/jobProgress';
import { trimCopy } from '../../lib/trimCopy';
import type { EvidenceItem, ProjectSnapshot, StepId } from '../../types';

export type GraphCardStatus = 'pending' | 'running' | 'completed' | 'error';
export type GraphZone = 'inputs' | 'brief' | 'agents' | 'forecast';

type PredictionGraphModule = {
  status: GraphCardStatus;
  title: string;
  summary: string;
  metrics: string[];
};

type PredictionGraphAgentCard = PredictionGraphModule & {
  key: string;
  role: string;
};

export type PredictionGraphViewModel = {
  focusZone: GraphZone;
  liveZone: GraphZone | null;
  progressChip: string;
  trustTone: 'trust-high' | 'trust-medium' | 'trust-low';
  trustLabel: string;
  graphHeadline: string;
  graphSummary: string;
  inputsStat: string;
  agentsStat: string;
  timelineStat: string;
  projectModeLabel: string;
  projectCard: PredictionGraphModule;
  evidenceCard: PredictionGraphModule;
  dossierCard: PredictionGraphModule;
  dossierRole: string;
  liveRun: {
    isActive: boolean;
    percent: number;
    label: string;
    message: string;
  };
  agentCards: PredictionGraphAgentCard[];
  synthesisCard: PredictionGraphModule;
  refineCard: PredictionGraphModule;
  reportCard: PredictionGraphModule;
};

const agentStageKeys = [
  'systems',
  'psychology',
  'market',
  'production',
  'economy',
  'red_team',
] as const;

function shorten(value: string, maxLength = 116) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function resolveStage(progress: SandboxAnalysisJob | null, key: SandboxAnalysisStageKey) {
  return progress?.stages.find((stage) => stage.key === key);
}

function resolveStageStatus(
  stage: SandboxAnalysisJobStage | undefined,
  hasViewableAnalysis: boolean,
): GraphCardStatus {
  if (stage) {
    return stage.status;
  }

  return hasViewableAnalysis ? 'completed' : 'pending';
}

export function getStatusLabel(status: GraphCardStatus, language: UiLanguage = 'zh') {
  const isEnglish = isEnglishUi(language);

  if (status === 'running') {
    return isEnglish ? 'Running' : '进行中';
  }

  if (status === 'completed') {
    return isEnglish ? 'Ready' : '已就绪';
  }

  if (status === 'error') {
    return isEnglish ? 'Error' : '异常';
  }

  return isEnglish ? 'Pending' : '排队中';
}

function getFocusZone(activeStep: StepId): GraphZone {
  if (activeStep === 'overview' || activeStep === 'evidence') {
    return 'inputs';
  }

  if (activeStep === 'modeling') {
    return 'agents';
  }

  return 'forecast';
}

function getLiveZone(stageKey?: SandboxAnalysisStageKey): GraphZone | null {
  if (!stageKey || stageKey === 'queued') {
    return null;
  }

  if (stageKey === 'dossier') {
    return 'brief';
  }

  if (stageKey === 'synthesis' || stageKey === 'refine' || stageKey === 'complete') {
    return 'forecast';
  }

  return 'agents';
}

function getLatestPreviewStage(progress: SandboxAnalysisJob | null) {
  if (!progress) {
    return null;
  }

  return [...progress.stages]
    .filter((stage) => stage.preview)
    .sort((left, right) => {
      const leftTime = Date.parse(left.completedAt ?? left.startedAt ?? progress.createdAt);
      const rightTime = Date.parse(right.completedAt ?? right.startedAt ?? progress.createdAt);
      return rightTime - leftTime;
    })[0] ?? null;
}

export function getColumnClass(zone: GraphZone, focusZone: GraphZone, liveZone: GraphZone | null) {
  const classes = ['graph-flow-column'];

  if (zone === focusZone) {
    classes.push('is-focused');
  }

  if (zone === liveZone) {
    classes.push('is-live');
  }

  return classes.join(' ');
}

export function buildPredictionGraphViewModel(params: {
  activeStep: StepId;
  project: ProjectSnapshot;
  evidenceItems: EvidenceItem[];
  analysis: SandboxAnalysisResult;
  progress: SandboxAnalysisJob | null;
  hasViewableAnalysis: boolean;
  isAnalysisFresh: boolean;
  isAnalysisStale: boolean;
  isAnalysisDegraded: boolean;
  language?: UiLanguage;
}): PredictionGraphViewModel {
  const {
    activeStep,
    project,
    evidenceItems,
    analysis,
    progress,
    hasViewableAnalysis,
    isAnalysisFresh,
    isAnalysisStale,
    isAnalysisDegraded,
    language = 'zh',
  } = params;
  const isEnglish = isEnglishUi(language);
  const agentStageMeta = getAgentStageMeta(language);
  const progressStats = progress ? getJobProgressStats(progress) : null;
  const isProgressActive = isAnalysisJobActive(progress);
  const hasProgressError = isAnalysisJobFailed(progress);
  const focusZone = getFocusZone(activeStep);
  const liveZone = getLiveZone(progress?.currentStageKey);
  const dossierStage = resolveStage(progress, 'dossier');
  const synthesisStage = resolveStage(progress, 'synthesis');
  const refineStage = resolveStage(progress, 'refine');
  const latestPreviewStage = getLatestPreviewStage(progress);
  const projectStatus: GraphCardStatus =
    project.name.trim().length > 0 || project.ideaSummary.trim().length > 0 ? 'completed' : 'pending';
  const evidenceStatus: GraphCardStatus = evidenceItems.length > 0 ? 'completed' : 'pending';

  const agentCards = agentStageKeys.map((key) => {
    const stage = resolveStage(progress, key);
    const meta = agentStageMeta[key];

    return {
      key,
      title: meta?.agent ?? key,
      role: meta?.role ?? stage?.label ?? key,
      summary: shorten(
        stage?.preview?.summary ||
          meta?.handoff ||
          stage?.detail ||
          (isEnglish ? 'Waiting for dispatch.' : '等待派发。'),
      ),
      status: resolveStageStatus(stage, hasViewableAnalysis),
      metrics: [stage?.model, stage?.durationMs ? formatJobDuration(stage.durationMs, language) : '']
        .filter((value): value is string => Boolean(value))
        .slice(0, 2),
    };
  });

  const forecastReportStatus: GraphCardStatus = hasViewableAnalysis
    ? 'completed'
    : hasProgressError
      ? 'error'
      : isProgressActive && progress?.currentStageKey === 'complete'
        ? 'running'
        : 'pending';
  const runningAgentCount = progressStats?.runningStageCount ?? 0;
  const completedAgentCount = progressStats?.completedStageCount ?? (hasViewableAnalysis ? agentCards.length + 3 : 0);

  const connectedLabel = isAnalysisFresh
    ? isEnglish
      ? 'Latest strategy output'
      : '最新策略结果'
    : isAnalysisDegraded
      ? isEnglish
        ? 'Degraded strategy output'
        : '降级策略结果'
      : isAnalysisStale
        ? isEnglish
          ? 'Stale strategy output'
          : '过期策略结果'
        : isEnglish
          ? 'Viewable strategy output'
          : '可查看策略结果';
  const connectedSummary = isAnalysisFresh
    ? trimCopy(
        analysis.report.summary || analysis.summary,
        isEnglish ? 'Strategy output connected.' : '策略结果已接入。',
      )
    : isAnalysisDegraded
      ? isEnglish
        ? 'Fallback was used in part of the run. Review with caution.'
        : '本次结果包含回退处理，请谨慎使用。'
      : isAnalysisStale
        ? isEnglish
          ? 'Inputs changed after this run. Output is viewable but not fresh.'
          : '输入已变化，结果可查看但不再是最新。'
        : isEnglish
          ? 'Strategy output available.'
          : '策略结果可查看。';

  return {
    focusZone,
    liveZone,
    progressChip: progressStats
      ? isProgressActive
        ? isEnglish
          ? `Live ${progressStats.percent}%`
          : `实时进度 ${progressStats.percent}%`
        : hasProgressError
          ? isEnglish
            ? `Failed ${progressStats.percent}%`
            : `失败于 ${progressStats.percent}%`
          : isEnglish
            ? `Live ${progressStats.percent}%`
            : `实时进度 ${progressStats.percent}%`
      : hasProgressError
        ? isEnglish
          ? 'Run failed'
          : '运行失败'
      : hasViewableAnalysis
        ? connectedLabel
        : isEnglish
          ? 'Not started'
          : '尚未运行',
    trustTone: hasViewableAnalysis
      ? isAnalysisFresh
        ? 'trust-high'
        : 'trust-medium'
      : isProgressActive
        ? 'trust-medium'
        : 'trust-low',
    trustLabel: hasViewableAnalysis
      ? connectedLabel
      : isProgressActive
        ? isEnglish
          ? 'Live run in progress'
          : '实时任务进行中'
        : hasProgressError
          ? progress?.retryable
            ? isEnglish
              ? 'Run failed, resume available'
              : '运行失败，可续跑'
            : isEnglish
              ? 'Run failed'
              : '运行失败'
          : isEnglish
            ? 'Waiting for strategy run'
            : '等待策略运行',
    graphHeadline: isProgressActive || hasProgressError
      ? progress?.currentStageLabel ?? (isEnglish ? 'Strategy run state' : '策略运行状态')
      : hasViewableAnalysis
        ? connectedLabel
        : isEnglish
          ? 'Strategy graph waiting to start'
          : '策略图谱待启动',
    graphSummary: isProgressActive || hasProgressError
      ? progress?.message ?? (isEnglish ? 'Run status unavailable.' : '运行状态暂不可用。')
      : hasViewableAnalysis
        ? connectedSummary
        : isEnglish
          ? 'Waiting for strategy run.'
          : '等待策略运行。',
    inputsStat: evidenceItems.length > 0 ? (isEnglish ? `${evidenceItems.length} signals` : `${evidenceItems.length} 条信号`) : isEnglish ? 'Waiting for inputs' : '等待输入',
    agentsStat: progressStats
      ? isEnglish
        ? `Running ${runningAgentCount} / Done ${completedAgentCount}`
        : `进行中 ${runningAgentCount} / 已完成 ${completedAgentCount}`
      : hasViewableAnalysis
        ? isEnglish
          ? 'All merged'
          : '已全部汇总'
        : isEnglish
          ? 'Not dispatched'
          : '尚未派发',
    timelineStat: hasViewableAnalysis
      ? isEnglish
        ? `${analysis.futureTimeline.length} beats`
        : `${analysis.futureTimeline.length} 个扩散节点`
      : isEnglish
        ? 'Locked'
        : '尚未解锁',
    projectModeLabel: formatProjectMode(project.mode, language),
    projectCard: {
      status: projectStatus,
      title: trimCopy(project.name, isEnglish ? 'Untitled Task' : '未命名传播任务'),
      summary: shorten(
        trimCopy(
          project.ideaSummary,
          isEnglish
            ? 'Add the strategy question.'
            : '请补充本次传播任务的问题定义。',
        ),
      ),
      metrics: [project.genre, project.platforms[0], project.validationGoal ? (isEnglish ? 'Validation goal set' : '已设置验证目标') : ''].filter(
        (value): value is string => Boolean(value),
      ),
    },
    evidenceCard: {
      status: evidenceStatus,
      title: evidenceItems.length > 0
        ? isEnglish
          ? `${evidenceItems.length} signals loaded`
          : `${evidenceItems.length} 条信号已加载`
        : isEnglish
          ? 'Evidence set is still empty'
          : '证据集仍为空',
      summary:
        evidenceItems.length > 0
          ? shorten(
              evidenceItems
                .slice(0, 2)
                .map((item) => item.title)
                .join(' / '),
            )
          : isEnglish
            ? 'No evidence yet.'
            : '暂无证据。',
      metrics: evidenceItems.slice(0, 3).map((item) => item.type),
    },
    dossierCard: {
      status: resolveStageStatus(dossierStage, hasViewableAnalysis),
      title: dossierStage?.preview?.headline || (isEnglish ? 'Unified Strategy Brief' : '统一策略摘要'),
      summary: shorten(
        dossierStage?.preview?.summary ||
          dossierStage?.detail ||
          (isEnglish ? 'Shared brief ready for agent dispatch.' : '共享摘要已准备，可派发到各 Agent。'),
      ),
      metrics: [],
    },
    dossierRole: isEnglish ? 'Shared Brief' : '共享摘要',
    liveRun: {
      isActive: isProgressActive || hasProgressError,
      percent: progressStats?.percent ?? 0,
      label: progress?.currentStageLabel ?? (isEnglish ? 'Waiting for strategy run' : '等待策略运行'),
      message: progress?.message ?? (isEnglish ? 'Run not started yet.' : '尚未启动运行。'),
    },
    agentCards,
    synthesisCard: {
      status: resolveStageStatus(synthesisStage, hasViewableAnalysis),
      title: synthesisStage?.preview?.headline || (isEnglish ? 'Diffusion Evolution' : '扩散演化'),
      summary: shorten(
        synthesisStage?.preview?.summary ||
          (isEnglish ? 'Evolution signals are merged here.' : '扩散演化信号会在这里汇总。'),
      ),
      metrics: [],
    },
    refineCard: {
      status: resolveStageStatus(refineStage, hasViewableAnalysis),
      title: refineStage?.preview?.headline || (isEnglish ? 'Strategy Report Structuring' : '策略报告结构化'),
      summary: shorten(
        refineStage?.preview?.summary ||
          (isEnglish ? 'Final strategy report cleanup.' : '最终策略报告收敛整理。'),
      ),
      metrics: [],
    },
    reportCard: {
      status: forecastReportStatus,
      title: hasViewableAnalysis
        ? trimCopy(
            analysis.report.headline || analysis.systemVerdict,
            isEnglish ? 'Strategy report generated.' : '策略报告已生成。',
          )
        : latestPreviewStage?.preview?.headline ||
          (isEnglish ? 'Timeline locked.' : '扩散演化尚未解锁。'),
      summary: hasViewableAnalysis
        ? shorten(connectedSummary)
        : isEnglish
          ? 'Waiting for run completion.'
          : '等待运行完成。',
      metrics: [
        hasViewableAnalysis ? (isEnglish ? `${analysis.futureTimeline.length} evolution beats` : `${analysis.futureTimeline.length} 个扩散节点`) : '',
        hasViewableAnalysis ? (isEnglish ? `${analysis.communityRhythms.length} community rhythms` : `${analysis.communityRhythms.length} 个社群节奏`) : '',
        latestPreviewStage?.model ?? '',
      ].filter((value): value is string => Boolean(value)),
    },
  };
}

function formatProjectMode(mode: ProjectSnapshot['mode'], language: UiLanguage = 'zh') {
  const isEnglish = isEnglishUi(language);

  if (mode === 'Concept') {
    return isEnglish ? 'Planning' : '策划中';
  }

  if (mode === 'Validation') {
    return isEnglish ? 'Trial Launch' : '试投中';
  }

  return isEnglish ? 'Active Operation' : '在运营';
}
