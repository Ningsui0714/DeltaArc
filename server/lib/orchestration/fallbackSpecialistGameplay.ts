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
            ? '核心内容机制已有可测试抓手，但首轮互动回报必须早于理解与协作成本出现。'
            : '核心内容机制仍偏概念承诺，当前快扫不足以证明真实互动价值会自然成立。',
        opportunity: dossier.opportunityThesis,
        concern: primaryConcern,
        leverage: `把“${nextQuestion}”拆成 10 分钟内可完成的一轮内容链路验证。`,
        evidenceRefs,
      },
      blindSpots: normalizeBlindSpots([
        {
          area: '首轮反馈密度',
          whyItMatters: '如果前十分钟的互动收益不够立刻可感知，受众会把沟通成本误判为内容负担。',
          missingEvidence: '需要真实体验中首轮关键反馈节点的时间线。',
        },
      ]),
      secondOrderEffects: [
        {
          trigger: '压缩首轮铺垫并提前给出互动高光',
          outcome: '受众更容易把挫折理解成可复盘事件，而不是纯粹浪费时间',
          horizon: 'near',
          direction: 'positive',
        },
      ],
      scenarioVariants: [
        {
          name: '高光前置链路',
          premise: '把第一次有效互动事件提前到首轮中段前',
          upside: '更快证明核心内容主张是否成立',
          downside: '可能牺牲部分后续深度铺垫',
          watchSignals: ['受众是否会主动复述互动瞬间', '受挫后是否愿意立刻再次互动'],
          recommendedMove: '优先把原型调成高光前置链路，再决定是否回补层次。',
        },
      ],
      decisionLenses: [
        {
          name: '首轮密度',
          keyQuestion: '互动价值是否早于理解负担出现？',
          answer: '目前只能谨慎乐观，前提是删掉一部分非必要铺垫。',
        },
      ],
      validationTracks: [
        createValidationTrack(
          '10 分钟内容机制测试',
          'P0',
          nextQuestion,
          '招募 5 组目标受众完成首轮内容链路，记录第一次明确互动收益出现的时间点。',
          '受众能主动指出值得复述的互动瞬间。',
          '受众只记得等待、跑腿或理解成本。',
        ),
      ],
      contrarianMoves: [],
      unknowns: [
        {
          topic: '互动负担阈值',
          whyUnknown: '还不清楚受众愿意为这套互动深度支付多少理解成本。',
          resolveBy: '在首轮测试中记录每个关键交互的解释次数和停顿时长。',
        },
      ],
      strategyIdeas: [
        {
          name: '首轮高光压缩',
          type: 'Content mechanism tuning',
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
        verdict: '受众心理层面的关键不是“有没有互动”，而是受挫后会不会把责任与挫败感外溢。',
        opportunity: '如果恢复成本足够低，互动压力会转化为可复盘故事而不是羞耻感。',
        concern: '一旦等待、甩锅或信息不对称被放大，二次互动意愿会快速塌陷。',
        leverage: '把失败恢复、补位空间和弱配合容错做成首轮即可感知的安全网。',
        evidenceRefs,
      },
      blindSpots: normalizeBlindSpots([
        {
          area: '情绪斜率',
          whyItMatters: '互动内容的留存常常死在“情绪恢复不过来”，而不是死在机制本身。',
          missingEvidence: '需要受挫后 30 秒内的受众口头反馈或行为记录。',
        },
      ]),
      secondOrderEffects: [
        {
          trigger: '降低失败后回场成本',
          outcome: '受众更愿意把挫折解释成共同创作故事的一部分',
          horizon: 'near',
          direction: 'positive',
        },
      ],
      scenarioVariants: [],
      decisionLenses: [
        {
          name: '情绪恢复',
          keyQuestion: '受挫后受众想立刻再试，还是只想退出？',
          answer: '目前更像设计风险，而不是已经被证明的优势。',
        },
      ],
      validationTracks: [
        createValidationTrack(
          '失败恢复测试',
          'P0',
          '确认失败后的情绪能否在 30 秒内被拉回正轨。',
          '在体验中故意制造一次失败，记录双方是否会迅速进入下一轮互动。',
          '受众会主动讨论下一次如何配合。',
          '受众把失败归因于他人或系统不讲理。',
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
          risk: '如果只强化互动压力，不强化补位空间，负面情绪会放大。',
          recommendation: '优先设计失败后 30 秒内可执行的补救动作。',
        },
      ],
      warnings: warning ? [warning] : [],
    };
  }

  return null;
}
