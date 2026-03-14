import type { ProjectSnapshot } from '../../types';
import { getProjectFieldValue, hasProjectFieldValue, type GuidedRefinementFieldId } from '../../lib/projectIntake';
import { pickCopy, type ProjectFieldConfig, type ProjectGuidedPromptConfig } from './projectEditorConfig';

type ProjectGuidedRefinementPanelProps = {
  project: ProjectSnapshot;
  isEnglish: boolean;
  starterReady: boolean;
  starterCount: number;
  starterMissingFields: ProjectFieldConfig[];
  prompts: ProjectGuidedPromptConfig[];
  activePromptId: GuidedRefinementFieldId;
  draftAnswer: string;
  lastAppliedPromptId: GuidedRefinementFieldId | null;
  onSelectPrompt: (promptId: GuidedRefinementFieldId) => void;
  onDraftChange: (value: string) => void;
  onApply: () => void;
  onRestore: () => void;
  getFieldLabel: (field: GuidedRefinementFieldId) => string;
};

export function ProjectGuidedRefinementPanel({
  project,
  isEnglish,
  starterReady,
  starterCount,
  starterMissingFields,
  prompts,
  activePromptId,
  draftAnswer,
  lastAppliedPromptId,
  onSelectPrompt,
  onDraftChange,
  onApply,
  onRestore,
  getFieldLabel,
}: ProjectGuidedRefinementPanelProps) {
  const activePrompt = prompts.find((prompt) => prompt.id === activePromptId) ?? prompts[0];
  const completedPrompts = prompts.filter((prompt) => hasProjectFieldValue(project, prompt.id));

  return (
    <section className="project-refinement-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{isEnglish ? 'Guided Refinement' : '引导补全'}</p>
          <h4>{isEnglish ? 'Use follow-up questions to sharpen the product call' : '用追问把产品判断补清楚'}</h4>
          <p>
            {isEnglish
              ? 'This layer is structured first. It is also the cleanest place to plug in a chat model later.'
              : '这里先用结构化追问打底，后面如果你要接 chat 模型做更深追问，也最适合从这里接。'}
          </p>
        </div>
        <span className="meta-chip">
          {starterReady
            ? isEnglish
              ? 'Unlocked'
              : '已解锁'
            : isEnglish
              ? `${starterCount}/4 ready`
              : `${starterCount}/4 已完成`}
        </span>
      </div>

      {!starterReady ? (
        <div className="guided-lock-note">
          <strong>{isEnglish ? 'Fill the starter brief first' : '先补齐起跑信息'}</strong>
          <p>
            {isEnglish
              ? 'Guided follow-up works better after the one-line concept, core loop, target players, and decision bar are already visible.'
              : '先把一句话想法、核心循环、目标玩家和本轮验证目标写出来，引导追问才会更准。'}
          </p>
          <ul className="bullet-list">
            {starterMissingFields.map((config) => (
              <li key={config.field}>{pickCopy(config.label, isEnglish)}</li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="guided-prompt-grid">
            {prompts.map((prompt) => {
              const isActive = prompt.id === activePrompt.id;
              const isComplete = hasProjectFieldValue(project, prompt.id);

              return (
                <button
                  key={prompt.id}
                  type="button"
                  className={`guided-prompt-chip ${isActive ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''}`}
                  onClick={() => onSelectPrompt(prompt.id)}
                >
                  <span className="guided-prompt-chip-topline">
                    <small>{isComplete ? (isEnglish ? 'Filled' : '已补充') : isEnglish ? 'Open' : '待补充'}</small>
                    <span className="tiny-chip">{getFieldLabel(prompt.id)}</span>
                  </span>
                  <strong>{pickCopy(prompt.title, isEnglish)}</strong>
                  <p>{pickCopy(prompt.prompt, isEnglish)}</p>
                </button>
              );
            })}
          </div>

          <div className="guided-composer">
            <div className="guided-composer-heading">
              <div>
                <span className="eyebrow">{getFieldLabel(activePrompt.id)}</span>
                <h4>{pickCopy(activePrompt.title, isEnglish)}</h4>
                <p>{pickCopy(activePrompt.hint, isEnglish)}</p>
              </div>
              <span className="panel-badge">
                {hasProjectFieldValue(project, activePrompt.id)
                  ? isEnglish
                    ? 'Already has content'
                    : '当前已有内容'
                  : isEnglish
                    ? 'Needs your answer'
                    : '等待你的回答'}
              </span>
            </div>

            <textarea
              rows={6}
              value={draftAnswer}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder={pickCopy(activePrompt.placeholder, isEnglish)}
            />

            <div className="guided-suggestion-row">
              {activePrompt.suggestions.map((suggestion) => {
                const copy = pickCopy(suggestion, isEnglish);

                return (
                  <button
                    key={copy}
                    type="button"
                    className="guided-suggestion-chip"
                    onClick={() => onDraftChange(copy)}
                  >
                    {copy}
                  </button>
                );
              })}
            </div>

            <div className="guided-composer-footer">
              <div className="guided-composer-actions">
                <button
                  type="button"
                  className="accent-button"
                  disabled={draftAnswer.trim().length === 0}
                  onClick={onApply}
                >
                  {isEnglish ? 'Write into project' : '写入项目卡'}
                </button>
                <button type="button" className="ghost-button" onClick={onRestore}>
                  {isEnglish ? 'Restore saved content' : '恢复当前字段内容'}
                </button>
              </div>
              <small>
                {lastAppliedPromptId
                  ? isEnglish
                    ? `Last saved to ${getFieldLabel(lastAppliedPromptId)}.`
                    : `最近一次已写入「${getFieldLabel(lastAppliedPromptId)}」。`
                  : isEnglish
                    ? 'Each answer stays editable in the manual sections below.'
                    : '每次写入后，下面的手动字段仍然可以继续改。'}
              </small>
            </div>
          </div>

          <div className="guided-memory-panel">
            <span>{isEnglish ? 'Captured refinement signals' : '已经沉淀下来的补全结果'}</span>
            {completedPrompts.length > 0 ? (
              <ul className="guided-memory-list">
                {completedPrompts.map((prompt) => (
                  <li key={prompt.id}>
                    <strong>{pickCopy(prompt.title, isEnglish)}</strong>
                    <p>{getProjectFieldValue(project, prompt.id)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="guided-empty-copy">
                {isEnglish
                  ? 'Once you answer a prompt here, it will appear as structured project memory.'
                  : '你在这里回答过的内容，会作为结构化项目记忆显示在这里。'}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
