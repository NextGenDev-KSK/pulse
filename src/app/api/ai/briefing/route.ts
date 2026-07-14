import { NextResponse } from "next/server";
import { briefingRequestSchema, type AiResponse } from "@/lib/ai/contracts";
import { generateStructured } from "@/lib/ai/gemini";
import { briefingSchema } from "@/lib/ai/response-schemas";
import { BRIEFING_SYSTEM, briefingPrompt } from "@/lib/ai/prompts";
import { heuristicBriefing } from "@/lib/ai/heuristics";
import { briefingResultSchema, type BriefingResult } from "@/lib/schemas/domain";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid-json" } satisfies AiResponse<never>,
      { status: 400 },
    );
  }

  const parsed = briefingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid-request" } satisfies AiResponse<never>,
      { status: 422 },
    );
  }
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
    return NextResponse.json({
      ok: true,
      engine: "gemini",
      data: result,
      latencyMs: Date.now() - started,
    } satisfies AiResponse<BriefingResult>);
  } catch {
    const result = heuristicBriefing(input);
    return NextResponse.json({
      ok: true,
      engine: "heuristic",
      data: result,
      latencyMs: Date.now() - started,
    } satisfies AiResponse<BriefingResult>);
  }
}
