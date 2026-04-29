# Browser Use 豆包真实 Provider 跑通记录

## 结果

已使用 Browser Use 在当前页面跑通豆包真实 provider。结果为 `provider=doubao`，未进入 mock，未进入本地兜底，页面无错误。

## 测试环境

- 前端地址：`http://127.0.0.1:3002/?preflightCase=imagegen-dorm`
- 后端地址：`http://127.0.0.1:5001`
- provider：`.env.local` 中 `PREFLIGHT_PROVIDER=doubao`
- 模型：`doubao-seed-2-0-lite-260215`
- 超时：`DOUBAO_TIMEOUT_MS=150000`
- 图片：`public/preflight-fixtures/case-01-dorm-desk-cover-imagegen-provider.jpg`

## 测试步骤

1. 停止 5001 上的 mock 后端。
2. 使用 `node --env-file-if-exists=.env.local --import tsx server/index.ts` 重启后端。
3. 打开 `http://127.0.0.1:3002/?preflightCase=imagegen-dorm`。
4. 确认页面标题为 `KOC Growth Lab`，生成图已载入。
5. 点击 `开始传播推演`。
6. 等待豆包真实 provider 返回。
7. 检查结果区、provider 标识、兜底状态、页面错误和控制台错误。

## 验证结果

- 页面完成态：`传播发展推演已完成`，通过。
- provider 标识：`doubao` 可见，数量为 1。
- mock 标识：未出现。
- 本地兜底：未出现 `本地兜底`、`兜底结果`、`远端模型暂时不可用`。
- 增长模块：
  - `KOC 增长链路`
  - `内容方向`
  - `选题建议`
  - `发布策略`
  - `互动优化`
  - `账号成长`
  - `发布风险护栏`
- 页面错误：`.status-error = 0`。
- 控制台错误：`console error = 0`。
- 产品 UI 赛道词：未出现 `第五赛道`、`Track 05`、`扣题`、`赛道`。

## 观察

- 这次豆包链路最终成功，但耗时偏长：第一轮等待 60 秒仍在 33%，第二轮继续等待约 100 秒后完成。
- 说明真实 provider 可用，但录屏和比赛现场演示不建议完全依赖实时豆包返回；可以准备 mock 演示链路作为稳定备用。

## 结论

豆包真实 provider 可以跑通。当前主要风险不是功能失败，而是耗时偏长；后续可优化 prompt 长度、降低图片体积、增加前端更明确的“模型处理中”提示，或录屏时使用预生成结果。
