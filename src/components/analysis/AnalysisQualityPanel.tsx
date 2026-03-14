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

function formatCandidateLabel(candidateId: string, selectedFlavor: string, isEnglish: boolean) {
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

  return candidateId.replace(/_/g, ' ');
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
        <span className="tiny-chip">{summary.selectedCandidateId}</span>
      </div>

      <p className="analysis-quality-rationale">{summary.rationale}</p>

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
              <p>{ranking.strength}</p>
              <small>
                {isEnglish ? 'Risk: ' : '风险：'}
                {ranking.risk}
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

  return (
    <section
      className={`panel analysis-quality-panel ${
        variant === 'compact' ? 'is-compact' : ''
      } ${!hasInsights ? 'is-empty' : ''}`}
    >
      <div className="analysis-quality-topline">
        <div>
          <p className="eyebrow">{isEnglish ? 'Verifier Lens' : '校验视角'}</p>
          <h3>
            {isEnglish
              ? 'Why this answer survived the first-stage filters'
              : '为什么这一版结论能通过第一阶段筛选'}
          </h3>
          <p className="panel-copy">
            {hasInsights
              ? isEnglish
                ? 'The first-stage pipeline now exposes which candidate was chosen, why it won, and which necessary conditions still keep the final call fragile.'
                : '第一阶段现在会显式展示：选中了哪个候选、为什么赢，以及哪些必要条件仍然在卡住最终判断。'
              : mode === 'reasoning'
                ? isEnglish
                  ? 'This visible result was generated before verifier traces were exposed in the UI. Run Deep Dive again to see candidate selection and reverse-check output.'
                  : '这份可见结果生成于校验轨迹接入界面之前。重新跑一次深度推演，就能看到候选筛选和反证核验输出。'
                : isEnglish
                  ? 'This visible result does not include verifier traces yet. Run a fresh analysis to expose the new first-stage gating details.'
                  : '这份可见结果还没有校验轨迹。重新跑一次分析，就能看到新的第一阶段筛选细节。'}
          </p>
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
                {meta.reverseCheck.fragilitySummary ||
                  (isEnglish
                    ? 'The reverse check did not return a fragility summary, so keep reviewing the conditions below manually.'
                    : '反向核验没有返回额外脆弱性摘要，请直接查看下面的必要条件。')}
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
                      <strong>{condition.condition}</strong>
                      <p>{condition.impact}</p>
                      {condition.evidenceRefs.length > 0 ? (
                        <small>{condition.evidenceRefs.join(' / ')}</small>
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
      ) : null}
    </section>
  );
}
