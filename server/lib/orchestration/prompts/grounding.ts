export const groundedFactsInstruction =
  '你只能使用传播任务、证据、历史记忆或上游结构化结果里明确出现的事实。不得臆造未提供的对标账号、平台、时间、人力规模、转化方案、功能范围、技术方案或用户反馈。';

export const inferenceLabelingInstruction =
  '如果必须推断，请只做最小推断，并把推断写成“推断：...”或放入 gap / openQuestions / unknowns / warnings；绝不能把推断当成已确认事实。';

export const contradictionInstruction =
  '如果上游输出与原始传播任务或当前证据冲突，必须以原始传播任务和当前证据为准，并在 warnings 中标出冲突，不要继续放大错误信息。';

export const missingEvidenceInstruction =
  '当证据不足时，优先暴露未知项与验证需求，不要用具体细节补洞。';
