"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Command as CommandIcon,
} from "lucide-react";
import { cn, formatClock, formatNumber } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-config";
import { useUiStore } from "@/stores/ui-store";
import { useSimulationStore } from "@/stores/simulation-store";
import {
  useNotificationStore,
  selectUnreadCount,
} from "@/stores/notification-store";
import { useTheme } from "@/components/providers/theme-provider";
import { SimulationControls } from "@/features/simulation/simulation-controls";
import { NotificationCenter } from "./notification-center";
import { RISK_META, densityToRisk } from "@/lib/constants";
import type { Weather } from "@/lib/schemas/domain";

const PHASE_LABEL: Record<string, string> = {
  "pre-match": "Pre-Match",
  "first-half": "1st Half",
  halftime: "Half Time",
  "second-half": "2nd Half",
  "full-time": "Full Time",
};

const WEATHER_ICON = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  wind: Wind,
};

export function Topbar() {
  const pathname = usePathname();
  const toggleCommand = useUiStore((s) => s.toggleCommand);
  const snapshot = useSimulationStore((s) => s.snapshot);
  const unread = useNotificationStore(selectUnreadCount);
  const { theme, toggleTheme } = useTheme();
  const [notifOpen, setNotifOpen] = React.useState(false);

  const current = NAV_ITEMS.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/"),
  );
  const WeatherIcon = WEATHER_ICON[snapshot.weather.condition];
  const pressureRisk = densityToRisk(snapshot.pressureIndex);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/70 px-5 backdrop-blur-xl">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold leading-none">
          {current?.label ?? "Console"}
        </h1>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {current?.sub}
        </p>
      </div>

      {/* Match clock */}
      <div className="ml-2 hidden items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-1.5 md:flex">
        <span className="font-mono text-sm font-semibold tabular-nums">
          {formatClock(snapshot.matchClock)}
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {PHASE_LABEL[snapshot.phase]}
        </span>
      </div>

      {/* Pressure index */}
      <PressureBadge value={snapshot.pressureIndex} risk={pressureRisk} />

      {/* Weather + attendance */}
      <div className="hidden items-center gap-3 text-xs text-muted-foreground lg:flex">
        <span className="inline-flex items-center gap-1.5">
          <WeatherIcon className="size-4" />
          {Math.round(snapshot.weather.tempC)}°C
        </span>
        <WeatherWind weather={snapshot.weather} />
        <span className="tabular-nums">
          {formatNumber(snapshot.attendance)} in venue
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <SimulationControls />

        <button
          onClick={toggleCommand}
          className="hidden items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground sm:flex"
        >
          <Search className="size-3.5" />
          Search
          <span className="ml-1 inline-flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">
            <CommandIcon className="size-2.5" />K
          </span>
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Notifications"
            className="relative rounded-lg border border-border bg-surface/40 p-2 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[hsl(var(--critical))] px-1 text-[9px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded-lg border border-border bg-surface/40 p-2 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </button>
      </div>
    </header>
  );
}

function WeatherWind({ weather }: { weather: Weather }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Wind className="size-3.5" />
      {Math.round(weather.windKph)} kph
    </span>
  );
}

function PressureBadge({ value, risk }: { value: number; risk: keyof typeof RISK_META }) {
  return (
    <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-1.5 md:flex">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Pressure
      </span>
      <span
        className={cn("font-mono text-sm font-semibold tabular-nums", RISK_META[risk].text)}
      >
        {Math.round(value)}
      </span>
      <span
        className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
        aria-hidden
      >
        <span
          className="block h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${Math.min(100, value)}%`,
            background: RISK_META[risk].color,
          }}
        />
      </span>
    </div>
  );
}
