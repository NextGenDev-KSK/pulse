"use client";

import * as React from "react";
import {
  Play,
  ScanEye,
  BrainCircuit,
  Radio,
  HeartHandshake,
  BarChart3,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSimulationStore } from "@/stores/simulation-store";

const ICONS: Record<string, LucideIcon> = {
  ScanEye,
  BrainCircuit,
  Radio,
  HeartHandshake,
  BarChart3,
  ScrollText,
};

/**
 * Interim module scaffold used before a feature's full phase lands.
 * Icons are resolved from a string key so this client component can be
 * rendered by a server page without passing a function across the boundary.
 */
export function ModulePlaceholder({
  title,
  description,
  iconName,
  detail,
  points,
}: {
  title: string;
  description: string;
  iconName: keyof typeof ICONS;
  detail: string;
  points: string[];
}) {
  const Icon = ICONS[iconName] ?? ScanEye;
  const running = useSimulationStore((s) => s.running);
  const setRunning = useSimulationStore((s) => s.setRunning);
  return (
    <div>
      <PageHeader title={title} description={description} icon={Icon} />
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={Icon}
            title={detail}
            description="This module comes online with the live simulation."
            action={
              !running ? (
                <Button onClick={() => setRunning(true)}>
                  <Play /> Start live simulation
                </Button>
              ) : undefined
            }
          />
          <ul className="mx-auto mt-2 max-w-md space-y-2 text-sm text-muted-foreground">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[hsl(var(--primary))]" />
                {p}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
