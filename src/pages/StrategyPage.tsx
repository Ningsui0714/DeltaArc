import { useState } from 'react';
import { FutureTimelinePanel } from '../components/analysis/FutureTimelinePanel';
import { ScenarioVariantGrid } from '../components/analysis/ScenarioVariantGrid';
import { ValidationTrackList } from '../components/analysis/ValidationTrackList';
import { PhaseTabs } from '../components/ui/PhaseTabs';
import { MetricRow } from '../components/ui/MetricRow';
import { isEnglishUi, useUiLanguage } from '../hooks/useUiLanguage';
import type { StrategyCard } from '../types';
import type {
  SandboxCommunityRhythm,
  SandboxContrarianMove,
  SandboxFutureTimelineItem,
  SandboxScenarioVariant,
  SandboxSecondOrderEffect,
  SandboxTrajectorySignal,
  SandboxUnknown,
  SandboxValidationTrack,
} from '../../shared/sandbox';

type StrategyPageProps = {
  strategies: StrategyCard[];
  scenarioVariants: SandboxScenarioVariant[];
  secondOrderEffects: SandboxSecondOrderEffect[];
  futureTimeline: SandboxFutureTimelineItem[];
  communityRhythms: SandboxCommunityRhythm[];
  trajectorySignals: SandboxTrajectorySignal[];
  validationTracks: SandboxValidationTrack[];
  contrarianMoves: SandboxContrarianMove[];
  unknowns: SandboxUnknown[];
  onGenerateReport: () => void;
};

function getTabs(isEnglish: boolean) {
  return [
    { id: 'routes', label: isEnglish ? 'Routes' : '路线', hint: isEnglish ? 'Start with the main route' : '先看推哪条' },
    { id: 'timeline', label: isEnglish ? 'Timeline' : '时间线', hint: isEnglish ? 'Then review the next beats' : '再看未来三拍' },
    { id: 'branches', label: isEnglish ? 'Branches' : '分支', hint: isEnglish ? 'Inspect alternate paths' : '查看可能岔路' },
    { id: 'validation', label: isEnglish ? 'Validation' : '验证', hint: isEnglish ? 'Finish with disproof plans' : '最后看怎么证伪' },
  ] as const;
}

export function StrategyPage({
  strategies,
  scenarioVariants,
  secondOrderEffects,
  futureTimeline,
  communityRhythms,
  trajectorySignals,
  validationTracks,
  contrarianMoves,
  unknowns,
  onGenerateReport,
}: StrategyPageProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const tabs = getTabs(isEnglish);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('routes');

  return (
    <section className="page-grid">
      <section className="panel staged-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Future Forecast' : '未来推演'}</p>
            <h3>{isEnglish ? 'Review future evolution stage by stage' : '逐阶段查看未来演化'}</h3>
          </div>
          <button type="button" className="accent-button" onClick={onGenerateReport}>
            {isEnglish ? 'Generate Report' : '生成预测报告'}
          </button>
        </div>

        <PhaseTabs tabs={[...tabs]} activeTab={activeTab} onChange={(next) => setActiveTab(next as typeof activeTab)} />

        {activeTab === 'routes' ? (
          <section className="stage-panel-body">
            <div className="strategy-grid">
              {strategies.map((strategy, index) => (
                <article
                  key={strategy.name}
                  className={`strategy-card ${index === 0 ? 'strategy-card-featured' : ''}`}
                >
                  <div className="card-topline">
                    <span className="tiny-chip">{strategy.type}</span>
                    <span className="tiny-chip">{strategy.timeToValue}</span>
                  </div>
                  <h4>{strategy.name}</h4>
                  <p>{strategy.recommendation}</p>
                  <div className="strategy-metrics">
                    <MetricRow label={isEnglish ? 'Expected Acceptance' : '预期接受度'} value={`${strategy.acceptance}%`} />
                    <MetricRow label={isEnglish ? 'Execution Cost' : '实施成本'} value={strategy.cost} />
                    <MetricRow label={isEnglish ? 'Primary Risk' : '主要风险'} value={strategy.risk} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'timeline' ? (
          <section className="stage-panel-body">
            <FutureTimelinePanel
              futureTimeline={futureTimeline}
              communityRhythms={communityRhythms}
              trajectorySignals={trajectorySignals}
            />
          </section>
        ) : null}

        {activeTab === 'branches' ? (
          <section className="stage-panel-body">
            <ScenarioVariantGrid
              scenarioVariants={scenarioVariants}
              secondOrderEffects={secondOrderEffects}
            />
          </section>
        ) : null}

        {activeTab === 'validation' ? (
          <section className="stage-panel-body">
            <ValidationTrackList
              validationTracks={validationTracks}
              contrarianMoves={contrarianMoves}
              unknowns={unknowns}
            />
          </section>
        ) : null}
      </section>
    </section>
  );
}
