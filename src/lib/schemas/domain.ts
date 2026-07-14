import { z } from "zod";

/**
 * Single source of truth for every PULSE domain entity.
 * Types are inferred from these Zod schemas and re-exported for the whole app.
 */

/* ------------------------------------------------------------------ Zones */

export const zoneKindSchema = z.enum([
  "gate",
  "concourse",
  "stand",
  "pitch",
  "facility",
]);
export type ZoneKind = z.infer<typeof zoneKindSchema>;

export const zoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: zoneKindSchema,
  capacity: z.number().int().positive(),
  neighbors: z.array(z.string()),
  centroid: z.object({ x: z.number(), y: z.number() }),
  /** SVG path (in a 1000x640 viewBox) rendered on the stadium twin. */
  svgPath: z.string(),
});
export type Zone = z.infer<typeof zoneSchema>;

/* -------------------------------------------------------------- Telemetry */

export const riskLevelSchema = z.enum(["calm", "busy", "crowded", "critical"]);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const trendSchema = z.enum(["rising", "steady", "falling"]);
export type Trend = z.infer<typeof trendSchema>;

export const zoneTelemetrySchema = z.object({
  zoneId: z.string(),
  t: z.number(),
  /** Density as a percentage of capacity, 0-100+. */
  density: z.number(),
  occupancy: z.number().int(),
  inflow: z.number(),
  outflow: z.number(),
  queueLength: z.number().int(),
  risk: riskLevelSchema,
  trend: trendSchema,
});
export type ZoneTelemetry = z.infer<typeof zoneTelemetrySchema>;

/* ---------------------------------------------------------- Match / world */

export const matchPhaseSchema = z.enum([
  "pre-match",
  "first-half",
  "halftime",
  "second-half",
  "full-time",
]);
export type MatchPhase = z.infer<typeof matchPhaseSchema>;

export const weatherSchema = z.object({
  tempC: z.number(),
  condition: z.enum(["clear", "cloudy", "rain", "storm", "wind"]),
  windKph: z.number(),
});
export type Weather = z.infer<typeof weatherSchema>;

export const snapshotSchema = z.object({
  t: z.number(),
  matchClock: z.number(), // seconds of match time elapsed
  phase: matchPhaseSchema,
  attendance: z.number().int(),
  capacity: z.number().int(),
  /** Synthesized 0-100 "stadium pressure" index. */
  pressureIndex: z.number(),
  avgDensity: z.number(),
  weather: weatherSchema,
});
export type Snapshot = z.infer<typeof snapshotSchema>;

export const matchEventTypeSchema = z.enum([
  "kickoff",
  "goal",
  "card",
  "halftime",
  "second-half",
  "fulltime",
  "announcement",
  "substitution",
]);
export type MatchEventType = z.infer<typeof matchEventTypeSchema>;

export const matchEventSchema = z.object({
  id: z.string(),
  t: z.number(),
  minute: z.number().int(),
  type: matchEventTypeSchema,
  team: z.string().optional(),
  description: z.string(),
});
export type MatchEvent = z.infer<typeof matchEventSchema>;

/* -------------------------------------------------------------- Incidents */

export const incidentTypeSchema = z.enum([
  "medical",
  "security",
  "crowd",
  "fire",
  "lost-child",
  "infrastructure",
]);
export type IncidentType = z.infer<typeof incidentTypeSchema>;

export const incidentStatusSchema = z.enum([
  "open",
  "triaged",
  "dispatched",
  "resolved",
]);
export type IncidentStatus = z.infer<typeof incidentStatusSchema>;

export const severitySchema = z.number().int().min(1).max(5);

export const triageResultSchema = z.object({
  severity: severitySchema,
  priorityRank: z.number().int(),
  confidence: z.number().min(0).max(1),
  rationale: z.string().max(800),
  recommendedActions: z.array(z.string().max(400)).max(10),
  reasoning: z.array(z.string().max(500)).max(12),
  requiredSkill: z.enum(["medical", "security", "guest-services", "any"]),
  engine: z.enum(["gemini", "heuristic"]),
});
export type TriageResult = z.infer<typeof triageResultSchema>;

export const incidentSchema = z.object({
  id: z.string().max(64),
  createdAt: z.number(),
  type: incidentTypeSchema,
  zoneId: z.string().max(48),
  severity: severitySchema,
  status: incidentStatusSchema,
  title: z.string().max(200),
  description: z.string().max(1200),
  triage: triageResultSchema.nullable(),
  resolvedAt: z.number().nullable(),
});
export type Incident = z.infer<typeof incidentSchema>;

/* ------------------------------------------------------------ Stewards */

export const stewardSkillSchema = z.enum([
  "medical",
  "security",
  "guest-services",
]);
export type StewardSkill = z.infer<typeof stewardSkillSchema>;

export const stewardStatusSchema = z.enum([
  "available",
  "en-route",
  "on-scene",
  "break",
]);
export type StewardStatus = z.infer<typeof stewardStatusSchema>;

export const stewardSchema = z.object({
  id: z.string(),
  name: z.string(),
  skills: z.array(stewardSkillSchema),
  status: stewardStatusSchema,
  zoneId: z.string(),
  taskId: z.string().nullable(),
});
export type Steward = z.infer<typeof stewardSchema>;

/* ------------------------------------------------------------ Dispatch */

export const dispatchStatusSchema = z.enum([
  "pending",
  "assigned",
  "en-route",
  "on-scene",
  "resolved",
  "cancelled",
]);
export type DispatchStatus = z.infer<typeof dispatchStatusSchema>;

export const dispatchSchema = z.object({
  id: z.string(),
  incidentId: z.string(),
  stewardId: z.string(),
  stewardName: z.string(),
  status: dispatchStatusSchema,
  createdAt: z.number(),
  etaSeconds: z.number(),
  slaSeconds: z.number(),
  slaBreached: z.boolean(),
  resolvedAt: z.number().nullable(),
  rationale: z.string(),
  statusTimestamps: z.record(z.string(), z.number()),
});
export type Dispatch = z.infer<typeof dispatchSchema>;

/* ------------------------------------------------------------- Reunite */

export const descriptorSchema = z.object({
  ageBand: z.enum(["toddler", "child", "pre-teen", "teen", "unknown"]),
  gender: z.enum(["boy", "girl", "unknown"]).default("unknown"),
  hair: z.string().max(120),
  upperColor: z.string().max(60),
  upperItem: z.string().max(80),
  lowerColor: z.string().max(60),
  lowerItem: z.string().max(80),
  accessories: z.array(z.string().max(60)).max(12),
  distinguishingFeatures: z.string().max(300).optional().default(""),
  lastSeenZoneId: z.string().max(48),
  minutesAgo: z.number().min(0).max(1440),
});
export type Descriptor = z.infer<typeof descriptorSchema>;

export const candidateSchema = z.object({
  sightingId: z.string().max(64),
  stewardName: z.string().max(120),
  zoneId: z.string().max(48),
  score: z.number().min(0).max(1),
  rationale: z.string().max(600),
  perAttribute: z
    .array(
      z.object({
        attribute: z.string().max(80),
        match: z.enum(["match", "partial", "mismatch"]),
        note: z.string().max(240),
      }),
    )
    .max(16),
  engine: z.enum(["gemini", "heuristic"]),
});
export type Candidate = z.infer<typeof candidateSchema>;

export const reuniteStatusSchema = z.enum([
  "reported",
  "searching",
  "candidate-found",
  "verifying",
  "reunited",
  "archived",
]);
export type ReuniteStatus = z.infer<typeof reuniteStatusSchema>;

export const reuniteCaseSchema = z.object({
  id: z.string(),
  status: reuniteStatusSchema,
  childName: z.string(),
  reporterName: z.string(),
  reporterContact: z.string(),
  freeText: z.string(),
  descriptor: descriptorSchema,
  candidates: z.array(candidateSchema),
  createdAt: z.number(),
  reunitedAt: z.number().nullable(),
  timeline: z.array(
    z.object({ t: z.number(), label: z.string(), detail: z.string() }),
  ),
});
export type ReuniteCase = z.infer<typeof reuniteCaseSchema>;

export const sightingSchema = z.object({
  id: z.string(),
  caseId: z.string().nullable(),
  stewardName: z.string(),
  zoneId: z.string(),
  t: z.number(),
  descriptor: descriptorSchema,
  notes: z.string(),
});
export type Sighting = z.infer<typeof sightingSchema>;

/* ---------------------------------------------------- Forecast (Vision) */

export const zoneForecastSchema = z.object({
  zoneId: z.string(),
  currentDensity: z.number(),
  predictedDensity: z.number(),
  horizonMinutes: z.number(),
  predictedRisk: riskLevelSchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});
export type ZoneForecast = z.infer<typeof zoneForecastSchema>;

export const forecastResultSchema = z.object({
  summary: z.string(),
  zones: z.array(zoneForecastSchema),
  proactiveAlerts: z.array(
    z.object({
      zoneId: z.string(),
      severity: severitySchema,
      message: z.string(),
      recommendedActions: z.array(z.string()),
    }),
  ),
  reasoning: z.array(z.string()),
  engine: z.enum(["gemini", "heuristic"]),
});
export type ForecastResult = z.infer<typeof forecastResultSchema>;

/* ---------------------------------------------------- Decision ledger */

export const agentSchema = z.enum([
  "sentinel",
  "strategist",
  "marshal",
  "guardian",
]);
export type Agent = z.infer<typeof agentSchema>;

export const decisionSchema = z.object({
  id: z.string(),
  t: z.number(),
  agent: agentSchema,
  engine: z.enum(["gemini", "heuristic"]),
  model: z.string().nullable(),
  latencyMs: z.number(),
  title: z.string(),
  summary: z.string(),
  reasoning: z.array(z.string()),
  relatedId: z.string().nullable(),
});
export type Decision = z.infer<typeof decisionSchema>;

/* ------------------------------------------------------------ Briefing */

export const briefingResultSchema = z.object({
  headline: z.string(),
  narrative: z.string(),
  watchItems: z.array(z.string()),
  engine: z.enum(["gemini", "heuristic"]),
});
export type BriefingResult = z.infer<typeof briefingResultSchema>;
