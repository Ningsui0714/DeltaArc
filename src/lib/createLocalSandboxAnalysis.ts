import { baseStrategies, personas } from '../data/mockData';
import type { EvidenceItem, ProjectSnapshot } from '../types';
import type { SandboxAnalysisMeta, SandboxAnalysisMode, SandboxAnalysisResult } from '../../shared/sandbox';
import { createAnalysisMeta } from '../../shared/schema';

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function getFilledCount(project: ProjectSnapshot) {
  return [
    project.genre,
    project.platforms.join(' '),
    project.targetPlayers.join(' '),
    project.coreFantasy,
    project.ideaSummary,
    project.coreLoop,
    project.sessionLength,
    project.differentiators,
    project.progressionHook,
    project.socialHook,
    project.monetization,
    project.referenceGames.join(' '),
    project.validationGoal,
    project.productionConstraints,
    project.currentStatus,
  ].filter((item) => item.trim().length > 0).length;
}

function getCompletenessRatio(project: ProjectSnapshot) {
  return getFilledCount(project) / 15;
}

function joinOrFallback(items: string[], fallback: string) {
  return items.length > 0 ? items.join(' / ') : fallback;
}

function getEvidenceLevel(count: number, completenessRatio: number): SandboxAnalysisResult['evidenceLevel'] {
  if (count >= 6 && completenessRatio >= 0.75) {
    return 'high';
  }

  if (count >= 3 || completenessRatio >= 0.5) {
    return 'medium';
  }

  return 'low';
}

function getPrototypeComplexity(project: ProjectSnapshot) {
  const keywords = ['多人', '联机', '开放世界', 'ugc', '跨平台', '赛季', '实时'];
  const haystack = [project.genre, project.coreLoop, project.socialHook, project.productionConstraints].join(' ');

  return keywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? 1 : 0), 0);
}

function getPrimaryRisk(project: ProjectSnapshot, evidenceCount: number) {
  if (!project.targetPlayers.length) {
    return '目标玩家分层还不清楚，后续所有“接受度”判断都可能混在一起。';
  }

  if (!project.validationGoal) {
    return '这轮验证目标还不够尖锐，团队很容易把“做了很多”误当成“验证清楚了”。';
  }

  if (!project.productionConstraints) {
    return '制作约束没写清楚，方向可能在纸面成立，但原型周期会失控。';
  }

  if (evidenceCount < 3) {
    return '当前证据主要还停留在概念描述，容易把想象中的乐趣误判成真实可复现体验。';
  }

  return '方向已有一些支持，但仍要警惕把局部亮点误判成完整游戏循环成立。';
}

function getNextStep(project: ProjectSnapshot, evidenceCount: number) {
  if (!project.validationGoal) {
    return '先把这轮验证目标写成一句可判输赢的话，再进入正式多阶段推演。';
  }

  return evidenceCount >= 4
    ? `围绕“${project.validationGoal}”做一个两周内可执行的 P0 原型和测试计划。`
    : `先补 4 条以上直接围绕“${project.validationGoal}”的高价值证据，再跑一次正式推演。`;
}

function buildPersonas(project: ProjectSnapshot) {
  if (project.targetPlayers.length === 0) {
    return personas;
  }

  const primary = project.targetPlayers[0];
  const secondary = project.targetPlayers[1] ?? '轻度尝鲜玩家';
  const tertiary = project.targetPlayers[2] ?? '内容传播者';

  return [
    {
      name: primary,
      motive: `希望这款 ${project.genre || '游戏'} 能快速兑现“${project.coreFantasy || '核心体验'}”。`,
      accepts: '第一局就能理解目标，并且很快拿到正反馈。',
      rejects: '乐趣需要太长铺垫，或者要先吞下过重学习成本。',
      verdict: '这是第一优先验证对象，应该优先看他们是否愿意继续第二局。',
    },
    {
      name: secondary,
      motive: '愿意尝鲜，但容忍度有限，更看重节奏和反馈密度。',
      accepts: project.sessionLength || '局时和重试节奏足够轻。',
      rejects: '前几分钟信息量过大，或者成长驱动太晚出现。',
      verdict: '他们的流失点最能暴露 onboarding 和节奏问题。',
    },
    {
      name: tertiary,
      motive: '关注传播性、记忆点和可复述的高光时刻。',
      accepts: project.differentiators || '差异化卖点一眼能看懂。',
      rejects: '观感平淡，或者亮点只有自己玩到后期才能理解。',
      verdict: '适合在核心体验初步成立后用于验证外部传播效率。',
    },
  ];
}

function buildHypotheses(project: ProjectSnapshot) {
  const validationGoal = project.validationGoal || '核心玩法是否成立';

  return [
    {
      title: `“${project.coreFantasy || '核心体验承诺'}”能否被当前循环稳定兑现`,
      evidence: project.coreLoop || '目前还没有写清核心循环，主要依据来自一句话想法。',
      confidence: project.coreLoop ? 0.66 : 0.42,
      gap: '需要通过首局录像、玩家复述和卡点记录来判断体验是否被真正感知。',
    },
    {
      title: `目标玩家会不会为“${validationGoal}”继续第二局`,
      evidence:
        project.targetPlayers.length > 0
          ? `当前已明确目标玩家分层：${project.targetPlayers.join(' / ')}。`
          : '目标玩家分层仍不清楚，容易把不同人群的反馈混成一个结论。',
      confidence: project.targetPlayers.length > 0 ? 0.63 : 0.38,
      gap: '需要按玩家分层拆开看接受和反感原因，而不是只看总体好评率。',
    },
    {
      title: '当前差异化卖点是否足够支撑市场记忆点',
      evidence: project.differentiators || '差异化卖点描述仍然偏空，更多像项目愿景而不是可感知的卖点。',
      confidence: project.differentiators ? 0.58 : 0.34,
      gap: '需要把一句卖点翻成 10-15 秒能看懂的玩法片段，再做外部冷启动反馈。',
    },
  ];
}

function buildStrategies(project: ProjectSnapshot, evidenceCount: number) {
  const validationGoal = project.validationGoal || '核心玩法成立';
  const sessionLength = project.sessionLength || '10-15 分钟短局';

  return [
    {
      name: '窄切核心体验原型',
      type: '核心玩法验证',
      cost: '中',
      timeToValue: '2 周',
      acceptance: clamp(60 + evidenceCount * 3 + (project.coreFantasy ? 6 : 0)),
      risk: '如果体验承诺写得很大，但原型里只剩零碎动作，玩家会直接失望。',
      recommendation: `优先围绕“${validationGoal}”做一个 ${sessionLength} 的高密度原型。`,
    },
    {
      name: '目标玩家分层访谈',
      type: '用户理解校准',
      cost: '低',
      timeToValue: '5 天',
      acceptance: clamp(56 + evidenceCount * 2 + (project.targetPlayers.length > 0 ? 8 : 0)),
      risk: '如果分层不准，访谈只会放大已有偏见。',
      recommendation: '把目标玩家拆成至少两层，分别记录“愿意继续玩”和“立刻退出”的原因。',
    },
    {
      name: '题材与卖点冷启动测试',
      type: '市场感知验证',
      cost: '低',
      timeToValue: '1 周',
      acceptance: clamp(48 + (project.differentiators ? 12 : 0) + (project.referenceGames.length > 0 ? 6 : 0)),
      risk: '很容易把题材兴趣误判成玩法可行性。',
      recommendation: '适合作为第二顺位验证，不能替代真实可玩的反馈。',
    },
  ];
}

function buildBlindSpots(project: ProjectSnapshot) {
  const items = [];

  if (!project.targetPlayers.length) {
    items.push({
      area: '目标玩家分层',
      whyItMatters: '如果不知道到底为谁设计，后续的接受度、节奏和难度判断都会失真。',
      missingEvidence: '需要明确核心玩家、边缘玩家和传播型玩家分别是谁。',
    });
  }

  if (!project.sessionLength) {
    items.push({
      area: '局时与节奏锚点',
      whyItMatters: '没有时长和节奏锚点，就很难判断首局信息量和失败恢复成本是否合理。',
      missingEvidence: '需要先定义一局多长、多久给出第一个正反馈、失败后多久能重开。',
    });
  }

  if (!project.progressionHook && !project.socialHook) {
    items.push({
      area: '中期驱动来源',
      whyItMatters: '很多游戏点子首局有趣，但第二局开始就没有再玩的理由。',
      missingEvidence: '需要写清成长驱动、build 变化或社交收益到底从哪里来。',
    });
  }

  if (!project.referenceGames.length) {
    items.push({
      area: '参考游戏与替代品',
      whyItMatters: '没有市场锚点时，团队容易高估新鲜感、低估玩家已有替代体验。',
      missingEvidence: '需要列出 3 个参考游戏，并说明你想借什么、反着做什么。',
    });
  }

  if (!project.productionConstraints) {
    items.push({
      area: '制作约束',
      whyItMatters: '纸面上成立的方向，不一定适合当前团队的带宽和原型周期。',
      missingEvidence: '需要明确团队人数、工期、预算和不能碰的实现复杂度。',
    });
  }

  items.push(
    {
      area: '首局高光是否足够快出现',
      whyItMatters: '游戏项目最怕乐趣成立得太慢，前几分钟只剩说明和负担。',
      missingEvidence: '需要录屏观察玩家多久第一次主动说“这一下有意思”。',
    },
    {
      area: '差异化卖点是否能被外部一眼看懂',
      whyItMatters: '内部说得很顺，不代表外部看到 15 秒素材就知道你和竞品差在哪。',
      missingEvidence: '需要把卖点翻译成能对外验证的片段和文案。',
    },
  );

  return items.slice(0, 3);
}

function buildReferenceLine(project: ProjectSnapshot) {
  return joinOrFallback(project.referenceGames, '参考游戏仍待补充');
}

function buildMarketVerdict(project: ProjectSnapshot) {
  if (project.differentiators) {
    return `题材和卖点开始有形，但还要验证相对 ${buildReferenceLine(project)} 是否足够一眼区分。`;
  }

  return `目前更像“${project.genre || '某个类型'} 的一个方向”，还不像一个足够鲜明的市场叙事。`;
}

export function createLocalSandboxAnalysis(
  project: ProjectSnapshot,
  evidenceItems: EvidenceItem[],
  mode: SandboxAnalysisMode,
  meta: SandboxAnalysisMeta = createAnalysisMeta('local_fallback', 'degraded'),
): SandboxAnalysisResult {
  const evidenceCount = evidenceItems.length;
  const completenessRatio = getCompletenessRatio(project);
  const playerAcceptance = clamp(34 + evidenceCount * 6 + completenessRatio * 30 + (project.targetPlayers.length > 0 ? 6 : 0));
  const confidence = clamp(24 + evidenceCount * 7 + completenessRatio * 40);
  const supportRatio = clamp(18 + evidenceCount * 10 + completenessRatio * 24);
  const prototypeComplexity = getPrototypeComplexity(project);
  const displayIdeaSummary = project.ideaSummary || '当前项目还没有填写完整玩法摘要。';
  const personasFromProject = buildPersonas(project);
  const hypothesesFromProject = buildHypotheses(project);
  const strategiesFromProject = buildStrategies(project, evidenceCount);
  const blindSpots = buildBlindSpots(project);
  const targetPlayers = joinOrFallback(project.targetPlayers, '目标玩家仍未定义');
  const references = buildReferenceLine(project);
  const progressionLine = project.progressionHook || '中期驱动还没有被明确写清';
  const socialLine = project.socialHook || '社交或传播驱动还比较模糊';
  const validationGoal = project.validationGoal || '还没有明确验证目标';

  return {
    generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    mode,
    model: 'multi-stage: local-fallback',
    pipeline: ['dossier@local-fallback', 'specialists@local-fallback', 'synthesis@local-fallback'],
    meta,
    summary: `围绕“${displayIdeaSummary}”生成了一份偏游戏产品验证的本地预览，重点不再是泛判断，而是围绕目标玩家、核心体验、节奏、市场锚点和制作约束来组织问题。`,
    systemVerdict:
      completenessRatio >= 0.7
        ? '方向可以继续推，但下一步应该围绕一个明确的游戏验证目标做收敛。'
        : '先别急着讨论“会不会爆”，先把游戏项目状态补完整，否则推演会持续空转。',
    evidenceLevel: getEvidenceLevel(evidenceCount, completenessRatio),
    primaryRisk: getPrimaryRisk(project, evidenceCount),
    nextStep: getNextStep(project, evidenceCount),
    playerAcceptance,
    confidence,
    supportRatio,
    scores: {
      coreFun: clamp(48 + evidenceCount * 3 + (project.coreFantasy ? 10 : 0) + (project.coreLoop ? 12 : 0)),
      learningCost: clamp(36 + (project.coreLoop ? 0 : 10) + (project.sessionLength ? 0 : 8) + (project.targetPlayers.length > 0 ? 0 : 6)),
      novelty: clamp(42 + (project.differentiators ? 22 : 8) + project.referenceGames.length * 3),
      acceptanceRisk: clamp(34 + (project.targetPlayers.length > 0 ? 0 : 12) + (project.validationGoal ? 0 : 10) + (evidenceCount < 3 ? 8 : 0)),
      prototypeCost: clamp(38 + prototypeComplexity * 8 + (project.productionConstraints ? 0 : 8)),
    },
    personas: personasFromProject,
    hypotheses: hypothesesFromProject,
    strategies:
      strategiesFromProject.length > 0
        ? strategiesFromProject
        : baseStrategies.map((strategy, index) => ({
            ...strategy,
            acceptance:
              index === 1
                ? Math.min(88, strategy.acceptance + evidenceCount * 2)
                : Math.min(80, strategy.acceptance + evidenceCount),
          })),
    perspectives: [
      {
        key: 'systems',
        label: '玩法系统',
        stance: 'bullish',
        confidence: clamp(60 + evidenceCount * 3 + (project.coreLoop ? 6 : 0)),
        verdict: `当前玩法判断的核心，不是概念是否好听，而是“${project.coreFantasy || '核心体验'}”能否被 ${project.coreLoop || '当前循环'} 稳定兑现。`,
        opportunity: '把最想让玩家记住的那一刻压缩到第一局前半段出现。',
        concern: '如果体验承诺和真实操作链路不一致，玩家只会感知到规则成本。',
        leverage: project.sessionLength
          ? `围绕“${project.sessionLength}”去裁切流程，避免首局过长。`
          : '先定义首局时长和第一个正反馈出现时间，再谈系统深度。',
        evidenceRefs: evidenceItems.slice(0, 2).map((item) => item.title),
      },
      {
        key: 'psychology',
        label: '玩家心理',
        stance: 'mixed',
        confidence: clamp(56 + evidenceCount * 3 + (project.targetPlayers.length > 0 ? 6 : 0)),
        verdict: `目标玩家当前定义为 ${targetPlayers}，但还需要确认他们是否真的愿意为这个节奏和负担买单。`,
        opportunity: '把首局目标写得更短、更清晰，让玩家能快速判断“这是不是给我的”。',
        concern: '如果第一局需要大量解释，玩家会把抽象魅力全部折损成理解成本。',
        leverage: '针对不同玩家分层分别记录留下和退出的真正原因。',
        evidenceRefs: evidenceItems.slice(0, 3).map((item) => item.title),
      },
      {
        key: 'economy',
        label: '留存增长',
        stance: 'mixed',
        confidence: clamp(52 + evidenceCount * 3 + (project.progressionHook ? 6 : 0)),
        verdict: `当前中期驱动主要来自“${progressionLine}”，但还要确认它是不是系统复用带来的，而不是纯内容堆量。`,
        opportunity: '先把再来一局的理由写成可验证对象，而不是事后补一个大成长树。',
        concern: '如果成长驱动出现得太晚，项目会高度依赖新鲜感续命。',
        leverage: '优先测试一条短周期成长回路，而不是先做大而全的长期框架。',
        evidenceRefs: evidenceItems.slice(0, 2).map((item) => item.title),
      },
      {
        key: 'market',
        label: '市场定位',
        stance: 'mixed',
        confidence: clamp(50 + evidenceCount * 3 + (project.differentiators ? 8 : 0)),
        verdict: buildMarketVerdict(project),
        opportunity: '先把一句卖点翻成能被外部快速理解的玩法画面和标题。',
        concern: `如果相对 ${references} 的差异仍然模糊，后续获客会越来越贵。`,
        leverage: '尽快录出 15 秒就能讲明白的核心片段，而不是继续扩写概念文档。',
        evidenceRefs: evidenceItems.slice(0, 1).map((item) => item.title),
      },
      {
        key: 'production',
        label: '制作落地',
        stance: 'bearish',
        confidence: clamp(58 + prototypeComplexity * 5 + (project.productionConstraints ? 6 : 0)),
        verdict: `真正的风险不一定在创意本身，而在“${project.productionConstraints || '制作约束尚不明确'}”是否支撑得住这个方向。`,
        opportunity: '把验证对象缩成一个最能代表体验的闭环，先避开高耦合大基建。',
        concern: '如果一开始就把系统铺太开，团队只会越来越难判断问题到底出在哪。',
        leverage: '用当前团队带宽倒推原型范围，而不是用理想产品反推实现。',
        evidenceRefs: evidenceItems.slice(0, 2).map((item) => item.title),
      },
      {
        key: 'red_team',
        label: '反方拆解',
        stance: 'bearish',
        confidence: clamp(66 + evidenceCount * 2 + (project.validationGoal ? 6 : 0)),
        verdict: '当前最危险的不是没有亮点，而是在还没定义清验证边界时就开始为这个方向找越来越多支持它的话。',
        opportunity: '主动搜反证、失败录像和退出理由，会比继续磨一版概念文档更值钱。',
        concern: '团队很容易在“字段越来越完整、叙事越来越顺”里获得虚假确定性。',
        leverage: '固定每一轮都先回答：什么证据出现时，我们应该暂停继续加法。',
        evidenceRefs: evidenceItems.slice(0, 3).map((item) => item.title),
      },
    ],
    blindSpots,
    secondOrderEffects: [
      {
        trigger: `把“${project.differentiators || '差异化卖点'}”做得更极致`,
        outcome: '短期会放大记忆点，但也可能同步抬高 learning cost 和 onboarding 压力。',
        horizon: 'mid',
        direction: 'mixed',
      },
      {
        trigger: '过早补一个很厚的成长系统',
        outcome: '会让纸面上的留存逻辑变得更完整，但也会显著抬高原型成本和错误归因难度。',
        horizon: 'near',
        direction: 'mixed',
      },
      {
        trigger: '先去做题材和包装冷启动',
        outcome: '更容易获得关注，但也可能让团队误把外部兴趣当成真实玩法成立。',
        horizon: 'long',
        direction: 'negative',
      },
    ],
    scenarioVariants: [
      {
        name: '窄切首局原型',
        premise: `把范围压到围绕“${validationGoal}”的一段高密度体验，只看核心承诺是否成立。`,
        upside: '能最快验证第一性问题，制作和观察成本都更可控。',
        downside: '中期驱动和长期留存信号会不完整。',
        watchSignals: ['首局完成率', '玩家主动复述的高光时刻', '第二局开启意愿'],
        recommendedMove: '优先作为 P0 原型路线。',
      },
      {
        name: '先补中期驱动再测',
        premise: `把“${progressionLine}”和“${socialLine}”一起放进原型，尝试更早观察留存理由。`,
        upside: '如果成立，能更早看到完整产品轮廓。',
        downside: '会显著增加实现复杂度，并模糊问题归因。',
        watchSignals: ['成长目标完成率', '中局流失点', '玩家是否真的记住差异化卖点'],
        recommendedMove: '适合在核心体验被证明成立后再推进。',
      },
    ],
    decisionLenses: [
      {
        name: '核心体验优先',
        keyQuestion: '玩家在第一局里有没有真正感知到你承诺的那种体验，而不是只看懂了规则？',
        answer: '这是当前最该先回答的问题，优先级高于把系统继续做厚。',
      },
      {
        name: '目标玩家优先',
        keyQuestion: '你现在收到的反馈，到底来自核心玩家、边缘玩家，还是传播型玩家？',
        answer: '如果不拆分人群，所有“玩家都说”都会失真。',
      },
      {
        name: '产能优先',
        keyQuestion: '这个方向的乐趣是系统复用产生的，还是需要大量内容和基建才能显现？',
        answer: '如果答案偏后者，原型成本和长期维护压力都会迅速升高。',
      },
    ],
    validationTracks: [
      {
        name: 'P0 核心体验验证',
        priority: 'P0',
        goal: `确认“${validationGoal}”是否能在首局内被玩家真实感知。`,
        method: '做一个高密度短局原型，录屏观察玩家什么时候真正理解并愿意继续玩。',
        successSignal: '测试玩家会主动复述核心体验，而不只是复述规则。',
        failureSignal: '玩家更多在讨论说明、负担和不确定自己为什么要继续。',
        cost: '中',
        timeframe: '1 周',
      },
      {
        name: 'P0 目标玩家分层验证',
        priority: 'P0',
        goal: '确认当前定义的目标玩家是否真的最容易买单，而不是团队自我想象。',
        method: '至少找两类玩家做对照测试，分开记录他们的留下原因和退出原因。',
        successSignal: '核心人群的正反馈显著集中在你想验证的体验上。',
        failureSignal: '不同人群的反馈互相冲突，且没有明显优先级。',
        cost: '低',
        timeframe: '1 周',
      },
      {
        name: 'P1 制作约束回推验证',
        priority: 'P1',
        goal: '确认当前团队带宽和工期是否真的撑得住这个原型范围。',
        method: `把“${project.productionConstraints || '当前制作约束'}”拆成任务清单，找出最该砍掉的复杂度来源。`,
        successSignal: '两周内能明确交付一个可测试闭环，而不是一堆未闭环系统。',
        failureSignal: '计划里出现大量基础设施和支撑性工作，却没有核心体验闭环。',
        cost: '中',
        timeframe: '2 周',
      },
    ],
    contrarianMoves: [
      {
        title: '先砍掉非验证目标功能',
        thesis: `如果这轮真正要验证的是“${validationGoal}”，那所有不能直接服务这个目标的功能都应该晚一点。`,
        whenToUse: '当原型范围开始失控，或者团队在不同问题之间来回切换时立即执行。',
      },
      {
        title: '先把项目当成“一个体验命题”而不是“完整游戏”',
        thesis: '缩小问题边界，能更快找到真正值得被放大的体验核。',
        whenToUse: '当制作复杂度明显快于验证速度，或者市场叙事还远强于真实体验时执行。',
      },
    ],
    unknowns: [
      {
        topic: '第二局之后的真实留存驱动',
        whyUnknown: '当前还没有足够行为证据证明成长、社交或内容供给谁才是真正驱动。',
        resolveBy: '跟踪短局原型后的复玩、流失点和主动回流理由。',
      },
      {
        topic: '差异化卖点是否足够外化',
        whyUnknown: '现在更像内部语言，还没有能让外部秒懂的真实片段和文案。',
        resolveBy: '制作 15 秒玩法片段和一句话卖点，做冷启动理解测试。',
      },
    ],
    redTeam: {
      thesis: '如果团队继续围绕概念做加法，而不是围绕验证目标做减法，这个方向会越来越“像一个产品”，却不一定越来越接近真实成立条件。',
      attackVectors: ['把题材想象误判成玩法成立', '用系统厚度掩盖核心体验不成立', '在目标玩家没有分层前就开始解释所有反馈'],
      failureModes: ['首局高光出现太慢', '目标玩家定义过宽', '原型范围被制作复杂度拖垮'],
      mitigation: '把每轮评审都改成“先看本轮要否定什么，再看还要扩什么”。',
    },
    memorySignals: [
      {
        title: '本地预览模式',
        summary: '当前展示的是偏游戏产品验证的本地兜底结果，主要用于预览结构、字段覆盖和判断路径。',
        signalStrength: 'warning',
      },
    ],
    report: {
      headline: '继续推进，但先把它当成一个待验证的游戏体验命题',
      summary: '这一版本地预览已经把目标玩家、核心体验、节奏、市场锚点和制作约束纳入同一个判断框架。',
      conclusion: '方向仍可能成立，但下一步最重要的不是继续做大，而是证明你写下来的体验承诺真的会被目标玩家感知到。',
      whyNow: '因为越早把验证目标收尖，越不容易在制作复杂度和内部叙事里空转。',
      risk: '如果继续只围绕概念文档做加法，结果会越来越像“会说话的项目包装”，而不是可执行的游戏产品推演。',
      actions: [
        `把“${validationGoal}”写成一句能判输赢的话，并固定在本轮顶部。`,
        '先做一个只服务验证目标的短局闭环，不要让附属系统抢预算。',
        '把测试玩家按分层拆开记录，别再把不同人群反馈混成一条结论。',
        '每轮复盘先写反证和退出理由，再决定还要不要继续加功能。',
      ],
    },
    warnings: ['当前展示为本地多阶段兜底结果，正式深度推演需要后端模型完整返回。'],
  };
}
