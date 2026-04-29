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
  eyebrow: copy('任务输入', 'Campaign Intake'),
  title: copy('先把传播目标讲清楚，再补细节', 'Start with the strategy call, then refine it'),
  badge: copy('起跑信息 + 引导补全', 'Starter brief + guided refinement'),
  noteTitle: copy('如果已有材料，推荐先文件导入', 'If you already have docs, import first'),
  noteBody: copy(
    '如果你已经有 brief JSON、投放方案 Markdown 或需求 TXT，建议先在上方导入，再来这里补充和修正字段。手动填写更适合从空白开始，或对导入结果继续补改。',
    'If you already have a brief JSON bundle, campaign Markdown, or requirement TXT, import it above first and then refine fields here. Manual editing works best when starting from scratch or polishing imported content.',
  ),
};

export const projectEditorFieldLabels: Record<ProjectIntakeFieldId, LocalizedCopy> = {
  name: copy('项目名称', 'Project Name'),
  mode: copy('当前阶段', 'Stage'),
  genre: copy('内容类型', 'Content Format'),
  platforms: copy('目标平台', 'Platforms'),
  ideaSummary: copy('一句话传播目标', 'One-Line Campaign Goal'),
  coreLoop: copy('内容增长回路', 'Content Growth Loop'),
  targetPlayers: copy('目标受众', 'Target Audience'),
  validationGoal: copy('本轮验证目标', 'Decision Bar For This Round'),
  coreFantasy: copy('账号 / 内容承诺', 'Account / Content Promise'),
  differentiators: copy('内容差异点', 'Sharpest Content Angle'),
  progressionHook: copy('关注 / 回访原因', 'Follow / Return Hook'),
  socialHook: copy('评论 / 转发触发点', 'Comment / Share Trigger'),
  currentStatus: copy('当前最担心的问题', 'Main Risk Right Now'),
  productionConstraints: copy('产能与合作约束', 'Production Constraints'),
  sessionLength: copy('内容节奏', 'Content Pace'),
  referenceGames: copy('对标账号 / 案例', 'Reference Accounts / Cases'),
  monetization: copy('转化目标', 'Conversion Goal'),
};

export const projectEditorFields = {
  starter: [
    {
      field: 'ideaSummary',
      kind: 'textarea',
      rows: 4,
      label: projectEditorFieldLabels.ideaSummary,
      hint: copy('先用一句话说清楚这轮传播到底想证明什么。', 'Say what this round is trying to prove.'),
      placeholder: copy(
        '例如：验证“室友盲测反应”是否比功能介绍更能带动评论、收藏和到店意愿。',
        'For example: validate whether roommate reaction posts outperform feature-led posts on comments, saves, and store intent.',
      ),
    },
    {
      field: 'coreLoop',
      kind: 'textarea',
      rows: 4,
      label: projectEditorFieldLabels.coreLoop,
      hint: copy('按用户实际行为顺序写，不要写抽象概念。', 'Keep it concrete and sequential.'),
      placeholder: copy(
        '例如：刷到内容 -> 看室友反应 -> 点进评论区 -> 收藏 -> 约朋友去试',
        'For example: see the post -> watch the reaction -> open comments -> save -> plan a visit',
      ),
    },
    {
      field: 'targetPlayers',
      kind: 'list',
      label: projectEditorFieldLabels.targetPlayers,
      hint: copy('用逗号分开。先写最先会被打动的人。', 'Separate with commas. Who should care first?'),
      placeholder: copy(
        '例如：校园生活内容用户，饮品种草用户，愿意发室友日常的学生',
        'For example: campus lifestyle audiences, drink-discovery audiences, students who post roommate life',
      ),
    },
    {
      field: 'validationGoal',
      kind: 'textarea',
      rows: 4,
      label: projectEditorFieldLabels.validationGoal,
      hint: copy('写出什么结果会让你继续、暂停或换方向。', 'What outcome makes you continue, pause, or change direction?'),
      placeholder: copy(
        '例如：只有当“室友盲测”内容在评论率和收藏率上都明显优于功能介绍，才继续把它做成主内容线。',
        'For example: continue only if the roommate blind-test angle clearly beats feature-led posts on both comment rate and save rate.',
      ),
    },
  ] satisfies ProjectFieldConfig[],
  identity: [
    {
      field: 'name',
      kind: 'text',
      label: projectEditorFieldLabels.name,
      hint: copy('先有代号就够，不必一次定正式名。', 'A working name is enough.'),
      placeholder: copy('例如：校园咖啡春季上新', 'For example: Campus Coffee Spring Launch'),
    },
    {
      field: 'mode',
      kind: 'select',
      label: projectEditorFieldLabels.mode,
      hint: copy('阶段不同，系统对问题的理解重点也不同。', 'This affects how the task is framed.'),
      placeholder: copy('', ''),
    },
    {
      field: 'genre',
      kind: 'text',
      label: projectEditorFieldLabels.genre,
      hint: copy('写成外行也能懂的一句话类型。', 'Keep it readable, not encyclopedic.'),
      placeholder: copy('例如：校园种草短视频 / 小红书图文测评', 'For example: campus seeding short video / RedNote photo review'),
    },
    {
      field: 'platforms',
      kind: 'list',
      label: projectEditorFieldLabels.platforms,
      hint: copy('用逗号分开目标平台。', 'Separate with commas.'),
      placeholder: copy('例如：小红书, 视频号, 抖音', 'For example: RedNote, WeChat Channels, Douyin'),
    },
  ] satisfies ProjectFieldConfig[],
  advantage: [
    {
      field: 'coreFantasy',
      kind: 'textarea',
      rows: 3,
      wide: true,
      label: projectEditorFieldLabels.coreFantasy,
      hint: copy('写用户为什么愿意停下来、记住你，而不是素材清单。', 'Describe the feeling or promise, not a feature list.'),
      placeholder: copy(
        '用户看完后会记住：这不是在卖产品功能，而是在展示“室友真实反应”和“今天就想去试”的生活感。',
        'Users should remember that this is not a feature explainer. It is about real roommate reactions and instant try-it-now energy.',
      ),
    },
    {
      field: 'differentiators',
      kind: 'textarea',
      rows: 3,
      wide: true,
      label: projectEditorFieldLabels.differentiators,
      hint: copy('先写最容易被一眼记住和复述的那个角度。', 'What should people remember immediately?'),
      placeholder: copy(
        '相对竞品，最值得被一眼记住的是：内容不是官方卖点复述，而是把“室友日常反应”做成主叙事。',
        'Compared with competitors, the memorable angle is that the content is built around roommate reactions instead of official selling points.',
      ),
    },
    {
      field: 'progressionHook',
      kind: 'textarea',
      rows: 3,
      wide: true,
      label: projectEditorFieldLabels.progressionHook,
      hint: copy('用户看过一条之后，为什么还会回来继续看？', 'Why would someone come back after the first post?'),
      placeholder: copy(
        '每次上新都能换一个宿舍场景和反应人物，用户会回来追“这次谁会被种草”。',
        'Each launch can reuse a new dorm scenario and new reactions, so audiences come back to see who gets converted next.',
      ),
    },
    {
      field: 'socialHook',
      kind: 'textarea',
      rows: 3,
      wide: true,
      label: projectEditorFieldLabels.socialHook,
      hint: copy('如果它真的值得传播，这里写具体触发点。', 'Be concrete about the sharing trigger.'),
      placeholder: copy(
        '评论区会被“你们宿舍也会这样吗”“这杯到底选哪个口味”这类讨论拉起来，转发点来自真实室友反应和投票感。',
        'Comments should light up around questions like “Is your dorm like this too?” and “Which flavor would you pick?” with shares driven by real roommate reactions.',
      ),
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
      placeholder: copy(
        '例如：内容可能看起来热闹，但评论和转化都不够，像一阵表面热度。',
        'For example: the content may feel lively but still fail to move comments or conversion, which would mean only surface buzz.',
      ),
    },
    {
      field: 'productionConstraints',
      kind: 'textarea',
      rows: 3,
      wide: true,
      label: projectEditorFieldLabels.productionConstraints,
      hint: copy('只写会改变判断的真实限制。', 'Only write real constraints that affect decisions.'),
      placeholder: copy(
        '例如：只有 2 位校园 KOC 愿意配合拍摄，每周只能稳定产出 3 条内容，线下试饮档期只有 2 周。',
        'For example: only two campus KOCs are available, the team can ship three posts per week, and the offline tasting window lasts two weeks.',
      ),
    },
  ] satisfies ProjectFieldConfig[],
  background: [
    {
      field: 'sessionLength',
      kind: 'text',
      label: projectEditorFieldLabels.sessionLength,
      hint: copy('尽量用用户可感知的节奏表述。', 'Keep it audience-facing.'),
      placeholder: copy('例如：15 秒开头抓眼，30 秒内给出室友反应和评论钩子', 'For example: hook in 15 seconds, reaction and comment trigger within 30 seconds'),
    },
    {
      field: 'referenceGames',
      kind: 'list',
      label: projectEditorFieldLabels.referenceGames,
      hint: copy('用逗号分开，但别堆太多。', 'Separate with commas.'),
      placeholder: copy('例如：校园版瑞幸种草, 小红书宿舍测评账号, 校园探店视频号', 'For example: campus coffee seeding accounts, dorm-life review creators, campus visit channels'),
    },
    {
      field: 'monetization',
      kind: 'textarea',
      rows: 3,
      wide: true,
      label: projectEditorFieldLabels.monetization,
      hint: copy('如果这一轮判断会受转化目标影响，再补这项。', 'Optional, only if it affects this round.'),
      placeholder: copy('例如：优先看到店、领券、UGC 跟拍，暂不追 GMV', 'For example: prioritize store visits, coupon claims, and UGC follow-up posts before revenue'),
    },
  ] satisfies ProjectFieldConfig[],
};

export const projectEditorGuidedPrompts: ProjectGuidedPromptConfig[] = [
  {
    id: 'coreFantasy',
    title: copy('用户为什么会停下来？', 'Why would people stop and care?'),
    prompt: copy('直接说用户会记住什么内容感觉或账号承诺，不要写成功能点清单。', 'Describe the content promise or feeling, not a feature list.'),
    hint: copy('这段回答会写进账号 / 内容承诺。', 'This answer updates the content promise.'),
    placeholder: copy(
      '用户会停下来，因为内容像真实宿舍对话，不像品牌在宣讲卖点。',
      'People stop because the content feels like real dorm conversation, not a brand script.',
    ),
    suggestions: [
      copy('用户会记住真实室友反应，而不是产品参数。', 'People remember real roommate reactions, not product specs.'),
      copy('用户会因为“我也想拉朋友一起试”而留下。', 'People stay because they want to try it with friends.'),
      copy('用户会把内容当成一种生活方式线索，而不是硬广。', 'People read the post as a lifestyle cue, not a hard sell.'),
    ],
  },
  {
    id: 'differentiators',
    title: copy('最能打的角度是什么？', 'What is the sharpest angle?'),
    prompt: copy('先说最希望别人一看就记住、甚至愿意复述出去的那一下。', 'Say the one thing you most want people to remember or retell.'),
    hint: copy('这段回答会写进内容差异点。', 'This answer updates differentiation.'),
    placeholder: copy(
      '我们的内容不是在教大家“这杯有什么”，而是在展示“谁会因为哪一口当场被种草”。',
      'The content is not about explaining the drink. It is about showing who gets converted by which first sip.',
    ),
    suggestions: [
      copy('真实反应比功能清单更有传播力。', 'Real reactions beat feature lists in spreadability.'),
      copy('内容主角是宿舍关系，不是品牌口播。', 'The lead character is dorm dynamics, not brand copy.'),
      copy('看完一条就能知道评论区会怎么吵起来。', 'One post should already hint at how comments will light up.'),
    ],
  },
  {
    id: 'currentStatus',
    title: copy('它最可能输在哪里？', 'Where is it most likely to fail?'),
    prompt: copy('把现在最怕出问题的地方说出来，不要粉饰。', 'Name the failure point you worry about most right now.'),
    hint: copy('这段回答会写进当前最担心的问题。', 'This answer updates the main concern.'),
    placeholder: copy(
      '内容可能看上去热闹，但如果评论和收藏起不来，说明大家只是看完就划走了。',
      'The content may feel lively, but if comments and saves stay flat, people probably just scroll away.',
    ),
    suggestions: [
      copy('看起来像模板化种草，不像真实校园生活。', 'It may look templated instead of real campus life.'),
      copy('评论和分享触发点可能不够强。', 'The comment and share triggers may be too weak.'),
      copy('同一角度重复太多，容易让内容疲劳。', 'The same angle may repeat too often and fatigue the feed.'),
    ],
  },
  {
    id: 'progressionHook',
    title: copy('他们为什么会回来继续看？', 'Why would they come back tomorrow?'),
    prompt: copy('说清楚用户看完第一条之后，为什么还会继续看下一条。', 'Explain what brings them back after the first post.'),
    hint: copy('这段回答会写进关注 / 回访原因。', 'This answer updates the return hook.'),
    placeholder: copy(
      '因为每次都能换宿舍角色和场景，用户会回来追“这次谁会被种草、谁会翻车”。',
      'Each post can swap the dorm role and scene, so audiences return to see who gets converted and who fails next.',
    ),
    suggestions: [
      copy('每一条都能换一个更有代入感的宿舍场景。', 'Each post can rotate into a new dorm situation.'),
      copy('用户会回来追不同人的反应和站队。', 'People return to follow different reactions and sides.'),
      copy('评论区会形成连续讨论，不止一条内容的热度。', 'The comments can build a continuing thread instead of a one-off spike.'),
    ],
  },
  {
    id: 'socialHook',
    title: copy('什么会让它值得传播？', 'What makes it shareable?'),
    prompt: copy('如果它会被分享，具体是哪一幕、哪个问题、哪种关系张力会推动传播？', 'If it gets shared, what exact moment or tension creates that?'),
    hint: copy('这段回答会写进评论 / 转发触发点。', 'This answer updates the sharing trigger.'),
    placeholder: copy(
      '最容易传播的是“室友喝第一口后的真实反应”和“到底选哪个口味”的站队讨论。',
      'The most shareable trigger is the roommate’s first-sip reaction plus the argument over which flavor wins.',
    ),
    suggestions: [
      copy('真实反应和站队讨论最容易带评论。', 'Real reactions and side-taking debates drive comments.'),
      copy('用户会转给朋友问“你会选哪个”。', 'People forward it to friends with “Which one would you pick?”'),
      copy('生活场景越熟悉，越容易被带入和复述。', 'The more familiar the scene, the easier it is to retell.'),
    ],
  },
  {
    id: 'productionConstraints',
    title: copy('什么现实约束会改变判断？', 'What real constraint shapes the decision?'),
    prompt: copy('把真正会改变策略判断的现实限制写清楚。', 'Write the constraint that most changes scope or timing.'),
    hint: copy('这段回答会写进产能与合作约束。', 'This answer updates production constraints.'),
    placeholder: copy(
      '只有 2 位校园 KOC 愿意配合拍摄，线下试饮窗口只有 2 周，所以内容主线必须非常收敛。',
      'Only two campus KOCs are available and the offline tasting window is two weeks, so the content line must stay narrow.',
    ),
    suggestions: [
      copy('当前产能只够做一个高辨识度主内容线。', 'Current throughput only supports one high-clarity content line.'),
      copy('线下配合档期会限制拍摄节奏。', 'Offline partner availability limits the shooting cadence.'),
      copy('如果每条内容都要重搭场景，成本会很快失控。', 'If every post needs a new setup, the cost will spiral fast.'),
    ],
  },
];
