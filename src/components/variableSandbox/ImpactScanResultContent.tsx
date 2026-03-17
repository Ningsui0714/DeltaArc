import type { VariableImpactScanResult } from '../../../shared/variableSandbox';
import { MetricCard } from '../ui/MetricCard';
import { GuardrailChecklist } from './GuardrailChecklist';
import {
  formatEvidenceLevel,
  formatRiskLevel,
  formatTargetLabel,
} from './impactScanViewModel';

type ImpactScanResultContentProps = {
  isEnglish: boolean;
  result: VariableImpactScanResult;
};

export function ImpactScanResultContent({
  isEnglish,
  result,
}: ImpactScanResultContentProps) {
  return (
    <>
      <section className="metrics-row">
        <MetricCard
          label={isEnglish ? 'Confidence' : '置信度'}
          value={`${result.confidence}%`}
          tone={result.confidence >= 70 ? 'good' : 'alert'}
        />
        <MetricCard
          label={isEnglish ? 'Evidence Level' : '证据等级'}
          value={formatEvidenceLevel(result.evidenceLevel, isEnglish)}
          tone={result.evidenceLevel === 'high' ? 'good' : 'info'}
        />
        <MetricCard
          label={isEnglish ? 'Impacted Targets' : '影响目标'}
          value={`${result.impactScan.length}`}
          tone="info"
        />
      </section>

      <section className="panel split-panel">
        <div>
          <p className="eyebrow">{isEnglish ? 'Summary' : '摘要'}</p>
          <h4>{isEnglish ? 'What changes first' : '首先变化的是什么'}</h4>
          <p>{result.summary}</p>
        </div>
        <div>
          <p className="eyebrow">{isEnglish ? 'Baseline Read' : '基线解读'}</p>
          <h4>{isEnglish ? 'What the frozen truth source still says' : '冻结真相源当前仍在表达什么'}</h4>
          <p>{result.baselineRead.summary}</p>
          <ul className="bullet-list">
            <li>
              {isEnglish
                ? `Primary risk: ${result.baselineRead.primaryRisk}`
                : `核心风险：${result.baselineRead.primaryRisk}`}
            </li>
            <li>
              {isEnglish
                ? `Evidence level: ${formatEvidenceLevel(result.baselineRead.evidenceLevel, true)}`
                : `证据等级：${formatEvidenceLevel(result.baselineRead.evidenceLevel, false)}`}
            </li>
          </ul>
        </div>
      </section>

      <section className="panel staged-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Direct Effects' : '直接影响'}</p>
            <h3>{isEnglish ? 'The first-order change map' : '第一层变化地图'}</h3>
          </div>
        </div>
        <div className="stack-list">
          {result.impactScan.map((item) => (
            <article key={`${item.target}-${item.directEffect}`} className="stack-card">
              <div className="card-topline">
                <span className="meta-chip">
                  {formatTargetLabel(item.target, isEnglish)}
                </span>
                <span className="tiny-chip">{item.confidence}%</span>
              </div>
              <h4>{item.directEffect}</h4>
              <p>{item.upside}</p>
              <small>{item.downside}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="dual-analysis-grid">
        <section className="panel inner-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isEnglish ? 'Affected Personas' : '受影响人群'}</p>
              <h4>{isEnglish ? 'Who reacts first' : '最先被影响的是谁'}</h4>
            </div>
          </div>
          <div className="stack-list">
            {result.affectedPersonas.map((persona) => (
              <article
                key={`${persona.personaName}-${persona.primaryTrigger}`}
                className="stack-card"
              >
                <div className="card-topline">
                  <span className="meta-chip">{persona.personaName}</span>
                  <span className="tiny-chip">
                    {formatRiskLevel(persona.riskLevel, isEnglish)}
                  </span>
                </div>
                <h4>{persona.likelyReaction}</h4>
                <p>{persona.primaryTrigger}</p>
              </article>
            ))}
          </div>
        </section>

        <GuardrailChecklist guardrails={result.guardrails} />
      </section>

      <section className="dual-analysis-grid">
        <section className="panel inner-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isEnglish ? 'Validation Plan' : '验证计划'}</p>
              <h4>{isEnglish ? 'Minimum next experiments' : '最小下一步实验'}</h4>
            </div>
          </div>
          <div className="stack-list">
            {result.validationPlan.map((step) => (
              <article key={`${step.step}-${step.goal}`} className="stack-card">
                <h4>{step.step}</h4>
                <p>{step.goal}</p>
                <ul className="bullet-list">
                  <li>
                    {isEnglish
                      ? `Success: ${step.successSignal}`
                      : `成功信号：${step.successSignal}`}
                  </li>
                  <li>
                    {isEnglish
                      ? `Failure: ${step.failureSignal}`
                      : `失败信号：${step.failureSignal}`}
                  </li>
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="panel inner-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isEnglish ? 'Assumptions' : '假设与提醒'}</p>
              <h4>{isEnglish ? 'Things that still need proving' : '还需要被证明的地方'}</h4>
            </div>
          </div>
          <ul className="bullet-list">
            {result.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
            {result.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </section>
    </>
  );
}
