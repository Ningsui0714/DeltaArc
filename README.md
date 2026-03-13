# 观变

[中文](./README.md) | [English](./README.en.md)

观变是一个面向游戏 / 互动产品设计的本地推演工作台。

当前仓库已经实现的是“项目分析工作台”骨架：输入项目和证据，发起正式分析，查看结构化判断、风险、时间线和报告。  
正在设计和逐步落地的是下一阶段能力：把第一次正式推理冻结成 `Baseline`，在其上注入 `Variable`，继续做前向观测和反向推理。

## 当前状态

### 已实现

- 项目摘要与证据录入
  - 手动填写项目概览
  - 导入 `.json` / `.md` / `.markdown` / `.txt`
  - 将结构化文件拆成 `project + evidence` 写入工作区
- 两种正式分析模式
  - `Quick Scan` 对应代码里的 `balanced`
  - `Deep Dive` 对应代码里的 `reasoning`
- 可视化执行轨迹
  - 展示当前阶段、阶段状态、模型信息、降级信息、warning
  - 用户可以轮询看到任务推进，而不是黑盒等待
- 结构化输出
  - `perspectives`
  - `blindSpots`
  - `scenarioVariants`
  - `futureTimeline`
  - `validationTracks`
  - `redTeam`
  - `report`
- 轻量记忆
  - 成功分析后会把摘要、主风险、盲点和验证重点写入 `server/data/sandbox-memory.json`
  - 后续相似项目会回收这些信号

### 正在设计 / 即将实现

- `Baseline` 冻结
  - 把第一次正式推理结果沉淀成可复用的世界状态
- `Variable` 注入
  - 把新玩法 / 系统改动 / 活动设计 / 商业化改动编译成结构化 delta
- 前向模拟
  - 基于 `baseline + variable + persona prototypes + rules` 观察后续演化
- 反向推理
  - 从结果倒查原因，或从目标倒推成立条件

更详细的设计请看：

- [变量沙盒系统设计](./docs/specs/game-wind-tunnel-variable-sandbox-system-design.md)
- [变量沙盒实现流程](./docs/specs/guanbian-variable-sandbox-implementation-flow.md)

## 技术栈

- 前端：`React 18` + `Vite` + `TypeScript`
- 后端：`Express` + `TypeScript` + `tsx`
- 共享层：`shared/` 下的领域模型、schema、请求/结果类型
- 运行方式：前端开发服务器 + 独立 API 服务；生产构建后由 Node 服务同时托管 API 和静态资源

## 目录结构

```text
.
├─ src/                             # 前端应用
│  ├─ api/                          # 对后端 API 的请求封装
│  ├─ components/
│  │  ├─ analysis/                  # 分析结果、执行态、时间线、预测图等面板
│  │  ├─ import/                    # 文件导入交互
│  │  ├─ layout/                    # 工作台头部与整体布局
│  │  ├─ project/                   # 项目信息编辑卡片
│  │  └─ ui/                        # 轻量 UI 组件
│  ├─ data/                         # 前端本地 mock / 静态数据
│  ├─ hooks/                        # project、evidence、analysis 状态管理
│  ├─ lib/
│  │  ├─ import/                    # JSON / Markdown 导入解析与归一化
│  │  ├─ agentStageMeta.ts          # 阶段元信息
│  │  ├─ jobProgress.ts             # 任务进度映射
│  │  └─ workflowSteps.ts           # 工作流步骤定义
│  ├─ pages/                        # overview / evidence / modeling / strategy / report
│  ├─ styles/                       # 全局样式、布局和页面样式
│  ├─ App.tsx                       # 工作台主入口
│  ├─ main.tsx                      # React 挂载入口
│  └─ types.ts                      # 前端步骤与页面侧类型
├─ server/                          # 后端服务
│  ├─ routes/
│  │  └─ sandbox.ts                 # /api/sandbox 分析接口
│  ├─ lib/
│  │  ├─ analysisJobStore.ts        # 内存态异步 job 存储
│  │  ├─ deepseekApi.ts             # LLM API 访问
│  │  ├─ deepseekClient.ts          # 推演入口封装
│  │  ├─ normalizeSandboxResult.ts  # 结果兜底与归一化
│  │  ├─ sandboxMemoryStore.ts      # JSON 记忆存储
│  │  └─ orchestration/             # 执行计划、prompt、fallback、阶段预览
│  ├─ data/
│  │  └─ sandbox-memory.json        # 轻量记忆数据
│  ├─ config.ts                     # 环境变量、超时、并发配置
│  └─ index.ts                      # Express 服务入口
├─ shared/                          # 前后端共享模型
│  ├─ domain.ts                     # Project / Evidence / Persona / Strategy 等领域对象
│  ├─ sandbox.ts                    # 分析任务、阶段、结果类型
│  └─ schema/                       # 请求/结果解析、校验、fallback
├─ docs/                            # 规格、上传说明、roadmap
│  ├─ specs/
│  ├─ document-upload-guide.md
│  └─ next-phase-roadmap.md
├─ examples/                        # 示例输入、请求、预期结果 fixture
│  ├─ requests/
│  ├─ expected/
│  ├─ coop-camp-upload-sample.md
│  └─ project-bundle-upload-sample.json
├─ scripts/                         # 开发辅助脚本
│  ├─ agent-utf8-bootstrap.ps1      # Windows PowerShell UTF-8 初始化
│  ├─ verify-fixtures.ts            # fixture 校验脚本
│  └─ write-server-package.mjs      # 构建后写入 dist-server/package.json
├─ dist/                            # 前端构建产物
└─ dist-server/                     # 后端构建产物
```

## 当前架构

### 前端工作台

- `src/App.tsx` 组织当前五个主阶段：`overview -> evidence -> modeling -> strategy -> report`
- `src/hooks/useProject.ts` 和 `src/hooks/useEvidence.ts` 负责工作区输入状态
- `src/hooks/useSandboxAnalysis.ts` 负责创建分析任务并轮询 job 结果
- `src/components/analysis/` 下的组件负责把执行进度和最终结果拆成不同面板展示

### 后端分析链路

- `server/routes/sandbox.ts`
  - 校验请求
  - 创建分析 job
  - 异步触发分析
  - 提供轮询接口
- `server/lib/orchestration/`
  - `executionPlan.ts`：根据模式生成执行计划
  - `runStage.ts`：执行单阶段 LLM 调用
  - `prompts/`：管理 dossier / specialist / synthesis / refine 的提示词构建
  - `fallback.ts`：远端阶段失败时的本地降级策略
  - `progressPreview.ts`：为前端生成阶段摘要预览

### 共享类型与 schema

- `shared/domain.ts` 定义项目、证据、persona、strategy 等领域对象
- `shared/sandbox.ts` 定义分析模式、阶段、job、结果结构
- `shared/schema/` 负责请求解析、结果归一化和运行时校验

## 当前运行时数据流

1. 前端把 `project + evidenceItems + mode` 提交到 `POST /api/sandbox/analyze`
2. 后端创建一个内存态 job，并立即返回 `202 Accepted`
3. 前端轮询 `GET /api/sandbox/analyze/:jobId`
4. 后端依次执行：
   - `dossier`
   - `specialists`
   - `synthesis`
   - `refine`
5. 每个阶段都会回写当前状态、模型、预览摘要和耗时
6. 成功结果返回给前端；如果分析是 `fresh`，还会写入 `server/data/sandbox-memory.json`

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local`，至少补上 `DEEPSEEK_API_KEY`：

```env
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_CHAT_MODEL=deepseek-chat
DEEPSEEK_REASONING_MODEL=deepseek-reasoner
LLM_BALANCED_TIMEOUT_MS=60000
LLM_REASONING_TIMEOUT_MS=150000
LLM_BALANCED_SPECIALIST_CONCURRENCY=3
LLM_REASONING_SPECIALIST_CONCURRENCY=4
LLM_ENABLE_REASONING_REFINE_STAGE=false
PORT=5001
```

### 3. 启动开发环境

同时启动前后端：

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

### 4. 构建与启动生产包

```bash
npm run build
npm start
```

说明：

- `npm run build:client` 会生成 `dist/`
- `npm run build:server` 会生成 `dist-server/`
- `server/index.ts` 在检测到 `dist/` 存在时，会顺带托管前端静态资源

## 常用脚本

- `npm run dev`：启动 Vite 前端开发服务器
- `npm run dev:server`：启动 Express API 服务
- `npm run dev:full`：并行启动前后端
- `npm run build`：构建前端和后端
- `npm start`：运行 `dist-server/server/index.js`
- `npm run typecheck`：检查前后端 TypeScript
- `npm test`：运行导入解析、memory store、schema 相关测试
- `npm run verify:fixtures`：校验 `examples/` 下的请求样例、导入样例和预期结果 fixture
- `npm run preview`：预览前端构建结果

## 当前 API

- `GET /api/health`
  - 健康检查
- `POST /api/sandbox/analyze`
  - 创建正式分析任务
- `GET /api/sandbox/analyze/:jobId`
  - 查询任务进度与最终结果

## 文档与示例

- [English README](./README.en.md)
- [上传说明](./docs/document-upload-guide.md)
- [产品 PRD](./docs/specs/product-wind-tunnel-mvp-prd.md)
- [API / 数据结构](./docs/specs/game-wind-tunnel-api-data-architecture.md)
- [变量沙盒系统设计](./docs/specs/game-wind-tunnel-variable-sandbox-system-design.md)
- [变量沙盒实现流程](./docs/specs/guanbian-variable-sandbox-implementation-flow.md)
- [UI 设计规格](./docs/specs/game-wind-tunnel-ui-design-spec.md)
- [路线图](./docs/next-phase-roadmap.md)
- [Markdown 导入示例](./examples/coop-camp-upload-sample.md)
- [JSON 导入示例](./examples/project-bundle-upload-sample.json)
- [请求样例](./examples/requests/valid-analysis-request.json)
- [结果样例](./examples/expected/degraded-analysis-result.json)

## Windows / PowerShell 提示

仓库里有中文源码、文档和 fixture。PowerShell 下如果出现乱码，先执行：

```powershell
& "$PWD\scripts\agent-utf8-bootstrap.ps1"
```

再用 `Get-Content -Encoding utf8` 读取文件，避免把控制台乱码误判成文件损坏。

## 当前边界

- 远端分析依赖 DeepSeek 配置，未配置 `DEEPSEEK_API_KEY` 时无法拿到正式结果
- `Quick Scan` 和 `Deep Dive` 共用同一套异步 job 机制，但执行计划与耗时不同
- 任务状态目前是内存态，不适合作为持久队列
- 记忆存储目前是单个 JSON 文件，项目级 `Baseline / Variable / Simulation` 仓还在设计和实现中
- 测试覆盖的是核心解析与归一化链路，不是完整端到端回归
