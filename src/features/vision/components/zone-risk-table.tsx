"use client";

import * as React from "react";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { LayoutGrid, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSimulationStore, selectTelemetryList } from "@/stores/simulation-store";
import { useUiStore } from "@/stores/ui-store";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { RISK_META } from "@/lib/constants";
import { densityColor } from "@/lib/stadium/heatmap";
import { cn, formatNumber } from "@/lib/utils";
import type { RiskLevel } from "@/lib/schemas/domain";

const RISK_VARIANT: Record<RiskLevel, "calm" | "busy" | "crowded" | "critical"> = {
  calm: "calm",
  busy: "busy",
  crowded: "crowded",
  critical: "critical",
};

export function ZoneRiskTable() {
  const telemetry = useSimulationStore(useShallow(selectTelemetryList));
  const setSelectedZone = useUiStore((s) => s.setSelectedZone);
  const selectedZoneId = useUiStore((s) => s.selectedZoneId);

  const sorted = React.useMemo(
    () =>
      [...telemetry]
        .filter((t) => ZONE_MAP[t.zoneId]?.kind !== "pitch")
        .sort((a, b) => b.density - a.density),
    [telemetry],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="size-4 text-[hsl(var(--primary))]" />
          Zone Risk Board
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-2 font-medium">Zone</th>
                <th className="px-3 py-2 font-medium">Density</th>
                <th className="px-3 py-2 font-medium">Risk</th>
                <th className="px-3 py-2 font-medium">Trend</th>
                <th className="px-3 py-2 text-right font-medium">Occupancy</th>
                <th className="px-5 py-2 text-right font-medium">Queue</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => {
                const zone = ZONE_MAP[t.zoneId];
                const color = densityColor(t.density);
                const TrendIcon =
                  t.trend === "rising"
                    ? TrendingUp
                    : t.trend === "falling"
                      ? TrendingDown
                      : Minus;
                const isSelected = selectedZoneId === t.zoneId;
                return (
                  <tr
                    key={t.zoneId}
                    onClick={() => setSelectedZone(t.zoneId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedZone(t.zoneId);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={`Inspect ${zone?.name ?? t.zoneId}, ${Math.round(
                      t.density,
                    )} percent density, ${t.risk}`}
                    className={cn(
                      "cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                      isSelected && "bg-primary/[0.05]",
                    )}
                  >
                    <td className="px-5 py-2.5 font-medium">{zone?.name}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <motion.span
                            className="block h-full rounded-full"
                            initial={false}
                            animate={{ width: `${Math.min(100, t.density)}%` }}
                            transition={{ duration: 0.5 }}
                            style={{ background: color }}
                          />
                        </span>
                        <span className="font-mono text-xs tabular-nums">
                          {Math.round(t.density)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={RISK_VARIANT[t.risk]}>
                        {RISK_META[t.risk].label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <TrendIcon
                        className={cn(
                          "size-4",
                          t.trend === "rising"
                            ? "text-[hsl(var(--critical))]"
                            : t.trend === "falling"
                              ? "text-[hsl(var(--calm))]"
                              : "text-muted-foreground",
                        )}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">
                      {formatNumber(t.occupancy)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono text-xs tabular-nums">
                      {t.queueLength || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
