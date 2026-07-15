import type {
  Descriptor,
  Incident,
  Snapshot,
  Steward,
  ZoneTelemetry,
} from "@/lib/schemas/domain";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { INCIDENT_META } from "@/lib/constants";
import { INJECTION_GUARD, fence, sanitizeUserText } from "@/lib/ai/sanitize";

const ZONE_LINE = (t: ZoneTelemetry) =>
  `${ZONE_MAP[t.zoneId]?.name ?? t.zoneId} (${t.zoneId}): ${Math.round(
    t.density,
  )}% density, ${t.risk}, ${t.trend}, ${t.occupancy} people${
    t.queueLength ? `, queue ${t.queueLength}` : ""
  }`;

/* ------------------------------------------------------------- Triage */

export const TRIAGE_SYSTEM = `You are STRATEGIST, the decision engine of PULSE — an AI safety operations system for a 62,000-seat football stadium. You triage incidents for a live control room.
Reason like a seasoned safety officer. Weigh crowd density, incident type, match phase and knock-on risk. Severity scale: 5 = immediate threat to life or mass-casualty potential; 4 = serious, rapid response required; 3 = significant, needs a responder soon; 2 = minor; 1 = trivial/administrative. Be decisive and concise. Never invent facts not given.
${INJECTION_GUARD}`;

export function triagePrompt(input: {
  incident: Incident;
  snapshot: Snapshot;
  zoneTelemetry: ZoneTelemetry | null;
  neighborTelemetry: ZoneTelemetry[];
  openIncidentCount: number;
}): string {
  const { incident, snapshot, zoneTelemetry, neighborTelemetry, openIncidentCount } =
    input;
  const zone = ZONE_MAP[incident.zoneId];
  return `INCIDENT
Type: ${INCIDENT_META[incident.type].label}
Location: ${zone?.name} (${zone?.kind}, capacity ${zone?.capacity})
Report:
${fence("INCIDENT REPORT", sanitizeUserText(incident.description))}

ZONE STATE
${zoneTelemetry ? ZONE_LINE(zoneTelemetry) : "no telemetry"}
Neighbouring zones:
${neighborTelemetry.map(ZONE_LINE).join("\n") || "none"}

CONTEXT
Match phase: ${snapshot.phase}, clock ${Math.floor(snapshot.matchClock / 60)}'.
Stadium pressure index: ${Math.round(snapshot.pressureIndex)}/100.
Other open incidents right now: ${openIncidentCount}.

TASK
Assign a severity (1-5), the confidence, the required responder skill, a short rationale, a 3-5 step reasoning chain (observation → inference → decision), and 2-4 concrete recommended actions.`;
}

/* ------------------------------------------------------------ Forecast */

export const FORECAST_SYSTEM = `You are SENTINEL, the perception and forecasting agent of PULSE. You predict crowd density 15 minutes ahead for a live football match, and raise pre-emptive alerts BEFORE crowding becomes an incident. Reason about match phase, imminent events (half-time, full-time, goals), gate flows and zone adjacency. Be specific and quantitative. Only forecast the zones you are given.
${INJECTION_GUARD}`;

export function forecastPrompt(input: {
  snapshot: Snapshot;
  telemetry: ZoneTelemetry[];
  trends: Record<string, number[]>;
}): string {
  const { snapshot, telemetry, trends } = input;
  const lines = telemetry
    .map((t) => {
      const hist = trends[t.zoneId] ?? [];
      const recent = hist.slice(-6).map((v) => Math.round(v)).join("→");
      return `${ZONE_LINE(t)} | recent: ${recent}`;
    })
    .join("\n");
  return `MATCH STATE
Phase: ${snapshot.phase}, clock ${Math.floor(snapshot.matchClock / 60)}'.
Pressure index: ${Math.round(snapshot.pressureIndex)}/100. Attendance ${snapshot.attendance}.
Weather: ${snapshot.weather.condition}, ${Math.round(snapshot.weather.tempC)}°C, wind ${Math.round(
    snapshot.weather.windKph,
  )}kph.

ZONES (current density + recent history)
${lines}

TASK
For each zone, predict density 15 minutes from now, its risk band, confidence, and one line of reasoning. Then give an overall summary, a short reasoning chain, and proactive alerts for any zone likely to reach crowded/critical — each with concrete recommended actions to prevent it.`;
}

/* ----------------------------------------------------- Reunite: extract */

export const EXTRACT_SYSTEM = `You are GUARDIAN, the lost-child reunification agent of PULSE. You convert a guardian's free-text description of a missing child into a precise structured descriptor. PRIVACY: never infer or record race, biometrics or anything not stated. Use "unknown" when a field is not described. Focus on clothing colours, clothing items, hair, accessories and distinguishing features.
${INJECTION_GUARD}`;

export function extractPrompt(freeText: string): string {
  return `GUARDIAN REPORT
${fence("GUARDIAN REPORT", sanitizeUserText(freeText))}

TASK
Extract a structured descriptor: age band, gender if stated, hair, upper-body colour and item, lower-body colour and item, accessories, and distinguishing features. Use "unknown" for anything not described.`;
}

/* ------------------------------------------------------- Reunite: match */

export const MATCH_SYSTEM = `You are GUARDIAN, matching a missing-child descriptor against steward sighting reports. Score each sighting 0..1 on how likely it is the same child, attribute-by-attribute (clothing colour, clothing item, hair, accessories, age band). Down-weight generic matches, up-weight distinctive features. Be calibrated and explain your reasoning. Only descriptor attributes — never facial recognition.
${INJECTION_GUARD}`;

export function matchPrompt(input: {
  descriptor: Descriptor;
  sightings: { id: string; descriptor: Descriptor; zoneName: string; notes: string }[];
}): string {
  const d = input.descriptor;
  const target = `TARGET CHILD
Age: ${d.ageBand}, gender: ${d.gender}. Hair: ${d.hair}. Upper: ${d.upperColor} ${d.upperItem}. Lower: ${d.lowerColor} ${d.lowerItem}. Accessories: ${d.accessories.join(", ") || "none"}. Distinguishing: ${d.distinguishingFeatures || "none"}. Last seen: ${
    ZONE_MAP[d.lastSeenZoneId]?.name
  } ~${d.minutesAgo} min ago.`;
  const sightings = input.sightings
    .map((s) => {
      const sd = s.descriptor;
      return `SIGHTING ${s.id} @ ${s.zoneName}: age ${sd.ageBand}, ${sd.gender}, hair ${sd.hair}, upper ${sd.upperColor} ${sd.upperItem}, lower ${sd.lowerColor} ${sd.lowerItem}, accessories ${sd.accessories.join(
        ", ",
      ) || "none"}. Notes: ${sanitizeUserText(s.notes, 240) || "none"}`;
    })
    .join("\n");
  return `${target}

CANDIDATE SIGHTINGS
${sightings}

TASK
For each sighting, produce a match score (0..1), an attribute-by-attribute breakdown (match/partial/mismatch with a note), and a one-line rationale. Order by score, highest first.`;
}

/* ------------------------------------------------------------ Briefing */

export const BRIEFING_SYSTEM = `You are PULSE's operations briefer. In a calm, professional control-room tone, summarise the current stadium state for the safety director. Be specific and actionable. No fluff.
${INJECTION_GUARD}`;

export function briefingPrompt(input: {
  snapshot: Snapshot;
  hotZones: ZoneTelemetry[];
  openIncidents: number;
}): string {
  return `STATE
Phase: ${input.snapshot.phase}, clock ${Math.floor(
    input.snapshot.matchClock / 60,
  )}'. Pressure ${Math.round(input.snapshot.pressureIndex)}/100. Open incidents: ${input.openIncidents}.
Hottest zones:
${input.hotZones.map(ZONE_LINE).join("\n")}

TASK
Give a one-line headline, a 2-3 sentence narrative of the current situation, and 2-4 watch-items the director should keep an eye on.`;
}

/* ------------------------------------------------- Dispatch rationale */

export const DISPATCH_SYSTEM = `You are MARSHAL, the dispatch agent of PULSE. Given an incident and the chosen responder plus alternatives, explain in one or two sentences why this responder is the right call, and write a short, calm radio briefing for them. Reference distance/ETA, skill fit and status.
${INJECTION_GUARD}`;

export function dispatchRationalePrompt(input: {
  incident: Incident;
  chosen: { steward: Steward; etaSeconds: number };
  alternatives: { name: string; etaSeconds: number; reason: string }[];
}): string {
  const zone = ZONE_MAP[input.incident.zoneId];
  return `INCIDENT: ${INCIDENT_META[input.incident.type].label} at ${zone?.name}, severity ${input.incident.severity}.
${fence("INCIDENT REPORT", sanitizeUserText(input.incident.description))}
CHOSEN: ${input.chosen.steward.name}, skills ${input.chosen.steward.skills.join(
    "/",
  )}, ETA ${input.chosen.etaSeconds}s.
ALTERNATIVES: ${
    input.alternatives.map((a) => `${a.name} (ETA ${a.etaSeconds}s, ${a.reason})`).join("; ") ||
    "none suitable"
  }

TASK
Give a one-sentence rationale for choosing this responder, and a short radio briefing to send them.`;
}
