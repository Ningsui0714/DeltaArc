import type { SandboxAnalysisRequest, SandboxAnalysisResult } from '../../../shared/sandbox';
import type { Dossier } from './types';

export function summarizeEvidenceLevel(request: SandboxAnalysisRequest): SandboxAnalysisResult['evidenceLevel'] {
  const totalEvidence = request.evidenceItems.length;
  const highTrustEvidence = request.evidenceItems.filter((item) => item.trust === 'high').length;

  if (highTrustEvidence >= 2 || totalEvidence >= 5) {
    return 'high';
  }

  if (highTrustEvidence >= 1 || totalEvidence >= 2) {
    return 'medium';
  }

  return 'low';
}

export function uniqueStrings(values: Array<string | undefined>, limit = values.length) {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = value?.trim();
    if (!normalized || seen.has(normalized) || result.length >= limit) {
      return;
    }

    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

export function createValidationTrack(
  name: string,
  priority: 'P0' | 'P1' | 'P2',
  goal: string,
  method: string,
  successSignal: string,
  failureSignal: string,
  timeframe = '1 week',
) {
  return {
    name,
    priority,
    goal,
    method,
    successSignal,
    failureSignal,
    cost: 'S',
    timeframe,
  };
}

export function buildFutureTimelineFromFallback(
  request: SandboxAnalysisRequest,
  dossier: Dossier,
  scenarioVariants: SandboxAnalysisResult['scenarioVariants'],
  validationTracks: SandboxAnalysisResult['validationTracks'],
): SandboxAnalysisResult['futureTimeline'] {
  const validationGoal = request.project.validationGoal || dossier.openQuestions[0] || '当前核心验证问题';
  const primaryTrack = validationTracks[0];
  const leadingScenario = scenarioVariants[0];
  const alternateScenario = scenarioVariants[1];

  return [
    {
      phase: '首波反应',
      timing: '发布后 0-24 小时',
      expectedReaction: `首批讨论会先围绕“${validationGoal}”是否被直观感知展开。`,
      likelyShift:
        dossier.evidenceLevel === 'high'
          ? '如果玩家能很快复述具体亮点，讨论会从围观转向拆体验。'
          : '如果真实样本还薄，讨论更可能停留在概念层和表面好奇。',
      risk: dossier.coreTensions[0] ?? '首发叙事可能快于真实体验兑现速度。',
      watchSignals: uniqueStrings(
        [primaryTrack?.successSignal, leadingScenario?.watchSignals[0], dossier.openQuestions[0]],
        3,
      ),
      recommendedResponse: primaryTrack?.method ?? '先收首波真实样本，再决定是否放大传播。',
    },
    {
      phase: '讨论分化',
      timing: '发布后 2-5 天',
      expectedReaction: '社区会开始分化成认可、观望和怀疑三类声音。',
      likelyShift:
        leadingScenario?.premise ??
        '如果首波亮点成立，讨论会开始转向复盘、对照和继续留下来的理由。',
      risk: dossier.openQuestions[1] ?? '这时最容易暴露首波热度到底来自包装还是体验。',
      watchSignals: uniqueStrings(
        [leadingScenario?.watchSignals[1], alternateScenario?.watchSignals[0], primaryTrack?.failureSignal],
        3,
      ),
      recommendedResponse:
        leadingScenario?.recommendedMove ?? '把讨论按人群分层，而不是只看总声量变化。',
    },
    {
      phase: '节奏定型',
      timing: '发布后 1-3 周',
      expectedReaction: '外部会逐渐形成一个更稳定的项目标签，后续内容只会放大这个标签。',
      likelyShift:
        alternateScenario?.premise ??
        '如果中后段价值没有被稳定证明，社区节奏会从持续复盘滑回一次性围观。',
      risk: dossier.memorySignals[0]?.summary ?? '一旦固定认知形成，后续很难靠解释逆转。',
      watchSignals: uniqueStrings(
        [alternateScenario?.watchSignals[1], validationTracks[1]?.successSignal, dossier.openQuestions[2]],
        3,
      ),
      recommendedResponse:
        validationTracks[1]?.method ?? '在节奏定型前准备下一轮可验证的新样本，而不是重复旧叙事。',
    },
  ];
}

export function buildCommunityRhythmsFromFallback(
  request: SandboxAnalysisRequest,
  dossier: Dossier,
  strategies: SandboxAnalysisResult['strategies'],
): SandboxAnalysisResult['communityRhythms'] {
  const targetPlayers = request.project.targetPlayers.join(' / ') || '当前目标人群';
  const leadStrategy = strategies[0];
  const supportStrategy = strategies[1];

  return [
    {
      name: '首发试吃节奏',
      timing: '上线当天到第 2 天',
      pattern: '用户先消费一句话卖点和第一眼素材，再决定要不要继续看试玩和评论。',
      trigger: dossier.opportunityThesis,
      implication: '如果这一拍没有形成具体体验记忆，后续讨论会越来越抽象。',
    },
    {
      name: '分层复盘节奏',
      timing: '第 3 天到第 7 天',
      pattern: `社区会开始按 ${targetPlayers} 的不同诉求分层，声音不再是一股。`,
      trigger: leadStrategy?.recommendation ?? dossier.openQuestions[0] ?? '玩家开始用不同标准评价项目',
      implication: '这是判断真正目标人群和真实留存理由的最佳窗口。',
    },
    {
      name: '续航沉淀节奏',
      timing: '第 2 周以后',
      pattern: '如果没有新高光样本、策略讨论或复盘故事，社区会自然进入冷却。',
      trigger: supportStrategy?.recommendation ?? dossier.coreTensions[0] ?? '后续讨论缺少新支点',
      implication: '这决定项目是开始滚雪球，还是停留在一次性新鲜感。',
    },
  ];
}

export function buildTrajectorySignalsFromFallback(
  secondOrderEffects: SandboxAnalysisResult['secondOrderEffects'],
  validationTracks: SandboxAnalysisResult['validationTracks'],
  redTeam: SandboxAnalysisResult['redTeam'],
): SandboxAnalysisResult['trajectorySignals'] {
  const positiveEffect = secondOrderEffects.find((effect) => effect.direction === 'positive');
  const negativeEffect = secondOrderEffects.find((effect) => effect.direction === 'negative');
  const mixedEffect = secondOrderEffects.find((effect) => effect.direction === 'mixed');

  return [
    {
      signal: validationTracks[0]?.successSignal ?? '玩家开始自发复述同一个高光时刻',
      direction: 'positive',
      timing: validationTracks[0]?.timeframe ?? '首波反馈内',
      impact: positiveEffect?.outcome ?? '说明卖点正在变成社区语言，后续传播效率会抬升。',
      recommendedMove:
        validationTracks[0]?.method ?? '立刻围绕这个高光补更多样本，不要平均扩内容。',
    },
    {
      signal: validationTracks[0]?.failureSignal ?? '负面反馈持续集中在理解成本或体验落空',
      direction: 'negative',
      timing: '发布后前几天',
      impact: negativeEffect?.outcome ?? redTeam.thesis,
      recommendedMove:
        redTeam.mitigation ?? '优先修最前面的体验断点，暂停继续放大外部叙事。',
    },
    {
      signal: validationTracks[1]?.goal ?? '讨论开始从新鲜感转向值不值得继续留下来',
      direction: mixedEffect?.direction ?? 'mixed',
      timing: validationTracks[1]?.timeframe ?? '1-2 周',
      impact: mixedEffect?.outcome ?? '这是项目从首波热度转入真实长期走势判断的关键转折。',
      recommendedMove:
        validationTracks[1]?.method ?? '提前准备能回答留存理由和社区续航的证据。',
    },
  ];
}
