import type { SandboxAnalysisRequest } from '../../../../shared/sandbox';
import { withVisibleAnalysisWarnings } from '../../../../shared/analysisWarnings';
import type { DeepseekMessage } from '../../deepseekApi';
import type { SpecialistBlueprint } from '../specialists';
import type { Dossier } from '../types';
import {
  contradictionInstruction,
  groundedFactsInstruction,
  inferenceLabelingInstruction,
  missingEvidenceInstruction,
} from './grounding';
import { embeddedDataInstruction, formatDataSection } from './utils';

export function buildSpecialistMessages(
  blueprint: SpecialistBlueprint,
  request: SandboxAnalysisRequest,
  dossier: Dossier,
): DeepseekMessage[] {
  const visibleDossier = withVisibleAnalysisWarnings(dossier);

  return [
    {
      role: 'system',
      content: `你是一个游戏产品预测风洞中的“${blueprint.label}分析员”。${blueprint.mission} 你必须提出用户没有显式提到、但会左右结论的额外维度。${groundedFactsInstruction}${inferenceLabelingInstruction}${contradictionInstruction}${missingEvidenceInstruction}${embeddedDataInstruction}只输出 JSON。`,
    },
    {
      role: 'user',
      content: `请基于 dossier 输出该视角的结构化分析。

${formatDataSection('PROJECT', request.project)}

${formatDataSection('DOSSIER', visibleDossier)}

要求：
1. stance 只能是 bullish / mixed / bearish。
2. confidence 和 acceptance 使用 0-100 整数。
3. 必须基于游戏产品语境，优先讨论目标玩家、核心体验、局时、成长、社交、商业化、参考游戏和制作约束。
4. validationTracks 必须可执行，不能是空泛建议。
5. red_team 视角要最苛刻，不要做温和批评。
6. 每类列表默认保留 2-3 条高信号内容，避免为了凑数量输出同义项。
7. 只允许引用项目和 dossier 中明确出现的事实；若 dossier 与原始项目冲突，以原始项目为准，并在 warnings 里指出。
8. evidenceRefs 只能写原始项目、证据或 dossier 里确实出现过的事实，不得伪造来源。
9. 不得新增未提供的参考游戏、开发时长、团队规模、商业化方案、平台或玩法机制。
10. 如果做推断，必须显式写成“推断：...”或放到 unknowns / blindSpots / warnings，不得写成既成事实。

JSON schema:
{
  "perspective": {
    "key": "${blueprint.key}",
    "label": "${blueprint.label}",
    "stance": "mixed",
    "confidence": 0,
    "verdict": "",
    "opportunity": "",
    "concern": "",
    "leverage": "",
    "evidenceRefs": [""]
  },
  "blindSpots": [{
    "area": "",
    "whyItMatters": "",
    "missingEvidence": ""
  }],
  "secondOrderEffects": [{
    "trigger": "",
    "outcome": "",
    "horizon": "near|mid|long",
    "direction": "positive|mixed|negative"
  }],
  "scenarioVariants": [{
    "name": "",
    "premise": "",
    "upside": "",
    "downside": "",
    "watchSignals": [""],
    "recommendedMove": ""
  }],
  "decisionLenses": [{
    "name": "",
    "keyQuestion": "",
    "answer": ""
  }],
  "validationTracks": [{
    "name": "",
    "priority": "P0|P1|P2",
    "goal": "",
    "method": "",
    "successSignal": "",
    "failureSignal": "",
    "cost": "",
    "timeframe": ""
  }],
  "contrarianMoves": [{
    "title": "",
    "thesis": "",
    "whenToUse": ""
  }],
  "unknowns": [{
    "topic": "",
    "whyUnknown": "",
    "resolveBy": ""
  }],
  "strategyIdeas": [{
    "name": "",
    "type": "",
    "cost": "",
    "timeToValue": "",
    "acceptance": 0,
    "risk": "",
    "recommendation": ""
  }],
  "redTeam": {
    "thesis": "",
    "attackVectors": [""],
    "failureModes": [""],
    "mitigation": ""
  },
  "warnings": []
}`,
    },
  ];
}
