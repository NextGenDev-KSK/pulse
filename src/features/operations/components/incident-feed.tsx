"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Siren, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SeverityDot } from "@/components/shared/severity-dot";
import { useIncidentStore } from "@/stores/incident-store";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { INCIDENT_META } from "@/lib/constants";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { IncidentStatus } from "@/lib/schemas/domain";

const STATUS_VARIANT: Record<
  IncidentStatus,
  "critical" | "busy" | "primary" | "calm"
> = {
  open: "critical",
  triaged: "busy",
  dispatched: "primary",
  resolved: "calm",
};

export function IncidentFeed({ limit = 6 }: { limit?: number }) {
  const incidents = useIncidentStore((s) => s.incidents);
  const shown = incidents.slice(0, limit);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Siren className="size-4 text-[hsl(var(--critical))]" />
          Live Incident Feed
        </CardTitle>
        <Badge variant="outline">{incidents.length}</Badge>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {shown.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="All clear"
            description="No incidents reported. Live incidents will appear here as they occur."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            <AnimatePresence initial={false}>
              {shown.map((incident) => {
                const meta = INCIDENT_META[incident.type];
                const zone = ZONE_MAP[incident.zoneId];
                return (
                  <motion.li
                    key={incident.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3 px-5 py-3"
                  >
                    <SeverityDot severity={incident.severity} pulse />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {incident.title}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {meta.label} · {zone?.name ?? incident.zoneId} ·{" "}
                        {formatRelativeTime(incident.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={STATUS_VARIANT[incident.status]}
                      className={cn("capitalize")}
                    >
                      {incident.status}
                    </Badge>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
