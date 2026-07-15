"use client";

import { Timer, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { useNow } from "@/hooks/use-now";
import type { Dispatch } from "@/lib/schemas/domain";

/** Live SLA countdown / outcome for a dispatch. */
export function SlaTimer({ dispatch }: { dispatch: Dispatch }) {
  const now = useNow(1000);

  const onSceneAt = dispatch.statusTimestamps["on-scene"];
  const isResolved =
    dispatch.status === "resolved" || dispatch.status === "on-scene";

  if (isResolved && onSceneAt) {
    // Judge the SLA against the modelled response time (ETA, in simulated
    // seconds), not the compressed wall-clock demo timing.
    const responseSecs = dispatch.etaSeconds;
    const met = !dispatch.slaBreached && responseSecs <= dispatch.slaSeconds;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
          met
            ? "bg-[hsl(var(--calm))]/15 text-[hsl(var(--calm))]"
            : "bg-[hsl(var(--critical))]/15 text-[hsl(var(--critical))]",
        )}
      >
        {met ? (
          <CheckCircle2 className="size-3" />
        ) : (
          <AlertTriangle className="size-3" />
        )}
        {met ? "SLA met" : "SLA breached"} · {formatDuration(responseSecs)}
      </span>
    );
  }

  const elapsed = (now - dispatch.createdAt) / 1000;
  const remaining = dispatch.slaSeconds - elapsed;
  const frac = Math.max(0, Math.min(1, remaining / dispatch.slaSeconds));
  const color =
    remaining <= 0
      ? "hsl(var(--critical))"
      : frac < 0.33
        ? "hsl(var(--crowded))"
        : frac < 0.66
          ? "hsl(var(--busy))"
          : "hsl(var(--calm))";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums"
      style={{
        background: `color-mix(in oklab, ${color} 15%, transparent)`,
        color,
      }}
    >
      <Timer className="size-3" />
      {remaining <= 0 ? "Overdue" : `${formatDuration(remaining)} left`}
    </span>
  );
}
