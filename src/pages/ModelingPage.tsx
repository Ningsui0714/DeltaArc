import { useState } from 'react';
import { BlindSpotGrid } from '../components/analysis/BlindSpotGrid';
import { PerspectiveGrid } from '../components/analysis/PerspectiveGrid';
import { PhaseTabs } from '../components/ui/PhaseTabs';
import { ScoreBar } from '../components/ui/ScoreBar';
import { isEnglishUi, useUiLanguage } from '../hooks/useUiLanguage';
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

function getTabs(isEnglish: boolean) {
  return [
    { id: 'scores', label: isEnglish ? 'Current Diagnosis' : '当前诊断', hint: isEnglish ? 'Start with the overall tilt' : '先看整体倾向' },
    { id: 'perspectives', label: isEnglish ? 'Perspectives' : '多视角', hint: isEnglish ? 'Then compare each lens' : '再看各维度结论' },
    { id: 'blindspots', label: isEnglish ? 'Blind Spots' : '盲点', hint: isEnglish ? 'Then inspect the gaps' : '接着看缺口' },
    { id: 'personas', label: isEnglish ? 'Audiences' : '受众', hint: isEnglish ? 'See who reacts first' : '再看谁最先有反应' },
    { id: 'hypotheses', label: isEnglish ? 'Hypotheses' : '假设', hint: isEnglish ? 'And what is still unproven' : '以及还没证实什么' },
  ] as const;
}

export function ModelingPage({
  hypotheses,
  personas,
  scores,
  perspectives,
  blindSpots,
  decisionLenses,
  onNavigateToStrategy,
}: ModelingPageProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const tabs = getTabs(isEnglish);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('scores');

  return (
    <section className="page-grid">
      <section className="panel staged-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Diagnosis View' : '诊断视图'}</p>
            <h3>{isEnglish ? 'Review the current strategy diagnosis stage by stage' : '逐阶段查看当前策略诊断'}</h3>
          </div>
          <button type="button" className="inline-button" onClick={onNavigateToStrategy}>
            {isEnglish ? 'Open Spread Outlook' : '进入扩散演化'}
          </button>
        </div>

        <PhaseTabs tabs={[...tabs]} activeTab={activeTab} onChange={(next) => setActiveTab(next as typeof activeTab)} />

        {activeTab === 'scores' ? (
          <section className="stage-panel-body">
            <div className="score-grid">
              <ScoreBar label={isEnglish ? 'Content Appeal' : '内容吸引力'} value={scores.coreFun} />
              <ScoreBar label={isEnglish ? 'Understanding Burden' : '理解门槛'} value={scores.learningCost} reverse />
              <ScoreBar label={isEnglish ? 'Differentiation Strength' : '差异化强度'} value={scores.novelty} />
              <ScoreBar label={isEnglish ? 'Acceptance Risk' : '接受风险'} value={scores.acceptanceRisk} reverse />
              <ScoreBar label={isEnglish ? 'Execution Cost' : '执行成本'} value={scores.prototypeCost} reverse />
            </div>
          </section>
        ) : null}

        {activeTab === 'perspectives' ? (
          <section className="stage-panel-body">
            <PerspectiveGrid perspectives={perspectives} />
          </section>
        ) : null}

        {activeTab === 'blindspots' ? (
          <section className="stage-panel-body">
            <BlindSpotGrid blindSpots={blindSpots} decisionLenses={decisionLenses} />
          </section>
        ) : null}

        {activeTab === 'personas' ? (
          <section className="stage-panel-body">
            <div className="persona-grid">
              {personas.map((persona) => (
                <article key={persona.name} className="persona-card">
                  <h4>{persona.name}</h4>
                  <p>{persona.motive}</p>
                  <dl>
                    <div>
                      <dt>{isEnglish ? 'Positive Trigger' : '正向触发'}</dt>
                      <dd>{persona.accepts}</dd>
                    </div>
                    <div>
                      <dt>{isEnglish ? 'Drop-off Trigger' : '流失触发'}</dt>
                      <dd>{persona.rejects}</dd>
                    </div>
                  </dl>
                  <strong>{persona.verdict}</strong>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'hypotheses' ? (
          <section className="stage-panel-body">
            <div className="hypothesis-list">
              {hypotheses.map((hypothesis) => (
                <article key={hypothesis.title} className="hypothesis-item">
                  <div className="hypothesis-header">
                    <h4>{hypothesis.title}</h4>
                    <span>{Math.round(hypothesis.confidence * 100)}%</span>
                  </div>
                  <p>{hypothesis.evidence}</p>
                  <small>{isEnglish ? `Validation gap: ${hypothesis.gap}` : `验证缺口：${hypothesis.gap}`}</small>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </section>
  );
}
