import type { SandboxAnalysisResult, SandboxAnalysisStagePreview } from '../../../shared/sandbox';
import type { Dossier, SpecialistOutput } from './types';

function compactBullets(values: Array<string | undefined>, limit = 4) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, limit);
}

export function createDossierPreview(dossier: Dossier): SandboxAnalysisStagePreview {
  return {
    headline: dossier.opportunityThesis,
    summary: dossier.systemFrame,
    bullets: compactBullets([
      dossier.coreTensions[0] ? `核心张力：${dossier.coreTensions[0]}` : undefined,
      dossier.openQuestions[0] ? `待验证：${dossier.openQuestions[0]}` : undefined,
      dossier.personas[0] ? `重点人群：${dossier.personas[0].name}` : undefined,
      dossier.hypotheses[0] ? `首要假设：${dossier.hypotheses[0].title}` : undefined,
    ]),
  };
}

export function createSpecialistPreview(output: SpecialistOutput): SandboxAnalysisStagePreview {
  const strategy = output.strategyIdeas[0];
  const validationTrack = output.validationTracks[0];

  return {
    headline: `${output.perspective.label}：${output.perspective.verdict}`,
    summary: output.perspective.opportunity || output.perspective.concern || output.perspective.leverage,
    bullets: compactBullets([
      output.perspective.opportunity ? `机会：${output.perspective.opportunity}` : undefined,
      output.perspective.concern ? `风险：${output.perspective.concern}` : undefined,
      strategy ? `建议动作：${strategy.name}` : undefined,
      validationTrack ? `验证任务：${validationTrack.goal}` : undefined,
    ]),
  };
}

export function createSynthesisPreview(result: SandboxAnalysisResult): SandboxAnalysisStagePreview {
  const topStrategy = result.strategies[0];
  const firstBeat = result.futureTimeline[0];
  const firstRhythm = result.communityRhythms[0];
  const firstSignal = result.trajectorySignals[0];

  return {
    headline: result.report.headline || result.summary || '正式预测已进入合成阶段',
    summary: result.systemVerdict || result.report.summary || '',
    bullets: compactBullets(
      [
        topStrategy ? `主路线：${topStrategy.name}` : undefined,
        firstBeat ? `首拍：${firstBeat.timing} · ${firstBeat.expectedReaction}` : undefined,
        firstRhythm ? `社区节奏：${firstRhythm.pattern}` : undefined,
        firstSignal ? `转折信号：${firstSignal.signal}` : undefined,
        result.nextStep ? `下一步：${result.nextStep}` : undefined,
      ],
      5,
    ),
  };
}

export function createRefinePreview(result: SandboxAnalysisResult): SandboxAnalysisStagePreview {
  return {
    headline: result.report.conclusion || result.report.headline || '正式预测已完成润色',
    summary: result.report.summary || result.summary || '',
    bullets: compactBullets([
      result.report.whyNow ? `为什么现在：${result.report.whyNow}` : undefined,
      result.report.risk ? `主风险：${result.report.risk}` : undefined,
      result.report.actions[0] ? `首个动作：${result.report.actions[0]}` : undefined,
      result.futureTimeline[0] ? `首拍时间：${result.futureTimeline[0].timing}` : undefined,
    ]),
  };
}
