"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ScrollText,
  ScanEye,
  BrainCircuit,
  Radio,
  HeartHandshake,
  ChevronDown,
  Download,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EngineBadge } from "@/components/shared/engine-badge";
import { ReasoningChain } from "@/components/shared/reasoning-chain";
import { EmptyState } from "@/components/shared/empty-state";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { useDecisionStore } from "@/stores/decision-store";
import { AGENT_META } from "@/lib/constants";
import { cn, formatRelativeTime } from "@/lib/utils";
import { exportCsv, exportJson, timestampedName } from "@/lib/export";
import type { Agent, Decision } from "@/lib/schemas/domain";

const AGENT_ICON: Record<Agent, LucideIcon> = {
  sentinel: ScanEye,
  strategist: BrainCircuit,
  marshal: Radio,
  guardian: HeartHandshake,
};

const AGENT_COLOR: Record<Agent, string> = {
  sentinel: "hsl(var(--primary))",
  strategist: "hsl(var(--accent))",
  marshal: "hsl(var(--calm))",
  guardian: "hsl(var(--busy))",
};

export function LedgerView() {
  const decisions = useDecisionStore((s) => s.decisions);
  const [filter, setFilter] = React.useState<Agent | "all">("all");

  const filtered = React.useMemo(
    () =>
      filter === "all"
        ? decisions
        : decisions.filter((d) => d.agent === filter),
    [decisions, filter],
  );

  const geminiCount = decisions.filter((d) => d.engine === "gemini").length;

  const handleExport = (format: "csv" | "json") => {
    const rows = decisions.map((d) => ({
      time: new Date(d.t).toISOString(),
      agent: d.agent,
      engine: d.engine,
      model: d.model ?? "",
      latencyMs: d.latencyMs,
      title: d.title,
      summary: d.summary,
      reasoning: d.reasoning.join(" | "),
    }));
    if (format === "csv") exportCsv(timestampedName("pulse-decisions", "csv"), rows);
    else exportJson(timestampedName("pulse-decisions", "json"), decisions);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Decision Ledger"
        description="An immutable, explainable audit trail of every AI decision PULSE has made."
        icon={ScrollText}
        actions={
          <Dropdown
            trigger={
              <Button variant="secondary" size="sm">
                <Download /> Export
              </Button>
            }
          >
            {(close) => (
              <>
                <DropdownItem onClick={() => { handleExport("csv"); close(); }}>
                  Export as CSV
                </DropdownItem>
                <DropdownItem onClick={() => { handleExport("json"); close(); }}>
                  Export as JSON
                </DropdownItem>
              </>
            )}
          </Dropdown>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Agent | "all")}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {(Object.keys(AGENT_META) as Agent[]).map((a) => (
              <TabsTrigger key={a} value={a}>
                {AGENT_META[a].name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">
          {decisions.length} decisions · {geminiCount} via Gemini ·{" "}
          {decisions.length - geminiCount} heuristic
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="size-4 text-[hsl(var(--primary))]" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="No decisions recorded"
              description="Start the simulation — every agent decision will be logged here with its full reasoning."
            />
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((decision) => (
                <LedgerRow key={decision.id} decision={decision} />
              ))}
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LedgerRow({ decision }: { decision: Decision }) {
  const [open, setOpen] = React.useState(false);
  const Icon = AGENT_ICON[decision.agent];
  const color = AGENT_COLOR[decision.agent];
  const meta = AGENT_META[decision.agent];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="overflow-hidden rounded-lg border border-border bg-background/40"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <span
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `color-mix(in oklab, ${color} 16%, transparent)`, color }}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{decision.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {meta.name} · {formatRelativeTime(decision.t)}
          </p>
        </div>
        <EngineBadge engine={decision.engine} latencyMs={decision.latencyMs} />
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">{decision.summary}</p>
              {decision.reasoning.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Reasoning
                  </p>
                  <ReasoningChain steps={decision.reasoning} compact />
                </div>
              )}
              {decision.model && (
                <p className="text-[10px] text-muted-foreground">
                  Model: {decision.model} · {decision.latencyMs}ms
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
