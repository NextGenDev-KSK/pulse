import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
          <Icon className="size-6" />
        </span>
      )}
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
