import { NextResponse } from "next/server";
import {
  dispatchRationaleRequestSchema,
  type AiResponse,
  type DispatchRationaleResult,
} from "@/lib/ai/contracts";
import { generateStructured } from "@/lib/ai/gemini";
import { dispatchRationaleSchema } from "@/lib/ai/response-schemas";
import { DISPATCH_SYSTEM, dispatchRationalePrompt } from "@/lib/ai/prompts";
import { INCIDENT_META } from "@/lib/constants";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { formatDuration } from "@/lib/utils";

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

  const parsed = dispatchRationaleRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid-request" } satisfies AiResponse<never>,
      { status: 422 },
    );
  }
  const input = parsed.data;
  const started = Date.now();

  const zoneName = ZONE_MAP[input.incident.zoneId]?.name ?? input.incident.zoneId;

  try {
    const raw = await generateStructured<{ rationale: string; briefing: string }>({
      system: DISPATCH_SYSTEM,
      prompt: dispatchRationalePrompt(input),
      schema: dispatchRationaleSchema,
      temperature: 0.5,
    });
    return NextResponse.json({
      ok: true,
      engine: "gemini",
      data: { ...raw, engine: "gemini" },
      latencyMs: Date.now() - started,
    } satisfies AiResponse<DispatchRationaleResult>);
  } catch {
    const data: DispatchRationaleResult = {
      rationale: `${input.chosen.steward.name} is the nearest ${input.chosen.steward.skills.join(
        "/",
      )} responder to ${zoneName}, reachable in ${formatDuration(
        input.chosen.etaSeconds,
      )} — the best skill and distance fit for this ${INCIDENT_META[input.incident.type].label.toLowerCase()} incident.`,
      briefing: `${input.chosen.steward.name}, proceed to ${zoneName} for a severity ${input.incident.severity} ${INCIDENT_META[
        input.incident.type
      ].label.toLowerCase()} incident. ${input.incident.description} Report status on arrival.`,
      engine: "heuristic",
    };
    return NextResponse.json({
      ok: true,
      engine: "heuristic",
      data,
      latencyMs: Date.now() - started,
    } satisfies AiResponse<DispatchRationaleResult>);
  }
}
