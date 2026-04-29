import { parseVariableImpactScanResult } from '../../shared/schema';
import type {
  DesignVariableV1,
  FrozenBaseline,
  VariableImpactScanResult,
} from '../../shared/variableSandbox';
import type { SandboxAnalysisMode } from '../../shared/sandbox';
import { serverConfig } from '../config';
import { requestDeepseekJson, type DeepseekMessage } from './deepseekApi';
import {
  contradictionInstruction,
  groundedFactsInstruction,
  inferenceLabelingInstruction,
  missingEvidenceInstruction,
} from './orchestration/prompts/grounding';
import {
  embeddedDataInstruction,
  formatDataSection,
} from './orchestration/prompts/utils';
import { dedupeBy, isAbortError } from './orchestration/utils';

const variableImpactMaxTokens = 4500;

type VariableImpactScanResponse = {
  data: Record<string, unknown>;
  warnings: string[];
};

function createVariableImpactScanLabel(variable: DesignVariableV1) {
  return `variable-impact-scan:${variable.category}:${variable.id}`;
}

function formatEvidencePack(baseline: FrozenBaseline) {
  if (baseline.evidenceSnapshot.length === 0) {
    return '[]';
  }

  return JSON.stringify(
    baseline.evidenceSnapshot.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      source: item.source,
      trust: item.trust,
      summary: item.summary,
      createdAt: item.createdAt,
    })),
    null,
    2,
  );
}

export function buildVariableImpactScanMessages(params: {
  baseline: FrozenBaseline;
  variable: DesignVariableV1;
  mode: SandboxAnalysisMode;
}): DeepseekMessage[] {
  const { baseline, variable, mode } = params;

  return [
    {
      role: 'system',
      content:
        `你是一个内容策略变量实验器。你的任务不是重跑完整正式诊断，也不是基于空想补洞，而是严格基于一份已经冻结的正式 baseline，评估“注入这一个内容变量之后，原本的判断会怎么变化”。${groundedFactsInstruction}${inferenceLabelingInstruction}${contradictionInstruction}${missingEvidenceInstruction}${embeddedDataInstruction}你只能使用 frozen baseline、传播任务快照、证据快照和当前变量本身，不得擅自新增对标账号、内容机制、团队规模、平台、转化方案、用户反馈或执行条件。输出必须是一个严格合法 JSON 对象，不要输出 markdown，不要解释，不要前后缀文本。如果不确定，就降低 confidence，并把不确定项写进 assumptions 或 warnings。`,
    },
    {
      role: 'user',
      content: `请对下面这个变量执行一次${mode === 'reasoning' ? '深度' : '快速'}变量实验，并返回严格 JSON。

任务边界：
1. 这是“基于正式结果继续试一个变量”，不是重写整个传播任务分析。
2. baselineRead 必须忠于 frozen baseline，evidenceLevel 必须保持和 baseline 一致。
3. impactScan 重点回答：这个内容变量先改写了哪些位置、最先放大的收益是什么、最先放大的代价是什么。
4. affectedPersonas 只写最关键的 1-3 类受众，不要泛泛而谈。
5. guardrails 必须是进入快测或验证前就应该先压住的护栏。
6. validationPlan 必须贴合当前 productionConstraints，不能偷写成脱离约束的大工程。
7. assumptions 只写真正的不确定前提，并显式标注“推断：...”。
8. warnings 用来暴露证据不足、约束冲突、变量描述不完整或 baseline 自身的可靠性问题。
9. 如果 variable 的某些列表字段很短，也不要自行脑补大型体系，只能围绕当前输入做最小扩展。
10. 所有文案用中文，必须具体，不要写空泛套话。
11. confidence 是 0-100 的整数。
12. 必须返回严格合法 JSON，字段齐全，数组元素之间必须有逗号。

Frozen baseline：
${formatDataSection('BASELINE_PROJECT_SNAPSHOT', baseline.projectSnapshot, { pretty: true })}

${formatDataSection('BASELINE_EVIDENCE_SNAPSHOT', JSON.parse(formatEvidencePack(baseline)), {
  pretty: true,
})}

${formatDataSection('BASELINE_ANALYSIS_SNAPSHOT', baseline.analysisSnapshot, { pretty: true })}

${formatDataSection('VARIABLE', variable, { pretty: true })}

JSON schema:
{
  "summary": "",
  "baselineRead": {
    "summary": "",
    "evidenceLevel": "low|medium|high",
    "primaryRisk": "",
    "scores": {
      "coreFun": 0,
      "learningCost": 0,
      "novelty": 0,
      "acceptanceRisk": 0,
      "prototypeCost": 0
    }
  },
  "impactScan": [{
    "target": "",
    "directEffect": "",
    "upside": "",
    "downside": "",
    "confidence": 0
  }],
  "affectedPersonas": [{
    "personaName": "",
    "likelyReaction": "",
    "primaryTrigger": "",
    "riskLevel": "low|medium|high"
  }],
  "guardrails": [{
    "title": "",
    "reason": "",
    "priority": "P0|P1|P2"
  }],
  "validationPlan": [{
    "step": "",
    "goal": "",
    "successSignal": "",
    "failureSignal": ""
  }],
  "assumptions": [""],
  "warnings": [""],
  "confidence": 0,
  "evidenceLevel": "low|medium|high"
}`,
    },
  ];
}

async function requestVariableImpactScanResponse(params: {
  mode: SandboxAnalysisMode;
  variable: DesignVariableV1;
  messages: DeepseekMessage[];
}): Promise<VariableImpactScanResponse> {
  const { mode, variable, messages } = params;
  const label = createVariableImpactScanLabel(variable);
  const preferredModel =
    mode === 'reasoning' ? serverConfig.reasoningModel : serverConfig.balancedModel;
  const preferredTimeout =
    mode === 'reasoning' ? serverConfig.reasoningTimeoutMs : serverConfig.balancedTimeoutMs;

  try {
    const response = await requestDeepseekJson({
      label,
      model: preferredModel,
      temperature: mode === 'reasoning' ? 0.12 : 0.22,
      timeoutMs: preferredTimeout,
      maxTokens: variableImpactMaxTokens,
      messages,
    });

    return {
      data: response.data,
      warnings: response.warnings,
    };
  } catch (error) {
    const shouldFallbackToBalanced =
      mode === 'reasoning' &&
      preferredModel !== serverConfig.balancedModel &&
      isAbortError(error);

    if (!shouldFallbackToBalanced) {
      throw error;
    }

    const fallbackResponse = await requestDeepseekJson({
      label,
      model: serverConfig.balancedModel,
      temperature: 0.18,
      timeoutMs: serverConfig.balancedTimeoutMs,
      maxTokens: variableImpactMaxTokens,
      messages,
    });

    return {
      data: fallbackResponse.data,
      warnings: [
        `变量实验在 reasoning 模型超时后，已切换到 ${serverConfig.balancedModel} 继续生成。`,
        ...fallbackResponse.warnings,
      ],
    };
  }
}

export function normalizeVariableImpactScanResult(params: {
  input: unknown;
  baseline: FrozenBaseline;
  remoteWarnings?: string[];
}): VariableImpactScanResult {
  const { input, baseline, remoteWarnings = [] } = params;
  const parsed = parseVariableImpactScanResult(input);
  const evidenceLevelWarnings: string[] = [];
  const normalizedAssumptions = parsed.assumptions
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith('推断：') ? item : `推断：${item}`));

  if (parsed.evidenceLevel !== baseline.analysisSnapshot.evidenceLevel) {
    evidenceLevelWarnings.push('变量实验输出的 evidenceLevel 已被校正回 frozen baseline 的证据等级。');
  }

  if (parsed.baselineRead.evidenceLevel !== baseline.analysisSnapshot.evidenceLevel) {
    evidenceLevelWarnings.push('baselineRead.evidenceLevel 已被校正回 frozen baseline 的证据等级。');
  }

  return {
    ...parsed,
    baselineRead: {
      ...parsed.baselineRead,
      evidenceLevel: baseline.analysisSnapshot.evidenceLevel,
      scores: { ...parsed.baselineRead.scores },
    },
    impactScan: parsed.impactScan.slice(0, 3).map((item) => ({ ...item })),
    affectedPersonas: parsed.affectedPersonas.slice(0, 3).map((item) => ({ ...item })),
    guardrails: parsed.guardrails.slice(0, 3).map((item) => ({ ...item })),
    validationPlan: parsed.validationPlan.slice(0, 3).map((item) => ({ ...item })),
    assumptions: dedupeBy(normalizedAssumptions, (item) => item, 6),
    warnings: dedupeBy(
      [...parsed.warnings, ...remoteWarnings, ...evidenceLevelWarnings],
      (item) => item,
      12,
    ),
    evidenceLevel: baseline.analysisSnapshot.evidenceLevel,
  };
}

export async function runVariableImpactScan(params: {
  baseline: FrozenBaseline;
  variable: DesignVariableV1;
  mode: SandboxAnalysisMode;
}): Promise<VariableImpactScanResult> {
  const messages = buildVariableImpactScanMessages(params);
  const response = await requestVariableImpactScanResponse({
    mode: params.mode,
    variable: params.variable,
    messages,
  });

  return normalizeVariableImpactScanResult({
    input: response.data,
    baseline: params.baseline,
    remoteWarnings: response.warnings,
  });
}
