import { z } from "zod";
import {
  incidentSchema,
  snapshotSchema,
  zoneTelemetrySchema,
  descriptorSchema,
  stewardSchema,
} from "@/lib/schemas/domain";

/** Standard response envelope for every /api/ai/* endpoint. */
export type AiEngine = "gemini" | "heuristic";
export type AiResponse<T> =
  | { ok: true; engine: AiEngine; data: T; latencyMs: number }
  | { ok: false; error: string };

export const triageRequestSchema = z.object({
  incident: incidentSchema,
  snapshot: snapshotSchema,
  zoneTelemetry: zoneTelemetrySchema.nullable(),
  neighborTelemetry: z.array(zoneTelemetrySchema),
  openIncidentCount: z.number().int().nonnegative(),
});
export type TriageRequest = z.infer<typeof triageRequestSchema>;

export const forecastRequestSchema = z.object({
  snapshot: snapshotSchema,
  telemetry: z.array(zoneTelemetrySchema),
  trends: z.record(z.string(), z.array(z.number())),
});
export type ForecastRequest = z.infer<typeof forecastRequestSchema>;

export const extractRequestSchema = z.object({
  freeText: z.string().min(4),
  lastSeenZoneId: z.string(),
  minutesAgo: z.number(),
});
export type ExtractRequest = z.infer<typeof extractRequestSchema>;

export const matchRequestSchema = z.object({
  descriptor: descriptorSchema,
  sightings: z.array(
    z.object({
      id: z.string(),
      stewardName: z.string(),
      zoneId: z.string(),
      zoneName: z.string(),
      notes: z.string(),
      descriptor: descriptorSchema,
    }),
  ),
});
export type MatchRequest = z.infer<typeof matchRequestSchema>;

export const briefingRequestSchema = z.object({
  snapshot: snapshotSchema,
  hotZones: z.array(zoneTelemetrySchema),
  openIncidents: z.number().int().nonnegative(),
});
export type BriefingRequest = z.infer<typeof briefingRequestSchema>;

export const dispatchRationaleRequestSchema = z.object({
  incident: incidentSchema,
  chosen: z.object({ steward: stewardSchema, etaSeconds: z.number() }),
  alternatives: z.array(
    z.object({
      name: z.string(),
      etaSeconds: z.number(),
      reason: z.string(),
    }),
  ),
});
export type DispatchRationaleRequest = z.infer<
  typeof dispatchRationaleRequestSchema
>;

export interface DispatchRationaleResult {
  rationale: string;
  briefing: string;
  engine: AiEngine;
}
