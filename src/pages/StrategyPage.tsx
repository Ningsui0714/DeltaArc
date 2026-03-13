import { ScenarioVariantGrid } from '../components/analysis/ScenarioVariantGrid';
import { ValidationTrackList } from '../components/analysis/ValidationTrackList';
import { MetricRow } from '../components/ui/MetricRow';
import type { StrategyCard } from '../types';
import type {
  SandboxContrarianMove,
  SandboxScenarioVariant,
  SandboxSecondOrderEffect,
  SandboxUnknown,
  SandboxValidationTrack,
} from '../../shared/sandbox';

type StrategyPageProps = {
  strategies: StrategyCard[];
  scenarioVariants: SandboxScenarioVariant[];
  secondOrderEffects: SandboxSecondOrderEffect[];
  validationTracks: SandboxValidationTrack[];
  contrarianMoves: SandboxContrarianMove[];
  unknowns: SandboxUnknown[];
  onGenerateReport: () => void;
};

export function StrategyPage({
  strategies,
  scenarioVariants,
  secondOrderEffects,
  validationTracks,
  contrarianMoves,
  unknowns,
  onGenerateReport,
}: StrategyPageProps) {
  return (
    <section className="page-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Routes</p>
            <h3>策略对比</h3>
          </div>
          <button type="button" className="accent-button" onClick={onGenerateReport}>
            生成深度报告
          </button>
        </div>
        <div className="strategy-grid">
          {strategies.map((strategy, index) => (
            <article
              key={strategy.name}
              className={`strategy-card ${index === 1 ? 'strategy-card-featured' : ''}`}
            >
              <div className="card-topline">
                <span className="tiny-chip">{strategy.type}</span>
                <span className="tiny-chip">{strategy.timeToValue}</span>
              </div>
              <h4>{strategy.name}</h4>
              <p>{strategy.recommendation}</p>
              <div className="strategy-metrics">
                <MetricRow label="预期接受度" value={`${strategy.acceptance}%`} />
                <MetricRow label="实施成本" value={strategy.cost} />
                <MetricRow label="主要风险" value={strategy.risk} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <ScenarioVariantGrid
        scenarioVariants={scenarioVariants}
        secondOrderEffects={secondOrderEffects}
      />

      <ValidationTrackList
        validationTracks={validationTracks}
        contrarianMoves={contrarianMoves}
        unknowns={unknowns}
      />
    </section>
  );
}
