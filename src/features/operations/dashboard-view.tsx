"use client";

import Link from "next/link";
import { LayoutDashboard, Map, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiStrip } from "./components/kpi-strip";
import { IncidentFeed } from "./components/incident-feed";
import { CrowdWeatherCard } from "./components/crowd-weather-card";
import { MatchTimeline } from "./components/match-timeline";
import { PressureChart } from "./components/pressure-chart";
import { StewardStatusCard } from "./components/steward-status-card";
import { StadiumMap } from "@/features/vision/components/stadium-map";
import { ScenarioDirector } from "@/features/simulation/scenario-director";
import { useSimulationStore } from "@/stores/simulation-store";

export function DashboardView() {
  const running = useSimulationStore((s) => s.running);
  const setRunning = useSimulationStore((s) => s.setRunning);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Operations Command"
        description="Real-time situational awareness across the venue."
        icon={LayoutDashboard}
        actions={
          !running ? (
            <Button onClick={() => setRunning(true)}>
              <Sparkles /> Go live
            </Button>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--calm))]/30 bg-[hsl(var(--calm))]/10 px-3 py-1.5 text-xs font-medium text-[hsl(var(--calm))]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--calm))] opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-[hsl(var(--calm))]" />
              </span>
              Live
            </span>
          )
        }
      />

      <KpiStrip />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="flex h-full flex-col">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Map className="size-4 text-[hsl(var(--primary))]" />
                Stadium Heatmap
              </CardTitle>
              <Link href="/vision">
                <Button variant="ghost" size="sm">
                  Open Vision <ArrowRight />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="flex-1">
              <StadiumMap className="aspect-[16/10]" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Crowd weather */}
        <CrowdWeatherCard />
      </div>

      <ScenarioDirector />

      <PressureChart />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IncidentFeed />
        </div>
        <div className="space-y-4">
          <StewardStatusCard />
        </div>
      </div>

      <MatchTimeline />
    </div>
  );
}
