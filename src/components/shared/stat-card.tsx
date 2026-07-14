"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  delta,
  accent,
  index = 0,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "flat";
  delta?: string;
  accent?: string;
  index?: number;
}) {
  const TrendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor =
    trend === "up"
      ? "text-[hsl(var(--calm))]"
      : trend === "down"
        ? "text-[hsl(var(--critical))]"
        : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Card className="relative overflow-hidden p-4">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {Icon && (
            <span
              className="inline-flex size-8 items-center justify-center rounded-lg"
              style={{
                background: accent
                  ? `color-mix(in oklab, ${accent} 16%, transparent)`
                  : "color-mix(in oklab, hsl(var(--primary)) 16%, transparent)",
                color: accent ?? "hsl(var(--primary))",
              }}
            >
              <Icon className="size-4" />
            </span>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-mono text-2xl font-semibold tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="text-xs text-muted-foreground">{unit}</span>
          )}
        </div>
        {(delta || trend) && (
          <div className={cn("mt-1.5 flex items-center gap-1 text-xs", trendColor)}>
            <TrendIcon className="size-3.5" />
            {delta && <span>{delta}</span>}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
