"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BrainCircuit,
  ChevronDown,
  Loader2,
  ShieldCheck,
  ListChecks,
  Radio,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SeverityDot } from "@/components/shared/severity-dot";
import { EngineBadge } from "@/components/shared/engine-badge";
import { ReasoningChain } from "@/components/shared/reasoning-chain";
import { useIncidentStore } from "@/stores/incident-store";
import { useDispatchStore } from "@/stores/dispatch-store";
import { useAiStore } from "@/stores/ai-store";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { INCIDENT_META, SKILL_META } from "@/lib/constants";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Incident } from "@/lib/schemas/domain";

export function DecisionQueue() {
  const incidents = useIncidentStore((s) => s.incidents);

  const ordered = React.useMemo(() => {
    return incidents
      .filter((i) => i.status !== "resolved")
      .sort((a, b) => {
        const sa = a.triage?.severity ?? a.severity;
        const sb = b.triage?.severity ?? b.severity;
        if (sb !== sa) return sb - sa;
        return a.createdAt - b.createdAt;
      });
  }, [incidents]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-[hsl(var(--primary))]" />
          Decision Queue
        </CardTitle>
        <Badge variant="outline">{ordered.length} active</Badge>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 overflow-y-auto">
        {ordered.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Nothing to decide"
            description="Strategist has no active incidents. New incidents are triaged automatically as they arrive."
          />
        ) : (
          <AnimatePresence initial={false}>
            {ordered.map((incident, i) => (
              <IncidentDecisionCard
                key={incident.id}
                incident={incident}
                rank={i + 1}
              />
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}

function IncidentDecisionCard({
  incident,
  rank,
}: {
  incident: Incident;
  rank: number;
}) {
  const [open, setOpen] = React.useState(rank === 1);
  const triagingIds = useAiStore((s) => s.triagingIds);
  const dispatches = useDispatchStore((s) => s.dispatches);
  const dispatch = dispatches.find((d) => d.incidentId === incident.id);
  const isTriaging = triagingIds.includes(incident.id);
  const meta = INCIDENT_META[incident.type];
  const zone = ZONE_MAP[incident.zoneId];
  const triage = incident.triage;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="overflow-hidden rounded-lg border border-border bg-background/40"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-semibold">
          {rank}
        </span>
        <SeverityDot severity={triage?.severity ?? incident.severity} pulse />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{incident.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {meta.label} · {zone?.name} · {formatRelativeTime(incident.createdAt)}
          </p>
        </div>
        {isTriaging ? (
          <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--primary))]">
            <Loader2 className="size-3.5 animate-spin" /> Reasoning
          </span>
        ) : triage ? (
          <EngineBadge engine={triage.engine} />
        ) : null}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-border/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {incident.description}
              </p>

              {triage ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary">
                      Priority #{triage.priorityRank}
                    </Badge>
                    <Badge variant="outline">
                      {Math.round(triage.confidence * 100)}% confidence
                    </Badge>
                    <Badge
                      variant="accent"
                      className="capitalize"
                      style={{
                        color:
                          SKILL_META[
                            triage.requiredSkill === "any"
                              ? "guest-services"
                              : triage.requiredSkill
                          ]?.color,
                      }}
                    >
                      {triage.requiredSkill} responder
                    </Badge>
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <BrainCircuit className="size-3.5" /> Reasoning
                    </p>
                    <ReasoningChain steps={triage.reasoning} compact />
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <ListChecks className="size-3.5" /> Recommended actions
                    </p>
                    <ul className="space-y-1.5">
                      {triage.recommendedActions.map((a) => (
                        <li
                          key={a}
                          className="flex items-start gap-2 text-xs text-surface-foreground"
                        >
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[hsl(var(--primary))]" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {dispatch && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2 text-xs">
                      <Radio className="size-3.5 text-[hsl(var(--primary))]" />
                      <span className="capitalize text-muted-foreground">
                        {dispatch.stewardName} · {dispatch.status.replace("-", " ")}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Awaiting Strategist triage…
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
