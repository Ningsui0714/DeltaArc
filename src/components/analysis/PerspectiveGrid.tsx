import type { SandboxPerspective } from '../../../shared/sandbox';
import { getSandboxLabels } from '../../lib/sandboxLabels';
import { useUiLanguage } from '../../hooks/useUiLanguage';

type PerspectiveGridProps = {
  perspectives: SandboxPerspective[];
};

export function PerspectiveGrid({ perspectives }: PerspectiveGridProps) {
  const { language } = useUiLanguage();
  const { stanceLabels } = getSandboxLabels(language);

  return (
    <div className="perspective-grid">
      {perspectives.map((perspective) => (
        <article key={perspective.key} className="perspective-card">
          <div className="card-topline">
            <span className="tiny-chip">{perspective.label}</span>
            <span className={`stance-chip stance-${perspective.stance}`}>{stanceLabels[perspective.stance]}</span>
          </div>
          <h4>{perspective.verdict}</h4>
          <div className="perspective-body">
            <p>{perspective.opportunity}</p>
            <p>{perspective.concern}</p>
            <p>{perspective.leverage}</p>
          </div>
          {perspective.evidenceRefs.length > 0 ? (
            <div className="chip-row">
              {perspective.evidenceRefs.map((ref) => (
                <span key={ref} className="meta-chip">
                  {ref}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
