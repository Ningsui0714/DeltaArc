import type { ProjectSnapshot } from '../../types';
import type { ProjectIntakeFieldId } from '../../lib/projectIntake';
import { ProjectFormField } from './ProjectFormField';
import type { ProjectFieldConfig } from './projectEditorConfig';

type ProjectDisclosurePanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  badgeClassName?: string;
  open?: boolean;
  configs: ProjectFieldConfig[];
  project: ProjectSnapshot;
  isEnglish: boolean;
  onChange: (field: ProjectIntakeFieldId, value: string | string[] | ProjectSnapshot['mode']) => void;
};

export function ProjectDisclosurePanel({
  eyebrow,
  title,
  description,
  badge,
  badgeClassName = 'panel-badge',
  open = false,
  configs,
  project,
  isEnglish,
  onChange,
}: ProjectDisclosurePanelProps) {
  return (
    <details className="editor-disclosure" open={open}>
      <summary>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
        <span className={badgeClassName}>{badge}</span>
      </summary>
      <div className="editor-disclosure-body">
        <div className="project-form-grid">
          {configs.map((config) => (
            <ProjectFormField
              key={config.field}
              config={config}
              project={project}
              isEnglish={isEnglish}
              onChange={onChange}
            />
          ))}
        </div>
      </div>
    </details>
  );
}
