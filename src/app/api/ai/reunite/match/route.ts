import { NextResponse } from "next/server";
import { matchRequestSchema, type AiResponse } from "@/lib/ai/contracts";
import { generateStructured } from "@/lib/ai/gemini";
import { matchSchema } from "@/lib/ai/response-schemas";
import { MATCH_SYSTEM, matchPrompt } from "@/lib/ai/prompts";
import { heuristicMatch } from "@/lib/ai/heuristics";
import { candidateSchema, type Candidate } from "@/lib/schemas/domain";
import { z } from "zod";

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

  const parsed = matchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid-request" } satisfies AiResponse<never>,
      { status: 422 },
    );
  }
  const input = parsed.data;
  const started = Date.now();
  const meta = new Map(
    input.sightings.map((s) => [
      s.id,
      { stewardName: s.stewardName, zoneId: s.zoneId },
    ]),
  );

  try {
    const raw = await generateStructured<{
      candidates: {
        sightingId: string;
        score: number;
        rationale: string;
        perAttribute: { attribute: string; match: string; note: string }[];
      }[];
    }>({
      system: MATCH_SYSTEM,
      prompt: matchPrompt(input),
      schema: matchSchema,
      temperature: 0.3,
    });

    const candidates = z
      .array(candidateSchema)
      .parse(
        raw.candidates.map((c) => ({
          sightingId: c.sightingId,
          stewardName: meta.get(c.sightingId)?.stewardName ?? "Steward",
          zoneId: meta.get(c.sightingId)?.zoneId ?? "",
          score: c.score,
          rationale: c.rationale,
          perAttribute: c.perAttribute,
          engine: "gemini" as const,
        })),
      )
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({
      ok: true,
      engine: "gemini",
      data: candidates,
      latencyMs: Date.now() - started,
    } satisfies AiResponse<Candidate[]>);
  } catch {
    const candidates = heuristicMatch({
      descriptor: input.descriptor,
      sightings: input.sightings.map((s) => ({
        id: s.id,
        descriptor: s.descriptor,
        zoneName: s.zoneName,
        notes: s.notes,
        stewardName: s.stewardName,
        zoneId: s.zoneId,
      })),
    });
    return NextResponse.json({
      ok: true,
      engine: "heuristic",
      data: candidates,
      latencyMs: Date.now() - started,
    } satisfies AiResponse<Candidate[]>);
  }
}
