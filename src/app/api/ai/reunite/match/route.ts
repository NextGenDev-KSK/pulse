import { matchRequestSchema } from "@/lib/ai/contracts";
import { generateStructured } from "@/lib/ai/gemini";
import { matchSchema } from "@/lib/ai/response-schemas";
import { MATCH_SYSTEM, matchPrompt } from "@/lib/ai/prompts";
import { heuristicMatch } from "@/lib/ai/heuristics";
import { candidateSchema } from "@/lib/schemas/domain";
import { aiSuccess, invalidRequest, preflight } from "@/lib/api/security";
import { z } from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const pre = await preflight(request, { rateKeyPrefix: "match" });
  if (!pre.ok) return pre.response;

  const parsed = matchRequestSchema.safeParse(pre.ctx.body);
  if (!parsed.success) return invalidRequest(pre.ctx.requestId);

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

    return aiSuccess(candidates, "gemini", Date.now() - started, pre.ctx.requestId);
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
    return aiSuccess(candidates, "heuristic", Date.now() - started, pre.ctx.requestId);
  }
}
