"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Lightweight CSS-driven tooltip — no external dependency, keyboard accessible. */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  const pos: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs text-surface-foreground opacity-0 shadow-xl transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
          pos[side],
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
