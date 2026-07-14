"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Goal,
  Square,
  Flag,
  Coffee,
  Megaphone,
  Repeat,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { useSimulationStore } from "@/stores/simulation-store";
import type { MatchEvent, MatchEventType } from "@/lib/schemas/domain";

const ICON: Record<MatchEventType, LucideIcon> = {
  kickoff: CircleDot,
  goal: Goal,
  card: Square,
  halftime: Coffee,
  "second-half": CircleDot,
  fulltime: Flag,
  announcement: Megaphone,
  substitution: Repeat,
};

const COLOR: Record<MatchEventType, string> = {
  kickoff: "hsl(var(--primary))",
  goal: "hsl(var(--calm))",
  card: "hsl(var(--busy))",
  halftime: "hsl(var(--accent))",
  "second-half": "hsl(var(--primary))",
  fulltime: "hsl(var(--muted-foreground))",
  announcement: "hsl(var(--accent))",
  substitution: "hsl(var(--muted-foreground))",
};

export function MatchTimeline() {
  const matchEvents = useSimulationStore((s) => s.matchEvents);
  const ordered = React.useMemo(
    () => [...matchEvents].reverse(),
    [matchEvents],
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="size-4 text-[hsl(var(--primary))]" />
          Match Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {ordered.length === 0 ? (
          <EmptyState
            icon={CircleDot}
            title="Kick-off pending"
            description="Match events will stream here once the simulation begins."
          />
        ) : (
          <ol className="relative space-y-4 pl-1">
            <AnimatePresence initial={false}>
              {ordered.map((event) => (
                <TimelineRow key={event.id} event={event} />
              ))}
            </AnimatePresence>
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineRow({ event }: { event: MatchEvent }) {
  const Icon = ICON[event.type];
  const color = COLOR[event.type];
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-3"
    >
      <span
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: `color-mix(in oklab, ${color} 16%, transparent)`, color }}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {event.minute}&apos;
          </span>
          <p className="truncate text-sm font-medium capitalize">
            {event.type.replace("-", " ")}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {event.description}
        </p>
      </div>
    </motion.li>
  );
}
