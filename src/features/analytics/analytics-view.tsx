"use client";

import * as React from "react";
import {
  BarChart3,
  Download,
  Siren,
  Timer,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Gauge,
  Radio,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { BarPanel, type BarDatum } from "./components/bar-panel";
import { PressureChart } from "@/features/operations/components/pressure-chart";
import { useIncidentStore } from "@/stores/incident-store";
import { useDispatchStore } from "@/stores/dispatch-store";
import { useDecisionStore } from "@/stores/decision-store";
import { useReuniteStore } from "@/stores/reunite-store";
import { INCIDENT_META, AGENT_META } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";
import { exportCsv, exportJson, timestampedName } from "@/lib/export";
import type { Agent, IncidentType } from "@/lib/schemas/domain";

const SEVERITY_COLORS: Record<number, string> = {
  1: "hsl(var(--calm))",
  2: "hsl(var(--busy))",
  3: "hsl(var(--busy))",
  4: "hsl(var(--crowded))",
  5: "hsl(var(--critical))",
};

export function AnalyticsView() {
  const incidents = useIncidentStore((s) => s.incidents);
  const dispatches = useDispatchStore((s) => s.dispatches);
  const decisions = useDecisionStore((s) => s.decisions);
  const cases = useReuniteStore((s) => s.cases);

  const resolved = dispatches.filter((d) => d.status === "resolved");
  const responseTimes = resolved
    .map((d) => {
      const onScene = d.statusTimestamps["on-scene"];
      return onScene ? (onScene - d.createdAt) / 1000 : null;
    })
    .filter((n): n is number => n !== null);
  const avgResponse =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
  const breached = dispatches.filter((d) => d.slaBreached).length;
  const slaCompliance =
    dispatches.length > 0
      ? Math.round(((dispatches.length - breached) / dispatches.length) * 100)
      : 100;
  const reunions = cases.filter((c) => c.status === "reunited").length;
  const geminiShare =
    decisions.length > 0
      ? Math.round(
          (decisions.filter((d) => d.engine === "gemini").length /
            decisions.length) *
            100,
        )
      : 0;

  const byType: BarDatum[] = React.useMemo(() => {
    const counts = new Map<IncidentType, number>();
    for (const i of incidents)
      counts.set(i.type, (counts.get(i.type) ?? 0) + 1);
    return (Object.keys(INCIDENT_META) as IncidentType[])
      .map((t) => ({
        label: INCIDENT_META[t].label.split(" ")[0],
        value: counts.get(t) ?? 0,
        color: "hsl(var(--primary))",
      }))
      .filter((d) => d.value > 0);
  }, [incidents]);

  const bySeverity: BarDatum[] = React.useMemo(() => {
    const counts = new Map<number, number>();
    for (const i of incidents) {
      const sev = i.triage?.severity ?? i.severity;
      counts.set(sev, (counts.get(sev) ?? 0) + 1);
    }
    return [1, 2, 3, 4, 5].map((s) => ({
      label: `S${s}`,
      value: counts.get(s) ?? 0,
      color: SEVERITY_COLORS[s],
    }));
  }, [incidents]);

  const responseDist: BarDatum[] = React.useMemo(() => {
    const buckets = [
      { label: "<30s", min: 0, max: 30 },
      { label: "30-60s", min: 30, max: 60 },
      { label: "1-2m", min: 60, max: 120 },
      { label: "2m+", min: 120, max: Infinity },
    ];
    return buckets.map((b) => ({
      label: b.label,
      value: responseTimes.filter((t) => t >= b.min && t < b.max).length,
      color: "hsl(var(--accent))",
    }));
  }, [responseTimes]);

  const byAgent: BarDatum[] = React.useMemo(() => {
    const counts = new Map<Agent, number>();
    for (const d of decisions)
      counts.set(d.agent, (counts.get(d.agent) ?? 0) + 1);
    return (Object.keys(AGENT_META) as Agent[]).map((a) => ({
      label: AGENT_META[a].name,
      value: counts.get(a) ?? 0,
      color: "hsl(var(--primary))",
    }));
  }, [decisions]);

  const exportReport = (format: "csv" | "json") => {
    if (format === "csv") {
      exportCsv(
        timestampedName("pulse-incidents", "csv"),
        incidents.map((i) => ({
          id: i.id,
          type: i.type,
          zone: i.zoneId,
          severity: i.triage?.severity ?? i.severity,
          status: i.status,
          title: i.title,
          createdAt: new Date(i.createdAt).toISOString(),
          resolvedAt: i.resolvedAt ? new Date(i.resolvedAt).toISOString() : "",
          requiredSkill: i.triage?.requiredSkill ?? "",
          engine: i.triage?.engine ?? "",
        })),
      );
    } else {
      exportJson(timestampedName("pulse-report", "json"), {
        generatedAt: new Date().toISOString(),
        summary: {
          incidents: incidents.length,
          resolved: resolved.length,
          slaCompliance,
          avgResponseSeconds: Math.round(avgResponse),
          reunions,
          aiDecisions: decisions.length,
          geminiShare,
        },
        incidents,
        dispatches,
        decisions,
        cases,
      });
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Analytics"
        description="Post-match performance, response metrics and an AI decision audit."
        icon={BarChart3}
        actions={
          <Dropdown
            trigger={
              <Button variant="secondary" size="sm">
                <Download /> Export report
              </Button>
            }
          >
            {(close) => (
              <>
                <DropdownItem onClick={() => { exportReport("csv"); close(); }}>
                  Incidents (CSV)
                </DropdownItem>
                <DropdownItem onClick={() => { exportReport("json"); close(); }}>
                  Full report (JSON)
                </DropdownItem>
              </>
            )}
          </Dropdown>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Total incidents" value={incidents.length} icon={Siren} accent="hsl(var(--critical))" />
        <StatCard index={1} label="Avg response" value={avgResponse ? formatDuration(avgResponse) : "—"} icon={Timer} accent="hsl(var(--accent))" />
        <StatCard index={2} label="SLA compliance" value={slaCompliance} unit="%" icon={ShieldCheck} accent="hsl(var(--calm))" />
        <StatCard index={3} label="Children reunited" value={reunions} icon={HeartHandshake} accent="hsl(var(--busy))" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="AI decisions" value={decisions.length} icon={Sparkles} accent="hsl(var(--primary))" />
        <StatCard index={1} label="Gemini share" value={geminiShare} unit="%" icon={Sparkles} accent="hsl(var(--primary))" />
        <StatCard index={2} label="Dispatches" value={dispatches.length} icon={Radio} accent="hsl(var(--primary))" />
        <StatCard index={3} label="Resolved" value={resolved.length} icon={Gauge} accent="hsl(var(--calm))" />
      </div>

      <PressureChart />

      <div className="grid gap-4 md:grid-cols-2">
        <BarPanel title="Incidents by Type" icon={Siren} data={byType} emptyHint="Incidents are grouped by type once they occur." />
        <BarPanel title="Incidents by Severity" icon={ShieldCheck} data={bySeverity} emptyHint="Severity is assigned by Strategist triage." />
        <BarPanel title="Response Time Distribution" icon={Timer} data={responseDist} emptyHint="Response times appear as dispatches resolve." />
        <BarPanel title="AI Decisions by Agent" icon={Sparkles} data={byAgent} emptyHint="Every agent decision is counted here." />
      </div>
    </div>
  );
}
