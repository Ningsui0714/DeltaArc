import { normalizeBlindSpots } from '../normalizeSandboxResult';
import { createValidationTrack } from './fallbackShared';
import type { SpecialistBlueprint } from './specialists';
import type { Dossier, SpecialistOutput } from './types';

export function createRedTeamSpecialistOutput(
  blueprint: SpecialistBlueprint,
  dossier: Dossier,
  primaryConcern: string,
  nextQuestion: string,
  evidenceRefs: string[],
  warning?: string,
): SpecialistOutput {
  return {
    perspective: {
      key: blueprint.key,
      label: blueprint.label,
      stance: 'bearish',
      confidence: Math.max(46, dossier.confidence - 4),
      verdict: '反方视角会优先假设项目失败，并检查当前乐观判断是不是建立在伪正反馈上。',
      opportunity: dossier.opportunityThesis,
      concern: primaryConcern,
      leverage: `先回答“${nextQuestion}”，再决定是否值得继续投入。`,
      evidenceRefs,
    },
    blindSpots: normalizeBlindSpots([
      {
        area: '虚假正反馈',
        whyItMatters: '如果团队把少量亮点误判为方向成立，后续投入会放大错误。',
        missingEvidence: '需要失败样本和反证，而不只是顺利体验的亮点总结。',
      },
    ]),
    secondOrderEffects: [
      {
        trigger: '把少量成功局当成方向成立',
        outcome: '团队会过早扩张范围并掩盖真正的验证盲区',
        horizon: 'mid',
        direction: 'negative',
      },
    ],
    scenarioVariants: [],
    decisionLenses: [
      {
        name: '失败优先',
        keyQuestion: '如果这个方向会失败，最可能先从哪里坏掉？',
        answer: '大概率先坏在首局乐趣兑现不足，而不是坏在题材包装。',
      },
    ],
    validationTracks: [
      createValidationTrack(
        '失败路径收集',
        'P0',
        '收集至少 3 组失败样本，确认项目最容易先坏在哪里。',
        '让目标玩家试玩后复盘“哪一刻开始不想继续”，而不是只问喜欢什么。',
        '能稳定归纳出一条最危险的失败路径。',
        '反馈只有抽象喜好，没有具体失真节点。',
      ),
    ],
    contrarianMoves: [
      {
        title: '先证明不会坏，再证明会成功',
        thesis: '当前阶段更值钱的是找到最危险的失败条件，而不是继续堆正向想象。',
        whenToUse: '当团队开始被少量亮点鼓舞，想继续加码投入时。',
      },
    ],
    unknowns: [
      {
        topic: '失败触发点',
        whyUnknown: '目前还缺能反复出现的失败路径样本。',
        resolveBy: '把试玩复盘聚焦到“第一次明显掉兴奋点”发生在哪里。',
      },
    ],
    strategyIdeas: [
      {
        name: '反证优先访谈',
        type: 'Risk control',
        cost: 'S',
        timeToValue: '1 week',
        acceptance: Math.max(30, dossier.supportRatio - 8),
        risk: '如果只收集高光反馈，团队会错过真正致命的问题。',
        recommendation: '下一轮验证优先收集失败路径，而不是继续打磨包装。',
      },
    ],
    redTeam: {
      thesis: '当前方向最可能失败在“合作只是义务，不是奖励”，导致玩家把沟通成本误判成玩法成本。',
      attackVectors: ['首局高光出现太晚', '失败恢复成本过高', '传播叙事强于真实体验兑现'],
      failureModes: ['玩家记住了负担而不是合作瞬间', '团队用题材或包装掩盖验证不足'],
      mitigation: '先用更短的验证环路收集失败样本，再决定是否扩大制作投入。',
    },
    warnings: warning ? [warning] : [],
  };
}
