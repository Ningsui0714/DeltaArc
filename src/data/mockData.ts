import type {
  EvidenceItem,
  HypothesisCard,
  PersonaCard,
  ProjectSnapshot,
  StepLabel,
  StrategyCard,
} from '../types';

export const demoProject: ProjectSnapshot = {
  name: '代号：星落营地',
  mode: 'Concept',
  genre: '合作生存建造',
  platforms: ['PC', 'Steam Deck'],
  targetPlayers: ['双人合作玩家', '轻度生存爱好者', '直播传播型玩家'],
  coreFantasy: '和朋友在高压环境里分工救场，把一次次险些崩盘的局面救回来。',
  ideaSummary: '用双人协作机关和基地事件，验证“社交驱动中期留存”是否成立。',
  coreLoop: '探索 -> 收集 -> 建造 -> 防守 -> 触发双人协作机关',
  sessionLength: '15-20 分钟一局，允许失败后快速重开。',
  differentiators: '把合作机关做成高频且可复述的高光时刻，而不是长线刷资源。',
  progressionHook: '局内解锁新的协作机关组合，局外解锁更强的营地支援。',
  socialHook: '需要双人同步操作和临场沟通，但保留弱配合下的补位空间。',
  monetization: '暂不立刻验证付费，先聚焦玩法成立，再评估装扮和赛季化内容。',
  referenceGames: ['双人成行', '饥荒联机版', 'Deep Rock Galactic'],
  validationGoal: '先确认首局 10 分钟内是否能稳定出现值得复述的协作高光。',
  productionConstraints: '2 人团队，6 周内只能做出一个高密度短局原型。',
  currentStatus: '需要先验证协作乐趣是否强于上手负担',
};

export function createBlankProject(): ProjectSnapshot {
  return {
    name: '未命名项目',
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
    type: 'design_doc',
    title: '玩法草案',
    source: '策划文档',
    trust: 'medium',
    summary: '双人机关提供中期目标，但单人补位机制仍然偏弱。',
    createdAt: '10:05',
  },
  {
    id: 'evi_002',
    type: 'interview',
    title: '合作玩家访谈',
    source: '5 位生存游戏玩家',
    trust: 'high',
    summary: '玩家希望合作收益清晰，但讨厌必须等待队友的设计。',
    createdAt: '10:12',
  },
  {
    id: 'evi_003',
    type: 'review',
    title: '竞品评论摘录',
    source: 'Steam 评论归纳',
    trust: 'medium',
    summary: '差评集中在教程冗长和失败惩罚过重，而不是题材本身。',
    createdAt: '10:18',
  },
];

export const personas: PersonaCard[] = [
  {
    name: '轻协作玩家',
    motive: '想和朋友轻松配合，又不愿背复杂规则。',
    accepts: '合作奖励直观，失败能迅速重开。',
    rejects: '单人无法推进，或机制学习像上课。',
    verdict: '中度看好，但对教学和节奏极其敏感。',
  },
  {
    name: '硬核系统党',
    motive: '愿意研究数值和分工，追求高效通关。',
    accepts: '机关需要策略分工，并能形成高水平配合天花板。',
    rejects: '随机事件过多、可控性不够。',
    verdict: '愿意尝鲜，但不是第一波最关键用户。',
  },
  {
    name: '内容传播者',
    motive: '寻找可直播、可剪辑的合作事故与翻盘瞬间。',
    accepts: '机制能制造高张力的协作时刻。',
    rejects: '观感平淡，过程信息密度低。',
    verdict: '适合做第二阶段传播验证。',
  },
];

export const hypotheses: HypothesisCard[] = [
  {
    title: '双人协作机关会提升第 3 到 5 天回流',
    evidence: '玩家访谈支持“合作目标”有吸引力，但样本仍少。',
    confidence: 0.64,
    gap: '缺少真实可玩原型下的回流反馈。',
  },
  {
    title: '失败惩罚过高会掩盖合作乐趣',
    evidence: '竞品差评与访谈都提到“重复劳动”问题。',
    confidence: 0.78,
    gap: '需要通过两套失败反馈方案做 A/B 纸面测试。',
  },
  {
    title: '内容传播性依赖高戏剧性的机关瞬间',
    evidence: '目前主要来自竞品内容观察，缺少本项目录像样本。',
    confidence: 0.43,
    gap: '需要录制 15 分钟原型试玩片段做外部观看测试。',
  },
];

export const baseStrategies: StrategyCard[] = [
  {
    name: '纸面流程验证',
    type: '低成本验证',
    cost: '低',
    timeToValue: '3 天',
    acceptance: 62,
    risk: '无法验证真实操作挫败感',
    recommendation: '适合先筛掉机制逻辑漏洞，不适合直接下立项结论。',
  },
  {
    name: '单局可玩原型',
    type: '核心玩法验证',
    cost: '中',
    timeToValue: '2 周',
    acceptance: 74,
    risk: '如果没有单人补位方案，负面反馈会被放大',
    recommendation: '当前最值得推进，用来判断协作乐趣是否真成立。',
  },
  {
    name: '题材包装先行测试',
    type: '市场感知验证',
    cost: '低',
    timeToValue: '5 天',
    acceptance: 48,
    risk: '会误把题材兴趣当作玩法可行性',
    recommendation: '适合第二阶段，不应替代玩法验证。',
  },
];

export const stepLabels: StepLabel[] = [
  { id: 'overview', label: '项目概览', kicker: 'Mission' },
  { id: 'evidence', label: '证据输入', kicker: 'Signals' },
  { id: 'modeling', label: '建模结果', kicker: 'Model' },
  { id: 'strategy', label: '策略对比', kicker: 'Routes' },
  { id: 'report', label: '最终报告', kicker: 'Brief' },
];
