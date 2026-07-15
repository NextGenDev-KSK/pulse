import { briefingRequestSchema } from "@/lib/ai/contracts";
import { generateStructured } from "@/lib/ai/gemini";
import { briefingSchema } from "@/lib/ai/response-schemas";
import { BRIEFING_SYSTEM, briefingPrompt } from "@/lib/ai/prompts";
import { heuristicBriefing } from "@/lib/ai/heuristics";
import { briefingResultSchema, type BriefingResult } from "@/lib/schemas/domain";
import { aiSuccess, invalidRequest, preflight } from "@/lib/api/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const pre = await preflight(request, { rateKeyPrefix: "briefing" });
  if (!pre.ok) return pre.response;

  const parsed = briefingRequestSchema.safeParse(pre.ctx.body);
  if (!parsed.success) return invalidRequest(pre.ctx.requestId);

  const input = parsed.data;
  const started = Date.now();

  try {
    const raw = await generateStructured<Omit<BriefingResult, "engine">>({
      system: BRIEFING_SYSTEM,
      prompt: briefingPrompt(input),
      schema: briefingSchema,
      temperature: 0.6,
    });
    const result = briefingResultSchema.parse({ ...raw, engine: "gemini" });
    return aiSuccess(result, "gemini", Date.now() - started, pre.ctx.requestId);
  } catch {
    const result = heuristicBriefing(input);
    return aiSuccess(result, "heuristic", Date.now() - started, pre.ctx.requestId);
  }
}
