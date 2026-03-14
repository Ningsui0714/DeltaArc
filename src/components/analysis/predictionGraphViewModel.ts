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
          (isEnglish ? 'Waiting for the shared brief to dispatch work.' : '等待共享简报分发。'),
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
      ? 'Fresh formal output'
      : '最新正式结果'
    : isAnalysisDegraded
      ? isEnglish
        ? 'Degraded formal output'
        : '降级正式结果'
      : isAnalysisStale
        ? isEnglish
          ? 'Stale formal output'
          : '过期正式结果'
        : isEnglish
          ? 'Viewable formal output'
          : '可查看正式结果';
  const connectedSummary = isAnalysisFresh
    ? trimCopy(
        analysis.report.summary || analysis.summary,
        isEnglish ? 'The formal output is already attached to this workspace.' : '正式结果已经挂到当前工作区。',
      )
    : isAnalysisDegraded
      ? isEnglish
        ? 'A later stage failed, but cached earlier outputs were preserved and remain connected here.'
        : '后续阶段曾失败，但前面已缓存的输出被保留了下来，并继续挂在这里。'
      : isAnalysisStale
        ? isEnglish
          ? 'The connected output was generated before the current inputs changed, so it is still viewable but no longer fresh.'
          : '当前挂接结果生成于本轮输入变化之前，因此它仍可查看，但已经不是最新状态。'
        : isEnglish
          ? 'A formal output remains connected to this workspace.'
          : '当前工作区仍挂着一份正式结果。';

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
          : '实时运行中'
        : hasProgressError
          ? progress?.retryable
            ? isEnglish
              ? 'Run failed, resume available'
              : '运行失败，可继续重试'
            : isEnglish
              ? 'Run failed'
              : '运行失败'
      : isEnglish
          ? 'Waiting for formal run'
          : '等待正式推理',
    graphHeadline: isProgressActive || hasProgressError
      ? progress?.currentStageLabel ?? (isEnglish ? 'Formal run state' : '正式推理状态')
      : hasViewableAnalysis
        ? connectedLabel
        : isEnglish
          ? 'Prediction graph waiting to start'
          : '预测图谱待启动',
    graphSummary: isProgressActive || hasProgressError
      ? progress?.message ?? (isEnglish ? 'Formal run state is currently unavailable.' : '当前正式推理状态暂不可用。')
      : hasViewableAnalysis
        ? connectedSummary
        : isEnglish
          ? 'Before the backend run starts, this area only shows inputs and structure. It will not fake a conclusion.'
          : '没有启动后端运行前，这里只显示输入和结构，不会提前伪造结论。',
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
        : `${analysis.futureTimeline.length} 个节点`
      : isEnglish
        ? 'Locked'
        : '尚未解锁',
    projectModeLabel: formatProjectMode(project.mode, language),
    projectCard: {
      status: projectStatus,
      title: trimCopy(project.name, isEnglish ? 'Untitled Project' : '未命名项目'),
      summary: shorten(
        trimCopy(
          project.ideaSummary,
          isEnglish
            ? 'Write down the release question you want to predict before sending it into the later reasoning graph.'
            : '先把这次要预测的发布问题写清楚，再送进后面的推演图谱。',
        ),
      ),
      metrics: [project.genre, project.platforms[0], project.validationGoal ? (isEnglish ? 'Validation goal set' : '已有验证目标') : ''].filter(
        (value): value is string => Boolean(value),
      ),
    },
    evidenceCard: {
      status: evidenceStatus,
      title: evidenceItems.length > 0
        ? isEnglish
          ? `${evidenceItems.length} signals loaded`
          : `${evidenceItems.length} 条信号已装载`
        : isEnglish
          ? 'Evidence pack is still empty'
          : '证据包还是空的',
      summary:
        evidenceItems.length > 0
          ? shorten(
              evidenceItems
                .slice(0, 2)
                .map((item) => item.title)
                .join(' / '),
            )
          : isEnglish
            ? 'Import reviews, interviews, playtest notes, and design docs before this graph has real evidence to work with.'
            : '把评测、访谈、试玩记录和设计文档导进来，图谱才会有真正可用的依据。',
      metrics: evidenceItems.slice(0, 3).map((item) => item.type),
    },
    dossierCard: {
      status: resolveStageStatus(dossierStage, hasViewableAnalysis),
      title: dossierStage?.preview?.headline || (isEnglish ? 'Unified Forecast Brief' : '统一预测简报'),
      summary: shorten(
        dossierStage?.preview?.summary ||
          dossierStage?.detail ||
          (isEnglish
            ? 'This stage packages the project summary and evidence signals into one shared handoff for the specialist agents.'
            : '这里会把项目简述和证据信号打包成一份统一交接简报，再交给各个专项代理。'),
      ),
      metrics: [],
    },
    dossierRole: isEnglish ? 'Shared Brief' : '共享简报',
    liveRun: {
      isActive: isProgressActive || hasProgressError,
      percent: progressStats?.percent ?? 0,
      label: progress?.currentStageLabel ?? (isEnglish ? 'Waiting for formal run' : '等待正式推理'),
      message: progress?.message ?? (isEnglish ? 'The shared brief and agent stages only light up after the backend run actually starts.' : '只有后端真正启动后，共享简报和多代理阶段才会逐步点亮。'),
    },
    agentCards,
    synthesisCard: {
      status: resolveStageStatus(synthesisStage, hasViewableAnalysis),
      title: synthesisStage?.preview?.headline || (isEnglish ? 'Future Timeline Simulation' : '未来时间线模拟'),
      summary: shorten(
        synthesisStage?.preview?.summary ||
          (isEnglish
            ? 'Specialist judgments are merged here into future beats, community rhythms, and key inflection points.'
            : '各个专项代理的判断会在这里汇总成未来节点、社区节奏和关键转折。'),
      ),
      metrics: [],
    },
    refineCard: {
      status: resolveStageStatus(refineStage, hasViewableAnalysis),
      title: refineStage?.preview?.headline || (isEnglish ? 'Report Structure Cleanup' : '报告结构整理'),
      summary: shorten(
        refineStage?.preview?.summary ||
          (isEnglish
            ? 'The final pass compresses fluff, sharpens pacing, and folds the forecast into a directly readable report.'
            : '最后一轮会压缩空话、整理节奏，并把预测内容收束成可直接阅读的报告。'),
      ),
      metrics: [],
    },
    reportCard: {
      status: forecastReportStatus,
      title: hasViewableAnalysis
        ? trimCopy(
            analysis.report.headline || analysis.systemVerdict,
            isEnglish ? 'Formal forecast output has been generated.' : '正式结果已经生成。',
          )
        : latestPreviewStage?.preview?.headline ||
          (isEnglish ? 'The future timeline only unlocks after the backend run finishes.' : '只有后端完成后，未来时间线才会真正解锁。'),
      summary: hasViewableAnalysis
        ? shorten(connectedSummary)
        : isEnglish
          ? 'The timeline and report stay locked until the backend run truly finishes. This graph will not pretend it already knows the answer.'
          : '只有后端真正完成后，时间线和报告才会解锁，图谱不会假装自己已经知道答案。',
      metrics: [
        hasViewableAnalysis ? (isEnglish ? `${analysis.futureTimeline.length} timeline beats` : `${analysis.futureTimeline.length} 个时间节点`) : '',
        hasViewableAnalysis ? (isEnglish ? `${analysis.communityRhythms.length} community rhythms` : `${analysis.communityRhythms.length} 个社区节奏`) : '',
        latestPreviewStage?.model ?? '',
      ].filter((value): value is string => Boolean(value)),
    },
  };
}

function formatProjectMode(mode: ProjectSnapshot['mode'], language: UiLanguage = 'zh') {
  const isEnglish = isEnglishUi(language);

  if (mode === 'Concept') {
    return isEnglish ? 'Concept Stage' : '概念阶段';
  }

  if (mode === 'Validation') {
    return isEnglish ? 'Validation Stage' : '验证阶段';
  }

  return isEnglish ? 'Live Stage' : '上线阶段';
}
