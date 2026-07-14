"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useSimulationStore } from "@/stores/simulation-store";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { SKILL_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { StewardStatus } from "@/lib/schemas/domain";

const STATUS_META: Record<
  StewardStatus,
  { label: string; color: string; dot: string }
> = {
  available: { label: "Available", color: "text-[hsl(var(--calm))]", dot: "bg-[hsl(var(--calm))]" },
  "en-route": { label: "En route", color: "text-[hsl(var(--busy))]", dot: "bg-[hsl(var(--busy))]" },
  "on-scene": { label: "On scene", color: "text-[hsl(var(--primary))]", dot: "bg-[hsl(var(--primary))]" },
  break: { label: "Break", color: "text-muted-foreground", dot: "bg-muted-foreground" },
};

const ORDER: StewardStatus[] = ["on-scene", "en-route", "available", "break"];

export function StewardBoard() {
  const stewards = useSimulationStore((s) => s.stewards);

  const sorted = React.useMemo(
    () =>
      [...stewards].sort(
        (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status),
      ),
    [stewards],
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-[hsl(var(--primary))]" />
          Steward Roster
        </CardTitle>
        <Badge variant="outline">{stewards.length}</Badge>
      </CardHeader>
      <CardContent className="flex-1 space-y-1.5 overflow-y-auto">
        {sorted.map((steward) => {
          const meta = STATUS_META[steward.status];
          const zone = ZONE_MAP[steward.zoneId];
          return (
            <motion.div
              key={steward.id}
              layout
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2"
            >
              <Avatar name={steward.name} className="size-8" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{steward.name}</p>
                <div className="flex items-center gap-1.5">
                  {steward.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] capitalize"
                      style={{ color: SKILL_META[skill].color }}
                    >
                      {SKILL_META[skill].label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium",
                    meta.color,
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", meta.dot)} />
                  {meta.label}
                </span>
                <p className="text-[10px] text-muted-foreground">
                  {zone?.name}
                </p>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
