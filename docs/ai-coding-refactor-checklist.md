# 纯 AI Coding 最小重构清单

这份清单不追求“大而全重构”，只做最值回票价的 5 件事，让仓库更适合长期交给 AI 迭代。

## 1. 把共享类型升级成运行时协议

当前 `shared/domain.ts` 和 `shared/sandbox.ts` 只约束了 TypeScript 编译期，前后端在运行时还是靠各自猜。

建议：

- 为 `SandboxAnalysisRequest`、`ProjectSnapshot`、`EvidenceItem`、`SandboxAnalysisResult` 增加统一 schema。
- 前端导入文件后先走 schema。
- 后端路由入参和模型出参都走 schema。

收益：

- AI 改前端或后端时，不容易把协议悄悄改歪。
- “导入层 normalize” 和 “服务端 normalize” 可以逐步收敛为一套规则。

## 2. 把推演编排拆成职责文件

当前 [`server/lib/orchestration/index.ts`](../server/lib/orchestration/index.ts) 仍然是主编排入口，不应继续膨胀到重新变成“超级文件”。

- stage prompt 构造
- stage 调度
- fallback 策略
- 输出拼装
- memory 串联

建议至少拆成：

- `server/lib/orchestration/stages.ts`
- `server/lib/orchestration/prompts.ts`
- `server/lib/orchestration/fallbacks.ts`
- `server/lib/orchestration/assemble.ts`

收益：

- AI 更容易局部修改，不会一改 prompt 顺手改坏 pipeline。
- 后续加新 specialist 或新阶段时，变更范围更小。

## 3. 显式区分结果来源与可信状态

当前 UI 把正式结果、本地 fallback 和失败占位放在一套展示里，容易让用户和 AI 都误读。

建议在结果结构里补两个字段：

- `source`: `remote | local_fallback`
- `status`: `fresh | stale | degraded | error`

同时约束：

- 只有远端成功结果更新“最近分析时间”。
- fallback 结果必须在 UI 上有明确标识。

收益：

- 产品语义更诚实。
- 后续加缓存、重跑、历史对比时不会混状态。

## 4. 把持久化收口成一个本地项目仓

当前项目信息和证据在浏览器 `localStorage`，推演记忆在服务端 JSON，实际上是两套状态系统。

建议下一步只做最小统一：

- 引入 `server/data/projects/` 或 SQLite 二选一。
- 把 `project + evidence + latest analysis summary` 归档到同一个项目实体下。
- 浏览器只缓存草稿，不缓存“正式真相”。

收益：

- AI 以后做导出、历史记录、项目列表、回滚时不会反复造轮子。
- “项目”终于从表单快照变成真正实体。

## 5. 给 AI 留一套固定验收样本

当前只有 `npm run typecheck` 和 `npm run build`，能防语法坏，不防语义漂移。

建议加最小 fixture：

- `examples/requests/*.json`
- `examples/responses/*.json`
- `server/lib/__fixtures__/`

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
- 规划文档统一收在 `docs/specs/`。
- 示例输入统一放 `examples/`。
- 运行时数据和示例数据分开。
