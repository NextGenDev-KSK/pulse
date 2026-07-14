import { NextResponse } from "next/server";
import { forecastRequestSchema, type AiResponse } from "@/lib/ai/contracts";
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

  const parsed = forecastRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid-request" } satisfies AiResponse<never>,
      { status: 422 },
    );
  }
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

    return NextResponse.json({
      ok: true,
      engine: "gemini",
      data: result,
      latencyMs: Date.now() - started,
    } satisfies AiResponse<ForecastResult>);
  } catch {
    const result = heuristicForecast({ ...input, telemetry });
    return NextResponse.json({
      ok: true,
      engine: "heuristic",
      data: result,
      latencyMs: Date.now() - started,
    } satisfies AiResponse<ForecastResult>);
  }
}
