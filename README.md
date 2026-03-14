# 观变

[中文](./README.md) | [English](./README.en.md)

> 把模糊的玩法点子，推进成可验证的设计决策。

观变不是一个普通的项目看板，不是聊天玩具，也不是“一键生成一篇看起来很完整的报告”。

它是一台面向游戏 / 互动产品设计的本地推演工作台：  
先把项目和证据喂进去，跑一次正式分析，冻结成基线，再往这条基线上注入一个新变量，观察它先改写什么、会放大什么风险、要先补什么护栏。

你可以把一个还很模糊的玩法念头、系统改动、活动方案或商业化想法，推进成一条清晰的决策链：

> 输入项目与证据 -> 跑正式分析 -> 冻结为基线 -> 注入一个新变量 -> 拿到直接影响、风险、护栏和验证动作

它想解决的不是“这个点子听起来酷不酷”，而是更难也更真实的几个问题：

- 这个想法现在值不值得继续做
- 如果要做，最先会撞到什么风险
- 哪些护栏要先补，哪些验证该先跑
- 我该先做原型、先补教学，还是先停下来收缩范围

当前仓库已经不只是“分析工作台骨架”，而是已经具备第一条变量沙盒闭环：  
项目录入、正式分析、基线冻结、轻量变量注入、影响扫描和结果回看都已经可以在现有工作流里跑通。

## 为什么它可能值得你在意

- 它不是从空白 prompt 重新脑补项目，而是先冻结一份正式结果，再在这份基线上继续试变量。
- 它不只给“结论”，还会把过程拆成阶段、状态、告警和历史结果，减少黑盒感。
- 它不是泛泛聊创意，而是专门服务“玩法 / 系统 / 活动 / 商业化改动到底先影响哪里”。
- 它是本地优先的，更适合带着私有设计文档、试玩记录和内部判断反复试。

## 30 秒看懂

- 面向对象：游戏策划、系统设计、互动产品方向判断
- 当前最强场景：对一个玩法 / 系统点子做第一轮“该不该继续”的结构化判断
- 当前工作流：`overview -> evidence -> inference desk -> modeling -> strategy -> report -> sandbox`
- 当前形态：本地优先、三段式工作流（输入与导入 -> 推理台 -> 结果输出）、结果和基线可持久化
- 下一阶段：多变量联动、分支模拟、反向推理、历史对比

## 一个最典型的使用方式

假设你正在做一个合作向玩法原型，心里有个改动：

> “在中段加入必须双人配合才能通过的限时机关，看看能不能抬高合作记忆点和传播性。”

在观变里，你可以这样走：

1. 导入项目包、设计稿、试玩观察和竞品证据。
2. 跑一次正式分析，先看当前版本的核心乐趣、学习成本、主要风险和验证建议。
3. 把这次正式结果冻结成一份 `baseline`。
4. 把“限时双人机关”作为一个变量注入进去。
5. 拿到一轮 impact scan，看到它首先改写了哪些位置：
   - 合作高光是不是更强了
   - 单人玩家是不是更容易被惩罚
   - 教学和补位机制是不是必须先补
   - 这个变量到底值得原型，还是应该先收缩

这就是观变当前最有价值的地方：

- 不是替你拍脑袋决定方向
- 而是帮你更早看见“这个改动最先会怎么出问题”

## 当前状态

### 现在已经能直接用的

- 项目与证据工作台
  - 手动填写项目概览
  - 导入 `.json` / `.md` / `.markdown` / `.txt`
  - 将结构化文件拆成 `project + evidence` 写入工作区
- 两种正式分析模式
  - 快速扫描，对应代码里的 `balanced`
  - 深度推演，对应代码里的 `reasoning`
- 工作区恢复与重试
  - 会按工作区持久化最新正式分析
  - 可以恢复最新活跃 job
  - 对可恢复失败阶段提供 resume / retry
- 可视化执行过程
  - 展示当前阶段、阶段状态、模型信息、降级结果和告警
  - 用户可以轮询看到任务推进，而不是黑盒等待
- 结构化正式输出
  - `perspectives`
  - `blindSpots`
  - `scenarioVariants`
  - `futureTimeline`
  - `validationTracks`
  - `redTeam`
  - `report`
- 基线冻结
  - 可以把最新正式分析冻结成可复用的基线
  - 基线会持久化到本地，不依赖内存任务继续存在
- 变量沙盒第一条闭环
  - 在 `Variable Sandbox` 里直接输入一个新想法
  - 系统先自动补一版结构化变量草稿
  - 发起一次变量影响扫描，拿到直接影响、受影响人群、护栏和验证建议
  - 可以恢复最近未完成的扫描，并回看已保存结果
- 持久化真相源
  - 最新正式分析、冻结基线、变量和影响扫描结果都可以落盘
  - 成功分析的关键信号也会写入 `server/data/sandbox-memory.json`

### 下一阶段最值得做的

- 多变量联动，而不是一次只看 1 个变量
- 分支模拟和回合推进，而不只是一轮影响扫描
- 反向推理，从目标结果倒推成立条件
- 基线库 / 变量库 / 历史对比界面

仓库对外保留的是使用说明、路线图、示例数据和实现代码。  
详细设计文档统一只在本地 `docs/specs/` 维护，并通过 `.gitignore` 排除，不随 GitHub 仓库发布；真正的运行态项目数据同样只保存在本地 `server/data/projects/`。

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
│  │  ├─ ui/                        # 轻量 UI 组件
│  │  └─ variableSandbox/           # 变量编辑、影响扫描、护栏面板
│  ├─ data/                         # 前端本地 mock / 静态数据
│  ├─ hooks/                        # project、analysis、baseline、scan 状态管理
│  ├─ lib/
│  │  ├─ import/                    # JSON / Markdown 导入解析与归一化
│  │  ├─ jobProgress.ts             # 任务进度映射
│  │  └─ workflowSteps.ts           # 工作流步骤定义
│  ├─ app/                          # 工作区编排与页面内容组织
│  ├─ pages/                        # overview / evidence / modeling / strategy / report / variable sandbox
│  ├─ styles/                       # 全局样式、布局和页面样式
│  ├─ App.tsx                       # 工作台主入口
│  ├─ main.tsx                      # React 挂载入口
│  └─ types.ts                      # 前端步骤与页面侧类型
├─ server/                          # 后端服务
│  ├─ routes/
│  │  ├─ sandbox.ts                 # /api/sandbox 路由入口
│  │  └─ sandbox/                   # analysis / workspace / impact-scan handlers
│  ├─ lib/
│  │  ├─ analysisJobStore.ts        # 内存态异步 job 存储
│  │  ├─ impactScanJobStore.ts      # 变量影响扫描 job 存储
│  │  ├─ projectTruthStore.ts       # 最新分析、基线与扫描结果持久化
│  │  ├─ variableImpactScan.ts      # 变量影响扫描逻辑
│  │  └─ orchestration/             # 执行计划、prompt、fallback、阶段预览
│  ├─ data/
│  │  └─ sandbox-memory.json        # 轻量记忆数据
│  ├─ config.ts                     # 环境变量、超时、并发配置
│  └─ index.ts                      # Express 服务入口
├─ shared/                          # 前后端共享模型
│  ├─ domain.ts                     # Project / Evidence / Persona / Strategy 等领域对象
│  ├─ sandbox.ts                    # 分析任务、阶段、结果类型
│  ├─ variableSandbox.ts            # 基线与变量沙盒协议
│  └─ schema/                       # 请求/结果解析、校验、fallback
├─ docs/                            # 上传说明、路线图与提质方案
│  ├─ document-upload-guide.md
│  ├─ first-stage-analysis-quality-plan.md
│  ├─ next-phase-roadmap.md
│  └─ ...
├─ examples/                        # 示例输入、请求、基线、变量与扫描 fixture
│  ├─ baselines/
│  ├─ impact-scans/
│  ├─ requests/
│  ├─ variables/
│  ├─ expected/
│  ├─ coop-camp-upload-sample.md
│  ├─ project-bundle-upload-sample.json
│  └─ yihuan-project-bundle.json
├─ scripts/                         # 开发辅助脚本
│  ├─ agent-utf8-bootstrap.ps1      # Windows PowerShell UTF-8 初始化
│  ├─ verify-fixtures.ts            # fixture 校验脚本
│  └─ write-server-package.mjs      # 构建后写入 dist-server/package.json
├─ dist/                            # 前端构建产物
└─ dist-server/                     # 后端构建产物
```

## 当前架构

### 前端工作台

- `src/app/` 负责三段式工作流编排：输入与导入、推理台、结果输出
- `src/app/useWorkspaceController.ts` 负责工作区状态、新鲜度和页面级动作编排
- `src/hooks/useProject.ts` 和 `src/hooks/useEvidence.ts` 负责项目与证据输入
- `src/hooks/useSandboxAnalysis.ts` 负责创建正式分析任务、恢复最新活跃 job，并轮询结果
- `src/hooks/useBaselineLibrary.ts` 负责读取最新正式分析和已冻结基线
- `src/hooks/useVariableImpactScan.ts` 负责发起、恢复并轮询变量影响扫描，以及读取历史结果
- `src/pages/VariableSandboxPage.tsx` 是独立的第 5 步变量推演页面
- `src/components/analysis/` 和 `src/components/variableSandbox/` 共同承接正式分析结果与变量沙盒结果展示

### 后端分析链路

- `server/routes/sandbox.ts` 负责组装分析、工作区和 impact scan 路由
- `server/routes/sandbox/analysisHandlers.ts`
  - 创建正式分析 job
  - 提供轮询
  - 支持可恢复阶段重试
  - 提供最新活跃 job / 最新可恢复 job 查询
- `server/routes/sandbox/workspaceHandlers.ts`
  - 提供最新正式分析、基线列表 / 读取 / 冻结
  - 支持清空工作区运行数据
- `server/routes/sandbox/impactScanHandlers.ts`
  - 创建变量影响扫描 job
  - 提供 latest-open / history / 单次结果读取
- `server/lib/orchestration/`
  - `executionPlan.ts`：根据模式生成执行计划
  - `runStage.ts`：执行单阶段 LLM 调用
  - `prompts/`：管理 dossier / specialist / synthesis / refine 的提示词构建
  - `fallback.ts`：远端阶段失败时的本地降级策略
  - `progressPreview.ts`：为前端生成阶段摘要预览
- `server/lib/projectTruthStore.ts`
  - 持久化最新正式分析
  - 冻结基线
  - 按工作区保存变量与影响扫描结果

### 共享类型与 schema

- `shared/domain.ts` 定义项目、证据、persona、strategy 等领域对象
- `shared/sandbox.ts` 定义分析模式、阶段、job、结果结构
- `shared/variableSandbox.ts` 定义基线、变量、影响扫描 job 和结果类型
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
6. 成功结果返回给前端，并按工作区写入 `server/data/projects/<workspaceId>/latest-analysis.json`
7. 如果分析是 `fresh`，关键信号还会写入 `server/data/sandbox-memory.json`

### 变量推演数据流

1. 前端从最新正式分析里冻结一份基线
2. 用户在 `Variable Sandbox` 中输入一个新点子，系统先补一版结构化变量草稿
3. 前端把 `baselineId + variable + mode` 提交到变量推演接口
4. 后端读取冻结基线，执行一轮 impact scan
5. 结果会返回给前端，同时把变量和扫描结果写入 `server/data/projects/<workspaceId>/variables/` 与 `impact-scans/`
6. 前端再次打开同一基线时，可以恢复最近未完成的 scan 或读取已保存历史

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
- `npm test`：运行导入、工作区状态、job store、orchestration、truth store、变量沙盒和 schema 测试
- `npm run verify:fixtures`：校验 `examples/` 下的请求样例、导入样例和预期结果 fixture
- `npm run preview`：预览前端构建结果

## 当前 API

### 正式分析

- `GET /api/health`
  - 健康检查
- `POST /api/sandbox/analyze`
  - 创建正式分析任务
- `GET /api/sandbox/analyze/:jobId`
  - 查询任务进度与最终结果
- `POST /api/sandbox/analyze/:jobId/retry`
  - 从可恢复阶段继续重试

### 真相源 / 基线

- `GET /api/sandbox/workspaces/:workspaceId/latest-analysis`
  - 读取当前工作区最新正式分析
- `GET /api/sandbox/workspaces/:workspaceId/latest-active-job`
  - 读取当前工作区最近一个仍在运行的正式分析 job
- `GET /api/sandbox/workspaces/:workspaceId/latest-retryable-job`
  - 读取当前工作区最近一个可恢复重试的正式分析 job
- `GET /api/sandbox/workspaces/:workspaceId/baselines`
  - 列出当前工作区所有冻结基线
- `GET /api/sandbox/workspaces/:workspaceId/baselines/:baselineId`
  - 读取单个冻结基线
- `POST /api/sandbox/workspaces/:workspaceId/baselines`
  - 把最新正式分析冻结成基线
- `DELETE /api/sandbox/workspaces/:workspaceId`
  - 清空当前工作区的本地运行数据

### 变量推演

- `GET /api/sandbox/workspaces/:workspaceId/impact-scans/latest-open`
  - 读取某个基线最近一个未完成的 impact scan
- `GET /api/sandbox/workspaces/:workspaceId/impact-scans`
  - 列出当前工作区或某个基线下已保存的 impact scan 结果
- `POST /api/sandbox/workspaces/:workspaceId/impact-scans`
  - 基于 `baseline + variable` 发起一轮变量影响扫描
- `GET /api/sandbox/workspaces/:workspaceId/impact-scans/:jobId`
  - 查询变量推演进度和最终结果

## 文档与示例

- [English README](./README.en.md)
- [上传说明](./docs/document-upload-guide.md)
- [第一阶段正式分析提质方案](./docs/first-stage-analysis-quality-plan.md)
- [路线图](./docs/next-phase-roadmap.md)
- [AI 重构清单](./docs/ai-coding-refactor-checklist.md)
- [Markdown 导入示例](./examples/coop-camp-upload-sample.md)
- [JSON 导入示例](./examples/project-bundle-upload-sample.json)
- [额外项目包示例](./examples/yihuan-project-bundle.json)
- [基线 fixture](./examples/baselines/valid-frozen-baseline.json)
- [变量 fixture](./examples/variables/valid-design-variable-v1.json)
- [影响扫描请求 fixture](./examples/impact-scans/valid-impact-scan-request.json)
- [影响扫描结果 fixture](./examples/impact-scans/valid-impact-scan-result.json)
- [请求样例](./examples/requests/valid-analysis-request.json)
- [结果样例](./examples/expected/degraded-analysis-result.json)

说明：

- 详细设计文档与方案草图统一只在本地 `docs/specs/` 维护，不随 GitHub 仓库发布。
- 运行态工作区数据仍然只保存在本地 `server/data/projects/`，默认不提交。

## Windows / PowerShell 提示

仓库里有中文源码、文档和 fixture。PowerShell 下如果出现乱码，先执行：

```powershell
& "$PWD\scripts\agent-utf8-bootstrap.ps1"
```

再用 `Get-Content -Encoding utf8` 读取文件，避免把控制台乱码误判成文件损坏。

## 当前边界

- 远端分析依赖 DeepSeek 配置，未配置 `DEEPSEEK_API_KEY` 时无法拿到正式结果
- 快速扫描和深度推演共用同一套异步 job 机制，但执行计划与耗时不同
- 正式分析和影响扫描的 job 状态目前仍是内存态，不是持久队列
- 当前变量沙盒已经跑通第一条闭环；二阶段三分支模拟已有实施文档，但尚未落成代码
- 测试覆盖的是核心解析、工作区状态、job store、编排、存储和 fixture 链路，不是完整端到端回归
