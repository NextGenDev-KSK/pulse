# Contributing to PULSE

Thanks for taking the time to contribute. PULSE is a feature-based Next.js app with a
strict TypeScript codebase; the guidelines below keep it consistent and easy to review.

## Prerequisites

- Node.js 20+ and npm 10+
- No API keys are required — the app runs fully in Demo Mode with in-memory data and a
  heuristic AI engine.

## Getting started

```bash
git clone https://github.com/<your-account>/pulse.git
cd pulse
npm install
npm run dev            # http://localhost:3000
```

Optional: copy `.env.example` to `.env.local` to enable the real Gemini and Firebase paths.

## Development workflow

Before opening a pull request, make sure the three checks that gate the project pass:

```bash
npm run build          # production build (Turbopack)
npx tsc --noEmit       # strict type check
npx eslint .           # lint
```

The build must compile, `tsc` must be clean, and ESLint must report zero errors. A small,
documented set of React-Compiler-preview advisory *warnings* is expected (see
`eslint.config.mjs`); do not introduce new ones without a reason.

## Code conventions

- **Zod is the single source of truth for types.** Domain types are inferred from
  `src/lib/schemas/domain.ts`. Validate at every I/O boundary — forms, API routes, AI output.
- **Feature-based structure.** New product surface goes under `src/features/<name>/` with its
  own `components/` and hooks. Shared UI lives in `src/components/`, cross-cutting logic in
  `src/lib/`, and Zustand stores in `src/stores/`.
- **Deterministic vs. AI split.** Distance, ETA, and SLA math stay in code. Only genuine
  judgment (forecasting, triage, matching, rationale) is sent to Gemini.
- **Every AI call needs a heuristic fallback.** Server route handlers must return the same Zod
  shape whether the answer came from Gemini or the local heuristic, and label the engine so the
  UI stays honest.
- **Accessibility.** Keyboard-navigable, visible focus rings, ARIA on live regions, and
  `prefers-reduced-motion` respected (motion is gated through `MotionConfig`).

### Adding a module

1. Create `src/features/<name>/` (view + `components/`).
2. Add a route at `src/app/(console)/<name>/page.tsx`.
3. Register it in `src/components/layout/nav-config.ts`.
4. Add any new domain types to `src/lib/schemas/domain.ts`.

### Adding an AI task

Add a prompt + `responseSchema` under `src/lib/ai`, a route handler under
`src/app/api/ai`, and a heuristic fallback in the same shape. Record the decision through
`recordDecision` so it lands in the audit ledger.

## Commit and PR guidelines

- Use short, imperative commit subjects (e.g. `dispatch: add SLA breach warning`). Conventional
  Commit prefixes are welcome but not required.
- Keep PRs focused. Describe what changed and how you verified it.
- Note any change to the public contract (schemas, API routes) in the PR description.

## Tests

Automated tests are being added for the deterministic core (the simulation model, steward
assignment, and heuristic engines) — see the roadmap in the README. New deterministic logic
should ship with unit tests once that harness lands. UI and AI paths are currently verified
manually against the demo script in [`docs/DEMO.md`](docs/DEMO.md).
