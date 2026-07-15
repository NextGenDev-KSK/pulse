import { describe, expect, it } from "vitest";
import { candidateReason, selectResponder } from "@/features/dispatch/assignment";
import type { Incident, Steward, TriageResult } from "@/lib/schemas/domain";

function steward(over: Partial<Steward> = {}): Steward {
  return {
    id: "stw-01",
    name: "Priya Sharma",
    skills: ["medical"],
    status: "available",
    zoneId: "stand-n",
    taskId: null,
    ...over,
  };
}

function triage(requiredSkill: TriageResult["requiredSkill"]): TriageResult {
  return {
    severity: 4,
    priorityRank: 0,
    confidence: 0.8,
    rationale: "r",
    recommendedActions: ["a"],
    reasoning: ["b"],
    requiredSkill,
    engine: "heuristic",
  };
}

function incident(requiredSkill: TriageResult["requiredSkill"] = "medical"): Incident {
  return {
    id: "inc_1",
    createdAt: 0,
    type: "medical",
    zoneId: "stand-n",
    severity: 4,
    status: "triaged",
    title: "t",
    description: "d",
    triage: triage(requiredSkill),
    resolvedAt: null,
  };
}

describe("selectResponder", () => {
  it("prefers a skill match even when it is farther away", () => {
    const nearNoSkill = steward({
      id: "near",
      skills: ["security"],
      zoneId: "stand-n", // same zone as incident: cost 0
    });
    const farSkilled = steward({
      id: "far",
      skills: ["medical"],
      zoneId: "gate-s", // several hops away
    });
    const { chosen } = selectResponder(incident("medical"), [
      nearNoSkill,
      farSkilled,
    ]);
    expect(chosen?.steward.id).toBe("far");
    expect(chosen?.skillMatch).toBe(true);
  });

  it("falls back to the nearest available steward when no skill matches", () => {
    const near = steward({ id: "near", skills: ["security"], zoneId: "stand-n" });
    const far = steward({ id: "far", skills: ["security"], zoneId: "gate-s" });
    const { chosen } = selectResponder(incident("medical"), [far, near]);
    expect(chosen?.steward.id).toBe("near");
    expect(chosen?.skillMatch).toBe(false);
  });

  it("ignores unavailable or already-tasked stewards", () => {
    const busy = steward({ id: "busy", status: "en-route", zoneId: "stand-n" });
    const tasked = steward({ id: "tasked", taskId: "dsp_9", zoneId: "stand-n" });
    const free = steward({ id: "free", zoneId: "gate-s" });
    const { chosen } = selectResponder(incident("medical"), [busy, tasked, free]);
    expect(chosen?.steward.id).toBe("free");
  });

  it("returns null when nobody is available", () => {
    const { chosen, alternatives } = selectResponder(incident(), [
      steward({ status: "break" }),
      steward({ id: "x", taskId: "dsp_1" }),
    ]);
    expect(chosen).toBeNull();
    expect(alternatives).toEqual([]);
  });

  it("treats an 'any' skill requirement as always matching", () => {
    const s = steward({ skills: ["guest-services"] });
    const { chosen } = selectResponder(incident("any"), [s]);
    expect(chosen?.skillMatch).toBe(true);
  });

  it("returns up to three alternatives sorted after the chosen one", () => {
    const stewards = ["gate-n", "gate-s", "gate-e", "gate-w", "concourse-w"].map(
      (zoneId, i) =>
        steward({ id: `s${i}`, skills: ["medical"], zoneId }),
    );
    const { chosen, alternatives } = selectResponder(incident(), stewards);
    expect(chosen).not.toBeNull();
    expect(alternatives.length).toBeLessThanOrEqual(3);
    // Alternatives are ordered by non-decreasing cost.
    for (let i = 1; i < alternatives.length; i++) {
      expect(alternatives[i].cost).toBeGreaterThanOrEqual(alternatives[i - 1].cost);
    }
  });
});

describe("candidateReason", () => {
  it("describes a skill match with the origin zone name", () => {
    const { chosen } = selectResponder(incident("medical"), [
      steward({ skills: ["medical"], zoneId: "gate-n" }),
    ]);
    expect(chosen).not.toBeNull();
    const reason = candidateReason(chosen!);
    expect(reason).toContain("skill match");
    expect(reason).toContain("North Gate");
  });

  it("describes a non-skill fallback as nearest available", () => {
    const { chosen } = selectResponder(incident("medical"), [
      steward({ skills: ["security"], zoneId: "gate-n" }),
    ]);
    expect(candidateReason(chosen!)).toContain("nearest available");
  });
});
