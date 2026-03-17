import type { SandboxAnalysisRequest, SandboxAnalysisResult } from '../../../../shared/sandbox';
import { withVisibleAnalysisWarnings } from '../../../../shared/analysisWarnings';
import type { DeepseekMessage } from '../../deepseekApi';
import type { Dossier } from '../types';
import {
  contradictionInstruction,
  groundedFactsInstruction,
  inferenceLabelingInstruction,
  missingEvidenceInstruction,
} from './grounding';
import { embeddedDataInstruction, formatDataSection } from './utils';

export type ActionBriefFlavor = 'balanced' | 'skeptical' | 'execution_first';

function buildSharedSynthesisContext(
  request: SandboxAnalysisRequest,
  dossier: Dossier,
  provisional: SandboxAnalysisResult,
) {
  const visibleDossier = withVisibleAnalysisWarnings(dossier);
  const visibleProvisional = withVisibleAnalysisWarnings(provisional);

  return `${formatDataSection('PROJECT', request.project, { pretty: true })}

${formatDataSection('DOSSIER', visibleDossier, { pretty: true })}

${formatDataSection('PROVISIONAL_BASE', visibleProvisional, { pretty: true })}`;
}

function getActionBriefFlavorInstruction(flavor: ActionBriefFlavor) {
  if (flavor === 'skeptical') {
    return '本轮是 skeptical action brief。优先收缩不被证据支持的乐观判断，强调主要风险和必要前置条件。';
  }

  if (flavor === 'execution_first') {
    return '本轮是 execution-first action brief。优先输出两周内可落地的动作，避免宏大但无法执行的建议。';
  }

  return '本轮是 balanced action brief。你要平衡方向判断、风险提示与可执行动作。';
}

export function buildFutureEvolutionMessages(
  request: SandboxAnalysisRequest,
  dossier: Dossier,
  provisional: SandboxAnalysisResult,
): DeepseekMessage[] {
  return [
    {
      role: 'system',
      content:
        `你是一个未来演化推演器。你的任务只补全 futureTimeline / communityRhythms / trajectorySignals / warnings 这 4 类字段，不要重写其他字段。${groundedFactsInstruction}${inferenceLabelingInstruction}${contradictionInstruction}${missingEvidenceInstruction}${embeddedDataInstruction}只输出一个合法 JSON 对象，不要输出 markdown，不要输出解释。`,
    },
    {
      role: 'user',
      content: `请基于项目、dossier 和当前结构化底稿，补全未来演化部分。

${buildSharedSynthesisContext(request, dossier, provisional)}

要求：
1. 用中文输出。
2. 只返回 futureTimeline / communityRhythms / trajectorySignals / warnings。
3. futureTimeline 至少 3 条，覆盖首波反应、几天后的分化、2-3 周后的节奏定型。
4. communityRhythms 至少 3 条，体现社区会如何讨论、复盘、沉淀或冷却。
5. trajectorySignals 至少 3 条，写清楚触发信号、走势方向、影响和建议动作。
6. 优先利用 provisional_base 里已有的 scenarioVariants / validationTracks / secondOrderEffects / unknowns / redTeam 作为素材，不要再发明新的项目事实。
7. 如果某个判断只能建立在推断上，请显式写成“推断：...”或放入 warnings。
8. 如果内容过长，优先缩短句子，不要删掉结构。

JSON schema:
{
  "futureTimeline": [{
    "phase": "",
    "timing": "",
    "expectedReaction": "",
    "likelyShift": "",
    "risk": "",
    "watchSignals": [""],
    "recommendedResponse": ""
  }],
  "communityRhythms": [{
    "name": "",
    "timing": "",
    "pattern": "",
    "trigger": "",
    "implication": ""
  }],
  "trajectorySignals": [{
    "signal": "",
    "direction": "positive|mixed|negative",
    "timing": "",
    "impact": "",
    "recommendedMove": ""
  }],
  "warnings": []
}`,
    },
  ];
}

export function buildActionBriefMessages(
  request: SandboxAnalysisRequest,
  dossier: Dossier,
  provisional: SandboxAnalysisResult,
  flavor: ActionBriefFlavor = 'balanced',
): DeepseekMessage[] {
  return [
    {
      role: 'system',
      content:
        `你是一个行动摘要综合器。你的任务只补全 summary / systemVerdict / primaryRisk / nextStep / playerAcceptance / confidence / supportRatio / strategies / report / warnings，不要重写其他字段。${getActionBriefFlavorInstruction(flavor)}${groundedFactsInstruction}${inferenceLabelingInstruction}${contradictionInstruction}${missingEvidenceInstruction}${embeddedDataInstruction}只输出一个合法 JSON 对象，不要输出 markdown，不要输出解释。`,
    },
    {
      role: 'user',
      content: `请基于项目、dossier 和当前结构化底稿，生成最终摘要与行动建议。

${buildSharedSynthesisContext(request, dossier, provisional)}

要求：
1. 用中文输出。
2. 当前候选风格是 ${flavor}，要体现该风格，但不能越过证据边界。
3. 只返回 summary / systemVerdict / primaryRisk / nextStep / playerAcceptance / confidence / supportRatio / strategies / report / warnings。
4. playerAcceptance / confidence / supportRatio 必须使用 0-100 整数。
5. strategies 至少 3 条，而且要明显不同；优先改写 provisional_base.strategies，而不是完全推翻。
6. report.actions 至少 4 条，并且都必须贴合当前 productionConstraints，默认应在两周内推进。
7. systemVerdict 必须基于 project 和 dossier 重新概括，不要直接复用 provisional_base.systemVerdict 的原句；即使结论仍偏谨慎，也要写出这轮项目特有的机会或约束。
8. 不得新增未提供的参考游戏、开发时长、团队规模、商业化方案、平台或玩法机制。
9. 如果 dossier 或 provisional_base 与原始项目冲突，以原始项目为准，并在 warnings 中写明冲突。
10. 如果做推断，必须显式写成“推断：...”或写入 warnings，不得把推断包装成已知事实。
11. 不得输出通用库存句，尤其不要直接写“方向暂不宜乐观扩张，先用更小成本验证关键前提。”这类与项目无关的模板 verdict。

JSON schema:
{
  "summary": "",
  "systemVerdict": "",
  "primaryRisk": "",
  "nextStep": "",
  "playerAcceptance": 0,
  "confidence": 0,
  "supportRatio": 0,
  "strategies": [{
    "name": "",
    "type": "",
    "cost": "",
    "timeToValue": "",
    "acceptance": 0,
    "risk": "",
    "recommendation": ""
  }],
  "report": {
    "headline": "",
    "summary": "",
    "conclusion": "",
    "whyNow": "",
    "risk": "",
    "actions": ["", "", "", ""]
  },
  "warnings": []
}`,
    },
  ];
}

export function buildActionBriefSelectionMessages(
  request: SandboxAnalysisRequest,
  dossier: Dossier,
  provisional: SandboxAnalysisResult,
  candidates: Array<{
    candidateId: string;
    flavor: ActionBriefFlavor;
    brief: Record<string, unknown>;
  }>,
): DeepseekMessage[] {
  return [
    {
      role: 'system',
      content:
        `你是 action brief 候选验证器。你的任务不是重写候选，而是比较多份行动摘要候选，选出最有证据支撑、最可执行、最诚实暴露风险的一份。${groundedFactsInstruction}${inferenceLabelingInstruction}${contradictionInstruction}${missingEvidenceInstruction}${embeddedDataInstruction}只输出一个合法 JSON 对象，不要输出 markdown，不要输出解释。`,
    },
    {
      role: 'user',
      content: `请基于项目、dossier、当前结构化底稿和多份行动摘要候选，选出最适合成为最终摘要的一份。

${buildSharedSynthesisContext(request, dossier, provisional)}

${formatDataSection('ACTION_BRIEF_CANDIDATES', candidates, { pretty: true })}

评估要求：
1. 用中文输出。
2. 优先选择 evidence 边界更清晰、动作更具体、主风险更真实的候选。
3. 如果候选动作空泛，或把推断包装成确定事实，要降权。
4. 不要把更保守或更悲观的语气本身当成加分项；如果多份候选证据边界同样清晰，优先保留既写清机会也写清约束、且动作最具体的版本。
5. 不要因为语言更像“报告”就给高分，优先保留能指导下一步的候选。
6. selectedCandidateId 必须从候选列表中选。
7. rankings 至少覆盖所有候选，并使用 0-100 整数 overallScore。
8. 如果某个候选的 systemVerdict 是通用库存句，尤其是“方向暂不宜乐观扩张，先用更小成本验证关键前提。”这类模板话，要显著降权。

JSON schema:
{
  "selectedCandidateId": "",
  "rationale": "",
  "rankings": [{
    "candidateId": "",
    "overallScore": 0,
    "strength": "",
    "risk": ""
  }],
  "warnings": []
}`,
    },
  ];
}

export function buildReverseCheckMessages(
  request: SandboxAnalysisRequest,
  dossier: Dossier,
  provisional: SandboxAnalysisResult,
): DeepseekMessage[] {
  return [
    {
      role: 'system',
      content:
        `你是最终结论的 reverse-check verifier。你的任务不是重写整份结果，而是从“如果当前结论成立，必须满足哪些条件”出发，检查这份 provisional 是否把推断写得太满、风险写得太轻、动作写得太虚。${groundedFactsInstruction}${inferenceLabelingInstruction}${contradictionInstruction}${missingEvidenceInstruction}${embeddedDataInstruction}只输出一个合法 JSON 对象，不要输出 markdown，不要输出解释。`,
    },
    {
      role: 'user',
      content: `请对下面这份 provisional result 做反向核验。

${buildSharedSynthesisContext(request, dossier, provisional)}

要求：
1. 用中文输出。
2. 先从“当前系统判断要成立，必须满足哪些条件”出发做核验。
3. necessaryConditions 至少 3 条，每条都标成 supported / uncertain / unsupported。
4. 如果发现结论写得过满，可以收缩 summary / systemVerdict / primaryRisk / nextStep / report，但不要改写别的字段。
5. 如果当前结论已经合理，也要把脆弱点写进 warnings，而不是默认一切稳固。
6. report.actions 可以调整顺序或措辞，但应保持 4 条以内高信号动作，不要发散成新计划。
7. 不得新增未提供的参考游戏、开发时长、团队规模、商业化方案、平台或玩法机制。
8. 如果某个必要条件没有被充分支持，必须在 warnings 中显式指出。

JSON schema:
{
  "summary": "",
  "systemVerdict": "",
  "primaryRisk": "",
  "nextStep": "",
  "report": {
    "headline": "",
    "summary": "",
    "conclusion": "",
    "whyNow": "",
    "risk": "",
    "actions": ["", "", "", ""]
  },
  "fragilitySummary": "",
  "necessaryConditions": [{
    "condition": "",
    "status": "supported|uncertain|unsupported",
    "evidenceRefs": [""],
    "impact": ""
  }],
  "warnings": []
}`,
    },
  ];
}
