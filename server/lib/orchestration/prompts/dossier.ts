import type { SandboxAnalysisRequest } from '../../../../shared/sandbox';
import type { DeepseekMessage } from '../../deepseekApi';
import {
  contradictionInstruction,
  groundedFactsInstruction,
  inferenceLabelingInstruction,
  missingEvidenceInstruction,
} from './grounding';
import { embeddedDataInstruction, formatDataSection, formatTextSection } from './utils';
import type { Dossier, DossierGrounding } from '../types';

export type DossierCandidateFlavor = 'balanced' | 'skeptic' | 'feasibility';

function getDossierFlavorInstruction(flavor: DossierCandidateFlavor) {
  if (flavor === 'skeptic') {
    return '本轮是 skeptical candidate。你要默认大部分乐观判断都需要被再次证明；证据不够时优先收缩结论，而不是补写漂亮判断。';
  }

  if (flavor === 'feasibility') {
    return '本轮是 feasibility-first candidate。你要优先考虑制作约束、验证成本、两周内可执行性和范围控制，不要为叙事完整牺牲可落地性。';
  }

  return '本轮是 balanced candidate。你要在机会、风险与证据边界之间保持均衡，不做无依据乐观，也不要把一切都打成暂停。';
}

export function buildDossierMessages(
  request: SandboxAnalysisRequest,
  memoryContext: string,
): DeepseekMessage[] {
  return [
    {
      role: 'system',
      content:
        `你是一个服务于 KOC 内容策略风洞的“证据蒸馏器”。你先抽取结构，再形成判断；你必须主动补足用户没有提出但会影响成败的维度。${groundedFactsInstruction}${inferenceLabelingInstruction}${contradictionInstruction}${missingEvidenceInstruction}${embeddedDataInstruction}请只输出 JSON，不要输出解释文字。`,
    },
    {
      role: 'user',
      content: `请基于以下项目快照、证据和历史记忆，输出一个用于后续多视角推演的 KOC 内容策略 dossier。

${formatDataSection('PROJECT', request.project)}

${formatDataSection('EVIDENCE_ITEMS', request.evidenceItems)}

${formatTextSection('MEMORY_CONTEXT', memoryContext)}

输出要求：
1. 用中文。
2. 不要直接只给结论，先抽出 tensions / gaps / signals。
3. 必须覆盖内容主张、目标受众分层、分发节奏、互动驱动、转化路径、平台竞争、内容生产约束这些维度。
4. 要覆盖内容机制、受众心理、增长转化、平台竞争、生产执行、反方审查这些维度。
5. confidence / supportRatio / playerAcceptance / scores 全部使用 0-100 整数。
6. hypothesis 的 confidence 使用 0-100 整数。
7. personas / hypotheses / evidenceDigest / memorySignals 默认各保留 2-4 条，只保留最高信号内容。
8. coreTensions / openQuestions 默认各保留 3-5 条，避免堆砌同义项。
9. 只允许引用项目、证据、历史记忆里明确出现的事实；缺失就写 openQuestions / warnings，不要脑补具体细节。
10. 不得新增未提供的竞品内容、投放预算、团队规模、平台机制或内容机制细节。
11. 如果做推断，必须显式写成“推断：...”或放到 hypothesis.gap / openQuestions / warnings。
12. 如果历史记忆和当前项目快照冲突，以当前项目快照和当前证据为准，并在 warnings 中写明冲突。
13. 历史记忆只作为风险、盲点和验证线索，不得直接沿用其中旧 verdict 或旧结论。

JSON schema:
{
  "systemFrame": "",
  "opportunityThesis": "",
  "evidenceLevel": "low|medium|high",
  "playerAcceptance": 0,
  "confidence": 0,
  "supportRatio": 0,
  "scores": {
    "coreFun": 0,
    "learningCost": 0,
    "novelty": 0,
    "acceptanceRisk": 0,
    "prototypeCost": 0
  },
  "personas": [{
    "name": "",
    "motive": "",
    "accepts": "",
    "rejects": "",
    "verdict": ""
  }],
  "hypotheses": [{
    "title": "",
    "evidence": "",
    "confidence": 0,
    "gap": ""
  }],
  "evidenceDigest": [{
    "title": "",
    "signal": "",
    "implication": ""
  }],
  "coreTensions": ["", ""],
  "openQuestions": ["", ""],
  "memorySignals": [{
    "title": "",
    "summary": "",
    "signalStrength": "fresh|recurring|warning"
  }],
  "warnings": []
}`,
    },
  ];
}

export function buildGroundedDossierMessages(
  request: SandboxAnalysisRequest,
  groundingPack: DossierGrounding,
  flavor: DossierCandidateFlavor = 'balanced',
): DeepseekMessage[] {
  return [
    {
      role: 'system',
      content:
        `你是一个服务于 KOC 内容策略风洞的“证据蒸馏器”。你会在已抽取好的 grounded pack 基础上形成 dossier。${getDossierFlavorInstruction(flavor)}${groundedFactsInstruction}${inferenceLabelingInstruction}${contradictionInstruction}${missingEvidenceInstruction}${embeddedDataInstruction}请只输出 JSON，不要输出解释文字。`,
    },
    {
      role: 'user',
      content: `请基于项目快照和 grounded pack，输出一个用于后续多视角推演的 KOC 内容策略 dossier。

${formatDataSection('PROJECT', request.project, { pretty: true })}

${formatDataSection('GROUNDED_PACK', groundingPack, { pretty: true })}

输出要求：
1. 用中文。
2. 当前候选风格是 ${flavor}，要在保持 grounded_pack 事实边界的前提下体现该风格。
3. grounded_pack 里的 facts / tensions / audiences / constraints / unknowns 是优先事实底稿；不要忽略它们重新发散。
4. 不要直接只给结论，先吸收 tensions / unknowns / facts 再形成判断。
5. 必须覆盖内容主张、目标受众分层、分发节奏、互动驱动、转化路径、平台竞争、内容生产约束这些维度。
6. 要覆盖内容机制、受众心理、增长转化、平台竞争、生产执行、反方审查这些维度。
7. confidence / supportRatio / playerAcceptance / scores 全部使用 0-100 整数。
8. hypothesis 的 confidence 使用 0-100 整数。
9. personas / hypotheses / evidenceDigest / memorySignals 默认各保留 2-4 条，只保留最高信号内容。
10. coreTensions / openQuestions 默认各保留 3-5 条，避免堆砌同义项。
11. 只允许引用项目和 grounded_pack 中明确出现的事实；缺失就写 openQuestions / warnings，不要脑补具体细节。
12. 不得新增未提供的竞品内容、投放预算、团队规模、平台机制或内容机制细节。
13. 如果做推断，必须显式写成“推断：...”或放到 hypothesis.gap / openQuestions / warnings。
14. 即使 grounded_pack 里含有历史记忆信号，也只能把它们当作风险、盲点和验证线索，不得直接沿用旧 verdict 或旧结论。

JSON schema:
{
  "systemFrame": "",
  "opportunityThesis": "",
  "evidenceLevel": "low|medium|high",
  "playerAcceptance": 0,
  "confidence": 0,
  "supportRatio": 0,
  "scores": {
    "coreFun": 0,
    "learningCost": 0,
    "novelty": 0,
    "acceptanceRisk": 0,
    "prototypeCost": 0
  },
  "personas": [{
    "name": "",
    "motive": "",
    "accepts": "",
    "rejects": "",
    "verdict": ""
  }],
  "hypotheses": [{
    "title": "",
    "evidence": "",
    "confidence": 0,
    "gap": ""
  }],
  "evidenceDigest": [{
    "title": "",
    "signal": "",
    "implication": ""
  }],
  "coreTensions": ["", ""],
  "openQuestions": ["", ""],
  "memorySignals": [{
    "title": "",
    "summary": "",
    "signalStrength": "fresh|recurring|warning"
  }],
  "warnings": []
}`,
    },
  ];
}

export function buildDossierSelectionMessages(
  request: SandboxAnalysisRequest,
  groundingPack: DossierGrounding,
  candidates: Array<{
    candidateId: string;
    flavor: DossierCandidateFlavor;
    dossier: Dossier;
  }>,
): DeepseekMessage[] {
  return [
    {
      role: 'system',
      content:
        `你是 dossier 候选验证器。你的任务不是重写候选，而是比较多份 dossier 候选，选出最可信、最贴合约束、最适合进入下游阶段的一份。${groundedFactsInstruction}${inferenceLabelingInstruction}${contradictionInstruction}${missingEvidenceInstruction}${embeddedDataInstruction}只输出一个合法 JSON 对象，不要输出 markdown，不要输出解释。`,
    },
    {
      role: 'user',
      content: `请基于项目快照、grounded pack 和多份 dossier 候选，选出最适合进入后续推演的一份。

${formatDataSection('PROJECT', request.project, { pretty: true })}

${formatDataSection('GROUNDED_PACK', groundingPack, { pretty: true })}

${formatDataSection('DOSSIER_CANDIDATES', candidates, { pretty: true })}

评估要求：
1. 用中文输出。
2. 优先选择事实边界更稳、约束意识更强、下一步更可执行的候选。
3. 如果候选把推断写成事实，或明显忽略 constraints / unknowns，要降权。
4. 不要把更保守或更悲观的语气本身当成加分项；如果多份候选证据边界相近，优先保留把机会、约束和下一步一起说清楚的版本。
5. 不要因为措辞更华丽就给高分；优先保留证据边界清晰的候选。
6. selectedCandidateId 必须从候选列表中选。
7. rankings 至少覆盖所有候选，并使用 0-100 整数 overallScore。

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
