import type { SandboxAnalysisResult } from '../../../../shared/sandbox';
import type { DeepseekMessage } from '../../deepseekApi';

export function buildRefinementMessages(provisional: SandboxAnalysisResult): DeepseekMessage[] {
  return [
    {
      role: 'system',
      content:
        '你是最终审校器。不要重写风格，而是让预测更具体、更像真实会发生的时间线。重点修复空泛判断、缺少节奏感、没有社区演化、没有走势转折信号的问题。保持 schema 完整，只输出一个合法 JSON 对象，不要输出 markdown 或解释。',
    },
    {
      role: 'user',
      content: `请审校并升级这份 provisional result。
要求：
1. 至少让 futureTimeline / communityRhythms / trajectorySignals / validationTracks 更具体。
2. 时间线不要写成同义改写，要体现“先发生什么，随后怎么演化，再往后如何定型”。
3. 社区节奏要像真实社区，会有围观、分层、复盘、沉淀或冷却，不要停留在抽象分析。
4. trajectorySignals 要写清楚触发后会带来什么影响，以及该怎么应对。
5. 保持字段完整，不要删字段。
6. 必须输出严格合法 JSON；如果需要缩短内容，缩短句子，不要缩掉结构。

Provisional JSON:
${JSON.stringify(provisional, null, 2)}`,
    },
  ];
}
