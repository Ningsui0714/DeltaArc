import type {
  DesignVariableV1,
  FrozenBaseline,
  VariableImpactScanJob,
  VariableImpactScanResult,
} from '../../../shared/variableSandbox';
import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';
import { ImpactScanHistorySection } from './ImpactScanHistorySection';
import { ImpactScanProgressSection } from './ImpactScanProgressSection';
import { ImpactScanResultContent } from './ImpactScanResultContent';

type ImpactScanPanelProps = {
  baseline: FrozenBaseline | null;
  variable: DesignVariableV1;
  job: VariableImpactScanJob | null;
  result: VariableImpactScanResult | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  history: VariableImpactScanJob[];
  historyStatus: 'idle' | 'loading' | 'error';
  historyError: string | null;
  onOpenHistoryScan: (scanId: string) => void;
};

export function ImpactScanPanel({
  baseline,
  variable,
  job,
  result,
  status,
  error,
  history,
  historyStatus,
  historyError,
  onOpenHistoryScan,
}: ImpactScanPanelProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const activeHistoryScanId = job?.id ?? null;

  if (!baseline) {
    return null;
  }

  if (
    !result &&
    !job &&
    status === 'idle' &&
    historyStatus !== 'loading' &&
    !historyError &&
    history.length === 0
  ) {
    return (
      <section className="panel empty-state-panel sandbox-result-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Scan Result' : '推演结果'}</p>
            <h3>{isEnglish ? 'The result will land here next' : '下一步的推演结果会落在这里'}</h3>
          </div>
        </div>
        <p>
          {isEnglish
            ? `Once ${variable.name || 'the variable'} is submitted, this area will show the direct effects, affected groups, guardrails, and validation steps against baseline ${baseline.id}.`
            : `当 ${variable.name || '变量'} 提交后，这里会基于基线 ${baseline.id} 展示直接影响、受影响人群、护栏和验证步骤。`}
        </p>
      </section>
    );
  }

  return (
    <section className="page-grid sandbox-result-panel">
      <ImpactScanProgressSection
        baseline={baseline}
        variable={variable}
        job={job}
        result={result}
        status={status}
        error={error}
        historyStatus={historyStatus}
        isEnglish={isEnglish}
      />

      <ImpactScanHistorySection
        activeHistoryScanId={activeHistoryScanId}
        history={history}
        historyStatus={historyStatus}
        historyError={historyError}
        isEnglish={isEnglish}
        language={language}
        onOpenHistoryScan={onOpenHistoryScan}
      />

      {result ? <ImpactScanResultContent isEnglish={isEnglish} result={result} /> : null}
    </section>
  );
}
