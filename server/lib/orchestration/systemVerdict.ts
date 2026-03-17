import type { SandboxAnalysisResult } from '../../../shared/sandbox';
import type { Dossier } from './types';

const genericVerdictPatterns = [
  /^待综合各视角后收束最终结论/u,
  /^方向暂不宜乐观扩张/u,
  /^方向有继续验证的价值/u,
  /^方向值得推进/u,
];

function trimSentence(value: string) {
  return value
    .trim()
    .replace(/^推断：/u, '')
    .replace(/\s+/gu, ' ')
    .replace(/[。！？；;,，、\s]+$/u, '');
}

function firstClause(value: string) {
  const trimmed = trimSentence(value);
  if (!trimmed) {
    return '';
  }

  const [first] = trimmed.split(/[。！？；;\n]/u);
  return trimSentence(first ?? '');
}

function shortenClause(value: string, maxLength = 36) {
  const clause = firstClause(value);
  if (!clause) {
    return '';
  }

  return clause.length > maxLength ? `${clause.slice(0, maxLength).trim()}...` : clause;
}

function stripLead(value: string, leads: string[]) {
  let next = value;
  leads.forEach((lead) => {
    if (next.startsWith(lead)) {
      next = next.slice(lead.length).trim();
    }
  });
  return next;
}

function pickOpportunity(dossier: Dossier, result: SandboxAnalysisResult) {
  const opportunity = stripLead(
    shortenClause(dossier.opportunityThesis || result.summary || dossier.systemFrame),
    ['机会在于', '当前机会在于', '项目机会在于', '方向机会在于'],
  );
  return opportunity || '当前机会仍需结合更多有效信号重新界定';
}

function pickConstraint(dossier: Dossier, result: SandboxAnalysisResult) {
  const constraint = stripLead(
    shortenClause(result.primaryRisk || dossier.coreTensions[0] || dossier.openQuestions[0] || dossier.systemFrame),
    ['主要风险是', '主风险是', '风险是', '约束是', '当前约束是'],
  );
  return constraint || '关键约束仍未被充分验证';
}

function pickNextStep(dossier: Dossier, result: SandboxAnalysisResult) {
  const nextStep = stripLead(
    shortenClause(
      result.nextStep ||
        result.validationTracks[0]?.goal ||
        dossier.openQuestions[0] ||
        dossier.systemFrame,
      42,
    ),
    ['下一步是', '下一步应', '优先', '先'],
  );
  return nextStep || '围绕关键前提补第一轮验证';
}

function buildProjectSpecificVerdict(dossier: Dossier, result: SandboxAnalysisResult) {
  const opportunity = pickOpportunity(dossier, result);
  const constraint = pickConstraint(dossier, result);
  const nextStep = pickNextStep(dossier, result);

  if (
    result.evidenceLevel === 'low' ||
    result.confidence <= 50 ||
    result.supportRatio <= 55
  ) {
    return `机会在于${opportunity}；但${constraint}还没被验证，下一步先${nextStep}。`;
  }

  if (result.confidence >= 65 && result.supportRatio >= 60) {
    return `方向有继续推进价值，机会在于${opportunity}；当前约束是${constraint}，下一步先${nextStep}。`;
  }

  return `机会在于${opportunity}；当前约束是${constraint}，下一步先${nextStep}。`;
}

export function ensureProjectSpecificSystemVerdict(
  dossier: Dossier,
  result: SandboxAnalysisResult,
): SandboxAnalysisResult {
  const verdict = result.systemVerdict.trim();
  if (!genericVerdictPatterns.some((pattern) => pattern.test(verdict))) {
    return result;
  }

  return {
    ...result,
    systemVerdict: buildProjectSpecificVerdict(dossier, result),
  };
}
