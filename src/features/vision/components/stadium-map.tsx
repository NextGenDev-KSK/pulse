"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import { ZONES, STADIUM_VIEWBOX, ZONE_MAP, ZONE_BBOX } from "@/lib/stadium/zones";
import { densityColor, densityOpacity } from "@/lib/stadium/heatmap";
import { useSimulationStore } from "@/stores/simulation-store";
import { useIncidentStore, selectOpenIncidents } from "@/stores/incident-store";
import { useUiStore } from "@/stores/ui-store";
import { INCIDENT_META } from "@/lib/constants";

interface StadiumMapProps {
  interactive?: boolean;
  showStewards?: boolean;
  showIncidents?: boolean;
  showLabels?: boolean;
  className?: string;
}

export function StadiumMap({
  interactive = true,
  showStewards = true,
  showIncidents = true,
  showLabels = true,
  className,
}: StadiumMapProps) {
  const telemetry = useSimulationStore((s) => s.telemetry);
  const stewards = useSimulationStore((s) => s.stewards);
  const openIncidents = useIncidentStore(useShallow(selectOpenIncidents));
  const selectedZoneId = useUiStore((s) => s.selectedZoneId);
  const setSelectedZone = useUiStore((s) => s.setSelectedZone);

  // Distribute stewards within a zone so dots don't overlap.
  const stewardPositions = React.useMemo(() => {
    const byZone = new Map<string, number>();
    return stewards.map((w) => {
      const zone = ZONE_MAP[w.zoneId];
      const idx = byZone.get(w.zoneId) ?? 0;
      byZone.set(w.zoneId, idx + 1);
      const angle = (idx * 137.5 * Math.PI) / 180;
      const r = 8 + idx * 5;
      return {
        steward: w,
        x: (zone?.centroid.x ?? 500) + Math.cos(angle) * r,
        y: (zone?.centroid.y ?? 320) + Math.sin(angle) * r,
      };
    });
  }, [stewards]);

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={`0 0 ${STADIUM_VIEWBOX.width} ${STADIUM_VIEWBOX.height}`}
        className="h-full w-full"
        role="img"
        aria-label="Stadium crowd heatmap"
      >
        <defs>
          <radialGradient id="pitch-grad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="hsl(152 40% 22%)" />
            <stop offset="100%" stopColor="hsl(152 45% 15%)" />
          </radialGradient>
        </defs>

        {ZONES.map((zone) => {
          const t = telemetry[zone.id];
          const density = t?.density ?? 0;
          const isPitch = zone.kind === "pitch";
          const selected = selectedZoneId === zone.id;
          const critical = t?.risk === "critical";
          const bbox = ZONE_BBOX[zone.id];
          // Narrow, tall zones (side concourses/stands) get vertical labels so
          // adjacent names never collide.
          const vertical = !isPitch && bbox.w < 120 && bbox.h > bbox.w * 1.3;
          const cx = zone.centroid.x;
          const cy = zone.centroid.y;

          return (
            <g key={zone.id}>
              <motion.path
                d={zone.svgPath}
                initial={false}
                animate={{
                  fill: isPitch ? "url(#pitch-grad)" : densityColor(density),
                  fillOpacity: isPitch ? 1 : densityOpacity(density),
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                stroke={
                  selected
                    ? "hsl(var(--primary))"
                    : "color-mix(in oklab, hsl(var(--foreground)) 14%, transparent)"
                }
                strokeWidth={selected ? 3 : 1}
                className={cn(
                  interactive && !isPitch && "cursor-pointer",
                  critical && "animate-pulse",
                )}
                onClick={
                  interactive && !isPitch
                    ? () => setSelectedZone(selected ? null : zone.id)
                    : undefined
                }
                style={{ transformOrigin: "center" }}
              />
              {showLabels && (
                <g
                  transform={vertical ? `rotate(-90 ${cx} ${cy})` : undefined}
                  className="pointer-events-none select-none"
                >
                  <text
                    x={cx}
                    y={cy - (isPitch ? 4 : 6)}
                    textAnchor="middle"
                    className="fill-white/85 font-medium"
                    style={{ fontSize: isPitch ? 15 : 11.5 }}
                  >
                    {isPitch ? "PITCH" : zone.name}
                  </text>
                  {!isPitch && t && (
                    <text
                      x={cx}
                      y={cy + 12}
                      textAnchor="middle"
                      className="fill-white font-semibold"
                      style={{ fontSize: 13 }}
                    >
                      {Math.round(density)}%
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* Steward dots */}
        {showStewards &&
          stewardPositions.map(({ steward, x, y }) => (
            <circle
              key={steward.id}
              cx={x}
              cy={y}
              r={4.5}
              className="stroke-black/30"
              strokeWidth={1}
              fill={
                steward.status === "available"
                  ? "hsl(var(--calm))"
                  : steward.status === "en-route"
                    ? "hsl(var(--busy))"
                    : steward.status === "on-scene"
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted-foreground))"
              }
            >
              <title>
                {steward.name} — {steward.status}
              </title>
            </circle>
          ))}

        {/* Incident markers */}
        {showIncidents &&
          openIncidents.map((incident) => {
            const zone = ZONE_MAP[incident.zoneId];
            if (!zone) return null;
            return (
              <g
                key={incident.id}
                transform={`translate(${zone.centroid.x + 26}, ${zone.centroid.y - 22})`}
              >
                <circle
                  r={9}
                  fill="hsl(var(--critical))"
                  className="animate-pulse"
                  opacity={0.9}
                />
                <text
                  textAnchor="middle"
                  y={3.5}
                  className="pointer-events-none select-none fill-white font-bold"
                  style={{ fontSize: 10 }}
                >
                  {incident.severity}
                </text>
                <title>
                  {INCIDENT_META[incident.type].label} · S{incident.severity}
                </title>
              </g>
            );
          })}
      </svg>

      <HeatLegend />
    </div>
  );
}

function HeatLegend() {
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-2 rounded-lg border border-border bg-background/70 px-2.5 py-1.5 backdrop-blur">
      <span className="text-[10px] text-muted-foreground">Low</span>
      <span
        className="h-1.5 w-24 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, hsl(152 60% 46%), hsl(96 60% 48%), hsl(43 92% 54%), hsl(25 92% 55%), hsl(350 85% 57%))",
        }}
      />
      <span className="text-[10px] text-muted-foreground">High</span>
    </div>
  );
}
