"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { BarChart3 } from "lucide-react";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export function BarPanel({
  title,
  icon: Icon = BarChart3,
  data,
  emptyHint,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  data: BarDatum[];
  emptyHint?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-[hsl(var(--primary))]" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {total === 0 ? (
          <EmptyState
            icon={Icon}
            title="No data yet"
            description={emptyHint ?? "Data appears once the simulation runs."}
            className="py-8"
          />
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="glass-strong rounded-lg px-3 py-1.5 text-xs shadow-xl">
                        <span className="text-muted-foreground">{label}: </span>
                        <span className="font-semibold tabular-nums">
                          {payload[0].value}
                        </span>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={54}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color ?? "hsl(var(--primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
