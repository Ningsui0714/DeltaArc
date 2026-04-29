import type { SandboxPerspective } from '../../../shared/sandbox';

export const specialistBlueprints = [
  {
    key: 'systems',
    label: '内容机制',
    mission: '从内容主张、首轮触达反馈密度、内容消费节奏与互动链路出发，判断机制是否能稳定产出可复现的传播价值。',
  },
  {
    key: 'psychology',
    label: '受众心理',
    mission: '从目标受众分层、理解门槛、情绪起伏、挫败感与二次互动意愿出发，找出心理层面的增益与断裂。',
  },
  {
    key: 'economy',
    label: '增长转化',
    mission: '从增长驱动、分发-互动-转化闭环、内容复用与中期留存理由出发判断可持续性。',
  },
  {
    key: 'market',
    label: '平台竞争',
    mission: '从目标受众、竞品内容、差异化卖点、平台叙事与跨圈扩散能力出发，避免只在内部语境里自嗨。',
  },
  {
    key: 'production',
    label: '生产执行',
    mission: '从研发复杂度、系统耦合、内容产能、验证周期与团队生产约束出发评估实现压力。',
  },
  {
    key: 'red_team',
    label: '反方审查',
    mission: '默认项目会失败，优先寻找最可能击穿这个方向的失败模式、虚假正反馈和错误归因。',
  },
] satisfies Array<{
  key: SandboxPerspective['key'];
  label: string;
  mission: string;
}>;

export type SpecialistBlueprint = (typeof specialistBlueprints)[number];
