import { normalizeBlindSpots } from '../normalizeSandboxResult';
import { createValidationTrack } from './fallbackShared';
import type { SpecialistBlueprint } from './specialists';
import type { Dossier, SpecialistOutput } from './types';

export function createMarketSpecialistOutput(
  blueprint: SpecialistBlueprint,
  dossier: Dossier,
  evidenceRefs: string[],
  warning?: string,
): SpecialistOutput {
  return {
    perspective: {
      key: blueprint.key,
      label: blueprint.label,
      stance: dossier.scores.novelty >= 64 ? 'mixed' : 'bearish',
      confidence: Math.max(40, dossier.confidence - 8),
      verdict: '市场视角下最危险的不是题材撞车，而是卖点说得出来、内容体验却留不下可传播片段。',
      opportunity: '如果互动高光足够稳定，传播叙事会比题材包装更有说服力。',
      concern: '差异化若只停留在内部叙事里，外部受众会把它看成又一个熟悉框架。',
      leverage: '把“首轮就能复述的互动瞬间”当成真实卖点，而不是补充文案。',
      evidenceRefs,
    },
    blindSpots: normalizeBlindSpots([
      {
        area: '传播叙事落差',
        whyItMatters: '如果外部传播只剩概念描述，市场判断会高估题材、低估体验兑现难度。',
        missingEvidence: '需要体验录像和第三方复述，而不仅是内部自述。',
      },
    ]),
    secondOrderEffects: [
      {
        trigger: '高光时刻可被稳定复现',
        outcome: '内容传播与留存验证会形成正反馈',
        horizon: 'mid',
        direction: 'positive',
      },
    ],
    scenarioVariants: [
      {
        name: '传播先验过强',
        premise: '受众被包装吸引，但首轮看不到核心卖点',
        upside: '前期点击和关注可能不差',
        downside: '体验转化和口碑会迅速掉头',
        watchSignals: ['外部反馈是否只提题材不提体验', '体验后是否能复述具体时刻'],
        recommendedMove: '在公开叙事前，先确保体验片段本身有传播价值。',
      },
    ],
    decisionLenses: [
      {
        name: '外部复述',
        keyQuestion: '陌生受众能否用一句话说清这个项目的互动快感？',
        answer: '目前还没有足够证据说明可以。',
      },
    ],
    validationTracks: [
      createValidationTrack(
        '传播句验证',
        'P1',
        '确认体验后外部受众能否复述真正卖点。',
        '给非项目成员看 15 分钟体验片段，让他们用一句话概括卖点。',
        '复述会聚焦合作高光而不是空泛题材。',
        '复述停留在“又一个某某类型游戏”。',
        '10 days',
      ),
    ],
    contrarianMoves: [
      {
        title: '先砍包装，后做传播',
        thesis: '如果不带包装就说不清体验价值，说明卖点仍然站不住。',
        whenToUse: '当市场反馈更像在回应题材，而不是回应内容机制时。',
      },
    ],
    unknowns: [
      {
        topic: '差异化记忆点',
        whyUnknown: '当前还缺外部样本来证明受众会记住哪一个高光片段。',
        resolveBy: '收集体验后 24 小时内还能被复述的具体瞬间。',
      },
    ],
    strategyIdeas: [
      {
        name: '传播片段优先',
        type: 'Positioning',
        cost: 'S',
        timeToValue: '10 days',
        acceptance: dossier.supportRatio,
        risk: '如果片段不稳定，市场叙事会先行透支信任。',
        recommendation: '先找到能稳定被复述的体验瞬间，再包装市场语言。',
      },
    ],
    warnings: warning ? [warning] : [],
  };
}
