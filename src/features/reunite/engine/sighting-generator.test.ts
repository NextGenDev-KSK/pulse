import { describe, expect, it } from "vitest";
import { generateSightings } from "@/features/reunite/engine/sighting-generator";
import { makeReuniteCase } from "@/features/simulation/engine/factories";
import { sightingSchema } from "@/lib/schemas/domain";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { createRng } from "@/lib/utils";

describe("generateSightings", () => {
  const caseItem = makeReuniteCase(createRng(1), 1000);

  it("returns one strong true match plus decoys, all schema-valid", () => {
    const sightings = generateSightings(caseItem);
    expect(sightings.length).toBeGreaterThanOrEqual(3);
    for (const s of sightings) {
      expect(() => sightingSchema.parse(s)).not.toThrow();
      expect(s.caseId).toBe(caseItem.id);
    }
  });

  it("keeps the true match's core clothing attributes", () => {
    const [truth] = generateSightings(caseItem);
    expect(truth.descriptor.upperColor).toBe(caseItem.descriptor.upperColor);
    expect(truth.descriptor.upperItem).toBe(caseItem.descriptor.upperItem);
    expect(truth.descriptor.lowerColor).toBe(caseItem.descriptor.lowerColor);
  });

  it("places sightings in the last-seen zone or a (non-pitch) neighbour", () => {
    const lastSeen = caseItem.descriptor.lastSeenZoneId;
    const allowed = new Set([
      lastSeen,
      ...(ZONE_MAP[lastSeen]?.neighbors ?? []).filter(
        (id) => ZONE_MAP[id]?.kind !== "pitch",
      ),
    ]);
    for (const s of generateSightings(caseItem)) {
      expect(allowed.has(s.zoneId)).toBe(true);
    }
  });

  it("is deterministic in descriptors/zones for a given case id", () => {
    const a = generateSightings(caseItem).map((s) => ({
      zoneId: s.zoneId,
      descriptor: s.descriptor,
    }));
    const b = generateSightings(caseItem).map((s) => ({
      zoneId: s.zoneId,
      descriptor: s.descriptor,
    }));
    expect(a).toEqual(b);
  });
});
