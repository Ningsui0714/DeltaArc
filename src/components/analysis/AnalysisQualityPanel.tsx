import type {
  SandboxAnalysisMeta,
  SandboxAnalysisMode,
  SandboxNecessaryCondition,
  SandboxSelectionSummary,
} from '../../../shared/sandbox';
import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';

type AnalysisQualityPanelProps = {
  meta: SandboxAnalysisMeta;
  mode: SandboxAnalysisMode;
  variant?: 'compact' | 'full';
  showEmpty?: boolean;
};

const zhInternalTermReplacements = [
  ['candidate_balanced', '平衡视角候选'],
  ['candidate_skeptic', '怀疑视角候选'],
  ['candidate_feasibility', '落地优先候选'],
  ['brief_balanced', '平衡视角摘要'],
  ['brief_skeptical', '怀疑视角摘要'],
  ['brief_execution_first', '执行优先摘要'],
  ['grounded pack', '基础证据包'],
  ['provisional_base', '临时基础稿'],
  ['report.actions', '报告行动项'],
  ['memorySignals', '记忆信号'],
  ['openQuestions', '待确认问题'],
  ['evidenceDigest', '证据摘要'],
  ['coreTensions', '核心张力'],
  ['systemFrame', '系统框架'],
  ['opportunityThesis', '机会判断'],
  ['systemVerdict', '系统结论'],
  ['primaryRisk', '核心风险'],
  ['validationTracks', '验证路径'],
  ['decisionLenses', '决策视角'],
  ['playerAcceptance', '玩家接受度'],
  ['supportRatio', '支持比例'],
  ['confidence', '置信度'],
  ['evidenceLevel', '证据等级'],
  ['learningCost', '学习成本'],
  ['acceptanceRisk', '接受风险'],
  ['prototypeCost', '原型成本'],
  ['coreFun', '核心乐趣'],
  ['novelty', '新鲜感'],
  ['personas', '玩家画像'],
  ['hypotheses', '假设'],
  ['unknowns', '未知项'],
  ['audiences', '目标受众'],
  ['tensions', '核心张力'],
  ['strategies', '策略'],
  ['warnings', '风险提示'],
  ['summary', '摘要'],
  ['report', '报告'],
  ['scores', '评分'],
  ['dossier', '共享简报'],
  ['gap', '缺口'],
  ['The validation gap is not clear yet.', '验证缺口暂时还不清楚。'],
  ['Negative triggers are still unclear.', '负向触发因素暂时还不清楚。'],
  ['The verdict is still provisional.', '当前判断仍然只是暂定结论。'],
] as const;

function replaceDisplayTerms(
  text: string,
  replacements: readonly (readonly [string, string])[],
) {
  return [...replacements]
    .sort((left, right) => right[0].length - left[0].length)
    .reduce((current, [from, to]) => current.split(from).join(to), text);
}

function localizeAnalysisQualityText(text: string, isEnglish: boolean): string {
  if (isEnglish || !text.trim()) {
    return text;
  }

  const withLocalizedCandidateIds: string = text.replace(
    /\b(?:candidate|brief)_[a-z_]+\b/g,
    (match): string => {
      const label: string = formatCandidateLabel(match, '', false);

      if (match.startsWith('brief_')) {
        return `${label}摘要`;
      }

      if (match.startsWith('candidate_')) {
        return `${label}候选`;
      }

      return label;
    },
  );

  return replaceDisplayTerms(withLocalizedCandidateIds, zhInternalTermReplacements);
}

function formatFlavorLabel(flavor: string, isEnglish: boolean) {
  if (flavor.includes('execution')) {
    return isEnglish ? 'Execution-first' : '执行优先';
  }

  if (flavor.includes('feasibility')) {
    return isEnglish ? 'Feasibility-first' : '落地优先';
  }

  if (flavor.includes('skeptic')) {
    return isEnglish ? 'Skeptical' : '怀疑视角';
  }

  if (flavor.includes('balanced')) {
    return isEnglish ? 'Balanced' : '平衡视角';
  }

  return flavor.replace(/_/g, ' ');
}

function formatCandidateLabel(
  candidateId: string,
  selectedFlavor: string,
  isEnglish: boolean,
): string {
  if (!candidateId) {
    return isEnglish ? 'Candidate' : '候选';
  }

  if (candidateId.includes('balanced')) {
    return formatFlavorLabel('balanced', isEnglish);
  }

  if (candidateId.includes('skeptic')) {
    return formatFlavorLabel('skeptic', isEnglish);
  }

  if (candidateId.includes('execution')) {
    return formatFlavorLabel('execution_first', isEnglish);
  }

  if (candidateId.includes('feasibility')) {
    return formatFlavorLabel('feasibility', isEnglish);
  }

  if (candidateId === selectedFlavor) {
    return formatFlavorLabel(selectedFlavor, isEnglish);
  }

  return isEnglish
    ? candidateId.replace(/_/g, ' ')
    : localizeAnalysisQualityText(candidateId.replace(/_/g, ' '), false);
}

function formatDecisionModeLabel(
  decisionMode: NonNullable<SandboxSelectionSummary['decisionMode']>,
  isEnglish: boolean,
) {
  if (decisionMode === 'fallback') {
    return isEnglish ? 'Local fallback' : '本地回退排序';
  }

  if (decisionMode === 'single') {
    return isEnglish ? 'Single survivor' : '单候选晋级';
  }

  return isEnglish ? 'Verifier picked' : '校验器挑选';
}

function formatConditionStatusLabel(
  status: SandboxNecessaryCondition['status'],
  isEnglish: boolean,
) {
  if (status === 'supported') {
    return isEnglish ? 'Supported' : '已支撑';
  }

  if (status === 'unsupported') {
    return isEnglish ? 'Blocked' : '被卡住';
  }

  return isEnglish ? 'Uncertain' : '待确认';
}

function getSelectionTitle(
  stage: SandboxSelectionSummary['stage'],
  isEnglish: boolean,
) {
  if (stage === 'dossier') {
    return isEnglish ? 'Shared brief verifier' : '共享简报校验器';
  }

  return isEnglish ? 'Final brief verifier' : '最终行动摘要校验器';
}

function getSelectionEyebrow(
  stage: SandboxSelectionSummary['stage'],
  isEnglish: boolean,
) {
  if (stage === 'dossier') {
    return isEnglish ? 'Dossier Gate' : '共享简报闸门';
  }

  return isEnglish ? 'Action Brief Gate' : '行动摘要闸门';
}

function getConditionTone(status: SandboxNecessaryCondition['status']) {
  if (status === 'supported') {
    return 'supported';
  }

  if (status === 'unsupported') {
    return 'unsupported';
  }

  return 'uncertain';
}

function getSelectedBadgeLabel(
  stage: SandboxSelectionSummary['stage'],
  isEnglish: boolean,
) {
  if (stage === 'dossier') {
    return isEnglish ? 'Selected brief' : '已入选简报';
  }

  return isEnglish ? 'Selected summary' : '已入选摘要';
}

function SelectionCard({
  summary,
  isEnglish,
}: {
  summary: SandboxSelectionSummary;
  isEnglish: boolean;
}) {
  return (
    <article className="analysis-quality-card">
      <div className="analysis-quality-card-topline">
        <div>
          <p className="eyebrow">{getSelectionEyebrow(summary.stage, isEnglish)}</p>
          <h4>{getSelectionTitle(summary.stage, isEnglish)}</h4>
        </div>
        <div className="chip-row">
          <span className="meta-chip">
            {isEnglish ? `${summary.candidateCount} candidates` : `${summary.candidateCount} 个候选`}
          </span>
          <span className={`analysis-quality-mode mode-${summary.decisionMode}`}>
            {formatDecisionModeLabel(summary.decisionMode, isEnglish)}
          </span>
        </div>
      </div>

      <div className="analysis-quality-pill-row">
        <span className="analysis-quality-flavor">
          {formatFlavorLabel(summary.selectedFlavor, isEnglish)}
        </span>
        <span className="tiny-chip">{getSelectedBadgeLabel(summary.stage, isEnglish)}</span>
      </div>

      <p className="analysis-quality-rationale">
        {localizeAnalysisQualityText(summary.rationale, isEnglish)}
      </p>

      {summary.rankings.length > 0 ? (
        <div className="analysis-quality-ranking-list">
          {summary.rankings.slice(0, 3).map((ranking, index) => (
            <article key={`${ranking.candidateId}-${index}`} className="analysis-quality-ranking-item">
              <div className="analysis-quality-ranking-topline">
                <strong>
                  {index + 1}.{' '}
                  {formatCandidateLabel(ranking.candidateId, summary.selectedFlavor, isEnglish)}
                </strong>
                <span>{ranking.overallScore}</span>
              </div>
              <div className="analysis-quality-ranking-bar" aria-hidden="true">
                <span style={{ width: `${ranking.overallScore}%` }} />
              </div>
              <p>{localizeAnalysisQualityText(ranking.strength, isEnglish)}</p>
              <small>
                {isEnglish ? 'Risk: ' : '风险：'}
                {localizeAnalysisQualityText(ranking.risk, isEnglish)}
              </small>
            </article>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function AnalysisQualityPanel({
  meta,
  mode,
  variant = 'full',
  showEmpty = false,
}: AnalysisQualityPanelProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const hasInsights = Boolean(
    meta.dossierSelection || meta.actionBriefSelection || meta.reverseCheck,
  );

  if (!hasInsights && !showEmpty) {
    return null;
  }

  const visibleConditions = meta.reverseCheck?.necessaryConditions.slice(
    0,
    variant === 'compact' ? 3 : 5,
  ) ?? [];
  const summaryCopy = hasInsights
    ? isEnglish
      ? 'The first-stage pipeline now exposes which candidate was chosen, why it won, and which necessary conditions still keep the final call fragile.'
      : '第一阶段现在会显式展示：选中了哪个候选、为什么赢，以及哪些必要条件仍然在卡住最终判断。'
    : mode === 'reasoning'
      ? isEnglish
        ? 'This visible result was generated before verifier traces were exposed in the UI. Run Deep Dive again to see candidate selection and reverse-check output.'
        : '这份可见结果生成于校验轨迹接入界面之前。重新跑一次深度推演，就能看到候选筛选和反证核验输出。'
      : isEnglish
        ? 'This visible result does not include verifier traces yet. Run a fresh analysis to expose the new first-stage gating details.'
        : '这份可见结果还没有校验轨迹。重新跑一次分析，就能看到新的第一阶段筛选细节。';

  return (
    <section
      className={`panel analysis-quality-panel ${
        variant === 'compact' ? 'is-compact' : ''
      } ${!hasInsights ? 'is-empty' : ''}`}
    >
      <div className="analysis-quality-topline">
        <div className="analysis-quality-heading">
          <p className="eyebrow">{isEnglish ? 'Verifier Lens' : '校验视角'}</p>
          <h3>
            {isEnglish
              ? 'Why this answer survived the first-stage filters'
              : '为什么这一版结论能通过第一阶段筛选'}
          </h3>
        </div>
        <div className="chip-row">
          <span className="meta-chip">
            {mode === 'reasoning'
              ? isEnglish
                ? 'Deep mode'
                : '深度推演'
              : isEnglish
                ? 'Quick mode'
                : '快速扫描'}
          </span>
          {meta.dossierSelection ? (
            <span className="meta-chip">
              {isEnglish ? 'Dossier gate on' : '共享简报校验已启用'}
            </span>
          ) : null}
          {meta.actionBriefSelection ? (
            <span className="meta-chip">
              {isEnglish ? 'Brief verifier on' : '摘要校验已启用'}
            </span>
          ) : null}
          {meta.reverseCheck ? (
            <span className={`analysis-quality-mode ${meta.reverseCheck.tightened ? 'mode-tightened' : 'mode-stable'}`}>
              {meta.reverseCheck.tightened
                ? isEnglish
                  ? 'Reverse check tightened'
                  : '反证后已收紧'
                : isEnglish
                  ? 'Reverse check passed'
                  : '反证已通过'}
            </span>
          ) : null}
        </div>
      </div>

      {hasInsights ? (
        <>
          <div className="analysis-quality-grid">
            {meta.dossierSelection ? (
              <SelectionCard summary={meta.dossierSelection} isEnglish={isEnglish} />
            ) : null}

            {meta.actionBriefSelection ? (
              <SelectionCard summary={meta.actionBriefSelection} isEnglish={isEnglish} />
            ) : null}

            {meta.reverseCheck ? (
              <article className="analysis-quality-card analysis-quality-card-reverse">
                <div className="analysis-quality-card-topline">
                  <div>
                    <p className="eyebrow">{isEnglish ? 'Reverse Check' : '反向核验'}</p>
                    <h4>{isEnglish ? 'Necessary conditions still on the board' : '仍在牌桌上的必要条件'}</h4>
                  </div>
                  <div className="chip-row">
                    <span className={`analysis-quality-mode ${meta.reverseCheck.tightened ? 'mode-tightened' : 'mode-stable'}`}>
                      {meta.reverseCheck.tightened
                        ? isEnglish
                          ? 'Tightened final call'
                          : '已收紧结论'
                        : isEnglish
                          ? 'No shrink needed'
                          : '暂未收缩'}
                    </span>
                  </div>
                </div>

                <p className="analysis-quality-rationale">
                  {localizeAnalysisQualityText(
                    meta.reverseCheck.fragilitySummary ||
                    (isEnglish
                      ? 'The reverse check did not return a fragility summary, so keep reviewing the conditions below manually.'
                      : '反向核验没有返回额外脆弱性摘要，请直接查看下面的必要条件。'),
                    isEnglish,
                  )}
                </p>

                {visibleConditions.length > 0 ? (
                  <div className="analysis-condition-grid">
                    {visibleConditions.map((condition) => (
                      <article
                        key={`${condition.condition}-${condition.status}`}
                        className={`analysis-condition-card status-${getConditionTone(condition.status)}`}
                      >
                        <div className="analysis-condition-topline">
                          <span className={`analysis-condition-status status-${getConditionTone(condition.status)}`}>
                            {formatConditionStatusLabel(condition.status, isEnglish)}
                          </span>
                          {condition.evidenceRefs.length > 0 ? (
                            <span className="tiny-chip">
                              {isEnglish
                                ? `${condition.evidenceRefs.length} refs`
                                : `${condition.evidenceRefs.length} 个引用`}
                            </span>
                          ) : null}
                        </div>
                        <strong>{localizeAnalysisQualityText(condition.condition, isEnglish)}</strong>
                        <p>{localizeAnalysisQualityText(condition.impact, isEnglish)}</p>
                        {condition.evidenceRefs.length > 0 ? (
                          <small>
                            {localizeAnalysisQualityText(
                              condition.evidenceRefs.join(' / '),
                              isEnglish,
                            )}
                          </small>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="analysis-quality-empty-note">
                    <strong>{isEnglish ? 'No structured conditions returned' : '没有返回结构化必要条件'}</strong>
                    <p>
                      {isEnglish
                        ? 'The reverse check ran, but it did not emit condition-level structure in this result.'
                        : '这次反向核验已经运行，但当前结果里没有输出条件级结构。'}
                    </p>
                  </div>
                )}
              </article>
            ) : null}
          </div>

          <div className="analysis-quality-context-note">
            <p>{summaryCopy}</p>
          </div>
        </>
      ) : (
        <div className="analysis-quality-context-note">
          <p>{summaryCopy}</p>
        </div>
      )}
    </section>
  );
}
