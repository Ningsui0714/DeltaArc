# Docs Index

最近更新：2026-04-28 21:18:05

## 目录

- `plan/`：实施计划。
- `meeting/`：会议材料与纪要。
- `research/`：调研与对比。
- `spec/`：需求与规格拆解。
- `report/`：阶段报告与交付记录。
- `decision/`：决策记录。
- `release/`：发布记录。

## 最新记录

- `report/20260428211805127_大厂运营样例真实Provider页面信息报告.md`：新增 4 个品牌中立的大厂运营发布前预演样例和配图，覆盖电商返场、本地生活雨天履约、长视频新剧预约、企业 AI 纪要模板；BrowserUse 使用真实 `doubao` 在 `4100/4101` 逐个测试 4/4 通过，并为每次测试保存完整 `page-info.json` 与 `dom-snapshot.txt` 页面信息。
- `report/20260428193350346_真实Provider小红书样例复测通过报告.md`：将 quick 真实 provider 压缩为短草图输出并由服务端补齐结构，新增输出安全拦截重试和 JSON 截断短草图重试；BrowserUse 在 `4100/4101` 对 4 个小红书样例全部跑通真实 `doubao`，无 mock、无兜底、无失败。
- `report/20260428182735685_真实Provider端口复测与失败定位报告.md`：按闲置端口启动真实服务 `4100/4101`，确认最小豆包多模态探针 9 秒成功，但完整 Browser Use 页面推演仍进入兜底；记录两轮真实 provider 失败原因分别为 150 秒超时与 `fetch failed`，并明确不能把 mock 通过包装成真实通过。
- `report/20260428174820756_小红书样例改造与BrowserUse测试报告.md`：新增 4 个小红书发布前试映样例及配图，接入 `xhs-*` Browser Use 测试入口，修复预览作者名串场问题，并使用 mock provider 逐个跑通标题、封面、平台、目标、模拟评论、质量检查和发布风险护栏。
- `report/20260428172107400_Examples样例目录整理记录.md`：整理 `examples` 根目录散放样例，将导入样例移动到 `examples/imports/`，项目包样例移动到 `examples/project-bundles/`，并同步更新 `scripts/verify-fixtures.ts` 的 fixture 路径。
- `report/20260428171538510_Deep质量检测Agent实施记录.md`：将 Preflight `deep` 模式改为“基础推演 + 质量检测 Agent”两次 provider 调用，`quick` 保持单次快路径；质量 Agent 只合并 `qualityCheck`、`publishSafetyReview` 和 `warnings`，并同步修复 Prompt 审查指出的契约缺字段、`tier/comment` 双轨和 `evidenceSource` 空泛问题。
- `report/20260428170626787_豆包Prompt审查报告.md`：审查当前调用豆包的 Preflight prompt，确认角色、JSON-only、0-100 分制、固定人群覆盖和发布安全审查方向合理；同时指出 `resultJsonContract` 与运行时 schema 不完全一致，缺少 `contentRead`、`imageInsight`、`pushModel`、`confidence` 等字段，建议优先补齐契约或明确由服务端派生。
- `report/20260428170530205_API多次调用架构评估报告.md`：评估当前 API/Agent 调用架构，确认主产品 preflight simulation 仍是单 provider 大 JSON 调用，旧 sandbox 已具备多阶段编排；结论是多次调用可以提升质量，但应采用 `Evidence Pack -> Candidate x 3 -> Verifier -> Finalizer` 的质量路径，并保留 quick 单次调用快路径。
- `report/20260428165918262_模拟评论覆盖补齐修复记录.md`：修复真实豆包返回评论不足时混入旧 mock 评论的问题，要求豆包固定返回 8 条评论并覆盖 core/broad/weak/misfire；服务端改为按当前主题生成补齐评论并标注 `补齐模拟`，页面在存在补齐项时明确提示需人工复核；Browser Use 复测洛克王国世界案例无宿舍、收纳、桌面、学生等跨主题评论泄漏。
- `report/20260428164119141_洛克王国世界运营发布前模拟记录.md`：生成洛克王国世界主题发布前预演图，新增 `roco-world-launch` Browser Use 测试入口，并以大厂官方运营发帖口径填入标题、正文、脚本、目标人群和安全边界；真实豆包链路跑通，结果为质量 `70/100`、发布风险护栏 `65/100`，主要风险是 AI 图不可直接作为官方发布素材、需替换官方授权素材并核对所有公开信息口径。
- `report/20260428163210531_豆包评分十分制归一修复记录.md`：修复豆包把 `7/10` 口径输出成数字 `7` 后被页面显示为 `7/100` 的问题；新增评分字段专用归一化、prompt 约束和回归测试，Browser Use 复测真实豆包链路显示 `质量检查 70/100`、`发布风险护栏 80/100`，无 fallback、无 console error、无比赛字样泄漏。
- `report/20260428161205047_BrowserUse豆包真实Provider跑通记录.md`：使用 Browser Use 在当前页面跑通 `.env.local` 的豆包真实 provider，生成图输入成功，结果显示 `provider=doubao`，未进入 mock 或本地兜底，`KOC 增长链路` 与 `发布风险护栏` 等模块可见，页面错误和 console error 均为 0；观察到真实 provider 耗时偏长。
- `report/20260428155334250_产品界面去赛道化调整记录.md`：根据反馈移除产品 UI 中的 `第五赛道`、`Track 05`、`扣题`、`赛道` 等比赛感表达，改为自然产品话术 `KOC Social Growth Agent`、`KOC 增长链路` 和 `发布风险护栏`；README/英文 README 将参赛说明下沉到单独段落，并通过 typecheck、测试、build 与 Browser Use 复查。
- `report/20260428154131552_BrowserUse第五赛道扣题回归测试记录.md`：使用 Browser Use 打开当前项目专用 `3002` 前端地址和生成的宿舍桌面封面图，跑通 mock 推演，确认首屏第五赛道定位、生成图载入、`第五赛道扣题链路`、六个扣题模块、`接下来 3 条` 和 `发布风险护栏` 均可见；页面错误和 console error 均为 0。
- `report/20260428153042254_第五赛道扣题改造实施记录.md`：完成第五赛道 P0 扣题改造，新增 `growthBrief` 结构化输出，页面显式展示“内容方向、选题建议、发布策略、互动优化、账号成长、发布风险护栏”，默认下拉隐藏校园提交检查分支，README/英文 README 收敛为 `KOC Growth Lab`，并通过 typecheck、测试、构建、fixture、harness 与 audit。
- `plan/20260428151904175_第五赛道扣题改造方案.md`：给出按第五赛道提交的 P0/P1/P2 改造方案，要求主线收敛到 `KOC Growth Lab`，重做默认 KOC demo，按“内容方向、选题建议、发布策略、互动优化、账号成长、发布风险护栏”重排页面与 prompt，并补齐 PDF/录屏提交叙事。
- `report/20260428151507902_第五赛道符合度与提交风险评估.md`：对照比赛图片中的第五赛道与提交要求，评估当前项目符合度为 8/10；建议以 `KOC Growth Lab` 作为主提交叙事，把“大厂运营发布前暴雷预警”包装为 KOC 发布风险护栏，避免被误解成通用安全审查或校园提交工具。
- `report/20260428145817286_发布安全审查能力接入记录.md`：接入“大厂运营发布前暴雷预警”能力，新增 `publishSafetyReview` 发布闸门、红旗、复核 checklist、升级对象和必须修复项；覆盖 PCG 参赛提交、KOC 增长发布和通用品牌发布场景，并通过 typecheck、测试、构建、fixture、harness 与 audit。
- `report/20260428144236799_依赖安全与CI修复记录.md`：修复依赖安全告警，升级 Vite / React Vite 插件并将 `npm audit --audit-level=moderate` 清零；新增 GitHub Actions CI，覆盖安装、类型检查、测试、构建、fixture、preflight harness 和 audit。
- `report/20260428143538139_小红书预演交互增强测试记录.md`：完成小红书预演交互增强，评论标签中文化、手机底部操作栏和推荐回复插入评论区，并用 Browser Use 跑通宿舍桌面案例。
- `report/20260428143215378_DeltaArc项目评价报告.md`：完成 DeltaArc 当前项目评价，确认主链路可演示且 `typecheck/test/build/fixture/harness` 通过；同时标出 `npm audit` 安全依赖、CI 缺口、dirty worktree、内存 job store 和真实 provider 配置风险。
- `report/20260428112022669_PreflightP0修复与真实Provider验证记录.md`：修复 Preflight V2 的 JSON 残片外露、校园提交场景增长话术串台、低分结果缺少“必须补齐”提示；压紧 quick prompt 后用 Browser Use 复测宿舍与校园真实 provider，最终均跑通 `provider=doubao/no fallback`。
- `report/20260428104137710_BrowserUse真实Provider双案例复测记录.md`：用 Browser Use 连续跑校园 Demo 和宿舍增长两遍真实 provider 页面链路，均为 `completed/provider=doubao/no fallback`，记录实际输出、质量感受和发现的问题。
- `report/20260428103203895_Preflight输出结构V2实施记录.md`：落地 Preflight V2 输出结构，新增内容承诺、视觉读片、人群分发、评论细分、修改动作、风险复核、模拟指标和质量检查；接入真实 provider V2 prompt，并用 Browser Use 跑通宿舍与校园 Demo 双案例。
- `spec/20260427194449421_Preflight输出结构V2设计方案.md`：提出 Preflight 输出结构 V2，拆分内容承诺、视觉读片、人群分发、评论模拟、修改动作、风险复核、模拟指标和质量检查，并给出 V1 迁移、UI 映射与验收标准。
- `report/20260427192326004_真实Provider输出质量评估记录.md`：对 Ark 真实 provider 两条 imagegen 案例做输出质量评估，修复校园 Demo 推荐回复串台问题，并给出当前 7/10 的可用性判断与后续优化项。
- `report/20260427190550164_Ark真实Provider跑通记录.md`：写入本地 Ark key 后，修复 Responses API reasoning 超时问题，Browser Use 跑通 `provider=doubao` 的真实 imagegen 图片页面推演，并修复远端小数百分比归一化。
- `report/20260427184158990_真实Provider接入状态记录.md`：将本地服务切到 `doubao` 真实 provider 分支，Browser Use 验证不再走 mock，并记录当前因缺少 `DOUBAO_API_KEY/ARK_API_KEY` 进入 degraded 兜底。
- `report/20260427183811707_BrowserUse真实图片双案例页面测试记录.md`：新增 Browser Use 专用 `preflightCase` 自动化入口，使用 in-app browser 跑通两张 imagegen 真实图片的页面级推演流程并保存截图。
- `report/20260427182653198_imagegen真实图片双案例Preflight测试记录.md`：使用 `imagegen` skill 生成真实感宿舍桌面封面和 DeltaArc 产品 Demo 场景图，替换程序绘制测试图后重跑两个 preflight API 案例，并通过 `npm test` 116/116。
- `report/20260427181602019_生成图片双案例Preflight测试记录.md`：自生成宿舍桌面改造封面和校园 AI 产品 Demo 截图，跑通两个 preflight API 案例并保存结果摘要，Browser Use 确认前端初始态仍正确区分示例与真实结果。
- `report/20260427180948155_Preflight风险修复实现记录.md`：修复 preflight 旧轮询回写、示例数据与真实结果混淆、远端失败静默成功问题，新增 degraded/fallback 语义并通过 typecheck、测试、build、fixture、harness 与 Browser Use 回归。
- `report/20260427180031344_DeltaArc项目体检评价报告.md`：完成 DeltaArc 项目体检评价，确认当前可演示、验证链路通过，并标出远端 fallback 语义、任务限流、内存 job store、请求边界和前端轮询状态风险。
- `report/20260426222801448_发布前社媒预演器试做实现记录.md`：完成一版发布前社媒预演器试做，重构为素材输入、手机预览、模拟评论区和 AI 增长控制台，并通过 typecheck、测试、build 与 Browser Use 验证。
- `spec/20260426220553680_发布前社媒预演器设计方案.md`：将 KOC Growth Lab 从报告式推演改为小红书式发布前预演器，定义手机预览、模拟互动、评论区和增长控制台。
- `report/20260424162554382_BrowserUse手动上传完整推演测试记录.md`：用户手动上传本地封面后，使用 Browser Use 完成表单填写、点击推演、90 秒轮询和五模块结果验证。
- `report/20260424161357589_BrowserUse本地封面上传测试记录.md`：用 Browser Use 插件实测本地封面上传，确认插件当前不能自动填充 file input。
- `report/20260424153957809_封面内容BrowserUse测试记录.md`：用 Browser Use 测试“99元宿舍桌面改造”封面内容的表单推演链路，并记录聊天图片无法直接上传的限制。
- `report/20260424152225261_BrowserUse应用回归测试记录.md`：使用 Browser Use 测试 KOC Growth Lab 首屏、demo、真实推演、结果和清空流程。
- `report/20260424150624809_Ark多模态接入测试记录.md`：接入并验证火山 Ark Responses API，多模态 provider 与本地生产 API 均跑通。
- `report/20260424115606749_第五赛道KOCGrowthLab实现记录.md`：将应用纠偏为第五赛道作品本体 KOC Growth Lab，并记录实现、验证和本地服务状态。
- `spec/20260424113433545_第五赛道社媒增长Agent设计文档.md`：明确第五赛道作品方向，定义 KOC Growth Lab 与豆包多模态传播推演链路。
- `report/20260424111658113_BrowserUse应用测试报告.md`：Browser Use 测试当前本地应用，核心链路通过，并修复页面标题。
- `report/20260424111027650_校园AI大赛产品试映舱改造报告.md`：将当前产品改造为腾讯 PCG 校园 AI 产品创意大赛参赛提交前试映舱。
