"use client";

import { Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useSimulationStore,
  stewardCountByStatus,
} from "@/stores/simulation-store";
import type { StewardStatus } from "@/lib/schemas/domain";

const STATUS_META: Record<StewardStatus, { label: string; color: string }> = {
  available: { label: "Available", color: "hsl(var(--calm))" },
  "en-route": { label: "En route", color: "hsl(var(--busy))" },
  "on-scene": { label: "On scene", color: "hsl(var(--primary))" },
  break: { label: "On break", color: "hsl(var(--muted-foreground))" },
};

export function StewardStatusCard() {
  const stewards = useSimulationStore((s) => s.stewards);
  const counts = stewardCountByStatus(stewards);
  const total = stewards.length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-[hsl(var(--primary))]" />
          Steward Deployment
        </CardTitle>
        <span className="text-xs text-muted-foreground">{total} on shift</span>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stacked bar */}
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          {(Object.keys(STATUS_META) as StewardStatus[]).map((status) => {
            const pct = total ? (counts[status] / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={status}
                className="h-full transition-all duration-500"
                style={{ width: `${pct}%`, background: STATUS_META[status].color }}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(STATUS_META) as StewardStatus[]).map((status) => (
            <div key={status} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ background: STATUS_META[status].color }}
              />
              <span className="text-xs text-muted-foreground">
                {STATUS_META[status].label}
              </span>
              <span className="ml-auto font-mono text-xs font-semibold tabular-nums">
                {counts[status]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
