"use client";

import { formatRelativeTime } from "@/lib/utils";
import type { ReuniteCase } from "@/lib/schemas/domain";

export function CaseTimeline({ caseItem }: { caseItem: ReuniteCase }) {
  const events = [...caseItem.timeline].reverse();
  return (
    <ol className="relative space-y-3">
      {events.map((event, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-[hsl(var(--primary))]" />
            {i < events.length - 1 && (
              <span className="mt-1 w-px flex-1 bg-border" />
            )}
          </div>
          <div className="pb-1">
            <p className="text-sm font-medium capitalize">{event.label}</p>
            <p className="text-xs text-muted-foreground">{event.detail}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/70">
              {formatRelativeTime(event.t)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
