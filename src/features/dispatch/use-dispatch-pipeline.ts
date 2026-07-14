"use client";

import * as React from "react";
import { useSimulationStore } from "@/stores/simulation-store";
import { useIncidentStore } from "@/stores/incident-store";
import { useDispatchStore } from "@/stores/dispatch-store";
import { useNotificationStore } from "@/stores/notification-store";
import { selectResponder, candidateReason } from "./assignment";
import { requestDispatchRationale } from "@/lib/ai/client";
import { recordDecision } from "@/lib/ai/record-decision";
import { SLA_BY_SEVERITY } from "@/lib/constants";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { shortestPath } from "@/lib/stadium/graph";
import { clamp, uid } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import type { Dispatch, Incident } from "@/lib/schemas/domain";

/**
 * MARSHAL — reacts to triaged incidents, assigns the nearest qualified
 * responder, drives the dispatch lifecycle (assigned → en-route → on-scene →
 * resolved) and watches SLA. Timings are compressed for a live demo.
 */
export function useDispatchPipeline() {
  const incidents = useIncidentStore((s) => s.incidents);
  const tickCount = useSimulationStore((s) => s.tickCount);
  const dispatchedRef = React.useRef<Set<string>>(new Set());
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = React.useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  // Clear timers + guards on reset.
  React.useEffect(() => {
    if (tickCount === 0) {
      dispatchedRef.current.clear();
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      useDispatchStore.getState().reset();
    }
  }, [tickCount]);

  React.useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
    },
    [],
  );

  React.useEffect(() => {
    const pending = incidents.filter(
      (i) =>
        i.status === "triaged" &&
        i.triage &&
        !dispatchedRef.current.has(i.id),
    );
    if (pending.length === 0) return;

    for (const incident of pending) {
      const stewards = useSimulationStore.getState().stewards;
      const { chosen, alternatives } = selectResponder(incident, stewards);
      if (!chosen) continue; // no responder free — retry on next tick

      dispatchedRef.current.add(incident.id);
      assign(incident, chosen, alternatives, later);
    }
  }, [incidents, tickCount, later]);
}

function assign(
  incident: Incident,
  chosen: ReturnType<typeof selectResponder>["chosen"],
  alternatives: ReturnType<typeof selectResponder>["alternatives"],
  later: (fn: () => void, ms: number) => void,
) {
  if (!chosen) return;
  const now = Date.now();
  const severity = incident.triage?.severity ?? incident.severity;
  const slaSeconds = SLA_BY_SEVERITY[severity] ?? 600;
  const dispatchId = uid("dsp");
  const zoneName = ZONE_MAP[incident.zoneId]?.name ?? incident.zoneId;

  const dispatch: Dispatch = {
    id: dispatchId,
    incidentId: incident.id,
    stewardId: chosen.steward.id,
    stewardName: chosen.steward.name,
    status: "en-route",
    createdAt: now,
    etaSeconds: chosen.etaSeconds,
    slaSeconds,
    slaBreached: false,
    resolvedAt: null,
    rationale: "Assigning nearest qualified responder…",
    statusTimestamps: { assigned: now, "en-route": now },
  };

  useDispatchStore.getState().addDispatch(dispatch);
  useIncidentStore.getState().setStatus(incident.id, "dispatched");
  useSimulationStore.getState().updateSteward(chosen.steward.id, {
    status: "en-route",
    taskId: dispatchId,
  });

  useNotificationStore.getState().notify({
    kind: "dispatch",
    title: `${chosen.steward.name} dispatched`,
    detail: `Responding to ${incident.title} at ${zoneName} · ETA ${chosen.etaSeconds}s`,
  });

  // AI rationale + ledger entry.
  requestDispatchRationale({
    incident,
    chosen: { steward: chosen.steward, etaSeconds: chosen.etaSeconds },
    alternatives: alternatives.map((a) => ({
      name: a.steward.name,
      etaSeconds: a.etaSeconds,
      reason: candidateReason(a),
    })),
  }).then(({ data, engine, latencyMs }) => {
    useDispatchStore.getState().advanceStatus(dispatchId, dispatch.status, now);
    // Patch rationale directly.
    useDispatchStore.setState((s) => ({
      dispatches: s.dispatches.map((d) =>
        d.id === dispatchId ? { ...d, rationale: data.rationale } : d,
      ),
    }));
    recordDecision({
      agent: "marshal",
      engine,
      latencyMs,
      title: `Dispatched ${chosen.steward.name} → ${zoneName}`,
      summary: data.rationale,
      reasoning: [
        `Incident requires a ${incident.triage?.requiredSkill ?? "any"} responder.`,
        `${chosen.steward.name} selected: ${candidateReason(chosen)}.`,
        `Estimated arrival in ${chosen.etaSeconds}s; SLA budget ${slaSeconds}s.`,
        data.briefing,
      ],
      relatedId: incident.id,
    });
  });

  // Lifecycle timing (compressed).
  const path = shortestPath(chosen.steward.zoneId, incident.zoneId);
  const midZone = path[Math.floor(path.length / 2)] ?? chosen.steward.zoneId;
  const onSceneMs = clamp(chosen.etaSeconds * 0.12, 3, 12) * 1000;
  const resolveMs = onSceneMs + 5000 + severity * 1200;

  // Move steward toward the incident (mid-point) shortly after departure.
  later(() => {
    useSimulationStore.getState().updateSteward(chosen.steward.id, {
      zoneId: midZone,
    });
  }, Math.min(onSceneMs * 0.5, 3000));

  // Arrive on scene.
  later(() => {
    const elapsed = (Date.now() - now) / 1000;
    const breached = elapsed > slaSeconds;
    useDispatchStore.getState().advanceStatus(dispatchId, "on-scene", Date.now());
    if (breached) {
      useDispatchStore.getState().markBreached(dispatchId);
      useNotificationStore.getState().notify({
        kind: "sla",
        title: `SLA breached · ${zoneName}`,
        detail: `Response exceeded the ${slaSeconds}s target for a severity ${severity} incident.`,
      });
    }
    useSimulationStore.getState().updateSteward(chosen.steward.id, {
      status: "on-scene",
      zoneId: incident.zoneId,
    });
  }, onSceneMs);

  // Resolve.
  later(() => {
    const resolvedAt = Date.now();
    useDispatchStore.getState().advanceStatus(dispatchId, "resolved", resolvedAt);
    useIncidentStore.getState().resolve(incident.id, resolvedAt);
    useSimulationStore.getState().updateSteward(chosen.steward.id, {
      status: "available",
      taskId: null,
    });
    useNotificationStore.getState().notify({
      kind: "dispatch",
      title: `Resolved · ${incident.title}`,
      detail: `${chosen.steward.name} cleared the incident at ${zoneName}.`,
    });
    if (severity >= 4) {
      toast({
        title: `Resolved: ${incident.title}`,
        description: `${chosen.steward.name} cleared it at ${zoneName}.`,
        variant: "success",
      });
    }
  }, resolveMs);
}
