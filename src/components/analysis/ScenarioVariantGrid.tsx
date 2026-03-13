import type { SandboxScenarioVariant, SandboxSecondOrderEffect } from '../../../shared/sandbox';
import { directionLabels, horizonLabels } from '../../lib/sandboxLabels';

type ScenarioVariantGridProps = {
  scenarioVariants: SandboxScenarioVariant[];
  secondOrderEffects: SandboxSecondOrderEffect[];
};

export function ScenarioVariantGrid({ scenarioVariants, secondOrderEffects }: ScenarioVariantGridProps) {
  return (
    <div className="dual-analysis-grid">
      <section className="panel inner-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Scenario Branches</p>
            <h3>场景分支</h3>
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
            <p className="eyebrow">Second-Order Effects</p>
            <h3>二阶影响</h3>
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
