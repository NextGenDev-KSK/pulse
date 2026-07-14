"use client";

import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Loader2, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EngineBadge } from "@/components/shared/engine-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { cn } from "@/lib/utils";
import type { Candidate, ReuniteCase } from "@/lib/schemas/domain";

const MATCH_COLOR = {
  match: "text-[hsl(var(--calm))]",
  partial: "text-[hsl(var(--busy))]",
  mismatch: "text-[hsl(var(--critical))]",
};

export function CandidateMatches({
  caseItem,
  onConfirm,
}: {
  caseItem: ReuniteCase;
  onConfirm: (candidate: Candidate) => void;
}) {
  const candidates = caseItem.candidates;
  const searching =
    caseItem.status === "reported" || caseItem.status === "searching";
  const reunited = caseItem.status === "reunited";

  if (searching) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background/40 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-[hsl(var(--primary))]" />
        Guardian is sweeping zones and gathering sightings…
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <EmptyState
        icon={UserSearch}
        title="No candidates yet"
        description="No steward sightings have been matched to this descriptor."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {candidates.map((candidate, i) => {
        const isTop = i === 0;
        const pct = Math.round(candidate.score * 100);
        return (
          <motion.div
            key={candidate.sightingId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "rounded-lg border bg-background/40 p-3.5",
              isTop && !reunited
                ? "border-primary/40 ring-1 ring-primary/20"
                : "border-border",
            )}
          >
            <div className="flex items-center gap-3">
              <ScoreRing pct={pct} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{candidate.stewardName}</p>
                  {isTop && <EngineBadge engine={candidate.engine} />}
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  {ZONE_MAP[candidate.zoneId]?.name ?? candidate.zoneId}
                </p>
              </div>
              {isTop && !reunited && (
                <Button size="sm" variant="success" onClick={() => onConfirm(candidate)}>
                  <CheckCircle2 /> Confirm reunion
                </Button>
              )}
            </div>

            <p className="mt-2 text-xs italic text-muted-foreground">
              “{candidate.rationale}”
            </p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {candidate.perAttribute.map((attr) => (
                <span
                  key={attr.attribute}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface/40 px-1.5 py-0.5 text-[10px]"
                  title={attr.note}
                >
                  <span
                    className={cn("size-1.5 rounded-full", {
                      "bg-[hsl(var(--calm))]": attr.match === "match",
                      "bg-[hsl(var(--busy))]": attr.match === "partial",
                      "bg-[hsl(var(--critical))]": attr.match === "mismatch",
                    })}
                  />
                  <span className="text-muted-foreground">{attr.attribute}</span>
                  <span className={MATCH_COLOR[attr.match]}>{attr.match}</span>
                </span>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function ScoreRing({ pct }: { pct: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const color =
    pct >= 75 ? "hsl(var(--calm))" : pct >= 50 ? "hsl(var(--busy))" : "hsl(var(--critical))";
  return (
    <div className="relative size-12 shrink-0">
      <svg width={48} height={48} viewBox="0 0 48 48" className="-rotate-90">
        <circle cx={24} cy={24} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={4} />
        <circle
          cx={24}
          cy={24}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-semibold tabular-nums">
        {pct}
      </span>
    </div>
  );
}
