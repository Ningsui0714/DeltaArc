import type { ProjectSnapshot } from '../../types';

type ProjectEditorCardProps = {
  project: ProjectSnapshot;
  onProjectChange: (patch: Partial<ProjectSnapshot>) => void;
  onResetProject: () => void;
  onLoadDemoProject: () => void;
  onClearEvidence: () => void;
  onLoadDemoEvidence: () => void;
};

export function ProjectEditorCard({
  project,
  onProjectChange,
  onResetProject,
  onLoadDemoProject,
  onClearEvidence,
  onLoadDemoEvidence,
}: ProjectEditorCardProps) {
  return (
    <section className="panel project-editor-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Project Setup</p>
          <h3>填写你的游戏项目</h3>
        </div>
        <span className="panel-badge">自动保存在本地</span>
      </div>

      <div className="project-form-grid">
        <label className="field-group">
          <span>项目名称</span>
          <input
            type="text"
            value={project.name}
            onChange={(event) => onProjectChange({ name: event.target.value })}
            placeholder="例如：代号：远岸旅团"
          />
        </label>

        <label className="field-group">
          <span>阶段模式</span>
          <select
            value={project.mode}
            onChange={(event) =>
              onProjectChange({ mode: event.target.value as ProjectSnapshot['mode'] })
            }
          >
            <option value="Concept">Concept</option>
            <option value="Validation">Validation</option>
            <option value="Live">Live</option>
          </select>
        </label>

        <label className="field-group">
          <span>游戏类型</span>
          <input
            type="text"
            value={project.genre}
            onChange={(event) => onProjectChange({ genre: event.target.value })}
            placeholder="例如：战术 Roguelike / 模拟经营 / 合作生存"
          />
        </label>

        <label className="field-group">
          <span>目标平台</span>
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
            placeholder="例如：PC, Steam Deck, iOS"
          />
        </label>

        <label className="field-group field-group-wide">
          <span>目标玩家</span>
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
            placeholder="例如：轻度合作玩家, 内容传播者, 生存建造爱好者"
          />
        </label>

        <label className="field-group field-group-wide">
          <span>核心体验承诺</span>
          <textarea
            rows={3}
            value={project.coreFantasy}
            onChange={(event) => onProjectChange({ coreFantasy: event.target.value })}
            placeholder="玩家为什么愿意为了这个项目留下来，你想让他们感受到什么"
          />
        </label>

        <label className="field-group field-group-wide">
          <span>一句话想法</span>
          <textarea
            rows={3}
            value={project.ideaSummary}
            onChange={(event) => onProjectChange({ ideaSummary: event.target.value })}
            placeholder="你想验证什么玩法、系统或活动，为什么值得做"
          />
        </label>

        <label className="field-group field-group-wide">
          <span>核心循环</span>
          <textarea
            rows={3}
            value={project.coreLoop}
            onChange={(event) => onProjectChange({ coreLoop: event.target.value })}
            placeholder="例如：探索 -> 战斗 -> 收集 -> 建造 -> 再挑战"
          />
        </label>

        <label className="field-group">
          <span>单局时长 / 节奏</span>
          <input
            type="text"
            value={project.sessionLength}
            onChange={(event) => onProjectChange({ sessionLength: event.target.value })}
            placeholder="例如：10-15 分钟短局 / 30 分钟中局"
          />
        </label>

        <label className="field-group">
          <span>参考游戏</span>
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
            placeholder="例如：Hades, Balatro, Vampire Survivors"
          />
        </label>

        <label className="field-group field-group-wide">
          <span>差异化卖点</span>
          <textarea
            rows={3}
            value={project.differentiators}
            onChange={(event) => onProjectChange({ differentiators: event.target.value })}
            placeholder="相对竞品，你到底想让玩家一眼记住什么"
          />
        </label>

        <label className="field-group field-group-wide">
          <span>成长驱动</span>
          <textarea
            rows={3}
            value={project.progressionHook}
            onChange={(event) => onProjectChange({ progressionHook: event.target.value })}
            placeholder="中期留存靠什么支撑，例如成长、收集、build、章节推进"
          />
        </label>

        <label className="field-group field-group-wide">
          <span>社交 / 传播驱动</span>
          <textarea
            rows={3}
            value={project.socialHook}
            onChange={(event) => onProjectChange({ socialHook: event.target.value })}
            placeholder="如果它是多人、直播友好或强传播型项目，这里写清楚机制触发点"
          />
        </label>

        <label className="field-group field-group-wide">
          <span>商业化设想</span>
          <textarea
            rows={3}
            value={project.monetization}
            onChange={(event) => onProjectChange({ monetization: event.target.value })}
            placeholder="例如：先不测付费 / 赛季票 / 装扮 / DLC / 买断制"
          />
        </label>

        <label className="field-group field-group-wide">
          <span>本轮验证目标</span>
          <textarea
            rows={3}
            value={project.validationGoal}
            onChange={(event) => onProjectChange({ validationGoal: event.target.value })}
            placeholder="这一轮最想验证什么，什么结果会让你继续推进或止损"
          />
        </label>

        <label className="field-group field-group-wide">
          <span>制作约束</span>
          <textarea
            rows={3}
            value={project.productionConstraints}
            onChange={(event) => onProjectChange({ productionConstraints: event.target.value })}
            placeholder="团队人数、预算、可投入周数、技术栈或内容产能限制"
          />
        </label>

        <label className="field-group field-group-wide">
          <span>当前最担心的问题</span>
          <textarea
            rows={3}
            value={project.currentStatus}
            onChange={(event) => onProjectChange({ currentStatus: event.target.value })}
            placeholder="例如：担心学习成本太高，掩盖玩法乐趣"
          />
        </label>
      </div>

      <div className="project-editor-actions">
        <button type="button" className="ghost-button" onClick={onResetProject}>
          新建我的项目
        </button>
        <button type="button" className="inline-button" onClick={onClearEvidence}>
          清空当前证据
        </button>
        <button type="button" className="inline-button" onClick={onLoadDemoProject}>
          载入示例项目
        </button>
        <button type="button" className="inline-button" onClick={onLoadDemoEvidence}>
          载入示例证据
        </button>
      </div>
    </section>
  );
}
