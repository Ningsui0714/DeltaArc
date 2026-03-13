import type { SandboxAnalysisRequest } from '../../../../shared/sandbox';
import type { DeepseekMessage } from '../../deepseekApi';
import type { SpecialistBlueprint } from '../specialists';
import type { Dossier } from '../types';
import { compactJson } from './utils';

export function buildSpecialistMessages(
  blueprint: SpecialistBlueprint,
  request: SandboxAnalysisRequest,
  dossier: Dossier,
): DeepseekMessage[] {
  return [
    {
      role: 'system',
      content: `你是一个游戏产品预测风洞中的“${blueprint.label}分析员”。${blueprint.mission} 你必须提出用户没有显式提到、但会左右结论的额外维度。只输出 JSON。`,
    },
    {
      role: 'user',
      content: `请基于 dossier 输出该视角的结构化分析。\n\n项目：${compactJson(
        request.project,
      )}\n\nDossier：${compactJson(dossier)}\n\n要求：\n1. stance 只能是 bullish / mixed / bearish。\n2. confidence 和 acceptance 使用 0-100 整数。\n3. 必须基于游戏产品语境，优先讨论目标玩家、核心体验、局时、成长、社交、商业化、参考游戏和制作约束。\n4. validationTracks 必须可执行，不能是空泛建议。\n5. red_team 视角要最苛刻，不要做温和批评。\n6. 每类列表默认保留 2-3 条高信号内容，避免为了凑数量输出同义项。\n\nJSON schema:\n{\n  "perspective": {\n    "key": "${blueprint.key}",\n    "label": "${blueprint.label}",\n    "stance": "mixed",\n    "confidence": 0,\n    "verdict": "",\n    "opportunity": "",\n    "concern": "",\n    "leverage": "",\n    "evidenceRefs": [""]\n  },\n  "blindSpots": [{\n    "area": "",\n    "whyItMatters": "",\n    "missingEvidence": ""\n  }],\n  "secondOrderEffects": [{\n    "trigger": "",\n    "outcome": "",\n    "horizon": "near|mid|long",\n    "direction": "positive|mixed|negative"\n  }],\n  "scenarioVariants": [{\n    "name": "",\n    "premise": "",\n    "upside": "",\n    "downside": "",\n    "watchSignals": [""],\n    "recommendedMove": ""\n  }],\n  "decisionLenses": [{\n    "name": "",\n    "keyQuestion": "",\n    "answer": ""\n  }],\n  "validationTracks": [{\n    "name": "",\n    "priority": "P0|P1|P2",\n    "goal": "",\n    "method": "",\n    "successSignal": "",\n    "failureSignal": "",\n    "cost": "",\n    "timeframe": ""\n  }],\n  "contrarianMoves": [{\n    "title": "",\n    "thesis": "",\n    "whenToUse": ""\n  }],\n  "unknowns": [{\n    "topic": "",\n    "whyUnknown": "",\n    "resolveBy": ""\n  }],\n  "strategyIdeas": [{\n    "name": "",\n    "type": "",\n    "cost": "",\n    "timeToValue": "",\n    "acceptance": 0,\n    "risk": "",\n    "recommendation": ""\n  }],\n  "redTeam": {\n    "thesis": "",\n    "attackVectors": [""],\n    "failureModes": [""],\n    "mitigation": ""\n  },\n  "warnings": []\n}`,
    },
  ];
}
