import { normalizeBlindSpots } from '../normalizeSandboxResult';
import { createValidationTrack } from './fallbackShared';
import type { SpecialistBlueprint } from './specialists';
import type { Dossier, SpecialistOutput } from './types';

export function createEconomySpecialistOutput(
  blueprint: SpecialistBlueprint,
  dossier: Dossier,
  evidenceRefs: string[],
  warning?: string,
): SpecialistOutput {
  return {
    perspective: {
      key: blueprint.key,
      label: blueprint.label,
      stance: dossier.evidenceLevel === 'high' ? 'mixed' : 'bearish',
      confidence: Math.max(40, dossier.confidence - 9),
      verdict: '增长转化视角下最大的空洞，是中期回流理由还没有从首轮互动中自然长出来。',
      opportunity: '如果互动高光能稳定复现，中期增长可围绕“更聪明的协作表达”而非纯资源堆叠展开。',
      concern: '当增长理由只能靠外部投放和填充内容时，验证会被伪繁荣误导。',
      leverage: '先证明二次互动意愿，再讨论更远期的增长结构。',
      evidenceRefs,
    },
    blindSpots: normalizeBlindSpots([
      {
        area: '二次互动动机',
        whyItMatters: '没有二次互动意愿，任何中期增长设计都只是纸上结构。',
        missingEvidence: '需要首轮体验后的自发回访意愿和原因。',
      },
    ]),
    secondOrderEffects: [],
    scenarioVariants: [],
    decisionLenses: [
      {
        name: '二次互动意愿',
        keyQuestion: '受众完成首轮触达后最想马上做什么？',
        answer: '如果答案不是“再来一次并尝试另一种互动”，增长结构就还站不住。',
      },
    ],
    validationTracks: [
      createValidationTrack(
        '二次互动意愿记录',
        'P1',
        '确认受众完成首轮体验后是否自然想继续互动。',
        '体验结束后不做引导，直接记录受众主动提出的下一步。',
        '受众主动讨论再次互动或尝试不同协作。',
        '受众只讨论规则负担、惩罚感或疲劳感。',
      ),
    ],
    contrarianMoves: [],
    unknowns: [],
    strategyIdeas: [
      {
        name: '二次互动先于增长线',
        type: 'Retention',
        cost: 'S',
        timeToValue: '1 week',
        acceptance: dossier.playerAcceptance,
        risk: '过早叠增长层会掩盖真实留存问题。',
        recommendation: '先把二次互动意愿验证出来，再扩展增长外环。',
      },
    ],
    warnings: warning ? [warning] : [],
  };
}
