import type { VariableImpactScanResult } from '../../../shared/variableSandbox';
import {
  isEnglishUi,
  useUiLanguage,
} from '../../hooks/useUiLanguage';

type GuardrailChecklistProps = {
  guardrails: VariableImpactScanResult['guardrails'];
};

export function GuardrailChecklist({ guardrails }: GuardrailChecklistProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);

  return (
    <section className="panel inner-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{isEnglish ? 'Guardrails' : '护栏'}</p>
          <h4>{isEnglish ? 'Minimum guardrails before implementation' : '进入实现前的最小护栏'}</h4>
        </div>
      </div>

      <div className="stack-list">
        {guardrails.map((guardrail) => (
          <article key={`${guardrail.priority}-${guardrail.title}`} className="stack-card">
            <div className="card-topline">
              <span className="tiny-chip">{guardrail.priority}</span>
            </div>
            <h4>{guardrail.title}</h4>
            <p>{guardrail.reason}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
