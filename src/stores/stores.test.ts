import { beforeEach, describe, expect, it } from "vitest";
import { useIncidentStore, selectOpenIncidents } from "@/stores/incident-store";
import {
  useDecisionStore,
  selectDecisionsByAgent,
} from "@/stores/decision-store";
import {
  useDispatchStore,
  selectActiveDispatches,
} from "@/stores/dispatch-store";
import { useReuniteStore, selectActiveCases } from "@/stores/reunite-store";
import {
  useNotificationStore,
  selectUnreadCount,
} from "@/stores/notification-store";
import { useAiStore } from "@/stores/ai-store";
import { useUiStore } from "@/stores/ui-store";
import {
  useSimulationStore,
  stewardCountByStatus,
} from "@/stores/simulation-store";
import type {
  Decision,
  Dispatch,
  Incident,
  ReuniteCase,
  TriageResult,
} from "@/lib/schemas/domain";
import { makeReuniteCase } from "@/features/simulation/engine/factories";
import { createRng } from "@/lib/utils";

function incident(over: Partial<Incident> = {}): Incident {
  return {
    id: "inc_1",
    createdAt: 0,
    type: "medical",
    zoneId: "stand-n",
    severity: 3,
    status: "open",
    title: "t",
    description: "d",
    triage: null,
    resolvedAt: null,
    ...over,
  };
}

const triage: TriageResult = {
  severity: 5,
  priorityRank: 0,
  confidence: 0.9,
  rationale: "r",
  recommendedActions: ["a"],
  reasoning: ["b"],
  requiredSkill: "medical",
  engine: "heuristic",
};

function decision(over: Partial<Decision> = {}): Decision {
  return {
    id: "dec_1",
    t: 0,
    agent: "strategist",
    engine: "heuristic",
    model: null,
    latencyMs: 5,
    title: "t",
    summary: "s",
    reasoning: [],
    relatedId: null,
    ...over,
  };
}

function dispatch(over: Partial<Dispatch> = {}): Dispatch {
  return {
    id: "dsp_1",
    incidentId: "inc_1",
    stewardId: "stw-01",
    stewardName: "Priya",
    status: "assigned",
    createdAt: 0,
    etaSeconds: 100,
    slaSeconds: 300,
    slaBreached: false,
    resolvedAt: null,
    rationale: "r",
    statusTimestamps: { assigned: 0 },
    ...over,
  };
}

describe("incident-store", () => {
  beforeEach(() => useIncidentStore.getState().reset());

  it("adds incidents newest-first and filters open ones", () => {
    const s = useIncidentStore.getState();
    s.addIncident(incident({ id: "a" }));
    s.addIncident(incident({ id: "b" }));
    expect(useIncidentStore.getState().incidents.map((i) => i.id)).toEqual([
      "b",
      "a",
    ]);
    useIncidentStore.getState().resolve("a", 500);
    const open = selectOpenIncidents(useIncidentStore.getState());
    expect(open.map((i) => i.id)).toEqual(["b"]);
  });

  it("applies triage severity and status", () => {
    const s = useIncidentStore.getState();
    s.addIncident(incident({ id: "a", severity: 2 }));
    s.setTriage("a", triage);
    const updated = useIncidentStore.getState().incidents[0];
    expect(updated.severity).toBe(5);
    expect(updated.status).toBe("triaged");
    expect(updated.triage).toEqual(triage);
  });
});

describe("decision-store", () => {
  beforeEach(() => useDecisionStore.getState().reset());

  it("prepends decisions and caps the ledger at 200", () => {
    const s = useDecisionStore.getState();
    for (let i = 0; i < 205; i++) s.addDecision(decision({ id: `d${i}` }));
    const state = useDecisionStore.getState();
    expect(state.decisions).toHaveLength(200);
    expect(state.decisions[0].id).toBe("d204");
  });

  it("selects decisions by agent", () => {
    const s = useDecisionStore.getState();
    s.addDecision(decision({ id: "m", agent: "marshal" }));
    s.addDecision(decision({ id: "g", agent: "guardian" }));
    const marshals = selectDecisionsByAgent("marshal")(
      useDecisionStore.getState(),
    );
    expect(marshals.map((d) => d.id)).toEqual(["m"]);
  });
});

describe("dispatch-store", () => {
  beforeEach(() => useDispatchStore.getState().reset());

  it("advances status, records timestamps and resolves", () => {
    const s = useDispatchStore.getState();
    s.addDispatch(dispatch());
    s.advanceStatus("dsp_1", "on-scene", 100);
    s.advanceStatus("dsp_1", "resolved", 200);
    const d = useDispatchStore.getState().dispatches[0];
    expect(d.status).toBe("resolved");
    expect(d.resolvedAt).toBe(200);
    expect(d.statusTimestamps["on-scene"]).toBe(100);
  });

  it("marks SLA breaches and filters active dispatches", () => {
    const s = useDispatchStore.getState();
    s.addDispatch(dispatch({ id: "active" }));
    s.addDispatch(dispatch({ id: "done", status: "resolved" }));
    s.markBreached("active");
    const active = selectActiveDispatches(useDispatchStore.getState());
    expect(active.map((d) => d.id)).toEqual(["active"]);
    expect(active[0].slaBreached).toBe(true);
  });
});

describe("reunite-store", () => {
  beforeEach(() => useReuniteStore.getState().reset());

  const rc: ReuniteCase = makeReuniteCase(createRng(1), 0);

  it("adds a case and moves it to candidate-found when candidates arrive", () => {
    const s = useReuniteStore.getState();
    s.addCase(rc);
    s.setCandidates(rc.id, [
      {
        sightingId: "sg1",
        stewardName: "Mia",
        zoneId: "gate-n",
        score: 0.9,
        rationale: "r",
        perAttribute: [],
        engine: "heuristic",
      },
    ]);
    expect(useReuniteStore.getState().cases[0].status).toBe("candidate-found");
  });

  it("stamps reunitedAt and drops reunited cases from the active list", () => {
    const s = useReuniteStore.getState();
    s.addCase(rc);
    s.setStatus(rc.id, "reunited", "child collected");
    const updated = useReuniteStore.getState().cases[0];
    expect(updated.reunitedAt).not.toBeNull();
    expect(selectActiveCases(useReuniteStore.getState())).toHaveLength(0);
  });
});

describe("notification-store", () => {
  beforeEach(() => useNotificationStore.getState().clear());

  it("notifies unread, marks read, and caps at 60", () => {
    const s = useNotificationStore.getState();
    for (let i = 0; i < 65; i++) {
      s.notify({ kind: "system", title: `n${i}`, detail: "d" });
    }
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(60);
    expect(selectUnreadCount(state)).toBe(60);

    const first = state.notifications[0].id;
    useNotificationStore.getState().markRead(first);
    expect(selectUnreadCount(useNotificationStore.getState())).toBe(59);

    useNotificationStore.getState().markAllRead();
    expect(selectUnreadCount(useNotificationStore.getState())).toBe(0);
  });
});

describe("ai-store", () => {
  beforeEach(() => useAiStore.getState().reset());

  it("tracks in-flight triage ids", () => {
    const s = useAiStore.getState();
    s.addTriaging("inc_1");
    s.addTriaging("inc_2");
    s.removeTriaging("inc_1");
    expect(useAiStore.getState().triagingIds).toEqual(["inc_2"]);
  });

  it("records a forecast and clears the forecasting flag", () => {
    const s = useAiStore.getState();
    s.setForecasting(true);
    s.setForecast({
      summary: "s",
      zones: [],
      proactiveAlerts: [],
      reasoning: [],
      engine: "heuristic",
    });
    const state = useAiStore.getState();
    expect(state.forecasting).toBe(false);
    expect(state.latestForecast).not.toBeNull();
    expect(state.forecastAt).not.toBeNull();
  });
});

describe("ui-store", () => {
  it("toggles command palette and sidebar and selects a zone", () => {
    const s = useUiStore.getState();
    s.toggleCommand();
    expect(useUiStore.getState().commandOpen).toBe(true);
    s.toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
    s.setSelectedZone("stand-n");
    expect(useUiStore.getState().selectedZoneId).toBe("stand-n");
  });
});

describe("simulation-store", () => {
  beforeEach(() => useSimulationStore.getState().reset());

  it("queues and drains scenarios in FIFO order", () => {
    const s = useSimulationStore.getState();
    s.queueScenario("goal-home");
    s.queueScenario("medical");
    expect(useSimulationStore.getState().dequeueScenario()).toBe("goal-home");
    expect(useSimulationStore.getState().dequeueScenario()).toBe("medical");
    expect(useSimulationStore.getState().dequeueScenario()).toBeUndefined();
  });

  it("caps match-event history at 40", () => {
    const s = useSimulationStore.getState();
    for (let i = 0; i < 45; i++) {
      s.addMatchEvent({
        id: `e${i}`,
        t: i,
        minute: 0,
        type: "announcement",
        description: "x",
      });
    }
    expect(useSimulationStore.getState().matchEvents).toHaveLength(40);
  });

  it("updates a steward in place", () => {
    const s = useSimulationStore.getState();
    const id = useSimulationStore.getState().stewards[0].id;
    s.updateSteward(id, { status: "en-route", taskId: "dsp_1" });
    const w = useSimulationStore.getState().stewards.find((x) => x.id === id)!;
    expect(w.status).toBe("en-route");
    expect(w.taskId).toBe("dsp_1");
  });

  it("stewardCountByStatus sums to the roster size", () => {
    const stewards = useSimulationStore.getState().stewards;
    const counts = stewardCountByStatus(stewards);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(stewards.length);
  });
});
