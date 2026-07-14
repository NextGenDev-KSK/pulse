"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Radar, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { EngineBadge } from "@/components/shared/engine-badge";
import { SeverityDot } from "@/components/shared/severity-dot";
import { useAiStore } from "@/stores/ai-store";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { formatRelativeTime } from "@/lib/utils";

export function ProactiveAlerts() {
  const forecast = useAiStore((s) => s.latestForecast);
  const forecastAt = useAiStore((s) => s.forecastAt);
  const alerts = forecast?.proactiveAlerts ?? [];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Radar className="size-4 text-[hsl(var(--primary))]" />
          Pre-emptive Alerts
        </CardTitle>
        {forecast && <EngineBadge engine={forecast.engine} />}
      </CardHeader>
      <CardContent className="flex-1">
        {alerts.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No crowding forecast"
            description="Sentinel is not projecting any zone to reach critical density in the next 15 minutes."
          />
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {alerts.map((alert, i) => (
                <motion.div
                  key={`${alert.zoneId}-${i}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-border bg-background/40 p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <SeverityDot severity={alert.severity} pulse />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {ZONE_MAP[alert.zoneId]?.name ?? alert.zoneId}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {alert.message}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {alert.recommendedActions.map((a) => (
                          <li
                            key={a}
                            className="flex items-start gap-1.5 text-[11px] text-muted-foreground"
                          >
                            <span className="mt-1 size-1 shrink-0 rounded-full bg-[hsl(var(--primary))]" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {forecastAt && (
              <p className="pt-1 text-center text-[10px] text-muted-foreground">
                Updated {formatRelativeTime(forecastAt)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
