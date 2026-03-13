# Game Wind Tunnel

一个面向游戏/互动产品早期判断的本地沙盘推演工具。

它的目标不是直接替你“下结论”，而是把项目摘要、证据输入、多视角推演、风险拆解和验证动作收束到一个可追踪的工作台里。

## 第一版已经实现了什么

- 项目与证据导入
  - 支持手动填写项目摘要
  - 支持导入 `.json` / `.md` / `.markdown` / `.txt`
  - 支持把结构化文件拆成 `project + evidence` 两部分写入工作区
- 两种推演模式
  - `Quick Scan`：更快返回结果，当前采用“dossier 尝试远端 + 本地 specialist 快扫综合”
  - `Deep Dive`：走更完整的多阶段链路，适合拿更完整的结论结构
- 可见的执行轨迹
  - 前端会展示当前阶段、阶段状态、模型/本地降级信息、warning
  - 用户可以明确看到系统是否正在工作，而不是黑盒等待
- 多视角结果结构
  - `perspectives`
  - `blindSpots`
  - `secondOrderEffects`
  - `scenarioVariants`
  - `decisionLenses`
  - `validationTracks`
  - `contrarianMoves`
  - `unknowns`
  - `redTeam`
  - `report`
- 轻量记忆
  - 会把历史推演中的摘要、主风险、盲点、验证焦点写入 [`server/data/sandbox-memory.json`](./server/data/sandbox-memory.json)
  - 新一轮推演会回收这些记忆信号，避免每次完全从零开始
- 失败降级
  - 当远端阶段超时或失败时，不会直接整单报废
  - 当前会尽量降级为本地 dossier 或本地 specialist 结果，保留可读输出

## 当前产品状态

这不是一个“只会吐一段长文”的壳子，第一版已经具备完整闭环：

1. 输入项目摘要和证据
2. 发起推演任务
3. 看到执行进度
4. 拿到结构化结果
5. 基于结果继续做验证动作

目前最适合用它来做：

- 游戏玩法/核心循环的早期判断
- 合作、生存、策略、系统型项目的风险拆解
- 证据不足阶段的“先收敛问题，再设计验证”
- 把团队内部口头判断，整理成能继续推进的结构化输出

## Quick Scan 和 Deep Dive 的区别

### Quick Scan

- 目标：先快、先可用、先让用户看到系统在工作
- 当前策略：
  - 先跑 `dossier`
  - 再用本地 specialist 规则快速综合 `systems / psychology / market / red_team`
- 优点：
  - 响应更稳定
  - 不会因为一串远端 specialist 超时导致满屏报错
  - 仍然能产出真实的视角、盲点和验证动作

### Deep Dive

- 目标：拿更完整的多阶段结果
- 当前链路：
  - `dossier -> specialists -> synthesis -> refine`
- 特点：
  - 结果更完整
  - 依赖远端模型时延，速度明显慢于 Quick Scan
  - 某些阶段失败时会做降级，而不是整单中断

## 界面上现在能看到什么

- 当前阶段
- 阶段状态：`pending / running / completed`
- 当前提示文案
- 模型摘要 / 本地降级标记
- warning 列表
- 最新 pipeline

这部分是第一版重点补齐的能力，因为“让用户知道系统到底有没有在工作”本身就是产品体验的一部分。

## 本地启动

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 `.env.local`

```env
DEEPSEEK_API_KEY=your_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_CHAT_MODEL=deepseek-chat
DEEPSEEK_REASONING_MODEL=deepseek-reasoner
LLM_BALANCED_TIMEOUT_MS=60000
LLM_REASONING_TIMEOUT_MS=150000
PORT=5001
```

### 3. 启动前后端

```bash
npm run dev:full
```

也可以分开启动：

```bash
npm run dev
npm run dev:server
```

默认地址：

- 前端：`http://127.0.0.1:3000`
- 后端：`http://127.0.0.1:5001`

## 使用方式

1. 在“项目概览”页填写项目信息，或者直接导入项目包 / Markdown / TXT
2. 在“证据输入”页补充访谈、评测、设计摘要等证据
3. 点击：
   - `Quick Scan`
   - `Deep Dive`
4. 在右侧查看执行轨迹
5. 在建模 / 策略 / 报告页查看结果结构并继续推进

## 已实现的结果页结构

### 建模页

- 分视角判断
- 盲点
- 决策镜头
- personas
- hypotheses
- score bars

### 策略页

- strategies
- scenario variants
- second-order effects
- validation tracks
- contrarian moves
- unknowns

### 报告页

- final brief
- red team
- memory signals
- two-week actions

## 推演架构

### 1. Dossier

先把项目摘要和证据压成共享 dossier，供后续阶段复用。

### 2. Specialists

当前包含这些视角：

- 玩法系统
- 玩家心理
- 留存增长
- 市场定位
- 制作落地
- 反方拆解

### 3. Synthesis

把多视角结果收束成统一结果，而不是简单平均。

### 4. Refine

对最后结果做一轮收紧，减少空泛表达。

## API

当前已实现异步任务式分析接口：

- `POST /api/sandbox/analyze`
  - 创建推演任务
- `GET /api/sandbox/analyze/:jobId`
  - 轮询任务进度与结果

这也是前端“执行轨迹”面板的数据来源。

## 验证过的命令

当前已经跑过：

- `npm run typecheck`
- `npm run build`
- `npm test`

并且已经做过真实本地调用验证：

- 调用 `/api/sandbox/analyze`
- 轮询 job 状态
- 确认返回结构化结果与执行阶段信息

## 文档与示例

- 上传说明：[`docs/document-upload-guide.md`](./docs/document-upload-guide.md)
- Markdown 示例：[`examples/coop-camp-upload-sample.md`](./examples/coop-camp-upload-sample.md)
- JSON 示例：[`examples/project-bundle-upload-sample.json`](./examples/project-bundle-upload-sample.json)
- 产品 PRD：[`docs/specs/product-wind-tunnel-mvp-prd.md`](./docs/specs/product-wind-tunnel-mvp-prd.md)
- API / 数据结构：[`docs/specs/game-wind-tunnel-api-data-architecture.md`](./docs/specs/game-wind-tunnel-api-data-architecture.md)
- UI 设计规格：[`docs/specs/game-wind-tunnel-ui-design-spec.md`](./docs/specs/game-wind-tunnel-ui-design-spec.md)
- 后续路线：[`docs/next-phase-roadmap.md`](./docs/next-phase-roadmap.md)

## 当前边界

第一版已经能用，但还不是“最终产品形态”。

当前已知边界：

- `Deep Dive` 仍然受远端模型时延影响，速度明显慢于 Quick Scan
- `Quick Scan` 为了优先保证响应速度，目前 specialist 采用本地综合而不是全远端并发
- 轻量记忆当前是 JSON 文件存储，还没有做项目级检索与管理界面
- 结果结构已经完整，但结论质量仍然强依赖输入证据质量

## 参考与边界说明

本项目只参考了部分“多阶段推演 / 多代理协作”的高层方法，不复用任何第三方项目代码、界面、文案或 prompt。

参考项目：

- [MiroFish](https://github.com/666ghj/MiroFish)

边界说明：

- 只借鉴方法层面的启发
- 不复用代码
- 不复用 UI
- 不复用文案
- 不复用 prompt
- 明确避开 AGPL 代码级继承风险

