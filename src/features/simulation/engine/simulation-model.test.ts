import { describe, expect, it } from "vitest";
import { SimulationModel } from "@/features/simulation/engine/simulation-model";
import type { ScenarioId } from "@/stores/simulation-store";
import {
  snapshotSchema,
  zoneTelemetrySchema,
} from "@/lib/schemas/domain";

function run(model: SimulationModel, ticks: number, queue: ScenarioId[] = []) {
  const out = [];
  for (let i = 0; i < ticks; i++) out.push(model.tick(i === 0 ? queue : []));
  return out;
}

describe("SimulationModel determinism", () => {
  it("produces identical density/phase trajectories for the same seed", () => {
    const a = run(new SimulationModel(20260714), 60);
    const b = run(new SimulationModel(20260714), 60);

    const densities = (r: ReturnType<SimulationModel["tick"]>) =>
      r.telemetry.map((t) => Math.round(t.density * 1000));
    for (let i = 0; i < a.length; i++) {
      expect(densities(a[i])).toEqual(densities(b[i]));
      expect(a[i].snapshot.phase).toBe(b[i].snapshot.phase);
    }
  });

  it("diverges for different seeds", () => {
    const a = run(new SimulationModel(1), 30);
    const b = run(new SimulationModel(2), 30);
    const lastA = a[a.length - 1].telemetry.map((t) => t.density);
    const lastB = b[b.length - 1].telemetry.map((t) => t.density);
    expect(lastA).not.toEqual(lastB);
  });
});

describe("SimulationModel output integrity", () => {
  it("emits schema-valid, clamped telemetry and snapshots every tick", () => {
    for (const result of run(new SimulationModel(42), 120)) {
      expect(() => snapshotSchema.parse(result.snapshot)).not.toThrow();
      expect(result.snapshot.pressureIndex).toBeGreaterThanOrEqual(0);
      expect(result.snapshot.pressureIndex).toBeLessThanOrEqual(100);
      for (const row of result.telemetry) {
        expect(() => zoneTelemetrySchema.parse(row)).not.toThrow();
        expect(row.density).toBeGreaterThanOrEqual(0);
        expect(row.density).toBeLessThanOrEqual(135);
      }
    }
  });
});

describe("SimulationModel phase progression", () => {
  it("moves pre-match → first-half → halftime → second-half → full-time", () => {
    const phases = new Set(
      run(new SimulationModel(20260714), 200).map((r) => r.snapshot.phase),
    );
    expect(phases.has("pre-match")).toBe(true);
    expect(phases.has("first-half")).toBe(true);
    expect(phases.has("halftime")).toBe(true);
    expect(phases.has("second-half")).toBe(true);
    expect(phases.has("full-time")).toBe(true);
  });

  it("kicks off only after the pre-match lead-in", () => {
    const results = run(new SimulationModel(20260714), 6);
    expect(results[0].snapshot.phase).toBe("pre-match");
    // A kickoff match event appears exactly once.
    const kickoffs = results
      .flatMap((r) => r.matchEvents)
      .filter((e) => e.type === "kickoff");
    expect(kickoffs).toHaveLength(1);
  });
});

describe("SimulationModel scenarios", () => {
  it("applies a queued goal as a goal match event", () => {
    const [first] = run(new SimulationModel(1), 1, ["goal-home"]);
    expect(first.matchEvents.some((e) => e.type === "goal")).toBe(true);
  });

  it("spawns an incident for a medical scenario", () => {
    const [first] = run(new SimulationModel(1), 1, ["medical"]);
    const medical = first.incidents.filter((i) => i.type === "medical");
    expect(medical.length).toBe(1);
  });

  it("opens a reunite case and a lost-child incident together", () => {
    const [first] = run(new SimulationModel(1), 1, ["lost-child"]);
    expect(first.reuniteCases).toHaveLength(1);
    expect(first.incidents.some((i) => i.type === "lost-child")).toBe(true);
  });

  it("turns the weather to a storm on demand", () => {
    const [first] = run(new SimulationModel(1), 1, ["weather-turn"]);
    expect(first.snapshot.weather.condition).toBe("storm");
  });
});
