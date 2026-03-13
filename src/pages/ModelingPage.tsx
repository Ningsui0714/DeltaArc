import { BlindSpotGrid } from '../components/analysis/BlindSpotGrid';
import { PerspectiveGrid } from '../components/analysis/PerspectiveGrid';
import { ScoreBar } from '../components/ui/ScoreBar';
import type { HypothesisCard, PersonaCard } from '../types';
import type {
  SandboxBlindSpot,
  SandboxDecisionLens,
  SandboxPerspective,
  SandboxScoreSet,
} from '../../shared/sandbox';

type ModelingPageProps = {
  hypotheses: HypothesisCard[];
  personas: PersonaCard[];
  scores: SandboxScoreSet;
  perspectives: SandboxPerspective[];
  blindSpots: SandboxBlindSpot[];
  decisionLenses: SandboxDecisionLens[];
  onNavigateToStrategy: () => void;
};

export function ModelingPage({
  hypotheses,
  personas,
  scores,
  perspectives,
  blindSpots,
  decisionLenses,
  onNavigateToStrategy,
}: ModelingPageProps) {
  return (
    <section className="page-grid">
      <section className="panel model-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Model View</p>
            <h3>多视角建模</h3>
          </div>
          <button type="button" className="inline-button" onClick={onNavigateToStrategy}>
            进入策略与验证
          </button>
        </div>
        <div className="score-grid">
          <ScoreBar label="核心乐趣强度" value={scores.coreFun} />
          <ScoreBar label="上手理解负担" value={scores.learningCost} reverse />
          <ScoreBar label="差异化潜力" value={scores.novelty} />
          <ScoreBar label="接受风险" value={scores.acceptanceRisk} reverse />
          <ScoreBar label="原型验证成本" value={scores.prototypeCost} reverse />
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Perspectives</p>
            <h3>视角分歧</h3>
          </div>
        </div>
        <PerspectiveGrid perspectives={perspectives} />
      </section>

      <BlindSpotGrid blindSpots={blindSpots} decisionLenses={decisionLenses} />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Persona Matrix</p>
            <h3>玩家角色卡</h3>
          </div>
        </div>
        <div className="persona-grid">
          {personas.map((persona) => (
            <article key={persona.name} className="persona-card">
              <h4>{persona.name}</h4>
              <p>{persona.motive}</p>
              <dl>
                <div>
                  <dt>接受触发</dt>
                  <dd>{persona.accepts}</dd>
                </div>
                <div>
                  <dt>排斥触发</dt>
                  <dd>{persona.rejects}</dd>
                </div>
              </dl>
              <strong>{persona.verdict}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Key Assumptions</p>
            <h3>核心假设</h3>
          </div>
        </div>
        <div className="hypothesis-list">
          {hypotheses.map((hypothesis) => (
            <article key={hypothesis.title} className="hypothesis-item">
              <div className="hypothesis-header">
                <h4>{hypothesis.title}</h4>
                <span>{Math.round(hypothesis.confidence * 100)}%</span>
              </div>
              <p>{hypothesis.evidence}</p>
              <small>验证缺口：{hypothesis.gap}</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
