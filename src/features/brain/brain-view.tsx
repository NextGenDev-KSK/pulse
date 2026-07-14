"use client";

import { BrainCircuit } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AgentStatusBar } from "./components/agent-status-bar";
import { DecisionQueue } from "./components/decision-queue";
import { ProactiveAlerts } from "./components/proactive-alerts";
import { ScenarioDirector } from "@/features/simulation/scenario-director";

export function BrainView() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Pulse Brain"
        description="The decision engine — Strategist triages and reasons; Sentinel forecasts ahead."
        icon={BrainCircuit}
      />

      <AgentStatusBar />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DecisionQueue />
        </div>
        <ProactiveAlerts />
      </div>

      <ScenarioDirector />
    </div>
  );
}
