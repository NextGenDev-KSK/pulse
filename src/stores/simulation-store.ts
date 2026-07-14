"use client";

import { create } from "zustand";
import type {
  MatchEvent,
  Snapshot,
  Steward,
  StewardStatus,
  ZoneTelemetry,
} from "@/lib/schemas/domain";
import { HISTORY_POINTS } from "@/lib/constants";
import { pushCapped, pushCappedItem } from "@/lib/ring-buffer";
import { seedSnapshot, seedStewards, seedTelemetry } from "@/features/simulation/seed";

const now = 0;

export type ScenarioId =
  | "goal-home"
  | "goal-away"
  | "halftime-surge"
  | "medical"
  | "security"
  | "lost-child"
  | "gate-crush"
  | "weather-turn";

interface SimulationState {
  running: boolean;
  tickCount: number;
  snapshot: Snapshot;
  telemetry: Record<string, ZoneTelemetry>;
  densityHistory: Record<string, number[]>;
  pressureHistory: number[];
  attendanceHistory: number[];
  matchEvents: MatchEvent[];
  stewards: Steward[];
  /** Scenario triggers queued by the operator, drained by the tick engine. */
  scenarioQueue: ScenarioId[];

  setRunning: (running: boolean) => void;
  incrementTick: () => void;
  setSnapshot: (snapshot: Snapshot) => void;
  ingestTelemetry: (rows: ZoneTelemetry[]) => void;
  addMatchEvent: (event: MatchEvent) => void;
  setStewards: (stewards: Steward[]) => void;
  updateSteward: (
    id: string,
    patch: Partial<Pick<Steward, "status" | "zoneId" | "taskId">>,
  ) => void;
  queueScenario: (id: ScenarioId) => void;
  dequeueScenario: () => ScenarioId | undefined;
  reset: () => void;
}

function initialState() {
  const snapshot = seedSnapshot(now);
  const telemetryRows = seedTelemetry(now);
  const telemetry: Record<string, ZoneTelemetry> = {};
  const densityHistory: Record<string, number[]> = {};
  for (const row of telemetryRows) {
    telemetry[row.zoneId] = row;
    densityHistory[row.zoneId] = [row.density];
  }
  return {
    running: false,
    tickCount: 0,
    snapshot,
    telemetry,
    densityHistory,
    pressureHistory: [snapshot.pressureIndex],
    attendanceHistory: [snapshot.attendance],
    matchEvents: [] as MatchEvent[],
    stewards: seedStewards(),
    scenarioQueue: [] as ScenarioId[],
  };
}

export const useSimulationStore = create<SimulationState>((set) => ({
  ...initialState(),

  setRunning: (running) => set({ running }),
  incrementTick: () => set((s) => ({ tickCount: s.tickCount + 1 })),

  setSnapshot: (snapshot) =>
    set((s) => ({
      snapshot,
      pressureHistory: pushCapped(
        s.pressureHistory,
        snapshot.pressureIndex,
        HISTORY_POINTS,
      ),
      attendanceHistory: pushCapped(
        s.attendanceHistory,
        snapshot.attendance,
        HISTORY_POINTS,
      ),
    })),

  ingestTelemetry: (rows) =>
    set((s) => {
      const telemetry = { ...s.telemetry };
      const densityHistory = { ...s.densityHistory };
      for (const row of rows) {
        telemetry[row.zoneId] = row;
        densityHistory[row.zoneId] = pushCapped(
          densityHistory[row.zoneId] ?? [],
          row.density,
          HISTORY_POINTS,
        );
      }
      return { telemetry, densityHistory };
    }),

  addMatchEvent: (event) =>
    set((s) => ({
      matchEvents: pushCappedItem(s.matchEvents, event, 40),
    })),

  setStewards: (stewards) => set({ stewards }),

  updateSteward: (id, patch) =>
    set((s) => ({
      stewards: s.stewards.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    })),

  queueScenario: (id) =>
    set((s) => ({ scenarioQueue: [...s.scenarioQueue, id] })),

  dequeueScenario: () => {
    let taken: ScenarioId | undefined;
    set((s) => {
      if (!s.scenarioQueue.length) return s;
      const [first, ...rest] = s.scenarioQueue;
      taken = first;
      return { scenarioQueue: rest };
    });
    return taken;
  },

  reset: () => set(initialState()),
}));

/** Convenience selectors. */
export const selectTelemetryList = (s: SimulationState) =>
  Object.values(s.telemetry);

export function stewardCountByStatus(
  stewards: Steward[],
): Record<StewardStatus, number> {
  const base: Record<StewardStatus, number> = {
    available: 0,
    "en-route": 0,
    "on-scene": 0,
    break: 0,
  };
  for (const w of stewards) base[w.status] += 1;
  return base;
}
