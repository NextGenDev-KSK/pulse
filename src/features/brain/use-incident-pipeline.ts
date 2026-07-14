"use client";

import * as React from "react";
import { useSimulationStore } from "@/stores/simulation-store";
import { useIncidentStore } from "@/stores/incident-store";
import { useAiStore } from "@/stores/ai-store";
import { useNotificationStore } from "@/stores/notification-store";
import { requestTriage, requestForecast, requestBriefing } from "@/lib/ai/client";
import { recordDecision } from "@/lib/ai/record-decision";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { toast } from "@/components/ui/toast";
import { useDispatchPipeline } from "@/features/dispatch/use-dispatch-pipeline";

const FORECAST_EVERY_TICKS = 6;

/**
 * The autonomous agent loop. Triages every new incident with STRATEGIST,
 * runs SENTINEL forecasts + briefings on a cadence, and delegates responder
 * assignment to the dispatch pipeline (MARSHAL). Records every decision.
 */
export function useIncidentPipeline() {
  const incidents = useIncidentStore((s) => s.incidents);
  const tickCount = useSimulationStore((s) => s.tickCount);
  const running = useSimulationStore((s) => s.running);
  const processingRef = React.useRef<Set<string>>(new Set());
  const lastForecastTickRef = React.useRef(0);

  // MARSHAL — reacts to triaged incidents (Phase 5).
  useDispatchPipeline();

  // Reset guards when the sim resets.
  React.useEffect(() => {
    if (tickCount === 0) {
      processingRef.current.clear();
      lastForecastTickRef.current = 0;
    }
  }, [tickCount]);

  /* -------------------------------------------------- STRATEGIST: triage */
  React.useEffect(() => {
    const untriaged = incidents.filter(
      (i) =>
        i.status === "open" &&
        !i.triage &&
        !processingRef.current.has(i.id),
    );
    if (untriaged.length === 0) return;

    for (const inc of untriaged) {
      processingRef.current.add(inc.id);
      useAiStore.getState().addTriaging(inc.id);

      const sim = useSimulationStore.getState();
      const incidentState = useIncidentStore.getState();
      const zoneTelemetry = sim.telemetry[inc.zoneId] ?? null;
      const neighborTelemetry = (ZONE_MAP[inc.zoneId]?.neighbors ?? [])
        .map((id) => sim.telemetry[id])
        .filter(Boolean);
      const openIncidentCount = incidentState.incidents.filter(
        (i) => i.status !== "resolved" && i.id !== inc.id,
      ).length;

      requestTriage({
        incident: inc,
        snapshot: sim.snapshot,
        zoneTelemetry,
        neighborTelemetry,
        openIncidentCount,
      })
        .then(({ data, engine, latencyMs }) => {
          // Priority rank across currently open incidents.
          const higher = useIncidentStore
            .getState()
            .incidents.filter(
              (i) =>
                i.status !== "resolved" &&
                i.id !== inc.id &&
                (i.triage?.severity ?? i.severity) > data.severity,
            ).length;
          const triage = { ...data, priorityRank: higher + 1 };
          useIncidentStore.getState().setTriage(inc.id, triage);
          recordDecision({
            agent: "strategist",
            engine,
            latencyMs,
            title: `Triaged S${data.severity}: ${inc.title}`,
            summary: data.rationale,
            reasoning: data.reasoning,
            relatedId: inc.id,
          });
        })
        .catch(() => {
          processingRef.current.delete(inc.id);
        })
        .finally(() => {
          useAiStore.getState().removeTriaging(inc.id);
        });
    }
  }, [incidents]);

  /* ---------------------------------------------- SENTINEL: forecast loop */
  React.useEffect(() => {
    if (!running || tickCount === 0) return;
    if (
      tickCount !== 1 &&
      tickCount - lastForecastTickRef.current < FORECAST_EVERY_TICKS
    )
      return;
    lastForecastTickRef.current = tickCount;

    const sim = useSimulationStore.getState();
    const telemetry = Object.values(sim.telemetry);
    useAiStore.getState().setForecasting(true);

    requestForecast({
      snapshot: sim.snapshot,
      telemetry,
      trends: sim.densityHistory,
    }).then(({ data, engine, latencyMs }) => {
      useAiStore.getState().setForecast(data);
      recordDecision({
        agent: "sentinel",
        engine,
        latencyMs,
        title: "15-minute crowd forecast",
        summary: data.summary,
        reasoning: data.reasoning,
        relatedId: null,
      });
      // Surface new critical proactive alerts.
      for (const alert of data.proactiveAlerts) {
        if (alert.severity >= 4) {
          useNotificationStore.getState().notify({
            kind: "forecast",
            title: `Pre-emptive alert · ${ZONE_MAP[alert.zoneId]?.name ?? alert.zoneId}`,
            detail: alert.message,
          });
          toast({
            title: `Forecast: ${ZONE_MAP[alert.zoneId]?.name} crowding`,
            description: alert.message,
            variant: "warning",
          });
        }
      }
    });

    // Briefing runs alongside the forecast.
    const hotZones = [...telemetry]
      .filter((t) => ZONE_MAP[t.zoneId]?.kind !== "pitch")
      .sort((a, b) => b.density - a.density)
      .slice(0, 4);
    requestBriefing({
      snapshot: sim.snapshot,
      hotZones,
      openIncidents: useIncidentStore
        .getState()
        .incidents.filter((i) => i.status !== "resolved").length,
    }).then(({ data }) => useAiStore.getState().setBriefing(data));
  }, [tickCount, running]);
}
