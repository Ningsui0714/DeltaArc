# KOC Growth Lab

[中文](./README.md) | [English](./README.en.md)

> 面向普通 KOC 的社媒 AI Agent。上传待发布内容后，AI 预演平台分发、评论区反应、涨粉机会和发布风险，并给出选题建议、发布策略、互动优化和账号成长动作。

## 现在它是什么

DeltaArc 当前主产品已经收敛为 **KOC Growth Lab**。它服务普通 KOC、校园创作者和小团队运营，让他们在真正发布前先看见内容可能吸引谁、被怎样误解、评论区会出现什么问题，以及下一条内容该怎么接。

核心体验只有一条主链路：

1. 选择社媒平台和增长目标
2. 粘贴 KOC 待发布正文 / 脚本
3. 上传封面、图文截图或视频关键帧
4. 点击推演，查看模拟评论区、人群分发、选题建议、发布策略、互动优化、账号成长计划和发布风险护栏

它不是通用聊天助手，也不是“帮你自动写爆款文案”的一键工具。它更像普通 KOC 的发布前增长沙盘，用来提前暴露：

- 这条内容的内容方向是否清楚
- 下一条选题和系列化方向是什么
- 标题、封面、发布时间和正文结构怎么改
- 评论区会出现什么追问、误解和关注信号
- 哪些用户最可能转粉，哪些反馈应该复盘
- 哪些表达可能带来商单误读、平台规则或舆情风险

## 本轮新增能力

- KOC 增长输出：内容方向、选题建议、发布策略、互动优化、账号成长、发布风险护栏
- 新主界面：轻量 KOC 发布编辑器，默认只填平台、增长目标、正文、图片
- 新后端链路：`preflight simulation` 异步 job，独立于旧 sandbox 分析
- 新模型接法：Doubao / 火山方舟多模态 provider，默认对齐 `doubao-seed-2-0-lite-260215`，走官方 `responses` API，支持图像输入；测试时用 deterministic mock provider
- 新推流模型：结果中固定包含 `core / broad / weak / misfire` 四类人群
- 新输出结构：图片理解、推流人群分布、模拟首批回复、增长动作、账号成长计划、发布风险护栏
- 新 CLI harness：JSON fixture + 本地图片路径，默认 mock provider，可做稳定回归

## 适合演示的默认案例

仓库内置了一套普通学生 KOC demo：

- 场景：学生 KOC 准备在小红书发布“99 元宿舍桌面改造”
- 目标：让用户收藏清单、评论桌面痛点、关注下一期宿舍改造系列
- 重点：AI 同时模拟核心粉、泛兴趣用户、弱相关路过用户和误推噪声，提前发现涨粉机会和翻车风险

## 技术结构

- 前端：`React 18` + `Vite` + `TypeScript`
- 后端：`Express` + `TypeScript`
- 多模态模拟：Doubao / 火山方舟 OpenAI-compatible chat completions
- 共享类型：`shared/preflightSimulation.ts`
- 新主页面：`src/pages/PreflightStudioPage.tsx`
- 新后端入口：`/api/preflight-simulations`
- CLI harness：`harness/run-preflight-harness.ts`

旧的 sandbox / impact scan 代码仍保留在仓库里，作为兼容层和历史能力，不再是默认主产品入口。校园提交检查能力只作为内部自检分支，不作为产品主体验。

## 参赛说明

本项目用于腾讯 PCG 校园 AI 产品创意大赛第五赛道提交。赛道信息只在提交材料、PDF 和录屏脚本中说明，产品界面本身按真实 KOC 增长工具来表达。

## 环境变量

复制 `.env.example` 到 `.env.local`，至少配置：

```env
PREFLIGHT_PROVIDER=doubao
DOUBAO_API_KEY=
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_TEXT_ENDPOINT_ID=
DOUBAO_VISION_ENDPOINT_ID=
DOUBAO_TEXT_MODEL=doubao-seed-2-0-lite-260215
DOUBAO_VISION_MODEL=doubao-seed-2-0-lite-260215
DOUBAO_TIMEOUT_MS=90000
PORT=5001
```

说明：

- `PREFLIGHT_PROVIDER=doubao`：前端和 API 主链路走豆包 / 方舟
- `PREFLIGHT_PROVIDER=mock`：本地演示或无 key 回归时走 mock provider
- 如果模型名直连返回 `InvalidEndpointOrModel.NotFound`，优先在火山方舟控制台创建“在线推理接入点”，然后把 `DOUBAO_TEXT_ENDPOINT_ID` / `DOUBAO_VISION_ENDPOINT_ID` 配进去；provider 会优先使用 endpoint id
- 旧 `DEEPSEEK_*` 变量仍保留给历史 sandbox 兼容链路，不参与新的 preflight simulation

## 本地开发

安装依赖：

```bash
npm install
```

前后端一起启动：

```bash
npm run dev:full
```

或分别启动：

```bash
npm run dev
npm run dev:server
```

默认地址：

- 前端：`http://127.0.0.1:3000`
- 后端：`http://127.0.0.1:5001`

生产构建：

```bash
npm run build
npm start
```

## CLI Harness

默认 fixture 回归：

```bash
npm run harness:preflight
```

更新 expected snapshot：

```bash
npm run harness:preflight:update
```

它会读取 `harness/fixtures/*.request.json`，把本地图片路径转成 base64，然后用 mock provider 跑完整模拟，再和 expected snapshot 比较。

## 常用命令

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run harness:preflight`
- `npm run verify:fixtures`

## API

### 新主链路

- `GET /api/health`
- `POST /api/preflight-simulations`
- `GET /api/preflight-simulations/:jobId`

### 旧兼容链路

- `POST /api/sandbox/analyze`
- `GET /api/sandbox/analyze/:jobId`
- `POST /api/sandbox/analyze/:jobId/retry`
- `GET /api/sandbox/workspaces/:workspaceId/...`

## 设计边界

- v1 不抓真实平台数据，也不接小红书 / 视频号官方评论 API
- v1 重点是“可解释的发布前反应模拟”，不是精确预测播放量
- 即使结果里有置信度，也只表示输入充分程度和模拟完整度，不代表真实流量承诺

## 参考说明

Doubao provider 采用火山方舟官方的 `responses` API 方式接入，图片通过 `input_image` + `image_url` 传入：

- [Volcengine Responses API 官方文档](https://www.volcengine.com/docs/82379/1783703)
- [Volcengine 结构化输出（beta）文档](https://www.volcengine.com/docs/82379/1958523)
- [Volcengine OpenAI 兼容接口说明](https://www.volcengine.com/docs/82379/1330626)
