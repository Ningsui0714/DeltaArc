import type { ProjectSnapshot } from '../../types';
import { getProjectFieldValue, type ProjectIntakeFieldId } from '../../lib/projectIntake';
import { pickCopy, type ProjectFieldConfig } from './projectEditorConfig';

type ProjectFormFieldProps = {
  config: ProjectFieldConfig;
  project: ProjectSnapshot;
  isEnglish: boolean;
  onChange: (field: ProjectIntakeFieldId, value: string | string[] | ProjectSnapshot['mode']) => void;
};

function parseListInput(value: string) {
  return value
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProjectFormField({
  config,
  project,
  isEnglish,
  onChange,
}: ProjectFormFieldProps) {
  return (
    <label className={`field-group ${config.wide ? 'field-group-wide' : ''}`.trim()}>
      <span className="field-label-row">
        <strong>{pickCopy(config.label, isEnglish)}</strong>
        <small>{pickCopy(config.hint, isEnglish)}</small>
      </span>

      {config.kind === 'select' ? (
        <select
          value={project.mode}
          onChange={(event) => onChange('mode', event.target.value as ProjectSnapshot['mode'])}
        >
          <option value="Concept">{isEnglish ? 'Concept' : '概念阶段'}</option>
          <option value="Validation">{isEnglish ? 'Validation' : '验证阶段'}</option>
          <option value="Live">{isEnglish ? 'Live' : '上线阶段'}</option>
        </select>
      ) : config.kind === 'list' ? (
        <input
          type="text"
          value={getProjectFieldValue(project, config.field)}
          onChange={(event) => onChange(config.field, parseListInput(event.target.value))}
          placeholder={pickCopy(config.placeholder, isEnglish)}
        />
      ) : config.kind === 'textarea' ? (
        <textarea
          rows={config.rows ?? 3}
          value={getProjectFieldValue(project, config.field)}
          onChange={(event) => onChange(config.field, event.target.value)}
          placeholder={pickCopy(config.placeholder, isEnglish)}
        />
      ) : (
        <input
          type="text"
          value={getProjectFieldValue(project, config.field)}
          onChange={(event) => onChange(config.field, event.target.value)}
          placeholder={pickCopy(config.placeholder, isEnglish)}
        />
      )}
    </label>
  );
}
