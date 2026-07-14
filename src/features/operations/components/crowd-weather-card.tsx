"use client";

import { Activity, Wind } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSimulationStore } from "@/stores/simulation-store";
import { useAiStore } from "@/stores/ai-store";
import { EngineBadge } from "@/components/shared/engine-badge";
import { RISK_META, densityToRisk } from "@/lib/constants";
import { densityColor } from "@/lib/stadium/heatmap";

function narrative(pressure: number, phase: string): string {
  const phaseLabel: Record<string, string> = {
    "pre-match": "Fans are still arriving",
    "first-half": "Match underway",
    halftime: "Half-time — concourses busy",
    "second-half": "Second half in progress",
    "full-time": "Full-time egress building",
  };
  const lead = phaseLabel[phase] ?? "Match in progress";
  if (pressure >= 92)
    return `${lead}. Stadium pressure is critical — intervene now to relieve the hottest zones.`;
  if (pressure >= 78)
    return `${lead}. Pressure is high; several zones are crowding and warrant pre-emptive action.`;
  if (pressure >= 55)
    return `${lead}. Pressure is building but manageable. Keep flows monitored.`;
  return `${lead}. Conditions are calm across the venue with comfortable headroom.`;
}

export function CrowdWeatherCard() {
  const snapshot = useSimulationStore((s) => s.snapshot);
  const briefing = useAiStore((s) => s.latestBriefing);
  const pressure = snapshot.pressureIndex;
  const risk = densityToRisk(pressure);
  const color = densityColor(pressure);

  // Semicircular gauge geometry
  const radius = 70;
  const circumference = Math.PI * radius;
  const progress = Math.min(100, pressure) / 100;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-[hsl(var(--primary))]" />
          Crowd Weather
        </CardTitle>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{
            background: `color-mix(in oklab, ${color} 18%, transparent)`,
            color,
          }}
        >
          {RISK_META[risk].label}
        </span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center">
        <div className="relative">
          <svg width={180} height={104} viewBox="0 0 180 104">
            <path
              d={`M 20 96 A ${radius} ${radius} 0 0 1 160 96`}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={12}
              strokeLinecap="round"
            />
            <path
              d={`M 20 96 A ${radius} ${radius} 0 0 1 160 96`}
              fill="none"
              stroke={color}
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
            <span className="font-mono text-4xl font-semibold tabular-nums">
              {Math.round(pressure)}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Pressure Index
            </span>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {briefing?.narrative ?? narrative(pressure, snapshot.phase)}
        </p>
        {briefing && (
          <div className="mt-2">
            <EngineBadge engine={briefing.engine} />
          </div>
        )}

        <div className="mt-4 flex w-full items-center justify-around border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 capitalize">
            <Wind className="size-3.5" />
            {snapshot.weather.condition}
          </span>
          <span>{Math.round(snapshot.weather.tempC)}°C</span>
          <span>{Math.round(snapshot.weather.windKph)} kph wind</span>
        </div>
      </CardContent>
    </Card>
  );
}
