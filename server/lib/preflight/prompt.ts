import {
  getPreflightGoalLabel,
  getPreflightPlatformLabel,
  summarizePreflightDraft,
  type PreflightSimulationResult,
  type PreflightSimulationRequest,
} from '../../../shared/preflightSimulation';

function describeImageStatus(request: PreflightSimulationRequest) {
  if (request.mediaAssets.length === 0) {
    return 'No image uploaded. Be explicit about visual uncertainty.';
  }

  return `${request.mediaAssets.length} image(s) uploaded. Read the cover fast, like a real scrolling user would.`;
}

function fallbackText(value: string) {
  return value.trim() || 'Not provided.';
}

const resultJsonContract = `Required JSON shape. Return strict JSON with schemaVersion="preflight_v2". Include every top-level key and every nested key:
{
  "schemaVersion": "preflight_v2",
  "scenario": "koc_growth",
  "contentPromise": {
    "oneLinePromise": "string",
    "targetUser": "string",
    "userPain": "string",
    "promisedValue": "string",
    "desiredAction": "string",
    "proofProvided": ["string"],
    "proofMissing": ["string"],
    "overclaimRisk": "string"
  },
  "contentRead": {
    "oneLineIntent": "string",
    "platformFit": "string",
    "likelyHook": "string",
    "missingContext": ["string"],
    "assumptions": ["string"]
  },
  "visualRead": {
    "firstGlance": "string",
    "visibleText": ["string"],
    "visibleObjects": ["string"],
    "strongestSignal": "string",
    "confusionPoints": ["string"],
    "missingAnnotations": ["string"],
    "coverScore": 0,
    "mobileLegibility": "medium"
  },
  "imageInsight": {
    "summary": "string",
    "visibleElements": ["string"],
    "coverRead": "string",
    "textOnImage": ["string"],
    "ambiguity": "string",
    "attentionScore": 0,
    "risks": ["string"],
    "improvementIdeas": ["string"]
  },
  "audienceDistribution": [
    {
      "id": "cohort_core",
      "tier": "core",
      "userProfile": "string",
      "exposureShare": 0,
      "pushReason": "string",
      "likelyReaction": "string",
      "conversionTrigger": "string",
      "dropOffReason": "string",
      "misunderstandingRisk": "string"
    }
  ],
  "pushModel": {
    "summary": "string",
    "nonRelevantShare": 0,
    "platformDrift": "string",
    "cohorts": [
      {
        "id": "cohort_core",
        "label": "string",
        "relevanceTier": "core",
        "exposureShare": 0,
        "whyPushed": "string",
        "likelyBehavior": "string",
        "misunderstandingRisk": "string",
        "conversionIntent": "string"
      }
    ]
  },
  "simulatedReplies": [
    {
      "id": "reply_1",
      "cohortId": "cohort_core",
      "userType": "string",
      "relevanceTier": "core",
      "sentiment": "positive",
      "replyType": "question",
      "text": "string",
      "surfaceIntent": "string",
      "hiddenNeed": "string",
      "conversionSignal": "string",
      "riskSignal": "string",
      "suggestedReply": "string",
      "contentAction": "string",
      "evidenceNeeded": ["string"]
    }
  ],
  "interventions": [
    {
      "id": "intervention_1",
      "priority": "P0",
      "target": "cover",
      "problem": "string",
      "change": "string",
      "exampleRewrite": "string",
      "expectedEffect": "string",
      "effort": "low",
      "evidenceSource": "string"
    }
  ],
  "growthBrief": {
    "contentDirection": {
      "summary": "string",
      "strongestHook": "string",
      "evidence": ["string"],
      "missingSignals": ["string"]
    },
    "topicIdeas": {
      "nextPost": "string",
      "seriesDirection": "string",
      "abTests": ["string"],
      "reuseFromComments": ["string"]
    },
    "publishStrategy": {
      "title": "string",
      "cover": "string",
      "timing": "string",
      "tags": ["string"],
      "structure": "string"
    },
    "interactionOptimization": {
      "pinnedComment": "string",
      "replyPrinciple": "string",
      "commentTriggers": ["string"],
      "riskReplies": ["string"]
    },
    "accountGrowthPlan": {
      "growthThesis": "string",
      "followTriggers": ["string"],
      "nextThreePosts": ["string"],
      "reviewMetrics": ["string"]
    },
    "riskGuardrail": {
      "positioning": "string",
      "mustAvoid": ["string"],
      "safePhrasing": ["string"]
    }
  },
  "riskReview": {
    "topRisks": [
      {
        "title": "string",
        "severity": "medium",
        "trigger": "string",
        "likelyUserComment": "string",
        "mitigation": "string"
      }
    ],
    "complianceRisks": [],
    "misreadRisks": []
  },
  "simulatedMetrics": {
    "disclaimer": "string",
    "attentionScore": 0,
    "saveIntentScore": 0,
    "commentIntentScore": 0,
    "followIntentScore": 0,
    "shareIntentScore": 0,
    "metricCards": [
      {
        "label": "string",
        "simulatedValue": 0,
        "rationale": "string"
      }
    ]
  },
  "qualityCheck": {
    "overallScore": 0,
    "reliableSignals": ["string"],
    "weakSignals": ["string"],
    "possibleHallucinations": ["string"],
    "needsHumanReview": ["string"],
    "outputWarnings": ["string"]
  },
  "publishSafetyReview": {
    "gate": "revise",
    "score": 0,
    "summary": "string",
    "escalation": "pr",
    "redFlags": [
      {
        "id": "safety_flag_1",
        "title": "string",
        "severity": "high",
        "area": "brand_reputation",
        "trigger": "string",
        "whyItMatters": "string",
        "evidence": "string",
        "fix": "string",
        "owner": "pr"
      }
    ],
    "checklist": [
      {
        "id": "safety_check_1",
        "label": "string",
        "status": "review",
        "detail": "string",
        "owner": "ops"
      }
    ],
    "mustFixBeforePublish": ["string"],
    "safeRewriteHints": ["string"]
  },
  "confidence": {
    "level": "medium",
    "score": 0,
    "rationale": "string",
    "limitations": ["string"]
  },
  "risks": [
    {
      "title": "string",
      "severity": "medium",
      "trigger": "string",
      "likelyComment": "string",
      "mitigation": "string"
    }
  ],
  "warnings": ["string"]
}
Allowed scenario: koc_growth, campus_submission, brand_post, generic_preflight.
Allowed relevanceTier: core, broad, weak, misfire.
Allowed sentiment: positive, neutral, skeptical, negative, irrelevant.
Allowed replyType: question, objection, save_signal, follow_signal, share_signal, misread, scroll_away, comment, share_trigger, conversion_signal.
Allowed severity: low, medium, high.
Allowed safety severity: low, medium, high, critical.
Allowed publishSafetyReview.gate: go, revise, hold.
Allowed publishSafetyReview.escalation: none, ops, brand, legal, pr, data_security, competition_team.
Allowed publishSafetyReview.area: overclaim, privacy, copyright, platform_policy, brand_reputation, public_opinion, data_security, minor_protection, competition_integrity, misleading_context.
Allowed publishSafetyReview.owner: ops, brand, legal, pr, data_security, product, competition_team.
Allowed publishSafetyReview.checklist.status: pass, review, fail.
Allowed priority: P0, P1, P2.
Allowed target: cover, title, opening, body, comment, proof, next_post, comment_prompt, timing, offer, script.
All numeric score fields must be 0-100 integers, not 0-10. If you judge something as seven out of ten, output 70, never 7. This applies to visualRead.coverScore, simulatedMetrics.*Score, simulatedMetrics.metricCards.simulatedValue, qualityCheck.overallScore, publishSafetyReview.score, confidence.score, and imageInsight.attentionScore.
Every suggestedReply must read like a real comment reply the user can copy.
Every contentAction must say exactly what to change in title, cover, opening, body, proof, comment, timing, or next post.
Every intervention must include problem, change, exampleRewrite, expectedEffect, effort, and evidenceSource. evidenceSource must name a concrete source from visualRead, contentPromise, simulatedReplies, riskReview, or publishSafetyReview instead of a vague phrase.
growthBrief must explicitly answer the KOC creator growth requirements: content direction, topic ideas, publish strategy, interaction optimization, account growth, and publish risk guardrail.
publishSafetyReview is a large-company pre-publish safety review. It must look for overclaims, privacy or authorization problems, copyright, platform rule risks, brand reputation, public opinion blow-up risk, data security, minor protection, misleading official endorsement, and competition-integrity issues.
Do not use dorm/KOC wording in campus_submission unless the submitted draft itself is about a dorm/KOC case.`;

const quickResultJsonContract = `Compact quick JSON shape. Return strict JSON with schemaVersion="preflight_v2". Include these top-level keys: scenario, contentPromise, contentRead, visualRead, imageInsight, pushModel, simulatedReplies, interventions, growthBrief, riskReview, simulatedMetrics, qualityCheck, publishSafetyReview, confidence, risks, warnings.
Use compact nested objects. The runtime will fill safe defaults for omitted optional nested keys, but every judgment you include must be concrete.
Required compact examples:
{
  "schemaVersion": "preflight_v2",
  "scenario": "koc_growth",
  "contentRead": { "oneLineIntent": "string", "platformFit": "string", "likelyHook": "string", "missingContext": ["string"], "assumptions": ["string"] },
  "visualRead": { "firstGlance": "string", "strongestSignal": "string", "confusionPoints": ["string"], "coverScore": 70, "mobileLegibility": "medium" },
  "imageInsight": { "summary": "string", "coverRead": "string", "ambiguity": "string", "attentionScore": 70, "risks": ["string"], "improvementIdeas": ["string"] },
  "pushModel": { "summary": "string", "nonRelevantShare": 30, "platformDrift": "string", "cohorts": [{ "id": "cohort_core", "label": "string", "relevanceTier": "core", "exposureShare": 30, "whyPushed": "string", "likelyBehavior": "string", "misunderstandingRisk": "string", "conversionIntent": "string" }] },
  "simulatedReplies": [{ "id": "reply_1", "cohortId": "cohort_core", "userType": "string", "relevanceTier": "core", "sentiment": "positive", "replyType": "question", "text": "string", "hiddenNeed": "string", "conversionSignal": "string", "riskSignal": "string", "suggestedReply": "string", "contentAction": "string", "evidenceNeeded": ["string"] }],
  "interventions": [{ "id": "intervention_1", "priority": "P0", "target": "cover", "problem": "string", "change": "string", "exampleRewrite": "string", "expectedEffect": "string", "effort": "low", "evidenceSource": "string" }],
  "growthBrief": { "contentDirection": { "summary": "string", "strongestHook": "string" }, "topicIdeas": { "nextPost": "string", "seriesDirection": "string", "abTests": ["string"] }, "publishStrategy": { "title": "string", "cover": "string", "timing": "string", "tags": ["string"], "structure": "string" }, "interactionOptimization": { "pinnedComment": "string", "replyPrinciple": "string", "commentTriggers": ["string"] }, "accountGrowthPlan": { "growthThesis": "string", "followTriggers": ["string"], "nextThreePosts": ["string"], "reviewMetrics": ["string"] }, "riskGuardrail": { "positioning": "string", "mustAvoid": ["string"], "safePhrasing": ["string"] } },
  "simulatedMetrics": { "disclaimer": "string", "attentionScore": 70, "saveIntentScore": 70, "commentIntentScore": 70, "followIntentScore": 70, "shareIntentScore": 70, "metricCards": [{ "label": "string", "simulatedValue": 70, "rationale": "string" }] },
  "qualityCheck": { "overallScore": 70, "reliableSignals": ["string"], "weakSignals": ["string"], "possibleHallucinations": ["string"], "needsHumanReview": ["string"], "outputWarnings": ["string"] },
  "publishSafetyReview": { "gate": "revise", "score": 70, "summary": "string", "escalation": "ops", "redFlags": [{ "id": "safety_flag_1", "title": "string", "severity": "medium", "area": "copyright", "trigger": "string", "whyItMatters": "string", "evidence": "string", "fix": "string", "owner": "ops" }], "checklist": [{ "id": "safety_check_1", "label": "string", "status": "review", "detail": "string", "owner": "ops" }], "mustFixBeforePublish": ["string"], "safeRewriteHints": ["string"] },
  "confidence": { "level": "medium", "score": 70, "rationale": "string", "limitations": ["string"] },
  "risks": [{ "title": "string", "severity": "medium", "trigger": "string", "likelyComment": "string", "mitigation": "string" }],
  "warnings": ["string"]
}
Allowed relevanceTier: core, broad, weak, misfire. Allowed score fields: 0-100 integers, not 0-10. evidenceSource must name a concrete source from visualRead, contentPromise, simulatedReplies, riskReview, or publishSafetyReview instead of a vague phrase. Keep every Chinese string short; comments under 45 Chinese characters, suggestedReply/contentAction one sentence.`;

const quickRemoteSketchContract = `Compact quick JSON sketch. Return ONLY minified JSON, no markdown, no full schema, no long paragraphs. Keep the whole response short enough to finish in one model response.
Minimum shape:
{
  "schemaVersion": "preflight_v2",
  "scenario": "koc_growth",
  "contentRead": { "oneLineIntent": "string", "likelyHook": "string" },
  "visualRead": { "firstGlance": "string", "strongestSignal": "string", "coverScore": 70 },
  "imageInsight": { "summary": "string", "attentionScore": 70 },
  "simulatedReplies": [
    { "tier": "core", "relevanceTier": "core", "text": "string", "hiddenNeed": "string", "contentAction": "string" },
    { "tier": "broad", "text": "string", "hiddenNeed": "string", "contentAction": "string" },
    { "tier": "weak", "text": "string", "hiddenNeed": "string", "contentAction": "string" },
    { "tier": "misfire", "text": "string", "hiddenNeed": "string", "contentAction": "string" }
  ],
  "actions": { "titleFix": "string", "coverFix": "string", "pinnedComment": "string", "nextPost": "string" },
  "metrics": { "attention": 70, "save": 70, "comment": 70, "follow": 70, "share": 70 },
  "quality": { "overallScore": 70, "weakSignals": ["string"], "needsHumanReview": ["string"] },
  "safety": { "gate": "revise", "score": 70, "mustFixBeforePublish": ["string"], "safeRewriteHints": ["string"] },
  "risks": [{ "title": "string", "severity": "medium", "trigger": "string", "mitigation": "string" }],
  "warnings": ["string"]
}
Allowed tier/relevanceTier: core, broad, weak, misfire. Scores are 0-100 integers. The server will expand this sketch into "pushModel", growthBrief, publishSafetyReview, interventions, "confidence", and audienceDistribution. If you output interventions, evidenceSource must name a concrete source. Keep every Chinese string under 24 characters.`;

function compactResultForQualityAgent(result: PreflightSimulationResult) {
  return {
    scenario: result.scenario,
    contentPromise: result.contentPromise,
    contentRead: result.contentRead,
    visualRead: result.visualRead,
    imageInsight: result.imageInsight,
    audienceDistribution: result.audienceDistribution,
    pushModel: result.pushModel,
    simulatedReplies: result.simulatedReplies.map((reply) => ({
      id: reply.id,
      cohortId: reply.cohortId,
      userType: reply.userType,
      relevanceTier: reply.relevanceTier,
      sentiment: reply.sentiment,
      replyType: reply.replyType,
      text: reply.text,
      hiddenNeed: reply.hiddenNeed,
      conversionSignal: reply.conversionSignal,
      riskSignal: reply.riskSignal,
      contentAction: reply.contentAction,
      evidenceNeeded: reply.evidenceNeeded,
    })),
    interventions: result.interventions,
    riskReview: result.riskReview,
    risks: result.risks,
    qualityCheck: result.qualityCheck,
    publishSafetyReview: result.publishSafetyReview,
    growthBrief: result.growthBrief,
    confidence: result.confidence,
    warnings: result.warnings,
  };
}

export function buildPreflightSimulationPrompt(request: PreflightSimulationRequest) {
  const platformLabel = getPreflightPlatformLabel(request.platform);
  const goalLabel = getPreflightGoalLabel(request.goal);
  const draft = summarizePreflightDraft(request);
  const isGrowth = request.goal === 'follower_growth';
  const isCompetition = request.platform === 'campus_ai_competition' || request.goal === 'submission_readiness';
  const isQuick = request.mode === 'quick';

  const systemPrompt = [
    isGrowth
      ? 'You are KOC Growth Lab, a multimodal social growth simulation agent for ordinary KOC creators.'
      : isCompetition
      ? 'You are DeltaArc Campus AI Submission Studio, a pre-submission review simulator for the Tencent PCG Campus AI Product Creative Challenge.'
      : 'You are DeltaArc Preflight Studio, a pre-publish simulation engine for brand and operations teams.',
    isGrowth
      ? 'Your job is to understand the submitted content, predict its spread path, and produce follower-growth actions for the next post.'
      : isCompetition
      ? 'Your job is to predict what judges notice, question, and mark as risky before a student submits a product package.'
      : 'Your job is to predict the first wave of reactions before a post is published.',
    isGrowth
      ? 'Assume platform distribution mixes core fans, broad-interest viewers, weakly related viewers, and misfired viewers; explain what triggers attention, collection, comments, follows, and drop-off.'
      : isCompetition
      ? 'Assume judges scan quickly, so missing demo evidence, unclear track fit, weak product closure, and incomplete submission materials must appear in the result.'
      : 'Assume platform distribution is never perfectly accurate, so weakly related and misfired viewers must appear in the result.',
    'Return only the JSON required by the response schema.',
    'Write every user-facing string value in Simplified Chinese.',
    'Be concrete, concise, and action-oriented.',
    isGrowth
      ? 'Do not promise exact traffic, exact follower growth, exact impressions, or guaranteed virality. Do not recommend fake engagement, dark patterns, or spam.'
      : isCompetition
      ? 'Do not promise awards, internship offers, advancement, or official judging outcomes.'
      : 'Do not promise exact traffic, exact impressions, or exact future comments.',
    'Also act as a large-company publishing safety reviewer: flag anything that could cause brand, PR, legal, privacy, platform-policy, data-security, or misleading-context blow-up after publishing.',
    isGrowth
      ? 'If the visual signal is weak, say so clearly in imageInsight and confidence.limitations; still provide concrete low-cost experiments.'
      : isCompetition
      ? 'If the demo screenshot or submission evidence is weak, say so clearly in imageInsight and confidence.limitations.'
      : 'If the image signal is weak, say so clearly in imageInsight and confidence.limitations.',
  ].join(' ');

  const userPrompt = [
    isGrowth
      ? 'Simulate one KOC social post and its follower-growth development.'
      : isCompetition ? 'Simulate one Tencent PCG campus AI competition submission package.' : 'Simulate one unpublished social post.',
    `Platform: ${platformLabel}`,
    `Goal: ${goalLabel}`,
    `Simulation depth: ${request.mode === 'deep' ? 'deep' : 'quick'}`,
    `Account context: ${fallbackText(request.accountContext)}`,
    `Target audience: ${fallbackText(request.targetAudience)}`,
    `Desired action: ${fallbackText(request.desiredAction)}`,
    `Brand guardrails: ${fallbackText(request.brandGuardrails)}`,
    `Image status: ${describeImageStatus(request)}`,
    '',
    'Draft:',
    draft,
    '',
    'Output guidance:',
    isQuick ? quickRemoteSketchContract : resultJsonContract,
    `- Set scenario to ${isGrowth ? 'koc_growth' : isCompetition ? 'campus_submission' : 'brand_post'}.`,
    isQuick
      ? '- Quick mode: omit audienceDistribution and pushModel.cohorts unless already compact; the server will derive cohorts from the 4 replies.'
      : '- Output exactly 4 audienceDistribution cohorts: one core, one broad, one weak, one misfire.',
    '- All score-like numbers must use 0-100 integers, not a 0-10 rating scale; write 70 for seven out of ten.',
    isQuick
      ? '- Quick mode: output exactly 4 simulatedReplies: 1 core, 1 broad, 1 weak, and 1 misfire. The server will backfill coverage after your real judgment.'
      : '- Deep mode: output exactly 8 simulatedReplies: 2 core, 2 broad, 2 weak, and 2 misfire.',
    isQuick
      ? '- Quick mode: output 1 risk and 1 intervention. The server will backfill safe defaults for missing structure.'
      : '- Deep mode: output exactly 3 risks and exactly 4 interventions.',
    isQuick ? '- Quick mode: simulatedMetrics.metricCards may be omitted.' : '- Output exactly 4 simulatedMetrics.metricCards.',
    isQuick
      ? '- Quick mode: use the compact actions/safety fields; the server will expand them into growthBrief and publishSafetyReview.'
      : isGrowth
      ? '- growthBrief must be the main KOC growth summary: content direction, topic ideas, publish strategy, interaction optimization, account growth, and publish risk guardrail.'
      : '- growthBrief may summarize the equivalent preflight action plan, but do not force KOC wording into non-growth scenarios.',
    '- Output publishSafetyReview as a release gate: gate=hold for blocker risks, gate=revise for fix-before-publish risks, gate=go only when no obvious blocker remains.',
    isQuick
      ? '- Quick mode: publishSafetyReview.redFlags/checklist and growthBrief may be omitted; use safety/actions aliases instead.'
      : '- publishSafetyReview.redFlags must include concrete triggers, why they matter for a large-company operator, evidence from the draft/material/replies, and the exact fix.',
    isCompetition
      ? '- Use disclaimer: 以下为提交前模拟值，不代表官方评审结论、晋级或奖项承诺。'
      : isGrowth
      ? '- Use disclaimer: 以下为发布前模拟值，不代表真实播放、点赞或涨粉承诺。'
      : '- Use disclaimer: 以下为发布前模拟值，不代表真实曝光、转化或评论承诺。',
    '- Do not use vague recommendations. Each suggestedReply must be copyable; each contentAction must name the content surface to change.',
    isQuick
      ? '- Keep every string compact; suggestedReply and contentAction should be one short sentence each.'
      : '- Keep every string compact; prefer short Chinese phrases over long paragraphs.',
    isGrowth
      ? '- Keep cohort logic realistic: include core fans, broad-interest viewers, weakly related passersby, and misfired viewers.'
      : isCompetition
      ? '- Keep cohort logic realistic: include product-value judges, track-fit judges, submission-completeness checks, and risk/boundary checks.'
      : '- Keep cohort logic realistic: include core, broad, weak, and misfire traffic.',
    isGrowth
      ? '- Simulated replies should feel like real comments, follow triggers, objections, saves, shares, misreads, or scroll-away signals.'
      : isCompetition
      ? '- Simulated replies should feel like short judge questions, objections, completeness checks, or risk notes.'
      : '- Simulated replies should feel like short real comments, questions, objections, misreads, or scroll-away signals.',
    isGrowth
      ? '- Interventions must be concrete growth moves: title, cover, first 3 seconds, pinned comment, posting timing, series hook, or next-post experiment.'
      : isCompetition
      ? '- Interventions must be actions the student team can take before submission.'
      : '- Interventions must be actions the user can take before publishing.',
    isGrowth ? '- Make sure at least one suggestion explains how to turn saves or comments into follows.' : '',
    '- Keep wording compact so the full JSON can finish in one response.',
  ].filter(Boolean).join('\n');

  return {
    systemPrompt,
    userPrompt,
  };
}

export function buildPreflightQualityAgentPrompt(
  request: PreflightSimulationRequest,
  candidate: PreflightSimulationResult,
) {
  const platformLabel = getPreflightPlatformLabel(request.platform);
  const goalLabel = getPreflightGoalLabel(request.goal);
  const isGrowth = request.goal === 'follower_growth';
  const isCompetition =
    request.platform === 'campus_ai_competition' || request.goal === 'submission_readiness';

  const systemPrompt = [
    'You are the Quality Detection Agent for DeltaArc Preflight Studio.',
    'You audit a candidate simulation result for evidence support, coverage, safety, score scale, topic drift, and actionability.',
    'Do not rewrite the whole result. Return only strict JSON with qualityCheck, publishSafetyReview, and warnings.',
    'Write every user-facing string value in Simplified Chinese.',
  ].join(' ');

  const userPrompt = [
    'Audit this candidate preflight result.',
    `Platform: ${platformLabel}`,
    `Goal: ${goalLabel}`,
    `Scenario: ${isGrowth ? 'KOC growth' : isCompetition ? 'campus submission' : 'brand/social preflight'}`,
    '',
    'Quality agent JSON contract:',
    `{
  "qualityCheck": {
    "overallScore": 0,
    "reliableSignals": ["string"],
    "weakSignals": ["string"],
    "possibleHallucinations": ["string"],
    "needsHumanReview": ["string"],
    "outputWarnings": ["string"]
  },
  "publishSafetyReview": {
    "gate": "revise",
    "score": 0,
    "summary": "string",
    "escalation": "ops",
    "redFlags": [
      {
        "id": "safety_flag_quality_1",
        "title": "string",
        "severity": "medium",
        "area": "overclaim",
        "trigger": "string",
        "whyItMatters": "string",
        "evidence": "string",
        "fix": "string",
        "owner": "ops"
      }
    ],
    "checklist": [
      {
        "id": "safety_check_quality_1",
        "label": "string",
        "status": "review",
        "detail": "string",
        "owner": "ops"
      }
    ],
    "mustFixBeforePublish": ["string"],
    "safeRewriteHints": ["string"]
  },
  "warnings": ["string"]
}`,
    '',
    'Audit rules:',
    '- Check that every relevance tier core/broad/weak/misfire has at least two replies.',
    '- Check whether visual claims are supported by visualRead/imageInsight; mark uncertainty when images are absent or weak.',
    '- Check that all score fields are 0-100, not 0-10.',
    '- Check that interventions name concrete surfaces and evidenceSource is not generic.',
    '- Check for topic drift from previous demos, especially dorm/KOC words in campus_submission or unrelated old case details.',
    '- Check that publishSafetyReview catches overclaim, privacy, copyright, platform policy, brand reputation, public opinion, data security, minor protection, misleading context, and competition integrity when relevant.',
    '- Do not output a final PreflightSimulationResult. Only output qualityCheck, publishSafetyReview, and warnings.',
    '',
    'Original draft:',
    summarizePreflightDraft(request),
    '',
    'Candidate result:',
    JSON.stringify(compactResultForQualityAgent(candidate)),
  ].join('\n');

  return {
    systemPrompt,
    userPrompt,
  };
}
