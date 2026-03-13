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
        '你是一个预测型综合器。你的任务不是复述当前分析，而是基于项目、证据和多视角输出，模拟未来会如何发展：刚发布会有什么反响，几天后会如何分化，社区节奏会如何形成，什么信号会让走势翻转。只输出一个合法 JSON 对象，不要输出 markdown 代码块，不要输出解释文本。如果某个字段不确定，也要保留字段并用空数组、空字符串或保守值填充，绝不能输出半截 JSON。',
    },
    {
      role: 'user',
      content: `请整合以下 dossier 与 specialists，输出一份“未来演化预测”结果。
项目：
${JSON.stringify(request.project, null, 2)}

Dossier：
${JSON.stringify(dossier, null, 2)}

Specialists：
${JSON.stringify(specialistOutputs, null, 2)}

要求：
1. 用中文输出。
2. 不要只分析当前内容，要明确写出未来时间线。
3. futureTimeline 至少 3 条，覆盖首波反应、几天后的分化、2-3 周后的节奏定型。
4. communityRhythms 至少 3 条，体现社区会如何讨论、复盘、沉淀或冷却。
5. trajectorySignals 至少 3 条，写清楚什么信号会让走势向上、向下或转入拉扯。
6. strategies 至少 3 条，而且要明显不同。
7. report.actions 至少 4 条，而且都应在两周内推进。
8. pipeline 保留当前阶段列表。
9. model 写成多模型组合摘要，例如 multi-stage: deepseek-reasoner + deepseek-chat。
10. 必须返回严格合法 JSON。每个数组元素之间必须有逗号；不要缺字段；不要附加注释。
11. 如果输出内容过长，优先缩短字符串，不要省略 JSON 结构。

JSON schema:
{
  "generatedAt": "",
  "model": "",
  "pipeline": ${JSON.stringify(pipeline)},
  "summary": "",
  "systemVerdict": "",
  "evidenceLevel": "low|medium|high",
  "primaryRisk": "",
  "nextStep": "",
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
  "strategies": [{
    "name": "",
    "type": "",
    "cost": "",
    "timeToValue": "",
    "acceptance": 0,
    "risk": "",
    "recommendation": ""
  }],
  "perspectives": [{
    "key": "systems|psychology|economy|market|production|red_team",
    "label": "",
    "stance": "bullish|mixed|bearish",
    "confidence": 0,
    "verdict": "",
    "opportunity": "",
    "concern": "",
    "leverage": "",
    "evidenceRefs": [""]
  }],
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
  "redTeam": {
    "thesis": "",
    "attackVectors": [""],
    "failureModes": [""],
    "mitigation": ""
  },
  "memorySignals": [{
    "title": "",
    "summary": "",
    "signalStrength": "fresh|recurring|warning"
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
