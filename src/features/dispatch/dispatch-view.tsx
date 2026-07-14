"use client";

import { Radio, Timer, CheckCircle2, Activity } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DispatchBoard } from "./components/dispatch-board";
import { StewardBoard } from "./components/steward-board";
import { StadiumMap } from "@/features/vision/components/stadium-map";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDispatchStore } from "@/stores/dispatch-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { formatDuration } from "@/lib/utils";

export function DispatchView() {
  const dispatches = useDispatchStore((s) => s.dispatches);
  const stewards = useSimulationStore((s) => s.stewards);

  const active = dispatches.filter(
    (d) => d.status !== "resolved" && d.status !== "cancelled",
  );
  const resolved = dispatches.filter((d) => d.status === "resolved");
  const available = stewards.filter((s) => s.status === "available").length;

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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pulse Dispatch"
        description="Marshal assigns the nearest qualified responder and tracks every task to resolution."
        icon={Radio}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          index={0}
          label="Active dispatches"
          value={active.length}
          icon={Radio}
          accent="hsl(var(--primary))"
        />
        <StatCard
          index={1}
          label="Available stewards"
          value={available}
          icon={Activity}
          accent="hsl(var(--calm))"
        />
        <StatCard
          index={2}
          label="Resolved"
          value={resolved.length}
          icon={CheckCircle2}
          accent="hsl(var(--calm))"
        />
        <StatCard
          index={3}
          label="Avg response"
          value={avgResponse ? formatDuration(avgResponse) : "—"}
          icon={Timer}
          accent="hsl(var(--accent))"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DispatchBoard />
        </div>
        <StewardBoard />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="size-4 text-[hsl(var(--primary))]" />
            Responder Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StadiumMap
            className="aspect-[16/9]"
            showLabels
            interactive={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
