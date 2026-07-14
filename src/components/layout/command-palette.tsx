"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  CornerDownLeft,
  Play,
  Pause,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-config";
import { useUiStore } from "@/stores/ui-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { useTheme } from "@/components/providers/theme-provider";
import { useScenarioActions } from "@/features/simulation/use-scenario-actions";

interface CommandAction {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: LucideIcon;
  keywords?: string;
  run: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const toggleCommand = useUiStore((s) => s.toggleCommand);
  const running = useSimulationStore((s) => s.running);
  const setRunning = useSimulationStore((s) => s.setRunning);
  const { theme, toggleTheme } = useTheme();
  const scenarios = useScenarioActions();

  const [query, setQuery] = React.useState("");
  const [cursor, setCursor] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setMounted(true), []);

  // Global ⌘K / Ctrl+K
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommand();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCommand]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const actions = React.useMemo<CommandAction[]>(() => {
    const nav: CommandAction[] = NAV_ITEMS.map((item) => ({
      id: `nav-${item.href}`,
      label: `Go to ${item.label}`,
      hint: item.sub,
      group: "Navigate",
      icon: item.icon,
      keywords: item.label + " " + item.sub,
      run: () => router.push(item.href),
    }));

    const sim: CommandAction[] = [
      {
        id: "sim-toggle",
        label: running ? "Pause simulation" : "Start simulation",
        group: "Simulation",
        icon: running ? Pause : Play,
        run: () => setRunning(!running),
      },
    ];

    const scenarioActions: CommandAction[] = scenarios.map((s) => ({
      id: `scn-${s.id}`,
      label: s.label,
      hint: s.hint,
      group: "Trigger scenario",
      icon: s.icon,
      keywords: s.label + " scenario",
      run: s.run,
    }));

    const settings: CommandAction[] = [
      {
        id: "theme",
        label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        group: "Settings",
        icon: theme === "dark" ? Sun : Moon,
        run: toggleTheme,
      },
    ];

    return [...nav, ...sim, ...scenarioActions, ...settings];
  }, [router, running, setRunning, scenarios, theme, toggleTheme]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) =>
      (a.label + " " + (a.keywords ?? "") + " " + a.group)
        .toLowerCase()
        .includes(q),
    );
  }, [actions, query]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, CommandAction[]>();
    for (const a of filtered) {
      if (!map.has(a.group)) map.set(a.group, []);
      map.get(a.group)!.push(a);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flat = filtered;

  const execute = (action?: CommandAction) => {
    if (!action) return;
    action.run();
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(flat.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      execute(flat[cursor]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  if (!mounted) return null;

  let runningIndex = -1;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="glass-strong relative z-10 w-full max-w-xl overflow-hidden rounded-xl shadow-2xl shadow-black/50"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCursor(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search actions, jump to a module, trigger a scenario…"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
                ESC
              </kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {flat.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No matching commands.
                </div>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group} className="mb-1">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group}
                    </p>
                    {items.map((action) => {
                      runningIndex += 1;
                      const active = runningIndex === cursor;
                      const idx = runningIndex;
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onMouseEnter={() => setCursor(idx)}
                          onClick={() => execute(action)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            active
                              ? "bg-primary/15 text-surface-foreground"
                              : "text-muted-foreground hover:bg-muted/40",
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-4 shrink-0",
                              active && "text-[hsl(var(--primary))]",
                            )}
                          />
                          <span className="flex-1 truncate text-surface-foreground">
                            {action.label}
                          </span>
                          {action.hint && (
                            <span className="truncate text-xs text-muted-foreground">
                              {action.hint}
                            </span>
                          )}
                          {active && (
                            <CornerDownLeft className="size-3.5 text-muted-foreground" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
