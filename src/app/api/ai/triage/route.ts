import { NextResponse } from "next/server";
import { triageRequestSchema, type AiResponse } from "@/lib/ai/contracts";
import { generateStructured } from "@/lib/ai/gemini";
import { triageSchema } from "@/lib/ai/response-schemas";
import { TRIAGE_SYSTEM, triagePrompt } from "@/lib/ai/prompts";
import { heuristicTriage } from "@/lib/ai/heuristics";
import { triageResultSchema, type TriageResult } from "@/lib/schemas/domain";

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

  const parsed = triageRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid-request" } satisfies AiResponse<never>,
      { status: 422 },
    );
  }
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
    return NextResponse.json({
      ok: true,
      engine: "gemini",
      data: result,
      latencyMs: Date.now() - started,
    } satisfies AiResponse<TriageResult>);
  } catch (err) {
    // 2. Deterministic fallback — always succeeds.
    void err;
    const result = heuristicTriage({
      incident: input.incident,
      zoneTelemetry: input.zoneTelemetry,
      openIncidentCount: input.openIncidentCount,
    });
    return NextResponse.json({
      ok: true,
      engine: "heuristic",
      data: result,
      latencyMs: Date.now() - started,
    } satisfies AiResponse<TriageResult>);
  }
}
