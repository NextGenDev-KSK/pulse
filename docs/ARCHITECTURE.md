# Architecture

This is the working reference for how PULSE is put together. For the original design document —
requirements, personas, roadmap, and the full rationale behind each decision — see
[`BLUEPRINT.md`](BLUEPRINT.md). For build state, see [`progress.md`](progress.md).

## Overview

PULSE is a client-heavy Next.js 16 application. A deterministic simulation runs in the operator
console and streams telemetry to Zustand stores; feature UIs subscribe to those stores; and a
thin layer of server route handlers calls Gemini for the parts that need judgment. Every
external boundary is validated with Zod, and every agent decision is written to an audit ledger.

```
┌ Browser (Next.js 16 / React 19) ────────────────────────────────────────────┐
│  Feature UIs: vision · brain · dispatch · reunite · operations · analytics    │
│      ▲ subscribe            ▲ actions                                          │
│      │                      │                                                 │
│  Zustand stores  ◀──────  Simulation engine (seeded, event-driven ticks)      │
│      │  fetch (client AI helpers, with local heuristic fallback)              │
└──────┼────────────────────────────────────────────────────────────────────────┘
       │  HTTPS (server-only GEMINI_API_KEY)
┌──────▼──────────────┐        ┌──────────────────────┐
│  Next route handlers│───────▶│  Gemini API          │
│  /api/ai/*          │        │  (structured JSON)   │
└──────┬──────────────┘        └──────────────────────┘
       │  (optional, env-gated)
┌──────▼──────────────┐
│  Firebase: Auth +   │
│  Firestore mirror   │
└─────────────────────┘
```

The key idea: the simulation engine is an **adapter behind a telemetry interface**. In
production it would be replaced by a computer-vision / ticketing ingest worker publishing the
same shapes to the same stores — no UI or agent code would change.

## The agent loop

Four named agents run a continuous **observe → reason → decide → act → verify** loop.

| Agent | Module | Server route | Trigger |
|-------|--------|--------------|---------|
| **Sentinel** | Vision | `POST /api/ai/forecast`, `/api/ai/briefing` | every 6 ticks |
| **Strategist** | Brain | `POST /api/ai/triage` | every new incident |
| **Marshal** | Dispatch | `POST /api/ai/dispatch-rationale` | every assignment |
| **Guardian** | Reunite | `POST /api/ai/reunite/extract`, `/match` | lost-child report + sightings |

Deterministic sub-decisions — nearest-steward distance on the zone graph, ETA, SLA math — stay
in code (`src/features/dispatch/assignment.ts`, `src/lib/stadium/*`). Gemini is used only for
judgment and explanation. Each call is recorded via `recordDecision` into the `decisions`
ledger with agent, engine, model, latency, and the full reasoning chain.

## AI layer contract

Every `/api/ai/*` handler follows the same pipeline:

1. Parse the request body with a Zod contract (`src/lib/ai/contracts.ts`).
2. Call Gemini with a strict `responseSchema` (`src/lib/ai/response-schemas.ts`,
   prompts in `src/lib/ai/prompts.ts`).
3. Re-validate the model output against the domain Zod schema.
4. On missing key, 8s timeout, or any validation failure, run the deterministic **heuristic**
   engine, which returns the identical shape.
5. Respond with `{ ok, engine: "gemini" | "heuristic", data, latencyMs }`.

Client helpers in `src/lib/ai/client.ts` call these routes and additionally fall back to local
heuristics if the network itself fails, so the UI never blocks on the network.

## Data model

All domain types are inferred from Zod schemas in `src/lib/schemas/domain.ts` — the single
source of truth. The shapes are Firestore-collection-shaped so the same objects can either live
in Zustand (Demo Mode) or mirror to Firestore when configured. The collections and their fields
are documented in [`BLUEPRINT.md` §8](BLUEPRINT.md) and [`progress.md`](progress.md).

## Data plane

- **Demo Mode (default).** The simulation publishes to in-memory Zustand stores. No network, no
  keys, fully functional. State is per-tab and resets on a full page reload (SPA navigation
  preserves it).
- **Firebase Mode (env-gated).** When `NEXT_PUBLIC_FIREBASE_*` is present, auth switches to real
  Firebase and the data layer can mirror to Firestore for multi-console sync. The bus interface
  and stores are already shaped for this; the `FirestoreBus` writer is the next data-layer task.

## Source layout

```
src/
  app/                    routes only — thin, compose features
    (auth)/login/         login (Firebase or Demo Mode)
    (console)/            authed shell: sidebar + top bar + palette
      dashboard vision brain dispatch reunite analytics ledger
    api/ai/*              server route handlers (Gemini + heuristic fallback)
  components/  ui/ shared/ layout/ providers/
  features/    vision brain dispatch reunite operations analytics ledger
               simulation (engine, scenario director, seed)  auth  marketing
  lib/         ai/ schemas/ stadium/ firebase/  + constants, utils, export, ring-buffer
  stores/      zustand: simulation incident dispatch reunite decision notification ui ai
  hooks/
docs/          ARCHITECTURE.md BLUEPRINT.md DEMO.md DEPLOYMENT.md progress.md security.md
```

## Key decisions (summary)

- **Zod as the single source of truth** — every type is inferred from one schema module and
  reused to validate forms, API I/O, and AI output.
- **Hand-rolled shadcn-style UI primitives** instead of the shadcn CLI + Radix, to guarantee the
  bleeding-edge React 19 / Next 16 stack always compiles and to keep full a11y control.
- **Heuristic fallback for every AI call** — the product is demo-safe with zero keys and honest
  about which engine produced each answer.
- **Deterministic vs. AI split** — cheap, trustworthy math stays in code; only judgment is sent
  to the model.
- **Simulation as an adapter** — the production topology swaps the sim for a real ingest worker
  behind the same interface.

The longer form of each of these is in [`BLUEPRINT.md` §7 and its Decisions section](BLUEPRINT.md).
