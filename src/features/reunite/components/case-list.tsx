"use client";

import { motion, AnimatePresence } from "framer-motion";
import { HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useReuniteStore } from "@/stores/reunite-store";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ReuniteStatus } from "@/lib/schemas/domain";

const STATUS_VARIANT: Record<
  ReuniteStatus,
  "busy" | "primary" | "accent" | "calm" | "default"
> = {
  reported: "busy",
  searching: "busy",
  "candidate-found": "primary",
  verifying: "accent",
  reunited: "calm",
  archived: "default",
};

export function CaseList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const cases = useReuniteStore((s) => s.cases);

  if (cases.length === 0) {
    return (
      <EmptyState
        icon={HeartHandshake}
        title="No active cases"
        description="Reported lost children appear here. Trigger the 'Lost child' scenario or file a report."
      />
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {cases.map((c) => (
          <motion.button
            key={c.id}
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onSelect(c.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border bg-background/40 px-3 py-2.5 text-left transition-colors",
              selectedId === c.id
                ? "border-primary/40 ring-1 ring-primary/20"
                : "border-border hover:bg-muted/40",
            )}
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/30 to-primary/30 text-sm font-semibold">
              {c.childName[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.childName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {ZONE_MAP[c.descriptor.lastSeenZoneId]?.name} ·{" "}
                {formatRelativeTime(c.createdAt)}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[c.status]} className="capitalize">
              {c.status.replace("-", " ")}
            </Badge>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
