# 第一阶段正式分析提质方案

更新时间：2026-03-14

本文只讨论第一阶段正式分析链路，不调整第二阶段变量沙盒/沙盘推演设计。

## 1. 背景与结论

当前第一阶段的核心问题，不是“模型不够聪明”这么简单，而是：

1. 原始项目与证据过早被压缩成 `dossier`，后续阶段主要在消费二手摘要。
2. 链路较长，`dossier -> specialists -> synthesis -> refine` 会放大前序阶段的信息损耗。
3. 最终 schema 过肥，模型容易优先“把结构填满”，而不是优先提高判断质量。
4. 目前更像“多阶段结构化流水线”，而不是“能制造高质量分歧、再通过验证筛选”的质量系统。

基于 2024-2025 的近两年论文，建议把第一阶段改成：

`Grounding -> Candidate Analysis x N -> Verifier -> Reverse Check -> Finalizer`

其中：

- `Grounding` 只抽取事实、约束、未知项和张力，不下最终结论。
- `Candidate Analysis x N` 生成多份候选分析，而不是押注单条推理链。
- `Verifier` 独立核查每份候选的证据支撑、约束一致性、行动性与矛盾处理。
- `Reverse Check` 对入选候选做“结论倒推条件”的反向核验。
- `Finalizer` 最后才展开为前端需要的正式结果结构。

一句话概括：第一阶段要从“长链路生成系统”升级成“候选生成 + 验证选择系统”。

## 2. 设计目标

### 2.1 主要目标

1. 提高最终结论的可信度与可解释性。
2. 降低无证据支撑结论、空泛建议、伪具体化的比例。
3. 让“下一步该做什么”更具体、更可执行。
4. 降低同一输入多次运行时的结果漂移。

### 2.2 非目标

1. 不改第二阶段变量沙盒的整体产品设计。
2. 不引入训练、蒸馏或 RL 作为第一步。
3. 不先追求更多 agent 或更复杂的辩论回合。
4. 不一次性重写前后端全部协议。

## 3. 研究依据

近两年的论文给出的信号比较一致：

1. **不要高估自校验。** Hong et al. (NAACL 2024) 指出，LLM 对自身推理错误的识别能力有限，不能把单纯 `self-check` 当作稳定兜底。[1]
2. **验证要围绕关键条件，而不是泛泛复读。** Wu et al. (EMNLP 2024) 证明，以关键条件为中心的验证更能帮助自纠。[2]
3. **多 agent 不是天然提质。** Wang et al. (ACL 2024) 发现，强 prompt 的单 agent 在很多任务上已经接近最优的多 agent 讨论；多 agent 只在能引入真实分歧时更有价值。[3]
4. **辩论有用，但前提是真分歧。** Liang et al. (EMNLP 2024) 强调，多 agent debate 的价值在于防止思路退化和引入新的思考方向，而不是角色越多越好。[4]
5. **测试时搜索值得投入。** Bi et al. (ICML 2025) 展示了 inference-time tree search / test-time compute 对复杂推理的显著帮助，说明“多候选 + 选择”是合理方向。[5]
6. **中间步骤要持续回看前文，而不是一路往前冲。** Wang et al. (EMNLP 2025) 说明 stepwise informativeness search 和 self-grounding 能减少中途跑偏、冗余和遗忘前文的问题。[6]
7. **反向推理值得单列阶段。** Yuan et al. (ACL 2025) 说明 reverse reasoning 能强化泛化与条件核验能力。[7]
8. **硬约束最好形式化。** Hao et al. (NAACL 2025) 展示了在复杂约束规划中，形式化约束 + 外部验证器远强于“让模型自己想”。[8]
9. **验证器可以是独立能力，不只是 judge prompt。** Liu et al. (EMNLP 2025) 提出专门 verifier 的路线，强调鲁棒、跨域、可复用的输出验证。[9]
10. **开放式生成也能做 step-level 验证。** Wang et al. (EMNLP 2025) 在临床 note 生成任务上证明，过程监督/逐步验证不只适用于数学和代码。[10]

这些结论合起来，正好指向本仓库更适合的方向：少一点“角色表演”，多一点“候选、核验、筛选、倒推”。

## 4. 当前链路的主要问题

结合当前仓库实现，第一阶段的问题可以落到下面几处：

1. `dossierStage` 已经承担了太多信息压缩与判断工作。
2. `specialist` 主要使用 `PROJECT + DOSSIER`，原始 evidence 没有在后续关键阶段被持续引用。
3. `synthesis` 更像补字段与汇总，不像真正纠错。
4. `refine` 更像润色，不像质量门。
5. 当前结果类型过大，导致模型和 normalize 层都优先服务“结构完整”。

因此，V2 的关键不是“让每一层更聪明”，而是“减少信息丢失，并且把质量判断显式化”。

## 5. 目标架构

### 5.1 总体流程

```text
Input Normalize
  -> Grounding
  -> Candidate Analysis x 3~5
  -> Verifier
  -> Reverse Check
  -> Finalizer
  -> SandboxAnalysisResult
```

### 5.2 阶段定义

#### A. Grounding

职责：

- 从 `project + evidenceItems + memory` 中抽取原子事实、约束、未知项、冲突点。
- 给每条事实绑定 `evidenceIds`。
- 不输出最终结论，不输出策略列表，不输出未来时间线。

建议输出：

```ts
type GroundingPack = {
  facts: Array<{
    id: string;
    statement: string;
    dimension: 'core_loop' | 'audience' | 'retention' | 'social' | 'monetization' | 'production' | 'market' | 'other';
    evidenceIds: string[];
    confidence: 'explicit' | 'inferred';
  }>;
  constraints: string[];
  unknowns: string[];
  tensions: string[];
  missingCriticalEvidence: string[];
};
```

设计原则：

- 只保留一手信息压缩，不在这一阶段做“像结论的结论”。
- `confidence='inferred'` 的内容必须显式标注，避免推断冒充事实。

#### B. Candidate Analysis x 3~5

职责：

- 基于同一份 `GroundingPack` 生成多份候选 memo。
- 每份 memo 都必须回答同一组问题：
  - 值不值得继续
  - 主要风险是什么
  - 当前最关键的验证动作是什么
  - 哪些前提尚未被证据支持

建议输出：

```ts
type CandidateAnalysisMemo = {
  id: string;
  verdict: 'continue' | 'narrow' | 'pause';
  summary: string;
  decisiveEvidence: Array<{
    claim: string;
    evidenceIds: string[];
  }>;
  primaryRisk: string;
  nextExperiment: string;
  requiredConditions: string[];
  openQuestions: string[];
  unsupportedAssumptions: string[];
};
```

建议生成方式：

1. `candidate_a`: balanced memo
2. `candidate_b`: conservative / skeptic memo
3. `candidate_c`: feasibility-first memo
4. 深度模式可额外增加 `counterfactual` 与 `market-first` 两份

注意：

- 这里的多候选不等于“六个 specialist 全开”。
- 候选之间的差异应该来自判断角度和风险偏好，而不是字段命名不同。

#### C. Verifier

职责：

- 对每个候选 memo 独立打分并给出阻断项。
- 不负责重写内容，先负责“判是否站得住”。

建议评分维度：

```ts
type VerificationReport = {
  candidateId: string;
  evidenceSupportScore: number;      // 0-100
  constraintComplianceScore: number; // 0-100
  actionabilityScore: number;        // 0-100
  contradictionHandlingScore: number;// 0-100
  unsupportedClaims: string[];
  missedConstraints: string[];
  vagueActions: string[];
  blockingIssues: string[];
  keep: boolean;
};
```

Verifier 的判断规则：

1. 关键结论必须带 `evidenceIds`。
2. 明显违背制作约束/目标人群/输入边界的候选直接降权或淘汰。
3. “建议做更多验证”这类空泛动作应判为低行动性。
4. 对 `inferred` 事实依赖过重的候选要明确扣分。

#### D. Reverse Check

职责：

- 对排名最高的 1-2 份候选做反向核验。
- 问法不是“你对吗”，而是“如果你对，必须满足哪些条件；这些条件当前满足了几条”。

建议输出：

```ts
type ReverseCheckReport = {
  candidateId: string;
  necessaryConditions: Array<{
    condition: string;
    status: 'supported' | 'uncertain' | 'unsupported';
    evidenceIds: string[];
  }>;
  fragilitySummary: string;
  revisedVerdict?: 'continue' | 'narrow' | 'pause';
};
```

这个阶段的目标不是产出更多花哨文本，而是把候选 memo 的“成立边界”说清楚。

#### E. Finalizer

职责：

- 从经过验证的最佳候选出发，补齐前端展示需要的结果结构。
- `futureTimeline / communityRhythms / trajectorySignals` 只在 deep 模式补齐。
- 如果验证分数不够，不要硬凑完整结果，宁可显式标注“不确定”。

关键原则：

1. `Finalizer` 不再承担主要推理责任。
2. `Finalizer` 只负责“展开”，不负责“拍板”。

## 6. 与当前仓库的映射

### 6.1 保留的部分

1. `shared/schema/` 的入参与结果 normalize 体系继续保留。
2. `analysis job + progress + checkpoint` 机制继续保留。
3. 前端 `Quick Scan / Deep Dive` 的入口语义继续保留。
4. 第二阶段 baseline 冻结与变量推演接口不变。

### 6.2 重构建议

建议把当前链路：

```text
dossierStage
specialistStage
synthesis
refine
```

调整成：

```text
groundingStage
candidateStage
verificationStage
reverseCheckStage
finalizeStage
```

建议文件落点：

```text
server/lib/orchestration/
  groundingStage.ts
  candidateStage.ts
  verificationStage.ts
  reverseCheckStage.ts
  finalizeStage.ts
  prompts/
    grounding.ts
    candidate.ts
    verification.ts
    reverseCheck.ts
    finalize.ts
```

### 6.3 现有文件的处理建议

1. `server/lib/orchestration/dossierStage.ts`
   - 保留其中的输入整理思路。
   - 把“结论性 dossier”收缩成“GroundingPack”。

2. `server/lib/orchestration/specialistStage.ts`
   - 不再作为默认主流程。
   - 可以保留一个极简版本，仅在 deep 模式下产出 2-3 份差异化候选。

3. `server/lib/orchestration/postStages.ts`
   - 当前的 synthesis/refine 逻辑拆成 `verification + reverseCheck + finalize`。

4. `server/lib/orchestration/prompts/*.ts`
   - prompt 应从“填满大 schema”改成“围绕阶段目标输出最小必要结构”。

5. `shared/sandbox.ts`
   - 前端最终结果结构可先保持兼容。
   - 中间结构优先放到服务端内部类型，不急着全部暴露到前端。

## 7. Quick Scan / Deep Dive 的差异

### Quick Scan

建议流程：

`Grounding -> Candidate x3 -> Verifier -> Finalizer`

特点：

- 不做长时间线展开。
- 目标是给出第一轮可靠判断、主要风险、下一步实验。
- 更强调低延迟和高信号。

### Deep Dive

建议流程：

`Grounding -> Candidate x5 -> Verifier -> Reverse Check -> Finalizer`

特点：

- 在 Quick Scan 的基础上增加反向核验。
- 可以补全未来演化和更完整的报告视图。
- 更适合输入完整、需要更强论证的场景。

## 8. 质量门与指标

V2 应新增一套显式质量指标，而不是只看“有没有返回 JSON”。

### 8.1 离线指标

1. `unsupported_claim_rate`
   - 最终结论中没有证据支撑的 claim 占比

2. `evidence_citation_coverage`
   - 核心结论、主风险、下一步动作中带 `evidenceIds` 的比例

3. `actionability_score`
   - 人工评估下一步动作是否具体、可执行、可在两周内落地

4. `rerun_variance`
   - 同一输入多次运行时，`verdict / primaryRisk / nextExperiment` 的波动情况

5. `degraded_visible_rate`
   - 降级结果是否被正确标注，而不是伪装成正常高质量结果

### 8.2 人工评审 rubric

建议每个 case 按 1-5 分打分：

1. 是否明显抓住了真正关键矛盾
2. 是否比普通总结更有决策价值
3. 是否明确指出了当前证据边界
4. 是否给出了可执行的下一步
5. 是否减少了“看起来很完整但其实没说到点上”的感觉

## 9. 最小落地顺序

### Phase 1：先把 Grounding 做硬

目标：

- 引入 `evidenceIds`
- 把事实、约束、未知项从结论里剥离出来

优先级最高，因为这是后续验证器能不能成立的前提。

### Phase 2：引入 Candidate + Verifier

目标：

- 替代当前 `specialists + synthesis` 的默认主链
- 让系统开始具备“多候选 + 选择”的能力

### Phase 3：加入 Reverse Check

目标：

- 提高 deep 模式的可信度
- 让最终 verdict 的成立条件显式化

### Phase 4：再决定是否保留少量 specialist

目标：

- 只保留真正带来分歧价值的 2-3 个角色
- 不回到“大而全角色流水线”

## 10. 风险与应对

### 风险 1：候选数量增加导致成本上升

应对：

- Quick Scan 固定 `N=3`
- Deep Dive 固定 `N=5`
- 先限制候选 memo 的 schema，不让每份候选都展开成完整大结果

### 风险 2：Verifier 也会犯错

应对：

- Verifier 只负责评分、找阻断项，不直接单独拍板
- 用规则校验补一层硬约束，例如 evidence 引用完整性、字段齐全性、约束冲突检查

### 风险 3：前后端兼容成本过高

应对：

- 第一版只替换服务端链路
- `SandboxAnalysisResult` 先保持兼容
- 前端只消费最终结果，不感知中间结构

### 风险 4：系统更“严谨”但用户觉得不够爽

应对：

- 在 deep 模式保留报告感和节奏感
- 但把节奏感建立在通过验证的候选之上，而不是建立在润色之上

## 11. 推荐决策

建议按下面顺序执行：

1. 先把第一阶段正式分析改造成“验证器中心”架构。
2. 第二阶段先不动，继续消费 baseline。
3. 在真实案例上做 V1 vs V2 对拍，而不是继续主观调 prompt。
4. 在 V2 跑稳之前，不再增加 specialist 数量和结果字段。

我对这个方向的判断是：

- 这是对当前仓库侵入性相对可控的改法。
- 这条路更符合近两年的论文趋势。
- 它解决的是“结果质量”而不只是“流程看起来更复杂”。

## 12. 参考文献

[1] Ruixin Hong, Hongming Zhang, Xinyu Pang, Dong Yu, and Changshui Zhang. 2024. *A Closer Look at the Self-Verification Abilities of Large Language Models in Logical Reasoning*. NAACL 2024. <https://aclanthology.org/2024.naacl-long.52/>

[2] Zhenyu Wu, Qingkai Zeng, Zhihan Zhang, Zhaoxuan Tan, Chao Shen, and Meng Jiang. 2024. *Large Language Models Can Self-Correct with Key Condition Verification*. EMNLP 2024. <https://aclanthology.org/2024.emnlp-main.714/>

[3] Qineng Wang, Zihao Wang, Ying Su, Hanghang Tong, and Yangqiu Song. 2024. *Rethinking the Bounds of LLM Reasoning: Are Multi-Agent Discussions the Key?* ACL 2024. <https://aclanthology.org/2024.acl-long.331/>

[4] Tian Liang, Zhiwei He, Wenxiang Jiao, Xing Wang, Yan Wang, Rui Wang, Yujiu Yang, Shuming Shi, and Zhaopeng Tu. 2024. *Encouraging Divergent Thinking in Large Language Models through Multi-Agent Debate*. EMNLP 2024. <https://aclanthology.org/2024.emnlp-main.992/>

[5] Zhenni Bi, Kai Han, Chuanjian Liu, Yehui Tang, and Yunhe Wang. 2025. *Forest-of-Thought: Scaling Test-Time Compute for Enhancing LLM Reasoning*. ICML 2025. <https://proceedings.mlr.press/v267/bi25a.html>

[6] Siyuan Wang, Enda Zhao, and Xiang Ren. 2025. *Stepwise Informativeness Search for Improving LLM Reasoning*. EMNLP 2025. <https://aclanthology.org/2025.emnlp-main.1285/>

[7] Jiahao Yuan, Dehui Du, Hao Zhang, Zixiang Di, and Usman Naseem. 2025. *Reversal of Thought: Enhancing Large Language Models with Preference-Guided Reverse Reasoning Warm-up*. ACL 2025. <https://aclanthology.org/2025.acl-long.955/>

[8] Shibo Hao, Sainyam Galhotra, Gagandeep Singh, and Rahul Gupta. 2025. *Large Language Models Can Solve Real-World Planning Rigorously with Formal Verification Tools*. NAACL 2025. <https://aclanthology.org/2025.naacl-long.176/>

[9] Shudong Liu, Hongwei Liu, Junnan Liu, Linchen Xiao, Songyang Gao, Chengqi Lyu, Yuzhe Gu, Wenwei Zhang, Derek F. Wong, Songyang Zhang, and Kai Chen. 2025. *CompassVerifier: A Unified and Robust Verifier for LLMs Evaluation and Outcome Reward*. EMNLP 2025. <https://aclanthology.org/2025.emnlp-main.1698/>

[10] Hanyin Wang, Chufan Gao, Qiping Xu, Bolun Liu, Guleid Hussein, Hariprasad Reddy Korsapati, Mohamad El Labban, Kingsley Iheasirim, Mohamed Hassan, Gokhan Anil, Brian Bartlett, and Jimeng Sun. 2025. *Process-Supervised Reward Models for Verifying Clinical Note Generation: A Scalable Approach Guided by Domain Expertise*. EMNLP 2025. <https://aclanthology.org/2025.emnlp-main.967/>
