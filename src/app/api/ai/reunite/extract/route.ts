import { extractRequestSchema } from "@/lib/ai/contracts";
import { generateStructured } from "@/lib/ai/gemini";
import { descriptorSchema as descriptorResponseSchema } from "@/lib/ai/response-schemas";
import { EXTRACT_SYSTEM, extractPrompt } from "@/lib/ai/prompts";
import { heuristicExtract } from "@/lib/ai/heuristics";
import { descriptorSchema, type Descriptor } from "@/lib/schemas/domain";
import { aiSuccess, invalidRequest, preflight } from "@/lib/api/security";

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
  const pre = await preflight(request, { rateKeyPrefix: "extract" });
  if (!pre.ok) return pre.response;

  const parsed = extractRequestSchema.safeParse(pre.ctx.body);
  if (!parsed.success) return invalidRequest(pre.ctx.requestId);

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
    return aiSuccess(result, "gemini", Date.now() - started, pre.ctx.requestId);
  } catch {
    const result = heuristicExtract(freeText, {
      ...FALLBACK_BASE,
      lastSeenZoneId,
      minutesAgo,
    });
    return aiSuccess(result, "heuristic", Date.now() - started, pre.ctx.requestId);
  }
}
