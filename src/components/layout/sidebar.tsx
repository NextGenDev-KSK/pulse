"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, PanelLeftClose, PanelLeft, LogOut } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-config";
import { useUiStore } from "@/stores/ui-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { useAuthStore } from "@/features/auth/auth-store";
import { ROLE_LABELS } from "@/features/auth/types";
import { Tooltip } from "@/components/ui/tooltip";
import { APP } from "@/lib/constants";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const running = useSimulationStore((s) => s.running);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r border-border bg-surface/40 backdrop-blur-xl transition-[width] duration-300",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-4">
        <span className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
          <Activity className="size-5 text-primary-foreground" strokeWidth={2.5} />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-none">
              {APP.name}
            </p>
            <p className="mt-1 truncate text-[10px] text-muted-foreground">
              {APP.venue}
            </p>
          </div>
        )}
      </div>

      {/* Live status */}
      <div className={cn("px-3", collapsed && "px-2")}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="relative flex size-2.5">
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                running
                  ? "animate-ping bg-[hsl(var(--calm))]"
                  : "bg-muted-foreground",
              )}
            />
            <span
              className={cn(
                "relative inline-flex size-2.5 rounded-full",
                running ? "bg-[hsl(var(--calm))]" : "bg-muted-foreground",
              )}
            />
          </span>
          {!collapsed && (
            <span className="text-xs font-medium text-muted-foreground">
              {running ? "Live telemetry" : "Standby"}
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-3 no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const link = (
            <Link
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "text-surface-foreground"
                  : "text-muted-foreground hover:text-surface-foreground hover:bg-muted/40",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/15 to-accent/10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 size-[18px] shrink-0",
                  active && "text-[hsl(var(--primary))]",
                )}
              />
              {!collapsed && (
                <span className="relative z-10 flex min-w-0 flex-col">
                  <span className="truncate font-medium leading-tight">
                    {item.label}
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    {item.sub}
                  </span>
                </span>
              )}
            </Link>
          );
          return collapsed ? (
            <Tooltip key={item.href} content={item.label} side="right">
              {link}
            </Tooltip>
          ) : (
            <React.Fragment key={item.href}>{link}</React.Fragment>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div
          className={cn(
            "flex items-center gap-2.5",
            collapsed && "justify-center",
          )}
        >
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">
            {initials(user?.displayName ?? "OP")}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">
                {user?.displayName}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {user ? ROLE_LABELS[user.role] : ""}
              </p>
            </div>
          )}
          {!collapsed && (
            <Tooltip content="Sign out" side="top">
              <button
                onClick={() => signOut()}
                aria-label="Sign out"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <LogOut className="size-4" />
              </button>
            </Tooltip>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground",
          )}
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <>
              <PanelLeftClose className="size-4" /> Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
