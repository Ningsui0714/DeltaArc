# Guanbian

[English](./README.en.md) | [中文](./README.md)

Guanbian is a local simulation workbench for game and interactive product design.

What is implemented in this repository today is the foundation of an analysis workbench: enter a project and evidence, run a formal analysis, and inspect structured judgments, risks, timelines, and reports.  
What is currently being designed and incrementally built next is the variable sandbox layer: freeze the first formal analysis into a `Baseline`, inject a `Variable`, then run forward observation and reverse reasoning on top of it.

## Current Status

### Implemented

- Project and evidence intake
  - Manual project editing
  - Import `.json`, `.md`, `.markdown`, and `.txt`
  - Split structured files into `project + evidence`
- Two formal analysis modes
  - `Quick Scan`, mapped to `balanced`
  - `Deep Dive`, mapped to `reasoning`
- Visible execution progress
  - Current stage, stage status, model info, fallback info, and warnings
  - Pollable progress instead of a black-box wait
- Structured outputs
  - `perspectives`
  - `blindSpots`
  - `scenarioVariants`
  - `futureTimeline`
  - `validationTracks`
  - `redTeam`
  - `report`
- Lightweight memory
  - Successful runs persist summary, primary risk, blind spots, and validation focus to `server/data/sandbox-memory.json`
  - Similar future projects can reuse those signals

### In Design / Next To Build

- `Baseline` freezing
  - Turn the first formal analysis into a reusable world state
- `Variable` injection
  - Compile a new mechanic, system change, live-ops design, or monetization change into a structured delta
- Forward simulation
  - Observe downstream evolution from `baseline + variable + persona prototypes + rules`
- Reverse reasoning
  - Trace outcomes back to causes, or backchain from a target outcome to required conditions

For the detailed design direction, see:

- [Variable Sandbox System Design](./docs/specs/game-wind-tunnel-variable-sandbox-system-design.md)
- [Variable Sandbox Implementation Flow](./docs/specs/guanbian-variable-sandbox-implementation-flow.md)

## Stack

- Frontend: `React 18` + `Vite` + `TypeScript`
- Backend: `Express` + `TypeScript` + `tsx`
- Shared layer: domain models, schemas, request/response types under `shared/`
- Runtime model: frontend dev server + separate API server; production build served by Node with static assets

## Repository Layout

```text
.
├─ src/                             # Frontend app
│  ├─ api/                          # API request wrappers
│  ├─ components/
│  │  ├─ analysis/                  # Analysis panels, progress, timelines, prediction graph
│  │  ├─ import/                    # File import UI
│  │  ├─ layout/                    # Workspace header and layout
│  │  ├─ project/                   # Project editing cards
│  │  └─ ui/                        # Lightweight UI components
│  ├─ data/                         # Local mock/static data
│  ├─ hooks/                        # Project, evidence, and analysis state
│  ├─ lib/                          # Import parsers, stage metadata, progress helpers
│  ├─ pages/                        # overview / evidence / modeling / strategy / report
│  ├─ styles/                       # Global, layout, and page styles
│  ├─ App.tsx                       # Main workspace entry
│  ├─ main.tsx                      # React mount entry
│  └─ types.ts                      # Frontend view types
├─ server/                          # Backend service
│  ├─ routes/                       # API routes
│  ├─ lib/                          # Analysis job store, orchestration, fallbacks, memory
│  ├─ data/                         # Local runtime data
│  ├─ config.ts                     # Env and runtime config
│  └─ index.ts                      # Express entry
├─ shared/                          # Shared models and runtime schemas
├─ docs/                            # Specs, guides, roadmap
├─ examples/                        # Fixtures and example inputs/results
├─ scripts/                         # Helper scripts
├─ dist/                            # Frontend build output
└─ dist-server/                     # Server build output
```

## Current Architecture

### Frontend workbench

- `src/App.tsx` organizes the current five stages: `overview -> evidence -> modeling -> strategy -> report`
- `src/hooks/useProject.ts` and `src/hooks/useEvidence.ts` manage workspace input state
- `src/hooks/useSandboxAnalysis.ts` starts analysis jobs and polls results
- Components under `src/components/analysis/` break execution progress and final output into panels

### Backend analysis pipeline

- `server/routes/sandbox.ts`
  - validates requests
  - creates analysis jobs
  - starts async analysis
  - exposes polling endpoints
- `server/lib/orchestration/`
  - `executionPlan.ts` builds plans by mode
  - `runStage.ts` runs individual LLM stages
  - `prompts/` manages dossier / specialist / synthesis / refine prompts
  - `fallback.ts` handles local degradation paths
  - `progressPreview.ts` prepares stage previews for the UI

### Shared types and schemas

- `shared/domain.ts` defines project, evidence, persona, and strategy objects
- `shared/sandbox.ts` defines analysis modes, stages, jobs, and result types
- `shared/schema/` owns runtime parsing, validation, and normalization

## Current Runtime Flow

1. The frontend submits `project + evidenceItems + mode` to `POST /api/sandbox/analyze`
2. The backend creates an in-memory job and immediately returns `202 Accepted`
3. The frontend polls `GET /api/sandbox/analyze/:jobId`
4. The backend runs:
   - `dossier`
   - `specialists`
   - `synthesis`
   - `refine`
5. Each stage writes back status, model info, previews, and timing
6. The final result returns to the frontend; fresh results can also be written to `server/data/sandbox-memory.json`

## Local Development

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and at minimum fill `DEEPSEEK_API_KEY`:

```env
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_CHAT_MODEL=deepseek-chat
DEEPSEEK_REASONING_MODEL=deepseek-reasoner
LLM_BALANCED_TIMEOUT_MS=60000
LLM_REASONING_TIMEOUT_MS=150000
LLM_BALANCED_SPECIALIST_CONCURRENCY=3
LLM_REASONING_SPECIALIST_CONCURRENCY=4
LLM_ENABLE_REASONING_REFINE_STAGE=false
PORT=5001
```

### 3. Start development

Run frontend and backend together:

```bash
npm run dev:full
```

Or run them separately:

```bash
npm run dev
npm run dev:server
```

Default addresses:

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:5001`

### 4. Build and run production bundle

```bash
npm run build
npm start
```

Notes:

- `npm run build:client` writes `dist/`
- `npm run build:server` writes `dist-server/`
- `server/index.ts` serves frontend static assets if `dist/` exists

## Common Scripts

- `npm run dev`
- `npm run dev:server`
- `npm run dev:full`
- `npm run build`
- `npm start`
- `npm run typecheck`
- `npm test`
- `npm run verify:fixtures`
- `npm run preview`

## Current API

- `GET /api/health`
- `POST /api/sandbox/analyze`
- `GET /api/sandbox/analyze/:jobId`

## Docs And Examples

- [Chinese README](./README.md)
- [Upload Guide](./docs/document-upload-guide.md)
- [Product PRD](./docs/specs/product-wind-tunnel-mvp-prd.md)
- [API / Data Architecture](./docs/specs/game-wind-tunnel-api-data-architecture.md)
- [Variable Sandbox System Design](./docs/specs/game-wind-tunnel-variable-sandbox-system-design.md)
- [Variable Sandbox Implementation Flow](./docs/specs/guanbian-variable-sandbox-implementation-flow.md)
- [UI Design Spec](./docs/specs/game-wind-tunnel-ui-design-spec.md)
- [Roadmap](./docs/next-phase-roadmap.md)
- [Markdown import example](./examples/coop-camp-upload-sample.md)
- [JSON import example](./examples/project-bundle-upload-sample.json)
- [Request fixture](./examples/requests/valid-analysis-request.json)
- [Result fixture](./examples/expected/degraded-analysis-result.json)

## Windows / PowerShell UTF-8 Note

This repository contains Chinese source files, docs, and fixtures. In PowerShell, if output looks garbled, run:

```powershell
& "$PWD\scripts\agent-utf8-bootstrap.ps1"
```

Then read files with `Get-Content -Encoding utf8` so console encoding issues are not mistaken for file corruption.

## Current Boundaries

- Formal remote analysis depends on DeepSeek configuration
- `Quick Scan` and `Deep Dive` share the same async job mechanism but run different plans
- Job state is still in-memory and not a durable queue
- Project-level `Baseline / Variable / Simulation` storage is designed but not fully implemented yet
- Tests cover core parsing and normalization, not full end-to-end workflows
