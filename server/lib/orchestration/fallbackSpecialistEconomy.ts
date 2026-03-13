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
      verdict: '留存增长角度目前最大的空洞，是中期回流理由还没有从首局体验里自然长出来。',
      opportunity: '如果合作高光能稳定复现，中期成长可以围绕“更聪明的配合”而非纯资源堆叠展开。',
      concern: '当成长理由只能靠外部数值和内容填充时，验证会被伪繁荣误导。',
      leverage: '先证明第二局意愿，再讨论更远期的成长结构。',
      evidenceRefs,
    },
    blindSpots: normalizeBlindSpots([
      {
        area: '第二局动机',
        whyItMatters: '没有第二局意愿，任何中期留存设计都只是纸上结构。',
        missingEvidence: '需要首轮试玩后的自发回局意愿和原因。',
      },
    ]),
    secondOrderEffects: [],
    scenarioVariants: [],
    decisionLenses: [
      {
        name: '第二局意愿',
        keyQuestion: '玩家结束首局后最想马上做什么？',
        answer: '如果答案不是“再来一局试另一种配合”，留存结构就还站不住。',
      },
    ],
    validationTracks: [
      createValidationTrack(
        '第二局意愿记录',
        'P1',
        '确认玩家结束首局后是否自然想继续。',
        '试玩结束后不做引导，直接记录玩家主动提出的下一步。',
        '玩家主动讨论再来一局或尝试不同配合。',
        '玩家只讨论规则问题、惩罚或疲劳感。',
      ),
    ],
    contrarianMoves: [],
    unknowns: [],
    strategyIdeas: [
      {
        name: '第二局先于成长线',
        type: 'Retention',
        cost: 'S',
        timeToValue: '1 week',
        acceptance: dossier.playerAcceptance,
        risk: '过早叠成长层会掩盖真实留存问题。',
        recommendation: '先把第二局意愿验证出来，再扩展成长外环。',
      },
    ],
    warnings: warning ? [warning] : [],
  };
}
