# PULSE — Engineering Progress

This file records the engineering state of the repository. It is a handoff log:
each pass appends what changed, why, and how it was verified.

## Current state

- **Build:** `npm run build` passes (Next.js 16 / Turbopack, 18 routes).
- **Types:** `npm run typecheck` (`tsc --noEmit`, strict) clean.
- **Lint:** `npm run lint` — 0 errors; 6 documented advisory warnings (React-Compiler-preview
  rules deliberately kept as advisories for SSR-safe mount/hydration and impure calls in event
  handlers — see `eslint.config.mjs`).
- **Tests:** `npm test` — 201 tests across 26 files, all passing. Deterministic-core line
  coverage ~94.7%.
- **Version:** `package.json` is `1.0.0`, matching the published `v1.0.0` release tag.

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

## Pass — Final pre-submission engineering audit (2026-07-16)

A third full multi-role review (engineer / performance / a11y / security / QA / docs / release)
of the feature-complete app, treating the whole repository as the source of truth. The prior two
passes left the codebase in strong shape; this pass found and fixed **one real correctness bug**
plus a release-hygiene inconsistency, and confirmed the rest is production-ready. No features, UI,
architecture, APIs, or workflows were changed.

### Correctness (HIGH — fixed)
- **`heuristicForecast` emitted `NaN` predicted densities on the first forecast.**
  `src/lib/ai/heuristics.ts` computed the per-zone slope as
  `hist.length >= 2 ? hist[len-1] - hist[len-3] : 0`. A two-interval delta needs **three** samples;
  with exactly two, `hist[len-3]` is `hist[-1]` (`undefined`), so `slope` became `NaN` and poisoned
  `predictedDensity` (`NaN`). This is **reachable on the very first forecast** (fires at
  `tickCount === 1`, when each zone's density history is exactly two points), i.e. the default
  offline/heuristic path every judge sees first. `z.number()` rejects `NaN`, and the heuristic
  fallback is returned to the UI without re-validation, so the value reached the screen as
  "projected to reach **NaN%**". Fixed by requiring `hist.length >= 3` (flat trend below that).
  Behaviour for all valid (≥ 3-point) histories is unchanged. Proven pre/post: old formula →
  `NaN`; new → finite.
  - Regression test added in `src/lib/ai/heuristics.test.ts`: forecasts over `[]`, `[50]`, and
    `[50, 62]` histories must be schema-valid and yield finite `predictedDensity`.

### Release hygiene (fixed)
- `package.json` `version` was `0.1.0` while the repo ships a `v1.0.0` tag + GitHub release. Bumped
  to `1.0.0` (private package; not surfaced in the UI — pure manifest accuracy).

### Reviewed clean (no change justified)
- **Performance:** array store selectors use `useShallow`; `useMemo` applied where it pays;
  charts disable animation on live data; `optimizePackageImports` set for lucide/recharts/framer;
  every interval/timeout/listener has matching cleanup; pipelines read via `getState()` to avoid
  extra subscriptions.
- **Accessibility:** dialog focus-trap + focus-restore + Escape + `aria-modal`; keyboard-operable
  zone table; command-palette keyboard nav; real `prefers-reduced-motion` block in `globals.css`.
- **Security:** CSP + full security-header set; per-route preflight (rate limit / size /
  content-type / safe parse / `x-request-id`); user free-text sanitised + fenced with an injection
  guard on every system prompt; Gemini output re-validated with Zod; `GEMINI_API_KEY` server-only;
  no `dangerouslySetInnerHTML` / `eval` / XSS sinks; no `any` beyond the documented Gemini schema;
  no stray logs (bar the error-boundary), TODOs, or dead code.
- **Docs:** README claims verified against code (9 s AI timeout, ~95% core coverage, reduced-motion,
  env vars, agent→route table all accurate).

### Known LOW-priority technical debt (intentionally not changed)
- The **incident / dispatch / reunite** stores are uncapped, unlike the high-frequency stores
  (decisions 200, notifications 60, match-events 40, histories 60). In practice these hold
  low-frequency entities (a few per minute) and stay small for any realistic demo, so no cap was
  added: capping `dispatches` would also change the cumulative "resolved" count and SLA-health % in
  the KPI strip. Flagged here so a reviewer can decide if a generous cap is wanted for very long
  sessions.

### Verification
`npm run build`, `npm run typecheck`, `npm run lint` (0 errors, 6 documented advisory warnings),
and `npm test` (201/201, 26 files) all pass.

## Pass — Final review-board / submission-readiness verdict (2026-07-16)

Full judging-panel review (PromptWars + eng/AI/security/a11y/perf/QA/product lenses) against the
committed state. Goal: decide submission readiness, not add work.

**Result: no new HIGH or MEDIUM code issues.** The forecast NaN bug fixed earlier this pass was the
only real defect; the working tree is clean and every gate is green:
`build` ✓ · `typecheck` ✓ · `lint` (0 err / 6 documented warns) ✓ · `test` 201/201 ✓ ·
`test:coverage` ✓ (aggregate line 37.9% — dominated by presentational `.tsx` views intentionally
verified live, not snapshot-tested; deterministic core ≈ 95%).

Deployment/readiness checks: live demo `https://pulse-vercel-tau.vercel.app` responds and renders
the landing page; GitHub repo public and reachable; all README image/link references resolve; the
clone URL works; `.env.example` present; every env var is optional and the offline heuristic path
is the default.

**One release blocker (process, not code):** the fix commit is **local-only** — `origin/main` (and
the Vercel deploy tracking it) still sit on `928677e`, i.e. the buggy build. The repo must be
**pushed** before submission or judges receive the NaN-forecast version. No code change needed —
just `git push origin main`.

**LOW (documented, not changed):**
- Deeper standalone docs referenced by some templates (`ARCHITECTURE.md`, `DEPLOYMENT.md`,
  `security.md`, `DEMO.md`) do not exist — the project is intentionally single-README; the README
  covers architecture, deployment, security, demo flow, env vars, and privacy. No broken links.
- Aggregate coverage number reads low out of context (views counted in the denominator); the
  README already explains the core-vs-views split honestly.
- Uncapped incident/dispatch/reunite stores (negligible at demo scale — see previous pass).

**Recommendation:** freeze the codebase after pushing. Remaining effort → demo video, screenshots
(already embedded), build-in-public post, and the submission writeup.
