import type {
  EvidenceItem,
  HypothesisCard,
  PersonaCard,
  ProjectSnapshot,
  StepLabel,
  StrategyCard,
} from '../types';

export const demoProject: ProjectSnapshot = {
  name: '青屿咖啡春季新品种草',
  mode: 'Concept',
  genre: 'campus-koc',
  platforms: ['小红书', '视频号'],
  targetPlayers: ['校园女生', '宿舍社交人群', '愿意顺手发内容的轻分享用户'],
  coreFantasy: '让新品第一口就值得拉室友一起试，再顺手拍成一条可复述的校园内容。',
  ideaSummary: '两周内验证哪种 KOC 内容角度更能带动新品到店和自发 UGC。',
  coreLoop: '刷到种草内容 -> 拉朋友到店试喝 -> 现场拍摄反馈 -> 回宿舍二次讨论与转发',
  sessionLength: '单条内容 20-40 秒，种草窗口集中在新品上线后 14 天内。',
  differentiators: '把新品体验做成可拉室友参与的“现场反应内容”，而不是单纯功能介绍。',
  progressionHook: '先看第一口反应，再回看不同宿舍组合、不同口味站队和复购反馈。',
  socialHook: '评论区鼓励带室友打分、站队和补充自己的第一口反应。',
  monetization: '优先看新品券核销、到店转化和 UGC 量级，不把短期 GMV 当唯一目标。',
  referenceGames: ['校园新品测评账号', '宿舍探店博主', '同城轻生活品牌案例'],
  validationGoal: '确认“室友盲测”是否比“功能介绍”更能提升到店与复述率。',
  productionConstraints: '1 名运营 + 1 名兼职拍摄，单周最多产出 6 条可用内容，预算主要用于试饮和校园达人置换。',
  currentStatus: '担心内容都在讲新品卖点，但真正能带朋友到店的触发点还不够清晰。',
};

export function createBlankProject(): ProjectSnapshot {
  return {
    name: '未命名传播任务',
    mode: 'Concept',
    genre: '',
    platforms: [],
    targetPlayers: [],
    coreFantasy: '',
    ideaSummary: '',
    coreLoop: '',
    sessionLength: '',
    differentiators: '',
    progressionHook: '',
    socialHook: '',
    monetization: '',
    referenceGames: [],
    validationGoal: '',
    productionConstraints: '',
    currentStatus: '',
  };
}

export const initialEvidence: EvidenceItem[] = [
  {
    id: 'evi_001',
    type: 'note',
    title: '评论摘录',
    source: '小红书评论区归纳',
    trust: 'medium',
    summary: '用户愿意转发“室友一起试喝”的内容，但对纯口味参数介绍停留时间明显更短。',
    createdAt: '10:05',
  },
  {
    id: 'evi_002',
    type: 'interview',
    title: 'KOC 访谈',
    source: '4 位校园达人回访',
    trust: 'high',
    summary: '达人更愿意拍“室友真实反应”和“宿舍站队”，不想做生硬口播。',
    createdAt: '10:12',
  },
  {
    id: 'evi_003',
    type: 'metric_snapshot',
    title: '试投数据快照',
    source: '视频号首轮投放',
    trust: 'medium',
    summary: '功能介绍内容完播还可以，但评论、转发和到店核销都弱于反应类内容。',
    createdAt: '10:18',
  },
];

export const personas: PersonaCard[] = [
  {
    name: '宿舍决策者',
    motive: '想快速找到值得拉室友一起试的新东西，不想踩雷。',
    accepts: '内容能快速告诉她“为什么要拉朋友现在去试”。',
    rejects: '只有卖点罗列，没有真实反应和社交场景。',
    verdict: '最关键的首波转化人群，对“是否值得拉人一起去”非常敏感。',
  },
  {
    name: '轻分享 KOC',
    motive: '愿意发内容，但希望拍法自然、负担低、反馈有趣。',
    accepts: '内容有清楚的互动钩子，拍摄门槛低，还能留下个人表达空间。',
    rejects: '脚本太硬、广告感太强、评论区没有互动势能。',
    verdict: '决定 UGC 能不能滚起来的关键扩散节点。',
  },
  {
    name: '同城围观用户',
    motive: '先看看大家为什么去，再决定值不值得跟进。',
    accepts: '能快速看懂场景、反应和收益，最好有熟人感或校园感。',
    rejects: '信息太碎，或者内容只停留在品牌自说自话。',
    verdict: '不一定第一时间转化，但会影响内容的二次扩散气氛。',
  },
];

export const hypotheses: HypothesisCard[] = [
  {
    title: '“室友盲测”比“功能介绍”更容易带来到店决策',
    evidence: '评论区与首轮试投都显示，用户更愿意停留和讨论真实反应内容。',
    confidence: 0.72,
    gap: '还缺对券核销和到店转化的更清晰关联验证。',
  },
  {
    title: '评论区站队机制会提升内容的二次扩散',
    evidence: '达人访谈普遍认可“宿舍站队”和“第一口反应”更好拍也更好聊。',
    confidence: 0.66,
    gap: '需要验证评论区互动是否真的转成 UGC 跟拍。',
  },
  {
    title: '如果发布时间和协同分发没配好，反应类内容也会被当作普通探店',
    evidence: '当前只是定性观察，缺少同城校园时段的系统复盘。',
    confidence: 0.41,
    gap: '需要把发布时间、首条评论和达人协同路径一起测试。',
  },
];

export const baseStrategies: StrategyCard[] = [
  {
    name: '先做 6 条小范围 KOC 快测',
    type: '低成本验证',
    cost: '低',
    timeToValue: '4 天',
    acceptance: 76,
    risk: '样本小，容易受单个达人表现波动影响。',
    recommendation: '最适合先判断内容角度，再决定是否加大投放与置换资源。',
  },
  {
    name: '围绕室友盲测做一周集中传播',
    type: '内容主线验证',
    cost: '中',
    timeToValue: '7 天',
    acceptance: 81,
    risk: '如果评论区机制和店内配合不到位，话题可能很快失速。',
    recommendation: '值得作为主实验，但要同步布置评论互动和到店承接。',
  },
  {
    name: '先打功能介绍，再补达人反应',
    type: '保守方案',
    cost: '低',
    timeToValue: '3 天',
    acceptance: 49,
    risk: '容易获得表面完播，却丢掉真正能带朋友到店的触发点。',
    recommendation: '不建议作为主路径，最多只保留作对照组。',
  },
];

export const stepLabels: StepLabel[] = [
  { id: 'overview', label: '传播任务', kicker: 'Brief' },
  { id: 'evidence', label: '证据信号', kicker: 'Signals' },
  { id: 'modeling', label: '当前诊断', kicker: 'Diagnosis' },
  { id: 'strategy', label: '扩散演化', kicker: 'Spread' },
  { id: 'report', label: '策略报告', kicker: 'Report' },
  { id: 'sandbox', label: '变量实验', kicker: 'Lab' },
];
