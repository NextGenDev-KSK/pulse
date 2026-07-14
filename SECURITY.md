# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security reports. Email
**krithiksendhilkumar@gmail.com** with a description of the issue, steps to reproduce, and the
affected version or commit. We aim to acknowledge reports within a few days and will keep you
updated as we investigate and ship a fix.

## Supported versions

PULSE is an actively developed project. Security fixes are applied to the `main` branch and the
latest tagged release.

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ |
| < 1.0   | ❌ |

## Security posture

A short summary of the controls already in place. See
[`docs/security.md`](docs/security.md) for the detailed threat model and header rationale.

- **Secrets stay server-side.** `GEMINI_API_KEY` is only read inside Next.js route handlers
  (`/api/ai/*`) and is never sent to the browser. Only `NEXT_PUBLIC_FIREBASE_*` values —
  which are intended to be public client config — are exposed to the client.
- **Response headers.** Every response carries a Content-Security-Policy, `Strict-Transport-Security`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  a restrictive `Permissions-Policy`, and `Cross-Origin-Opener-Policy`. See
  [`next.config.ts`](next.config.ts).
- **Validation at every boundary.** All external and AI input is parsed with Zod
  (`src/lib/schemas`, `src/lib/ai/contracts.ts`) before it is trusted. Malformed AI output
  falls back to the deterministic heuristic path instead of propagating.
- **Privacy by design.** No facial recognition anywhere. Crowd data is aggregate density only.
  The lost-child (Reunite) workflow matches human-reported *descriptors*, never biometrics, and
  stores no images. Reunions require explicit human confirmation.
- **Auditability.** Every agent decision is written to an immutable ledger with its engine,
  model, latency, and full reasoning chain.

## Known hardening follow-ups

The CSP currently allows `'unsafe-inline'` for scripts to accommodate Next.js's inline
bootstrap. Moving to a nonce-based strict CSP is tracked as a follow-up in
[`docs/security.md`](docs/security.md).
