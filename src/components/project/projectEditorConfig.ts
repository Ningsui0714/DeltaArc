import type { GuidedRefinementFieldId, ProjectIntakeFieldId } from '../../lib/projectIntake';

export type LocalizedCopy = {
  zh: string;
  en: string;
};

export type ProjectFieldConfig = {
  field: ProjectIntakeFieldId;
  kind: 'text' | 'textarea' | 'list' | 'select';
  rows?: number;
  wide?: boolean;
  label: LocalizedCopy;
  hint: LocalizedCopy;
  placeholder: LocalizedCopy;
};

export type ProjectGuidedPromptConfig = {
  id: GuidedRefinementFieldId;
  title: LocalizedCopy;
  prompt: LocalizedCopy;
  hint: LocalizedCopy;
  placeholder: LocalizedCopy;
  suggestions: LocalizedCopy[];
};

const copy = (zh: string, en: string): LocalizedCopy => ({ zh, en });

export function pickCopy(value: LocalizedCopy, isEnglish: boolean) {
  return isEnglish ? value.en : value.zh;
}

export const projectEditorHeaderCopy = {
  eyebrow: copy('项目前期输入', 'Project Intake'),
  title: copy('先把判断问题讲清楚，再补细节', 'Start with the decision, then refine it'),
  badge: copy('起跑信息 + 引导补全', 'Starter brief + guided refinement'),
  noteTitle: copy('现在这套填写逻辑怎么走', 'How this flow works now'),
  noteBody: copy(
    '你不需要一上来就把完整方案全写出来。先补齐起跑信息，再用引导式追问把优势、风险和缺口补清楚。',
    'You no longer need a full proposal upfront. Fill the starter brief first, then use guided prompts to sharpen strengths, risks, and missing information.',
  ),
};

export const projectEditorFieldLabels: Record<ProjectIntakeFieldId, LocalizedCopy> = {
  name: copy('项目名称', 'Project Name'),
  mode: copy('阶段模式', 'Stage Mode'),
  genre: copy('游戏类型', 'Genre'),
  platforms: copy('目标平台', 'Platforms'),
  ideaSummary: copy('一句话想法', 'One-Line Validation Goal'),
  coreLoop: copy('核心循环', 'Core Loop'),
  targetPlayers: copy('目标玩家', 'Target Players'),
  validationGoal: copy('本轮验证目标', 'Decision Bar For This Round'),
  coreFantasy: copy('核心体验承诺', 'Why Players Stay'),
  differentiators: copy('差异化卖点', 'Sharpest Differentiator'),
  progressionHook: copy('成长驱动', 'Return / Progression Hook'),
  socialHook: copy('社交 / 传播驱动', 'Sharing / Social Trigger'),
  currentStatus: copy('当前最担心的问题', 'Main Risk Right Now'),
  productionConstraints: copy('制作约束', 'Production Constraints'),
  sessionLength: copy('单局时长 / 节奏', 'Session Length / Pace'),
  referenceGames: copy('参考游戏', 'Reference Games'),
  monetization: copy('商业化设想', 'Monetization Plan'),
};

export const projectEditorFields = {
  starter: [
    {
      field: 'ideaSummary',
      kind: 'textarea',
      rows: 4,
      label: projectEditorFieldLabels.ideaSummary,
      hint: copy('先用一句话说清楚这轮到底要证明什么。', 'Say what you want to prove this round.'),
      placeholder: copy(
        '例如：验证双人救场时刻是否足够强，能不能撑起第 3 天回流。',
        'For example: validate whether two-player rescue moments are strong enough to carry day-3 retention.',
      ),
    },
    {
      field: 'coreLoop',
      kind: 'textarea',
      rows: 4,
      label: projectEditorFieldLabels.coreLoop,
      hint: copy('按顺序写动作，不要写抽象概念。', 'Keep it concrete and sequential.'),
      placeholder: copy('例如：探索 -> 收集 -> 触发双人机关 -> 防守 -> 升级。', 'For example: explore -> gather -> trigger co-op machine -> defend -> upgrade.'),
    },
    {
      field: 'targetPlayers',
      kind: 'list',
      label: projectEditorFieldLabels.targetPlayers,
      hint: copy('用逗号分开。先写最先该心动的那群人。', 'Separate with commas. Who should care first?'),
      placeholder: copy('例如：轻度合作玩家，直播传播型玩家，生存建造爱好者', 'For example: light co-op players, stream-friendly players, survival builders'),
    },
    {
      field: 'validationGoal',
      kind: 'textarea',
      rows: 4,
      label: projectEditorFieldLabels.validationGoal,
      hint: copy('写出什么结果会让你继续、暂停或改方向。', 'What outcome makes you continue, pause, or change direction?'),
      placeholder: copy(
        '例如：只有当玩家在不靠冗长教学的前提下，10 分钟内稳定出现第一次合作高光，才继续推进。',
        'For example: continue only if players hit the first co-op high point within 10 minutes without a long tutorial.',
      ),
    },
  ] satisfies ProjectFieldConfig[],
  identity: [
    {
      field: 'name',
      kind: 'text',
      label: projectEditorFieldLabels.name,
      hint: copy('先有代号就够，不必一次定正式名。', 'A working name is enough.'),
      placeholder: copy('例如：代号：远岸旅团', 'For example: Project Farshore'),
    },
    {
      field: 'mode',
      kind: 'select',
      label: projectEditorFieldLabels.mode,
      hint: copy('阶段不同，系统对问题的理解重点也不同。', 'This affects how you frame the question.'),
      placeholder: copy('', ''),
    },
    {
      field: 'genre',
      kind: 'text',
      label: projectEditorFieldLabels.genre,
      hint: copy('写成外行也能懂的一句话类型。', 'Keep it readable, not encyclopedic.'),
      placeholder: copy('例如：合作生存 / Roguelike 模拟经营', 'For example: co-op survival / roguelike management'),
    },
    {
      field: 'platforms',
      kind: 'list',
      label: projectEditorFieldLabels.platforms,
      hint: copy('用逗号分开目标平台。', 'Separate with commas.'),
      placeholder: copy('例如：PC, Steam Deck, iOS', 'For example: PC, Steam Deck, iOS'),
    },
  ] satisfies ProjectFieldConfig[],
  advantage: [
    {
      field: 'coreFantasy',
      kind: 'textarea',
      rows: 3,
      wide: true,
      label: projectEditorFieldLabels.coreFantasy,
      hint: copy('写玩家为什么愿意留下来，而不是系统功能列表。', 'Describe the feeling players come back for.'),
      placeholder: copy('玩家打出一局好局之后会感受到什么？为什么还会想再来一局？', 'What should players feel after a good run, and why would they want one more?'),
    },
    {
      field: 'differentiators',
      kind: 'textarea',
      rows: 3,
      wide: true,
      label: projectEditorFieldLabels.differentiators,
      hint: copy('先写最能让人一眼记住的那一下。', 'What should people remember immediately?'),
      placeholder: copy('相对竞品，最值得被一眼记住、最容易被复述的是什么？', 'Compared with competitors, what is the one thing people should retell right away?'),
    },
    {
      field: 'progressionHook',
      kind: 'textarea',
      rows: 3,
      wide: true,
      label: projectEditorFieldLabels.progressionHook,
      hint: copy('玩家觉得有趣之后，第二天为什么还会回来？', 'Why come back after the first session?'),
      placeholder: copy('中期回流靠什么支撑，例如成长、收集、build 变化、章节推进，还是别的？', 'What drives mid-term retention: progression, collection, build variance, chapter goals, or something else?'),
    },
    {
      field: 'socialHook',
      kind: 'textarea',
      rows: 3,
      wide: true,
      label: projectEditorFieldLabels.socialHook,
      hint: copy('如果它真的依赖传播，这里写具体触发点。', 'Only if this truly matters.'),
      placeholder: copy('如果它值得分享，具体会是哪一幕、哪种失误、哪种翻盘会推动传播？', 'If it becomes shareable, what exact moment or mechanic creates that?'),
    },
  ] satisfies ProjectFieldConfig[],
  risk: [
    {
      field: 'currentStatus',
      kind: 'textarea',
      rows: 3,
      wide: true,
      label: projectEditorFieldLabels.currentStatus,
      hint: copy('把最危险的短板说出来，不要藏。', 'Name the risk you do not want to hide.'),
      placeholder: copy('例如：上手成本可能会掩盖第一次真正有趣的合作高光。', 'For example: onboarding cost may hide the first real fun moment.'),
    },
    {
      field: 'productionConstraints',
      kind: 'textarea',
      rows: 3,
      wide: true,
      label: projectEditorFieldLabels.productionConstraints,
      hint: copy('只写会改变判断的真实限制。', 'Only write real constraints that affect decisions.'),
      placeholder: copy('团队人数、预算、工期、内容产能、技术栈限制，或外部档期要求。', 'Team size, budget, timeline, content throughput, tech limits, or publisher commitments.'),
    },
  ] satisfies ProjectFieldConfig[],
  background: [
    {
      field: 'sessionLength',
      kind: 'text',
      label: projectEditorFieldLabels.sessionLength,
      hint: copy('尽量用玩家能感知到的节奏表述。', 'Keep it player-facing.'),
      placeholder: copy('例如：12 分钟短局，失败后能快速重开', 'For example: 12-minute short runs with fast restarts'),
    },
    {
      field: 'referenceGames',
      kind: 'list',
      label: projectEditorFieldLabels.referenceGames,
      hint: copy('用逗号分开，但别堆太多。', 'Separate with commas.'),
      placeholder: copy('例如：Hades, Deep Rock Galactic, 饥荒联机版', 'For example: Hades, Deep Rock Galactic, Don’t Starve Together'),
    },
    {
      field: 'monetization',
      kind: 'textarea',
      rows: 3,
      wide: true,
      label: projectEditorFieldLabels.monetization,
      hint: copy('如果这一轮判断会受商业化影响，再补这项。', 'Optional, only if it affects this round.'),
      placeholder: copy('例如：先验证买断制核心，再评估装扮或赛季内容', 'For example: premium first, cosmetics later'),
    },
  ] satisfies ProjectFieldConfig[],
};

export const projectEditorGuidedPrompts: ProjectGuidedPromptConfig[] = [
  {
    id: 'coreFantasy',
    title: copy('玩家为什么会留下来？', 'Why would players stay?'),
    prompt: copy('直接说玩家反复回来想要的感受，不要写成玩法功能清单。', 'Describe the emotional payoff that should keep players coming back.'),
    hint: copy('这段回答会写进核心体验承诺。', 'This answer updates the core promise.'),
    placeholder: copy('玩家会留下来，因为每次救场都像一次短促但高压的团队翻盘。', 'Players stay because each rescue feels like a short, high-pressure team miracle.'),
    suggestions: [
      copy('玩家会为了高压协作的翻盘感反复开局。', 'Players stay for high-pressure team rescues.'),
      copy('玩家会为了 build 变化和局内成长继续回来。', 'Players stay for constant build variation.'),
      copy('玩家会因为失败后能快速再试一次而不容易流失。', 'Players stay because failure quickly turns into another attempt.'),
    ],
  },
  {
    id: 'differentiators',
    title: copy('它最能打的卖点是什么？', 'What is the sharpest selling point?'),
    prompt: copy('先说最希望别人一看就记住、甚至愿意复述出去的那一下。', 'Say the one thing you most want people to remember or retell.'),
    hint: copy('这段回答会写进差异化卖点。', 'This answer updates differentiation.'),
    placeholder: copy('我们的合作机关比慢节奏刷资源更容易高频制造“差一点就团灭但被救回来了”的高光。', 'Our co-op machines create memorable rescues more often than slower survival grinds do.'),
    suggestions: [
      copy('高频救场高光，而不是长时间刷资源。', 'High-frequency rescue highs instead of long resource grinds.'),
      copy('同一个机制同时制造合作和甩锅张力。', 'One mechanic creates both cooperation and blame tension.'),
      copy('观感清楚，剪成短视频也能立刻看懂。', 'The game is readable enough to be watchable in clips.'),
    ],
  },
  {
    id: 'currentStatus',
    title: copy('它最可能输在哪里？', 'Where is it most likely to fail?'),
    prompt: copy('把现在最怕出问题的地方说出来，不要粉饰。', 'Name the failure point you worry about most right now.'),
    hint: copy('这段回答会写进当前最担心的问题。', 'This answer updates the main concern.'),
    placeholder: copy('玩家可能在还没看懂机制前就开始责怪队友，导致真正的乐趣还没出现就先流失了。', 'Players may blame teammates before they understand the mechanic, which hides the real fun.'),
    suggestions: [
      copy('第一次真正有趣的时刻出现得太晚。', 'The first fun moment may appear too late.'),
      copy('玩家会先怪队友，而不是理解机制。', 'Players may blame teammates before understanding the rules.'),
      copy('卖点能记住，但可能不够支撑回流。', 'The feature is memorable, but not strong enough to support return visits.'),
    ],
  },
  {
    id: 'progressionHook',
    title: copy('他们第二天为什么会回来？', 'Why would they return tomorrow?'),
    prompt: copy('说清楚玩家觉得好玩之后，为什么第二天还会回来继续。', 'Explain what makes the game sticky after the first good session.'),
    hint: copy('这段回答会写进成长驱动。', 'This answer updates the return hook.'),
    placeholder: copy('每一局都会解锁新的协作组合，玩家会想试新的救场方案和分工。', 'Each run unlocks a different co-op combination, so players want to test new rescue plans.'),
    suggestions: [
      copy('局内 build 变化会驱动回流。', 'Run-to-run build variation drives return visits.'),
      copy('玩家会回来追求更顺的分工配合。', 'Players come back to master cleaner team coordination.'),
      copy('失败后也有短周期成长反馈，不会白打。', 'A short meta layer gives each failed run a useful payoff.'),
    ],
  },
  {
    id: 'socialHook',
    title: copy('什么会让它值得传播？', 'What makes it shareable?'),
    prompt: copy('如果它会被分享，具体是哪一幕、哪个机制、哪种事故会推动传播？', 'If this game earns social spread, what exact moment or trigger creates that?'),
    hint: copy('这段回答会写进社交 / 传播驱动。', 'This answer updates the sharing hook.'),
    placeholder: copy('那种差一点崩盘、两个人同时大喊着补位救回来的瞬间，就是最容易传播的切片。', 'Near-disaster recoveries where both players must shout and react at the same time are the clip moment.'),
    suggestions: [
      copy('协作救场本身就适合被切成高光片段。', 'Co-op rescues create clip-worthy tension.'),
      copy('队友误判会制造又气又好笑的甩锅时刻。', 'Misreads between players create funny blame moments.'),
      copy('旁观者能很快看懂混乱发生了什么。', 'The game is readable enough that spectators understand the chaos quickly.'),
    ],
  },
  {
    id: 'productionConstraints',
    title: copy('什么现实约束会改变判断？', 'What real constraint shapes the decision?'),
    prompt: copy('把真正会改变立项判断的现实限制写清楚。', 'Write the constraint that most changes scope, sequencing, or risk tolerance.'),
    hint: copy('这段回答会写进制作约束。', 'This answer updates production constraints.'),
    placeholder: copy('只有 2 人团队和 6 周原型周期，所以新手引导和内容范围都必须非常收敛。', 'A two-person team only has six weeks for a prototype, so onboarding and content scope must stay narrow.'),
    suggestions: [
      copy('团队只能做一个高密度短循环原型。', 'The team can only build one dense short-loop prototype.'),
      copy('当前内容产能还撑不起长线章节制。', 'Content production cannot support a long campaign yet.'),
      copy('技术风险不允许第一版同时上太多系统复杂度。', 'Tech limits mean we should avoid systemic complexity in the first prototype.'),
    ],
  },
];
