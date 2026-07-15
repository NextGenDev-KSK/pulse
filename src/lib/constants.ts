import type { RiskLevel, IncidentType, StewardSkill } from "@/lib/schemas/domain";

export const APP = {
  name: "PULSE",
  tagline: "The AI Nervous System for Smart Stadiums",
  venue: "Aurora National Stadium",
  fixture: "FC Meridian vs Atlas United",
  capacity: 62000,
} as const;

/** Simulation cadence. */
export const TICK_MS = 2500;
/** Seconds of match time advanced per real tick (compresses ~90 min into ~6 min). */
export const MATCH_SECONDS_PER_TICK = 40;
export const HALF_SECONDS = 45 * 60;
export const FULL_MATCH_SECONDS = 90 * 60;
/** Fixed lead-in / halftime durations, in ticks. */
export const PREMATCH_TICKS = 4;
export const HALFTIME_TICKS = 6;
export const HISTORY_POINTS = 60;

/** Density thresholds (percent of capacity) → risk band. */
export const RISK_THRESHOLDS: Record<Exclude<RiskLevel, "calm">, number> = {
  busy: 55,
  crowded: 78,
  critical: 92,
};

export function densityToRisk(density: number): RiskLevel {
  if (density >= RISK_THRESHOLDS.critical) return "critical";
  if (density >= RISK_THRESHOLDS.crowded) return "crowded";
  if (density >= RISK_THRESHOLDS.busy) return "busy";
  return "calm";
}

export const RISK_META: Record<
  RiskLevel,
  { label: string; color: string; text: string; ring: string }
> = {
  calm: {
    label: "Calm",
    color: "var(--color-calm)",
    text: "text-[hsl(var(--calm))]",
    ring: "ring-[hsl(var(--calm))]",
  },
  busy: {
    label: "Busy",
    color: "var(--color-busy)",
    text: "text-[hsl(var(--busy))]",
    ring: "ring-[hsl(var(--busy))]",
  },
  crowded: {
    label: "Crowded",
    color: "var(--color-crowded)",
    text: "text-[hsl(var(--crowded))]",
    ring: "ring-[hsl(var(--crowded))]",
  },
  critical: {
    label: "Critical",
    color: "var(--color-critical)",
    text: "text-[hsl(var(--critical))]",
    ring: "ring-[hsl(var(--critical))]",
  },
};

/** SLA budget (seconds) by severity 1-5. */
export const SLA_BY_SEVERITY: Record<number, number> = {
  5: 180,
  4: 300,
  3: 600,
  2: 1200,
  1: 2700,
};

export function slaForSeverity(severity: number): number {
  return SLA_BY_SEVERITY[severity] ?? 600;
}

/**
 * A dispatch meets SLA when the responder's modelled response time (ETA, in the
 * same second domain as the SLA budget) is within the severity budget. Both
 * `etaSeconds` and the budget are simulated seconds — comparing them keeps the
 * SLA verdict consistent between the dispatch pipeline and the timer UI.
 */
export function isSlaBreached(etaSeconds: number, severity: number): boolean {
  return etaSeconds > slaForSeverity(severity);
}

export const INCIDENT_META: Record<
  IncidentType,
  { label: string; skill: StewardSkill | "any"; icon: string }
> = {
  medical: { label: "Medical", skill: "medical", icon: "HeartPulse" },
  security: { label: "Security", skill: "security", icon: "ShieldAlert" },
  crowd: { label: "Crowd", skill: "security", icon: "Users" },
  fire: { label: "Fire / Hazard", skill: "security", icon: "Flame" },
  "lost-child": { label: "Lost Child", skill: "guest-services", icon: "Baby" },
  infrastructure: {
    label: "Infrastructure",
    skill: "guest-services",
    icon: "Wrench",
  },
};

export const SKILL_META: Record<StewardSkill, { label: string; color: string }> =
  {
    medical: { label: "Medical", color: "hsl(var(--calm))" },
    security: { label: "Security", color: "hsl(var(--accent))" },
    "guest-services": { label: "Guest Services", color: "hsl(var(--primary))" },
  };

export const AGENT_META = {
  sentinel: {
    name: "Sentinel",
    role: "Vision",
    blurb: "Perceives crowd state and forecasts risk before it forms.",
    icon: "ScanEye",
  },
  strategist: {
    name: "Strategist",
    role: "Brain",
    blurb: "Triages incidents and reasons out the optimal response plan.",
    icon: "BrainCircuit",
  },
  marshal: {
    name: "Marshal",
    role: "Dispatch",
    blurb: "Selects and tracks the nearest qualified responder.",
    icon: "Radio",
  },
  guardian: {
    name: "Guardian",
    role: "Reunite",
    blurb: "Extracts descriptors and matches lost children to sightings.",
    icon: "HeartHandshake",
  },
} as const;
