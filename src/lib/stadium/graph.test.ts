import { describe, expect, it } from "vitest";
import {
  centroidDistance,
  estimateEtaSeconds,
  hopDistance,
  shortestPath,
  travelCost,
} from "@/lib/stadium/graph";
import { ZONES } from "@/lib/stadium/zones";

describe("hopDistance", () => {
  it("is zero to itself", () => {
    expect(hopDistance("gate-n", "gate-n")).toBe(0);
  });

  it("is one between direct neighbours", () => {
    expect(hopDistance("gate-n", "concourse-n")).toBe(1);
    expect(hopDistance("facility-medical", "concourse-w")).toBe(1);
  });

  it("counts multi-hop paths", () => {
    // gate-n -> concourse-n -> stand-n
    expect(hopDistance("gate-n", "stand-n")).toBe(2);
  });

  it("is symmetric across the (bidirectional) zone graph", () => {
    for (const a of ZONES) {
      for (const b of ZONES) {
        expect(hopDistance(a.id, b.id)).toBe(hopDistance(b.id, a.id));
      }
    }
  });

  it("returns Infinity for an unknown zone", () => {
    expect(hopDistance("gate-n", "nowhere")).toBe(Number.POSITIVE_INFINITY);
    expect(hopDistance("nowhere", "gate-n")).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("centroidDistance", () => {
  it("is zero to itself and positive between distinct zones", () => {
    expect(centroidDistance("gate-n", "gate-n")).toBe(0);
    expect(centroidDistance("gate-n", "gate-s")).toBeGreaterThan(0);
  });
});

describe("travelCost", () => {
  it("orders a nearer zone below a farther one", () => {
    const near = travelCost("gate-n", "concourse-n");
    const far = travelCost("gate-n", "stand-s");
    expect(near).toBeLessThan(far);
  });

  it("weights hop count above raw distance", () => {
    // One extra hop always costs at least 1000 (the hop weight).
    const oneHop = travelCost("gate-n", "concourse-n");
    const twoHop = travelCost("gate-n", "stand-n");
    expect(twoHop - oneHop).toBeGreaterThan(900);
  });

  it("is Infinity to an unreachable zone", () => {
    expect(travelCost("gate-n", "nowhere")).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("estimateEtaSeconds", () => {
  it("grows with hop distance", () => {
    const near = estimateEtaSeconds("gate-n", "concourse-n");
    const far = estimateEtaSeconds("gate-n", "stand-s");
    expect(far).toBeGreaterThan(near);
  });

  it("returns a finite fallback for unreachable zones", () => {
    expect(estimateEtaSeconds("gate-n", "nowhere")).toBe(600);
  });

  it("returns an integer number of seconds", () => {
    const eta = estimateEtaSeconds("gate-n", "stand-s");
    expect(Number.isInteger(eta)).toBe(true);
  });
});

describe("shortestPath", () => {
  it("returns a single node for self", () => {
    expect(shortestPath("gate-n", "gate-n")).toEqual(["gate-n"]);
  });

  it("includes both endpoints and only adjacent steps", () => {
    const path = shortestPath("gate-n", "stand-n");
    expect(path[0]).toBe("gate-n");
    expect(path[path.length - 1]).toBe("stand-n");
    // Every consecutive pair must be graph neighbours.
    for (let i = 1; i < path.length; i++) {
      const prev = ZONES.find((z) => z.id === path[i - 1])!;
      expect(prev.neighbors).toContain(path[i]);
    }
  });

  it("length matches hopDistance + 1", () => {
    const from = "gate-n";
    const to = "facility-food";
    expect(shortestPath(from, to).length).toBe(hopDistance(from, to) + 1);
  });

  it("falls back to the origin when the target is unreachable", () => {
    expect(shortestPath("gate-n", "nowhere")).toEqual(["gate-n"]);
  });
});
