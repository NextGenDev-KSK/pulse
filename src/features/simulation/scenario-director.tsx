"use client";

import { Clapperboard } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useScenarioActions } from "./use-scenario-actions";

export function ScenarioDirector() {
  const scenarios = useScenarioActions();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clapperboard className="size-4 text-[hsl(var(--accent))]" />
          Scenario Director
        </CardTitle>
        <Badge variant="accent">Demo</Badge>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Inject live events. Each triggers the full agent loop — perception,
          reasoning, dispatch.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {scenarios.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={s.run}
                className="group flex flex-col items-start gap-2 rounded-lg border border-border bg-background/40 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/40"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-[hsl(var(--primary))] transition-colors group-hover:from-primary/30 group-hover:to-accent/30">
                  <Icon className="size-4" />
                </span>
                <span className="text-xs font-medium leading-tight">
                  {s.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {s.hint}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
