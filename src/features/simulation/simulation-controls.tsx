"use client";

import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimulationStore } from "@/stores/simulation-store";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * Transport controls for the live simulation. The actual tick scheduler
 * (Phase 3) subscribes to `running`; here we only flip intent + reset state.
 */
export function SimulationControls() {
  const running = useSimulationStore((s) => s.running);
  const setRunning = useSimulationStore((s) => s.setRunning);
  const reset = useSimulationStore((s) => s.reset);

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface/40 p-1">
      <Tooltip content={running ? "Pause simulation" : "Start simulation"} side="bottom">
        <button
          onClick={() => setRunning(!running)}
          aria-label={running ? "Pause simulation" : "Start simulation"}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            running
              ? "text-[hsl(var(--busy))] hover:bg-muted/60"
              : "bg-gradient-to-r from-primary to-accent text-primary-foreground",
          )}
        >
          {running ? (
            <>
              <Pause className="size-3.5" /> Live
            </>
          ) : (
            <>
              <Play className="size-3.5" /> Start
            </>
          )}
        </button>
      </Tooltip>
      <Tooltip content="Reset match" side="bottom">
        <button
          onClick={() => {
            setRunning(false);
            reset();
          }}
          aria-label="Reset simulation"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </Tooltip>
    </div>
  );
}
