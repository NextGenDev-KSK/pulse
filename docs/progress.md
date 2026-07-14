# Project Overview

**PULSE — The AI Nervous System for Smart Stadiums** (PromptWars Challenge 4).

PULSE is an agentic AI operating system for live-event safety. It streams a simulated
62,000-seat stadium's crowd telemetry in real time, and four named agents run a
continuous observe → reason → decide → act → verify loop:

- **Sentinel** (Vision) — perceives crowd density and forecasts risk 15 min ahead.
- **Strategist** (Brain) — triages incidents (severity 1–5), ranks, and reasons out actions.
- **Marshal** (Dispatch) — assigns the nearest qualified responder; tracks lifecycle + SLA.
- **Guardian** (Reunite) — extracts a privacy-safe descriptor and matches lost children to sightings.

Gemini performs the reasoning (via server route handlers with strict `responseSchema`),
with a deterministic **heuristic fallback** for every call so the product works fully
offline with zero keys. Every decision is written to an immutable, explainable ledger.

---

# Current Phase

**All 8 phases complete.** The application is production-ready and end-to-end functional.

- Milestone: full agent loop live across all five modules + analytics + audit ledger.
- Completion: **~100%** of the planned scope. Remaining work is optional polish and a
  real cloud deployment (see Remaining Tasks).

Verified via: `npm run build` (passes, all routes prerender/compile), `tsc --noEmit`
(clean), `eslint` (0 errors, 6 documented advisories), and live browser runs with
screenshots of every module.

---

# Completed Features

**Platform / foundation**
- Next.js 16 App Router + Turbopack, React 19, strict TypeScript, Tailwind v4 design system.
- Dark-first glassmorphism theme with light mode; theme toggle persisted to localStorage.
- Auth: Firebase email/password + Google, plus zero-config **Demo Mode** (never gated on keys).
- Route groups: `(auth)` login, `(console)` authed shell with `AuthGuard`.
- Global error boundary (`error.tsx`) + branded `not-found.tsx`.
- `MotionConfig reducedMotion="user"` — full `prefers-reduced-motion` support.

**Shell & navigation**
- Collapsible **Sidebar** (nav, live status, user, sign-out).
- **Topbar** (match clock, phase, pressure gauge, weather, attendance, notifications, ⌘K, theme).
- **Command palette** (⌘K/Ctrl+K) — navigate, trigger scenarios, toggle sim/theme.
- Leader-key nav chords (`g` then `d/v/b/x/r/a/l`).
- **Notification center** (bell + inbox) with unread badge.
- Toast system (Framer Motion, 4 variants).

**Live simulation (Phase 3)**
- Deterministic, seeded, event-driven `SimulationModel` — advances a compressed ~90-min
  match in ~6 min, evolving 16 zones with phase-aware targets, surges, goals, cards, weather.
- Scenario Director + queue: goal, halftime surge, medical, security, lost-child, gate-crush, weather.
- Auto-starts on console entry; pause/reset controls.

**Pulse Vision**
- Animated SVG **stadium heatmap digital twin** (16 zones, density color scale, steward dots, incident markers, live legend).
- Zone inspector (live density, occupancy, flow, queue, history sparkline, Sentinel forecast).
- Zone risk board (sortable table).

**Pulse Brain**
- Agent status bar (live activity per agent).
- **Decision queue** — priority-ranked incidents, each with severity, confidence, required skill,
  animated **reasoning chain**, and recommended actions.
- **Pre-emptive alerts** from Sentinel's forecast.

**Pulse Dispatch**
- Nearest-qualified-responder assignment on the zone graph (skill + travel cost).
- **Dispatch board** with lifecycle stepper (assigned → en-route → on-scene → resolved), AI rationale, live **SLA timer**.
- **Steward roster** (18 stewards, status, skills, zone) + responder positions map.
- Response-time + SLA metrics.

**Pulse Reunite**
- Guardian pipeline: extract descriptor → dispatch sweep → gather sightings → score matches.
- **Descriptor card** (privacy-safe), **candidate matches** with score ring + per-attribute breakdown, **case timeline**.
- Manual **report intake dialog** (React Hook Form + Zod).
- Human-in-the-loop **confirm reunion**. No biometrics, no images.

**Operations Dashboard**
- KPI strip (attendance, density, incidents, dispatches, SLA health).
- Mini heatmap, **Crowd Weather** card (Gemini briefing narrative + gauge), pressure/density chart, incident feed, steward deployment, match timeline, Scenario Director.

**Analytics & Ledger**
- Analytics: summary KPIs, pressure/density chart, incidents by type & severity, response-time distribution, decisions by agent; **CSV/JSON export**.
- **Decision Ledger**: filterable audit trail (per agent) with engine + latency + full reasoning; export.

**AI engine (Phase 4)**
- 6 route handlers, each: Gemini structured output → Zod re-validation → heuristic fallback (8s timeout). See APIs below.

**Security & release engineering (v1.0.0)**
- Response security headers on every route via `next.config.ts` `headers()`: Content-Security-Policy,
  `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`,
  restrictive `Permissions-Policy`, `Cross-Origin-Opener-Policy`; `poweredByHeader` disabled.
  Verified live against a production build on both a page and an API route (headers emit; app returns 200).
- Public-release docs: `README.md` (world-class), `LICENSE` (MIT), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`, `CHANGELOG.md`, and `docs/{ARCHITECTURE,DEMO,DEPLOYMENT,security}.md`.
- Cleanup: removed the 5 unused `create-next-app` SVGs from `public/`; fixed `.gitignore` so
  `.env.example` is tracked (the `.env*` rule was hiding it). No functional code changed.

---

# Folder Structure

```
src/
  app/
    (auth)/login/page.tsx
    (console)/{layout,dashboard,vision,brain,dispatch,reunite,analytics,ledger}/…
    api/ai/{triage,forecast,briefing,dispatch-rationale,reunite/extract,reunite/match}/route.ts
    layout.tsx  error.tsx  not-found.tsx  page.tsx  globals.css
  components/
    ui/            # button card badge input textarea label select dialog dropdown tabs
                   # tooltip avatar skeleton progress separator toast
    shared/        # page-header stat-card empty-state sparkline severity-dot
                   # engine-badge reasoning-chain module-placeholder
    layout/        # sidebar topbar command-palette notification-center console-shell
                   # nav-config use-nav-hotkeys
    providers/     # app-providers theme-provider
  features/
    marketing/     # landing-page
    auth/          # auth-store auth-guard login-view types
    simulation/    # simulation-engine simulation-controls scenario-director seed
                   # use-scenario-actions  engine/{simulation-model,factories,types}
    vision/        # vision-view  components/{stadium-map,zone-inspector,zone-risk-table}
    operations/    # dashboard-view  components/{kpi-strip,incident-feed,crowd-weather-card,
                   #   match-timeline,pressure-chart,steward-status-card}
    brain/         # brain-view use-incident-pipeline  components/{agent-status-bar,
                   #   decision-queue,proactive-alerts}
    dispatch/      # dispatch-view assignment use-dispatch-pipeline
                   # components/{dispatch-board,steward-board,sla-timer}
    reunite/       # reunite-view use-reunite-pipeline  engine/sighting-generator
                   # components/{descriptor-card,candidate-matches,case-timeline,
                   #   case-list,report-intake-dialog}
    analytics/     # analytics-view  components/bar-panel
    ledger/        # ledger-view
  lib/
    ai/            # gemini client, prompts, response-schemas, heuristics, contracts,
                   # client, record-decision, model-name
    schemas/       # domain.ts  (Zod — single source of truth for all types)
    stadium/       # zones graph heatmap
    firebase/      # app.ts
    constants.ts  utils.ts  export.ts  ring-buffer.ts
  stores/          # simulation incident dispatch reunite decision notification ui ai
  hooks/           # use-now
docs/              # ARCHITECTURE.md  BLUEPRINT.md  DEMO.md  DEPLOYMENT.md  progress.md  security.md
```

124 TypeScript source files.

---

# Database Schema

Firestore-shaped (all validated by Zod in `src/lib/schemas/domain.ts`). In Demo Mode the
same shapes live in Zustand stores; with Firebase configured they mirror to collections.

| Collection | Key fields | Notes |
|---|---|---|
| `users` | uid, displayName, email, role | Auth mirror |
| `zones` | id, name, kind, capacity, neighbors[], centroid{x,y}, svgPath | Static seed (16 zones) |
| `telemetry` | zoneId, t, density, occupancy, inflow, outflow, queueLength, risk, trend | 1/zone, per tick |
| `snapshots` | t, matchClock, phase, attendance, capacity, pressureIndex, avgDensity, weather | Live world state |
| `matchEvents` | id, t, minute, type, team?, description | Append-only |
| `incidents` | id, createdAt, type, zoneId, severity 1–5, status, title, description, triage, resolvedAt | `triage` = full TriageResult |
| `dispatches` | id, incidentId, stewardId, stewardName, status, createdAt, etaSeconds, slaSeconds, slaBreached, resolvedAt, rationale, statusTimestamps{} | Lifecycle + SLA |
| `stewards` | id, name, skills[], status, zoneId, taskId | 18 seeded |
| `reuniteCases` | id, status, childName, reporterName, reporterContact, freeText, descriptor, candidates[], createdAt, reunitedAt, timeline[] | Descriptor-only |
| `sightings` | id, caseId, stewardName, zoneId, t, descriptor, notes | Steward reports |
| `decisions` | id, t, agent, engine, model, latencyMs, title, summary, reasoning[], relatedId | Immutable ledger |

Suggested composite indexes: `incidents(status, severity desc)`, `dispatches(status, createdAt)`, `decisions(agent, t desc)`.

---

# APIs

All under `/api/ai/*` (Node runtime). Request/response validated by Zod
(`src/lib/ai/contracts.ts`). Each returns
`{ ok, engine: "gemini"|"heuristic", data, latencyMs }` and falls back to a heuristic on
missing key / timeout / malformed output.

| Endpoint | Purpose | Request → Response |
|---|---|---|
| `POST /api/ai/triage` | Strategist triage | incident + snapshot + zone/neighbor telemetry + open count → `TriageResult` (severity, confidence, requiredSkill, rationale, reasoning[], recommendedActions[]) |
| `POST /api/ai/forecast` | Sentinel forecast | snapshot + telemetry + trends → `ForecastResult` (summary, reasoning[], per-zone predictions, proactiveAlerts[]) |
| `POST /api/ai/briefing` | Ops briefing | snapshot + hot zones + open incidents → `BriefingResult` (headline, narrative, watchItems[]) |
| `POST /api/ai/dispatch-rationale` | Marshal rationale | incident + chosen steward + alternatives → `{ rationale, briefing }` |
| `POST /api/ai/reunite/extract` | Guardian extract | freeText + lastSeenZone + minutesAgo → `Descriptor` |
| `POST /api/ai/reunite/match` | Guardian match | descriptor + sightings[] → `Candidate[]` (score, rationale, perAttribute[]) |

Client fetchers live in `src/lib/ai/client.ts` (also fall back to local heuristics if the network fails).

---

# Components

Selected (full list in Folder Structure). Purpose · location.

- `StadiumMap` — animated SVG heatmap twin · `features/vision/components/stadium-map.tsx`
- `ZoneInspector` — live zone telemetry + forecast · `features/vision/components/zone-inspector.tsx`
- `DecisionQueue` / `IncidentDecisionCard` — triaged incidents + reasoning · `features/brain/components/decision-queue.tsx`
- `ProactiveAlerts` — Sentinel pre-emptive alerts · `features/brain/components/proactive-alerts.tsx`
- `DispatchBoard` + `SlaTimer` — lifecycle + SLA · `features/dispatch/components/*`
- `StewardBoard` — roster · `features/dispatch/components/steward-board.tsx`
- `CandidateMatches` / `DescriptorCard` / `CaseTimeline` — Reunite · `features/reunite/components/*`
- `CrowdWeatherCard` / `KpiStrip` / `PressureChart` / `MatchTimeline` / `IncidentFeed` — dashboard · `features/operations/components/*`
- `BarPanel` — analytics chart · `features/analytics/components/bar-panel.tsx`
- `LedgerView` — audit trail · `features/ledger/ledger-view.tsx`
- Shared: `ReasoningChain`, `EngineBadge`, `SeverityDot`, `Sparkline`, `StatCard`, `PageHeader`, `EmptyState`.
- UI primitives (shadcn-style, hand-rolled for React 19): `Button Card Badge Input Textarea Label Select Dialog Dropdown Tabs Tooltip Avatar Skeleton Progress Separator Toast`.

---

# AI

**Agents & responsibilities**
- **Sentinel** — `POST /api/ai/forecast`; runs every 6 ticks. Predicts per-zone density + risk, emits proactive alerts. Also drives the ops **briefing**.
- **Strategist** — `POST /api/ai/triage`; fires on every new incident. Severity, priority rank, required skill, reasoning chain, actions.
- **Marshal** — `POST /api/ai/dispatch-rationale`; explains each assignment (deterministic selection stays in `assignment.ts`).
- **Guardian** — `POST /api/ai/reunite/extract` then `/match`; descriptor + candidate scoring.

**Prompts** — `src/lib/ai/prompts.ts` (system + user builders per task). **Response schemas** —
`src/lib/ai/response-schemas.ts` (Gemini `responseSchema` mirroring the Zod domain types).
**Model** — `gemini-2.0-flash` (override with `GEMINI_MODEL`).

**Reasoning workflows**
1. Incident arrives → Strategist triages (chain persisted) → Marshal selects nearest qualified steward → rationale → lifecycle → resolved. All logged.
2. Telemetry stream → Sentinel forecast → proactive alert *before* an incident → operator sees it in Brain/Vision.
3. Lost child → Guardian extract descriptor → sweep → sightings → scored candidates → operator confirms reunion.

Every call is recorded to the **decision ledger** via `recordDecision` with agent, engine, model, latency, and reasoning.

---

# Remaining Tasks

Ordered by priority (all optional — the app is complete and demo-ready):

1. **Deploy** to Vercel (frontend) and wire a real Firebase project + `GEMINI_API_KEY` for the live judge environment.
2. **Firestore mirror** — implement the optional `FirestoreBus` writer so multiple consoles sync (interfaces + stores already shaped for it).
3. **Role-based views** — a steward-only mobile task view (roles already modelled in auth).
4. **Multi-venue config** — externalise the zone graph so other venues (concerts, transit hubs) load a different map.
5. **PDF report export** — in addition to CSV/JSON.
6. **Unit tests** for `SimulationModel`, `assignment.ts`, and the heuristic engines.

---

# Known Issues

- **Heuristic reasoning wording**: one triage reasoning step can read slightly generically
  when density is just below the escalation threshold (cosmetic; Gemini path is clean).
- **Heuristic descriptor extraction** is keyword-based — rich but not perfect for unusual
  phrasing (e.g. "about 9" age not always parsed). Gemini handles these well.
- **State is per-tab** in Demo Mode (in-memory) — a full page reload resets the live session
  (SPA navigation preserves it). Firestore mode would persist across reloads/consoles.
- ESLint reports **6 advisory warnings** (React-Compiler-preview `set-state-in-effect` /
  `purity`) on idiomatic mount/hydration/handler patterns — intentionally downgraded to
  `warn` in `eslint.config.mjs`. 0 errors. `next build` does not run lint (Next 16).

---

# Decisions

- **Next.js 16 / React 19 / Tailwind v4** (what `create-next-app` shipped). Followed the
  bundled `node_modules/next/dist/docs` for breaking changes (Turbopack default, async
  request APIs, flat ESLint). Client-heavy realtime app → most UI is client components; AI is server route handlers.
- **Hand-rolled shadcn-style UI primitives** instead of the shadcn CLI + Radix — guarantees
  every phase compiles on this bleeding-edge stack, avoids peer-dep risk, keeps full a11y control.
- **Zod as the single source of truth** — all domain types are inferred from `schemas/domain.ts`;
  AI output is re-validated against the same schemas.
- **Simulation as an adapter** behind a telemetry interface — a real CV/ticketing pipeline
  can replace it without touching the UI or agents. This is the production topology.
- **Heuristic fallback for every AI call** — the demo never stalls without a Gemini key, and
  the UI is honest about which engine produced each decision.
- **Deterministic vs. AI split** — distance/ETA/SLA math is code; only judgment (forecast,
  triage, matching, rationale) goes to Gemini. Cheaper, faster, and more trustworthy.
- **Auto-start + Scenario Director** — instant "live" first impression and one-click demo beats.
- **Privacy by design** — descriptor-only Reunite, no biometrics, human-confirmed reunions, full audit ledger.

---

# Dependencies Installed

Runtime: `next@16`, `react@19`, `react-dom@19`, `@google/genai`, `firebase`, `zustand`,
`zod`, `react-hook-form`, `@hookform/resolvers`, `recharts`, `framer-motion`,
`lucide-react`, `date-fns`, `class-variance-authority`, `clsx`, `tailwind-merge`.

Dev: `typescript`, `@types/*`, `tailwindcss@4`, `@tailwindcss/postcss`, `eslint`,
`eslint-config-next`.

---

# Environment Variables

All optional — the app runs fully in Demo Mode with none. See `.env.example`.

```
GEMINI_API_KEY=            # server-side only; enables real Gemini reasoning
GEMINI_MODEL=gemini-2.0-flash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

# Setup Instructions

```bash
cd pulse
npm install
npm run dev          # http://localhost:3000
# Landing → "Launch console" → "Enter demo mode". Console auto-starts live.
```

Build / verify:

```bash
npm run build        # Turbopack production build (passes)
npx tsc --noEmit     # strict type check (clean)
npx eslint .         # 0 errors (6 documented advisories)
```

To enable real AI/Firebase: `cp .env.example .env.local` and fill keys, then restart dev.

To continue development: the codebase is feature-based. Add a new module under
`src/features/<name>` with its own `components/`, add a route under
`src/app/(console)/<name>/page.tsx`, register it in `src/components/layout/nav-config.ts`,
and add domain types to `src/lib/schemas/domain.ts`. New AI tasks: add a prompt +
responseSchema + route under `src/lib/ai` and `src/app/api/ai`, with a heuristic fallback.

---

# Next Immediate Task

Release-engineering and security hardening for v1.0.0 are **complete** (headers, community/docs
files, README, cleanup — all verified; build/tsc/lint green). The remaining step is deployment,
which requires the maintainer's own accounts:

**Deploy to Vercel and connect a real Gemini key for the judging environment.**
Specifically: (1) `vercel` deploy the app; (2) add `GEMINI_API_KEY` in Vercel project env;
(3) create a Firebase project and add the `NEXT_PUBLIC_FIREBASE_*` vars to enable real auth +
Firestore persistence; (4) smoke-test each module in production with the demo script in the
README. No code changes are required for (1)–(2); the AI layer switches from heuristic to
Gemini automatically once the key is present.
