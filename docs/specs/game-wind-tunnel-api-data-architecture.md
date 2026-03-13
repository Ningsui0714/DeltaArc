# 游戏方向产品风洞 API 与数据结构草案

## 1. 文档信息

- 文档版本: v0.1
- 更新时间: 2026-03-12
- 关联文档: `product-wind-tunnel-mvp-prd.md`
- 目标: 让纯 AI coding 可以直接进入实现

## 2. 结论先行

### 2.1 关于 localhost 可视化 UI

当前阶段我认为是合适的，而且是很合适。

原因不是因为 `localhost` 更高级，而是因为它更适合你现在这个阶段：

- 纯 AI coding，先求可跑、可验证、可快速改
- 暂时不需要复杂登录、权限、云存储和运维
- 游戏策划材料可能包含未公开方案，本地优先更容易建立信任
- 可以先把“分析质量”和“报告可信度”做出来，而不是先陷入部署问题

但有一个边界要明确：

`localhost` 适合作为第一版运行方式，不适合作为产品长期边界。

也就是说，建议现在这样做：

- UI 跑在浏览器里，例如 `http://localhost:3000`
- API 跑在本地服务里，例如 `http://localhost:8000`
- 数据存在本地 SQLite 和本地文件目录
- LLM 可以调用云端模型 API

不建议现在这样做：

- 把所有数据结构、鉴权、路径、交互都写死成“只能单机单用户”
- 把 UI 和推演逻辑强耦合成无法拆分的桌面脚本

一句话建议：

`本地优先，可以；localhost-only 思维，不要。`

### 2.2 推荐架构结论

第一版建议采用：

- 前端: Web UI，本地启动
- 后端: 本地 API 服务
- 存储: SQLite + 本地 JSON/Markdown 文件
- 模型: 外部 LLM API
- 导出: Markdown 优先，PDF 后置

## 3. 第一版系统目标

系统第一版只做一件事：

帮助游戏策划或独立团队评估一个玩法、系统、活动或商业化想法是否值得继续做，以及下一步最值得验证什么。

系统不追求：

- 精确预测 DAU
- 自动代替策划做设计
- 自动生成完整数值方案
- 全自动替代玩家测试

## 4. 运行形态建议

### 4.1 V0 形态

适合你现在立刻开做：

- 用户在本地打开浏览器
- 前端表单输入策划想法和材料
- 后端在本地做分析、生成结构化对象、输出报告
- 所有项目保存在本地目录

### 4.2 V1 形态

当你开始给更多人试用时：

- 仍然保留 localhost 版本
- 增加“导出项目包”和“导入项目包”
- 支持一键分享 Markdown 报告

### 4.3 V2 形态

当你验证到多人使用需求后：

- 再考虑做托管版 Web
- 再考虑登录、协作、云存储
- 再考虑团队空间和版本比较

## 5. 系统模块

第一版建议拆成 6 个模块。

### 5.1 项目模块

负责创建、读取、更新、删除项目。

### 5.2 输入整理模块

负责把策划输入转成结构化字段。

### 5.3 游戏建模模块

负责生成：

- 玩法状态卡
- 玩家角色卡
- 核心假设
- 候选验证策略

### 5.4 推演模块

负责比较不同策略，并输出接受度和风险判断。

### 5.5 报告模块

负责生成最终 Markdown 报告。

### 5.6 导出模块

负责导出：

- 项目 JSON
- Markdown 报告
- 后续可扩展的 PDF

## 6. 页面结构

### 6.1 页面一：项目创建

字段：

- 项目名称
- 项目模式
- 游戏类型
- 目标平台
- 一句话概念
- 本次要验证的策划想法

### 6.2 页面二：证据输入

字段：

- 玩法描述
- 核心循环
- 玩家目标
- 竞品/参考游戏
- 目标玩家画像
- 风险担忧
- 访谈、评论、群聊、评测等材料

### 6.3 页面三：结构化建模结果

展示：

- 玩法状态卡
- 玩家角色卡
- 核心假设
- 证据等级

支持：

- 手动修改
- 删除不合理角色
- 补充缺失约束

### 6.4 页面四：策略对比

展示：

- 策略 A
- 策略 B
- 策略 C
- 每条策略的预期接受度
- 主要风险
- 最小验证版本建议

### 6.5 页面五：最终报告

展示：

- 结论
- 玩家接受度分析
- 风险点
- 优先验证建议
- 两周行动清单

## 7. 核心数据模型

## 7.1 Project

```json
{
  "id": "proj_001",
  "name": "代号：星落营地",
  "vertical": "game",
  "mode": "concept",
  "status": "draft",
  "createdAt": "2026-03-12T10:00:00+08:00",
  "updatedAt": "2026-03-12T10:00:00+08:00",
  "gameProfile": {
    "genre": "survival_crafting",
    "platform": ["pc"],
    "camera": "topdown",
    "coreLoop": "探索-收集-建造-防守",
    "targetPlayers": ["喜欢合作生存的轻中度玩家"],
    "ideaSummary": "加入双人协作机关解谜提升中期留存"
  },
  "evidenceLevel": "low"
}
```

字段说明：

- `mode`: `concept | validation | live`
- `status`: `draft | analyzing | ready | archived`
- `evidenceLevel`: `low | medium | high`

## 7.2 EvidenceItem

用于存储各种输入材料。

```json
{
  "id": "evi_001",
  "projectId": "proj_001",
  "type": "note",
  "source": "manual",
  "title": "玩法草案",
  "content": "玩家在基地建设过程中会遇到需要双人配合的限时机关。",
  "tags": ["core_gameplay", "co_op"],
  "createdAt": "2026-03-12T10:05:00+08:00"
}
```

`type` 建议支持：

- `note`
- `interview`
- `review`
- `competitor`
- `design_doc`
- `metric_snapshot`

## 7.3 Hypothesis

用于记录策划想法的核心假设。

```json
{
  "id": "hyp_001",
  "projectId": "proj_001",
  "title": "双人机关会提升中期留存",
  "statement": "玩家在第 3 到 5 天会因为合作目标更明确而增加回流意愿。",
  "category": "retention",
  "confidence": 0.42,
  "supportingEvidenceIds": ["evi_001"],
  "riskLevel": "medium"
}
```

## 7.4 PlayerPersona

```json
{
  "id": "per_001",
  "projectId": "proj_001",
  "name": "轻度合作玩家",
  "summary": "希望和朋友一起玩，但不愿学习复杂机制。",
  "motivations": ["轻松合作", "共同通关", "阶段性成就感"],
  "frictions": ["规则太复杂", "失败惩罚过高"],
  "acceptanceSignals": ["教程直观", "合作收益明显"],
  "rejectionSignals": ["沟通成本太高", "单人无法推进"],
  "priceSensitivity": "medium",
  "engagementStyle": "social"
}
```

## 7.5 GameStateCard

这是第一版最重要的结构化对象之一。

```json
{
  "projectId": "proj_001",
  "coreFun": ["合作解谜", "资源规划", "基地成长"],
  "coreLoopClarity": 0.64,
  "noveltyScore": 0.58,
  "learningCost": 0.71,
  "frustrationRisk": 0.55,
  "replayMotivation": 0.49,
  "socialPull": 0.77,
  "monetizationPressureRisk": 0.12,
  "evidenceLevel": "low",
  "summary": "合作亮点明显，但上手成本偏高，单人补位机制不足。"
}
```

建议第一版统一使用 `0-1` 的归一化评分。

## 7.6 Strategy

```json
{
  "id": "str_001",
  "projectId": "proj_001",
  "name": "先做单局双人机关原型",
  "type": "gameplay_validation",
  "goal": "验证合作机制是否带来更强接受度",
  "cost": "medium",
  "timeToValue": "2w",
  "designChanges": [
    "加入 2 个需要双人站位配合的机关",
    "加入失败后快速重试机制"
  ],
  "primaryTargetPersonas": ["per_001"],
  "risks": ["教程成本变高", "单人体验被削弱"]
}
```

`type` 建议支持：

- `gameplay_validation`
- `system_adjustment`
- `economy_validation`
- `event_validation`
- `theme_packaging_validation`

## 7.7 SimulationRun

```json
{
  "id": "sim_001",
  "projectId": "proj_001",
  "strategyIds": ["str_001", "str_002", "str_003"],
  "status": "completed",
  "startedAt": "2026-03-12T10:20:00+08:00",
  "finishedAt": "2026-03-12T10:21:30+08:00",
  "mode": "concept",
  "resultIds": ["res_001", "res_002", "res_003"]
}
```

## 7.8 StrategyResult

```json
{
  "id": "res_001",
  "simulationRunId": "sim_001",
  "strategyId": "str_001",
  "acceptanceScore": 0.69,
  "clarityScore": 0.61,
  "noveltyScore": 0.66,
  "executionRisk": 0.52,
  "retentionPotential": 0.64,
  "monetizationRisk": 0.18,
  "evidenceLevel": "low",
  "confidence": 0.57,
  "verdict": "worth_prototyping",
  "topRisks": [
    "双人机制解释成本偏高",
    "单人玩家可能感到被排除"
  ],
  "recommendedNextStep": "先做 10 分钟单局原型，验证玩家是否自然理解合作收益。"
}
```

`verdict` 建议支持：

- `worth_prototyping`
- `needs_narrower_scope`
- `needs_player_test_first`
- `high_risk`
- `not_recommended_now`

## 7.9 Report

```json
{
  "id": "rep_001",
  "projectId": "proj_001",
  "simulationRunId": "sim_001",
  "title": "双人协作机关玩法验证报告",
  "summary": "建议先做低成本原型验证，不建议直接投入完整系统开发。",
  "markdownPath": "data/projects/proj_001/reports/rep_001.md",
  "createdAt": "2026-03-12T10:22:00+08:00"
}
```

## 8. 本地存储建议

如果第一版运行在 localhost，建议使用这样的目录结构：

```text
data/
  projects/
    proj_001/
      project.json
      evidence/
        evi_001.json
      models/
        game_state_card.json
        personas.json
        hypotheses.json
        strategies.json
      simulations/
        sim_001.json
        results.json
      reports/
        rep_001.md
```

这样做的好处：

- 调试方便
- AI 容易生成和修复
- 以后迁移数据库也不难
- 项目可导出、可备份、可分享

## 9. API 草案

第一版建议用 REST，简单直接。

## 9.1 项目相关

### `POST /api/projects`

创建项目。

请求示例：

```json
{
  "name": "代号：星落营地",
  "mode": "concept",
  "gameProfile": {
    "genre": "survival_crafting",
    "platform": ["pc"],
    "coreLoop": "探索-收集-建造-防守",
    "targetPlayers": ["喜欢合作生存的轻中度玩家"],
    "ideaSummary": "加入双人协作机关提升中期留存"
  }
}
```

### `GET /api/projects`

获取项目列表。

### `GET /api/projects/:projectId`

获取项目详情。

### `PATCH /api/projects/:projectId`

更新项目信息。

### `DELETE /api/projects/:projectId`

删除项目。

## 9.2 证据相关

### `POST /api/projects/:projectId/evidence`

新增证据材料。

### `GET /api/projects/:projectId/evidence`

获取证据列表。

### `DELETE /api/projects/:projectId/evidence/:evidenceId`

删除证据。

## 9.3 建模相关

### `POST /api/projects/:projectId/analyze`

根据现有输入生成：

- evidence level
- hypotheses
- personas
- game state card

响应示例：

```json
{
  "projectId": "proj_001",
  "evidenceLevel": "low",
  "gameStateCardId": "gsc_001",
  "personaIds": ["per_001", "per_002"],
  "hypothesisIds": ["hyp_001", "hyp_002"]
}
```

### `GET /api/projects/:projectId/model`

获取当前项目的建模结果。

### `PATCH /api/projects/:projectId/model`

允许前端修改结构化结果后回写。

## 9.4 策略相关

### `POST /api/projects/:projectId/strategies/generate`

根据建模结果自动生成候选策略。

### `GET /api/projects/:projectId/strategies`

获取策略列表。

### `POST /api/projects/:projectId/strategies`

手动新增策略。

### `PATCH /api/projects/:projectId/strategies/:strategyId`

更新策略。

### `DELETE /api/projects/:projectId/strategies/:strategyId`

删除策略。

## 9.5 推演相关

### `POST /api/projects/:projectId/simulations`

启动一次策略对比推演。

请求示例：

```json
{
  "strategyIds": ["str_001", "str_002", "str_003"]
}
```

响应示例：

```json
{
  "simulationRunId": "sim_001",
  "status": "running"
}
```

### `GET /api/simulations/:simulationRunId`

获取推演运行状态。

### `GET /api/simulations/:simulationRunId/results`

获取推演结果。

## 9.6 报告相关

### `POST /api/projects/:projectId/reports/generate`

根据最新推演结果生成报告。

### `GET /api/projects/:projectId/reports`

获取报告列表。

### `GET /api/reports/:reportId`

获取报告详情。

### `GET /api/reports/:reportId/markdown`

获取 Markdown 内容。

## 10. 推演逻辑草案

第一版不做复杂 Agent 世界，采用“评分 + 角色反应 + 规则修正”模型。

## 10.1 核心维度

每条策略至少评估以下维度：

- `acceptanceScore`
- `clarityScore`
- `noveltyScore`
- `executionRisk`
- `retentionPotential`
- `monetizationRisk`

## 10.2 基本流程

1. 读取项目模式和游戏画像
2. 读取证据和假设
3. 生成人物角色
4. 针对每条策略模拟不同玩家角色反应
5. 用规则修正极端输出
6. 生成每条策略的 verdict
7. 生成 next step

## 10.3 规则约束示例

- 当 `learningCost` 很高且 `clarityScore` 很低时，`acceptanceScore` 不应过高
- 当策略增加机制复杂度时，轻度玩家接受度应下降
- 当策略主要提升社交玩法时，单人玩家风险应上升
- 当商业化刺激太强时，`monetizationRisk` 应上升
- 当证据等级为 `low` 时，`confidence` 上限不能太高

## 10.4 证据等级规则

建议第一版先做简单判定。

### `low`

- 只有概念描述
- 没有真实玩家反馈
- 没有原型测试记录

### `medium`

- 有少量玩家访谈
- 有原型反馈
- 有基础竞品对照

### `high`

- 有真实测试记录
- 有多批玩家反馈
- 有基础行为数据

## 11. LLM 职责边界

LLM 适合做：

- 整理输入
- 抽取假设
- 生成人物角色
- 解释风险
- 撰写报告

LLM 不应直接独占：

- 最终分数计算
- 证据等级判定
- verdict 输出规则
- 数据持久化结构

建议做法：

- 先让 LLM 生成结构化草案
- 再由后端规则层做修正
- 最后再由 LLM 负责报告语言组织

## 12. 推荐技术栈

如果你想快，推荐这套：

- 前端: React + Vite
- UI: Tailwind CSS
- 表单: React Hook Form + Zod
- 后端: FastAPI
- 数据库: SQLite
- ORM: SQLModel 或 SQLAlchemy
- 文件存储: 本地文件系统
- LLM: OpenAI 兼容接口

理由：

- React + Vite 启动快，开发反馈快，更适合本地工作台
- FastAPI 适合快速生成 REST API
- SQLite 适合单机 MVP
- 整套组合很适合 AI coding

## 13. localhost 部署草案

建议默认端口：

- Frontend: `localhost:3000`
- Backend API: `localhost:8000`

环境变量建议：

```env
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
DATA_DIR=./data
APP_ENV=local
```

## 14. 实现顺序

建议按下面顺序做。

### 第 1 步

做项目 CRUD 和本地存储。

### 第 2 步

做输入页面和证据录入。

### 第 3 步

做 `/analyze`，生成：

- evidence level
- personas
- game state card
- hypotheses

### 第 4 步

做策略生成和编辑。

### 第 5 步

做推演结果计算。

### 第 6 步

做 Markdown 报告输出。

## 15. 当前最推荐的落地边界

如果今天就开始写代码，我建议只支持这 3 类输入：

- 新玩法想法
- 系统改动想法
- 商业化方案想法

只输出这 4 类结论：

- 是否值得做原型
- 哪类玩家更可能接受
- 最大风险是什么
- 下一步应该验证什么

这样第一版最容易做出真正有价值的东西。
