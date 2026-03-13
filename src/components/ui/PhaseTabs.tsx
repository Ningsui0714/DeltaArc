import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';

type PhaseTab = {
  id: string;
  label: string;
  hint: string;
};

type PhaseTabsProps = {
  tabs: PhaseTab[];
  activeTab: string;
  onChange: (nextTab: string) => void;
};

export function PhaseTabs({ tabs, activeTab, onChange }: PhaseTabsProps) {
  const { language } = useUiLanguage();

  return (
    <div className="phase-tabs" role="tablist" aria-label={isEnglishUi(language) ? 'analysis sections' : '分析阶段'}>
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`phase-tab ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <span className="phase-tab-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="phase-tab-copy">
              <strong>{tab.label}</strong>
              <small>{tab.hint}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
