import { normalizeBlindSpots } from '../normalizeSandboxResult';
import { createValidationTrack } from './fallbackShared';
import type { SpecialistBlueprint } from './specialists';
import type { Dossier, SpecialistOutput } from './types';

export function createProductionSpecialistOutput(
  blueprint: SpecialistBlueprint,
  dossier: Dossier,
  primaryConcern: string,
  evidenceRefs: string[],
  warning?: string,
): SpecialistOutput {
  return {
    perspective: {
      key: blueprint.key,
      label: blueprint.label,
      stance: dossier.scores.prototypeCost >= 55 ? 'mixed' : 'bearish',
      confidence: Math.max(42, dossier.confidence - 7),
      verdict: '制作风险不是功能少，而是两人团队把本该一次证明的核心乐趣拆散到了太多系统里。',
      opportunity: '如果把原型边界压得足够狠，制作约束反而会逼出更清晰的验证结论。',
      concern: primaryConcern,
      leverage: '围绕单局闭环收缩范围，让每个系统都直接服务于验证目标。',
      evidenceRefs,
    },
    blindSpots: normalizeBlindSpots([
      {
        area: '原型边界',
        whyItMatters: '边界不清时，团队会以为自己在做验证，实际在做半成品。',
        missingEvidence: '需要列出“这 6 周必须证明什么，不证明什么”的砍项清单。',
      },
    ]),
    secondOrderEffects: [],
    scenarioVariants: [],
    decisionLenses: [
      {
        name: '范围纪律',
        keyQuestion: '当前所有制作项是否都直接服务于验证目标？',
        answer: '大概率没有，需要再砍一轮。',
      },
    ],
    validationTracks: [
      createValidationTrack(
        '原型砍项审查',
        'P0',
        '确认 6 周原型只保留验证所需系统。',
        '按验证目标逐项审查系统是否必需，删掉无法直接提供验证信号的部分。',
        '团队能清楚说出每个保留功能服务的验证问题。',
        '系统只是“以后也许需要”，但当下不产出验证价值。',
      ),
    ],
    contrarianMoves: [],
    unknowns: [],
    strategyIdeas: [
      {
        name: '验证优先砍项',
        type: 'Scope control',
        cost: 'S',
        timeToValue: '3 days',
        acceptance: dossier.confidence,
        risk: '如果不做砍项，原型会稀释验证信号。',
        recommendation: '先用删减换清晰，再考虑补功能。',
      },
    ],
    warnings: warning ? [warning] : [],
  };
}
