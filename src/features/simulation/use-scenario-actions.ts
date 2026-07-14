"use client";

import * as React from "react";
import {
  Goal,
  Coffee,
  HeartPulse,
  ShieldAlert,
  Baby,
  Users,
  CloudLightning,
  type LucideIcon,
} from "lucide-react";
import {
  useSimulationStore,
  type ScenarioId,
} from "@/stores/simulation-store";
import { toast } from "@/components/ui/toast";

export interface ScenarioAction {
  id: ScenarioId;
  label: string;
  hint: string;
  icon: LucideIcon;
  run: () => void;
}

const DEFS: {
  id: ScenarioId;
  label: string;
  hint: string;
  icon: LucideIcon;
  toast: string;
}[] = [
  {
    id: "goal-home",
    label: "Goal — FC Meridian",
    hint: "Concourse celebration surge",
    icon: Goal,
    toast: "GOAL! Crowd surge expected in the concourses.",
  },
  {
    id: "halftime-surge",
    label: "Trigger half-time",
    hint: "Food & restroom rush",
    icon: Coffee,
    toast: "Half-time — food court and restrooms filling fast.",
  },
  {
    id: "medical",
    label: "Medical emergency",
    hint: "Injects a medical incident",
    icon: HeartPulse,
    toast: "Medical emergency reported.",
  },
  {
    id: "security",
    label: "Security incident",
    hint: "Injects a security incident",
    icon: ShieldAlert,
    toast: "Security incident reported.",
  },
  {
    id: "lost-child",
    label: "Lost child report",
    hint: "Opens a Reunite case",
    icon: Baby,
    toast: "Lost child reported — Reunite case opening.",
  },
  {
    id: "gate-crush",
    label: "Gate overcrowding",
    hint: "Spikes density at a gate",
    icon: Users,
    toast: "Gate density spiking — watch for a crush risk.",
  },
  {
    id: "weather-turn",
    label: "Weather turns",
    hint: "Storm rolls in",
    icon: CloudLightning,
    toast: "Weather deteriorating — storm approaching.",
  },
];

export function useScenarioActions(): ScenarioAction[] {
  const queueScenario = useSimulationStore((s) => s.queueScenario);
  const setRunning = useSimulationStore((s) => s.setRunning);
  const running = useSimulationStore((s) => s.running);

  return React.useMemo(
    () =>
      DEFS.map((d) => ({
        id: d.id,
        label: d.label,
        hint: d.hint,
        icon: d.icon,
        run: () => {
          if (!running) setRunning(true);
          queueScenario(d.id);
          toast({ title: d.toast, variant: "info" });
        },
      })),
    [queueScenario, running, setRunning],
  );
}
