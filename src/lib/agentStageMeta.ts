import type { SandboxAnalysisStageKey } from '../../shared/sandbox';
import type { UiLanguage } from '../hooks/useUiLanguage';

export type AgentStageDescriptor = {
  agent: string;
  role: string;
  handoff: string;
  lane: 'brief' | 'analysis' | 'forecast';
};

const zhAgentStageMeta: Partial<Record<SandboxAnalysisStageKey, AgentStageDescriptor>> = {
  dossier: {
    agent: '简报中枢',
    role: '共享简报',
    handoff: '整理传播任务、证据和待回答问题，然后把统一简报分发给各个专项代理。',
    lane: 'brief',
  },
  systems: {
    agent: '内容机制代理',
    role: '内容机制',
    handoff: '从内容增长回路、互动触发和首屏理解成本判断第一波反应，再把结论交给综合收束阶段。',
    lane: 'analysis',
  },
  psychology: {
    agent: '受众心理代理',
    role: '受众心理',
    handoff: '从目标受众、情绪钩子、评论动机和转发阻力补齐心理层判断。',
    lane: 'analysis',
  },
  economy: {
    agent: '增长转化代理',
    role: '增长转化',
    handoff: '从关注、收藏、到店、领券和复访理由角度补充中后期变化。',
    lane: 'analysis',
  },
  market: {
    agent: '平台竞争代理',
    role: '平台竞争',
    handoff: '从平台语境、对标账号和内容差异点判断扩散速度。',
    lane: 'analysis',
  },
  production: {
    agent: '生产执行代理',
    role: '生产执行',
    handoff: '从 KOC 协作、内容产能和两周验证窗口反推哪些策略真正可执行。',
    lane: 'analysis',
  },
  red_team: {
    agent: '反方审查代理',
    role: '反方审查',
    handoff: '优先寻找失速路径、虚假正反馈和错误归因，再把反证回传给综合收束阶段。',
    lane: 'analysis',
  },
  synthesis: {
    agent: '综合推演代理',
    role: '扩散编排',
    handoff: '汇总各个专项代理的判断，生成扩散时间线、平台节奏和转折信号。',
    lane: 'forecast',
  },
  refine: {
    agent: '收束润色代理',
    role: '报告收束',
    handoff: '压缩空话、强化动作，把模拟结果收束成可读的策略报告。',
    lane: 'forecast',
  },
};

const enAgentStageMeta: Partial<Record<SandboxAnalysisStageKey, AgentStageDescriptor>> = {
  dossier: {
    agent: 'Dossier Hub',
    role: 'Shared Brief',
    handoff: 'Bundle the campaign brief, evidence, and open questions into a shared brief for every specialist.',
    lane: 'brief',
  },
  systems: {
    agent: 'Content Mechanism Agent',
    role: 'Content Mechanism',
    handoff: 'Judge the first reaction from growth loops, interaction triggers, and first-screen clarity before handing off.',
    lane: 'analysis',
  },
  psychology: {
    agent: 'Audience Psychology Agent',
    role: 'Audience Psychology',
    handoff: 'Cover audience motivation, emotional hooks, comment triggers, and share barriers.',
    lane: 'analysis',
  },
  economy: {
    agent: 'Growth Conversion Agent',
    role: 'Growth Conversion',
    handoff: 'Project follows, saves, visits, coupon claims, and return reasons to extend the forecast horizon.',
    lane: 'analysis',
  },
  market: {
    agent: 'Platform Competition Agent',
    role: 'Platform Fit',
    handoff: 'Estimate spread speed from platform context, reference accounts, and content differentiation.',
    lane: 'analysis',
  },
  production: {
    agent: 'Production Agent',
    role: 'Execution',
    handoff: 'Reverse-check KOC collaboration, content throughput, and two-week test pressure to see which futures are feasible.',
    lane: 'analysis',
  },
  red_team: {
    agent: 'Red Team Agent',
    role: 'Counter Thesis',
    handoff: 'Hunt for slowdown paths, false positives, and weak assumptions before synthesis locks the story.',
    lane: 'analysis',
  },
  synthesis: {
    agent: 'Synthesis Agent',
    role: 'Spread Timeline',
    handoff: 'Merge specialist judgments into spread beats, platform rhythms, and inflection signals.',
    lane: 'forecast',
  },
  refine: {
    agent: 'Refine Agent',
    role: 'Report Closure',
    handoff: 'Tighten wording, sharpen actions, and collapse the simulation into a readable strategy report.',
    lane: 'forecast',
  },
};

export const agentStageMeta = zhAgentStageMeta;

export function getAgentStageMeta(language: UiLanguage = 'zh') {
  return language === 'en' ? enAgentStageMeta : zhAgentStageMeta;
}
