import type { ProjectSnapshot } from '../../types';
import { getProjectFieldValue, type ProjectIntakeFieldId } from '../../lib/projectIntake';
import { pickCopy, type ProjectFieldConfig } from './projectEditorConfig';

type ProjectFormFieldProps = {
  config: ProjectFieldConfig;
  project: ProjectSnapshot;
  isEnglish: boolean;
  headerMode?: 'full' | 'hint-only' | 'none';
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
  headerMode = 'full',
  onChange,
}: ProjectFormFieldProps) {
  return (
    <label className={`field-group ${config.wide ? 'field-group-wide' : ''}`.trim()}>
      {headerMode === 'full' ? (
        <span className="field-label-row">
          <strong>{pickCopy(config.label, isEnglish)}</strong>
          <small>{pickCopy(config.hint, isEnglish)}</small>
        </span>
      ) : headerMode === 'hint-only' ? (
        <span className="field-hint-row">
          <small>{pickCopy(config.hint, isEnglish)}</small>
        </span>
      ) : null}

      {config.kind === 'select' ? (
        <select
          value={project.mode}
          onChange={(event) => onChange('mode', event.target.value as ProjectSnapshot['mode'])}
        >
          <option value="Concept">{isEnglish ? 'Planning' : '策划中'}</option>
          <option value="Validation">{isEnglish ? 'Trial Launch' : '试投中'}</option>
          <option value="Live">{isEnglish ? 'Active Operation' : '在运营'}</option>
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
