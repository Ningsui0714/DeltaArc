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
    /(付费|商业化|礼包|订阅|价格|变现|monet|payment|price|bundle|shop)/.test(text)
  ) {
    return 'monetization';
  }

  if (
    /(活动|赛季|运营|社区|回流|节日|event|season|live ops|community|campaign)/.test(text)
  ) {
    return 'live_ops';
  }

  if (
    /(系统|经济|数值|成长|养成|产出|资源|循环层|system|economy|resource|progression|meta)/.test(
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
    `让${variable.name || '这个改动'}更有存在感`;
  const baselineNextStep =
    baseline?.analysisSnapshot.nextStep || '先补一轮小范围原型验证';

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
        : unique([primaryConcern || '可能会引入额外理解成本']),
    dependencies:
      variable.dependencies.length > 0
        ? unique(variable.dependencies)
        : unique([baselineNextStep]),
    successSignals:
      variable.successSignals.length > 0
        ? unique(variable.successSignals)
        : unique([
            variable.intent
              ? `玩家能明确感知到：${variable.intent}`
              : '玩家能主动提到这个改动带来的新价值',
          ]),
    failureSignals:
      variable.failureSignals.length > 0
        ? unique(variable.failureSignals)
        : unique([
            primaryConcern || '玩家持续把注意力放在额外负担上',
          ]),
  };
}
