# 混合栈 V2 设计方案

更新时间：2026-03-16

## 1. 目标

本次重构的核心目标不是“换语言”，而是把第一阶段正式分析升级成更高质量的推理系统。

目标：

- 让正式分析从长链路摘要系统，升级成 verifier-centered quality system。
- 保留现有工作台、job、checkpoint、进度展示、真相源落盘能力。
- 让后续可以引入 `DSPy`、离线评测、领域 verifier、best-of-n，而不反复改前端和 API。

非目标：

- 不重写前端。
- 不让 Python 直接接管工作区、job、持久化。
- 不让 TypeScript 和 Python 同时维护两套正式结果 schema。

## 2. 方案选择

采用“薄混合栈”，而不是“双中心系统”。

- `TypeScript`：控制平面 + 产品平面
- `Python`：推理平面 + 评测平面

一句话定义：

> TS 负责“任务怎么跑、状态怎么管、结果怎么落”，Python 负责“结果怎么推、怎么验、怎么评”。

## 3. 分层职责

### 3.1 TypeScript 侧

保留并继续作为真相源的部分：

- API 路由与请求校验
- 工作区、job、checkpoint、retry、progress
- 最新分析、基线、变量、impact scan 的持久化
- 前端消费的最终 `SandboxAnalysisResult`
- `shared/schema` 下的正式协议与 normalize

建议沿用现有模块：

- `server/routes/sandbox/*`
- `server/lib/analysisJobStore.ts`
- `server/lib/projectTruthStore.ts`
- `shared/schema/*`

新增建议模块：

- `server/lib/hybrid/protocol.ts`
- `server/lib/hybrid/pythonAnalysisClient.ts`
- `server/lib/orchestration-v2/*`

### 3.2 Python 侧

负责高质量推理链，不直接管理产品运行态：

- `grounding`
- `candidate generation`
- `verification / ranking`
- `reverse check`
- `finalizer`
- `DSPy` 优化与 prompt/program 搜索
- `Inspect AI` 离线评测

建议目录：

```text
python/
  pyproject.toml
  app/
    main.py
    contracts.py
    pipeline/
      grounding.py
      candidate.py
      verifier.py
      reverse_check.py
      finalizer.py
    evals/
```

## 4. 核心红线

1. `TS` 拥有编排状态、checkpoint、落盘权；`Python` 不直接写 `server/data/`。
2. `shared/schema` 仍是正式结果 schema 的唯一真相源；`Python` 只实现和遵守，不重新发明一套。
3. 不允许 TS 和 Python 同时拥有第一阶段正式分析的主编排权。
4. 跨语言通信必须使用版本化 JSON 协议；协议变更必须先落 schema，再改两端实现。
5. 下游推理不得只消费自由文本摘要；必须携带 `evidenceIds` 或 `grounding refs`。
6. 任何新阶段只有在定义了 `progress mapping + checkpoint semantics + failure policy` 之后才能接入主链。

## 5. V2 正式分析链

建议替换当前默认主链：

```text
dossier -> specialists -> synthesis -> refine
```

改为：

```text
grounding -> candidate x N -> verifier -> reverse check -> finalizer
```

### 5.1 Grounding

职责：

- 从 `project + evidenceItems + memory` 提取事实、约束、未知项、冲突点
- 给关键事实绑定 `evidenceIds`
- 不在这一层下最终 verdict

建议输出最小结构：

```json
{
  "facts": [
    {
      "id": "fact_1",
      "statement": "",
      "dimension": "core_loop",
      "evidenceIds": ["evi_1"],
      "confidence": "explicit"
    }
  ],
  "constraints": [""],
  "unknowns": [""],
  "tensions": [""],
  "warnings": []
}
```

### 5.2 Candidate x N

职责：

- 基于同一份 grounding 生成多份差异化候选
- 差异来自风险偏好和判断角度，不来自“换个说法”

推荐：

- `balanced`
- `skeptical`
- `feasibility-first`
- `market-first`（deep 模式）
- `counterfactual`（deep 模式）

### 5.3 Verifier

职责：

- 对每个候选打分
- 标出 unsupported claims、missed constraints、vague actions
- 排序并淘汰不合格候选

Verifier 不是润色器，而是质量门。

### 5.4 Reverse Check

职责：

- 只对 top-1 或 top-2 做反向核验
- 问题不是“这份结论对不对”，而是“如果它对，哪些条件必须成立”

### 5.5 Finalizer

职责：

- 只把通过验证的候选展开成前端要的最终大 schema
- 不再承担主要推理责任

## 6. TS 与 Python 的通信协议

第一版优先使用 HTTP + JSON，先求稳定，不先上 gRPC。

### 6.1 请求

`TS -> Python`

```json
{
  "protocolVersion": "analysis.v2",
  "requestId": "analysis_xxx",
  "workspaceId": "workspace_xxx",
  "mode": "balanced",
  "project": {},
  "evidenceItems": [],
  "memory": [],
  "options": {
    "candidateCount": 3,
    "topKForReverseCheck": 1
  }
}
```

### 6.2 响应

第一版建议返回阶段化结果，不要求 Python 持有产品级 job。

```json
{
  "protocolVersion": "analysis.v2",
  "requestId": "analysis_xxx",
  "stages": [
    {
      "key": "grounding",
      "status": "completed",
      "preview": {
        "headline": "",
        "summary": "",
        "bullets": [""]
      },
      "artifact": {}
    }
  ],
  "finalResult": {}
}
```

说明：

- `TS` 负责把阶段映射到前端进度和 checkpoint。
- `Python` 返回可恢复 artifact，但不直接决定产品态 job 生命周期。

## 7. 评测与优化

混合栈真正的长期价值，在于可以把“运行”和“提质”拆开。

建议同时建设：

- `DSPy`：优化 grounding / verifier / finalizer 模块
- `Inspect AI`：固定 case、A/B 对拍、人工 rubric、回归测试

建议长期指标：

- `unsupported_claim_rate`
- `evidence_citation_coverage`
- `actionability_score`
- `rerun_variance`
- `human_review_score`

## 8. 迁移顺序

### Phase 0：协议先行

- 定义 `analysis.v2` JSON 协议
- 保持前端最终结果 shape 不变

### Phase 1：迁移 grounding + candidate

- Python 先接 `grounding/candidate`
- TS 继续使用现有 result normalize 和落盘

### Phase 2：迁移 verifier + reverse check

- 让质量门从 prompt 附属逻辑升级成显式阶段
- 开始做 case 对拍

### Phase 3：迁移 finalizer

- Python 输出接近最终结果的结构化结果
- TS 继续做最终 parse / normalize / persist

### Phase 4：灰度切换

- 用 feature flag 同时保留旧链路和 V2
- 只在 V2 质量稳定后切主链

## 9. 为什么这条路适合当前仓库

- 你现有的工作区、job、checkpoint、progress、truth store 已经有不错基础，不该推倒重来。
- 当前最弱的是“推理质量系统”，不是“前端工作台”。
- 混合栈让后续引入 verifier、reward model、离线数据集、多模型路由更顺。
- 薄混合栈可以把复杂度控制在“多一个推理服务”，而不是“多一个产品后端”。

## 10. 最终建议

最终建议不是“全面 Python 化”，而是：

> 保留 TS 的产品运行时，把 Python 变成高质量推理与评测引擎。

如果后续扩展顺利，这条路最容易继续长成：

- 更强的 verifier
- 更稳的离线回归
- 更清晰的 evidence grounding
- 更低的前端联动成本
