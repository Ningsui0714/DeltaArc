# 纯 AI Coding 最小重构清单

这份清单不追求“大而全重构”，只做最值回票价的 5 件事，让仓库更适合长期交给 AI 迭代。

## 1. 把共享类型升级成运行时协议

当前 `shared/schema/` 已经覆盖了请求、结果、项目、证据和变量沙盒协议，但新增字段和导入 normalize 仍应优先收口到共享层，避免前后端重新各猜一套。

建议：

- 新增或变更 `SandboxAnalysisRequest`、`ProjectSnapshot`、`EvidenceItem`、`SandboxAnalysisResult`、变量沙盒相关结构时，先改共享 schema，再接前后端。
- 前端导入文件继续优先走共享 schema / normalize。
- 后端路由入参与模型出参继续统一走共享 schema。

收益：

- AI 改前端或后端时，不容易把协议悄悄改歪。
- “导入层 normalize” 和 “服务端 normalize” 可以逐步收敛为一套规则。

## 2. 把推演编排拆成职责文件

当前编排已经拆成 `executionPlan`、`dossierStage`、`specialistStage`、`postStages`、`prompts/`、`checkpoints/` 等文件，[`server/lib/orchestration/index.ts`](../server/lib/orchestration/index.ts) 仍然是主编排入口，不应继续膨胀回“超级文件”。

- stage prompt 构造
- stage 调度
- fallback 策略
- 输出拼装
- memory 串联

建议继续沿着现有边界演进：

- `server/lib/orchestration/executionPlan.ts`
- `server/lib/orchestration/dossierStage.ts`
- `server/lib/orchestration/specialistStage.ts`
- `server/lib/orchestration/postStages.ts`
- `server/lib/orchestration/prompts/`
- `server/lib/orchestration/checkpoints.ts`

收益：

- AI 更容易局部修改，不会一改 prompt 顺手改坏 pipeline。
- 后续加新 specialist 或新阶段时，变更范围更小。

## 3. 显式区分结果来源与可信状态

当前结果结构已经有 `meta.source` / `meta.status`，UI 也会区分 `fresh / stale / degraded`，但后续新增缓存、重试和历史对比时仍应继续围绕这套语义扩展，而不是再造第二套状态词。

当前核心字段：

- `meta.source`: `remote | local_fallback`
- `meta.status`: `fresh | stale | degraded | error`

同时约束：

- 只有远端成功结果更新“最近分析时间”。
- fallback 结果必须在 UI 上有明确标识。

收益：

- 产品语义更诚实。
- 后续加缓存、重跑、历史对比时不会混状态。

## 4. 把持久化收口成一个本地项目仓

当前项目和证据草稿仍在浏览器 `localStorage`，正式分析、基线、变量和 impact scan 已经落到 `server/data/projects/`，实际上是“草稿态 + 运行态”两层状态系统。

建议下一步只做最小统一：

- 引入 `server/data/projects/` 或 SQLite 二选一。
- 把 `project + evidence + latest analysis summary` 归档到同一个项目实体下。
- 浏览器只缓存草稿，不缓存“正式真相”。

收益：

- AI 以后做导出、历史记录、项目列表、回滚时不会反复造轮子。
- “项目”终于从表单快照变成真正实体。

## 5. 给 AI 留一套固定验收样本

当前已经有 `npm run typecheck`、`npm run build`、`npm test` 和 `npm run verify:fixtures`，能防住不少回归，但 fixture 规模和目录约定仍可以继续补强。

建议继续补齐并统一这些 fixture 入口：

- `examples/requests/*.json`
- `examples/expected/*.json`
- `examples/baselines/*.json`
- `examples/impact-scans/*.json`
- `examples/variables/*.json`

至少覆盖：

- 合法请求 normalize
- 模型返回缺字段时 fallback
- specialist 超时降级
- Markdown / JSON 导入解析

收益：

- AI 每次改动后都能做对拍。
- 你能更放心地让 AI 连续迭代，而不是每轮都人工通读。

## 清理原则

为了让仓库更适合 AI 持续接手，建议长期遵守这几个规则：

- 不保留构建产物、日志、`tsbuildinfo`。
- 不保留重复配置的生成文件，比如 `vite.config.js`、`vite.config.d.ts`。
- 详细方案草图统一收在 `docs/specs/`，对外说明放 `docs/` 根目录。
- 示例输入统一放 `examples/`。
- 运行时数据和示例数据分开。
