import type { SandboxScenarioVariant, SandboxSecondOrderEffect } from '../../../shared/sandbox';
import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';
import { getSandboxLabels } from '../../lib/sandboxLabels';

type ScenarioVariantGridProps = {
  scenarioVariants: SandboxScenarioVariant[];
  secondOrderEffects: SandboxSecondOrderEffect[];
};

export function ScenarioVariantGrid({ scenarioVariants, secondOrderEffects }: ScenarioVariantGridProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const { directionLabels, horizonLabels } = getSandboxLabels(language);

  return (
    <div className="dual-analysis-grid">
      <section className="panel inner-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Scenario Branches' : '场景分支'}</p>
            <h3>{isEnglish ? 'Scenario branches' : '场景分支'}</h3>
          </div>
        </div>
        <div className="stack-list">
          {scenarioVariants.map((scenario) => (
            <article key={scenario.name} className="stack-card">
              <div className="card-topline">
                <span className="tiny-chip">{scenario.name}</span>
                <span className="meta-chip">{scenario.recommendedMove}</span>
              </div>
              <p>{scenario.premise}</p>
              <p>{scenario.upside}</p>
              <p>{scenario.downside}</p>
              {scenario.watchSignals.length > 0 ? (
                <div className="chip-row">
                  {scenario.watchSignals.map((signal) => (
                    <span key={signal} className="meta-chip">
                      {signal}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel inner-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Second-Order Effects' : '二阶影响'}</p>
            <h3>{isEnglish ? 'Second-order effects' : '二阶影响'}</h3>
          </div>
        </div>
        <div className="stack-list">
          {secondOrderEffects.map((effect) => (
            <article key={`${effect.trigger}-${effect.outcome}`} className="stack-card">
              <div className="card-topline">
                <span className="tiny-chip">{horizonLabels[effect.horizon]}</span>
                <span className="meta-chip">{directionLabels[effect.direction]}</span>
              </div>
              <h4>{effect.trigger}</h4>
              <p>{effect.outcome}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
