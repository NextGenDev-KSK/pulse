import { describe, expect, it } from "vitest";
import {
  heuristicBriefing,
  heuristicExtract,
  heuristicForecast,
  heuristicMatch,
  heuristicTriage,
} from "@/lib/ai/heuristics";
import {
  briefingResultSchema,
  forecastResultSchema,
  triageResultSchema,
  type Descriptor,
  type Incident,
  type Snapshot,
  type ZoneTelemetry,
} from "@/lib/schemas/domain";
import { z } from "zod";
import { candidateSchema } from "@/lib/schemas/domain";

function telemetry(over: Partial<ZoneTelemetry> = {}): ZoneTelemetry {
  return {
    zoneId: "stand-n",
    t: 0,
    density: 50,
    occupancy: 8000,
    inflow: 10,
    outflow: 8,
    queueLength: 0,
    risk: "calm",
    trend: "steady",
    ...over,
  };
}

function incident(over: Partial<Incident> = {}): Incident {
  return {
    id: "inc_1",
    createdAt: 0,
    type: "medical",
    zoneId: "stand-n",
    severity: 3,
    status: "open",
    title: "Fan collapse",
    description: "A spectator collapsed and is unresponsive.",
    triage: null,
    resolvedAt: null,
    ...over,
  };
}

function snapshot(over: Partial<Snapshot> = {}): Snapshot {
  return {
    t: 0,
    matchClock: 600,
    phase: "first-half",
    attendance: 60000,
    capacity: 62000,
    pressureIndex: 55,
    avgDensity: 50,
    weather: { tempC: 18, condition: "clear", windKph: 10 },
    ...over,
  };
}

describe("heuristicTriage", () => {
  it("produces a schema-valid, heuristic-labelled result", () => {
    const r = heuristicTriage({
      incident: incident(),
      zoneTelemetry: telemetry(),
      openIncidentCount: 2,
    });
    expect(() => triageResultSchema.parse(r)).not.toThrow();
    expect(r.engine).toBe("heuristic");
    expect(r.requiredSkill).toBe("medical");
  });

  it("escalates severity when local density is critical", () => {
    const calm = heuristicTriage({
      incident: incident({ type: "security" }),
      zoneTelemetry: telemetry({ density: 20 }),
      openIncidentCount: 0,
    });
    const packed = heuristicTriage({
      incident: incident({ type: "security" }),
      zoneTelemetry: telemetry({ density: 95 }),
      openIncidentCount: 0,
    });
    expect(packed.severity).toBeGreaterThan(calm.severity);
  });

  it("caps severity at 5", () => {
    const r = heuristicTriage({
      incident: incident({ type: "fire" }), // base 5
      zoneTelemetry: telemetry({ density: 99, trend: "rising" }),
      openIncidentCount: 5,
    });
    expect(r.severity).toBeLessThanOrEqual(5);
    expect(r.severity).toBe(5);
  });

  it("de-escalates a quiet infrastructure incident", () => {
    const r = heuristicTriage({
      incident: incident({ type: "infrastructure" }), // base 2
      zoneTelemetry: telemetry({ density: 20 }),
      openIncidentCount: 0,
    });
    expect(r.severity).toBe(1);
  });

  it("tolerates missing telemetry", () => {
    const r = heuristicTriage({
      incident: incident(),
      zoneTelemetry: null,
      openIncidentCount: 0,
    });
    expect(() => triageResultSchema.parse(r)).not.toThrow();
  });
});

describe("heuristicForecast", () => {
  it("excludes the pitch and only alerts on crowded/critical zones", () => {
    const rows = [
      telemetry({ zoneId: "pitch", density: 4 }),
      telemetry({ zoneId: "concourse-n", density: 95, trend: "rising" }),
      telemetry({ zoneId: "stand-n", density: 30 }),
    ];
    const r = heuristicForecast({
      snapshot: snapshot(),
      telemetry: rows,
      trends: { "concourse-n": [80, 88, 95] },
    });
    expect(() => forecastResultSchema.parse(r)).not.toThrow();
    expect(r.zones.some((z) => z.zoneId === "pitch")).toBe(false);
    for (const alert of r.proactiveAlerts) {
      const zone = r.zones.find((z) => z.zoneId === alert.zoneId)!;
      expect(["crowded", "critical"]).toContain(zone.predictedRisk);
    }
  });
});

describe("heuristicExtract", () => {
  const fallback: Descriptor = {
    ageBand: "unknown",
    gender: "unknown",
    hair: "unknown",
    upperColor: "unknown",
    upperItem: "unknown",
    lowerColor: "unknown",
    lowerItem: "unknown",
    accessories: [],
    distinguishingFeatures: "",
    lastSeenZoneId: "facility-food",
    minutesAgo: 5,
  };

  it("parses clothing, colour, age, gender and accessories from free text", () => {
    const d = heuristicExtract(
      "My son is 6 years old, wearing a bright red shirt and blue jeans, white trainers, carrying a dinosaur toy.",
      fallback,
    );
    expect(d.gender).toBe("boy");
    expect(d.ageBand).toBe("child");
    expect(d.upperItem).toBe("shirt");
    expect(d.upperColor).toBe("red");
    expect(d.lowerItem).toBe("jeans");
    expect(d.lowerColor).toBe("blue");
    expect(d.accessories).toContain("trainers");
  });

  it("de-duplicates overlapping accessory phrases", () => {
    const d = heuristicExtract("she has pink wellington boots on", fallback);
    // "boots" must not survive next to "wellington boots"
    expect(d.accessories).toContain("wellington boots");
    expect(d.accessories).not.toContain("boots");
  });

  it("falls back to defaults when nothing is described", () => {
    const d = heuristicExtract("please help", fallback);
    expect(d.upperItem).toBe("unknown");
    expect(d.lastSeenZoneId).toBe("facility-food");
  });
});

describe("heuristicMatch", () => {
  const target: Descriptor = {
    ageBand: "child",
    gender: "boy",
    hair: "short curly brown",
    upperColor: "red",
    upperItem: "shirt",
    lowerColor: "blue",
    lowerItem: "jeans",
    accessories: ["dinosaur toy"],
    distinguishingFeatures: "",
    lastSeenZoneId: "facility-food",
    minutesAgo: 5,
  };

  it("ranks the closest sighting first and validates each candidate", () => {
    const sightings = [
      {
        id: "s-decoy",
        descriptor: {
          ...target,
          upperColor: "green",
          upperItem: "hoodie",
          lowerColor: "grey",
          hair: "blonde",
        },
        zoneName: "North Gate",
        notes: "",
        stewardName: "Mia Chen",
        zoneId: "gate-n",
      },
      {
        id: "s-true",
        descriptor: { ...target },
        zoneName: "Food Court",
        notes: "calm child",
        stewardName: "Priya Sharma",
        zoneId: "facility-food",
      },
    ];
    const out = heuristicMatch({ descriptor: target, sightings });
    expect(out[0].sightingId).toBe("s-true");
    expect(out[0].score).toBeGreaterThan(out[1].score);
    for (const c of out) expect(() => candidateSchema.parse(c)).not.toThrow();
  });

  it("scores a perfect match at 1", () => {
    const out = heuristicMatch({
      descriptor: target,
      sightings: [
        {
          id: "s1",
          descriptor: { ...target },
          zoneName: "Food Court",
          notes: "",
          stewardName: "Priya Sharma",
          zoneId: "facility-food",
        },
      ],
    });
    expect(out[0].score).toBe(1);
  });
});

describe("heuristicBriefing", () => {
  it("summarises pressure, hot zones and open incidents", () => {
    const r = heuristicBriefing({
      snapshot: snapshot({ pressureIndex: 72 }),
      hotZones: [
        telemetry({ zoneId: "concourse-n", density: 88, risk: "crowded" }),
      ],
      openIncidents: 3,
    });
    expect(() => briefingResultSchema.parse(r)).not.toThrow();
    expect(r.headline).toContain("72");
    expect(r.watchItems.length).toBeGreaterThan(0);
    expect(z.array(z.string()).parse(r.watchItems)).toBeTruthy();
  });
});
