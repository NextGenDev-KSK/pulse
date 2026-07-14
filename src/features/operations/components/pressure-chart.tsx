"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useSimulationStore } from "@/stores/simulation-store";

export function PressureChart() {
  const pressureHistory = useSimulationStore((s) => s.pressureHistory);
  const densityHistory = useSimulationStore((s) => s.densityHistory);

  const data = React.useMemo(() => {
    // Average density across zones per historical index, aligned to pressure.
    const zones = Object.values(densityHistory);
    const len = pressureHistory.length;
    return pressureHistory.map((pressure, i) => {
      let sum = 0;
      let count = 0;
      for (const series of zones) {
        const offset = series.length - len + i;
        if (offset >= 0 && offset < series.length) {
          sum += series[offset];
          count += 1;
        }
      }
      return {
        i,
        pressure: Math.round(pressure),
        density: count ? Math.round(sum / count) : 0,
      };
    });
  }, [pressureHistory, densityHistory]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4 text-[hsl(var(--primary))]" />
          Stadium Pressure & Density
        </CardTitle>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <LegendDot color="hsl(var(--primary))" label="Pressure" />
          <LegendDot color="hsl(var(--accent))" label="Avg density" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-pressure" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(189 94% 55%)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(189 94% 55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-density" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(258 90% 66%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(258 90% 66%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis dataKey="i" hide />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="pressure"
                stroke="hsl(189 94% 55%)"
                strokeWidth={2}
                fill="url(#grad-pressure)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="density"
                stroke="hsl(258 90% 66%)"
                strokeWidth={2}
                fill="url(#grad-density)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
}

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs shadow-xl">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 capitalize">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}
