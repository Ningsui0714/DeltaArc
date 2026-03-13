import type { ProjectSnapshot } from '../../types';
import { isEnglishUi, useUiLanguage } from '../../hooks/useUiLanguage';

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

  return (
    <section className="panel project-editor-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{isEnglish ? 'Project Setup' : '项目设定'}</p>
          <h3>{isEnglish ? 'Describe the game project' : '填写你的游戏项目'}</h3>
        </div>
        <span className="panel-badge">{isEnglish ? 'Saved locally' : '自动保存在本地'}</span>
      </div>

      <div className="editor-note">
        <strong>{isEnglish ? 'Recommended order' : '推荐填写顺序'}</strong>
        <p>
          {isEnglish
            ? 'Start with the one-line concept, core loop, target audience, and validation goal. Fill in the rest after the first Quick Scan.'
            : '先补一句话想法、核心循环、目标玩家、验证目标，剩余字段可以在拿到第一轮快速扫描后继续细化。'}
        </p>
      </div>

      <div className="project-form-grid">
        <label className="field-group">
          <span>{isEnglish ? 'Project Name' : '项目名称'}</span>
          <input
            type="text"
            value={project.name}
            onChange={(event) => onProjectChange({ name: event.target.value })}
            placeholder={isEnglish ? 'For example: Project Farshore' : '例如：代号：远岸旅团'}
          />
        </label>

        <label className="field-group">
          <span>{isEnglish ? 'Stage Mode' : '阶段模式'}</span>
          <select
            value={project.mode}
            onChange={(event) =>
              onProjectChange({ mode: event.target.value as ProjectSnapshot['mode'] })
            }
          >
            <option value="Concept">{isEnglish ? 'Concept' : '概念阶段'}</option>
            <option value="Validation">{isEnglish ? 'Validation' : '验证阶段'}</option>
            <option value="Live">{isEnglish ? 'Live' : '上线阶段'}</option>
          </select>
        </label>

        <label className="field-group">
          <span>{isEnglish ? 'Genre' : '游戏类型'}</span>
          <input
            type="text"
            value={project.genre}
            onChange={(event) => onProjectChange({ genre: event.target.value })}
            placeholder={isEnglish ? 'For example: co-op survival / roguelike / management sim' : '例如：合作生存 / Roguelike / 模拟经营'}
          />
        </label>

        <label className="field-group">
          <span>{isEnglish ? 'Platforms' : '目标平台'}</span>
          <input
            type="text"
            value={project.platforms.join(', ')}
            onChange={(event) =>
              onProjectChange({
                platforms: event.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
            placeholder={isEnglish ? 'For example: PC, Steam Deck, iOS' : '例如：PC, Steam Deck, iOS'}
          />
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'Target Audience' : '目标玩家'}</span>
          <input
            type="text"
            value={project.targetPlayers.join(', ')}
            onChange={(event) =>
              onProjectChange({
                targetPlayers: event.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
            placeholder={isEnglish ? 'For example: casual co-op players, shareable-content players, survival builders' : '例如：轻度合作玩家, 内容传播型玩家, 生存建造爱好者'}
          />
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'Core Fantasy' : '核心体验承诺'}</span>
          <textarea
            rows={3}
            value={project.coreFantasy}
            onChange={(event) => onProjectChange({ coreFantasy: event.target.value })}
            placeholder={isEnglish ? 'Why will players stay? What should they feel?' : '玩家为什么愿意留下来？你想让他们感受到什么？'}
          />
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'One-Line Concept' : '一句话想法'}</span>
          <textarea
            rows={3}
            value={project.ideaSummary}
            onChange={(event) => onProjectChange({ ideaSummary: event.target.value })}
            placeholder={isEnglish ? 'What mechanic, system, or feature are you validating, and why is it worth building?' : '你想验证什么玩法、系统或活动？为什么值得做？'}
          />
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'Core Loop' : '核心循环'}</span>
          <textarea
            rows={3}
            value={project.coreLoop}
            onChange={(event) => onProjectChange({ coreLoop: event.target.value })}
            placeholder={isEnglish ? 'For example: explore -> fight -> collect -> build -> challenge again' : '例如：探索 -> 战斗 -> 收集 -> 建造 -> 再挑战'}
          />
        </label>

        <label className="field-group">
          <span>{isEnglish ? 'Session Length / Pace' : '单局时长 / 节奏'}</span>
          <input
            type="text"
            value={project.sessionLength}
            onChange={(event) => onProjectChange({ sessionLength: event.target.value })}
            placeholder={isEnglish ? 'For example: 10-15 minute short runs / 30 minute mid-length runs' : '例如：10-15 分钟短局 / 30 分钟中局'}
          />
        </label>

        <label className="field-group">
          <span>{isEnglish ? 'Reference Games' : '参考游戏'}</span>
          <input
            type="text"
            value={project.referenceGames.join(', ')}
            onChange={(event) =>
              onProjectChange({
                referenceGames: event.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
            placeholder={isEnglish ? 'For example: Hades, Balatro, Vampire Survivors' : '例如：Hades, Balatro, Vampire Survivors'}
          />
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'Differentiation' : '差异化卖点'}</span>
          <textarea
            rows={3}
            value={project.differentiators}
            onChange={(event) => onProjectChange({ differentiators: event.target.value })}
            placeholder={isEnglish ? 'Compared with competitors, what should players remember immediately?' : '相对竞品，你最想让玩家一眼记住什么？'}
          />
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'Progression Hook' : '成长驱动'}</span>
          <textarea
            rows={3}
            value={project.progressionHook}
            onChange={(event) => onProjectChange({ progressionHook: event.target.value })}
            placeholder={isEnglish ? 'What supports mid-term retention: growth, collection, build variation, chapter progress, or something else?' : '中期留存靠什么支撑，例如成长、收集、build 变化或章节推进？'}
          />
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'Social / Sharing Hook' : '社交 / 传播驱动'}</span>
          <textarea
            rows={3}
            value={project.socialHook}
            onChange={(event) => onProjectChange({ socialHook: event.target.value })}
            placeholder={isEnglish ? 'If this is multiplayer, streamable, or highly shareable, describe the exact trigger points here.' : '如果它是多人、直播友好或强传播型项目，这里写清机制触发点。'}
          />
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'Monetization Plan' : '商业化设想'}</span>
          <textarea
            rows={3}
            value={project.monetization}
            onChange={(event) => onProjectChange({ monetization: event.target.value })}
            placeholder={isEnglish ? 'For example: no monetization yet / season pass / cosmetics / DLC / premium purchase' : '例如：先不测付费 / 赛季票 / 装扮 / DLC / 买断制'}
          />
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'Validation Goal This Round' : '本轮验证目标'}</span>
          <textarea
            rows={3}
            value={project.validationGoal}
            onChange={(event) => onProjectChange({ validationGoal: event.target.value })}
            placeholder={isEnglish ? 'What do you most want to validate this round? What result would make you continue or pause?' : '这轮最想验证什么？什么结果会让你继续推进或暂停？'}
          />
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'Production Constraints' : '制作约束'}</span>
          <textarea
            rows={3}
            value={project.productionConstraints}
            onChange={(event) => onProjectChange({ productionConstraints: event.target.value })}
            placeholder={isEnglish ? 'Put team size, budget, schedule, tech stack, and content throughput limits here.' : '团队人数、预算、工期、技术栈或内容产能限制都写在这里。'}
          />
        </label>

        <label className="field-group field-group-wide">
          <span>{isEnglish ? 'Current Main Concern' : '当前最担心的问题'}</span>
          <textarea
            rows={3}
            value={project.currentStatus}
            onChange={(event) => onProjectChange({ currentStatus: event.target.value })}
            placeholder={isEnglish ? 'For example: onboarding cost may be so high that it hides the core fun.' : '例如：担心学习成本太高，掩盖了玩法乐趣。'}
          />
        </label>
      </div>

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
