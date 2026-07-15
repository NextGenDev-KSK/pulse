# PULSE — Engineering Progress

This file records the engineering state of the repository. It is a handoff log:
each pass appends what changed, why, and how it was verified.

## Current state

- **Build:** `npm run build` passes (Next.js 16 / Turbopack, 18 routes).
- **Types:** `npm run typecheck` (`tsc --noEmit`, strict) clean.
- **Lint:** `npm run lint` — 0 errors; 6 documented advisory warnings (React-Compiler-preview
  rules deliberately kept as advisories for SSR-safe mount/hydration and impure calls in event
  handlers — see `eslint.config.mjs`).
- **Tests:** `npm test` — 200 tests across 26 files, all passing. Deterministic-core line
  coverage ~94.7%.

## Pass — Quality hardening & test suite (2026-07-15)

A full multi-role engineering pass over the feature-complete app. No features, UI, architecture,
or workflows were changed; the goal was engineering quality only.

### Testing (new)
- Added **Vitest + React Testing Library + jsdom** with a `vitest.config.ts` (jsdom env, `@/*`
  alias mirroring tsconfig, V8 coverage) and `src/test/setup.ts`.
- Added scripts: `test`, `test:watch`, `test:coverage`, `typecheck`.
- 176 tests covering: simulation engine (determinism, phase progression, clamped schema-valid
  telemetry, scenarios), dispatch assignment, AI heuristics (triage/forecast/extract/match/
  briefing), reunite sighting generation + matching, Zod schemas, zone graph integrity, stores,
  utilities, CSV/JSON export, the API security module, and all six AI routes (validation,
  preflight guards, heuristic fallback). Core-logic line coverage ≈ 94.6%.

### Security (Phase 6)
- **Wired in previously-dead security infrastructure.** `src/lib/api/security.ts` (rate limit,
  size limit, content-type check, safe parse, request-id) and `src/lib/ai/sanitize.ts`
  (`sanitizeUserText`, `fence`, `INJECTION_GUARD`) existed but were imported nowhere. All six
  `/api/ai/*` routes now run `preflight()` and return via `aiSuccess()` / `invalidRequest()` with
  an `x-request-id` header.
- **Prompt-injection defence:** every user-influenced field (incident report, guardian free text,
  steward notes) is sanitised and, where free-form, wrapped in a labelled untrusted-input fence.
  `INJECTION_GUARD` is appended to every agent system prompt.
- Rate-limited requests degrade gracefully — the client already falls back to the heuristic engine
  on any non-OK response, so the UX is never broken by a 429.

### Code quality (Phase 3/4)
- `factories.ts`: removed an identical-branch ternary (dead logic) in `makeIncident`.
- `export.ts`: added an OWASP CSV formula-injection guard (`=,+,-,@,\t,\r` leading chars are
  prefixed with `'`).

### Files added
- `vitest.config.ts`, `src/test/setup.ts`
- `*.test.ts(x)` colocated with the modules under test (21 files).

### Files changed
- `package.json` (scripts + devDependencies), `README.md` (verify commands, Testing section,
  hardened-route note, roadmap).
- 6 API route handlers, `src/lib/ai/prompts.ts`, `src/features/simulation/engine/factories.ts`,
  `src/lib/export.ts`.

### Verification
`npm run build`, `npm run typecheck`, `npm run lint`, and `npm test` all pass.

## Pass — Adversarial hardening review (2026-07-15)

A second, deliberately hostile "reject-this-repo" review of runtime glue, a11y, and edge cases.
Findings fixed:

- **SLA breach was dead logic (HIGH).** `SLA_BY_SEVERITY` is in *simulated* match-seconds, but the
  dispatch pipeline and SLA timer compared it against *real* wall-clock seconds (≤12s), so breaches
  could never fire and every dispatch showed a meaningless "SLA met · ~8s". Added
  `slaForSeverity()` + `isSlaBreached(eta, severity)` (both operate in the simulated-second domain);
  the pipeline now fixes the breach verdict at assignment (ETA vs budget) and the timer shows the
  modelled response time. Unit-tested.
- **Keyboard-inaccessible zone selection (a11y).** `ZoneRiskTable` rows were click-only; now
  `role="button"`, `tabIndex=0`, Enter/Space handlers, `aria-pressed`, `aria-label`, focus ring.
  The SVG map stays `role="img"` (its data + selection is fully reachable via the table).
- **Dialog had no focus trap / no focus restoration (a11y).** Added a Tab focus trap, focus-in on
  open, and focus restoration to the opener on close (robust to the SSR-safe mount gate).
- **Timer leaks.** Dispatch + reunite pipelines now prune fired `setTimeout` ids; `withTimeout` in
  `gemini.ts` clears its timeout timer on settle (was leaking a 9s timer + reject closure per call).
- **Minor UX.** SLA timer no longer renders "Overdue left".

Reviewed clean (no change needed): no `dangerouslySetInnerHTML`/`eval`/XSS sinks, no leftover
logs (bar the error-boundary `console.error`), no TODOs, interval/listener cleanup discipline,
capped stores (ledger 200 / notifications 60 / events 40 / history 60), heatmap divide-by-zero
guard, client-side auth guard (acceptable — only simulated data behind it; the sole secret is
server-side behind rate-limited routes).

Tests grew 176 → 200 (26 files). Build/tsc/lint/test all green.
