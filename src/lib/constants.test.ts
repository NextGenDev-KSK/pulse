import { describe, expect, it } from "vitest";
import {
  AGENT_META,
  INCIDENT_META,
  RISK_THRESHOLDS,
  SKILL_META,
  SLA_BY_SEVERITY,
  densityToRisk,
  isSlaBreached,
  slaForSeverity,
} from "@/lib/constants";
import { incidentTypeSchema, stewardSkillSchema } from "@/lib/schemas/domain";

describe("densityToRisk", () => {
  it("maps each band by its threshold boundary", () => {
    expect(densityToRisk(0)).toBe("calm");
    expect(densityToRisk(RISK_THRESHOLDS.busy - 0.01)).toBe("calm");
    expect(densityToRisk(RISK_THRESHOLDS.busy)).toBe("busy");
    expect(densityToRisk(RISK_THRESHOLDS.crowded - 0.01)).toBe("busy");
    expect(densityToRisk(RISK_THRESHOLDS.crowded)).toBe("crowded");
    expect(densityToRisk(RISK_THRESHOLDS.critical - 0.01)).toBe("crowded");
    expect(densityToRisk(RISK_THRESHOLDS.critical)).toBe("critical");
    expect(densityToRisk(130)).toBe("critical");
  });

  it("thresholds are strictly increasing", () => {
    expect(RISK_THRESHOLDS.busy).toBeLessThan(RISK_THRESHOLDS.crowded);
    expect(RISK_THRESHOLDS.crowded).toBeLessThan(RISK_THRESHOLDS.critical);
  });
});

describe("SLA_BY_SEVERITY", () => {
  it("gives a strictly tighter budget to higher severities", () => {
    for (let sev = 5; sev > 1; sev--) {
      expect(SLA_BY_SEVERITY[sev]).toBeLessThan(SLA_BY_SEVERITY[sev - 1]);
    }
  });

  it("covers every severity 1..5", () => {
    for (let sev = 1; sev <= 5; sev++) {
      expect(SLA_BY_SEVERITY[sev]).toBeGreaterThan(0);
    }
  });
});

describe("slaForSeverity / isSlaBreached", () => {
  it("returns the budget for a severity, with a sane default", () => {
    expect(slaForSeverity(5)).toBe(180);
    expect(slaForSeverity(1)).toBe(2700);
    expect(slaForSeverity(99)).toBe(600);
  });

  it("breaches only when the modelled ETA exceeds the budget", () => {
    // Severity 5 budget is 180s.
    expect(isSlaBreached(120, 5)).toBe(false);
    expect(isSlaBreached(180, 5)).toBe(false); // exactly on target is met
    expect(isSlaBreached(240, 5)).toBe(true);
  });

  it("compares ETA and budget in the same (simulated-seconds) domain", () => {
    // A far responder to a high-severity incident breaches; a near one does not.
    expect(isSlaBreached(210, 5)).toBe(true);
    expect(isSlaBreached(210, 3)).toBe(false); // severity 3 budget is 600s
  });
});

describe("metadata tables", () => {
  it("INCIDENT_META covers every incident type with a valid skill", () => {
    for (const type of incidentTypeSchema.options) {
      const meta = INCIDENT_META[type];
      expect(meta).toBeDefined();
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.icon.length).toBeGreaterThan(0);
      expect(["medical", "security", "guest-services", "any"]).toContain(
        meta.skill,
      );
    }
  });

  it("SKILL_META covers every steward skill", () => {
    for (const skill of stewardSkillSchema.options) {
      expect(SKILL_META[skill]).toBeDefined();
    }
  });

  it("AGENT_META describes the four named agents", () => {
    expect(Object.keys(AGENT_META).sort()).toEqual([
      "guardian",
      "marshal",
      "sentinel",
      "strategist",
    ]);
  });
});
