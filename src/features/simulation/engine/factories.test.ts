import { describe, expect, it } from "vitest";
import { makeIncident, makeReuniteCase } from "@/features/simulation/engine/factories";
import {
  incidentSchema,
  incidentTypeSchema,
  reuniteCaseSchema,
} from "@/lib/schemas/domain";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { createRng } from "@/lib/utils";

describe("makeIncident", () => {
  it("produces a schema-valid incident for every type", () => {
    const rng = createRng(1);
    for (const type of incidentTypeSchema.options) {
      const inc = makeIncident(rng, type, undefined, 1000);
      expect(() => incidentSchema.parse(inc)).not.toThrow();
      expect(inc.type).toBe(type);
      expect(inc.status).toBe("open");
      expect(inc.createdAt).toBe(1000);
    }
  });

  it("keeps severity within 1..5", () => {
    const rng = createRng(7);
    for (let i = 0; i < 200; i++) {
      const inc = makeIncident(rng, "fire");
      expect(inc.severity).toBeGreaterThanOrEqual(1);
      expect(inc.severity).toBeLessThanOrEqual(5);
    }
  });

  it("never spawns on the pitch when no zone is given", () => {
    const rng = createRng(3);
    for (let i = 0; i < 100; i++) {
      const inc = makeIncident(rng, "crowd");
      expect(ZONE_MAP[inc.zoneId]?.kind).not.toBe("pitch");
    }
  });

  it("honours an explicit zone id", () => {
    const inc = makeIncident(createRng(1), "medical", "facility-medical");
    expect(inc.zoneId).toBe("facility-medical");
  });
});

describe("makeReuniteCase", () => {
  it("produces a schema-valid reunite case with a seeded timeline", () => {
    const rc = makeReuniteCase(createRng(42), 2000);
    expect(() => reuniteCaseSchema.parse(rc)).not.toThrow();
    expect(rc.status).toBe("reported");
    expect(rc.candidates).toEqual([]);
    expect(rc.timeline).toHaveLength(1);
    expect(rc.timeline[0].label).toBe("reported");
    expect(rc.descriptor.lastSeenZoneId).toBeTruthy();
  });
});
