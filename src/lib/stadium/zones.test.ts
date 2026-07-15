import { describe, expect, it } from "vitest";
import {
  SEATED_ZONE_IDS,
  STADIUM_VIEWBOX,
  ZONE_BBOX,
  ZONE_MAP,
  ZONES,
  getZone,
} from "@/lib/stadium/zones";
import { zoneSchema } from "@/lib/schemas/domain";
import { hopDistance } from "@/lib/stadium/graph";

describe("zone catalogue", () => {
  it("every zone validates against the domain schema", () => {
    for (const zone of ZONES) {
      expect(() => zoneSchema.parse(zone)).not.toThrow();
    }
  });

  it("has unique ids and a matching ZONE_MAP", () => {
    const ids = ZONES.map((z) => z.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(ZONE_MAP).sort()).toEqual([...ids].sort());
  });

  it("references only real zones as neighbours", () => {
    for (const zone of ZONES) {
      for (const n of zone.neighbors) {
        expect(ZONE_MAP[n], `${zone.id} -> ${n}`).toBeDefined();
      }
    }
  });

  it("has a symmetric adjacency graph", () => {
    for (const zone of ZONES) {
      for (const n of zone.neighbors) {
        expect(
          ZONE_MAP[n].neighbors,
          `${n} should list ${zone.id} back`,
        ).toContain(zone.id);
      }
    }
  });

  it("is a single connected component", () => {
    const start = ZONES[0].id;
    const reachable = ZONES.filter(
      (z) => Number.isFinite(hopDistance(start, z.id)),
    );
    expect(reachable.length).toBe(ZONES.length);
  });

  it("no zone lists itself as a neighbour", () => {
    for (const zone of ZONES) {
      expect(zone.neighbors).not.toContain(zone.id);
    }
  });
});

describe("derived structures", () => {
  it("SEATED_ZONE_IDS are exactly the stands", () => {
    const stands = ZONES.filter((z) => z.kind === "stand").map((z) => z.id);
    expect([...SEATED_ZONE_IDS].sort()).toEqual([...stands].sort());
  });

  it("ZONE_BBOX covers every zone", () => {
    for (const zone of ZONES) {
      expect(ZONE_BBOX[zone.id]).toBeDefined();
    }
  });

  it("keeps every centroid inside the viewBox", () => {
    for (const zone of ZONES) {
      expect(zone.centroid.x).toBeGreaterThanOrEqual(0);
      expect(zone.centroid.x).toBeLessThanOrEqual(STADIUM_VIEWBOX.width);
      expect(zone.centroid.y).toBeGreaterThanOrEqual(0);
      expect(zone.centroid.y).toBeLessThanOrEqual(STADIUM_VIEWBOX.height);
    }
  });
});

describe("getZone", () => {
  it("returns the zone for a known id", () => {
    expect(getZone("pitch").name).toBe("Pitch");
  });

  it("throws for an unknown id", () => {
    expect(() => getZone("nowhere")).toThrow(/Unknown zone/);
  });
});
