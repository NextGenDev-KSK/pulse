import { forecastRequestSchema } from "@/lib/ai/contracts";
import { generateStructured } from "@/lib/ai/gemini";
import { forecastSchema } from "@/lib/ai/response-schemas";
import { FORECAST_SYSTEM, forecastPrompt } from "@/lib/ai/prompts";
import { heuristicForecast } from "@/lib/ai/heuristics";
import {
  forecastResultSchema,
  type ForecastResult,
  type ZoneTelemetry,
} from "@/lib/schemas/domain";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { densityToRisk } from "@/lib/constants";
import { aiSuccess, invalidRequest, preflight } from "@/lib/api/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const pre = await preflight(request, { rateKeyPrefix: "forecast" });
  if (!pre.ok) return pre.response;

  const parsed = forecastRequestSchema.safeParse(pre.ctx.body);
  if (!parsed.success) return invalidRequest(pre.ctx.requestId);

  const input = parsed.data;
  const started = Date.now();

  // Only forecast non-pitch zones to keep the prompt tight.
  const telemetry = input.telemetry.filter(
    (t: ZoneTelemetry) => ZONE_MAP[t.zoneId]?.kind !== "pitch",
  );
  const currentById = new Map(telemetry.map((t) => [t.zoneId, t.density]));

  try {
    const raw = await generateStructured<{
      summary: string;
      reasoning: string[];
      zones: {
        zoneId: string;
        predictedDensity: number;
        predictedRisk: string;
        confidence: number;
        reasoning: string;
      }[];
      proactiveAlerts: ForecastResult["proactiveAlerts"];
    }>({
      system: FORECAST_SYSTEM,
      prompt: forecastPrompt({ ...input, telemetry }),
      schema: forecastSchema,
      temperature: 0.5,
    });

    const result = forecastResultSchema.parse({
      summary: raw.summary,
      reasoning: raw.reasoning,
      engine: "gemini",
      proactiveAlerts: raw.proactiveAlerts,
      zones: raw.zones.map((z) => ({
        zoneId: z.zoneId,
        currentDensity: currentById.get(z.zoneId) ?? 0,
        predictedDensity: z.predictedDensity,
        horizonMinutes: 15,
        predictedRisk: densityToRisk(z.predictedDensity),
        confidence: z.confidence,
        reasoning: z.reasoning,
      })),
    });

    return aiSuccess(result, "gemini", Date.now() - started, pre.ctx.requestId);
  } catch {
    const result = heuristicForecast({ ...input, telemetry });
    return aiSuccess(result, "heuristic", Date.now() - started, pre.ctx.requestId);
  }
}
