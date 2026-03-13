import { normalizeBlindSpots } from '../normalizeSandboxResult';
import { createValidationTrack } from './fallbackShared';
import type { SpecialistBlueprint } from './specialists';
import type { Dossier, SpecialistOutput } from './types';

export function createGameplaySpecialistOutput(
  blueprint: SpecialistBlueprint,
  dossier: Dossier,
  primaryConcern: string,
  nextQuestion: string,
  evidenceRefs: string[],
  warning?: string,
): SpecialistOutput | null {
  if (blueprint.key === 'systems') {
    return {
      perspective: {
        key: blueprint.key,
        label: blueprint.label,
        stance: dossier.scores.coreFun >= 62 ? 'bullish' : dossier.scores.coreFun >= 54 ? 'mixed' : 'bearish',
        confidence: Math.max(45, dossier.confidence - 4),
        verdict:
          dossier.scores.coreFun >= 62
            ? '核心循环已经有可测试的抓手，但首局回报必须比协作成本更早出现。'
            : '核心循环现在更像概念承诺，快扫还不能证明实际可玩体验会自然成立。',
        opportunity: dossier.opportunityThesis,
        concern: primaryConcern,
        leverage: `把“${nextQuestion}”拆成 10 分钟内能完成的一轮体验验证。`,
        evidenceRefs,
      },
      blindSpots: normalizeBlindSpots([
        {
          area: '首局反馈密度',
          whyItMatters: '如果前十分钟的合作收益不够立刻可感知，玩家会把沟通成本误判为玩法负担。',
          missingEvidence: '需要真实试玩里首局关键反馈节点的时间线。',
        },
      ]),
      secondOrderEffects: [
        {
          trigger: '压缩首局铺垫并提前给出合作高光',
          outcome: '玩家更容易把失败理解成可复盘事件，而不是纯粹浪费时间',
          horizon: 'near',
          direction: 'positive',
        },
      ],
      scenarioVariants: [
        {
          name: '高光前置版',
          premise: '把第一次合作救场事件提前到首局中段前',
          upside: '更快证明核心幻想是否成立',
          downside: '可能牺牲部分后续深度铺垫',
          watchSignals: ['玩家是否会主动复述合作瞬间', '失败后是否愿意立刻再来一局'],
          recommendedMove: '优先把原型调成高光前置版，再决定是否回补层次。',
        },
      ],
      decisionLenses: [
        {
          name: '首局密度',
          keyQuestion: '合作乐趣是否早于理解负担出现？',
          answer: '目前只能谨慎乐观，前提是删掉一部分非必要铺垫。',
        },
      ],
      validationTracks: [
        createValidationTrack(
          '10 分钟核心循环测试',
          'P0',
          nextQuestion,
          '找 5 组目标玩家只玩首局，记录第一次明确合作收益出现的时间点。',
          '玩家能主动指出值得复述的合作瞬间。',
          '玩家只记得等待、跑腿或规则理解成本。',
        ),
      ],
      contrarianMoves: [],
      unknowns: [
        {
          topic: '协作负担阈值',
          whyUnknown: '还不知道玩家愿意为这套协作深度支付多少理解成本。',
          resolveBy: '在首局测试中记录每个关键交互的解释次数和停顿时长。',
        },
      ],
      strategyIdeas: [
        {
          name: '首局高光压缩',
          type: 'Loop tuning',
          cost: 'S',
          timeToValue: '1 week',
          acceptance: dossier.playerAcceptance,
          risk: primaryConcern,
          recommendation: '先删步骤、保高光，再决定是否补复杂度。',
        },
      ],
      warnings: warning ? [warning] : [],
    };
  }

  if (blueprint.key === 'psychology') {
    return {
      perspective: {
        key: blueprint.key,
        label: blueprint.label,
        stance: dossier.playerAcceptance >= 60 ? 'bullish' : dossier.playerAcceptance >= 52 ? 'mixed' : 'bearish',
        confidence: Math.max(43, dossier.confidence - 6),
        verdict: '玩家心理层面的关键不是“有没有合作”，而是失败后会不会把责任和挫败感互相甩锅。',
        opportunity: '如果恢复成本足够低，合作压力会转化成故事性而不是羞耻感。',
        concern: '一旦等待、背锅或信息不对称被放大，第二局意愿会很快塌陷。',
        leverage: '把失败恢复、补位空间和弱配合容错做成首局就能感知的安全网。',
        evidenceRefs,
      },
      blindSpots: normalizeBlindSpots([
        {
          area: '情绪斜率',
          whyItMatters: '合作游戏的留存常常死在“情绪恢复不过来”，不是死在机制本身。',
          missingEvidence: '需要失败后 30 秒内的玩家口头反馈或操作行为。',
        },
      ]),
      secondOrderEffects: [
        {
          trigger: '降低失败后回场成本',
          outcome: '玩家更愿意把挫折解释成团队故事的一部分',
          horizon: 'near',
          direction: 'positive',
        },
      ],
      scenarioVariants: [],
      decisionLenses: [
        {
          name: '情绪恢复',
          keyQuestion: '失败后玩家想立刻再来，还是只想退出？',
          answer: '目前更像设计风险，而不是已经被证明的优势。',
        },
      ],
      validationTracks: [
        createValidationTrack(
          '失败恢复测试',
          'P0',
          '确认失败后的情绪能否在 30 秒内被拉回正轨。',
          '在试玩中故意制造一次失败，记录双方是否会迅速进入下一轮。',
          '玩家会主动讨论下一次如何配合。',
          '玩家把失败归因于队友或系统不讲理。',
        ),
      ],
      contrarianMoves: [],
      unknowns: [
        {
          topic: '背锅风险',
          whyUnknown: '还不清楚双人分工是否会自然变成一方持续背锅。',
          resolveBy: '统计失败时双方是否都拥有可执行的补救动作。',
        },
      ],
      strategyIdeas: [
        {
          name: '失败后即时补救',
          type: 'Emotional pacing',
          cost: 'S',
          timeToValue: '1 week',
          acceptance: dossier.playerAcceptance,
          risk: '如果只强化合作压力，不强化补位空间，负面情绪会放大。',
          recommendation: '优先设计失败后 30 秒内可执行的补救动作。',
        },
      ],
      warnings: warning ? [warning] : [],
    };
  }

  return null;
}
