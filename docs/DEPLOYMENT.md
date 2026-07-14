# Deployment

PULSE is a standard Next.js 16 app and deploys to Vercel with no special configuration. It
also runs anywhere Node.js 20+ can host a Next.js server. Because the app is fully functional in
Demo Mode, a deployment with **no** environment variables is already a working demo — keys only
upgrade it to real Gemini reasoning and Firebase persistence.

## Vercel (recommended)

### Via the dashboard

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project** and import the repo. Vercel auto-detects Next.js; keep the
   defaults (build `next build`, output handled automatically).
3. (Optional) Add environment variables — see the table below. None are required for a demo.
4. **Deploy.** The security headers in `next.config.ts` are applied automatically by the Next.js
   runtime on Vercel.

### Via the CLI

```bash
npm i -g vercel
vercel login
vercel            # first run links/creates the project (preview deploy)
vercel --prod     # production deploy
```

Add secrets from the CLI if you prefer:

```bash
vercel env add GEMINI_API_KEY production
```

## Environment variables

All are optional. `GEMINI_API_KEY` is **server-side only** and must never be given the
`NEXT_PUBLIC_` prefix.

| Variable | Scope | Effect if set |
|----------|-------|---------------|
| `GEMINI_API_KEY` | Server | Enables real Gemini reasoning; without it the heuristic engine is used. |
| `GEMINI_MODEL` | Server | Overrides the model actually called (`gemini-2.0-flash`). |
| `NEXT_PUBLIC_GEMINI_MODEL` | Client | Display-only label shown in the ledger/engine badge; keep in sync with `GEMINI_MODEL`. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client | Firebase web API key (public by design). |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | Firebase auth domain. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client | Firebase project id. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client | Firebase storage bucket. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client | Firebase sender id. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | Firebase app id. |

Firebase activates only when the API key, project id, and app id are all present
(`src/lib/firebase/app.ts`). With any of them missing, the app stays in Demo Mode.

## Getting a Gemini key

Create an API key in [Google AI Studio](https://aistudio.google.com/apikey) and set it as
`GEMINI_API_KEY`. The AI layer switches from heuristic to Gemini automatically on the next
request — no code change or redeploy of code is needed, only the env var.

## Setting up Firebase (optional)

1. Create a project in the [Firebase console](https://console.firebase.google.com/).
2. Add a **Web app** and copy its config into the `NEXT_PUBLIC_FIREBASE_*` variables.
3. Enable **Authentication → Email/Password** and, if wanted, **Google**.
4. Create a **Firestore** database. Restrict writes to authenticated users in the security
   rules before exposing it publicly.
5. If you enable Google sign-in via redirect, add the Firebase `authDomain` to the CSP
   `frame-src`/`connect-src` (see [`security.md`](security.md)).

## Post-deploy smoke test

After a deploy, verify:

```bash
# security headers present on a page route
curl -sI https://<your-domain>/login | grep -i content-security-policy

# API route responds
curl -s -X POST https://<your-domain>/api/ai/briefing -H 'content-type: application/json' -d '{}' | head -c 200
```

Then walk the [demo script](DEMO.md): land → launch console → enter demo mode, and confirm each
module (Vision, Brain, Dispatch, Reunite, Analytics, Ledger) is live. If `GEMINI_API_KEY` is
set, confirm decisions in the ledger are labeled `Gemini` rather than `Heuristic`.

## Notes

- **No `vercel.json` is needed.** Next.js 16 is auto-detected and the headers live in
  `next.config.ts`.
- **`next build` does not run ESLint** in Next 16. Run `npx eslint .` in CI if you want lint to
  gate deploys.
- The production CSP drops `'unsafe-eval'` (used only by the dev HMR runtime), so verify against
  a production build, not `next dev`, when testing header strictness.
