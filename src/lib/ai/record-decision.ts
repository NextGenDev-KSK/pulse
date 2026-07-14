import { useDecisionStore } from "@/stores/decision-store";
import { GEMINI_MODEL_PUBLIC } from "./model-name";
import { uid } from "@/lib/utils";
import type { Agent } from "@/lib/schemas/domain";

/** Append an entry to the immutable decision ledger. */
export function recordDecision(input: {
  agent: Agent;
  engine: "gemini" | "heuristic";
  latencyMs: number;
  title: string;
  summary: string;
  reasoning: string[];
  relatedId?: string | null;
}) {
  useDecisionStore.getState().addDecision({
    id: uid("dec"),
    t: Date.now(),
    agent: input.agent,
    engine: input.engine,
    model: input.engine === "gemini" ? GEMINI_MODEL_PUBLIC : null,
    latencyMs: input.latencyMs,
    title: input.title,
    summary: input.summary,
    reasoning: input.reasoning,
    relatedId: input.relatedId ?? null,
  });
}
