import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-muted text-surface-foreground",
        outline: "border-border text-muted-foreground",
        primary:
          "border-transparent bg-primary/15 text-[hsl(var(--primary))]",
        accent: "border-transparent bg-accent/15 text-[hsl(var(--accent))]",
        calm: "border-transparent bg-[hsl(var(--calm))]/15 text-[hsl(var(--calm))]",
        busy: "border-transparent bg-[hsl(var(--busy))]/15 text-[hsl(var(--busy))]",
        crowded:
          "border-transparent bg-[hsl(var(--crowded))]/15 text-[hsl(var(--crowded))]",
        critical:
          "border-transparent bg-[hsl(var(--critical))]/15 text-[hsl(var(--critical))]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
