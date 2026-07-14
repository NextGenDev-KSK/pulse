# Demo guide

Everything you need to run a confident 2–3 minute live demo of PULSE, plus talking points, the
questions judges tend to ask, and a fallback plan if the network or Gemini is unavailable.

## Setup (30 seconds before you present)

- Run `npm run dev` (or open the deployed URL). Demo Mode needs no keys.
- Open the app, click **Launch console → Enter demo mode**. The console auto-starts a live
  simulation, so the dashboard is already moving when you begin.
- Keep the **Scenario Director** in view (dashboard, or ⌘K → trigger). It fires the demo beats.
- If you have a `GEMINI_API_KEY` set, decisions will be labeled `Gemini`; if not, they are
  labeled `Heuristic`. Both look and behave the same — say so up front.

## The one-line pitch

> "Stadiums have thousands of cameras but no cortex. PULSE is the nervous system: senses in
> Vision, a cortex in Brain, motor neurons in Dispatch, and a conscience in Reunite — four AI
> agents that observe, reason, decide, and act on a live 62,000-seat stadium."

## The 2–3 minute script

**0:00 — Frame it (15s).** "This is not a chatbot. Four named agents run a continuous
observe → reason → decide → act loop against a live telemetry stream. Every decision is
explained and logged." The dashboard is already live — point at the moving KPIs and heatmap.

**0:15 — Predict (Vision, 30s).** Open **Pulse Vision**. The SVG stadium twin animates per-zone
density. Click a busy zone: show its live telemetry and **Sentinel's 15-minute forecast** with a
plain-language reason. "Sentinel forecasts risk *before* it happens — this is prevention, not
just monitoring."

**0:45 — Reason (Brain, 40s).** From the Scenario Director, trigger **Medical emergency**. Open
**Pulse Brain**. Watch **Strategist** triage it — severity 1–5, confidence, required skill — and
render a step-by-step **reasoning chain**, then rank it against other open incidents. "This is
the judgment layer. The reasoning is shown and saved, not hidden."

**1:25 — Act (Dispatch, 35s).** Open **Pulse Dispatch**. **Marshal** has already assigned the
nearest qualified steward on the zone graph, with an AI rationale and a live **SLA timer** and
lifecycle stepper (assigned → en-route → on-scene → resolved). "Distance, ETA, and SLA are
deterministic code. Gemini only writes the rationale — we don't ask a model to do arithmetic."

**2:00 — Reunite (40s).** Trigger **Lost child report**. Open **Pulse Reunite**. **Guardian**
extracts a privacy-safe descriptor from the free-text report, sweeps zones, gathers sightings,
and scores candidate matches with a per-attribute breakdown. Confirm the reunion — human in the
loop. "No facial recognition, no images, descriptor-only. Ethics is a feature here."

**2:40 — Account (20s).** Open the **Decision Ledger**: every AI decision with its engine, model,
latency, and full reasoning. "Every action is auditable — this is what a regulator or insurer
would ask for." Optionally show CSV/JSON export from Analytics.

**Close:** "One console, four agents, fully offline-capable, and venue-agnostic — the same zone
graph works for concerts, marathons, or transit hubs."

## Talking points (drop these where they fit)

- **Agentic, not conversational.** Agents produce dispatches and forecasts, not chat replies.
- **Gemini where it adds value.** Forecast/triage/matching/rationale go to the model; distance,
  ETA, SLA stay in code — cheaper, faster, and more trustworthy.
- **Resilient by design.** Every AI call has a deterministic fallback, so the demo never stalls
  and the UI labels which engine answered.
- **Auditable.** Immutable decision ledger with full reasoning chains.
- **Privacy-first.** Aggregate density only; descriptor-based reunification; human-confirmed.
- **Production topology.** The simulation is an adapter — swap in a real CV/ticketing feed behind
  the same interface and nothing else changes.

## Likely judge questions and strong answers

**"Is Gemini actually doing anything, or is it scripted?"**
Set `GEMINI_API_KEY` and the ledger labels each decision `Gemini` with real latency; unset it and
the same flows run on the heuristic engine. Show both. The prompts and `responseSchema` are in
`src/lib/ai`.

**"What happens if the model returns garbage?"**
Output is requested with a strict `responseSchema` and re-validated with Zod on the server. Any
failure or 8-second timeout falls back to the heuristic in the identical shape — the operator is
never blocked and always sees which engine answered.

**"How does this scale beyond a football stadium?"**
The model is a zone graph with flows and stewards. Concerts, marathons, transit hubs, large
pilgrimages — anything with zones and responders — load a different map. The agents don't change.

**"Isn't crowd surveillance an ethics problem?"**
There is no facial recognition anywhere. Crowd data is aggregate density. Reunite matches
human-reported descriptors, never biometrics, and stores no images. Reunions are human-confirmed
and every decision is logged.

**"Why did you build your own UI primitives / simulation?"**
The stack is bleeding-edge (Next 16 / React 19). Hand-rolling the shadcn-style primitives
guarantees every phase compiles and keeps full a11y control. The simulation is a stand-in for a
real ingest pipeline so the demo is deterministic and never depends on a live camera feed.

**"How real is the data plane?"**
Types are Firestore-collection-shaped and validated by Zod. Demo Mode keeps them in memory;
with Firebase env vars, auth is real and the data layer can mirror to Firestore for multi-console
sync.

## Fallback plan (no network / no Gemini)

PULSE is designed to survive exactly this on stage.

1. **Run Demo Mode with no keys.** Everything works offline; the heuristic engine drives all four
   agents. Say plainly: "I'm running fully offline right now — same flows, deterministic engine."
2. **Prefer local `npm run dev`** over the hosted URL if venue Wi-Fi is unreliable; it has zero
   external dependencies.
3. **Do not reload the tab mid-demo.** Demo Mode state is per-tab and resets on a full reload;
   SPA navigation between modules preserves it.
4. If Gemini was expected but a call fails live, that *is* the resilience story — point at the
   `Heuristic` label in the ledger and move on.
