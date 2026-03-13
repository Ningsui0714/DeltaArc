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
    agent: '协调中枢',
    role: '共享简报',
    handoff: '整理项目设定、证据和待回答问题，然后把统一简报分发给各个 specialist。',
    lane: 'brief',
  },
  systems: {
    agent: '玩法系统代理',
    role: '玩法系统',
    handoff: '从核心循环、反馈密度和上手结构判断第一波反应，再把结论交给 synthesis。',
    lane: 'analysis',
  },
  psychology: {
    agent: '玩家心理代理',
    role: '玩家心理',
    handoff: '从情绪波动、受挫点和二次传播意愿补齐心理层判断。',
    lane: 'analysis',
  },
  economy: {
    agent: '留存演化代理',
    role: '留存演化',
    handoff: '从回流、长期留存和节奏消耗角度补充中后期变化。',
    lane: 'analysis',
  },
  market: {
    agent: '传播定位代理',
    role: '传播定位',
    handoff: '从外部传播、竞品语境和卖点复述能力判断社区扩散速度。',
    lane: 'analysis',
  },
  production: {
    agent: '制作落地代理',
    role: '制作落地',
    handoff: '从范围、资源和原型压力反推哪些未来演化真正可执行。',
    lane: 'analysis',
  },
  red_team: {
    agent: '反方拆解代理',
    role: '反方拆解',
    handoff: '优先寻找失速路径、虚假正反馈和误判假设，再把反证回传给 synthesis。',
    lane: 'analysis',
  },
  synthesis: {
    agent: '综合推演代理',
    role: '时间线编排',
    handoff: '汇总各 specialist 的判断，生成未来时间线、社区节奏和转折信号。',
    lane: 'forecast',
  },
  refine: {
    agent: '收束润色代理',
    role: '报告收束',
    handoff: '压缩空话、强化节奏感，把模拟结果收束成可读的最终预测报告。',
    lane: 'forecast',
  },
};

const enAgentStageMeta: Partial<Record<SandboxAnalysisStageKey, AgentStageDescriptor>> = {
  dossier: {
    agent: 'Dossier Hub',
    role: 'Shared Brief',
    handoff: 'Bundle the project setup, evidence, and open questions into a shared brief for every specialist.',
    lane: 'brief',
  },
  systems: {
    agent: 'Systems Agent',
    role: 'Game Systems',
    handoff: 'Judge the first reaction from core loops, feedback density, and onboarding structure before handing off.',
    lane: 'analysis',
  },
  psychology: {
    agent: 'Psychology Agent',
    role: 'Player Psychology',
    handoff: 'Cover emotion, frustration, and willingness to share so the human layer is not missed.',
    lane: 'analysis',
  },
  economy: {
    agent: 'Retention Agent',
    role: 'Retention Arc',
    handoff: 'Project comeback, mid-term retention, and long-run fatigue to extend the forecast horizon.',
    lane: 'analysis',
  },
  market: {
    agent: 'Market Agent',
    role: 'Positioning',
    handoff: 'Estimate community spread speed from marketing language, category context, and message clarity.',
    lane: 'analysis',
  },
  production: {
    agent: 'Production Agent',
    role: 'Execution',
    handoff: 'Reverse-check scope, resources, and prototype pressure to see which futures are actually buildable.',
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
    role: 'Timeline Weave',
    handoff: 'Merge specialist judgments into future beats, community rhythms, and inflection signals.',
    lane: 'forecast',
  },
  refine: {
    agent: 'Refine Agent',
    role: 'Report Closure',
    handoff: 'Tighten wording, sharpen tempo, and collapse the simulation into a readable final report.',
    lane: 'forecast',
  },
};

export const agentStageMeta = zhAgentStageMeta;

export function getAgentStageMeta(language: UiLanguage = 'zh') {
  return language === 'en' ? enAgentStageMeta : zhAgentStageMeta;
}
