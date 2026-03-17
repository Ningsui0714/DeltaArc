import { useEffect, useState } from 'react';
import type { ProjectSnapshot } from '../../types';
import {
  getCompletedIntakeFieldCount,
  getProjectFieldValue,
  getProjectIntakeInsights,
  guidedRefinementFieldIds,
  hasProjectFieldValue,
  starterFieldIds,
  type GuidedRefinementFieldId,
  type ProjectIntakeFieldId,
} from '../../lib/projectIntake';
import { MINIMUM_SETUP_FIELD_COUNT } from '../../lib/projectReadiness';
import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';
import { ProjectFormField } from './ProjectFormField';
import { ProjectGuidedRefinementPanel } from './ProjectGuidedRefinementPanel';
import { ProjectUnderstandingPanel } from './ProjectUnderstandingPanel';
import { ProjectDisclosurePanel } from './ProjectDisclosurePanel';
import {
  pickCopy,
  projectEditorFieldLabels,
  projectEditorFields,
  projectEditorGuidedPrompts,
  projectEditorHeaderCopy,
} from './projectEditorConfig';

type ProjectEditorCardProps = {
  project: ProjectSnapshot;
  onProjectChange: (patch: Partial<ProjectSnapshot>) => void;
  onResetProject: () => void;
  onClearEvidence: () => void;
};

export function ProjectEditorCard({
  project,
  onProjectChange,
  onResetProject,
  onClearEvidence,
}: ProjectEditorCardProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const insights = getProjectIntakeInsights(project);
  const starterCount = getCompletedIntakeFieldCount(project, starterFieldIds);
  const refinementCount = getCompletedIntakeFieldCount(project, guidedRefinementFieldIds);
  const starterReady = starterCount >= MINIMUM_SETUP_FIELD_COUNT;
  const starterMissingFields = projectEditorFields.starter.filter(
    (config) => !hasProjectFieldValue(project, config.field),
  );
  const nextRecommendedPrompt =
    projectEditorGuidedPrompts.find(
      (prompt) => prompt.id === insights.recommendedRefinementFieldIds[0],
    ) ?? projectEditorGuidedPrompts[0];
  const [activePromptId, setActivePromptId] = useState<GuidedRefinementFieldId>(
    nextRecommendedPrompt.id,
  );
  const [draftAnswer, setDraftAnswer] = useState('');
  const [lastAppliedPromptId, setLastAppliedPromptId] = useState<GuidedRefinementFieldId | null>(
    null,
  );

  const activePrompt =
    projectEditorGuidedPrompts.find((prompt) => prompt.id === activePromptId) ?? nextRecommendedPrompt;
  const nextFocusCopy = starterReady
    ? pickCopy(nextRecommendedPrompt.title, isEnglish)
    : starterMissingFields[0]
      ? pickCopy(starterMissingFields[0].label, isEnglish)
      : isEnglish
        ? 'Keep editing the starter brief'
        : '继续补充起跑信息';
  const positioningSummary =
    insights.positioning ||
    (isEnglish
      ? 'Finish the starter brief and the system will begin to form a sharper product read.'
      : '先补齐起跑信息，系统才会逐渐形成更清楚的产品判断。');

  useEffect(() => {
    setDraftAnswer(getProjectFieldValue(project, activePromptId));
  }, [activePromptId, project]);

  function patchProject(field: ProjectIntakeFieldId, value: string | string[] | ProjectSnapshot['mode']) {
    onProjectChange({ [field]: value } as Partial<ProjectSnapshot>);
  }

  function getFieldLabel(field: ProjectIntakeFieldId) {
    return pickCopy(projectEditorFieldLabels[field], isEnglish);
  }

  function handleApplyGuidedAnswer() {
    const trimmedAnswer = draftAnswer.trim();
    if (!trimmedAnswer) {
      return;
    }

    patchProject(activePrompt.id, trimmedAnswer);
    setLastAppliedPromptId(activePrompt.id);

    const nextPrompt =
      projectEditorGuidedPrompts.find(
        (prompt) => prompt.id !== activePrompt.id && !hasProjectFieldValue(project, prompt.id),
      ) ??
      projectEditorGuidedPrompts.find((prompt) => prompt.id !== activePrompt.id) ??
      activePrompt;

    setActivePromptId(nextPrompt.id);
  }

  const disclosureConfigs = [
    {
      eyebrow: isEnglish ? 'Manual Section' : '手动补充区',
      title: isEnglish ? 'Advantage and memory points' : '优势与记忆点补充',
      description: isEnglish
        ? 'These fields mirror the guided prompts and stay fully editable.'
        : '这些字段和引导补全是一一对应的，随时可改。',
      badge: `${projectEditorFields.advantage.filter((config) => hasProjectFieldValue(project, config.field)).length}/${projectEditorFields.advantage.length}`,
      configs: projectEditorFields.advantage,
      open: true,
      badgeClassName: 'panel-badge',
    },
    {
      eyebrow: isEnglish ? 'Manual Section' : '手动补充区',
      title: isEnglish ? 'Risk and constraint notes' : '风险与约束补充',
      description: isEnglish
        ? 'Write down what could break the idea and what real-world limits shape your choices.'
        : '把可能让产品失效的风险，以及真正会影响选择的现实约束写下来。',
      badge: `${projectEditorFields.risk.filter((config) => hasProjectFieldValue(project, config.field)).length}/${projectEditorFields.risk.length}`,
      configs: projectEditorFields.risk,
      open: true,
      badgeClassName: 'panel-badge',
    },
    {
      eyebrow: isEnglish ? 'Optional Context' : '背景补充',
      title: isEnglish ? 'Secondary details' : '次级细节信息',
      description: isEnglish
        ? 'Only add what truly improves the first analysis pass.'
        : '这些信息放轻一点，只有真的能帮助第一轮判断时再补。',
      badge: `${projectEditorFields.background.filter((config) => hasProjectFieldValue(project, config.field)).length}/${projectEditorFields.background.length}`,
      configs: projectEditorFields.background,
      open: false,
      badgeClassName: 'meta-chip',
    },
  ];

  return (
    <section className="panel project-editor-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{pickCopy(projectEditorHeaderCopy.eyebrow, isEnglish)}</p>
          <h3>{pickCopy(projectEditorHeaderCopy.title, isEnglish)}</h3>
        </div>
        <span className="panel-badge">{pickCopy(projectEditorHeaderCopy.badge, isEnglish)}</span>
      </div>

      <div className="editor-note">
        <strong>{pickCopy(projectEditorHeaderCopy.noteTitle, isEnglish)}</strong>
        <p>{pickCopy(projectEditorHeaderCopy.noteBody, isEnglish)}</p>
      </div>

      <div className="project-intake-status-grid">
        <article className={`intake-status-card ${starterReady ? 'is-good' : 'is-current'}`}>
          <span>{isEnglish ? 'Starter Brief' : '起跑信息'}</span>
          <strong>{starterCount}/4</strong>
          <p>
            {starterReady
              ? isEnglish
                ? 'Ready for guided refinement.'
                : '已满足引导补全的起跑条件。'
              : isEnglish
                ? 'Finish the 4 core fields first.'
                : '先补齐 4 个关键字段。'}
          </p>
        </article>

        <article className={`intake-status-card ${refinementCount > 0 ? 'is-good' : ''}`}>
          <span>{isEnglish ? 'Guided Refinement' : '引导补全'}</span>
          <strong>{refinementCount}/{guidedRefinementFieldIds.length}</strong>
          <p>
            {isEnglish
              ? 'These prompts sharpen the product read instead of adding paperwork.'
              : '这些追问不是加表单，而是把产品判断补得更清楚。'}
          </p>
        </article>

        <article className="intake-status-card">
          <span>{isEnglish ? 'Best Next Move' : '当前建议动作'}</span>
          <strong>{nextFocusCopy}</strong>
          <p>
            {isEnglish
              ? 'The system keeps nudging you toward the most useful missing signal.'
              : '系统会优先把你引向当前最值得补的那条信息。'}
          </p>
        </article>
      </div>

      <section className="project-identity-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Basic Frame' : '基础框架'}</p>
            <h4>{isEnglish ? 'Lightweight project context' : '先补轻量的项目背景'}</h4>
            <p>
              {isEnglish
                ? 'These fields help position the project, but they should not block the actual judgment work.'
                : '这些信息有助于定位项目，但不应该反过来阻塞真正的产品判断。'}
            </p>
          </div>
          <span className="meta-chip">{isEnglish ? 'Editable anytime' : '随时可补'}</span>
        </div>
        <div className="project-identity-grid">
          {projectEditorFields.identity.map((config) => (
            <ProjectFormField
              key={config.field}
              config={config}
              project={project}
              isEnglish={isEnglish}
              onChange={patchProject}
            />
          ))}
        </div>
      </section>

      <section className="project-starter-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Starter Brief' : '起跑信息'}</p>
            <h4>
              {isEnglish
                ? 'Write only the four signals needed to start thinking clearly'
                : '只先写清 4 个能让判断成立的信号'}
            </h4>
            <p>
              {isEnglish
                ? 'This is the minimum frame for the system to understand what you are testing and why it matters.'
                : '这 4 项先决定系统到底在判断什么，以及为什么这轮验证有意义。'}
            </p>
          </div>
          <span className="panel-badge">
            {isEnglish ? 'Required before guided follow-up' : '先补齐后再进入追问'}
          </span>
        </div>

        <div className="starter-card-grid">
          {projectEditorFields.starter.map((config) => {
            const isFilled = hasProjectFieldValue(project, config.field);

            return (
              <article
                key={config.field}
                className={`starter-card ${isFilled ? 'is-done' : 'is-pending'}`}
              >
                <div className="starter-card-topline">
                  <span className="starter-card-index">{pickCopy(config.label, isEnglish)}</span>
                  <span className={`starter-card-status ${isFilled ? 'is-done' : 'is-pending'}`}>
                    {isFilled
                      ? isEnglish
                        ? 'Ready'
                        : '已就绪'
                      : isEnglish
                        ? 'Write this first'
                        : '建议先写'}
                  </span>
                </div>
                <ProjectFormField
                  config={config}
                  project={project}
                  isEnglish={isEnglish}
                  headerMode="hint-only"
                  onChange={patchProject}
                />
              </article>
            );
          })}
        </div>
      </section>

      <section className="project-refinement-layout">
        <ProjectGuidedRefinementPanel
          project={project}
          isEnglish={isEnglish}
          starterReady={starterReady}
          starterCount={starterCount}
          starterMissingFields={starterMissingFields}
          prompts={projectEditorGuidedPrompts}
          activePromptId={activePromptId}
          draftAnswer={draftAnswer}
          lastAppliedPromptId={lastAppliedPromptId}
          onSelectPrompt={setActivePromptId}
          onDraftChange={setDraftAnswer}
          onApply={handleApplyGuidedAnswer}
          onRestore={() => setDraftAnswer(getProjectFieldValue(project, activePrompt.id))}
          getFieldLabel={(field) => getFieldLabel(field)}
        />

        <ProjectUnderstandingPanel
          isEnglish={isEnglish}
          positioningSummary={positioningSummary}
          insights={insights}
          getFieldLabel={getFieldLabel}
        />
      </section>

      <section className="editor-details-stack">
        {disclosureConfigs.map((section) => (
          <ProjectDisclosurePanel
            key={section.title}
            eyebrow={section.eyebrow}
            title={section.title}
            description={section.description}
            badge={section.badge}
            badgeClassName={section.badgeClassName}
            open={section.open}
            configs={section.configs}
            project={project}
            isEnglish={isEnglish}
            onChange={patchProject}
          />
        ))}
      </section>

      <div className="project-editor-actions">
        <button type="button" className="ghost-button" onClick={onResetProject}>
          {isEnglish ? 'Clear all draft fields' : '清空整个草稿'}
        </button>
        <button type="button" className="inline-button" onClick={onClearEvidence}>
          {isEnglish ? 'Clear evidence only' : '只清空证据'}
        </button>
      </div>
    </section>
  );
}
