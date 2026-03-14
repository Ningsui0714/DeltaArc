# 后续路线设计

这份路线默认服务于一个前提：

- 你会继续用纯 AI coding 推进
- 你需要的是“低认知负担、可连续迭代、容易验收”的仓库
- 你现在还不需要企业级复杂度

所以目标不是一次性做“大架构升级”，而是分三期把这个仓库从“能跑的 demo”推进到“AI 可持续接手的产品骨架”。

更新说明（2026-03-15）：

- `shared/schema/`、分析结果 `meta`、`npm run verify:fixtures`、`server/data/projects/` 本地真相源已经落地。
- 下文保留原始分期结构，但“当前问题”已经改成“剩余主要问题”，避免把已完成项继续写成缺失项。

## 总原则

后续所有演进都尽量遵守 5 条规则：

1. 一个概念只保留一个真相来源。
2. LLM 边界都要有结构校验，不靠约定俗成。
3. 用户能看到的每一种结果状态都要显式标注。
4. 先做可回归的本地单机闭环，再做更大能力。
5. 单文件一旦开始承担两种以上职责，就优先拆分。

## 当前状态与剩余问题

当前版本最主要的剩余问题不是“功能太少”，而是下面这 4 个结构风险：

- `shared/schema/` 已经覆盖请求、结果、项目、证据和变量沙盒协议，但新增字段仍需继续先落共享层。
- 推演主链已经拆成 `executionPlan` / `dossierStage` / `specialistStage` / `postStages` / `prompts` / `checkpoints`，但主编排仍有继续减压空间。
- 项目与证据草稿仍在浏览器 `localStorage`，正式分析、基线、变量与 impact scan 已持久化到 `server/data/projects/`，真相源还没有完全统一。
- 已有 `npm run verify:fixtures` 与 `npm test`，但固定样本覆盖度仍可以继续扩。

## 开工前先补清 4 个定义

路线方向本身没问题，但如果不先把下面 4 个定义写死，一期实现很容易出现“看起来都对、语义却不一致”的返工。

### 1. schema 不是再造一套概念，而是收口现有 normalize

当前已经有 `shared/schema/`，下一步不是再造一套概念，而是把仍然分散在前端导入层、后端 normalize 层里的规则继续收口到 `shared/schema/`。

落地要求：

- `src/lib/import/normalize.ts` 里的项目/证据转换规则，后续要迁到共享层，不再前端单独维护一份。
- 后端路由入参校验和模型结果 normalize 优先复用共享解析器，不再各写一套“差不多”的兜底逻辑。
- 一期允许保留现有 TypeScript 类型文件，但新增字段必须先在共享 schema 落地，再接前后端。

### 2. `stale / degraded / error` 要先定义清楚

结果元信息已经进入 `analysis.meta`，但状态语义最容易在后续演进里歪掉，建议继续按下面解释锁死：

- `fresh`：这份结果对应当前草稿，且整条链路没有退回本地兜底。
- `stale`：草稿已经被编辑，但页面仍展示上一轮成功分析结果。
- `degraded`：本轮有结果，但包含 stage fallback 或完全本地 fallback。
- `error`：本轮请求失败，且没有新的可展示结果写入分析区。

补充约束：

- `source=remote` 不等于一定是 `fresh`，远端也可能是 `degraded`。
- `source=local_fallback` 一定是 `degraded` 或 `error`，不能标成 `fresh`。
- `error` 时保留上一份可用结果，但错误信息必须单独展示，不能伪装成“已完成新分析”。

### 3. 不要把分析时间重新挂回 `ProjectSnapshot` 当真相

当前项目草稿并没有把分析时间当成正式真相，这个边界应继续保持，不要再把分析时间戳塞回 `ProjectSnapshot`。

一期约束：

- 浏览器展示的“最近分析时间”改由 `analysisMeta` 或等价字段驱动。
- `ProjectSnapshot` 只保留项目草稿本身，不再承担分析结果时间戳真相。
- 三期如果引入正式 `Project` 实体，再把分析历史时间写回项目仓。

### 4. 固定样本必须有可执行入口，不能只放目录

当前已经有 `npm run verify:fixtures`，下一步要防止它变成摆设，继续把固定样本和校验范围扩起来。

一期至少补一个可执行命令，例如：

- `npm run verify:fixtures`

这条命令至少要覆盖：

- 请求 schema 校验
- 导入样本 normalize
- 模型缺字段响应的 fallback / normalize
- 一个包含 stage fallback 标记的结果样本

## 一期：先把 AI 改动风险压住

目标：让 AI 改代码时不容易把协议和状态改坏。

建议先做这 4 件事：

### 1. 统一协议层

新增一个共享协议目录，专门放运行时 schema 和转换器。

建议目标结构：

```text
shared/
  domain.ts
  sandbox.ts
  schema/
    evidence.ts
    project.ts
    sandboxRequest.ts
    sandboxResult.ts
```

这里不要求一步到位重写所有类型，只要先覆盖：

- `ProjectSnapshot`
- `EvidenceItem`
- `SandboxAnalysisRequest`
- `SandboxAnalysisResult`

落地规则：

- 前端导入文件后先校验再入状态
- 后端路由收到请求后先校验
- 模型输出 normalize 前先过 schema
- 前端现有导入 normalize 规则逐步迁到共享层，避免前后端继续各维护一套

### 2. 给结果补元信息

现在最容易误导用户和 AI 的，是“远端成功结果”和“本地兜底结果”混在一起显示。

建议把结果元信息显式化：

```ts
type AnalysisMeta = {
  source: 'remote' | 'local_fallback';
  status: 'fresh' | 'stale' | 'degraded' | 'error';
  requestId: string;
};
```

并把它并入分析结果或单独挂在 `analysis.meta`。

约束：

- 只有 `remote + fresh` 才更新最近分析时间
- `local_fallback` 必须在 UI 上显示明显标记
- `error` 结果不能伪装成“新分析完成”
- `remote + degraded` 允许展示，但必须让用户知道这一轮含有降级阶段
- `stale` 只表示“草稿已变更，当前结果仍对应上一轮成功分析”

### 3. 拆分前端状态语义

建议把现在的“当前分析”拆成 3 层：

- `draftProject / draftEvidence`
- `analysisResult`
- `analysisMeta`

这样项目编辑时只更新草稿，不要顺手重置成一份“像正式结果的 fallback”。

补充要求：

- 草稿变化后，如果还没重新分析，就把 `analysisMeta.status` 标成 `stale`
- 不再因为用户编辑表单，就自动生成一份看起来像正式输出的新结果覆盖分析区

### 4. 增加固定回归样本

新增一组最小样本，让 AI 每次改完都能对拍。

建议目录：

```text
examples/
  requests/
  imports/
  expected/
scripts/
  verify-fixtures.ts
```

至少准备：

- 一份合法项目包请求
- 一份字段缺失的请求
- 一份 Markdown 导入样本
- 一份模型缺字段的响应样本
- 一份远端返回成功但包含降级阶段的结果样本

一期完成标准：

- 任意一次协议改动，都能明确知道前后端哪里受影响
- 本地 fallback 和正式结果在 UI 上不再混淆
- AI 修改导入链路或分析链路后，有固定样本可验
- 样本校验可以通过单条命令执行，而不是靠手动逐个打开文件

## 二期：把主链改成可维护骨架

目标：把最危险的大文件拆掉，让后续加 specialist、加阶段、加模式时不需要通读整份编排代码。

### 1. 拆 orchestrator

把现在的大文件拆成 5 类职责：

```text
server/lib/orchestration/
  index.ts
  runStage.ts
  pipeline.ts
  prompts/
    dossier.ts
    specialist.ts
    synthesis.ts
    refine.ts
  normalize/
    dossier.ts
    specialist.ts
    final.ts
  fallback/
    dossier.ts
    specialist.ts
    final.ts
  memory/
    summarize.ts
```

拆分原则：

- prompt 构造和 stage 调度分开
- normalize 和 fallback 分开
- specialist 通用逻辑和 blueprint 数据分开

### 2. 把 specialist blueprint 数据独立

当前 `specialistBlueprints` 属于很典型的“配置型知识”，不该埋在流程代码里。

建议单独放：

```text
server/lib/orchestration/specialists.ts
```

这样以后：

- 加新视角只改配置
- 改文案不会顺手碰坏流程

### 3. 统一 memory 接口

现在 memory 还是“轻量 JSON 记忆”，这没问题，但要先抽接口。

建议先统一成：

```ts
type MemoryStore = {
  loadRelevant(project: ProjectSnapshot): Promise<SandboxMemoryRecord[]>;
  persist(project: ProjectSnapshot, analysis: SandboxAnalysisResult): Promise<void>;
};
```

这样未来从 JSON 切到 SQLite，不用重写主编排。

二期完成标准：

- 主编排文件体积明显下降
- 新增一个 specialist 时，不需要改 4 个以上文件
- memory 存储实现可替换

## 三期：把 demo 状态升级成真实项目实体

目标：让“项目”从浏览器表单快照升级成真正的本地项目对象。

### 1. 建立项目仓

这期不要急着上复杂数据库，先做本地项目仓即可。

推荐两条路二选一：

- 文件系统优先：`server/data/projects/<project-id>/`
- SQLite 优先：单库管理项目、证据、分析记录

如果以纯 AI coding 为优先，我更建议你先走文件系统版，因为更透明、更容易调试。

建议文件结构：

```text
server/data/projects/
  proj_xxx/
    project.json
    evidence.json
    analysis-history.jsonl
```

### 2. 引入真正的 Project 实体

建议新增：

```ts
type Project = {
  id: string;
  name: string;
  mode: 'concept' | 'validation' | 'live';
  status: 'draft' | 'ready' | 'archived';
  createdAt: string;
  updatedAt: string;
  snapshot: ProjectSnapshot;
};
```

这样后续才能稳定支撑：

- 项目列表
- 历史推演
- 导出项目包
- 对比不同轮次结果

### 3. 前端改成“加载项目”而不是“持有真相”

浏览器层只保留：

- 草稿缓存
- 当前打开的项目 ID
- 视图状态

项目真相转到服务端项目仓。

三期完成标准：

- 刷新页面不会丢失正式项目状态
- 可以查看某个项目过去几轮推演结果
- 导入、编辑、分析、导出都围绕同一个项目 ID 工作

## 四期再考虑的能力

下面这些不是现在的优先级，建议等前三期稳定后再说：

- what-if 变量面板
- 历史结果 diff
- 多项目看板
- 多人协作
- 云端托管
- 向更多垂类扩展

## 不建议现在做的事

为了让纯 AI coding 保持高成功率，下面这些事情现在都不建议碰：

- 不要上微服务
- 不要上消息队列
- 不要做复杂 prompt 平台
- 不要急着接鉴权和用户系统
- 不要为了“专业”过早切一堆抽象层

## 推荐执行顺序

最实际的推进顺序是：

1. 先做协议层和结果状态显式化
2. 再拆 orchestrator
3. 再统一项目存储
4. 最后做历史对比和 what-if

## 你下一步最值的两个落点

如果马上开工，我建议只选下面一个：

### 路线 A：先保命

适合你最近还会大量让 AI 直接改业务代码。

先做：

- 运行时 schema
- 分析结果 meta
- 固定样本回归

### 路线 B：先拆雷

适合你准备继续加能力，比如更多 specialist、更多导入格式、历史回放。

先做：

- 拆 orchestrator
- 抽 specialist 配置
- 抽 memory store 接口

## 我的建议

优先走“路线 A 半步 + 路线 B 半步”：

第一周只做这 4 件事：

1. 给请求和结果加 schema
2. 给分析结果加 `meta`
3. 补一条固定样本校验命令，并覆盖导入、请求、结果降级这三类输入
4. 把 orchestrator 拆到至少 prompt / normalize / fallback 三块

这四件做完之后，这个仓库就会从“AI 能写”变成“AI 比较不容易写炸”。
