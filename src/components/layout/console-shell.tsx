"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { useNavHotkeys } from "./use-nav-hotkeys";
import { AuthGuard } from "@/features/auth/auth-guard";
import { SimulationEngine } from "@/features/simulation/simulation-engine";

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  useNavHotkeys();

  return (
    <AuthGuard>
      <div className="pulse-aurora" />
      {/* Drives the live telemetry stream while mounted. */}
      <SimulationEngine />
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-5">{children}</main>
        </div>
      </div>
      <CommandPalette />
    </AuthGuard>
  );
}
