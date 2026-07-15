import { describe, expect, it } from "vitest";
import {
  clamp,
  cn,
  createRng,
  formatClock,
  formatDuration,
  formatNumber,
  formatRelativeTime,
  initials,
  lerp,
  roundTo,
  uid,
} from "@/lib/utils";

describe("clamp", () => {
  it("clamps above the max and below the min", () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it("passes values already in range unchanged", () => {
    expect(clamp(42, 0, 100)).toBe(42);
  });

  it("defaults to a 0..100 range", () => {
    expect(clamp(200)).toBe(100);
    expect(clamp(-1)).toBe(0);
  });
});

describe("createRng", () => {
  it("is deterministic for a given seed", () => {
    const a = createRng(20260714);
    const b = createRng(20260714);
    const seqA = Array.from({ length: 8 }, () => a());
    const seqB = Array.from({ length: 8 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a()).not.toBe(b());
  });

  it("stays within [0, 1)", () => {
    const rng = createRng(99);
    for (let i = 0; i < 500; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("lerp", () => {
  it("interpolates endpoints and midpoint", () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});

describe("roundTo", () => {
  it("rounds to the requested precision", () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
    expect(roundTo(3.7)).toBe(4);
    expect(roundTo(2.555, 2)).toBe(2.56);
  });
});

describe("uid", () => {
  it("prefixes and is highly likely to be unique", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => uid("inc")));
    expect(ids.size).toBe(1000);
    for (const id of ids) expect(id.startsWith("inc_")).toBe(true);
  });

  it("defaults the prefix to 'id'", () => {
    expect(uid().startsWith("id_")).toBe(true);
  });
});

describe("formatClock", () => {
  it("formats seconds as zero-padded mm:ss", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(2700)).toBe("45:00");
  });
});

describe("formatRelativeTime", () => {
  it("renders seconds, minutes and hours", () => {
    const now = 10_000_000;
    expect(formatRelativeTime(now - 5_000, now)).toBe("5s ago");
    expect(formatRelativeTime(now - 90_000, now)).toBe("1m 30s ago");
    expect(formatRelativeTime(now - 3_720_000, now)).toBe("1h 2m ago");
  });

  it("never goes negative for future timestamps", () => {
    const now = 1000;
    expect(formatRelativeTime(now + 5000, now)).toBe("0s ago");
  });
});

describe("formatNumber", () => {
  it("groups thousands and rounds", () => {
    expect(formatNumber(62000)).toBe("62,000");
    expect(formatNumber(1234.6)).toBe("1,235");
  });
});

describe("formatDuration", () => {
  it("uses seconds under a minute", () => {
    expect(formatDuration(45)).toBe("45s");
  });
  it("uses minutes and seconds above a minute", () => {
    expect(formatDuration(90)).toBe("1m 30s");
    expect(formatDuration(120)).toBe("2m");
  });
});

describe("initials", () => {
  it("takes the first two word initials, uppercased", () => {
    expect(initials("Priya Sharma")).toBe("PS");
    expect(initials("madonna")).toBe("M");
    expect(initials("Jean Luc Picard")).toBe("JL");
  });
});

describe("cn", () => {
  it("merges tailwind classes with later ones winning", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold",
    );
  });
});
