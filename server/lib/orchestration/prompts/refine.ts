import type { SandboxAnalysisResult } from '../../../../shared/sandbox';
import { withVisibleAnalysisWarnings } from '../../../../shared/analysisWarnings';
import type { DeepseekMessage } from '../../deepseekApi';
import { embeddedDataInstruction, formatDataSection } from './utils';

export function buildRefinementMessages(provisional: SandboxAnalysisResult): DeepseekMessage[] {
  const visibleProvisional = withVisibleAnalysisWarnings(provisional);

  return [
    {
      role: 'system',
      content:
        `你是最终审校器。你只做增量修订，不做整份重写。目标是让结论更具体、更像真实会发生的时间线和社区演化。重点修复空泛判断、缺少节奏感、走势信号不具可执行性的问题。只输出一个合法 JSON patch；没变化的字段可以省略。不要输出 markdown、解释或 schema 外字段。${embeddedDataInstruction}`,
    },
    {
      role: 'user',
      content: `请审校并升级这份 provisional result。
要求：
1. 这是增量 patch，不是完整 schema。只有当字段能被实质性提升时才输出该字段。
2. 优先考虑 summary、systemVerdict、primaryRisk、nextStep、report；只有在确实能显著变好时，再输出 futureTimeline、communityRhythms、trajectorySignals、validationTracks。
3. 如果输出数组字段或 report 这类结构化字段，请输出该字段的完整可用版本，不要只给局部元素。
4. 时间线要体现“先发生什么，随后怎么演化，再往后如何定型”；社区节奏要像真实社区，会有围观、分层、复盘、沉淀或冷却；trajectorySignals 要写清触发、影响和应对。
5. 不要返回 generatedAt、mode、model、pipeline、meta，也不要输出 null。
6. 如果这份 draft 已经足够好，可以只返回一个极小 patch，例如 {"warnings":["refine: no substantive changes needed"]}。
7. 必须输出严格合法 JSON，不要解释你的判断。

${formatDataSection('PROVISIONAL', visibleProvisional, { pretty: true })}`,
    },
  ];
}
