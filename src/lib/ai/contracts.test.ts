import { describe, expect, it } from "vitest";
import {
  briefingRequestSchema,
  extractRequestSchema,
  forecastRequestSchema,
  matchRequestSchema,
  triageRequestSchema,
} from "@/lib/ai/contracts";

const zoneTelemetry = {
  zoneId: "stand-n",
  t: 0,
  density: 50,
  occupancy: 8000,
  inflow: 10,
  outflow: 8,
  queueLength: 0,
  risk: "calm" as const,
  trend: "steady" as const,
};

const snapshot = {
  t: 0,
  matchClock: 600,
  phase: "first-half" as const,
  attendance: 60000,
  capacity: 62000,
  pressureIndex: 55,
  avgDensity: 50,
  weather: { tempC: 18, condition: "clear" as const, windKph: 10 },
};

const incident = {
  id: "inc_1",
  createdAt: 0,
  type: "medical" as const,
  zoneId: "stand-n",
  severity: 3,
  status: "open" as const,
  title: "t",
  description: "d",
  triage: null,
  resolvedAt: null,
};

describe("triageRequestSchema", () => {
  it("accepts a valid triage request", () => {
    const res = triageRequestSchema.safeParse({
      incident,
      snapshot,
      zoneTelemetry,
      neighborTelemetry: [zoneTelemetry],
      openIncidentCount: 1,
    });
    expect(res.success).toBe(true);
  });

  it("rejects a negative open-incident count", () => {
    const res = triageRequestSchema.safeParse({
      incident,
      snapshot,
      zoneTelemetry: null,
      neighborTelemetry: [],
      openIncidentCount: -1,
    });
    expect(res.success).toBe(false);
  });
});

describe("extractRequestSchema", () => {
  it("requires at least four characters of free text", () => {
    expect(
      extractRequestSchema.safeParse({
        freeText: "hi",
        lastSeenZoneId: "gate-n",
        minutesAgo: 2,
      }).success,
    ).toBe(false);
    expect(
      extractRequestSchema.safeParse({
        freeText: "lost boy in red",
        lastSeenZoneId: "gate-n",
        minutesAgo: 2,
      }).success,
    ).toBe(true);
  });
});

describe("forecastRequestSchema", () => {
  it("accepts telemetry plus a trends record", () => {
    const res = forecastRequestSchema.safeParse({
      snapshot,
      telemetry: [zoneTelemetry],
      trends: { "stand-n": [40, 45, 50] },
    });
    expect(res.success).toBe(true);
  });
});

describe("matchRequestSchema", () => {
  it("rejects sightings missing required fields", () => {
    const descriptor = {
      ageBand: "child" as const,
      gender: "boy" as const,
      hair: "brown",
      upperColor: "red",
      upperItem: "shirt",
      lowerColor: "blue",
      lowerItem: "jeans",
      accessories: [],
      distinguishingFeatures: "",
      lastSeenZoneId: "gate-n",
      minutesAgo: 3,
    };
    const res = matchRequestSchema.safeParse({
      descriptor,
      sightings: [{ id: "s1" }],
    });
    expect(res.success).toBe(false);
  });
});

describe("briefingRequestSchema", () => {
  it("accepts a valid briefing request", () => {
    expect(
      briefingRequestSchema.safeParse({
        snapshot,
        hotZones: [zoneTelemetry],
        openIncidents: 0,
      }).success,
    ).toBe(true);
  });
});
