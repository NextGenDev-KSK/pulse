# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Firestore mirror (`FirestoreBus`) for multi-console sync — interfaces and stores are already
  shaped for it.
- Unit tests for the simulation model, steward assignment, and heuristic engines.
- Role-based steward mobile task view.
- Multi-venue configuration (externalized zone graph).
- PDF report export in addition to CSV/JSON.

## [1.0.0] - 2026-07-14

First complete release. The application is end-to-end functional in Demo Mode with no
configuration, and upgrades to real Gemini reasoning and Firebase persistence when keys are
present.

### Added

**Platform & shell**
- Next.js 16 (App Router, Turbopack), React 19, strict TypeScript, Tailwind CSS v4 design system.
- Dark-first glassmorphism theme with light mode and persisted theme toggle.
- Firebase email/password + Google auth, plus zero-config Demo Mode that is never gated on keys.
- Collapsible sidebar, top bar (match clock, phase, pressure gauge, weather, attendance),
  command palette (⌘K), leader-key nav chords, notification center, and toast system.
- Global error boundary and branded not-found page; full `prefers-reduced-motion` support.

**Simulation**
- Deterministic, seeded, event-driven simulation model that advances a compressed ~90-minute
  match in ~6 minutes across 16 stadium zones, with phase-aware surges, goals, cards, and weather.
- Scenario Director for one-click demo beats (goal, halftime surge, medical, security,
  lost-child, gate-crush, weather). Auto-starts on console entry.

**Pulse Vision** — animated SVG stadium heatmap digital twin, zone inspector with live
telemetry and Sentinel forecast, and a sortable zone risk board.

**Pulse Brain** — priority-ranked decision queue with per-incident severity, confidence,
required skill, animated reasoning chain, and recommended actions; pre-emptive alerts from
Sentinel's forecast.

**Pulse Dispatch** — nearest-qualified-responder assignment on the zone graph, dispatch board
with lifecycle stepper and live SLA timer, steward roster, and response-time metrics.

**Pulse Reunite** — Guardian pipeline (extract descriptor → sweep → gather sightings → score
matches), privacy-safe descriptor card, candidate matches with per-attribute breakdown, case
timeline, manual report intake, and human-confirmed reunion. No biometrics or images.

**Operations, Analytics & Ledger** — command dashboard (KPI strip, mini heatmap, crowd-weather
narrative, pressure/density chart, incident feed, match timeline), analytics with CSV/JSON
export, and a filterable decision ledger with engine and latency per decision.

**AI engine**
- Six server route handlers (`/api/ai/triage`, `/forecast`, `/briefing`, `/dispatch-rationale`,
  `/reunite/extract`, `/reunite/match`), each performing Gemini structured output → Zod
  re-validation → heuristic fallback on missing key, timeout, or malformed output.

### Security
- Content-Security-Policy and a full set of response security headers
  (`Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy`); `poweredByHeader` disabled.

[Unreleased]: https://github.com/NextGenDev-KSK/pulse/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/NextGenDev-KSK/pulse/releases/tag/v1.0.0
