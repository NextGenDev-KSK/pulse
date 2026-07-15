import { describe, expect, it } from "vitest";
import {
  descriptorSchema,
  dispatchSchema,
  incidentSchema,
  triageResultSchema,
} from "@/lib/schemas/domain";

const validIncident = {
  id: "inc_1",
  createdAt: 1000,
  type: "medical" as const,
  zoneId: "stand-n",
  severity: 4,
  status: "open" as const,
  title: "Fan collapse",
  description: "A spectator collapsed.",
  triage: null,
  resolvedAt: null,
};

describe("incidentSchema", () => {
  it("accepts a well-formed incident", () => {
    expect(() => incidentSchema.parse(validIncident)).not.toThrow();
  });

  it("rejects severities outside 1..5", () => {
    expect(incidentSchema.safeParse({ ...validIncident, severity: 0 }).success).toBe(
      false,
    );
    expect(incidentSchema.safeParse({ ...validIncident, severity: 6 }).success).toBe(
      false,
    );
    expect(
      incidentSchema.safeParse({ ...validIncident, severity: 3.5 }).success,
    ).toBe(false);
  });

  it("rejects an unknown incident type", () => {
    expect(
      incidentSchema.safeParse({ ...validIncident, type: "alien" }).success,
    ).toBe(false);
  });

  it("rejects an over-long id", () => {
    expect(
      incidentSchema.safeParse({ ...validIncident, id: "x".repeat(65) }).success,
    ).toBe(false);
  });
});

describe("descriptorSchema", () => {
  it("applies defaults for gender and distinguishing features", () => {
    const parsed = descriptorSchema.parse({
      ageBand: "child",
      hair: "brown",
      upperColor: "red",
      upperItem: "shirt",
      lowerColor: "blue",
      lowerItem: "jeans",
      accessories: [],
      lastSeenZoneId: "gate-n",
      minutesAgo: 3,
    });
    expect(parsed.gender).toBe("unknown");
    expect(parsed.distinguishingFeatures).toBe("");
  });

  it("bounds minutesAgo to 0..1440", () => {
    const base = {
      ageBand: "child" as const,
      hair: "brown",
      upperColor: "red",
      upperItem: "shirt",
      lowerColor: "blue",
      lowerItem: "jeans",
      accessories: [],
      lastSeenZoneId: "gate-n",
    };
    expect(descriptorSchema.safeParse({ ...base, minutesAgo: -1 }).success).toBe(
      false,
    );
    expect(
      descriptorSchema.safeParse({ ...base, minutesAgo: 2000 }).success,
    ).toBe(false);
  });
});

describe("triageResultSchema", () => {
  const base = {
    severity: 3,
    priorityRank: 0,
    confidence: 0.7,
    rationale: "ok",
    recommendedActions: ["do a thing"],
    reasoning: ["because"],
    requiredSkill: "medical" as const,
    engine: "heuristic" as const,
  };

  it("accepts a valid triage result", () => {
    expect(() => triageResultSchema.parse(base)).not.toThrow();
  });

  it("rejects confidence outside 0..1", () => {
    expect(triageResultSchema.safeParse({ ...base, confidence: 1.2 }).success).toBe(
      false,
    );
  });

  it("only allows the two engine labels", () => {
    expect(
      triageResultSchema.safeParse({ ...base, engine: "gpt" }).success,
    ).toBe(false);
  });
});

describe("dispatchSchema", () => {
  it("round-trips a status-timestamp record", () => {
    const dispatch = {
      id: "dsp_1",
      incidentId: "inc_1",
      stewardId: "stw-01",
      stewardName: "Priya Sharma",
      status: "assigned" as const,
      createdAt: 1000,
      etaSeconds: 120,
      slaSeconds: 300,
      slaBreached: false,
      resolvedAt: null,
      rationale: "nearest",
      statusTimestamps: { assigned: 1000 },
    };
    const parsed = dispatchSchema.parse(dispatch);
    expect(parsed.statusTimestamps.assigned).toBe(1000);
  });
});
