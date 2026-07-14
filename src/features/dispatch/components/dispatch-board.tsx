"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Radio, Inbox } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SeverityDot } from "@/components/shared/severity-dot";
import { Avatar } from "@/components/ui/avatar";
import { SlaTimer } from "./sla-timer";
import { useDispatchStore } from "@/stores/dispatch-store";
import { useIncidentStore } from "@/stores/incident-store";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { cn } from "@/lib/utils";
import type { DispatchStatus } from "@/lib/schemas/domain";

const STAGES: DispatchStatus[] = [
  "assigned",
  "en-route",
  "on-scene",
  "resolved",
];
const STAGE_LABEL: Record<string, string> = {
  assigned: "Assigned",
  "en-route": "En route",
  "on-scene": "On scene",
  resolved: "Resolved",
};

export function DispatchBoard() {
  const dispatches = useDispatchStore((s) => s.dispatches);
  const incidents = useIncidentStore((s) => s.incidents);

  const active = dispatches.filter(
    (d) => d.status !== "resolved" && d.status !== "cancelled",
  );
  const recent = dispatches.slice(0, 8);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Radio className="size-4 text-[hsl(var(--primary))]" />
          Dispatch Board
        </CardTitle>
        <Badge variant="outline">{active.length} active</Badge>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 overflow-y-auto">
        {recent.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No dispatches yet"
            description="When Strategist triages an incident, Marshal assigns the nearest responder here."
          />
        ) : (
          <AnimatePresence initial={false}>
            {recent.map((dispatch) => {
              const incident = incidents.find(
                (i) => i.id === dispatch.incidentId,
              );
              const zoneName =
                (incident && ZONE_MAP[incident.zoneId]?.name) ?? "—";
              const currentStageIndex = STAGES.indexOf(dispatch.status);
              return (
                <motion.div
                  key={dispatch.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-border bg-background/40 p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={dispatch.stewardName} className="size-9" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {dispatch.stewardName}
                        </p>
                        {incident && (
                          <SeverityDot
                            severity={incident.triage?.severity ?? incident.severity}
                          />
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {incident?.title ?? "Incident"} · {zoneName}
                      </p>
                    </div>
                    <SlaTimer dispatch={dispatch} />
                  </div>

                  {/* Lifecycle stepper */}
                  <div className="mt-3 flex items-center gap-1">
                    {STAGES.map((stage, i) => {
                      const done = i <= currentStageIndex;
                      return (
                        <div key={stage} className="flex flex-1 items-center gap-1">
                          <div className="flex flex-1 flex-col items-center gap-1">
                            <span
                              className={cn(
                                "h-1.5 w-full rounded-full transition-colors",
                                done ? "bg-[hsl(var(--primary))]" : "bg-muted",
                              )}
                            />
                            <span
                              className={cn(
                                "text-[9px]",
                                done
                                  ? "text-surface-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {STAGE_LABEL[stage]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {dispatch.rationale &&
                    !dispatch.rationale.startsWith("Assigning") && (
                      <p className="mt-2 border-t border-border/60 pt-2 text-[11px] italic text-muted-foreground">
                        “{dispatch.rationale}”
                      </p>
                    )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
