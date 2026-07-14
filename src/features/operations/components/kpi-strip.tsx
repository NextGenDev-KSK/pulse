"use client";

import { useShallow } from "zustand/react/shallow";
import { Users, Gauge, Siren, Radio, ShieldCheck } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { useSimulationStore } from "@/stores/simulation-store";
import { useIncidentStore, selectOpenIncidents } from "@/stores/incident-store";
import {
  useDispatchStore,
  selectActiveDispatches,
} from "@/stores/dispatch-store";
import { formatNumber } from "@/lib/utils";

export function KpiStrip() {
  const snapshot = useSimulationStore((s) => s.snapshot);
  const openIncidents = useIncidentStore(useShallow(selectOpenIncidents));
  const dispatches = useDispatchStore((s) => s.dispatches);
  const activeDispatches = useDispatchStore(useShallow(selectActiveDispatches));

  const resolved = dispatches.filter((d) => d.status === "resolved");
  const breached = dispatches.filter((d) => d.slaBreached).length;
  const slaHealth =
    dispatches.length === 0
      ? 100
      : Math.round(((dispatches.length - breached) / dispatches.length) * 100);

  const occupancyPct = Math.round(
    (snapshot.attendance / snapshot.capacity) * 100,
  );

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard
        index={0}
        label="In venue"
        value={formatNumber(snapshot.attendance)}
        unit={`${occupancyPct}% cap`}
        icon={Users}
        trend="up"
        delta="Live"
      />
      <StatCard
        index={1}
        label="Avg density"
        value={Math.round(snapshot.avgDensity)}
        unit="%"
        icon={Gauge}
        accent="hsl(var(--accent))"
        trend={snapshot.avgDensity > 60 ? "up" : "flat"}
        delta={snapshot.avgDensity > 60 ? "Elevated" : "Stable"}
      />
      <StatCard
        index={2}
        label="Open incidents"
        value={openIncidents.length}
        icon={Siren}
        accent="hsl(var(--critical))"
        trend={openIncidents.length > 0 ? "up" : "flat"}
        delta={openIncidents.length > 0 ? "Active" : "All clear"}
      />
      <StatCard
        index={3}
        label="Active dispatches"
        value={activeDispatches.length}
        icon={Radio}
        accent="hsl(var(--primary))"
        delta={`${resolved.length} resolved`}
        trend="flat"
      />
      <StatCard
        index={4}
        label="SLA health"
        value={slaHealth}
        unit="%"
        icon={ShieldCheck}
        accent={slaHealth >= 90 ? "hsl(var(--calm))" : "hsl(var(--busy))"}
        trend={slaHealth >= 90 ? "flat" : "down"}
        delta={breached ? `${breached} breached` : "On target"}
      />
    </div>
  );
}
