import type { SandboxAnalysisRequest } from '../../../../shared/sandbox';
import type { DeepseekMessage } from '../../deepseekApi';
import { compactJson } from './utils';

export function buildDossierMessages(
  request: SandboxAnalysisRequest,
  memoryContext: string,
): DeepseekMessage[] {
  return [
    {
      role: 'system',
      content:
        '你是一个服务于游戏产品预测风洞的“证据蒸馏器”。你先抽取结构，再形成判断；你必须主动补足用户没有提出但会影响成败的维度。请只输出 JSON，不要输出解释文字。',
    },
    {
      role: 'user',
      content: `请基于以下项目快照、证据和历史记忆，输出一个用于后续多视角推演的游戏产品 dossier。\n\n项目：${compactJson(
        request.project,
      )}\n\n证据：${compactJson(request.evidenceItems)}\n\n历史记忆：\n${memoryContext}\n\n输出要求：\n1. 用中文。\n2. 不要直接只给结论，先抽出 tensions / gaps / signals。\n3. 必须覆盖核心体验承诺、目标玩家分层、局时节奏、成长驱动、社交驱动、商业化、参考游戏、制作约束这些维度。\n4. 要覆盖玩法、玩家心理、留存增长、市场、制作落地这些维度。\n5. confidence / supportRatio / playerAcceptance / scores 全部使用 0-100 整数。\n6. hypothesis 的 confidence 使用 0-100 整数。\n7. personas / hypotheses / evidenceDigest / memorySignals 默认各保留 2-4 条，只保留最高信号内容。\n8. coreTensions / openQuestions 默认各保留 3-5 条，避免堆砌同义项。\n\nJSON schema:\n{\n  "systemFrame": "",\n  "opportunityThesis": "",\n  "evidenceLevel": "low|medium|high",\n  "playerAcceptance": 0,\n  "confidence": 0,\n  "supportRatio": 0,\n  "scores": {\n    "coreFun": 0,\n    "learningCost": 0,\n    "novelty": 0,\n    "acceptanceRisk": 0,\n    "prototypeCost": 0\n  },\n  "personas": [{\n    "name": "",\n    "motive": "",\n    "accepts": "",\n    "rejects": "",\n    "verdict": ""\n  }],\n  "hypotheses": [{\n    "title": "",\n    "evidence": "",\n    "confidence": 0,\n    "gap": ""\n  }],\n  "evidenceDigest": [{\n    "title": "",\n    "signal": "",\n    "implication": ""\n  }],\n  "coreTensions": ["", ""],\n  "openQuestions": ["", ""],\n  "memorySignals": [{\n    "title": "",\n    "summary": "",\n    "signalStrength": "fresh|recurring|warning"\n  }],\n  "warnings": []\n}`,
    },
  ];
}
