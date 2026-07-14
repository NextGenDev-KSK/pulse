"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Renders an agent's step-by-step reasoning as an animated vertical chain. */
export function ReasoningChain({
  steps,
  className,
  compact,
}: {
  steps: string[];
  className?: string;
  compact?: boolean;
}) {
  return (
    <ol className={cn("relative space-y-2.5", className)}>
      {steps.map((step, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.25 }}
          className="flex gap-3"
        >
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-mono font-semibold text-primary-foreground",
                compact ? "size-4 text-[9px]" : "size-5 text-[10px]",
              )}
            >
              {i + 1}
            </span>
            {i < steps.length - 1 && (
              <span className="mt-1 w-px flex-1 bg-border" />
            )}
          </div>
          <p
            className={cn(
              "pb-0.5 text-muted-foreground",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {step}
          </p>
        </motion.li>
      ))}
    </ol>
  );
}
