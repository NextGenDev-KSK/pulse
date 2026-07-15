<div align="center">

# PULSE — The AI Nervous System for Smart Stadiums

**An agentic AI operating system for live-event safety.**

Built for **PromptWars Challenge 4**.

**Live demo → https://pulse-vercel-tau.vercel.app**

</div>

---

## Overview

PULSE senses a 62,000-seat stadium in real time, forecasts crowd risk before it forms, reasons
about every incident with Gemini, dispatches the nearest responder, and runs a privacy-first
lost-child reunification workflow — all backed by an auditable decision ledger.

It is **not a chatbot**. Four named agents run a continuous **observe → reason → decide → act →
verify** loop against a live telemetry stream, and every decision is explained and logged.

The app is fully functional with **zero configuration**: the console auto-starts a live
simulation and a deterministic heuristic engine drives all four agents. Add a Gemini key to
upgrade the reasoning to the real model, and Firebase keys to enable real auth and persistence.

## Why PULSE exists

Modern venues are saturated with cameras and sensors but have no system that *acts* on what they
see. Control rooms watch dashboards and react after an incident has already formed. PULSE is the
missing layer between sensing and response: senses (Vision), a cortex (Brain), motor neurons
(Dispatch), and a conscience (Reunite). The goal is prevention and accountable action — with the
ethics constraints (no biometrics, human-in-the-loop, full audit trail) built in from the start.

## Screenshots

| Operations dashboard | Pulse Vision |
|---|---|
| ![Operations dashboard](docs/Screenshots/dashboard.png) | ![Pulse Vision heatmap](docs/Screenshots/vision.png) |
| **Pulse Brain** | **Pulse Dispatch** |
| ![Pulse Brain reasoning](docs/Screenshots/brain.png) | ![Pulse Dispatch board](docs/Screenshots/dispatch.png) |
| **Pulse Reunite** | **Decision Ledger** |
| ![Pulse Reunite matches](docs/Screenshots/reunite.png) | ![Decision ledger](docs/Screenshots/ledger.png) |

## Features

- **Live simulation** — a deterministic, seeded, event-driven model advances a compressed
  ~90-minute match in ~6 minutes across 16 stadium zones, reacting to goals, cards, halftime
  surges, and weather. A Scenario Director triggers demo beats on one click.
- **Pulse Vision** — an animated SVG stadium digital twin with per-zone density, a zone inspector
  (live telemetry + history), and Sentinel's 15-minute risk forecast.
- **Pulse Brain** — a priority-ranked decision queue where Strategist triages each incident to a
  1–5 severity with confidence, required skill, an animated reasoning chain, and recommended
  actions, plus pre-emptive alerts from the forecast.
- **Pulse Dispatch** — nearest-qualified-responder assignment on the zone graph, a dispatch board
  with a lifecycle stepper and live SLA timer, and a steward roster.
- **Pulse Reunite** — a privacy-first lost-child workflow: Guardian extracts a descriptor from a
  free-text report, sweeps zones, gathers sightings, and scores candidate matches with a
  per-attribute breakdown. Reunions are human-confirmed. No biometrics, no images.
- **Operations, Analytics & Ledger** — a command dashboard, analytics with CSV/JSON export, and a
  filterable, immutable decision ledger showing engine, model, and latency per decision.
- **Console UX** — command palette (⌘K), leader-key nav chords, notification center, dark-first
  glassmorphism theme with light mode, and full `prefers-reduced-motion` support.

## AI agent architecture

Four agents run against the live stream. Gemini is used only where judgment is needed;
deterministic math (distance, ETA, SLA) stays in code. Each call is recorded to the decision ledger.

| Agent | Module | Responsibility | Server route |
|-------|--------|----------------|--------------|
| **Sentinel** | Vision | Per-zone density perception and 15-minute risk forecast; pre-emptive alerts. | `/api/ai/forecast`, `/api/ai/briefing` |
| **Strategist** | Brain | Triage severity 1–5, rank priorities, reason out an action plan. | `/api/ai/triage` |
| **Marshal** | Dispatch | Select the nearest qualified responder, attach rationale, track SLA. | `/api/ai/dispatch-rationale` |
| **Guardian** | Reunite | Extract a privacy-safe descriptor and score it against sightings. | `/api/ai/reunite/extract`, `/api/ai/reunite/match` |

Every `/api/ai/*` handler requests structured output with a strict `responseSchema`, re-validates
it against the same Zod schema, and falls back to a deterministic **heuristic** in the identical
shape on a missing key, a 9-second timeout, or malformed output. The response is always tagged
`engine: "gemini" | "heuristic"` and the UI shows which one answered.

Each handler runs a shared **preflight** first — per-IP fixed-window rate limiting, a JSON
content-type check, a request-size cap, and safe parsing — and returns a correlatable
`x-request-id`. All public free text (incident reports, guardian descriptions, steward notes) is
sanitised and wrapped in labelled untrusted-input fences, with an explicit anti-prompt-injection
clause on every system prompt, before it reaches Gemini.

## Technology stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
Framer Motion · Recharts · Zustand · Zod · React Hook Form · Gemini (`@google/genai`) ·
Firebase (optional) · Lucide icons.

## Demo flow

1. **Land & launch** — open the app, *Launch console → Enter demo mode*. The dashboard is already live.
2. **Predict** — open **Pulse Vision**; click a zone for live telemetry and Sentinel's forecast.
3. **Reason** — open **Pulse Brain**; trigger *Medical emergency* and watch Strategist triage it.
4. **Act** — open **Pulse Dispatch**; Marshal has assigned the nearest steward with a live SLA timer.
5. **Reunite** — trigger *Lost child report*; watch Guardian extract, sweep, and score matches, then confirm the reunion.
6. **Account** — open the **Decision Ledger** for every AI decision with its reasoning, engine, and latency.

Press `⌘K` / `Ctrl+K` anywhere for the command palette. Nav chords: `g` then `d/v/b/x/r/a/l`.

## Local installation

Requires Node.js 20+.

```bash
git clone https://github.com/NextGenDev-KSK/pulse.git
cd pulse
npm install
npm run dev            # http://localhost:3000
```

No configuration required. Open the app → *Launch console* → *Enter demo mode*.

Build and verify:

```bash
npm run build          # production build (Turbopack)
npm run typecheck      # strict type check (tsc --noEmit)
npm run lint           # lint (0 errors; a few documented advisory warnings)
npm test               # Vitest suite (unit + integration)
npm run test:coverage  # same, with a V8 coverage report
```

## Testing

The project ships a **Vitest + React Testing Library** suite covering the deterministic core of
the product — the layer a demo can't prove by clicking:

- **Simulation engine** — seeded determinism, phase progression, schema-valid clamped telemetry,
  and every operator scenario.
- **Dispatch assignment** — nearest-qualified-responder selection, skill precedence, availability
  filtering, and alternatives ordering.
- **AI heuristic engines** — triage severity logic, forecasting, descriptor extraction, and
  candidate matching, each validated against its Zod schema.
- **Reunite matching** — sighting generation and per-attribute scoring.
- **Zod schemas, zone graph, stores, utilities, CSV/JSON export.**
- **API routes** — request validation, the security preflight (rate limit, size, content-type),
  and graceful heuristic fallback with no Gemini key.
- **Security** — prompt-injection sanitisation/fencing and the rate limiter.

The suite runs offline with no keys. Core-logic line coverage is ~95%; the presentational React
views are verified against the live app rather than snapshot-tested (meaningful over artificial
coverage).

## Deployment

Deployed on **Vercel** — import the repo and deploy. A deployment with no environment variables
is already a working demo (Demo Mode + heuristic engine). Add `GEMINI_API_KEY` in the Vercel
project settings to activate real Gemini reasoning; the AI layer switches over automatically on
the next request. Response security headers are applied by `next.config.ts` and require no extra
configuration.

## Environment variables

All optional — the app runs fully in Demo Mode with none. Copy `.env.example` to `.env.local` to
enable the real paths. `GEMINI_API_KEY` is **server-side only** and is never exposed to the browser.

| Variable | Effect if set |
|----------|---------------|
| `GEMINI_API_KEY` | Enables real Gemini reasoning (otherwise the heuristic engine is used). |
| `GEMINI_MODEL` | Overrides the model actually called (defaults to `gemini-2.0-flash`). |
| `NEXT_PUBLIC_GEMINI_MODEL` | Display-only label shown in the ledger (defaults to `gemini-2.0-flash`). |
| `NEXT_PUBLIC_FIREBASE_*` | Enables Firebase Auth and Firestore (six values; see `.env.example`). |

## Project structure

```
src/
  app/              routes only — (auth)/login, (console)/* modules, api/ai/* handlers
  components/       ui/ (primitives) · shared/ · layout/ · providers/
  features/         vision brain dispatch reunite operations analytics ledger
                    simulation (engine + scenario director) · auth · marketing
  lib/              ai/ (gemini, prompts, schemas, heuristics) · schemas/ (Zod source of truth)
                    stadium/ · firebase/ · api/ · utils
  stores/           zustand stores (simulation, incidents, dispatch, reunite, decisions, ui, ai)
  hooks/
```

## Privacy & ethics

- **No facial recognition, anywhere.** Crowd data is aggregate density only.
- **Descriptor-based reunification** — Reunite matches human-reported descriptors (clothing,
  hair, accessories), never biometrics, and stores no child images.
- **Human-in-the-loop** — reunions and high-impact actions are confirmed by an operator.
- **Auditable** — every agent decision is immutable in the ledger with its full reasoning chain.

## Roadmap

- Firestore mirror for multi-console sync.
- Durable (Redis-backed) rate limiter for multi-instance deployments.
- Role-based steward mobile task view.
- Multi-venue configuration (externalized zone graph).
- Nonce-based strict Content-Security-Policy.

## License

[MIT](LICENSE).
