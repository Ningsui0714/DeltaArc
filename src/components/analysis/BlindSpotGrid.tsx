import type { SandboxBlindSpot, SandboxDecisionLens } from '../../../shared/sandbox';

type BlindSpotGridProps = {
  blindSpots: SandboxBlindSpot[];
  decisionLenses: SandboxDecisionLens[];
};

export function BlindSpotGrid({ blindSpots, decisionLenses }: BlindSpotGridProps) {
  return (
    <div className="dual-analysis-grid">
      <section className="panel inner-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Blind Spots</p>
            <h3>关键盲点</h3>
          </div>
        </div>
        <div className="stack-list">
          {blindSpots.map((blindSpot) => (
            <article key={blindSpot.area} className="stack-card">
              <h4>{blindSpot.area}</h4>
              <p>{blindSpot.whyItMatters}</p>
              <small>{blindSpot.missingEvidence}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel inner-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Decision Lenses</p>
            <h3>决策镜头</h3>
          </div>
        </div>
        <div className="stack-list">
          {decisionLenses.map((lens) => (
            <article key={lens.name} className="stack-card">
              <h4>{lens.name}</h4>
              <p>{lens.keyQuestion}</p>
              <small>{lens.answer}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
