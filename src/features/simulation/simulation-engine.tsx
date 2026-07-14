"use client";

import * as React from "react";
import { SimulationModel } from "./engine/simulation-model";
import { useSimulationStore } from "@/stores/simulation-store";
import { useIncidentStore } from "@/stores/incident-store";
import { useReuniteStore } from "@/stores/reunite-store";
import { useNotificationStore } from "@/stores/notification-store";
import { TICK_MS } from "@/lib/constants";
import { toast } from "@/components/ui/toast";
import { useIncidentPipeline } from "@/features/brain/use-incident-pipeline";
import { useReunitePipeline } from "@/features/reunite/use-reunite-pipeline";

/**
 * Drives the live simulation. While `running`, it advances the model every
 * {@link TICK_MS} and applies the result to the domain stores. Mounted once,
 * inside the console shell.
 */
export function SimulationEngine() {
  const running = useSimulationStore((s) => s.running);
  const tickCount = useSimulationStore((s) => s.tickCount);
  const modelRef = React.useRef<SimulationModel | null>(null);

  // AI/dispatch pipeline reacts to new incidents (Phase 4/5).
  useIncidentPipeline();
  // Guardian pipeline reacts to new lost-child cases (Phase 6).
  useReunitePipeline();

  // Auto-start the live stream on first console entry so the app is immediately
  // alive. The operator can pause/reset at any time.
  React.useEffect(() => {
    const s = useSimulationStore.getState();
    if (!s.running && s.tickCount === 0) s.setRunning(true);
  }, []);

  // Re-seed the model whenever the store resets (tickCount returns to 0 while paused).
  React.useEffect(() => {
    if (tickCount === 0) modelRef.current = new SimulationModel();
  }, [tickCount]);

  React.useEffect(() => {
    if (!running) return;
    if (!modelRef.current) modelRef.current = new SimulationModel();

    const runTick = () => {
      const sim = useSimulationStore.getState();
      const model = modelRef.current!;

      // Drain queued operator scenarios.
      const scenarios = [...sim.scenarioQueue];
      if (scenarios.length) {
        for (let i = 0; i < scenarios.length; i++) sim.dequeueScenario();
      }

      const result = model.tick(scenarios);

      sim.setSnapshot(result.snapshot);
      sim.ingestTelemetry(result.telemetry);
      sim.incrementTick();
      for (const e of result.matchEvents) sim.addMatchEvent(e);

      const incidentStore = useIncidentStore.getState();
      for (const inc of result.incidents) incidentStore.addIncident(inc);

      const reuniteStore = useReuniteStore.getState();
      for (const rc of result.reuniteCases) reuniteStore.addCase(rc);

      const notif = useNotificationStore.getState();
      for (const n of result.notifications) notif.notify(n);

      // Surface urgent incidents as toasts.
      for (const inc of result.incidents) {
        if (inc.severity >= 4) {
          toast({
            title: `S${inc.severity} · ${inc.title}`,
            description: "Strategist is triaging now.",
            variant: inc.severity === 5 ? "error" : "warning",
          });
        }
      }
    };

    // Run one immediately so the UI comes alive without waiting a full tick.
    runTick();
    const interval = setInterval(runTick, TICK_MS);
    return () => clearInterval(interval);
  }, [running]);

  return null;
}
