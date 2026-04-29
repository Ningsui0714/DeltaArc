import type { SandboxAnalysisRequest, SandboxMemorySignal } from '../../../shared/sandbox';
import type { Dossier } from './types';
import { summarizeEvidenceLevel, uniqueStrings } from './fallbackShared';

export function createDossierFallback(
  request: SandboxAnalysisRequest,
  memorySignals: SandboxMemorySignal[],
  reason = 'The remote dossier stage failed.',
): Dossier {
  const evidenceLevel = summarizeEvidenceLevel(request);
  const primaryAudience = request.project.targetPlayers[0] ?? '核心受众';
  const evidenceDigest = request.evidenceItems.slice(0, 3).map((item) => ({
    title: item.title,
    signal: `${item.type} from ${item.source} (${item.trust} trust, ${item.createdAt || 'unknown date'})`,
    implication: item.summary,
  }));
  const confidence = evidenceLevel === 'high' ? 61 : evidenceLevel === 'medium' ? 54 : 46;
  const playerAcceptance = evidenceLevel === 'high' ? 64 : evidenceLevel === 'medium' ? 58 : 52;
  const supportRatio = evidenceLevel === 'high' ? 62 : evidenceLevel === 'medium' ? 56 : 49;

  return {
    systemFrame: `${request.project.name} 当前处于 ${request.project.mode} 阶段，正在验证“${request.project.validationGoal}”这条 KOC 内容策略前提。`,
    opportunityThesis: `近期最有价值的押注，是让“${request.project.coreFantasy || request.project.ideaSummary}”被 ${primaryAudience} 快速理解、快速互动并可复述传播。`,
    evidenceLevel,
    playerAcceptance,
    confidence,
    supportRatio,
    scores: {
      coreFun: request.project.coreLoop ? 64 : 56,
      learningCost: request.project.sessionLength ? 57 : 52,
      novelty: request.project.differentiators ? 67 : 59,
      acceptanceRisk: evidenceLevel === 'high' ? 55 : evidenceLevel === 'medium' ? 50 : 45,
      prototypeCost: request.project.productionConstraints ? 49 : 57,
    },
    personas: request.project.targetPlayers.slice(0, 3).map((player, index) => ({
      name: player || `Persona ${index + 1}`,
      motive: `希望低门槛理解并快速获得“${request.project.coreFantasy || '清晰内容价值'}”回报。`,
      accepts: request.project.coreLoop || request.project.ideaSummary,
      rejects:
        request.project.progressionHook ||
        request.project.productionConstraints ||
        '范围松散、价值不明确、产出节奏不可控。',
      verdict: `若首轮触达到互动转化的回报足够清晰，值得继续验证 ${player || '该受众层'}。`,
    })),
    hypotheses: [
      {
        title: '核心内容主张能驱动首轮互动',
        evidence:
          evidenceDigest[0]?.implication ?? '暂无外部证据，当前仅基于项目快照做推断。',
        confidence,
        gap: `需要一次聚焦验证，证明目标受众是否会对“${request.project.validationGoal}”做出真实互动。`,
      },
      {
        title: '生产范围纪律与创意新鲜度同等重要',
        evidence:
          request.project.productionConstraints ||
          '生产约束未被明确，范围失控风险仍偏高。',
        confidence: Math.max(35, confidence - 12),
        gap: '需要一个最小内容样本，验证差异化主张在当前产能约束下仍可成立。',
      },
    ],
    evidenceDigest:
      evidenceDigest.length > 0
        ? evidenceDigest
        : [
            {
              title: 'Project snapshot',
              signal: 'No evidence items were imported for this run.',
              implication:
                '当前仅基于项目字段做快速推演，结论应保持暂定。',
            },
          ],
    coreTensions: uniqueStrings(
      [
        request.project.productionConstraints
          ? `Production constraint: ${request.project.productionConstraints}`
          : undefined,
        request.project.differentiators
          ? `Differentiation has to stay visible without bloating onboarding: ${request.project.differentiators}`
          : undefined,
        request.project.monetization
          ? `转化动作不应快于受众信任建立：${request.project.monetization}`
          : undefined,
      ],
      4,
    ),
    openQuestions: uniqueStrings(
      [
        request.project.validationGoal
          ? `下一轮验证能否直接证明：${request.project.validationGoal}`
          : undefined,
        request.project.targetPlayers[0]
          ? `${request.project.targetPlayers[0]} 在首轮接触后持续互动的关键驱动是什么？`
          : undefined,
        request.project.productionConstraints
          ? `在“${request.project.productionConstraints}”约束下，哪种范围收缩最能保护核心内容机制？`
          : undefined,
        request.project.referenceGames[0]
          ? `借鉴 ${request.project.referenceGames[0]} 时，哪些受众预期应对齐，哪些应主动放弃？`
          : undefined,
      ],
      5,
    ),
    memorySignals,
    warnings: uniqueStrings(
      [
        'Dossier 阶段已回退为基于当前项目快照的本地摘要。',
        reason,
        request.evidenceItems.length === 0 ? '本轮未导入外部证据条目。' : undefined,
      ],
      4,
    ),
  };
}
