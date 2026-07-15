import { describe, expect, it } from "vitest";
import { densityColor, densityOpacity } from "@/lib/stadium/heatmap";

describe("densityColor", () => {
  it("returns a valid HSL string across the whole range", () => {
    for (let d = -20; d <= 140; d += 5) {
      expect(densityColor(d)).toMatch(/^hsl\(\d+ \d+% \d+%\)$/);
    }
  });

  it("clamps out-of-range densities to the endpoint stops", () => {
    expect(densityColor(-50)).toBe(densityColor(0));
    expect(densityColor(999)).toBe(densityColor(100));
  });

  it("shifts hue from emerald (calm) toward rose (critical)", () => {
    const calm = densityColor(0);
    const critical = densityColor(100);
    expect(calm).not.toBe(critical);
    // Emerald hue ~152, rose hue ~350.
    expect(calm).toMatch(/^hsl\(152 /);
    expect(critical).toMatch(/^hsl\(350 /);
  });
});

describe("densityOpacity", () => {
  it("ramps monotonically and stays within [0, 1]", () => {
    let prev = -1;
    for (let d = 0; d <= 100; d += 10) {
      const o = densityOpacity(d);
      expect(o).toBeGreaterThanOrEqual(0);
      expect(o).toBeLessThanOrEqual(1);
      expect(o).toBeGreaterThan(prev);
      prev = o;
    }
  });

  it("keeps calm zones faint and critical zones strong", () => {
    expect(densityOpacity(0)).toBeCloseTo(0.18, 2);
    expect(densityOpacity(100)).toBeCloseTo(0.8, 2);
  });
});
