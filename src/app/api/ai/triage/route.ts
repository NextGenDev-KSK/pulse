import { triageRequestSchema } from "@/lib/ai/contracts";
import { generateStructured } from "@/lib/ai/gemini";
import { triageSchema } from "@/lib/ai/response-schemas";
import { TRIAGE_SYSTEM, triagePrompt } from "@/lib/ai/prompts";
import { heuristicTriage } from "@/lib/ai/heuristics";
import { triageResultSchema, type TriageResult } from "@/lib/schemas/domain";
import { aiSuccess, invalidRequest, preflight } from "@/lib/api/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const pre = await preflight(request, { rateKeyPrefix: "triage" });
  if (!pre.ok) return pre.response;

  const parsed = triageRequestSchema.safeParse(pre.ctx.body);
  if (!parsed.success) return invalidRequest(pre.ctx.requestId);

  const input = parsed.data;
  const started = Date.now();

  // 1. Try Gemini structured reasoning.
  try {
    const raw = await generateStructured<Omit<TriageResult, "priorityRank" | "engine">>({
      system: TRIAGE_SYSTEM,
      prompt: triagePrompt(input),
      schema: triageSchema,
      temperature: 0.4,
    });
    const result = triageResultSchema.parse({
      ...raw,
      priorityRank: 0,
      engine: "gemini",
    });
    return aiSuccess(result, "gemini", Date.now() - started, pre.ctx.requestId);
  } catch {
    // 2. Deterministic fallback — always succeeds.
    const result = heuristicTriage({
      incident: input.incident,
      zoneTelemetry: input.zoneTelemetry,
      openIncidentCount: input.openIncidentCount,
    });
    return aiSuccess(result, "heuristic", Date.now() - started, pre.ctx.requestId);
  }
}
