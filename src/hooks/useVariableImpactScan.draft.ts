import type {
  DesignVariableV1,
  FrozenBaseline,
} from '../../shared/variableSandbox';

export const listFields = [
  'injectionTargets',
  'expectedBenefits',
  'knownCosts',
  'dependencies',
  'successSignals',
  'failureSignals',
] as const;

const defaultTargetsByCategory: Record<DesignVariableV1['category'], string[]> = {
  gameplay: ['core_loop', 'session_pacing', 'player_cooperation'],
  system: ['resource_flow', 'progression_curve', 'failure_recovery'],
  live_ops: ['event_rhythm', 'return_triggers', 'community_coordination'],
  monetization: ['value_perception', 'conversion_moment', 'retention_tradeoff'],
};

export type VariableSandboxListField = (typeof listFields)[number];

export function createVariableId() {
  return `var_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyVariable(baselineId: string): DesignVariableV1 {
  return {
    id: createVariableId(),
    baselineId,
    name: '',
    category: 'gameplay',
    intent: '',
    changeStatement: '',
    injectionTargets: [],
    expectedBenefits: [],
    knownCosts: [],
    activationStage: 'mid',
    dependencies: [],
    successSignals: [],
    failureSignals: [],
  };
}

export function splitListInput(value: string) {
  return [
    ...new Set(
      value
        .split(/\r?\n|,|，|;|；/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function inferCategory(
  variable: DesignVariableV1,
  categoryIsManual: boolean,
): DesignVariableV1['category'] {
  if (categoryIsManual) {
    return variable.category;
  }

  const text = `${variable.name} ${variable.intent} ${variable.changeStatement}`.toLowerCase();

  if (
    /(付费|转化|领券|下单|购买|价格|变现|monet|payment|price|coupon|conversion|purchase|cta)/.test(text)
  ) {
    return 'monetization';
  }

  if (
    /(活动|节奏|运营|社区|评论区|返场|话题|campaign|community|comment|share|cadence|posting)/.test(text)
  ) {
    return 'live_ops';
  }

  if (
    /(分发|发布时间|评论机制|系列化|脚本|选题结构|system|distribution|publish|comment|series|format)/.test(
      text,
    )
  ) {
    return 'system';
  }

  return 'gameplay';
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function getPrimaryConcern(variable: DesignVariableV1, baseline: FrozenBaseline | null) {
  return variable.knownCosts[0] || baseline?.analysisSnapshot.primaryRisk || '';
}

export function buildResolvedVariable(
  variable: DesignVariableV1,
  baseline: FrozenBaseline | null,
  categoryIsManual: boolean,
): DesignVariableV1 {
  const category = inferCategory(variable, categoryIsManual);
  const primaryConcern = getPrimaryConcern(variable, baseline);
  const primaryBenefit =
    variable.expectedBenefits[0] ||
    variable.intent ||
    `让${variable.name || '这个变量'}更有存在感`;
  const baselineNextStep =
    baseline?.analysisSnapshot.nextStep || '先补一轮小范围内容验证';

  return {
    ...variable,
    category,
    baselineId: baseline?.id ?? variable.baselineId,
    injectionTargets:
      variable.injectionTargets.length > 0
        ? unique(variable.injectionTargets)
        : defaultTargetsByCategory[category],
    expectedBenefits:
      variable.expectedBenefits.length > 0
        ? unique(variable.expectedBenefits)
        : unique([primaryBenefit]),
    knownCosts:
      variable.knownCosts.length > 0
        ? unique(variable.knownCosts)
        : unique([primaryConcern || '可能会引入额外理解成本或执行负担']),
    dependencies:
      variable.dependencies.length > 0
        ? unique(variable.dependencies)
        : unique([baselineNextStep]),
    successSignals:
      variable.successSignals.length > 0
        ? unique(variable.successSignals)
        : unique([
            variable.intent
              ? `用户能明确感知到：${variable.intent}`
              : '用户会主动提到这个变量带来的新价值',
          ]),
    failureSignals:
      variable.failureSignals.length > 0
        ? unique(variable.failureSignals)
        : unique([
            primaryConcern || '用户持续把注意力放在额外负担上',
          ]),
  };
}
