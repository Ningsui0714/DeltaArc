import type { SandboxPerspective } from '../../../shared/sandbox';

export const specialistBlueprints = [
  {
    key: 'systems',
    label: '玩法系统',
    mission: '从核心循环、核心体验承诺、首局反馈密度与局时节奏出发，判断设计是否真的能带来可复现的乐趣。',
  },
  {
    key: 'psychology',
    label: '玩家心理',
    mission: '从目标玩家分层、新手理解、情绪起伏、挫败感与第二局意愿出发，找出心理层面的增益与断裂。',
  },
  {
    key: 'economy',
    label: '留存增长',
    mission: '从成长驱动、局内外循环、内容复用与中期留存理由出发判断可持续性。',
  },
  {
    key: 'market',
    label: '市场定位',
    mission: '从目标受众、参考游戏、差异化卖点、传播叙事与题材外化能力出发，避免只在内部语境里自嗨。',
  },
  {
    key: 'production',
    label: '制作落地',
    mission: '从研发复杂度、系统耦合、内容产能、原型周期与团队制作约束出发评估实现压力。',
  },
  {
    key: 'red_team',
    label: '反方拆解',
    mission: '默认项目会失败，优先寻找最可能击穿这个方向的失败模式、虚假正反馈和错误归因。',
  },
] satisfies Array<{
  key: SandboxPerspective['key'];
  label: string;
  mission: string;
}>;

export type SpecialistBlueprint = (typeof specialistBlueprints)[number];
