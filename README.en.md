# KOC Growth Lab

[English](./README.en.md) | [中文](./README.md)

> A social-media AI agent for ordinary KOC creators. Before publishing, it simulates platform distribution, comment reactions, follower-growth opportunities, and publishing risk, then returns topic ideas, publish strategy, interaction optimization, and an account growth plan.

## What It Is

KOC Growth Lab is the current main product direction of DeltaArc. It helps ordinary KOC creators, campus creators, and small operation teams see how a post may be distributed, misunderstood, questioned, and extended before it is actually published.

The core flow is intentionally narrow:

1. Choose a social platform and growth goal.
2. Paste a draft post, caption, or video script.
3. Upload a cover image, post screenshot, or key video frame.
4. Run the simulation and review simulated comments, audience distribution, topic ideas, publish strategy, interaction optimization, account growth actions, and publish risk guardrails.

It is not a generic chatbot or a one-click viral-copy generator. It is a pre-publish growth sandbox for KOC creators.

## Growth Output

The main result is organized around the track wording:

- Content direction: what the post is really promising, what hook is strongest, and what proof is missing.
- Topic ideas: what the next post should be, how to turn comments into a series, and what A/B tests to run.
- Publish strategy: title, cover, timing, tags, and post structure.
- Interaction optimization: pinned comment, reply principle, comment triggers, and risk replies.
- Account growth: follow triggers, next three posts, and review metrics.
- Publish risk guardrail: overclaim, hidden ad interpretation, authorization, platform-policy, and public-opinion risks.

## Demo Scenario

The default demo uses a student KOC preparing a Xiaohongshu post:

- Topic: a 99 RMB dorm desk makeover.
- Goal: saves, comments, and follows for the next dorm-makeover episode.
- Risk: the post may be misunderstood as hidden advertising, an unclear price claim, or engagement bait.

## Stack

- Frontend: `React 18` + `Vite` + `TypeScript`
- Backend: `Express` + `TypeScript`
- Multimodal provider: Doubao / Volcengine Ark Responses API, with deterministic mock fallback for demos and tests
- Shared contract: `shared/preflightSimulation.ts`
- Main page: `src/pages/PreflightStudioPage.tsx`
- Main API: `/api/preflight-simulations`
- Harness: `harness/run-preflight-harness.ts`

The older sandbox and impact-scan code remains in the repository as compatibility and historical capability. It is not the default submission story.

## Competition Note

This project is prepared for Track 05 of the Tencent PCG Campus AI Product Creative Challenge. Track information belongs in submission materials, the PDF, and the demo script; the product UI itself is written as a real KOC growth tool.

## Environment

Copy `.env.example` to `.env.local`:

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

Use `PREFLIGHT_PROVIDER=mock` for stable local demos or regression tests without a remote key.

## Local Development

```bash
npm install
npm run dev:full
```

Default addresses:

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:5001`

Production build:

```bash
npm run build
npm start
```

## Common Checks

```bash
npm run typecheck
npm test
npm run build
npm run verify:fixtures
npm run harness:preflight
```
