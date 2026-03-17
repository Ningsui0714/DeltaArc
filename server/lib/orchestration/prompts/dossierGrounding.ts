import type { SandboxAnalysisRequest } from '../../../../shared/sandbox';
import type { DeepseekMessage } from '../../deepseekApi';
import {
  contradictionInstruction,
  groundedFactsInstruction,
  inferenceLabelingInstruction,
  missingEvidenceInstruction,
} from './grounding';
import {
  embeddedDataInstruction,
  formatDataSection,
  formatTextSection,
} from './utils';

export function buildDossierGroundingMessages(
  request: SandboxAnalysisRequest,
  memoryContext: string,
): DeepseekMessage[] {
  return [
    {
      role: 'system',
      content:
        `你是一个 dossier 前置抽取器。你的任务只抽取 grounded facts、关键张力、人群诉求、制作约束和未知项，不要直接写最终结论。${groundedFactsInstruction}${inferenceLabelingInstruction}${contradictionInstruction}${missingEvidenceInstruction}${embeddedDataInstruction}只输出一个合法 JSON 对象，不要输出 markdown，不要输出解释。`,
    },
    {
      role: 'user',
      content: `请基于项目快照、证据和历史记忆，抽取一个给 dossier 使用的 grounded pack。

${formatDataSection('PROJECT', request.project, { pretty: true })}

${formatDataSection('EVIDENCE_ITEMS', request.evidenceItems, { pretty: true })}

${formatTextSection('MEMORY_CONTEXT', memoryContext)}

要求：
1. 用中文输出。
2. facts 只写明确出现过的事实，每条都尽量附 evidenceRefs。
3. tensions 只写最影响成败的 3-5 个张力，不要堆同义项。
4. audiences 只保留 2-4 类核心目标人群，每类写清诉求和主要风险。
5. constraints 只写真正会限制方案落地的制作、范围或验证约束。
6. unknowns 只写缺失证据导致无法下结论的关键问题。
7. 如果历史记忆和当前项目/证据冲突，以当前项目/证据为准，并把冲突写入 warnings。
8. 不得新增未提供的参考游戏、开发时长、团队规模、商业化方案、平台或玩法机制。
9. 如果必须做推断，只能写入 unknowns / warnings，不得混入 facts。
10. 历史记忆只作为风险、盲点和验证线索，不得直接沿用其中旧 verdict 或旧结论。

JSON schema:
{
  "facts": [{
    "dimension": "",
    "statement": "",
    "evidenceRefs": [""]
  }],
  "tensions": [{
    "title": "",
    "detail": ""
  }],
  "audiences": [{
    "name": "",
    "need": "",
    "risk": ""
  }],
  "constraints": [""],
  "unknowns": [{
    "topic": "",
    "whyUnknown": ""
  }],
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
