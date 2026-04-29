import { useState } from 'react';
import type { DesignVariableV1, FrozenBaseline } from '../../../shared/variableSandbox';
import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';
import type { VariableSandboxListField } from '../../hooks/useVariableImpactScan';

type VariableEditorCardProps = {
  baseline: FrozenBaseline;
  variable: DesignVariableV1;
  resolvedVariable: DesignVariableV1;
  primaryConcern: string;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  canRunImpactScan: boolean;
  onChange: (patch: Partial<DesignVariableV1>) => void;
  onCategoryChange: (category: DesignVariableV1['category']) => void;
  onPrimaryConcernChange: (value: string) => void;
  onListChange: (field: VariableSandboxListField, rawValue: string) => void;
  onReset: () => void;
  onRunQuickScan: () => void;
  onRunDeepScan: () => void;
};

function joinLines(values: string[]) {
  return values.join('\n');
}

function formatTargetLabel(value: string, isEnglish: boolean) {
  const labels: Record<string, { zh: string; en: string }> = {
    core_loop: { zh: '内容主线', en: 'Content Spine' },
    session_pacing: { zh: '发布时间 / 节奏', en: 'Posting Pace' },
    player_cooperation: { zh: '互动机制', en: 'Interaction Trigger' },
    resource_flow: { zh: '分发路径', en: 'Distribution Flow' },
    progression_curve: { zh: '系列化结构', en: 'Series Structure' },
    failure_recovery: { zh: '评论补救', en: 'Comment Recovery' },
    event_rhythm: { zh: '运营节奏', en: 'Campaign Rhythm' },
    return_triggers: { zh: '回访触发', en: 'Return Triggers' },
    community_coordination: { zh: '协同分发', en: 'KOC Coordination' },
    value_perception: { zh: '价值感知', en: 'Value Perception' },
    conversion_moment: { zh: '转化时刻', en: 'Conversion Moment' },
    retention_tradeoff: { zh: '复访权衡', en: 'Return Tradeoff' },
  };

  const entry = labels[value];
  if (!entry) {
    return value;
  }

  return isEnglish ? entry.en : entry.zh;
}

export function VariableEditorCard({
  baseline,
  variable,
  resolvedVariable,
  primaryConcern,
  status,
  error,
  canRunImpactScan,
  onChange,
  onCategoryChange,
  onPrimaryConcernChange,
  onListChange,
  onReset,
  onRunQuickScan,
  onRunDeepScan,
}: VariableEditorCardProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const isRunning = status === 'loading';
  const [showAdvanced, setShowAdvanced] = useState(false);
  const answeredPromptCount = [
    variable.name.trim(),
    variable.changeStatement.trim(),
    variable.intent.trim(),
    primaryConcern.trim(),
  ].filter(Boolean).length;

  return (
    <section className="panel project-editor-panel variable-editor-panel">
      <div className="panel-heading">
        <div>
            <p className="eyebrow">{isEnglish ? 'After The Report' : '报告之后'}</p>
            <h3>
              {isEnglish
              ? 'Test one new content variable against this report'
              : '基于这份策略结果，继续试一个内容变量'}
          </h3>
        </div>
        <span className="panel-badge">
          {isEnglish
            ? `${answeredPromptCount}/4 prompts answered`
            : `已完成 ${answeredPromptCount}/4 个关键信息`}
        </span>
      </div>

      <div className="editor-note">
        <strong>
          {isEnglish
            ? 'Fill the four prompts first'
            : '先回答下面 4 个问题'}
        </strong>
        <p>
          {isEnglish
            ? `You are working on baseline ${baseline.id}. After these four prompts, the system drafts the affected content targets, gains, risks, and validation signals for you.`
            : `你现在基于基线 ${baseline.id} 在继续往前走。先把这 4 个问题答完，系统就会自动补出受影响内容目标、收益、风险和验证信号。`}
        </p>
      </div>

      <div className="project-form-grid variable-idea-grid">
        <label className="field-group">
          <span>{isEnglish ? 'What is the variable called?' : '这个内容变量叫什么？'}</span>
          <input
            type="text"
            value={variable.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder={
              isEnglish
                ? 'For example: Roommate blind-test angle'
                : '例如：室友盲测角度'
            }
          />
        </label>

        <label className="field-group">
          <span>{isEnglish ? 'Which stage does it affect first?' : '它大概先影响哪个阶段？'}</span>
          <select
            value={resolvedVariable.activationStage}
            onChange={(event) =>
              onChange({
                activationStage: event.target.value as DesignVariableV1['activationStage'],
              })
            }
          >
            <option value="early">{isEnglish ? 'First impression' : '首屏 / 首波'}</option>
            <option value="mid">{isEnglish ? 'Interaction stage' : '互动中段'}</option>
            <option value="late">{isEnglish ? 'Conversion stage' : '转化后段'}</option>
          </select>
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'What exactly changes?' : '你到底想改什么？'}</span>
          <textarea
            rows={3}
            value={variable.changeStatement}
            onChange={(event) => onChange({ changeStatement: event.target.value })}
            placeholder={
              isEnglish
                ? 'Describe the content change in one concrete sentence.'
                : '用一句具体的话写清楚这次内容改动。'
            }
          />
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'What do you hope it improves?' : '你希望它带来什么变化？'}</span>
          <textarea
            rows={3}
            value={variable.intent}
            onChange={(event) => onChange({ intent: event.target.value })}
            placeholder={
              isEnglish
                ? 'Describe the audience behavior, interaction signal, or conversion problem you want to improve.'
                : '写你最希望它改善的用户反应、互动信号，或者转化问题。'
            }
          />
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'What worries you most right now?' : '你现在最担心什么？'}</span>
          <textarea
            rows={2}
            value={primaryConcern}
            onChange={(event) => onPrimaryConcernChange(event.target.value)}
            placeholder={
              isEnglish
                ? baseline.analysisSnapshot.primaryRisk || 'Write the biggest downside you are worried about.'
                : baseline.analysisSnapshot.primaryRisk || '写下你最担心的代价、阻力或副作用。'
            }
          />
        </label>
      </div>

      <section className="variable-preview-shell">
        <div className="panel-heading">
          <div>
              <p className="eyebrow">{isEnglish ? 'System Draft' : '系统初稿'}</p>
            <h4>
              {isEnglish
                ? 'This is how the system currently interprets your content variable'
                : '系统目前会先这样理解你的内容变量'}
            </h4>
          </div>
        </div>

        <div className="variable-preview-grid">
          <article className="variable-preview-card">
            <span>{isEnglish ? 'Category' : '变量类别'}</span>
            <strong>
              {resolvedVariable.category === 'gameplay'
                ? isEnglish
                  ? 'Content Theme'
                  : '内容主题'
                : resolvedVariable.category === 'system'
                  ? isEnglish
                    ? 'Distribution Mechanism'
                    : '分发机制'
                  : resolvedVariable.category === 'live_ops'
                    ? isEnglish
                      ? 'Campaign Rhythm'
                      : '运营节奏'
                    : isEnglish
                      ? 'Conversion Action'
                      : '转化动作'}
            </strong>
          </article>
          <article className="variable-preview-card">
            <span>{isEnglish ? 'Likely targets' : '可能影响的目标'}</span>
            <strong>
              {resolvedVariable.injectionTargets
                .slice(0, 3)
                .map((item) => formatTargetLabel(item, isEnglish))
                .join(' / ')}
            </strong>
          </article>
          <article className="variable-preview-card">
            <span>{isEnglish ? 'Expected gain' : '预期收益'}</span>
            <strong>{resolvedVariable.expectedBenefits[0]}</strong>
          </article>
          <article className="variable-preview-card">
            <span>{isEnglish ? 'Main risk' : '主要风险'}</span>
            <strong>{resolvedVariable.knownCosts[0]}</strong>
          </article>
        </div>
      </section>

      <div className="variable-advanced-shell">
        <button
          type="button"
          className="ghost-button variable-advanced-toggle"
          onClick={() => setShowAdvanced((current) => !current)}
        >
          {showAdvanced
            ? isEnglish
              ? 'Hide Advanced Settings'
              : '收起高级设置'
            : isEnglish
              ? 'Open Advanced Settings'
              : '打开高级设置'}
        </button>
        <p className="variable-inline-note">
          {isEnglish
            ? 'If any advanced field is left empty, the system will keep using the generated draft above.'
            : '高级字段留空时，系统会继续使用上面的自动补全结果。'}
        </p>
      </div>

      {showAdvanced ? (
        <div className="project-form-grid variable-advanced-grid">
          <label className="field-group">
            <span>{isEnglish ? 'Manual category' : '手动指定类别'}</span>
            <select
              value={resolvedVariable.category}
              onChange={(event) =>
                onCategoryChange(event.target.value as DesignVariableV1['category'])
              }
            >
              <option value="gameplay">{isEnglish ? 'Content Theme' : '内容主题'}</option>
              <option value="system">{isEnglish ? 'Distribution Mechanism' : '分发机制'}</option>
              <option value="live_ops">{isEnglish ? 'Campaign Rhythm' : '运营节奏'}</option>
              <option value="monetization">{isEnglish ? 'Conversion Action' : '转化动作'}</option>
            </select>
          </label>

          <label className="field-group">
            <span>{isEnglish ? 'Injection targets' : '注入目标'}</span>
            <textarea
              rows={4}
              value={joinLines(resolvedVariable.injectionTargets)}
              onChange={(event) => onListChange('injectionTargets', event.target.value)}
              placeholder={
                isEnglish
                  ? 'One per line, for example: core_loop'
                  : '每行一个，例如：core_loop'
              }
            />
          </label>

          <label className="field-group">
            <span>{isEnglish ? 'Expected benefits' : '预期收益'}</span>
            <textarea
              rows={4}
              value={joinLines(resolvedVariable.expectedBenefits)}
              onChange={(event) => onListChange('expectedBenefits', event.target.value)}
              placeholder={isEnglish ? 'One expected gain per line' : '每行写一个你期待的收益'}
            />
          </label>

          <label className="field-group">
            <span>{isEnglish ? 'Known costs' : '已知代价'}</span>
            <textarea
              rows={4}
              value={joinLines(resolvedVariable.knownCosts)}
              onChange={(event) => onListChange('knownCosts', event.target.value)}
              placeholder={isEnglish ? 'One concern per line' : '每行写一个代价或副作用'}
            />
          </label>

          <label className="field-group">
            <span>{isEnglish ? 'Dependencies' : '依赖条件'}</span>
            <textarea
              rows={4}
              value={joinLines(resolvedVariable.dependencies)}
              onChange={(event) => onListChange('dependencies', event.target.value)}
              placeholder={
                isEnglish
                  ? 'List prerequisite systems, content, or support work'
                  : '列出前置系统、支撑内容或配套工作'
              }
            />
          </label>

          <label className="field-group">
            <span>{isEnglish ? 'Success signals' : '成功信号'}</span>
            <textarea
              rows={4}
              value={joinLines(resolvedVariable.successSignals)}
              onChange={(event) => onListChange('successSignals', event.target.value)}
              placeholder={
                isEnglish
                  ? 'What would prove this idea is working?'
                  : '什么现象能证明这个点子真的有效？'
              }
            />
          </label>

          <label className="field-group">
            <span>{isEnglish ? 'Failure signals' : '失败信号'}</span>
            <textarea
              rows={4}
              value={joinLines(resolvedVariable.failureSignals)}
              onChange={(event) => onListChange('failureSignals', event.target.value)}
              placeholder={
                isEnglish
                  ? 'What would prove this idea is backfiring?'
                  : '什么现象说明这个点子正在反噬？'
              }
            />
          </label>
        </div>
      ) : null}

      {error ? <p className="status-error">{error}</p> : null}

      <div className="project-editor-actions">
        <button type="button" className="ghost-button" onClick={onReset} disabled={isRunning}>
          {isEnglish ? 'Clear And Rewrite' : '清空重写'}
        </button>
        <button
          type="button"
          className="accent-button"
          onClick={onRunQuickScan}
          disabled={!canRunImpactScan || isRunning}
        >
          {isRunning
            ? isEnglish
              ? 'Running'
              : '实验中'
            : isEnglish
              ? 'Start Quick Diagnosis'
              : '开始快速诊断'}
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={onRunDeepScan}
          disabled={!canRunImpactScan || isRunning}
        >
          {isEnglish ? 'Need More Detail? Use Deep Simulation' : '想看更细，就继续跑深度推演'}
        </button>
      </div>
    </section>
  );
}
