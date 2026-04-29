import {
  getPreflightGoalLabel,
  getPreflightPlatformLabel,
  type PreflightSimulationRequest,
} from '../../../shared/preflightSimulation';
import type { PreflightModelProvider, PreflightProviderInput } from './modelProvider';

function createMockReplies(request: PreflightSimulationRequest) {
  const goal = getPreflightGoalLabel(request.goal);
  const platform = getPreflightPlatformLabel(request.platform);

  if (request.goal === 'follower_growth') {
    return [
      {
        id: 'reply_growth_core_1',
        cohortId: 'cohort_core',
        userType: '核心粉 / 校园改造兴趣',
        relevanceTier: 'core',
        sentiment: 'positive',
        replyType: 'conversion_signal',
        text: '这个我会收藏，最好直接给清单和尺寸，下一期想看宿舍灯光怎么布。',
        why: '核心粉已经认同账号定位，会寻找可复制的细节和下一期系列。',
        conversionSignal: '收藏、关注和追更意愿强。',
        intervention: '评论区置顶“清单 + 下一期投票”，把收藏转成关注。',
      },
      {
        id: 'reply_growth_core_2',
        cohortId: 'cohort_core',
        userType: '认真比较型新粉',
        relevanceTier: 'core',
        sentiment: 'skeptical',
        replyType: 'question',
        text: '99 元真的够吗？有没有购买链接和踩坑版本对比？',
        why: '潜在新粉感兴趣，但需要真实证据降低种草怀疑。',
        conversionSignal: '补足预算拆解后有较强关注可能。',
        intervention: '在正文前半段放价格表和失败尝试，降低虚假种草感。',
      },
      {
        id: 'reply_growth_broad_1',
        cohortId: 'cohort_broad',
        userType: '泛兴趣用户 / 宿舍党',
        relevanceTier: 'broad',
        sentiment: 'neutral',
        replyType: 'comment',
        text: `在${platform}刷到会停一下，但我要先确认是不是适合我的宿舍。`,
        why: '泛兴趣用户会被改造前后对比吸引，但需要快速看到适用范围。',
        conversionSignal: '有停留和收藏机会，关注取决于系列感。',
        intervention: '标题补上“适合小桌面/无打孔/低预算”等限制条件。',
      },
      {
        id: 'reply_growth_broad_2',
        cohortId: 'cohort_broad',
        userType: '转发给室友的人',
        relevanceTier: 'broad',
        sentiment: 'positive',
        replyType: 'share_trigger',
        text: '这个可以发宿舍群，让大家一起投票先改哪块。',
        why: '宿舍改造天然有群聊传播点，适合触发分享。',
        conversionSignal: '分享强，关注需要下一期承诺。',
        intervention: '加一句“评论区投票：桌面/床边/衣柜先改哪一个”。',
      },
      {
        id: 'reply_growth_weak_1',
        cohortId: 'cohort_weak',
        userType: '弱相关路过用户',
        relevanceTier: 'weak',
        sentiment: 'irrelevant',
        replyType: 'scroll_away',
        text: '看起来像普通收纳广告，没有看到和我有什么关系。',
        why: '弱相关用户只看首屏，过于商品化会被判定为广告。',
        conversionSignal: '低，需要先解决首屏停留。',
        intervention: '封面先放“改造前后差异”和真实桌面问题，不要只摆商品。',
      },
      {
        id: 'reply_growth_weak_2',
        cohortId: 'cohort_weak',
        userType: '只看封面的用户',
        relevanceTier: 'weak',
        sentiment: 'skeptical',
        replyType: 'misread',
        text: '这是不是商单？如果是我可能直接划走。',
        why: '低预算改造容易被误读为种草带货。',
        conversionSignal: '低，但真实踩坑能挽回。',
        intervention: '首屏明确“自费改造/踩坑清单/不推荐买的也写”。',
      },
      {
        id: 'reply_growth_misfire_1',
        cohortId: 'cohort_misfire',
        userType: '误推用户 / 非学生',
        relevanceTier: 'misfire',
        sentiment: 'negative',
        replyType: 'objection',
        text: '为什么推给我宿舍内容，我又不是学生。',
        why: '平台会把收纳、家居、学习效率标签扩散到非校园人群。',
        conversionSignal: '不转化，但可作为标签边界信号。',
        intervention: '开头限定“宿舍小桌面”和“学生预算”，减少泛家居误推。',
      },
      {
        id: 'reply_growth_misfire_2',
        cohortId: 'cohort_misfire',
        userType: '错重点用户',
        relevanceTier: 'misfire',
        sentiment: 'irrelevant',
        replyType: 'misread',
        text: '我只想看好看的房间图，不想看一堆预算说明。',
        why: '视觉改造内容会吸引审美用户，但他们不一定关心学习效率。',
        conversionSignal: '弱，可以转化成收藏但不一定关注。',
        intervention: '把预算细节放正文，封面保持强视觉对比。',
      },
    ];
  }

  if (request.platform === 'campus_ai_competition' || request.goal === 'submission_readiness') {
    return [
      {
        id: 'reply_judge_1',
        cohortId: 'cohort_core',
        userType: '产品评委 / 需求判断',
        relevanceTier: 'core',
        sentiment: 'positive',
        replyType: 'question',
        text: '真实校园痛点是成立的，但 Demo 第一屏需要更快证明它不是普通聊天助手。',
        why: '评委会先判断问题是否具体、场景是否真实、AI 是否真的改变流程。',
        conversionSignal: '如果 30 秒内能跑通关键路径，晋级说服力会明显提升。',
        intervention: '录屏开头先展示输入、AI 拆解结果和用户下一步，而不是先讲背景。',
      },
      {
        id: 'reply_judge_2',
        cohortId: 'cohort_core',
        userType: '技术评委 / 可体验性',
        relevanceTier: 'core',
        sentiment: 'skeptical',
        replyType: 'objection',
        text: 'Demo 能不能真实操作？如果只是概念稿，说明文档要把能力边界讲清楚。',
        why: '赛事要求能跑的 Demo 是入场券，技术实现深度不是唯一标准，但可体验性不能缺。',
        conversionSignal: '可点击 Demo、流程截图和边界说明会降低质疑。',
        intervention: '补一个最小可用流程链接，并在 PDF 写清已实现、模拟和下一步。',
      },
      {
        id: 'reply_broad_1',
        cohortId: 'cohort_broad',
        userType: '业务评委 / PCG 场景匹配',
        relevanceTier: 'broad',
        sentiment: 'neutral',
        replyType: 'question',
        text: `这个方向和${platform}匹配，但最好说明它落在哪个内容、社交或技术工具场景。`,
        why: '泛业务评委会关注方案是否能和 PCG 产品场景发生关系。',
        conversionSignal: '如果能绑定一个明确赛道，方案会更容易被理解。',
        intervention: '在标题下补一句“赛道 + 用户 + 场景 + AI 改变点”。',
      },
      {
        id: 'reply_broad_2',
        cohortId: 'cohort_broad',
        userType: '体验评委 / 录屏观看',
        relevanceTier: 'broad',
        sentiment: 'positive',
        replyType: 'conversion_signal',
        text: '如果 3 分钟录屏能按痛点、Demo、结果、边界这个顺序讲，我会愿意继续看文档。',
        why: '录屏是最快建立理解的材料，结构清楚能减少评审成本。',
        conversionSignal: '录屏结构好会带动评委继续查看 PDF 和 Demo。',
        intervention: '把录屏脚本控制在 4 段，每段只讲一个判断点。',
      },
      {
        id: 'reply_weak_1',
        cohortId: 'cohort_weak',
        userType: '弱相关评委 / 快速扫读',
        relevanceTier: 'weak',
        sentiment: 'irrelevant',
        replyType: 'scroll_away',
        text: '看完还是不确定用户是谁、痛点多高频、AI 具体做了哪一步。',
        why: '如果方案表述过泛，扫读时会被当成通用 AI 工具。',
        conversionSignal: '低，需要更具体的场景证据。',
        intervention: '补 1 个真实用户故事和 1 个前后对比画面。',
      },
      {
        id: 'reply_weak_2',
        cohortId: 'cohort_weak',
        userType: '格式检查 / 提交完整性',
        relevanceTier: 'weak',
        sentiment: 'skeptical',
        replyType: 'misread',
        text: '材料里好像缺了录屏或 PDF，缺一项会直接影响初筛。',
        why: '赛事明确要求 Demo、PDF、录屏三项均须提交。',
        conversionSignal: '交付完整性是基础门槛。',
        intervention: '在提交前做三件套检查：Demo 可访问、PDF 可打开、MP4 小于 3 分钟且 16:9 横屏。',
      },
      {
        id: 'reply_misfire_1',
        cohortId: 'cohort_misfire',
        userType: '错重点读者',
        relevanceTier: 'misfire',
        sentiment: 'negative',
        replyType: 'misread',
        text: '像是在展示 AI 炫技，但没有看出产品闭环和用户为什么会留下来。',
        why: '如果只堆功能，容易被误读为技术展示而不是产品方案。',
        conversionSignal: '不利于评审记住核心价值。',
        intervention: '把功能列表改成一条可复现的用户旅程。',
      },
      {
        id: 'reply_misfire_2',
        cohortId: 'cohort_misfire',
        userType: '合规敏感读者',
        relevanceTier: 'misfire',
        sentiment: 'skeptical',
        replyType: 'objection',
        text: '如果用了聊天记录或课程资料，要说明隐私、版权和数据来源怎么处理。',
        why: '校园真实场景常涉及个人信息和资料版权。',
        conversionSignal: '边界说明能降低风险。',
        intervention: '在 PDF 单独写一段数据来源、脱敏方式和不可做事项。',
      },
    ];
  }

  return [
    {
      id: 'reply_core_1',
      cohortId: 'cohort_core',
      userType: '目标用户 / 真实需求强',
      relevanceTier: 'core',
      sentiment: 'positive',
      replyType: 'conversion_signal',
      text: '这个角度我会点开，想知道具体怎么买或者去哪体验。',
      why: `内容目标是${goal}，核心受众会优先寻找行动入口。`,
      conversionSignal: '有明确行动意愿，但需要更短的路径。',
      intervention: '把地点、时间或领取方式放到首屏和评论置顶。',
    },
    {
      id: 'reply_core_2',
      cohortId: 'cohort_core',
      userType: '认真比较型用户',
      relevanceTier: 'core',
      sentiment: 'skeptical',
      replyType: 'question',
      text: '看起来不错，但有没有真实测评？不要又是硬广。',
      why: '相关用户感兴趣，也会更快追问证据。',
      conversionSignal: '如果补足真实体验证据，转化可能提升。',
      intervention: '补一个用户现场反应或对比前后细节。',
    },
    {
      id: 'reply_broad_1',
      cohortId: 'cohort_broad',
      userType: '泛兴趣刷到用户',
      relevanceTier: 'broad',
      sentiment: 'neutral',
      replyType: 'comment',
      text: `这个在${platform}刷到还挺像生活分享，但我不确定和我有什么关系。`,
      why: '泛兴趣人群会先判断内容是否值得继续看。',
      conversionSignal: '弱转化，需要一个明确利益点。',
      intervention: '第一句话直接说明“谁适合看”和“看完能得到什么”。',
    },
    {
      id: 'reply_broad_2',
      cohortId: 'cohort_broad',
      userType: '会转给朋友的人',
      relevanceTier: 'broad',
      sentiment: 'positive',
      replyType: 'share_trigger',
      text: '这条可以发群里问问，有没有人一起去试。',
      why: '内容如果有社交场景，泛兴趣受众可能把它当邀约素材。',
      conversionSignal: '有扩散可能，但需要更强的评论引导。',
      intervention: '加一句“艾特一个最会盲测的朋友”。',
    },
    {
      id: 'reply_weak_1',
      cohortId: 'cohort_weak',
      userType: '弱相关路过用户',
      relevanceTier: 'weak',
      sentiment: 'irrelevant',
      replyType: 'scroll_away',
      text: '刷到了但没看懂，是活动还是广告？',
      why: '平台探索会把相似兴趣用户推入测试池，他们缺少上下文。',
      conversionSignal: '几乎不转化，但会拉低停留。',
      intervention: '标题避免只写情绪词，要补上具体对象和场景。',
    },
    {
      id: 'reply_weak_2',
      cohortId: 'cohort_weak',
      userType: '只看封面的用户',
      relevanceTier: 'weak',
      sentiment: 'skeptical',
      replyType: 'misread',
      text: '封面像普通促销，我可能直接划走。',
      why: '弱相关用户只给首屏一两秒，封面语义不清会被判定无关。',
      conversionSignal: '低，需要先解决停留。',
      intervention: '封面加一个更具体的实验感或反差点。',
    },
    {
      id: 'reply_misfire_1',
      cohortId: 'cohort_misfire',
      userType: '误推用户',
      relevanceTier: 'misfire',
      sentiment: 'negative',
      replyType: 'objection',
      text: '怎么老给我推这个，我又不是目标用户。',
      why: '早期大数据探索会混入低相关样本，用来校准内容标签。',
      conversionSignal: '不转化，可能贡献负面语气。',
      intervention: '减少过泛标签，开头限定目标人群。',
    },
    {
      id: 'reply_misfire_2',
      cohortId: 'cohort_misfire',
      userType: '错重点用户',
      relevanceTier: 'misfire',
      sentiment: 'irrelevant',
      replyType: 'misread',
      text: '我以为是吐槽帖，结果好像是在卖东西？',
      why: '如果钩子太像段子或吐槽，路过用户会按错误语境理解。',
      conversionSignal: '无转化，还可能带偏评论区。',
      intervention: '保留反差，但在第二句补上真实发布目的。',
    },
  ];
}

function createMockPublishSafetyReview(params: {
  hasImage: boolean;
  isGrowth: boolean;
  isCompetition: boolean;
}) {
  const { hasImage, isGrowth, isCompetition } = params;

  if (isCompetition) {
    return {
      gate: 'revise',
      score: hasImage ? 72 : 58,
      summary: '提交前需要先补齐官方背书边界、素材授权和数据来源说明，避免被误解为正式评审结论或高风险方案。',
      escalation: 'competition_team',
      redFlags: [
        {
          id: 'safety_flag_competition_official',
          title: '官方背书和评审结果误读',
          severity: 'high',
          area: 'competition_integrity',
          trigger: '文案如果写成“评审预演等同官方意见”或暗示晋级，会让材料可信度受损。',
          whyItMatters: 'PCG 参赛提交需要清楚区分自测工具、模拟反馈和官方评审，避免被认为借官方名义背书。',
          evidence: '当前结果需要反复声明“不代表官方评审结论、晋级或奖项”。',
          fix: '在标题、说明和结果页加入“模拟审查，不代表官方评审”的固定边界。',
          owner: 'competition_team',
        },
        {
          id: 'safety_flag_competition_privacy',
          title: 'Demo 截图和样例数据授权不足',
          severity: hasImage ? 'medium' : 'high',
          area: 'privacy',
          trigger: '校园产品截图、聊天记录或学生材料如果含真实个人信息，会触发隐私和授权质疑。',
          whyItMatters: '大厂项目尤其需要证明数据来源、素材授权和脱敏流程，否则评审会优先质疑落地安全。',
          evidence: hasImage ? '上传素材需要检查是否包含真实头像、姓名、学号、聊天记录或联系方式。' : '未提供 Demo 截图时无法确认素材是否脱敏。',
          fix: '提交前只使用脱敏样例，补充“数据均为模拟或已授权”的说明。',
          owner: 'legal',
        },
        {
          id: 'safety_flag_competition_claim',
          title: 'AI 能力边界可能被夸大',
          severity: 'medium',
          area: 'overclaim',
          trigger: '如果把模拟反馈写成“能提前判断是否获奖/一定避雷”，会变成不可证明承诺。',
          whyItMatters: '参赛项目需要展示能力边界，避免因过度承诺被认为不成熟。',
          evidence: '当前产品定位是发布前模拟和自查，不是官方结果预测。',
          fix: '把“判断结果”改成“暴露风险点和修改建议”。',
          owner: 'product',
        },
      ],
      checklist: [
        {
          id: 'safety_check_competition_boundary',
          label: '官方边界',
          status: 'fail',
          detail: '明确声明模拟结果不代表官方评审、晋级或奖项。',
          owner: 'competition_team',
        },
        {
          id: 'safety_check_competition_privacy',
          label: '隐私与脱敏',
          status: 'review',
          detail: '检查 Demo 截图、样例输入、学生资料和聊天内容是否脱敏或授权。',
          owner: 'legal',
        },
        {
          id: 'safety_check_competition_ip',
          label: '素材版权',
          status: 'review',
          detail: '确认图片、Logo、第三方平台截图和案例素材可用于参赛展示。',
          owner: 'brand',
        },
        {
          id: 'safety_check_competition_data',
          label: '数据安全',
          status: 'review',
          detail: '说明模型输入不会上传真实隐私数据或公司内部敏感材料。',
          owner: 'data_security',
        },
      ],
      mustFixBeforePublish: [
        '加入“不代表官方评审结论”的固定边界说明。',
        '检查并脱敏所有 Demo 截图、样例数据和用户输入。',
      ],
      safeRewriteHints: [
        '把“提前判断会不会晋级”改成“提前暴露评审可能追问的风险点”。',
        '把“安全审查通过”改成“已完成发布前风险自查，仍需人工复核”。',
      ],
    };
  }

  if (isGrowth) {
    return {
      gate: 'revise',
      score: hasImage ? 70 : 56,
      summary: '发布前需要先压住商单误读、价格口径和诱导互动风险，否则评论区容易从增长讨论变成信任质疑。',
      escalation: 'ops',
      redFlags: [
        {
          id: 'safety_flag_growth_overclaim',
          title: '低价或效果承诺口径不清',
          severity: 'high',
          area: 'overclaim',
          trigger: '“99 元改造”如果没有说明包含范围，容易被质疑标题党或虚假种草。',
          whyItMatters: '运营内容一旦被认定为夸大或诱导，平台推荐和账号信任都会受损。',
          evidence: '模拟评论会追问“99 元真的假的、包含哪些东西”。',
          fix: '标题和正文第一段写清 99 元只包含新增物品，并列出价格表。',
          owner: 'ops',
        },
        {
          id: 'safety_flag_growth_ad',
          title: '商单和软广误读',
          severity: 'medium',
          area: 'brand_reputation',
          trigger: '画面过像商品展示时，用户会怀疑是广告或隐藏推广。',
          whyItMatters: 'KOC 内容的信任来自真实体验，商单误读会降低关注和收藏后的复访。',
          evidence: '风险复核里已有“封面被误读为商单”。',
          fix: '补充改造前后、踩坑、不推荐购买项和自费说明。',
          owner: 'brand',
        },
        {
          id: 'safety_flag_growth_platform',
          title: '互动引导可能越界',
          severity: 'medium',
          area: 'platform_policy',
          trigger: '如果用“必须关注/点赞才给清单”之类表述，会触发诱导互动风险。',
          whyItMatters: '平台内容安全会打击低质诱导，影响后续推荐。',
          evidence: '增长目标需要把收藏评论转关注，容易写成硬性诱导。',
          fix: '把强制互动改成自然问题和下一期投票。',
          owner: 'ops',
        },
      ],
      checklist: [
        {
          id: 'safety_check_growth_claim',
          label: '价格和效果口径',
          status: 'fail',
          detail: '补清价格范围、已有物品和不承诺自律/成绩提升。',
          owner: 'ops',
        },
        {
          id: 'safety_check_growth_ad',
          label: '广告和商单标识',
          status: 'review',
          detail: '确认是否涉及品牌露出、购买链接或利益关系。',
          owner: 'brand',
        },
        {
          id: 'safety_check_growth_platform',
          label: '平台互动规则',
          status: 'review',
          detail: '避免强制关注、诱导点赞、抽奖刷量和夸张承诺。',
          owner: 'ops',
        },
        {
          id: 'safety_check_growth_privacy',
          label: '宿舍和人物隐私',
          status: 'review',
          detail: '确认画面中没有室友人脸、床位信息、聊天记录或学校敏感信息。',
          owner: 'legal',
        },
      ],
      mustFixBeforePublish: [
        '写清 99 元预算口径和新增物品范围。',
        '删掉任何“关注后一定变自律/涨粉”的承诺表达。',
      ],
      safeRewriteHints: [
        '把“99 元搞定整个桌面”改成“99 元新增收纳清单，原桌不计入预算”。',
        '把“关注后你也能自律”改成“减少桌面干扰，不保证学习效果”。',
      ],
    };
  }

  return {
    gate: 'revise',
    score: hasImage ? 68 : 54,
    summary: '发布前需要先补素材授权、品牌边界和可能引战的表达，避免公域讨论偏离运营目标。',
    escalation: 'pr',
    redFlags: [
      {
        id: 'safety_flag_brand_reputation',
        title: '品牌声誉和公关误读',
        severity: 'high',
        area: 'brand_reputation',
        trigger: '如果内容借势热点、拉踩竞品或暗示官方背书，评论区可能快速跑偏。',
        whyItMatters: '大厂运营发布需要控制舆情外溢，避免单条内容演变成品牌争议。',
        evidence: '弱相关和误推人群会按自己的语境解读内容。',
        fix: '删掉拉踩、官方背书和不必要的热点绑定，补充来源和边界。',
        owner: 'pr',
      },
      {
        id: 'safety_flag_generic_privacy',
        title: '素材授权和隐私不明',
        severity: hasImage ? 'medium' : 'high',
        area: 'privacy',
        trigger: '图片、截图或案例如果来自真实用户，发布前必须确认授权和脱敏。',
        whyItMatters: '隐私和素材授权问题最容易从评论区扩散成合规争议。',
        evidence: hasImage ? '已上传素材需要人工复核。' : '未提供素材时无法判断授权状态。',
        fix: '只使用授权素材，模糊个人信息，标注必要来源。',
        owner: 'legal',
      },
    ],
    checklist: [
      {
        id: 'safety_check_brand_claim',
        label: '品牌和官方背书',
        status: 'review',
        detail: '检查是否会让用户误以为平台、品牌或官方机构背书。',
        owner: 'brand',
      },
      {
        id: 'safety_check_brand_privacy',
        label: '隐私和授权',
        status: 'review',
        detail: '检查素材、人像、聊天记录和用户案例是否授权。',
        owner: 'legal',
      },
      {
        id: 'safety_check_brand_public',
        label: '舆情外溢',
        status: 'fail',
        detail: '检查是否含拉踩、引战、歧义标签或容易被截断传播的表达。',
        owner: 'pr',
      },
      {
        id: 'safety_check_brand_platform',
        label: '平台规则',
        status: 'review',
        detail: '检查是否含诱导互动、标题党、虚假效果或违规营销。',
        owner: 'ops',
      },
    ],
    mustFixBeforePublish: [
      '补清素材授权和来源边界。',
      '删掉可能被误读为官方背书或拉踩的表达。',
    ],
    safeRewriteHints: [
      '把绝对判断改成“基于当前素材的模拟反馈”。',
      '把品牌或平台背书改成清晰的来源说明。',
    ],
  };
}

function createMockGrowthBrief(params: {
  isGrowth: boolean;
  isCompetition: boolean;
  platform: string;
  goal: string;
}) {
  const { isGrowth, isCompetition, platform, goal } = params;

  if (isGrowth) {
    return {
      contentDirection: {
        summary: '把低预算宿舍桌面改造讲成一条可复制的 KOC 真实实验，而不是单纯种草清单。',
        strongestHook: '改造前后反差 + 99 元预算 + 真实踩坑，会同时触发停留、收藏和追更。',
        evidence: ['账号定位是校园生活改造', '正文有预算和踩坑', '评论区有清单和下一期需求'],
        missingSignals: ['缺少明确价格表', '缺少下一期系列承诺', '缺少不推荐购买项'],
      },
      topicIdeas: {
        nextPost: '下一条做“失败版清单”：哪些低价收纳不建议买，以及为什么。',
        seriesDirection: '从桌面延伸到床边、衣柜、线缆和备考角，形成低预算宿舍改造系列。',
        abTests: [
          'A版：99元宿舍桌面改造清单；B版：我买错3次后留下的桌面收纳。',
          'A版封面放前后对比；B版封面放价格表和踩坑标注。',
        ],
        reuseFromComments: ['求清单', '想看床边和衣柜', '99元到底包含什么'],
      },
      publishStrategy: {
        title: '标题写清“99元新增收纳”“宿舍小桌面”“真实踩坑”，避免被误读为全套桌子只要99元。',
        cover: '封面用左右对比，中间标出新增物品价格，右下角加“自费/踩坑版”。',
        timing: '优先晚间 20:30-22:30 发布，学生党更容易评论、收藏和转发给室友。',
        tags: ['#宿舍改造', '#低预算收纳', '#学生党', '#KOC成长'],
        structure: '开头给前后反差，中段列清单和避坑，结尾用投票承接下一期。',
      },
      interactionOptimization: {
        pinnedComment: '置顶“下一期改床边/衣柜/线缆？评论投票，我按票数拍”。',
        replyPrinciple: '先解释预算边界，再给清单证据，最后引导关注系列更新。',
        commentTriggers: ['你的桌面最大痛点是什么？', '想先看床边还是衣柜？', '要不要出失败版清单？'],
        riskReplies: [
          '99元只包含这次新增的收纳和灯具，原桌不算，我把价格表补在正文里。',
          '不是商单，是自费改造；不推荐买的我会单独开一条讲。',
        ],
      },
      accountGrowthPlan: {
        growthThesis: '让用户为了连续的真实改造实验关注账号，而不是只收藏一张清单。',
        followTriggers: ['下一期投票', '失败版清单', '预算明细', '同类宿舍场景复用'],
        nextThreePosts: [
          '失败版清单：不建议买的收纳和替代品。',
          '床边改造：不用打孔的低预算方案。',
          '一周复盘：哪些改造真的提高了使用频率。',
        ],
        reviewMetrics: ['关注率', '收藏率', '评论投票数', '下一条内容回访率'],
      },
      riskGuardrail: {
        positioning: '发布前先压住价格口径、商单误读和诱导互动风险，保留 KOC 真实感。',
        mustAvoid: ['不要暗示买了就会自律', '不要把99元写成包含全部物品', '不要诱导刷赞刷关注'],
        safePhrasing: ['99元只包含本次新增物品', '这是自费改造和真实踩坑', '关注是为了看下一期复盘'],
      },
    };
  }

  if (isCompetition) {
    return {
      contentDirection: {
        summary: '把参赛材料讲成可体验产品闭环，而不是概念说明。',
        strongestHook: '赛道、用户、痛点和 AI 改变点需要在第一屏讲清楚。',
        evidence: ['已有 Demo 说明', '已有提交目标', '已有边界约束'],
        missingSignals: ['Demo 链接', 'PDF 第一页证据', '3 分钟录屏结构'],
      },
      topicIdeas: {
        nextPost: '不适用，改为补齐录屏第一屏和 PDF 产品闭环。',
        seriesDirection: '提交材料围绕痛点、Demo、AI 能力、风险边界四段组织。',
        abTests: ['A版先讲痛点，B版先跑 Demo。'],
        reuseFromComments: ['AI能力具体体现在哪里？', 'Demo是否真实可操作？'],
      },
      publishStrategy: {
        title: '标题下补一句“第五赛道 / KOC / 社媒 AI Agent / 涨粉”。',
        cover: '录屏首帧直接展示可操作 Demo 和结果区。',
        timing: '提交前完成 Demo、PDF、MP4 三件套检查。',
        tags: ['#第五赛道', '#KOCGrowthLab'],
        structure: '痛点、Demo、AI 输出、提交边界。',
      },
      interactionOptimization: {
        pinnedComment: '不适用，改为准备评审可能追问的 3 个回答。',
        replyPrinciple: '先回答产品闭环，再补证据和边界。',
        commentTriggers: ['用户是谁？', 'AI 做了哪一步？', 'Demo 能不能跑？'],
        riskReplies: ['模拟不代表官方评审结论。'],
      },
      accountGrowthPlan: {
        growthThesis: '提交叙事必须回到第五赛道主线。',
        followTriggers: ['Demo 可信', '赛道明确', 'AI 能力具体'],
        nextThreePosts: ['不适用'],
        reviewMetrics: ['Demo 可访问', 'PDF 可读', '录屏小于3分钟'],
      },
      riskGuardrail: {
        positioning: '避免被误解为官方评审或晋级预测。',
        mustAvoid: ['不承诺晋级', '不冒充官方', '不使用真实隐私数据'],
        safePhrasing: ['模拟评审关注点', '提交前自查', '仍需人工复核'],
      },
    };
  }

  return {
    contentDirection: {
      summary: `在${platform}发布前验证这条内容是否能带动${goal}。`,
      strongestHook: '真实场景和首屏反差。',
      evidence: ['内容草稿', '目标平台', '用户行动目标'],
      missingSignals: ['真实反馈', '图片证据', '发布边界'],
    },
    topicIdeas: {
      nextPost: '把本条最高频评论做成下一条内容。',
      seriesDirection: '围绕同一用户痛点做三条低成本实验。',
      abTests: ['标题利益点 A/B', '封面反差 A/B'],
      reuseFromComments: ['用户追问', '反对意见'],
    },
    publishStrategy: {
      title: '标题写清目标用户、场景和行动收益。',
      cover: '封面放真实场景和关键证据。',
      timing: '选择目标用户更可能互动的时段。',
      tags: ['#发布前预演'],
      structure: '开头给结论，中段给证据，结尾给行动入口。',
    },
    interactionOptimization: {
      pinnedComment: '置顶一个可回答的问题。',
      replyPrinciple: '先回应疑问，再补证据，最后给行动入口。',
      commentTriggers: ['你会怎么选？', '还想看哪个版本？'],
      riskReplies: ['这是模拟反馈，不代表真实流量承诺。'],
    },
    accountGrowthPlan: {
      growthThesis: '用连续实验建立用户期待。',
      followTriggers: ['系列化', '真实证据', '评论参与'],
      nextThreePosts: ['追问复盘', '失败版', '对比版'],
      reviewMetrics: ['收藏率', '评论率', '关注率'],
    },
    riskGuardrail: {
      positioning: '发布前先检查边界，避免夸大和误读。',
      mustAvoid: ['不要承诺真实效果', '不要诱导互动'],
      safePhrasing: ['基于当前素材的模拟反馈'],
    },
  };
}

export function createMockPreflightResult(request: PreflightSimulationRequest) {
  const platform = getPreflightPlatformLabel(request.platform);
  const goal = getPreflightGoalLabel(request.goal);
  const hasImage = request.mediaAssets.length > 0;
  const isGrowth = request.goal === 'follower_growth';
  const isCompetition = request.platform === 'campus_ai_competition' || request.goal === 'submission_readiness';

  return {
    generatedAt: new Date('2026-04-20T00:00:00.000Z').toISOString(),
    provider: 'mock',
    model: 'mock-preflight-simulator',
    mode: request.mode,
    contentRead: {
      oneLineIntent: isGrowth
        ? `在${platform}推演这条内容是否能带来${goal}。`
        : isCompetition
        ? `在${platform}提交前验证作品是否达到${goal}。`
        : `在${platform}发布前验证这条内容是否能带动${goal}。`,
      platformFit: isGrowth
        ? `${platform}更吃首屏反差、真实细节和评论区互动，当前内容要把“为什么值得关注这个账号”前置。`
        : isCompetition
        ? '评审会优先看真实场景、Demo 可体验性、AI 改变点、提交完整性和赛道匹配。'
        : `${platform}更吃第一眼场景感和评论区互动，当前草稿需要把行动入口前置。`,
      likelyHook: request.contentDraft.title || '真实反应、反差体验或朋友参与感。',
      missingContext: isGrowth
        ? ['账号差异化', '系列化承诺', '真实证据和预算细节']
        : isCompetition
        ? ['真实校园用户证据', '可访问 Demo', '提交三件套完整性']
        : ['真实用户证据', '具体行动入口', '首屏利益点'],
      assumptions: isGrowth
        ? ['推演不接入真实账号后台数据', '平台早期分发会混入弱相关和误推用户']
        : isCompetition
        ? ['模拟不替代正式评审', '评委会快速扫读材料并追问边界']
        : ['模拟不接入真实平台私域数据', '早期推流会混入弱相关用户'],
    },
    imageInsight: {
      summary: isGrowth
        ? hasImage
          ? '图片会决定首屏停留，需要同时看清改造前后反差、真实场景和账号风格。'
          : '未提供封面或截图，本次只能基于文案推演首屏停留和涨粉机会。'
        : isCompetition
        ? hasImage
          ? '截图会被当作 Demo 可体验性的第一证据，需要一眼看懂用户输入、AI 输出和下一步动作。'
          : '未提供 Demo 截图，本次只能模拟方案文字层面的评审反应。'
        : hasImage
          ? '图片会被当作首屏判断依据，需要一眼看懂主体、场景和利益点。'
          : '未提供图片，本次只能模拟文案层面的首屏反应。',
      visibleElements: isGrowth
        ? hasImage
          ? ['上传素材', '封面主体', '画面文字', '可能的账号风格线索']
          : ['未提供视觉素材']
        : isCompetition
        ? hasImage
          ? ['上传截图', '产品界面', '可能的用户流程线索']
          : ['未提供 Demo 截图']
        : hasImage ? ['上传图片', '封面主体', '可能的场景线索'] : ['未提供图片'],
      coverRead: isGrowth
        ? hasImage
          ? '如果封面只像商品展示，会削弱 KOC 真实感；需要用改造前后和踩坑证据提升可信度。'
          : '建议补一张封面、图文截图或视频关键帧，让豆包多模态读取真实视觉信号。'
        : isCompetition
        ? hasImage
          ? '如果截图只是静态概念图，评委会追问它是否真的可操作。'
          : '建议补一张关键流程截图或录屏首帧。'
        : hasImage
          ? '如果封面缺少明确对比或行动线索，弱相关用户会把它当普通广告。'
          : '建议补一张能体现真实体验或反差的封面。',
      textOnImage: [],
      ambiguity: isGrowth
        ? '如果标题只讲好看或便宜，路过用户会把它当普通种草，难以形成关注理由。'
        : isCompetition
        ? '如果标题、截图和 Demo 流程不一致，评委会难以判断产品闭环。'
        : '如果标题和画面不一致，误推用户会按错误语境评论。',
      attentionScore: hasImage ? 68 : 46,
      risks: isGrowth
        ? hasImage ? ['封面可能被误读为商单', '关注理由不够前置'] : ['缺少视觉证据，涨粉推演不稳定']
        : isCompetition
        ? hasImage ? ['Demo 证据可能不足'] : ['缺少视觉证据，评审判断不稳定']
        : hasImage ? ['封面语义可能过泛'] : ['缺少视觉证据，预测不稳定'],
      improvementIdeas: isGrowth
        ? ['首屏放改造前后对比', '用评论区投票把单条内容接成系列', '把真实踩坑写在前半段']
        : isCompetition
        ? ['把核心用户旅程放到首屏', '让评委在 30 秒内看到 AI 改变了哪一步']
        : ['把核心反差放到首屏', '让目标用户在 2 秒内知道为什么和自己有关'],
    },
    pushModel: {
      summary: isGrowth
        ? '平台会先测试账号既有粉丝和相邻兴趣人群，再观察收藏、评论和关注信号决定是否继续扩散。'
        : isCompetition
        ? '评审会从产品价值、赛道匹配、Demo 可体验性、提交完整性和风险边界几个角度交叉判断。'
        : '平台会先测试核心标签，再向泛兴趣、弱相关和少量误推用户扩散，观察停留与互动。',
      nonRelevantShare: 38,
      platformDrift: isGrowth
        ? '家居、学习效率、校园生活等标签会带来泛兴趣流量，也会混入非学生和纯审美用户。'
        : isCompetition
        ? '如果材料过泛，评审关注点会从产品创新滑向格式、可用性和风险补洞。'
        : '兴趣标签、同城关系和互动相似度会让非目标用户进入早期样本。',
      cohorts: [
        {
          id: 'cohort_core',
          label: isGrowth ? '核心粉丝' : isCompetition ? '产品价值评审' : '核心受众',
          relevanceTier: 'core',
          exposureShare: 34,
          whyPushed: isGrowth ? '与账号定位、校园生活和低预算改造兴趣高度匹配。' : isCompetition ? '优先判断真实校园痛点、AI 改变点和产品闭环。' : '与平台标签、目标场景和行动目标高度匹配。',
          likelyBehavior: isGrowth ? '收藏清单、追问链接、评论自己的桌面问题。' : isCompetition ? '追问用户是谁、痛点是否高频、Demo 是否可体验。' : '愿意停留、追问、收藏或转给朋友。',
          misunderstandingRisk: isGrowth ? '如果过像商单，会质疑真实性。' : isCompetition ? '如果方案太像通用助手，会被认为差异化不足。' : '如果证据不足，会怀疑是硬广。',
          conversionIntent: isGrowth ? '高，取决于系列化承诺和真实证据。' : isCompetition ? '中高，取决于 Demo 证据和用户旅程。' : '中高，取决于行动入口是否清楚。',
        },
        {
          id: 'cohort_broad',
          label: isGrowth ? '泛兴趣用户' : isCompetition ? '赛道匹配评审' : '泛兴趣受众',
          relevanceTier: 'broad',
          exposureShare: 28,
          whyPushed: isGrowth ? '与收纳、学习效率、宿舍生活等相邻兴趣有关。' : isCompetition ? '判断方案是否贴合 PCG 内容、社交、技术工具或校园开放题。' : '与生活方式、同城或内容形态相邻。',
          likelyBehavior: isGrowth ? '先看改造前后对比，可能收藏或转发给室友。' : isCompetition ? '寻找清晰赛道、业务场景和可扩展性。' : '先看热闹，可能评论或转发给朋友。',
          misunderstandingRisk: isGrowth ? '可能只收藏清单，不关注账号。' : isCompetition ? '赛道表达不清会让方案显得漂浮。' : '可能只记住噱头，不理解目标动作。',
          conversionIntent: isGrowth ? '中，需要下一期承诺触发关注。' : isCompetition ? '中，需要一句话定位。' : '中低，需要强评论引导。',
        },
        {
          id: 'cohort_weak',
          label: isGrowth ? '路过用户' : isCompetition ? '提交完整性检查' : '弱相关受众',
          relevanceTier: 'weak',
          exposureShare: 22,
          whyPushed: isGrowth ? '平台用相邻标签探索边界，可能推给泛家居或纯审美用户。' : isCompetition ? '检查 Demo、PDF 和 3 分钟内 16:9 横屏录屏是否齐全。' : '大数据会用相似互动样本探索边界。',
          likelyBehavior: isGrowth ? '快速判断是否广告，可能划走或质疑。' : isCompetition ? '先卡格式和可访问性，再看内容。' : '快速划走，或留下“没看懂”的反馈。',
          misunderstandingRisk: isGrowth ? '把内容当普通收纳种草，忽略校园账号价值。' : isCompetition ? '材料缺项会掩盖创意本身。' : '把内容当普通广告、段子或无关推荐。',
          conversionIntent: isGrowth ? '低，主要用来校准首屏和标签。' : isCompetition ? '低，但属于门槛项。' : '低，主要贡献噪声。',
        },
        {
          id: 'cohort_misfire',
          label: isGrowth ? '误推噪声' : isCompetition ? '风险边界评审' : '误推 / 路过用户',
          relevanceTier: 'misfire',
          exposureShare: 16,
          whyPushed: isGrowth ? '早期扩散会混入非学生、非改造需求用户。' : isCompetition ? '关注隐私、版权、数据来源、夸大能力和不可落地承诺。' : '早期探索会混入低相关样本校准标签。',
          likelyBehavior: isGrowth ? '不理解校园语境，可能带偏评论区。' : isCompetition ? '寻找潜在合规和产品边界问题。' : '不理解语境，可能吐槽或带偏评论区。',
          misunderstandingRisk: isGrowth ? '把内容误解为硬广或泛家居展示。' : isCompetition ? '边界不写清会被当作高风险方案。' : '错把发布目的理解成另一类内容。',
          conversionIntent: isGrowth ? '很低，但会暴露标题和封面误读点。' : isCompetition ? '低，但会影响稳定性判断。' : '很低。',
        },
      ],
    },
    simulatedReplies: createMockReplies(request),
    risks: isGrowth
      ? [
          {
            title: '关注理由被收藏理由盖住',
            severity: 'high',
            trigger: '用户可能只收藏清单，不知道为什么要关注账号。',
            likelyComment: '清单有用，但这个账号后面还会发什么？',
            mitigation: '在结尾和置顶评论承诺下一期系列，并让用户投票选择主题。',
          },
          {
            title: '封面被误读为商单',
            severity: 'medium',
            trigger: '画面过像商品展示，缺少真实改造过程和踩坑。',
            likelyComment: '这是广告吗？',
            mitigation: '加入改造前后对比、预算表和不推荐购买项。',
          },
          {
            title: '平台标签过泛',
            severity: hasImage ? 'medium' : 'high',
            trigger: '收纳、家居、学习效率标签混杂，平台可能推给非校园用户。',
            likelyComment: '为什么给我推宿舍内容？',
            mitigation: '标题和首屏限定“宿舍小桌面、学生预算、无打孔”。',
          },
        ]
      : isCompetition
      ? [
          {
            title: 'Demo 可体验性证据不足',
            severity: 'high',
            trigger: '材料描述了愿景，但没有让评委看到可操作的最小闭环。',
            likelyComment: '这个是概念还是已经能跑？',
            mitigation: '提供可访问 Demo、关键流程截图和 3 分钟内录屏。',
          },
          {
            title: '赛道定位过泛',
            severity: 'medium',
            trigger: '方案同时讲内容、社交和效率，缺少主赛道选择。',
            likelyComment: '它到底解决哪个 PCG 产品场景？',
            mitigation: '用一句话锁定赛道、用户和 AI 改变点。',
          },
          {
            title: '提交三件套缺项',
            severity: hasImage ? 'medium' : 'high',
            trigger: 'Demo、PDF、录屏任一项不清楚或不可访问。',
            likelyComment: '材料不完整，没法判断作品。',
            mitigation: '提交前检查 Demo 可打开、PDF 无水印且未损坏、MP4 小于 3 分钟且 16:9 横屏。',
          },
        ]
      : [
          {
            title: '首屏利益点不够明确',
            severity: 'high',
            trigger: '用户只看到情绪或功能描述，看不到为什么现在要行动。',
            likelyComment: '所以这个和我有什么关系？',
            mitigation: '标题和第一句话明确目标人群、场景和行动入口。',
          },
          {
            title: '误推用户带偏评论区',
            severity: 'medium',
            trigger: '内容钩子过泛，平台推给弱相关或不相关用户。',
            likelyComment: '又是广告吧？',
            mitigation: '降低泛标签，评论区置顶真实体验证据。',
          },
          {
            title: '图片无法证明真实体验',
            severity: hasImage ? 'medium' : 'high',
            trigger: '封面或图片缺少真实场景、人物反应或对比。',
            likelyComment: '有没有真实测评？',
            mitigation: '补充盲测、对比或现场反馈画面。',
          },
        ],
    interventions: isGrowth
      ? [
          {
            priority: 'P0',
            target: 'cover',
            action: '封面用“改造前后对比 + 99 元预算 + 宿舍小桌面”三要素。',
            reason: '首屏要同时证明场景、反差和低门槛。',
            expectedChange: '提升停留和收藏，减少普通广告感。',
          },
          {
            priority: 'P0',
            target: 'opening',
            action: '第一句话写清“适合谁、解决什么、为什么值得关注后续”。',
            reason: '涨粉不是只让用户收藏这一条，而是让用户期待系列。',
            expectedChange: '把收藏用户转成关注用户。',
          },
          {
            priority: 'P1',
            target: 'comment_prompt',
            action: '置顶评论设置投票：“下一期改床边、衣柜还是桌面线缆？”',
            reason: '低门槛互动能把泛兴趣用户拉进系列内容。',
            expectedChange: '增加评论和下一条内容素材。',
          },
          {
            priority: 'P1',
            target: 'script',
            action: '下一条做“失败版清单”，专门讲不推荐买的东西。',
            reason: '真实踩坑比单纯种草更像 KOC，也更容易建立信任。',
            expectedChange: '提高账号可信度和复访率。',
          },
        ]
      : isCompetition
      ? [
          {
            priority: 'P0',
            target: 'opening',
            action: '标题下补一句“赛道 + 用户 + 痛点 + AI 改变点”。',
            reason: '评委快速扫读时需要立即建立作品定位。',
            expectedChange: '减少“通用 AI 工具”的误读。',
          },
          {
            priority: 'P0',
            target: 'proof',
            action: '把最小可用 Demo 链接和关键流程截图放到 PDF 第一页。',
            reason: 'Demo 是入场券，第一证据越前置越好。',
            expectedChange: '提升可体验性和可信度。',
          },
          {
            priority: 'P1',
            target: 'script',
            action: '录屏按痛点、Demo、AI 处理、结果和边界四段组织。',
            reason: '3 分钟限制要求信息密度高且顺序清楚。',
            expectedChange: '让评委更快看完整个产品闭环。',
          },
          {
            priority: 'P1',
            target: 'proof',
            action: '单独写清隐私、版权、数据来源和不可做事项。',
            reason: '校园真实场景常涉及个人资料和课程内容。',
            expectedChange: '降低合规和落地风险质疑。',
          },
        ]
      : [
          {
            priority: 'P0',
            target: 'opening',
            action: '第一句话直接写清“谁该看、为什么现在看、看完能做什么”。',
            reason: '前两秒决定停留和推流标签。',
            expectedChange: '减少弱相关误读，提高核心受众停留。',
          },
          {
            priority: 'P0',
            target: 'cover',
            action: '封面加入真实反应或反差实验，不只放产品/活动主体。',
            reason: '弱相关用户主要靠封面决定是否划走。',
            expectedChange: '提升首屏停留，降低普通广告感。',
          },
          {
            priority: 'P1',
            target: 'comment_prompt',
            action: '评论区设置一个可回答的问题，引导“你会不会试/你想测哪个”。',
            reason: '模拟回复显示泛兴趣用户需要低门槛参与点。',
            expectedChange: '把路过互动转成有用信号。',
          },
          {
            priority: 'P1',
            target: 'proof',
            action: '补一条真实证据：盲测反应、同学评价、到店截图或前后对比。',
            reason: '核心用户会追问真实性。',
            expectedChange: '降低硬广质疑，提高行动信心。',
          },
        ],
    confidence: {
      level: 'medium',
      score: hasImage ? 66 : 58,
      rationale: isGrowth
        ? '基于账号定位、平台语境、作品草稿和视觉素材做传播发展推演。'
        : isCompetition
        ? '基于赛事规则、参赛材料和常见评审关注点做可解释模拟。'
        : '基于草稿、平台语境和早期推流机制做可解释模拟。',
      limitations: isGrowth
        ? ['没有接入真实账号后台数据', '不能承诺真实播放量、点赞量或涨粉数']
        : isCompetition
        ? ['不替代腾讯 PCG 官方评审', '不能保证晋级或具体奖项']
        : ['没有接入真实平台流量池', '不能预测具体播放量或真实评论逐字内容'],
    },
    publishSafetyReview: createMockPublishSafetyReview({
      hasImage,
      isGrowth,
      isCompetition,
    }),
    growthBrief: createMockGrowthBrief({
      isGrowth,
      isCompetition,
      platform,
      goal,
    }),
    warnings: isGrowth
      ? ['这是传播发展推演，不是流量承诺；请避免刷量、诱导互动和虚假种草。']
      : isCompetition
      ? ['这是参赛提交前检查，不代表官方评审结论。']
      : ['这是发布前反应模拟，不是流量承诺。'],
  };
}

export function createMockPreflightProvider(): PreflightModelProvider {
  return {
    provider: 'mock',
    model: 'mock-preflight-simulator',
    async generateJson(input: PreflightProviderInput) {
      return createMockPreflightResult(input.request);
    },
  };
}
