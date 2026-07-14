# PULSE — Engineering Blueprint

**The AI Nervous System for Smart Stadiums** · PromptWars Challenge 4

PULSE is an agentic AI operating system for live-event safety operations. It ingests a live
telemetry stream (crowd density, gate throughput, queues, weather, match events), forecasts risk
before it materializes, reasons about incidents with Gemini, and closes the loop by dispatching
stewards and tracking outcomes — including a dedicated lost-child reunification workflow.

It is **not a chatbot**: agents observe → reason → decide → act → verify, continuously, with every
decision auditable (full reasoning chain persisted).

---

## 1. Challenge-fit assessment (done before any code)

| Judging axis | How PULSE scores it |
|---|---|
| Agentic AI, not a chatbot | Four named agents run an observe→reason→act loop against a live stream; decisions create dispatches, not text. |
| Real reasoning | Gemini receives raw telemetry windows + incident context and returns structured JSON (forecasts, priority scores, action plans) with an explicit reasoning chain rendered in the UI. |
| Gemini where it adds value | Forecast explanation, incident triage/prioritization, dispatch rationale, descriptor extraction & fuzzy matching for Reunite. Deterministic math (nearest-steward distance, SLA timers) stays in code — AI is used only where judgment is needed. |
| 2–3 min live demo | Demo director: compressed 90-minute match clock (~6 min), scripted-probability event beats (goal surge, halftime crush, lost child), one-click scenario triggers. |
| Technical originality | Custom SVG stadium digital-twin renderer, agent decision ledger, dual-mode data plane (in-memory ⇄ Firestore) so the demo never dies on stage. |
| Real-world deployment | Simulation engine is an adapter behind the same telemetry interface a real CV pipeline would feed; Firestore/Functions path is production topology. |
| Scalability beyond FIFA | Zone-graph model is venue-agnostic: concerts, marathons, transit hubs, Hajj-scale pilgrimages — anything with zones, flows, and stewards. |
| Ethics & privacy | No face recognition anywhere. Crowd data is aggregate density only. Reunite matches *descriptors* (clothing, age band) reported by guardians/stewards, never biometrics. Every AI decision is logged, explained, and human-confirmable (human-in-the-loop dispatch approval). |
| Startup narrative | "Stadiums have cameras but no cortex. PULSE is the nervous system: senses (Vision), cortex (Brain), motor neurons (Dispatch), and a conscience (Reunite)." |
| Polished UX | Dark-first glassmorphism design system, command palette (⌘K), micro-interactions, live-animated heatmap. |

---

## 2. Functional requirements

### FR-1 Pulse Vision (perception & forecasting)
- FR-1.1 Live per-zone crowd density (0–100 %) across a 16-zone stadium graph, updated every tick (2.5 s).
- FR-1.2 Animated SVG stadium heatmap with density color scale, zone selection, and detail drawer.
- FR-1.3 15-minute density forecast per zone (Gemini, structured output) with confidence and plain-language reasoning.
- FR-1.4 Risk levels per zone (`calm / busy / crowded / critical`) with thresholds and trend arrows.
- FR-1.5 Crowd-flow simulation reacts to match events (goal → concourse surge, halftime → food/restroom surge, full-time → gate egress).

### FR-2 Pulse Brain (decision engine)
- FR-2.1 Every new incident is triaged by Gemini: severity 1–5, priority ranking against open incidents, recommended actions.
- FR-2.2 Reasoning chain (observations → inferences → decision) rendered step-by-step in UI and persisted to the decision ledger.
- FR-2.3 Proactive alerts: when forecast crosses a risk threshold, Brain emits a recommendation *before* an incident exists.
- FR-2.4 Human-in-the-loop: operator approves/overrides recommendations; overrides are logged with the AI's original plan.

### FR-3 Pulse Dispatch (actuation)
- FR-3.1 Steward roster with live positions on the stadium map, status (`available / en-route / on-scene / break`), skills (medical, security, guest-services).
- FR-3.2 Nearest-qualified-steward assignment (deterministic zone-graph distance) with AI rationale attached.
- FR-3.3 Task lifecycle: `pending → assigned → en-route → on-scene → resolved`, timestamps at every transition.
- FR-3.4 SLA timers per severity (S5: 3 min, S4: 5 min, S3: 10 min, S2: 20 min, S1: 45 min) with breach warnings.
- FR-3.5 In-app notification center (toast + inbox) for assignments, SLA warnings, resolutions.

### FR-4 Pulse Reunite (lost-child workflow)
- FR-4.1 Guardian report intake form (free-text description + structured fields, React Hook Form + Zod).
- FR-4.2 Gemini extracts a structured descriptor (age band, clothing colors/items, hair, accessories, last-seen zone) from free text.
- FR-4.3 Steward sighting reports create candidate records; Gemini scores descriptor↔sighting similarity with per-attribute reasoning.
- FR-4.4 Case workflow: `reported → searching → candidate-found → verifying → reunited`, with automatic steward dispatch to sweep zones.
- FR-4.5 Privacy: no photos of children stored; descriptor-only matching; cases auto-archive on closure.

### FR-5 Operations Dashboard
- FR-5.1 Command view: KPI strip (attendance, avg density, open incidents, active dispatches, SLA health), live incident feed, mini-map, match timeline.
- FR-5.2 Crowd Weather: a synthesized 0–100 "stadium pressure" index with narrative summary.
- FR-5.3 Event timeline: match events, incidents, AI decisions and dispatches interleaved chronologically.
- FR-5.4 Analytics: density history area charts, incidents by type/severity, response-time distribution, gate throughput; CSV/JSON export.

### FR-6 Platform
- FR-6.1 Auth: Firebase email/password + Google sign-in, plus zero-config **Demo Mode** (local session) so the app is never gated on credentials.
- FR-6.2 Realtime data plane: identical pub/sub API backed by in-memory bus (default) or Firestore (when env keys present).
- FR-6.3 Simulation engine: seeded, event-driven generator streaming all telemetry every 2.5 s; demo director panel to trigger scenarios (goal, medical, lost child, gate surge).
- FR-6.4 Command palette (⌘K): navigate, trigger scenarios, create incidents, search.
- FR-6.5 Decision ledger: every AI call (prompt context hash, model, output, latency) persisted and browsable.

## 3. Non-functional requirements

- **NFR-1 Resilience:** app fully functional with zero external credentials (local bus + heuristic AI fallback clearly labeled "offline reasoning"); Gemini/Firestore activate via env.
- **NFR-2 Performance:** first load < 3 s on broadband; tick processing < 16 ms; heatmap animates at 60 fps (SVG + CSS transforms, no canvas thrash); Recharts virtualized to last 60 points.
- **NFR-3 Type safety:** strict TypeScript, Zod validation at every I/O boundary (forms, API routes, AI outputs, Firestore docs).
- **NFR-4 Security:** Gemini key server-side only (API routes); Firestore rules restrict writes to authed users; no PII beyond descriptors.
- **NFR-5 Accessibility:** keyboard-navigable, focus rings, ARIA on live regions, WCAG AA contrast in both themes, `prefers-reduced-motion` respected.
- **NFR-6 Code quality:** feature-based architecture, SOLID, no duplication; ESLint + `tsc --noEmit` clean; every phase compiles.
- **NFR-7 Auditability:** all agent decisions immutable in ledger with reasoning.

## 4. User personas

1. **Amara — Safety Operations Director (primary).** Runs the control room. Needs pre-emptive risk warnings, one-glance situational awareness, and defensible audit trails. Uses: Dashboard, Vision, Brain.
2. **Diego — Dispatch Coordinator.** Owns steward allocation and SLAs. Needs instant nearest-unit answers and breach warnings. Uses: Dispatch, notifications.
3. **Priya — Steward (field).** Receives tasks, reports sightings, confirms reunions. Uses: Dispatch task view, Reunite sighting form.
4. **Omar — Venue GM (exec).** Post-match accountability and insurance/regulator reporting. Uses: Analytics, exports, decision ledger.

## 5. Core user flows

1. **Predict → prevent:** density trend rises in Concourse North → Sentinel forecast crosses threshold → Brain issues pre-emptive recommendation ("open Gate C overflow, reroute via East ramp") with reasoning → operator approves → dispatch created → density curve flattens → timeline records the save.
2. **Incident → resolve:** medical incident at Block 214 → Brain triages S4, ranks #1 → Marshal proposes nearest medical steward (2 zones away, ETA 90 s) → operator confirms → steward transitions en-route → on-scene → resolved → SLA met, response time logged.
3. **Lost child → reunited:** guardian report free text → Guardian agent extracts descriptor → sweep dispatches to last-seen + adjacent zones → steward sighting logged → match scored 0.87 with per-attribute reasoning → verification → reunited; case archived.
4. **Sign-in:** login → Firebase (or Demo Mode) → dashboard boots simulation → live within 3 s.

## 6. AI agent architecture

```
                     ┌────────────────────────────────────────┐
 telemetry stream ──▶│ SENTINEL (Vision)                      │──▶ forecasts, risk flags
                     │ observe zones → forecast → explain     │
                     └───────────────┬────────────────────────┘
                                     ▼
 incidents ─────────▶┌────────────────────────────────────────┐
 forecasts ─────────▶│ STRATEGIST (Brain)                     │──▶ prioritized action plans
                     │ triage → rank → recommend → explain    │    + reasoning chains
                     └───────────────┬────────────────────────┘
                                     ▼ (operator approval — human in the loop)
 steward state ─────▶┌────────────────────────────────────────┐
                     │ MARSHAL (Dispatch)                     │──▶ assignments, SLA watch
                     │ select unit → rationale → track        │
                     └────────────────────────────────────────┘
 guardian reports ──▶┌────────────────────────────────────────┐
 sightings ─────────▶│ GUARDIAN (Reunite)                     │──▶ descriptors, match scores,
                     │ extract → sweep → match → verify       │    sweep dispatches
                     └────────────────────────────────────────┘
```

- All agents call Gemini through server API routes with **structured output** (`responseSchema`) and Zod re-validation.
- Deterministic sub-decisions (distance, SLA math) are code; Gemini supplies judgment + explanation.
- Every agent output → `decisions` ledger.
- Fallback: if `GEMINI_API_KEY` absent or a call fails, a heuristic engine produces the same shapes, labeled `engine: "heuristic"` in UI (demo never stalls).

## 7. System architecture

```
┌ Browser (Next.js 15 / React 19) ─────────────────────────────────────────────┐
│ Feature UIs (vision/brain/dispatch/reunite/ops) ← Zustand stores             │
│        ▲                    ▲                                                │
│        │ subscribe          │ actions                                        │
│ ┌──────┴──────────┐  ┌──────┴──────────┐                                     │
│ │ Realtime bus    │  │ Simulation      │  bus impl: LocalBus (default)       │
│ │ (pub/sub iface) │◀─│ engine (ticks)  │  or FirestoreBus (env-gated)        │
│ └──────┬──────────┘  └─────────────────┘                                     │
└────────┼─────────────────────────────────────────────────────────────────────┘
         │ fetch (server-only key)
┌────────▼────────────┐        ┌──────────────────┐
│ Next API routes     │───────▶│ Gemini API       │
│ /api/ai/*           │        │ (structured JSON)│
└────────┬────────────┘        └──────────────────┘
         │ (when configured)
┌────────▼────────────┐
│ Firebase: Auth,     │
│ Firestore (mirror + │
│ multi-console sync) │
└─────────────────────┘
```

Key decision: the simulation engine runs client-side in the operator console (single source of ticks), publishing through the bus. With Firestore configured, the bus mirrors to collections so multiple consoles stay in sync; without it, everything works in-memory. A production deployment swaps the sim engine for a CV/ticketing ingest worker publishing to the same bus interface.

## 8. Database schema (Firestore)

| Collection | Doc shape (validated by Zod) | Notes |
|---|---|---|
| `users` | uid, displayName, email, role (`director/coordinator/steward`), createdAt | Auth mirror |
| `zones` | id, name, kind (`gate/concourse/stand/pitch/facility`), capacity, neighbors[], centroid{x,y}, svgPath | Static seed, venue-agnostic |
| `telemetry` | zoneId, t, density, occupancy, inflow, outflow, queueLen, trend | 1 doc/zone, overwritten per tick; history kept in ring buffer client-side |
| `snapshots` | t, pressureIndex, attendance, weather{tempC, condition, windKph}, matchClock, phase | 1 doc, live |
| `matchEvents` | id, t, minute, type (`kickoff/goal/card/halftime/fulltime/announcement`), team?, description | append-only |
| `incidents` | id, createdAt, type (`medical/security/crowd/fire/lost-child/infrastructure`), zoneId, severity 1–5, status (`open/triaged/dispatched/resolved`), title, description, triage{priorityRank, rationale, engine} | |
| `dispatches` | id, incidentId, stewardId, status (`pending/assigned/en-route/on-scene/resolved/cancelled`), createdAt, statusTimestamps{}, slaSeconds, slaBreached, rationale | |
| `stewards` | id, name, skills[], status, zoneId, taskId? | Positions simulated |
| `reuniteCases` | id, status (`reported/searching/candidate-found/verifying/reunited/archived`), reporterName, freeText, descriptor{ageBand, gender?, hair, upperColor, upperItem, lowerColor, lowerItem, accessories[], lastSeenZoneId, minutesAgo}, candidates[]{sightingId, score, perAttribute[], rationale}, timestamps | Descriptor-only, no photos |
| `sightings` | id, caseId?, stewardId, zoneId, t, descriptor (same shape), notes | |
| `decisions` | id, t, agent (`sentinel/strategist/marshal/guardian`), engine (`gemini/heuristic`), model?, latencyMs, inputDigest, output (typed union), reasoning[] | Immutable audit ledger |

Relationships: `incidents 1—n dispatches`, `dispatches n—1 stewards`, `reuniteCases 1—n sightings`, everything n—1 `zones`. Suggested composite indexes: `incidents(status, severity desc)`, `dispatches(status, createdAt)`, `decisions(agent, t desc)`.

## 9. API design (Next.js route handlers; Zod-validated request/response)

| Route | Purpose |
|---|---|
| `POST /api/ai/forecast` | zone histories + match context → 15-min per-zone forecast, risk, reasoning |
| `POST /api/ai/triage` | incident + open-incident context + nearby telemetry → severity, rank, actions, reasoning |
| `POST /api/ai/dispatch-rationale` | chosen steward + alternatives + incident → rationale + briefing text |
| `POST /api/ai/reunite/extract` | free-text report → structured descriptor |
| `POST /api/ai/reunite/match` | descriptor + sightings → scored candidates with per-attribute reasoning |
| `POST /api/ai/briefing` | full snapshot → operator "crowd weather" narrative |

All return `{ ok, engine: "gemini"|"heuristic", data, reasoning, latencyMs }`; heuristic fallback on missing key/error/timeout (8 s).

## 10. Folder structure

```
src/
  app/                    # routes only — thin, compose features
    (auth)/login/
    (console)/            # authed shell: sidebar + topbar
      dashboard/ vision/ brain/ dispatch/ reunite/ analytics/ ledger/
    api/ai/...            # route handlers
    layout.tsx globals.css
  components/
    ui/                   # shadcn primitives
    shared/               # GlassCard, StatCard, PageHeader, EmptyState, Sparkline...
    layout/               # Sidebar, Topbar, CommandPalette, NotificationCenter
  features/
    vision/  brain/  dispatch/  reunite/  operations/  analytics/
      components/ hooks/  (feature-scoped)
    simulation/           # engine, scenario director, seed data
    auth/
  lib/
    ai/                   # gemini client, prompts, schemas, heuristic fallbacks
    bus/                  # RealtimeBus iface, LocalBus, FirestoreBus
    firebase/             # app init, auth helpers
    stadium/              # zone graph, geometry, distance
    schemas/              # zod domain schemas (single source of truth)
    utils.ts constants.ts
  stores/                 # zustand: simulation, incidents, dispatch, reunite, ui, auth
  hooks/                  # useBusCollection, useMatchClock, useHotkeys...
docs/                     # BLUEPRINT.md, progress.md
```

## 11. Component tree (console)

```
RootLayout (fonts, ThemeProvider, AuthProvider, BusProvider, Toaster)
└─ ConsoleLayout
   ├─ Sidebar (nav, live status dot, steward mini-roster, user)
   ├─ Topbar (match clock, phase badge, pressure index, weather, notifications, ⌘K, user menu)
   ├─ CommandPalette
   └─ page
      ├─ Dashboard: KpiStrip · StadiumMap(mini) · IncidentFeed · CrowdWeatherCard · MatchTimeline · DensityAreaChart
      ├─ Vision: StadiumMap(full, heatmap) · ZoneDrawer(history, forecast, reasoning) · ForecastBoard · RiskMatrix
      ├─ Brain: DecisionQueue · ReasoningChain · ApprovalBar · ProactiveAlerts
      ├─ Dispatch: StewardBoard · TaskKanban · SlaTimers · AssignmentDialog
      ├─ Reunite: CaseList · ReportIntakeForm · DescriptorCard · CandidateMatches · CaseTimeline
      ├─ Analytics: charts grid · ExportMenu
      └─ Ledger: DecisionTable · DecisionDetail
```

## 12. Design system

- **Mood:** mission-control. Dark-first (`#0A0A0F` base), glass surfaces (`bg-white/[0.04]`, `backdrop-blur`, 1px `white/[0.08]` borders), soft depth shadows.
- **Accent:** electric cyan `#22D3EE` → violet `#8B5CF6` gradient for brand/CTAs; semantic: emerald (calm/ok), amber (busy/warn), orange (crowded), rose (critical).
- **Type:** Geist Sans (UI) + Geist Mono (clocks, metrics, IDs). Tight tracking on display sizes, `tabular-nums` for live numbers.
- **Motion:** Framer Motion — page fade/slide (150–250 ms), staggered card entrances, animated number ticks, pulsing live indicators; all gated by `prefers-reduced-motion`.
- **Density scale (heatmap):** emerald → lime → amber → orange → rose with opacity ramp; smooth 500 ms transitions between ticks.
- **Interactions:** ⌘K palette, `g d/v/b/x/r/a` nav chords, hover elevations, skeleton-free (live data boots instantly from sim).

## 13. Feature priority

P0 (demo-critical): sim engine, heatmap, dashboard, Brain triage + reasoning UI, dispatch flow, Reunite happy path, ⌘K, demo director.
P1: analytics + export, ledger, notifications inbox, proactive alerts, SLA breach flow, Firestore mirror.
P2: multi-venue config, steward mobile view, report PDF, role-based access.

## 14. 5-day roadmap

- **Day 1:** Phases 1–2 — foundation, design system, shell, dashboard UI with mocked stores.
- **Day 2:** Phase 3 — simulation engine, bus, live wiring of all widgets; heatmap animation.
- **Day 3:** Phase 4 — Gemini routes, prompts, structured outputs, reasoning UI, fallbacks.
- **Day 4:** Phases 5–6 — dispatch lifecycle + SLA + notifications; Reunite end-to-end.
- **Day 5:** Phases 7–8 — analytics/export, ledger, a11y/perf pass, deploy (Vercel + Firebase), demo script rehearsal.
