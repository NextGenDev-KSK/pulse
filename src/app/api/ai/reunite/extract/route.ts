import { NextResponse } from "next/server";
import { extractRequestSchema, type AiResponse } from "@/lib/ai/contracts";
import { generateStructured } from "@/lib/ai/gemini";
import { descriptorSchema as descriptorResponseSchema } from "@/lib/ai/response-schemas";
import { EXTRACT_SYSTEM, extractPrompt } from "@/lib/ai/prompts";
import { heuristicExtract } from "@/lib/ai/heuristics";
import { descriptorSchema, type Descriptor } from "@/lib/schemas/domain";

export const runtime = "nodejs";

const FALLBACK_BASE: Omit<Descriptor, "lastSeenZoneId" | "minutesAgo"> = {
  ageBand: "unknown",
  gender: "unknown",
  hair: "unknown",
  upperColor: "unknown",
  upperItem: "unknown",
  lowerColor: "unknown",
  lowerItem: "unknown",
  accessories: [],
  distinguishingFeatures: "",
};

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

  const parsed = extractRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid-request" } satisfies AiResponse<never>,
      { status: 422 },
    );
  }
  const { freeText, lastSeenZoneId, minutesAgo } = parsed.data;
  const started = Date.now();

  try {
    const raw = await generateStructured<
      Omit<Descriptor, "lastSeenZoneId" | "minutesAgo">
    >({
      system: EXTRACT_SYSTEM,
      prompt: extractPrompt(freeText),
      schema: descriptorResponseSchema,
      temperature: 0.2,
    });
    const result = descriptorSchema.parse({ ...raw, lastSeenZoneId, minutesAgo });
    return NextResponse.json({
      ok: true,
      engine: "gemini",
      data: result,
      latencyMs: Date.now() - started,
    } satisfies AiResponse<Descriptor>);
  } catch {
    const result = heuristicExtract(freeText, {
      ...FALLBACK_BASE,
      lastSeenZoneId,
      minutesAgo,
    });
    return NextResponse.json({
      ok: true,
      engine: "heuristic",
      data: result,
      latencyMs: Date.now() - started,
    } satisfies AiResponse<Descriptor>);
  }
}
