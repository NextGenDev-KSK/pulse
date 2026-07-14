"use client";

import * as React from "react";
import {
  ScanEye,
  BrainCircuit,
  Radio,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AGENT_META } from "@/lib/constants";
import { useDecisionStore } from "@/stores/decision-store";
import { useAiStore } from "@/stores/ai-store";
import type { Agent } from "@/lib/schemas/domain";

const ICONS: Record<Agent, LucideIcon> = {
  sentinel: ScanEye,
  strategist: BrainCircuit,
  marshal: Radio,
  guardian: HeartHandshake,
};

export function AgentStatusBar() {
  const decisions = useDecisionStore((s) => s.decisions);
  const forecasting = useAiStore((s) => s.forecasting);
  const triagingIds = useAiStore((s) => s.triagingIds);

  const stats = React.useMemo(() => {
    const map: Record<Agent, { count: number; last: number | null }> = {
      sentinel: { count: 0, last: null },
      strategist: { count: 0, last: null },
      marshal: { count: 0, last: null },
      guardian: { count: 0, last: null },
    };
    for (const d of decisions) {
      map[d.agent].count += 1;
      if (map[d.agent].last === null) map[d.agent].last = d.t;
    }
    return map;
  }, [decisions]);

  const active: Record<Agent, boolean> = {
    sentinel: forecasting,
    strategist: triagingIds.length > 0,
    marshal: false,
    guardian: false,
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {(Object.keys(AGENT_META) as Agent[]).map((agent) => {
        const meta = AGENT_META[agent];
        const Icon = ICONS[agent];
        const isActive = active[agent];
        return (
          <Card key={agent} className="flex items-center gap-3 p-4">
            <span
              className={cn(
                "relative inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-[hsl(var(--primary))]",
              )}
            >
              <Icon className="size-5" />
              {isActive && (
                <span className="absolute -right-0.5 -top-0.5 flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--calm))] opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-[hsl(var(--calm))]" />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">{meta.name}</p>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {meta.role}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {stats[agent].count} decisions
                {stats[agent].last
                  ? ` · ${formatRelativeTime(stats[agent].last)}`
                  : ""}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
