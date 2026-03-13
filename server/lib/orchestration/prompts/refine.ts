import type { SandboxAnalysisResult } from '../../../../shared/sandbox';
import type { DeepseekMessage } from '../../deepseekApi';

export function buildRefinementMessages(provisional: SandboxAnalysisResult): DeepseekMessage[] {
  return [
    {
      role: 'system',
      content:
        '你是最终审校代理。你的职责不是重写风格，而是修复“单一维度、泛泛而谈、二阶影响不足、验证路径空泛”的问题。保留 schema，只输出更深的 JSON。',
    },
    {
      role: 'user',
      content: `请审校并升级这份 provisional result。\n\n要求：\n1. 至少让 blindSpots / secondOrderEffects / validationTracks / contrarianMoves 变得更具体。\n2. 不要把所有建议都写成同一种类型。\n3. 如果某项过于通用，就替换成更具区分度的内容。\n4. 保持字段完整，不要删字段。\n\nProvisional JSON:\n${JSON.stringify(
        provisional,
        null,
        2,
      )}`,
    },
  ];
}
