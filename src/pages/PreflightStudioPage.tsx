import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import {
  getPreflightGoalLabel,
  getPreflightPlatformLabel,
  getRelevanceTierLabel,
  preflightGoals,
  preflightPlatforms,
  type PreflightGoal,
  type PreflightGrowthBrief,
  type PreflightMediaAsset,
  type PreflightPlatform,
  type PreflightPushCohort,
  type PreflightPublishSafetyReview,
  type PreflightSafetyArea,
  type PreflightSafetyEscalation,
  type PreflightSafetySeverity,
  type PreflightSafetyStatus,
  type PreflightSimulatedReply,
  type PreflightSimulationJob,
  type PreflightSimulationMode,
  type PreflightSimulationRequest,
  type PreflightSimulationResult,
} from '../../shared/preflightSimulation';
import { usePreflightSimulation } from '../hooks/usePreflightSimulation';

type PreflightFormState = {
  platform: PreflightPlatform;
  goal: PreflightGoal;
  mode: PreflightSimulationMode;
  accountName?: string;
  title: string;
  body: string;
  script: string;
  accountContext: string;
  targetAudience: string;
  desiredAction: string;
  brandGuardrails: string;
};

type PreviewMetric = {
  key: string;
  label: string;
  value: number;
  trend: string;
};

const initialFormState: PreflightFormState = {
  platform: 'xiaohongshu',
  goal: 'follower_growth',
  mode: 'quick',
  title: '',
  body: '',
  script: '',
  accountContext: '',
  targetAudience: '',
  desiredAction: '',
  brandGuardrails: '',
};

const demoFormState: PreflightFormState = {
  platform: 'xiaohongshu',
  goal: 'follower_growth',
  mode: 'quick',
  title: '99元宿舍桌面改造：从杂乱无章到整洁温馨',
  body:
    '改造前桌面杂乱，书本、数据线、水杯、纸巾和护肤小瓶混在一起；改造后换成书架、收纳盒、小台灯、白板周计划和学习资料。想分享 99 元以内清单、预算、踩坑和下一期互动。',
  script:
    '开头 3 秒：先放改造前后对比。中段：拆 3 个低成本改造动作，每一步给价格和避坑。结尾：评论区说桌面痛点，关注下一期全宿舍改造。',
  accountContext: '账号定位：校园生活改造、宿舍收纳、低预算学习效率、真实踩坑。粉丝主要是大学生和备考人群。',
  targetAudience: '在校大学生、宿舍党、备考人群、桌面经常乱但预算有限的人，以及喜欢看前后对比改造的人。',
  desiredAction: '希望用户收藏清单、评论自己的桌面痛点、关注下一期宿舍改造系列。',
  brandGuardrails: '不夸大效果，不虚假种草，不诱导刷量，不说买了就一定自律；必须保留真实价格、踩坑和适用限制。',
};

type BrowserUseFixtureCase = {
  form: PreflightFormState;
  imageName: string;
  imageUrl: string;
};

const browserUseFixtureCases: Record<string, BrowserUseFixtureCase> = {
  'xhs-bigops-ecommerce-return-campaign': {
    imageName: 'xhs-bigops-ecommerce-return-campaign.jpg',
    imageUrl: '/preflight-fixtures/xhs-bigops-ecommerce-return-campaign.jpg',
    form: {
      platform: 'xiaohongshu',
      goal: 'conversion',
      mode: 'quick',
      accountName: '大促运营观察室',
      title: '大促返场别乱发券：先把这 4 类人群分清楚',
      body:
        '这条是给电商大促返场做发布前预演：不是把优惠券一把撒出去，而是先拆老客复购、刚需补货、价格敏感和只看热闹四类人。封面想突出“返场券梯度 + 库存补货 + 用户留存”，正文会用一张清单讲清楚哪些用户该推券，哪些用户该推售后体验和补货提醒。',
      script:
        '开头 3 秒：先放“别乱发券”的反常识标题。中段：拆返场券梯度、库存补货、会员权益和售后体验四个动作。结尾：评论区让运营同学投票，返场期最怕哪个指标被误读。',
      accountContext: '品牌中立的大厂运营观察账号，关注电商增长、活动节奏、用户分层和发布前风险复盘，不代指任何真实公司。',
      targetAudience: '电商运营、活动运营、用户增长、会员运营、商家运营，以及想学习大促节奏设计的内容运营新人。',
      desiredAction: '希望用户收藏返场清单，在评论区说自己最常踩的发券坑，并关注后续会员留存拆解。',
      brandGuardrails: '不能出现真实平台 logo；不能承诺 GMV、转化率或补贴金额；不能诱导刷单；所有数据只能作为模拟口径，正式发布要替换成授权素材和真实复盘数据。',
    },
  },
  'xhs-bigops-rain-delivery-notice': {
    imageName: 'xhs-bigops-rain-delivery-notice.jpg',
    imageUrl: '/preflight-fixtures/xhs-bigops-rain-delivery-notice.jpg',
    form: {
      platform: 'xiaohongshu',
      goal: 'awareness',
      mode: 'quick',
      accountName: '城市履约运营笔记',
      title: '雨天高峰怎么发通知，才不像甩锅给用户？',
      body:
        '这条模拟本地生活/即时配送平台的雨天高峰运营笔记。核心不是“订单多所以会慢”，而是把用户补偿、商家备餐、骑手安全和预计送达说清楚。想测试封面里的路线图、补偿方案和安全提醒，会不会让评论区从抱怨变成理解和建议。',
      script:
        '开头 3 秒：雨窗和高峰通知大字。中段：按用户、商家、骑手、客服四个视角拆通知内容。结尾：评论区提问，雨天通知里最想先看到哪一句话。',
      accountContext: '品牌中立的城市履约运营账号，拆解本地生活高峰调度、通知策略、服务体验和舆情预案。',
      targetAudience: '本地生活运营、客服运营、商家运营、城市履约团队、对平台服务体验感兴趣的用户。',
      desiredAction: '希望用户评论自己能接受的雨天通知话术，收藏高峰预案清单，并关注后续商家备餐节奏拆解。',
      brandGuardrails: '不展示真实地址、骑手个人信息或订单数据；不承诺一定准时；不把责任推给用户或骑手；正式发布必须核对平台规则和天气应急口径。',
    },
  },
  'xhs-bigops-streaming-drama-reservation': {
    imageName: 'xhs-bigops-streaming-drama-reservation.jpg',
    imageUrl: '/preflight-fixtures/xhs-bigops-streaming-drama-reservation.jpg',
    form: {
      platform: 'xiaohongshu',
      goal: 'comment',
      mode: 'quick',
      accountName: '追剧增长后台',
      title: '新剧开播别只催预约：评论区话题要提前埋',
      body:
        '这条是长视频内容运营的发布前预演。新剧开播前如果只喊“快预约”，很容易变成硬广；更稳的做法是先拆剧情讨论点、角色关系猜测、会员权益和更新时间，让用户有理由评论、收藏和提醒自己开播当天回来。',
      script:
        '开头 3 秒：新剧预约看板 + 反常识标题。中段：拆预约提醒、剧情话题、会员权益和更新时间节奏。结尾：评论区让用户选最想追的讨论点。',
      accountContext: '品牌中立的内容平台运营账号，关注剧集上线、预约转化、会员留存、评论区话题和追更节奏。',
      targetAudience: '长视频运营、内容宣发、会员增长、剧集爱好者，以及想学习内容上线节奏的新媒体运营。',
      desiredAction: '希望用户评论最想先聊的角色或剧情点，收藏开播提醒，并关注后续追更节奏复盘。',
      brandGuardrails: '不使用真实剧名、演员肖像或平台 logo；不承诺播放量、会员转化或热搜；避免剧透；正式发布必须替换为授权剧照和确认后的排播信息。',
    },
  },
  'xhs-bigops-ai-meeting-template': {
    imageName: 'xhs-bigops-ai-meeting-template.jpg',
    imageUrl: '/preflight-fixtures/xhs-bigops-ai-meeting-template.jpg',
    form: {
      platform: 'xiaohongshu',
      goal: 'lead',
      mode: 'quick',
      accountName: '企业效率增长实验室',
      title: 'AI 纪要模板别急着全量推，先过这 3 个运营关',
      body:
        '这条模拟大厂效率工具的企业运营笔记。AI 会议纪要模板上线前，不能只讲“省时间”，还要讲清楚适用会议、管理员开启路径、隐私权限和试点节奏。想测试用户会不会关心数据安全、模板质量和团队落地成本。',
      script:
        '开头 3 秒：AI 纪要模板 + “别急着全量推”。中段：拆试点人群、模板场景、权限边界和成功指标。结尾：评论区问企业团队最怕 AI 纪要踩哪条线。',
      accountContext: '品牌中立的企业效率运营账号，关注 SaaS 增长、AI 功能上线、企业试点、权限治理和客户成功。',
      targetAudience: '企业服务运营、SaaS 产品运营、客户成功、行政协同团队、对 AI 办公落地感兴趣的管理者。',
      desiredAction: '希望用户评论自己团队最想试的会议场景，留下试点需求，并收藏上线检查清单。',
      brandGuardrails: '不展示真实客户名、邮箱、会议内容或内部数据；不承诺自动准确率；不诱导绕过审批；正式发布必须补充隐私边界、权限说明和人工复核提示。',
    },
  },
  'xhs-qingyu-coffee-blind-test': {
    imageName: 'xhs-qingyu-coffee-blind-test.jpg',
    imageUrl: '/preflight-fixtures/xhs-qingyu-coffee-blind-test.jpg',
    form: {
      platform: 'xiaohongshu',
      goal: 'store_visit',
      mode: 'quick',
      accountName: '青屿校园咖啡局',
      title: '室友盲测：这杯校园咖啡到底值不值得冲？',
      body:
        '把青屿春季新品藏进三杯咖啡里，让 4 个室友只凭第一口投票。有人说像下课后的第一口甜，有人觉得奶味太重。想用这条测一下：真实反应 + 到店暗号，能不能比直接介绍口味更容易被收藏和带朋友去试。',
      script:
        '开头 2 秒：三杯咖啡排开，室友只看到颜色不看杯套。中段：每个人喝第一口后投票，保留真实吐槽。结尾：公布新品和到店暗号，引导评论区提名下一轮盲测员。',
      accountContext: '校园生活方式账号，平时发宿舍日常、校内探店和低预算快乐。粉丝对真实反应、室友互动、同城到店信息更敏感。',
      targetAudience: '在校学生、宿舍社交人群、喜欢尝新品但怕踩雷的人，以及会被室友投票形式吸引的同城用户。',
      desiredAction: '收藏门店位置，到店报暗号，评论区提名下一位盲测员，并带朋友一起试喝。',
      brandGuardrails: '不能承诺功效，不能贬低竞品，不能诱导刷量；标清试饮样本小、个人口味差异大，语气要像同学分享而不是硬广。',
    },
  },
  'xhs-coop-game-night': {
    imageName: 'xhs-coop-game-night.jpg',
    imageUrl: '/preflight-fixtures/xhs-coop-game-night.jpg',
    form: {
      platform: 'xiaohongshu',
      goal: 'comment',
      mode: 'quick',
      accountName: '今晚双人开黑',
      title: '今晚别单排了：这个双人机关局太适合边玩边笑',
      body:
        '试玩一个双人合作原型，最有记忆点的是两个人同时踩机关、分头守营地、失败后一起复盘。它适合做小红书试玩笔记：不是硬讲玩法，而是把“默契到底在不在线”的瞬间剪出来。',
      script:
        '开头 3 秒：两个人同时按手柄，屏幕上一个人在营地救火，一个人在机关门前等配合。中段：拆 3 个真实吵点：同步失败、掉线补位、失败惩罚。结尾：让评论区投票，最怕队友哪一种操作。',
      accountContext: '游戏试玩与开黑内容账号，常发双人游戏、情侣/室友开黑、轻度合作游戏体验。用户喜欢看真实翻车和可复述的合作瞬间。',
      targetAudience: '双人开黑玩家、情侣/室友游戏用户、喜欢合作生存和轻度动作冒险的人，以及想找下一款一起玩的游戏用户。',
      desiredAction: '评论最怕哪类队友，收藏试玩清单，关注下一条失败惩罚和单人补位机制复盘。',
      brandGuardrails: '不能把概念原型说成正式上线游戏；不能承诺售价、上线平台或最终玩法；避免鼓励攻击队友，吐槽要保持轻松玩笑口吻。',
    },
  },
  'xhs-yihuan-city-preview': {
    imageName: 'xhs-yihuan-city-preview.jpg',
    imageUrl: '/preflight-fixtures/xhs-yihuan-city-preview.jpg',
    form: {
      platform: 'xiaohongshu',
      goal: 'awareness',
      mode: 'quick',
      accountName: '开放世界观望席',
      title: '异环预约前先看：我最想验证的 4 个都市开放世界点',
      body:
        '这条按小红书发布前预演来写，不急着喊“必玩”，先把用户第一眼会关心的点讲清楚：城市是不是能逛、驾驶是不是进循环、异象委托有没有新鲜感、角色日常能不能持续产出截图和讨论。',
      script:
        '开头 3 秒：城市天际线 + 异象入口，先抓住都市奇观。中段：按城市探索、车辆移动、异象委托、角色生活感四段快速过。结尾：评论区选一个你最在意的验证点，下一条单独拆。',
      accountContext: '二次元开放世界观察账号，内容以发布前预期管理、公开物料解读和首发风险拆解为主。需要保持理性，不把热度当作留存结论。',
      targetAudience: '二次元开放世界玩家、都市题材爱好者、角色收集玩家，以及对新游首发完成度敏感的观望用户。',
      desiredAction: '评论最想先验证的玩法点，收藏公开信息清单，关注后续首发体验和配置表现复盘。',
      brandGuardrails: '只基于公开物料和内部样例推演；AI 图仅用于发布前预演，正式发布必须替换为授权素材；不承诺上线时间、福利、抽卡概率或未公开内容。',
    },
  },
  'xhs-genshin-return-guide': {
    imageName: 'xhs-genshin-return-guide.jpg',
    imageUrl: '/preflight-fixtures/xhs-genshin-return-guide.jpg',
    form: {
      platform: 'xiaohongshu',
      goal: 'comment',
      mode: 'quick',
      accountName: '提瓦特回坑清单',
      title: '原神老玩家回坑前：先用 5 分钟理清这轮版本重点',
      body:
        '这条不是强行劝回，而是给已经退坑一阵子的玩家一个低压力入口：先看新角色、限时活动、赛季内容、跨平台迁移和素材清单，再决定今天要不要上线。发布前重点检查标题会不会太像营销号，以及是否把已结束活动说成正在进行。',
      script:
        '开头 3 秒：从风景和回坑清单进入，不喊口号。中段：按角色、活动、奖励、平台迁移和回坑成本拆成 5 张卡。结尾：评论区说你卡在哪一步，是角色、剧情、肝度还是平台迁移。',
      accountContext: '长线游戏攻略与版本复盘账号，用户信任来自时间线核对、清单式总结和不夸大收益。内容以公开信息和个人体验为基础。',
      targetAudience: '原神老玩家、轻度回坑用户、跨平台迁移用户、关注版本活动但不想重新查大量公告的人。',
      desiredAction: '评论自己的回坑卡点，收藏清单，关注后续按日期更新的活动提醒。',
      brandGuardrails: '发布前必须核对当前日期和官方公告；AI 图只用于内部预演，正式发布换授权素材；不暗示官方合作，不承诺抽卡收益，不把过期活动写成进行中。',
    },
  },
  'imagegen-dorm': {
    imageName: 'case-01-dorm-desk-cover-imagegen-provider.jpg',
    imageUrl: '/preflight-fixtures/case-01-dorm-desk-cover-imagegen-provider.jpg',
    form: {
      platform: 'xiaohongshu',
      goal: 'follower_growth',
      mode: 'quick',
      title: '99元宿舍桌面改造：新增单品清单公开',
      body:
        '改造前桌面杂乱，改造后用书架、线缆收纳、小台灯和白板周计划让学习角更清爽。本条想测试封面是否能带来收藏、评论和关注下一期。',
      script: '开头3秒放前后对比；中段拆预算和踩坑；结尾引导评论桌面痛点并投票下一期改造。',
      accountContext: '账号定位：校园生活改造、低预算收纳、真实踩坑。粉丝以大学生和备考人群为主。',
      targetAudience: '宿舍党、备考学生、低预算收纳兴趣用户。',
      desiredAction: '收藏清单、评论桌面痛点、关注下一期宿舍改造。',
      brandGuardrails: '不夸大自律效果，不虚假种草，不诱导刷量，保留真实预算边界。',
    },
  },
  'imagegen-campus-demo': {
    imageName: 'case-02-campus-ai-demo-imagegen-provider.jpg',
    imageUrl: '/preflight-fixtures/case-02-campus-ai-demo-imagegen-provider.jpg',
    form: {
      platform: 'campus_ai_competition',
      goal: 'submission_readiness',
      mode: 'quick',
      title: 'DeltaArc 校园 AI 产品试映场：提交前评审预演',
      body:
        '产品帮助校园团队在提交比赛材料前提前看到评委可能追问的 Demo 证据、方向匹配、隐私边界和录屏完整性问题。',
      script:
        '录屏按痛点、Demo、AI 拆解、提交补洞四段展示，目标是证明它不是普通聊天助手，而是参赛材料预演工具。',
      accountContext: '参赛团队已有本地 Demo、README、测试报告和演示页面。',
      targetAudience: '校园 AI 产品创意大赛评委、参赛学生团队、产品导师。',
      desiredAction: '让评委理解产品价值，让参赛团队找出提交前必须补齐的材料和产品边界。',
      brandGuardrails: '不承诺晋级，不冒充官方评审，不使用真实学生隐私数据。',
    },
  },
  'roco-world-launch': {
    imageName: 'case-03-roco-world-imagegen.png',
    imageUrl: '/preflight-fixtures/case-03-roco-world-imagegen.png',
    form: {
      platform: 'xiaohongshu',
      goal: 'follower_growth',
      mode: 'quick',
      title: '魔法学院集合：今天回到洛克王国世界',
      body:
        '《洛克王国：世界》现已正式上线。本条想用魔法学院返校感封面，带玩家从学院入口出发，看精灵收集、开放世界探索、多体系战斗和自由社交这些已公开核心体验。评论区聊聊你第一天最想做什么：抓精灵、跑地图、找搭子，还是先打扮自己的小家？',
      script:
        '开头3秒：先用“回到魔法学院”的情绪钩子唤起老玩家记忆。中段：按精灵收集、开放世界、战斗、社交四个公开体验点展开。结尾：用评论投票承接下一条内容，不做福利或数据承诺。',
      accountContext:
        '账号定位：游戏官方运营内容，面向洛克王国老玩家、开放世界玩家、精灵收集爱好者和轻社交玩家。内容调性要温暖、可信、官方但不生硬。',
      targetAudience:
        '洛克王国老玩家、新玩家、喜欢精灵收集和开放世界探索的用户，以及关注亲友社交和轻松游玩体验的人。',
      desiredAction:
        '希望用户停留看完封面和正文，评论第一天想体验的玩法，收藏公开信息点，关注后续玩法前瞻和活动提醒。',
      brandGuardrails:
        '只使用官网已公开信息；不承诺福利、抽卡概率、战力收益、上线时间外信息或未公开版本内容；AI 图仅用于内部发布前预演，正式发布必须替换为官方授权素材；避免诱导未成年人付费、刷量互动和非官方角色误认。',
    },
  },
};

const sampleReplies: PreflightSimulatedReply[] = [
  {
    id: 'sample_reply_1',
    cohortId: 'cohort_core',
    userType: '备考大学生',
    relevanceTier: 'core',
    sentiment: 'positive',
    replyType: 'conversion_signal',
    text: '求清单！我桌面现在和改造前一模一样。',
    why: '封面前后反差击中宿舍桌面乱、预算少的痛点。',
    conversionSignal: '关注意愿强，愿意等完整清单。',
    intervention: '置顶回复引导关注下一期，并补充新增单品价格明细。',
  },
  {
    id: 'sample_reply_2',
    cohortId: 'cohort_broad',
    userType: '收纳兴趣用户',
    relevanceTier: 'broad',
    sentiment: 'positive',
    replyType: 'question',
    text: '这个小台灯和收纳盒在哪买的？会不会占地方？',
    why: '用户对具体单品产生购买和复制兴趣。',
    conversionSignal: '收藏概率高，关注需要系列内容承接。',
    intervention: '回复尺寸、价格和适用桌面，并引导收藏清单。',
  },
  {
    id: 'sample_reply_3',
    cohortId: 'cohort_weak',
    userType: '价格敏感用户',
    relevanceTier: 'weak',
    sentiment: 'skeptical',
    replyType: 'objection',
    text: '99 元真的假的？台灯和白板应该不止吧。',
    why: '封面大标题强，但没有解释哪些是新增、哪些是已有。',
    conversionSignal: '质疑可转为高质量互动。',
    intervention: '先承认边界，再列清楚新增价格，避免被理解成全套 99 元。',
  },
  {
    id: 'sample_reply_4',
    cohortId: 'cohort_misfire',
    userType: '路过用户',
    relevanceTier: 'misfire',
    sentiment: 'neutral',
    replyType: 'scroll_away',
    text: '改造完也不一定能自律吧。',
    why: '用户把桌面改造误读成学习效果承诺。',
    conversionSignal: '关注弱，但能提醒文案不要夸大。',
    intervention: '回复强调只是减少干扰，不承诺自律或成绩变化。',
  },
  {
    id: 'sample_reply_5',
    cohortId: 'cohort_core',
    userType: '住宿新生',
    relevanceTier: 'core',
    sentiment: 'positive',
    replyType: 'share_trigger',
    text: '想看床边和衣柜也怎么改！',
    why: '评论自然延伸成系列选题。',
    conversionSignal: '关注下一期的概率高。',
    intervention: '把这条评论转成下一期预告，并提醒关注更新。',
  },
  {
    id: 'sample_reply_6',
    cohortId: 'cohort_broad',
    userType: '学习效率用户',
    relevanceTier: 'broad',
    sentiment: 'positive',
    replyType: 'comment',
    text: '白板周计划这个点很戳，我需要一个每天看得到的任务墙。',
    why: '用户被具体学习场景吸引，不只是被收纳吸引。',
    conversionSignal: '可以转化为效率工具内容受众。',
    intervention: '回复自己的周计划模板，并引导收藏。',
  },
];

const growthPlatforms = preflightPlatforms.filter(
  (platform): platform is PreflightPlatform => platform !== 'campus_ai_competition',
);
const growthGoals = preflightGoals.filter(
  (goal): goal is PreflightGoal => goal !== 'submission_readiness',
);

function createAssetId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Fixture image read failed.'));
    reader.readAsDataURL(blob);
  });
}

async function loadFixtureMediaAsset(fixture: BrowserUseFixtureCase): Promise<PreflightMediaAsset> {
  const response = await fetch(fixture.imageUrl);

  if (!response.ok) {
    throw new Error(`Fixture image request failed: ${response.status}`);
  }

  const blob = await response.blob();
  const dataUrl = await readBlobAsDataUrl(blob);

  return {
    id: createAssetId(),
    kind: 'image',
    name: fixture.imageName,
    mimeType: blob.type || 'image/png',
    dataUrl,
  };
}

function buildRequest(form: PreflightFormState, image: PreflightMediaAsset | null): PreflightSimulationRequest {
  return {
    workspaceId: 'preflight-studio',
    platform: form.platform,
    goal: form.goal,
    mode: form.mode,
    contentDraft: {
      title: form.title,
      body: form.body,
      script: form.script,
    },
    mediaAssets: image ? [image] : [],
    accountContext: form.accountContext,
    targetAudience: form.targetAudience,
    desiredAction: form.desiredAction,
    brandGuardrails: form.brandGuardrails,
  };
}

function getReplyToneClass(reply: PreflightSimulatedReply) {
  if (reply.relevanceTier === 'misfire' || reply.sentiment === 'negative') {
    return 'is-risk';
  }

  if (reply.relevanceTier === 'weak' || reply.sentiment === 'skeptical') {
    return 'is-watch';
  }

  if (reply.sentiment === 'positive') {
    return 'is-good';
  }

  return 'is-neutral';
}

function getDisplayUserType(reply: PreflightSimulatedReply) {
  const rawType = reply.userType.trim();
  const normalizedType = rawType.toLowerCase().replace(/[_-]/g, ' ');

  if (normalizedType.includes('core')) {
    return '核心粉';
  }

  if (normalizedType.includes('broad')) {
    return '泛兴趣用户';
  }

  if (normalizedType.includes('weak')) {
    return '弱相关用户';
  }

  if (normalizedType.includes('misfire')) {
    return '误推用户';
  }

  if (normalizedType.includes('irrelevant') || normalizedType.includes('scroll')) {
    return '路过用户';
  }

  return rawType || getRelevanceTierLabel(reply.relevanceTier);
}

function getReplyAvatarLabel(reply: PreflightSimulatedReply) {
  return getDisplayUserType(reply).slice(0, 1);
}

function isCoverageBackfillReply(reply: PreflightSimulatedReply) {
  return reply.id.startsWith('coverage_') || reply.userType.includes('补齐模拟');
}

function getStagePercent(job: PreflightSimulationJob | null) {
  if (!job) {
    return 0;
  }

  const completed = job.stages.filter((stage) => stage.status === 'completed').length;
  return Math.round((completed / Math.max(job.stages.length, 1)) * 100);
}

function getPreviewReplies(result: PreflightSimulationResult | null) {
  const replies = result?.simulatedReplies ?? [];
  return replies.length > 0 ? replies : sampleReplies;
}

function getPreviewMetrics(result: PreflightSimulationResult | null, form: PreflightFormState): PreviewMetric[] {
  const isCampus = isCampusSubmissionContext(form, result);

  if (!result) {
    return isCampus ? [
      { key: 'readiness', label: '就绪分', value: 0, trend: '待生成' },
      { key: 'questions', label: '追问', value: 0, trend: '待生成' },
      { key: 'gaps', label: '缺口', value: 0, trend: '待生成' },
      { key: 'risks', label: '风险', value: 0, trend: '待生成' },
    ] : [
      { key: 'likes', label: '点赞', value: 0, trend: '待生成' },
      { key: 'saves', label: '收藏', value: 0, trend: '待生成' },
      { key: 'comments', label: '评论', value: 0, trend: '待生成' },
      { key: 'shares', label: '转发', value: 0, trend: '待生成' },
    ];
  }

  const metricCards = result.simulatedMetrics?.metricCards ?? [];
  if (metricCards.length > 0) {
    return metricCards.slice(0, 4).map((metric, index) => ({
      key: `simulated_metric_${index}`,
      label: metric.label,
      value: metric.simulatedValue,
      trend: '模拟值',
    }));
  }

  if (isCampus) {
    const gapCount = new Set([
      ...result.contentPromise.proofMissing,
      ...result.qualityCheck.needsHumanReview,
      ...result.qualityCheck.weakSignals,
    ]).size;
    const riskReviewCount =
      result.riskReview.topRisks.length + result.riskReview.complianceRisks.length + result.riskReview.misreadRisks.length;
    const riskCount = Math.max(riskReviewCount, result.risks.length);

    return [
      { key: 'readiness', label: '就绪分', value: result.qualityCheck.overallScore, trend: '模拟值' },
      { key: 'questions', label: '追问', value: result.simulatedReplies.length, trend: '模拟条' },
      { key: 'gaps', label: '缺口', value: gapCount, trend: '待补齐' },
      { key: 'risks', label: '风险', value: riskCount, trend: '需复核' },
    ];
  }

  const attention = result.imageInsight.attentionScore;
  const confidence = result.confidence.score;
  const comments = Math.max(result.simulatedReplies.length * 8, 24);
  const saves = Math.round(attention * 2.4 + confidence * 0.9);
  const likes = Math.round(attention * 4.8 + confidence * 1.4 + comments);
  const shares = Math.round(comments * 0.52 + result.pushModel.cohorts.length * 4);

  return [
    { key: 'likes', label: '点赞', value: likes, trend: `+${Math.round(likes * 0.18)}` },
    { key: 'saves', label: '收藏', value: saves, trend: `+${Math.round(saves * 0.24)}` },
    { key: 'comments', label: '评论', value: comments, trend: `+${Math.round(comments * 0.33)}` },
    { key: 'shares', label: '转发', value: shares, trend: `+${Math.round(shares * 0.2)}` },
  ];
}

function getPreviewTags(form: PreflightFormState, result: PreflightSimulationResult | null) {
  if (isCampusSubmissionContext(form, result)) {
    return ['#提交前预演', '#评审追问', '#Demo证据', '#材料补齐'];
  }

  const text = `${form.title} ${form.body} ${form.script}`;
  const tags = new Set<string>();

  if (/宿舍|桌面|收纳/.test(text)) {
    tags.add('#宿舍改造');
    tags.add('#低预算收纳');
  }

  if (/学习|备考|效率/.test(text)) {
    tags.add('#学习桌面');
  }

  if (result?.imageInsight.visibleElements.some((item) => /清单|价格|99/.test(item))) {
    tags.add('#平价清单');
  }

  if (tags.size === 0) {
    tags.add('#内容预演');
    tags.add('#发布前测试');
    tags.add('#KOC成长');
  }

  return [...tags].slice(0, 4);
}

function isCampusSubmissionForm(form: PreflightFormState) {
  return form.platform === 'campus_ai_competition' || form.goal === 'submission_readiness';
}

function isCampusSubmissionResult(result: PreflightSimulationResult | null | undefined) {
  return result?.scenario === 'campus_submission';
}

function isCampusSubmissionContext(form: PreflightFormState, result?: PreflightSimulationResult | null) {
  return isCampusSubmissionForm(form) || isCampusSubmissionResult(result);
}

function getStudioHeading(form: PreflightFormState) {
  return isCampusSubmissionForm(form) ? 'DeltaArc Campus AI Submission Studio' : 'KOC Growth Lab';
}

function getStudioSubheading(form: PreflightFormState) {
  return isCampusSubmissionForm(form)
    ? '上传比赛材料，提前看见评审可能追问的 Demo 证据、方向匹配、边界和交付完整性。'
    : '面向普通 KOC 的社媒 AI Agent，发布前预演评论、涨粉机会和风险护栏。';
}

function getTitlePlaceholder(form: PreflightFormState) {
  return isCampusSubmissionForm(form)
    ? '例如：DeltaArc 校园 AI 产品试映场：提交前评审预演'
    : '例如：我用 7 天把宿舍桌面改成了低成本学习角';
}

function getBodyPlaceholder(form: PreflightFormState) {
  return isCampusSubmissionForm(form)
    ? '粘贴参赛产品说明、Demo 流程、录屏脚本或提交材料摘要。'
    : '粘贴准备发布的小红书正文、短视频脚本、口播稿或图文大纲。';
}

function getPreviewAuthor(form: PreflightFormState) {
  const accountName = form.accountName?.trim();

  if (accountName) {
    return accountName;
  }

  return isCampusSubmissionForm(form) ? 'DeltaArc 试映场' : '校园改造实验室';
}

function getRecommendedReply(reply: PreflightSimulatedReply | undefined) {
  if (!reply) {
    return '先生成推演，再选择一条评论查看推荐回复。';
  }

  return reply.suggestedReply || reply.intervention || '根据这条评论补充证据、澄清边界，并把用户引导到下一步行动。';
}

function getReplyContentAction(reply: PreflightSimulatedReply | undefined) {
  if (!reply) {
    return '';
  }

  return reply.contentAction || reply.intervention || '';
}

function getPostTitle(form: PreflightFormState) {
  return form.title.trim() || (isCampusSubmissionForm(form) ? '上传材料后，这里会生成提交预览标题' : '上传作品后，这里会生成发布预览标题');
}

function getPostBody(form: PreflightFormState) {
  return (
    form.body.trim() ||
    form.script.trim() ||
    (isCampusSubmissionForm(form)
      ? '填写产品说明或录屏脚本后，系统会把它排成一份提交材料预览，并在下方模拟评审追问和风险反馈。'
      : '填写正文或脚本后，系统会把它排成一条待发布笔记，并在下方模拟评论、点赞、收藏和转发。')
  );
}

function formatMetric(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}w`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return String(value);
}

function getSafetyGateLabel(gate: PreflightPublishSafetyReview['gate']) {
  const labels: Record<PreflightPublishSafetyReview['gate'], string> = {
    go: '可发',
    revise: '先改再发',
    hold: '暂停发布',
  };
  return labels[gate];
}

function getSafetyEscalationLabel(escalation: PreflightSafetyEscalation) {
  const labels: Record<PreflightSafetyEscalation, string> = {
    none: '无需升级',
    ops: '运营复核',
    brand: '品牌复核',
    legal: '法务复核',
    pr: '公关复核',
    data_security: '数据安全复核',
    competition_team: '参赛团队复核',
  };
  return labels[escalation];
}

function getSafetyAreaLabel(area: PreflightSafetyArea) {
  const labels: Record<PreflightSafetyArea, string> = {
    overclaim: '过度承诺',
    privacy: '隐私授权',
    copyright: '版权素材',
    platform_policy: '平台规则',
    brand_reputation: '品牌声誉',
    public_opinion: '舆情外溢',
    data_security: '数据安全',
    minor_protection: '未成年人保护',
    competition_integrity: '赛事边界',
    misleading_context: '语境误读',
  };
  return labels[area];
}

function getSafetySeverityLabel(severity: PreflightSafetySeverity) {
  const labels: Record<PreflightSafetySeverity, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '阻断',
  };
  return labels[severity];
}

function getSafetyStatusLabel(status: PreflightSafetyStatus) {
  const labels: Record<PreflightSafetyStatus, string> = {
    pass: '通过',
    review: '复核',
    fail: '未过',
  };
  return labels[status];
}

function getMetricValue(metrics: PreviewMetric[], candidates: string[], fallbackIndex: number) {
  const directMatch = metrics.find((metric) => candidates.some((candidate) => metric.label.includes(candidate)));
  return directMatch?.value ?? metrics[fallbackIndex]?.value ?? 0;
}

function getDockMetrics(metrics: PreviewMetric[], isCampus: boolean) {
  if (isCampus) {
    return [
      { label: '追问', value: getMetricValue(metrics, ['追问'], 1) },
      { label: '缺口', value: getMetricValue(metrics, ['缺口'], 2) },
      { label: '风险', value: getMetricValue(metrics, ['风险'], 3) },
    ];
  }

  return [
    { label: '赞', value: getMetricValue(metrics, ['点赞', '赞'], 0) },
    { label: '藏', value: getMetricValue(metrics, ['收藏', '藏'], 1) },
    { label: '评', value: getMetricValue(metrics, ['评论', '评'], 2) },
    { label: '转', value: getMetricValue(metrics, ['转发', '转'], 3) },
  ];
}

export function PreflightStudioPage() {
  const [form, setForm] = useState<PreflightFormState>(initialFormState);
  const [image, setImage] = useState<PreflightMediaAsset | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [selectedReplyId, setSelectedReplyId] = useState('');
  const [insertedReplies, setInsertedReplies] = useState<PreflightSimulatedReply[]>([]);
  const { job, result, status, error, runSimulation, reset } = usePreflightSimulation();
  const isRunning = status === 'loading';
  const canRun = Boolean(form.title.trim() || form.body.trim() || form.script.trim()) && !isRunning;
  const replies = getPreviewReplies(result);
  const selectedReply = replies.find((reply) => reply.id === selectedReplyId) ?? replies[0];
  const metrics = getPreviewMetrics(result, form);
  const tags = getPreviewTags(form, result);
  const isExamplePreview = !result;
  const isCampus = isCampusSubmissionContext(form, result);
  const platformOptions = isCampus ? preflightPlatforms : growthPlatforms;
  const goalOptions = isCampus ? preflightGoals : growthGoals;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const fixtureId = searchParams.get('preflightCase');
    const shouldAutoRunFixture = searchParams.get('autoRun') === '1';

    if (!fixtureId) {
      return;
    }

    const fixture = browserUseFixtureCases[fixtureId];

    if (!fixture) {
      setUploadError(`未找到浏览器测试案例：${fixtureId}`);
      return;
    }

    let isCancelled = false;
    reset();
    setForm(fixture.form);
    setImage(null);
    setImagePreview('');
    setSelectedReplyId('');
    setUploadError('正在载入浏览器测试图片...');

    void loadFixtureMediaAsset(fixture)
      .then((fixtureImage) => {
        if (isCancelled) {
          return;
        }

        setImage(fixtureImage);
        setImagePreview(fixtureImage.dataUrl ?? '');
        setUploadError('');

        if (shouldAutoRunFixture) {
          setInsertedReplies([]);
          void runSimulation(buildRequest(fixture.form, fixtureImage)).catch(() => undefined);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setUploadError('浏览器测试图片载入失败，请检查 public/preflight-fixtures。');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  function updateField<Key extends keyof PreflightFormState>(key: Key, value: PreflightFormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('请上传图片文件。');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('图片建议控制在 5MB 内，方便本地和 API 测试。');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      setImage({
        id: createAssetId(),
        kind: 'image',
        name: file.name,
        mimeType: file.type || 'image/jpeg',
        dataUrl,
      });
      setImagePreview(dataUrl);
      setUploadError('');
    };
    reader.onerror = () => {
      setUploadError('图片读取失败，请换一张再试。');
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canRun) {
      return;
    }

    setSelectedReplyId('');
    setInsertedReplies([]);
    void runSimulation(buildRequest(form, image)).catch(() => undefined);
  }

  function loadDemo() {
    reset();
    setForm(demoFormState);
    setImage(null);
    setImagePreview('');
    setUploadError('');
    setSelectedReplyId('');
    setInsertedReplies([]);
  }

  function resetAll() {
    reset();
    setSelectedReplyId('');
    setInsertedReplies([]);
  }

  function insertRecommendedReply(reply: PreflightSimulatedReply | undefined) {
    if (!reply) {
      return;
    }

    const replyId = `author_reply_${reply.id}`;
    setInsertedReplies((current) => {
      if (current.some((item) => item.id === replyId)) {
        return current;
      }

      return [
        ...current,
        {
          id: replyId,
          cohortId: reply.cohortId,
          userType: '作者回复',
          relevanceTier: 'core',
          sentiment: 'positive',
          replyType: 'conversion_signal',
          text: getRecommendedReply(reply),
          why: '从右侧推荐回复插入到手机评论区。',
          conversionSignal: '已插入预览评论区',
          intervention: '模拟发布后及时回复评论。',
        },
      ];
    });
  }

  return (
    <div className="preflight-app-shell social-sandbox-shell">
      <div className="preflight-noise" />
      <main className="preflight-studio social-sandbox">
        <header className="social-topbar">
          <div>
          <p className="eyebrow">{isCampusSubmissionForm(form) ? 'Internal / Submission Check' : 'KOC Social Growth Agent'}</p>
            <h1>{getStudioHeading(form)}</h1>
            <p>{getStudioSubheading(form)}</p>
          </div>
          <div className="social-topbar-actions">
            <span className={image || result ? 'status-pill is-ready' : 'status-pill'}>{image ? '已读取图片' : isCampus ? '待上传截图' : '待上传封面'}</span>
            <span className={result ? 'status-pill is-ready' : 'status-pill'}>
              {result ? result.degraded ? '兜底结果' : '预演完成' : isCampus ? '提交前预演' : '发布前预演'}
            </span>
            <button className="ghost-button" type="button" onClick={loadDemo}>
              一键载入示例
            </button>
          </div>
        </header>

        <section className="social-sandbox-grid">
          <form className="preflight-composer social-composer" onSubmit={handleSubmit}>
            <div className="preflight-panel-heading">
              <div>
                <p className="eyebrow">01 / KOC 内容素材</p>
                <h2>{isCampus ? '提交待评审材料' : '提交待发布 KOC 作品'}</h2>
              </div>
              <span className="panel-badge">{form.mode === 'deep' ? '深度模拟' : '快速模拟'}</span>
            </div>

            <label className="preflight-upload social-cover-uploader">
              <input accept="image/*" type="file" onChange={handleImageChange} />
              <div>
                <strong>{image ? image.name : isCampus ? '上传作品截图 / Demo 画面' : '上传封面 / 作品截图'}</strong>
                <span>{isCampus ? '上传后会进入豆包多模态链路，也会同步显示到中间提交预览。' : '上传后会进入豆包多模态链路，也会同步显示到中间手机预览。'}</span>
              </div>
                {imagePreview ? <img alt="上传图片预览" src={imagePreview} /> : <b>+</b>}
            </label>
            {uploadError ? <p className="status-error">{uploadError}</p> : null}

            <label className="preflight-field">
              <span>标题 / 开头钩子</span>
              <input
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder={getTitlePlaceholder(form)}
              />
            </label>

            <label className="preflight-field">
              <span>正文 / 内容脚本</span>
              <textarea
                value={form.body}
                onChange={(event) => updateField('body', event.target.value)}
                placeholder={getBodyPlaceholder(form)}
              />
            </label>

            <div className="preflight-field-grid social-compact-grid">
              <label className="preflight-field">
                <span>目标平台</span>
                <select
                  value={form.platform}
                  onChange={(event) => updateField('platform', event.target.value as PreflightPlatform)}
                >
                  {platformOptions.map((platform) => (
                    <option key={platform} value={platform}>
                      {getPreflightPlatformLabel(platform)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="preflight-field">
                <span>{isCampus ? '评审目标' : '增长目标'}</span>
                <select
                  value={form.goal}
                  onChange={(event) => updateField('goal', event.target.value as PreflightGoal)}
                >
                  {goalOptions.map((goal) => (
                    <option key={goal} value={goal}>
                      {getPreflightGoalLabel(goal)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="preflight-field">
                <span>推演深度</span>
                <select
                  value={form.mode}
                  onChange={(event) => updateField('mode', event.target.value as PreflightSimulationMode)}
                >
                  <option value="quick">快速模拟</option>
                  <option value="deep">深度模拟</option>
                </select>
              </label>
            </div>

            <details className="preflight-context-card">
              <summary>{isCampus ? '补充团队、评审对象和提交边界' : '补充账号、人群和增长边界'}</summary>
              <div className="preflight-context-grid">
                <label className="preflight-field">
                  <span>{isCampus ? '团队 / 材料背景' : '账号定位 / 历史表现'}</span>
                  <textarea
                    value={form.accountContext}
                    onChange={(event) => updateField('accountContext', event.target.value)}
                    placeholder={isCampus ? '团队已有 Demo、README、测试记录、录屏或提交材料到什么程度？' : '账号平时发什么？粉丝量、收藏、评论或爆过的内容有什么特征？'}
                  />
                </label>
                <label className="preflight-field">
                  <span>{isCampus ? '评审对象' : '目标受众'}</span>
                  <textarea
                    value={form.targetAudience}
                    onChange={(event) => updateField('targetAudience', event.target.value)}
                    placeholder={isCampus ? '评委、导师、同类参赛者会从哪些角度看这份材料？' : '谁会被这条内容吸引？核心粉、泛兴趣用户、新粉分别是谁？'}
                  />
                </label>
                <label className="preflight-field">
                  <span>{isCampus ? '希望评审看到什么' : '希望用户做什么'}</span>
                  <textarea
                    value={form.desiredAction}
                    onChange={(event) => updateField('desiredAction', event.target.value)}
                    placeholder={isCampus ? '希望评委理解产品价值、技术边界、可演示证据或提交完整性。' : '关注、收藏、评论、私信、加入群、报名，或者期待下一期？'}
                  />
                </label>
                <label className="preflight-field">
                  <span>{isCampus ? '提交边界 / 合规限制' : '个人边界 / 合规限制'}</span>
                  <textarea
                    value={form.brandGuardrails}
                    onChange={(event) => updateField('brandGuardrails', event.target.value)}
                    placeholder={isCampus ? '不能承诺晋级、不能冒充官方评审、不能使用真实隐私数据。' : '不能夸大、不能虚假种草、不能诱导互动、不能碰的表达。'}
                  />
                </label>
              </div>
            </details>

            <div className="preflight-submit-row">
              <button className="accent-button" type="submit" disabled={!canRun}>
                {isRunning ? '推演中...' : isCampus ? '开始评审预演' : '开始传播推演'}
              </button>
              <button className="ghost-button" type="button" onClick={resetAll}>
                清空结果
              </button>
            </div>
            {error ? <p className="status-error">{error}</p> : null}
          </form>

          <section className="social-preview-column">
            <PreflightProgress job={job} result={result} form={form} />
            <SocialPostPreview
              form={form}
              imagePreview={imagePreview}
              metrics={metrics}
              tags={tags}
              replies={replies}
              insertedReplies={insertedReplies}
              selectedReplyId={selectedReply?.id}
              isExamplePreview={isExamplePreview}
              onSelectReply={setSelectedReplyId}
            />
          </section>

          <GrowthConsole
            result={result}
            selectedReply={selectedReply}
            metrics={metrics}
            isExamplePreview={isExamplePreview}
            form={form}
            insertedReplyIds={insertedReplies.map((reply) => reply.id.replace(/^author_reply_/, ''))}
            onInsertReply={insertRecommendedReply}
          />
        </section>
      </main>
    </div>
  );
}

function PreflightProgress({
  job,
  result,
  form,
}: {
  job: PreflightSimulationJob | null;
  result: PreflightSimulationResult | null;
  form: PreflightFormState;
}) {
  const percent = result ? 100 : getStagePercent(job);
  const isDegraded = Boolean(result?.degraded || job?.status === 'degraded');
  const isCampus = isCampusSubmissionContext(form, result);
  const stageFallbacks: PreflightSimulationJob['stages'] = isCampus ? [
    { key: 'image_read', label: '读取图片 / 材料', detail: '等待开始。', status: result ? 'completed' : 'pending' },
    { key: 'push_model', label: '模拟评审视角', detail: '等待开始。', status: result ? 'completed' : 'pending' },
    { key: 'reply_simulation', label: '生成评审追问', detail: '等待开始。', status: result ? 'completed' : 'pending' },
    { key: 'synthesis', label: '整理提交补齐动作', detail: '等待开始。', status: result ? 'completed' : 'pending' },
  ] : [
    { key: 'image_read', label: '读取图片 / 素材', detail: '等待开始。', status: result ? 'completed' : 'pending' },
    { key: 'push_model', label: '模拟首轮分发', detail: '等待开始。', status: result ? 'completed' : 'pending' },
    { key: 'reply_simulation', label: '生成模拟评论', detail: '等待开始。', status: result ? 'completed' : 'pending' },
    { key: 'synthesis', label: '生成选题与成长计划', detail: '等待开始。', status: result ? 'completed' : 'pending' },
  ];
  const title = result
    ? isDegraded
      ? '已用本地模拟兜底完成'
      : isCampus
        ? '提交前评审预演已完成'
        : '传播发展推演已完成'
    : job
      ? job.currentStageLabel
      : isCampus
        ? '等待生成评审预演'
        : '等待生成预览';
  const message = result
    ? isDegraded
      ? '远端模型暂时不可用，本次展示的是本地兜底模拟结果。'
      : isCampus
        ? '已经生成评审追问、材料风险和提交前补齐动作。'
        : '已经生成内容方向、选题建议、发布策略、互动优化和账号成长计划。'
    : job
      ? job.message
      : isCampus
        ? '点击开始后，提交预览会逐步出现评审视角、追问和补齐建议。'
        : '点击开始后，手机预览会像发布现场一样逐步出现反馈。';

  return (
    <section className="preflight-progress social-run-card panel">
      <div className="preflight-panel-heading">
        <div>
          <p className="eyebrow">{isCampus ? '02 / 提交前预演' : '02 / 发布前预演'}</p>
          <h2>{title}</h2>
        </div>
        <span className="meta-chip">{percent}%</span>
      </div>
      <p>{message}</p>
      {isDegraded && result?.fallbackReason ? (
        <p className="upload-feedback feedback-warning">{result.fallbackReason}</p>
      ) : null}
      <div className="run-progress-track">
        <div className="run-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="preflight-stage-strip">
        {(job?.stages ?? stageFallbacks).map((stage) => (
          <span key={stage.key} className={`preflight-stage-dot is-${stage.status}`}>
            {stage.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function SocialPostPreview({
  form,
  imagePreview,
  metrics,
  tags,
  replies,
  insertedReplies,
  selectedReplyId,
  isExamplePreview,
  onSelectReply,
}: {
  form: PreflightFormState;
  imagePreview: string;
  metrics: PreviewMetric[];
  tags: string[];
  replies: PreflightSimulatedReply[];
  insertedReplies: PreflightSimulatedReply[];
  selectedReplyId?: string;
  isExamplePreview: boolean;
  onSelectReply: (id: string) => void;
}) {
  const isCampus = isCampusSubmissionForm(form);
  const visibleReplies = [...replies, ...insertedReplies];
  const coverageBackfillCount = replies.filter(isCoverageBackfillReply).length;
  const dockMetrics = getDockMetrics(metrics, isCampus);

  return (
    <section className="social-phone-panel" aria-label={isCampus ? '提交材料预览' : '小红书式发布预览'}>
      <div className="social-phone">
        <header className="social-post-author">
          <div className="social-avatar">{isCampus ? 'D' : 'K'}</div>
          <div>
            <strong>{getPreviewAuthor(form)}</strong>
            <span>{isCampus ? '提交前预演' : '发布前预演'} · {getPreflightPlatformLabel(form.platform)}</span>
          </div>
          <button type="button">{isCampus ? '查看' : '关注'}</button>
        </header>

        <div className="social-phone-scroll" aria-label="可上下滚动的发布预览内容">
          <div className="social-cover-preview">
            {imagePreview ? (
              <img alt="作品封面预览" src={imagePreview} />
            ) : (
              <div className="social-cover-placeholder">
                <div className="cover-before">
                  <span>改造前</span>
                  <strong>杂乱无章</strong>
                </div>
                <div className="cover-after">
                  <span>改造后</span>
                  <strong>整洁温馨</strong>
                </div>
                <b>99元宿舍桌面改造</b>
              </div>
            )}
          </div>

          <article className="social-post-copy">
            <h2>{getPostTitle(form)}</h2>
            <p>{getPostBody(form)}</p>
            <div className="social-tag-row">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </article>

          <div className="social-action-bar" aria-label={isCampus ? '模拟评审数据' : '模拟互动数据'}>
            {metrics.map((metric) => (
              <button key={metric.key} type="button">
                <span>{metric.label}</span>
                <strong>{formatMetric(metric.value)}</strong>
              </button>
            ))}
          </div>

          <section className="social-comment-feed" aria-label={isExamplePreview ? (isCampus ? '示例追问区' : '示例评论区') : (isCampus ? '模拟追问区' : '模拟评论区')}>
            <div className="social-comment-heading">
              <strong>{isExamplePreview ? (isCampus ? '示例追问区' : '示例评论区') : (isCampus ? '模拟追问区' : '模拟评论区')}</strong>
              <span>
                {isExamplePreview
                  ? '未开始推演'
                  : coverageBackfillCount > 0
                  ? `${visibleReplies.length} 条 · ${coverageBackfillCount} 条覆盖补齐`
                  : `${visibleReplies.length} 条`}
              </span>
            </div>
            {!isExamplePreview && coverageBackfillCount > 0 ? (
              <small className="social-comment-coverage-note">
                豆包未返回全部人群评论，已按当前内容补齐覆盖样本；补齐项需人工复核。
              </small>
            ) : null}
            {visibleReplies.map((reply) => (
              <button
                key={reply.id}
                className={`social-comment ${getReplyToneClass(reply)} ${reply.userType === '作者回复' ? 'is-author-reply' : ''} ${isCoverageBackfillReply(reply) ? 'is-coverage' : ''} ${reply.id === selectedReplyId ? 'is-selected' : ''}`}
                type="button"
                onClick={() => onSelectReply(reply.id)}
              >
                <span>{getReplyAvatarLabel(reply)}</span>
                <div>
                  <strong>{getDisplayUserType(reply)}</strong>
                  <p>{reply.text}</p>
                  <small>{getRelevanceTierLabel(reply.relevanceTier)} · {reply.conversionSignal}</small>
                </div>
              </button>
            ))}
          </section>
        </div>
        <footer className="social-bottom-dock" aria-label={isCampus ? '提交预览底部操作栏' : '小红书式底部操作栏'}>
          <button className="social-bottom-input" type="button">
            {isCampus ? '记录评审追问...' : '说点什么...'}
          </button>
          <div className="social-bottom-actions">
            {dockMetrics.map((metric) => (
              <button key={metric.label} type="button">
                <span>{metric.label}</span>
                <strong>{formatMetric(metric.value)}</strong>
              </button>
            ))}
          </div>
        </footer>
      </div>
    </section>
  );
}

function GrowthConsole({
  result,
  selectedReply,
  metrics,
  isExamplePreview,
  form,
  insertedReplyIds,
  onInsertReply,
}: {
  result: PreflightSimulationResult | null;
  selectedReply?: PreflightSimulatedReply;
  metrics: PreviewMetric[];
  isExamplePreview: boolean;
  form: PreflightFormState;
  insertedReplyIds: string[];
  onInsertReply: (reply: PreflightSimulatedReply | undefined) => void;
}) {
  const isCampus = isCampusSubmissionContext(form, result);
  const actionTitle = isCampus ? '提交补齐动作' : '发布与涨粉动作';
  const hasRequiredReview = Boolean(result?.qualityCheck.needsHumanReview.length || result?.qualityCheck.weakSignals.length);
  const isLowQuality = Boolean(result && (result.qualityCheck.overallScore < 70 || hasRequiredReview));
  const requiredReviewItems = result ? [
    ...result.qualityCheck.needsHumanReview,
    ...result.qualityCheck.weakSignals,
  ].slice(0, 4) : [];
  const selectedReplyAlreadyInserted = Boolean(selectedReply && insertedReplyIds.includes(selectedReply.id));

  return (
    <aside className="growth-console panel" aria-label={isCampus ? '提交前评审控制台' : 'AI 增长控制台'}>
      <div className="preflight-panel-heading">
        <div>
          <p className="eyebrow">{isCampus ? '03 / 提交评审控制台' : '03 / AI 增长控制台'}</p>
          <h2>{isCampus ? '看追问，补材料，降低提交风险' : '看评论，改内容，抓涨粉机会'}</h2>
        </div>
        <span className="panel-badge">{result ? result.degraded ? '本地兜底' : result.provider : '示例预览'}</span>
      </div>

      <section className="growth-console-section">
        <h3>{isCampus ? '评审模拟指标' : '互动预测'}</h3>
        {result ? (
          <p className="preflight-simulation-disclaimer">{result.simulatedMetrics.disclaimer}</p>
        ) : null}
        <div className="growth-metric-grid">
          {metrics.map((metric) => (
            <div key={metric.key}>
              <span>{metric.label}</span>
              <strong>{formatMetric(metric.value)}</strong>
              <small>{metric.trend}</small>
            </div>
          ))}
        </div>
      </section>

      {result && !isCampus ? (
        <GrowthBriefPanel brief={result.growthBrief} />
      ) : null}

      {result ? (
        <PublishSafetyReviewPanel review={result.publishSafetyReview} isCampus={isCampus} />
      ) : null}

      <section className="growth-console-section">
        <h3>{isCampus ? '多模态材料读片' : '多模态内容读片'}</h3>
        {result ? (
          <div className="growth-read-card">
            <strong>{result.visualRead.firstGlance || result.imageInsight.coverRead}</strong>
            <p>{result.visualRead.strongestSignal || result.imageInsight.summary}</p>
            <small>{result.visualRead.confusionPoints[0] || result.imageInsight.ambiguity}</small>
          </div>
        ) : (
          <div className="growth-read-card">
            <strong>{isCampus ? '等待豆包多模态读取材料截图' : '等待豆包多模态读取封面'}</strong>
            <p>{isCampus ? '上传截图后，AI 会判断评审第一眼能看懂什么、哪里证据不足、哪些边界需要补充。' : '上传封面后，AI 会判断第一眼看到了什么、可能误读什么、哪里最适合做点击钩子。'}</p>
          </div>
        )}
      </section>

      <section className="growth-console-section">
        <h3>{isExamplePreview ? (isCampus ? '示例回应' : '示例回复') : (isCampus ? '建议回应' : '推荐回复')}</h3>
        <div className={`growth-reply-coach ${selectedReply ? getReplyToneClass(selectedReply) : ''}`}>
          {selectedReply ? (
            <>
              <span>{getRelevanceTierLabel(selectedReply.relevanceTier)} · {getDisplayUserType(selectedReply)}</span>
              <blockquote>{selectedReply.text}</blockquote>
              <p>{selectedReply.hiddenNeed || selectedReply.why}</p>
              <strong>{getRecommendedReply(selectedReply)}</strong>
              {!isCampus ? (
                <button
                  className="social-insert-reply-button"
                  type="button"
                  onClick={() => onInsertReply(selectedReply)}
                  disabled={selectedReplyAlreadyInserted}
                >
                  {selectedReplyAlreadyInserted ? '已插入预览评论区' : '插入到预览评论区'}
                </button>
              ) : null}
              <small className="growth-reply-action">{isCampus ? '材料动作' : '内容动作'}：{getReplyContentAction(selectedReply)}</small>
              {selectedReply.evidenceNeeded?.length ? (
                <small className="growth-reply-action">补证据：{selectedReply.evidenceNeeded.join(' / ')}</small>
              ) : null}
            </>
          ) : (
            <p>{isCampus ? '点击中间追问区任意反馈，查看回应和材料补齐建议。' : '点击中间评论区任意评论，查看回复建议。'}</p>
          )}
        </div>
      </section>

      <section className="growth-console-section">
        <h3>{actionTitle}</h3>
        {result ? (
          <div className="preflight-action-list compact">
            {result.interventions.slice(0, 4).map((item) => (
              <article key={`${item.priority}-${item.target}-${item.action}`}>
                <span>{item.priority}</span>
                <h4>{item.change || item.action}</h4>
                <p>{item.problem || item.reason}</p>
                {item.exampleRewrite ? <blockquote className="preflight-example-rewrite">{item.exampleRewrite}</blockquote> : null}
                <small>{item.expectedEffect || item.expectedChange}</small>
              </article>
            ))}
          </div>
        ) : (
          <div className="growth-read-card">
            <strong>推演完成后显示真实动作</strong>
            <p>{isCampus ? '这里不会再用示例建议冒充结果；点击开始后才会生成可执行的提交补齐动作。' : '这里不会再用示例建议冒充结果；点击开始后才会生成可执行的涨粉动作。'}</p>
          </div>
        )}
      </section>

      {result ? <CohortRail cohorts={result.pushModel.cohorts} isCampus={isCampus} /> : null}

      {result ? (
        <section className="growth-console-section">
          <h3>质量检查</h3>
          <div className={`quality-review-card ${isLowQuality ? 'is-low' : ''}`}>
            <strong>{result.qualityCheck.overallScore}/100</strong>
            <p>可信信号：{result.qualityCheck.reliableSignals.slice(0, 2).join(' / ')}</p>
            {isLowQuality && requiredReviewItems.length ? (
              <div className="quality-required-list">
                <span>{isCampus ? '必须补齐' : '必须复核'}</span>
                <ul>
                  {requiredReviewItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <small>人工复核：{result.qualityCheck.needsHumanReview.slice(0, 2).join(' / ') || '暂无强制复核项'}</small>
          </div>
        </section>
      ) : null}
    </aside>
  );
}

function GrowthBriefPanel({ brief }: { brief: PreflightGrowthBrief }) {
  return (
    <section className="growth-console-section growth-brief-section">
      <h3>KOC 增长链路</h3>
      <div className="growth-brief-grid">
        <article>
          <span>内容方向</span>
          <strong>{brief.contentDirection.summary}</strong>
          <p>{brief.contentDirection.strongestHook}</p>
        </article>
        <article>
          <span>选题建议</span>
          <strong>{brief.topicIdeas.nextPost}</strong>
          <p>{brief.topicIdeas.seriesDirection}</p>
        </article>
        <article>
          <span>发布策略</span>
          <strong>{brief.publishStrategy.title}</strong>
          <p>{brief.publishStrategy.structure}</p>
        </article>
        <article>
          <span>互动优化</span>
          <strong>{brief.interactionOptimization.pinnedComment}</strong>
          <p>{brief.interactionOptimization.replyPrinciple}</p>
        </article>
        <article>
          <span>账号成长</span>
          <strong>{brief.accountGrowthPlan.growthThesis}</strong>
          <p>{brief.accountGrowthPlan.followTriggers.slice(0, 3).join(' / ')}</p>
        </article>
        <article>
          <span>风险护栏</span>
          <strong>{brief.riskGuardrail.positioning}</strong>
          <p>{brief.riskGuardrail.mustAvoid.slice(0, 2).join(' / ') || '无明确阻断项'}</p>
        </article>
      </div>
      <div className="growth-next-posts">
        <span>接下来 3 条</span>
        <ol>
          {brief.accountGrowthPlan.nextThreePosts.slice(0, 3).map((post) => (
            <li key={post}>{post}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PublishSafetyReviewPanel({
  review,
  isCampus,
}: {
  review: PreflightPublishSafetyReview;
  isCampus: boolean;
}) {
  const primaryFlags = review.redFlags.slice(0, 3);
  const checklist = review.checklist.slice(0, 4);
  const mustFixItems = review.mustFixBeforePublish.slice(0, 3);

  return (
    <section className="growth-console-section safety-review-section">
      <h3>{isCampus ? '提交安全审查' : '发布风险护栏'}</h3>
      <div className={`safety-gate-card is-${review.gate}`}>
        <div className="safety-gate-topline">
          <span>{getSafetyGateLabel(review.gate)}</span>
          <strong>{review.score}/100</strong>
        </div>
        <p>{review.summary}</p>
        <small>升级建议：{getSafetyEscalationLabel(review.escalation)}</small>
      </div>

      {primaryFlags.length ? (
        <div className="safety-flag-list">
          {primaryFlags.map((flag) => (
            <article key={flag.id} className={`safety-flag-card is-${flag.severity}`}>
              <div>
                <span>{getSafetyAreaLabel(flag.area)} · {getSafetySeverityLabel(flag.severity)}</span>
                <strong>{flag.title}</strong>
              </div>
              <p>{flag.trigger}</p>
              <small>{flag.whyItMatters}</small>
              <b>{flag.fix}</b>
            </article>
          ))}
        </div>
      ) : null}

      <div className="safety-checklist">
        {checklist.map((item) => (
          <div key={item.id} className={`is-${item.status}`}>
            <span>{getSafetyStatusLabel(item.status)}</span>
            <strong>{item.label}</strong>
            <small>{item.detail}</small>
          </div>
        ))}
      </div>

      {mustFixItems.length ? (
        <div className="safety-must-fix">
          <span>{isCampus ? '提交前必须处理' : '发布前必须处理'}</span>
          <ul>
            {mustFixItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function CohortRail({ cohorts, isCampus }: { cohorts: PreflightPushCohort[]; isCampus: boolean }) {
  return (
    <section className="growth-console-section">
      <h3>{isCampus ? '评审关注分层' : '传播人群分层'}</h3>
      <div className="growth-cohort-rail">
        {cohorts.map((cohort) => (
          <div key={cohort.id} className={`tier-${cohort.relevanceTier}`}>
            <span>{getRelevanceTierLabel(cohort.relevanceTier)}</span>
            <strong>{cohort.exposureShare}%</strong>
            <small>{cohort.likelyBehavior}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
