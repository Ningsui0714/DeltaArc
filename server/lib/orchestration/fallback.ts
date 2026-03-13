import type { SandboxAnalysisRequest, SandboxAnalysisResult, SandboxMemorySignal } from '../../../shared/sandbox';
import {
  createAnalysisMeta,
  createFallbackAnalysis,
  normalizeBlindSpots,
} from '../normalizeSandboxResult';
import type { SpecialistBlueprint } from './specialists';
import type { Dossier, SpecialistOutput } from './types';
import { dedupeBy } from './utils';

type LocalSpecialistVariant = 'quick_scan' | 'fallback';

function summarizeEvidenceLevel(request: SandboxAnalysisRequest): SandboxAnalysisResult['evidenceLevel'] {
  const totalEvidence = request.evidenceItems.length;
  const highTrustEvidence = request.evidenceItems.filter((item) => item.trust === 'high').length;

  if (highTrustEvidence >= 2 || totalEvidence >= 5) {
    return 'high';
  }

  if (highTrustEvidence >= 1 || totalEvidence >= 2) {
    return 'medium';
  }

  return 'low';
}

function uniqueStrings(values: Array<string | undefined>, limit = values.length) {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = value?.trim();
    if (!normalized || seen.has(normalized) || result.length >= limit) {
      return;
    }

    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

function createValidationTrack(
  name: string,
  priority: 'P0' | 'P1' | 'P2',
  goal: string,
  method: string,
  successSignal: string,
  failureSignal: string,
  timeframe = '1 week',
) {
  return {
    name,
    priority,
    goal,
    method,
    successSignal,
    failureSignal,
    cost: 'S',
    timeframe,
  };
}

export function createDossierFallback(
  request: SandboxAnalysisRequest,
  memorySignals: SandboxMemorySignal[],
  reason = 'The remote dossier stage failed.',
): Dossier {
  const evidenceLevel = summarizeEvidenceLevel(request);
  const primaryAudience = request.project.targetPlayers[0] ?? 'the target audience';
  const evidenceDigest = request.evidenceItems.slice(0, 3).map((item) => ({
    title: item.title,
    signal: `${item.type} from ${item.source} (${item.trust} trust, ${item.createdAt || 'unknown date'})`,
    implication: item.summary,
  }));
  const confidence = evidenceLevel === 'high' ? 61 : evidenceLevel === 'medium' ? 54 : 46;
  const playerAcceptance = evidenceLevel === 'high' ? 64 : evidenceLevel === 'medium' ? 58 : 52;
  const supportRatio = evidenceLevel === 'high' ? 62 : evidenceLevel === 'medium' ? 56 : 49;

  return {
    systemFrame: `${request.project.name} is in ${request.project.mode} mode and is currently trying to validate ${request.project.validationGoal}.`,
    opportunityThesis: `The strongest near-term bet is to make ${request.project.coreFantasy || request.project.ideaSummary} feel immediately legible for ${primaryAudience}.`,
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
      motive: `Wants ${request.project.coreFantasy || 'a clear promise'} without extra setup friction.`,
      accepts: request.project.coreLoop || request.project.ideaSummary,
      rejects:
        request.project.progressionHook ||
        request.project.productionConstraints ||
        'Loose scope and unclear payoff.',
      verdict: `Worth testing if the first-session payoff is obvious for ${player || 'this audience'}.`,
    })),
    hypotheses: [
      {
        title: 'Core fantasy can carry the first session',
        evidence:
          evidenceDigest[0]?.implication ?? 'No imported evidence yet; this is inferred from the project snapshot.',
        confidence,
        gap: `Need a focused test that proves whether players respond to ${request.project.validationGoal}.`,
      },
      {
        title: 'Scope discipline is as important as novelty',
        evidence:
          request.project.productionConstraints ||
          'Production constraints were not detailed, so scope risk remains under-specified.',
        confidence: Math.max(35, confidence - 12),
        gap: 'Need a prototype slice that confirms the differentiator survives under current production limits.',
      },
    ],
    evidenceDigest:
      evidenceDigest.length > 0
        ? evidenceDigest
        : [
            {
              title: 'Project snapshot',
              signal: 'No evidence items were imported for this run.',
              implication: 'The quick scan is continuing from the project fields only, so conclusions should stay provisional.',
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
          ? `Monetization should not outrun trust in the first retained session: ${request.project.monetization}`
          : undefined,
      ],
      4,
    ),
    openQuestions: uniqueStrings(
      [
        request.project.validationGoal
          ? `Can the next test directly prove: ${request.project.validationGoal}`
          : undefined,
        request.project.targetPlayers[0]
          ? `What makes ${request.project.targetPlayers[0]} stay after the first session?`
          : undefined,
        request.project.productionConstraints
          ? `Which scope cut best protects the core loop under this constraint: ${request.project.productionConstraints}?`
          : undefined,
        request.project.referenceGames[0]
          ? `Which expectation borrowed from ${request.project.referenceGames[0]} should be matched, and which should be rejected?`
          : undefined,
      ],
      5,
    ),
    memorySignals,
    warnings: uniqueStrings(
      [
        'Dossier stage fell back to a local summary built from the current project snapshot.',
        reason,
        request.evidenceItems.length === 0 ? 'No evidence items were imported for this run.' : undefined,
      ],
      4,
    ),
  };
}

function createLocalSpecialistOutput(
  blueprint: SpecialistBlueprint,
  dossier: Dossier,
  variant: LocalSpecialistVariant,
): SpecialistOutput {
  const primaryConcern =
    dossier.coreTensions[0] ?? 'Evidence is still too thin to treat the current direction as proven.';
  const nextQuestion =
    dossier.openQuestions[0] ?? 'Turn the next uncertain assumption into a concrete validation task.';
  const evidenceRefs = dossier.evidenceDigest.slice(0, 2).map((item) => item.title);
  const warning =
    variant === 'fallback' ? `${blueprint.label} 使用本地启发式视角继续推演。` : undefined;

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

  if (blueprint.key === 'market') {
    return {
      perspective: {
        key: blueprint.key,
        label: blueprint.label,
        stance: dossier.scores.novelty >= 64 ? 'mixed' : 'bearish',
        confidence: Math.max(40, dossier.confidence - 8),
        verdict: '市场视角下最危险的不是题材撞车，而是卖点说得出来、试玩却留不下可传播片段。',
        opportunity: '如果合作高光足够稳定，传播叙事会比题材包装更有说服力。',
        concern: '差异化若只停留在内部叙事里，外部玩家会把它看成又一个熟悉框架。',
        leverage: '把“第一局就能复述的合作瞬间”当成真实卖点，而不是补充文案。',
        evidenceRefs,
      },
      blindSpots: normalizeBlindSpots([
        {
          area: '传播叙事落差',
          whyItMatters: '如果外部传播只剩概念描述，市场判断会高估题材、低估体验兑现难度。',
          missingEvidence: '需要试玩录像和第三方复述，而不仅是设计自述。',
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
          premise: '玩家被包装吸引，但首局看不到核心卖点',
          upside: '前期点击和愿望单可能不差',
          downside: '试玩转化和口碑会迅速掉头',
          watchSignals: ['外部反馈是否只提题材不提体验', '试玩后是否能复述具体时刻'],
          recommendedMove: '在公开叙事前，先确保试玩片段本身有传播价值。',
        },
      ],
      decisionLenses: [
        {
          name: '外部复述',
          keyQuestion: '陌生玩家能否用一句话说清这个项目的合作快感？',
          answer: '目前还没有足够证据说明可以。',
        },
      ],
      validationTracks: [
        createValidationTrack(
          '传播句验证',
          'P1',
          '确认试玩后外部玩家能否复述真正卖点。',
          '给非项目成员看 15 分钟试玩片段，让他们用一句话概括卖点。',
          '复述会聚焦合作高光而不是空泛题材。',
          '复述停留在“又一个某某类型游戏”。',
          '10 days',
        ),
      ],
      contrarianMoves: [
        {
          title: '先砍包装，后做传播',
          thesis: '如果不带包装就说不清体验价值，说明卖点仍然站不住。',
          whenToUse: '当市场反馈更像在回应题材，而不是回应玩法时。',
        },
      ],
      unknowns: [
        {
          topic: '差异化记忆点',
          whyUnknown: '当前还缺外部样本来证明玩家会记住哪一个高光片段。',
          resolveBy: '收集试玩后 24 小时内还能被复述的具体瞬间。',
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
          recommendation: '先找到能稳定被复述的试玩瞬间，再包装市场语言。',
        },
      ],
      warnings: warning ? [warning] : [],
    };
  }

  if (blueprint.key === 'production') {
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

  if (blueprint.key === 'economy') {
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

export function createQuickScanSpecialistOutput(
  blueprint: SpecialistBlueprint,
  dossier: Dossier,
): SpecialistOutput {
  return createLocalSpecialistOutput(blueprint, dossier, 'quick_scan');
}

export function createSpecialistFallback(blueprint: SpecialistBlueprint, dossier: Dossier): SpecialistOutput {
  return createLocalSpecialistOutput(blueprint, dossier, 'fallback');
}

export function buildProvisionalFallback(
  request: SandboxAnalysisRequest,
  dossier: Dossier,
  specialistOutputs: SpecialistOutput[],
  pipeline: string[],
  modelSummary: string,
  warnings: string[],
): SandboxAnalysisResult {
  const perspectives = specialistOutputs.map((output) => output.perspective);
  const blindSpots = dedupeBy(
    specialistOutputs.flatMap((output) => output.blindSpots),
    (item) => item.area,
    6,
  );
  const secondOrderEffects = dedupeBy(
    specialistOutputs.flatMap((output) => output.secondOrderEffects),
    (item) => `${item.trigger}-${item.outcome}`,
    6,
  );
  const scenarioVariants = dedupeBy(
    specialistOutputs.flatMap((output) => output.scenarioVariants),
    (item) => item.name,
    4,
  );
  const decisionLenses = dedupeBy(
    specialistOutputs.flatMap((output) => output.decisionLenses),
    (item) => item.name,
    5,
  );
  const validationTracks = dedupeBy(
    specialistOutputs.flatMap((output) => output.validationTracks),
    (item) => item.name,
    5,
  );
  const contrarianMoves = dedupeBy(
    specialistOutputs.flatMap((output) => output.contrarianMoves),
    (item) => item.title,
    4,
  );
  const unknowns = dedupeBy(
    specialistOutputs.flatMap((output) => output.unknowns),
    (item) => item.topic,
    5,
  );
  const strategies = dedupeBy(
    specialistOutputs.flatMap((output) => output.strategyIdeas),
    (item) => item.name,
    4,
  );
  const redTeam =
    specialistOutputs.find((output) => output.perspective.key === 'red_team')?.redTeam ?? {
      thesis: '当前缺少更尖锐的反方论证。',
      attackVectors: [],
      failureModes: [],
      mitigation: '优先补反证。',
    };

  const fallback = createFallbackAnalysis(
    request.mode,
    modelSummary,
    pipeline,
    createAnalysisMeta('remote', 'degraded'),
  );

  return {
    ...fallback,
    summary: dossier.opportunityThesis,
    systemVerdict:
      perspectives.filter((item) => item.stance === 'bullish').length >
      perspectives.filter((item) => item.stance === 'bearish').length
        ? '方向值得推进，但必须依赖多轮验证而不是单点乐观。'
        : '方向暂不宜乐观扩张，先用更小成本验证关键前提。',
    evidenceLevel: dossier.evidenceLevel,
    primaryRisk: blindSpots[0]?.whyItMatters ?? redTeam.thesis,
    nextStep: validationTracks[0]?.goal ?? dossier.openQuestions[0] ?? fallback.nextStep,
    playerAcceptance: dossier.playerAcceptance,
    confidence: dossier.confidence,
    supportRatio: dossier.supportRatio,
    scores: dossier.scores,
    personas: dossier.personas,
    hypotheses: dossier.hypotheses,
    strategies: strategies.length > 0 ? strategies : fallback.strategies,
    perspectives: perspectives.length > 0 ? perspectives : fallback.perspectives,
    blindSpots: blindSpots.length > 0 ? blindSpots : fallback.blindSpots,
    secondOrderEffects,
    scenarioVariants,
    decisionLenses,
    validationTracks,
    contrarianMoves,
    unknowns,
    redTeam,
    memorySignals: dossier.memorySignals as SandboxMemorySignal[],
    report: {
      headline: '多阶段推演已完成，下一步应以验证而不是辩论继续收敛',
      summary: dossier.systemFrame,
      conclusion: '当前结果已经不再只是单个模型的直觉判断，而是多视角冲突后的暂时结论。',
      whyNow: '在证据仍不完备时，越早把不同视角和失败路径显性化，后续迭代成本越低。',
      risk: redTeam.thesis,
      actions:
        validationTracks.length > 0
          ? validationTracks.slice(0, 4).map((item) => `${item.priority} ${item.goal}`)
          : fallback.report.actions,
    },
    warnings,
  };
}
