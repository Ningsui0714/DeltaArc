import type { SandboxAnalysisRequest } from '../../../../shared/sandbox';
import type { DeepseekMessage } from '../../deepseekApi';
import type { Dossier, SpecialistOutput } from '../types';

export function buildSynthesisMessages(
  request: SandboxAnalysisRequest,
  dossier: Dossier,
  specialistOutputs: SpecialistOutput[],
  pipeline: string[],
): DeepseekMessage[] {
  return [
    {
      role: 'system',
      content:
        '你是一个游戏产品预测风洞中的“仲裁综合器”。不要简单平均各视角，也不要只重复已有结论；你要主动指出冲突、做取舍、保留分歧，并输出最终结构化结果。只输出 JSON。',
    },
    {
      role: 'user',
      content: `请整合以下 dossier 与多个 specialist 的输出，生成一份多维而可执行的游戏产品推演结论。\n\n项目：${JSON.stringify(
        request.project,
        null,
        2,
      )}\n\nDossier：${JSON.stringify(
        dossier,
        null,
        2,
      )}\n\nSpecialists：${JSON.stringify(
        specialistOutputs,
        null,
        2,
      )}\n\n要求：\n1. 结果必须比各单视角更深，不能只是拼接。\n2. 必须优先站在游戏产品语境里综合：目标玩家、核心体验、局时节奏、成长驱动、市场锚点、制作约束。\n3. 必须主动输出用户没有明确要求但重要的内容，例如二阶影响、逆向动作、未知项、决策镜头。\n4. strategies 至少 3 条，且要有明显区分。\n5. report.actions 至少 4 条，且都可在两周内推进。\n6. pipeline 保留当前阶段列表。\n7. model 写成多模型组合摘要，例如 multi-stage: deepseek-reasoner + deepseek-chat。\n\nJSON schema:\n{\n  "generatedAt": "",\n  "model": "",\n  "pipeline": ${JSON.stringify(pipeline)},\n  "summary": "",\n  "systemVerdict": "",\n  "evidenceLevel": "low|medium|high",\n  "primaryRisk": "",\n  "nextStep": "",\n  "playerAcceptance": 0,\n  "confidence": 0,\n  "supportRatio": 0,\n  "scores": {\n    "coreFun": 0,\n    "learningCost": 0,\n    "novelty": 0,\n    "acceptanceRisk": 0,\n    "prototypeCost": 0\n  },\n  "personas": [{\n    "name": "",\n    "motive": "",\n    "accepts": "",\n    "rejects": "",\n    "verdict": ""\n  }],\n  "hypotheses": [{\n    "title": "",\n    "evidence": "",\n    "confidence": 0,\n    "gap": ""\n  }],\n  "strategies": [{\n    "name": "",\n    "type": "",\n    "cost": "",\n    "timeToValue": "",\n    "acceptance": 0,\n    "risk": "",\n    "recommendation": ""\n  }],\n  "perspectives": [{\n    "key": "systems|psychology|economy|market|production|red_team",\n    "label": "",\n    "stance": "bullish|mixed|bearish",\n    "confidence": 0,\n    "verdict": "",\n    "opportunity": "",\n    "concern": "",\n    "leverage": "",\n    "evidenceRefs": [""]\n  }],\n  "blindSpots": [{\n    "area": "",\n    "whyItMatters": "",\n    "missingEvidence": ""\n  }],\n  "secondOrderEffects": [{\n    "trigger": "",\n    "outcome": "",\n    "horizon": "near|mid|long",\n    "direction": "positive|mixed|negative"\n  }],\n  "scenarioVariants": [{\n    "name": "",\n    "premise": "",\n    "upside": "",\n    "downside": "",\n    "watchSignals": [""],\n    "recommendedMove": ""\n  }],\n  "decisionLenses": [{\n    "name": "",\n    "keyQuestion": "",\n    "answer": ""\n  }],\n  "validationTracks": [{\n    "name": "",\n    "priority": "P0|P1|P2",\n    "goal": "",\n    "method": "",\n    "successSignal": "",\n    "failureSignal": "",\n    "cost": "",\n    "timeframe": ""\n  }],\n  "contrarianMoves": [{\n    "title": "",\n    "thesis": "",\n    "whenToUse": ""\n  }],\n  "unknowns": [{\n    "topic": "",\n    "whyUnknown": "",\n    "resolveBy": ""\n  }],\n  "redTeam": {\n    "thesis": "",\n    "attackVectors": [""],\n    "failureModes": [""],\n    "mitigation": ""\n  },\n  "memorySignals": [{\n    "title": "",\n    "summary": "",\n    "signalStrength": "fresh|recurring|warning"\n  }],\n  "report": {\n    "headline": "",\n    "summary": "",\n    "conclusion": "",\n    "whyNow": "",\n    "risk": "",\n    "actions": ["", "", "", ""]\n  },\n  "warnings": []\n}`,
    },
  ];
}
