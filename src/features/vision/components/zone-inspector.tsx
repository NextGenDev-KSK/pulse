"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge,
  Users,
  ArrowDownUp,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  MousePointerClick,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Sparkline } from "@/components/shared/sparkline";
import { EngineBadge } from "@/components/shared/engine-badge";
import { useSimulationStore } from "@/stores/simulation-store";
import { useUiStore } from "@/stores/ui-store";
import { useAiStore } from "@/stores/ai-store";
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

export function ZoneInspector() {
  const selectedZoneId = useUiStore((s) => s.selectedZoneId);
  const telemetry = useSimulationStore((s) =>
    selectedZoneId ? s.telemetry[selectedZoneId] : null,
  );
  const history = useSimulationStore((s) =>
    selectedZoneId ? s.densityHistory[selectedZoneId] : null,
  );
  const forecast = useAiStore((s) =>
    selectedZoneId
      ? s.latestForecast?.zones.find((z) => z.zoneId === selectedZoneId)
      : null,
  );
  const forecastEngine = useAiStore((s) => s.latestForecast?.engine);
  const zone = selectedZoneId ? ZONE_MAP[selectedZoneId] : null;

  if (!zone || !telemetry) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full items-center pt-6">
          <EmptyState
            icon={MousePointerClick}
            title="Select a zone"
            description="Click any zone on the stadium heatmap to inspect its live crowd telemetry and trend."
          />
        </CardContent>
      </Card>
    );
  }

  const TrendIcon =
    telemetry.trend === "rising"
      ? TrendingUp
      : telemetry.trend === "falling"
        ? TrendingDown
        : Minus;
  const color = densityColor(telemetry.density);

  return (
    <Card className="h-full">
      <CardContent className="space-y-4 pt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{zone.name}</h3>
                <p className="text-xs capitalize text-muted-foreground">
                  {zone.kind} · capacity {formatNumber(zone.capacity)}
                </p>
              </div>
              <Badge variant={RISK_VARIANT[telemetry.risk]}>
                {RISK_META[telemetry.risk].label}
              </Badge>
            </div>

            {/* Big density readout */}
            <div className="rounded-lg border border-border bg-background/40 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Current density</p>
                  <p
                    className="font-mono text-4xl font-semibold tabular-nums"
                    style={{ color }}
                  >
                    {Math.round(telemetry.density)}%
                  </p>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    telemetry.trend === "rising"
                      ? "text-[hsl(var(--critical))]"
                      : telemetry.trend === "falling"
                        ? "text-[hsl(var(--calm))]"
                        : "text-muted-foreground",
                  )}
                >
                  <TrendIcon className="size-4" />
                  <span className="capitalize">{telemetry.trend}</span>
                </div>
              </div>
              <div className="mt-3">
                <Sparkline
                  data={history ?? []}
                  width={300}
                  height={40}
                  color={color}
                />
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3">
              <Metric
                icon={Users}
                label="Occupancy"
                value={formatNumber(telemetry.occupancy)}
              />
              <Metric
                icon={Gauge}
                label="Of capacity"
                value={`${Math.round((telemetry.occupancy / zone.capacity) * 100)}%`}
              />
              <Metric
                icon={ArrowDownUp}
                label="Net flow"
                value={`${telemetry.inflow - telemetry.outflow > 0 ? "+" : ""}${Math.round(
                  telemetry.inflow - telemetry.outflow,
                )}/tick`}
              />
              <Metric
                icon={Clock}
                label="Queue"
                value={
                  telemetry.queueLength
                    ? `${telemetry.queueLength} waiting`
                    : "None"
                }
              />
            </div>

            {/* Sentinel forecast */}
            {forecast && (
              <div className="rounded-lg border border-primary/25 bg-primary/[0.05] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--primary))]">
                    <TrendingUp className="size-3.5" /> 15-min forecast
                  </p>
                  {forecastEngine && <EngineBadge engine={forecastEngine} />}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-semibold tabular-nums">
                    {Math.round(forecast.predictedDensity)}%
                  </span>
                  <Badge variant={RISK_VARIANT[forecast.predictedRisk]}>
                    {RISK_META[forecast.predictedRisk].label}
                  </Badge>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {Math.round(forecast.confidence * 100)}% conf.
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {forecast.reasoning}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" />
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
