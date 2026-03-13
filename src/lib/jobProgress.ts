import type { SandboxAnalysisJob, SandboxAnalysisJobStage } from '../../shared/sandbox';
import type { UiLanguage } from '../hooks/useUiLanguage';

type JobProgressStats = {
  percent: number;
  actionableStageCount: number;
  completedStageCount: number;
  runningStageCount: number;
  pendingStageCount: number;
  fallbackStageCount: number;
  runningStages: SandboxAnalysisJobStage[];
  completedStages: SandboxAnalysisJobStage[];
  elapsedMs: number;
};

function isActionableStage(stage: SandboxAnalysisJobStage) {
  return stage.key !== 'complete';
}

function isFallbackStage(stage: SandboxAnalysisJobStage) {
  return stage.model === 'local-fallback' || stage.detail.toLowerCase().includes('local');
}

export function formatJobDuration(durationMs?: number, language: UiLanguage = 'zh') {
  if (!durationMs || durationMs <= 0) {
    return language === 'en' ? '0s' : '0秒';
  }

  const seconds = Math.round(durationMs / 1000);

  if (seconds < 60) {
    return language === 'en' ? `${seconds}s` : `${seconds}秒`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (language === 'en') {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  return remainingSeconds > 0 ? `${minutes}分 ${remainingSeconds}秒` : `${minutes}分`;
}

export function getJobProgressStats(job: SandboxAnalysisJob, nowMs = Date.now()): JobProgressStats {
  const actionableStages = job.stages.filter(isActionableStage);
  const completedStages = actionableStages.filter((stage) => stage.status === 'completed');
  const runningStages = actionableStages.filter((stage) => stage.status === 'running');
  const pendingStages = actionableStages.filter((stage) => stage.status === 'pending');
  const fallbackStageCount = actionableStages.filter(isFallbackStage).length;
  const completedWeight = completedStages.length;
  const runningWeight = runningStages.length * 0.45;
  const percent =
    job.status === 'completed'
      ? 100
      : Math.max(6, Math.min(96, Math.round(((completedWeight + runningWeight) / Math.max(actionableStages.length, 1)) * 100)));
  const startedAtMs = Date.parse(job.createdAt);

  return {
    percent,
    actionableStageCount: actionableStages.length,
    completedStageCount: completedStages.length,
    runningStageCount: runningStages.length,
    pendingStageCount: pendingStages.length,
    fallbackStageCount,
    runningStages,
    completedStages,
    elapsedMs: Number.isNaN(startedAtMs) ? 0 : Math.max(0, nowMs - startedAtMs),
  };
}
