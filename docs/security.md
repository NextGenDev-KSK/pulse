# Security notes

This document explains the response-header policy configured in
[`next.config.ts`](../next.config.ts) and the reasoning behind each choice. For the
vulnerability-reporting process, see [`SECURITY.md`](../SECURITY.md).

## Threat model in one paragraph

PULSE is a single-page operator console. The realtime simulation and all state live in the
browser; the only server surface is the `/api/ai/*` route handlers, which proxy Gemini using a
server-only key. The main risks we defend against are XSS (limiting what a script can load or
exfiltrate), clickjacking of the console, secret leakage of the Gemini key, and untrusted AI
output being treated as trusted. There is no user-generated content persisted across sessions
in Demo Mode, and no PII beyond the descriptors a guardian voluntarily types into the Reunite
form.

## Response headers

All headers are applied to every route via the `headers()` function in `next.config.ts`.

| Header | Value | Why |
|--------|-------|-----|
| `Content-Security-Policy` | see below | Constrains script/style/connect sources. |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for two years. |
| `X-Frame-Options` | `DENY` | Blocks framing (clickjacking); paired with `frame-ancestors 'none'`. |
| `X-Content-Type-Options` | `nosniff` | Stops MIME sniffing. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Avoids leaking full URLs cross-origin. |
| `Permissions-Policy` | camera/mic/geo/topics/cohort disabled | The app needs none of these. |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates the browsing context. |
| `X-DNS-Prefetch-Control` | `off` | No speculative DNS to third parties. |
| `poweredByHeader` | disabled | Removes the `X-Powered-By: Next.js` fingerprint. |

## Content-Security-Policy, directive by directive

```
default-src 'self'
base-uri 'self'
object-src 'none'
frame-ancestors 'none'
form-action 'self'
img-src 'self' data: blob: https://lh3.googleusercontent.com
font-src 'self' data:
style-src 'self' 'unsafe-inline'
script-src 'self' 'unsafe-inline'          (+ 'unsafe-eval' in dev only)
connect-src 'self' https://*.googleapis.com https://*.google.com https://*.gstatic.com
            https://identitytoolkit.googleapis.com https://securetoken.googleapis.com
            https://firestore.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com
            https://firebaseinstallations.googleapis.com
worker-src 'self' blob:
manifest-src 'self'
frame-src 'self'
upgrade-insecure-requests
```

- **`script-src 'unsafe-inline'`** is required because Next.js injects small inline bootstrap
  scripts for hydration and route data. `'unsafe-eval'` is added **only in development** for
  Turbopack's hot-module reload; the production bundle does not use `eval`, so it is dropped.
- **`style-src 'unsafe-inline'`** is required because Tailwind, Framer Motion, and Recharts emit
  inline styles at runtime.
- **`connect-src`** allows same-origin (our own `/api`) plus the Google/Firebase endpoints used
  by the optional Firebase client SDK (Identity Toolkit, Secure Token, Firestore, Realtime
  Database sockets, Installations). With Firebase unconfigured, none of these are contacted.
- **`img-src`** allows `data:`/`blob:` (inline SVG and generated images) and Google avatar URLs
  (`lh3.googleusercontent.com`) for signed-in Google users.
- **`frame-ancestors 'none'` + `X-Frame-Options: DENY`** together prevent the console from being
  embedded and clickjacked.

## Untrusted AI output

Gemini responses are requested with a strict `responseSchema` and then **re-validated against
the same Zod schema** on the server (`src/lib/ai/contracts.ts`). Any parse failure, timeout
(8s), or missing key routes the request to the deterministic heuristic engine, which returns
the identical shape. Client fetchers apply the same fallback if the network call fails. The UI
always labels which engine produced a result, so an operator can see whether a decision came
from Gemini or the heuristic path.

## Hardening follow-ups

1. **Nonce-based strict CSP.** Replace `script-src 'unsafe-inline'` with a per-request nonce
   propagated through Next's document, removing the last `'unsafe-inline'` on scripts. This is
   the single most valuable remaining hardening step.
2. **Firebase auth frame sources.** If you enable Firebase **Google sign-in via redirect/iframe**
   in production, add your Firebase `authDomain` (e.g. `https://<project>.firebaseapp.com`) to
   `frame-src` and `connect-src`. The default email/password and popup flows do not require it.
3. **Firestore security rules.** When wiring a real Firestore project, restrict writes to
   authenticated users and validate document shapes server-side; the client Zod schemas are a
   convenience, not an authorization boundary.
