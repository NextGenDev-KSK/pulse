import type {
  BriefingRequest,
  DispatchRationaleRequest,
  DispatchRationaleResult,
  ExtractRequest,
  ForecastRequest,
  MatchRequest,
  TriageRequest,
  AiResponse,
} from "./contracts";
import type {
  BriefingResult,
  Candidate,
  Descriptor,
  ForecastResult,
  TriageResult,
} from "@/lib/schemas/domain";
import {
  heuristicBriefing,
  heuristicForecast,
  heuristicMatch,
  heuristicTriage,
  heuristicExtract,
} from "./heuristics";

async function post<TReq, TRes>(
  path: string,
  body: TReq,
): Promise<AiResponse<TRes>> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as AiResponse<TRes>;
}

export async function requestTriage(
  req: TriageRequest,
): Promise<{ data: TriageResult; engine: "gemini" | "heuristic"; latencyMs: number }> {
  const started = Date.now();
  try {
    const res = await post<TriageRequest, TriageResult>("/api/ai/triage", req);
    if (res.ok) return { data: res.data, engine: res.engine, latencyMs: res.latencyMs };
    throw new Error(res.error);
  } catch {
    return {
      data: heuristicTriage({
        incident: req.incident,
        zoneTelemetry: req.zoneTelemetry,
        openIncidentCount: req.openIncidentCount,
      }),
      engine: "heuristic",
      latencyMs: Date.now() - started,
    };
  }
}

export async function requestForecast(
  req: ForecastRequest,
): Promise<{ data: ForecastResult; engine: "gemini" | "heuristic"; latencyMs: number }> {
  const started = Date.now();
  try {
    const res = await post<ForecastRequest, ForecastResult>(
      "/api/ai/forecast",
      req,
    );
    if (res.ok) return { data: res.data, engine: res.engine, latencyMs: res.latencyMs };
    throw new Error(res.error);
  } catch {
    return {
      data: heuristicForecast(req),
      engine: "heuristic",
      latencyMs: Date.now() - started,
    };
  }
}

export async function requestBriefing(
  req: BriefingRequest,
): Promise<{ data: BriefingResult; engine: "gemini" | "heuristic"; latencyMs: number }> {
  const started = Date.now();
  try {
    const res = await post<BriefingRequest, BriefingResult>(
      "/api/ai/briefing",
      req,
    );
    if (res.ok) return { data: res.data, engine: res.engine, latencyMs: res.latencyMs };
    throw new Error(res.error);
  } catch {
    return {
      data: heuristicBriefing(req),
      engine: "heuristic",
      latencyMs: Date.now() - started,
    };
  }
}

export async function requestExtract(
  req: ExtractRequest,
): Promise<{ data: Descriptor; engine: "gemini" | "heuristic"; latencyMs: number }> {
  const started = Date.now();
  try {
    const res = await post<ExtractRequest, Descriptor>(
      "/api/ai/reunite/extract",
      req,
    );
    if (res.ok) return { data: res.data, engine: res.engine, latencyMs: res.latencyMs };
    throw new Error(res.error);
  } catch {
    return {
      data: heuristicExtract(req.freeText, {
        ageBand: "unknown",
        gender: "unknown",
        hair: "unknown",
        upperColor: "unknown",
        upperItem: "unknown",
        lowerColor: "unknown",
        lowerItem: "unknown",
        accessories: [],
        distinguishingFeatures: "",
        lastSeenZoneId: req.lastSeenZoneId,
        minutesAgo: req.minutesAgo,
      }),
      engine: "heuristic",
      latencyMs: Date.now() - started,
    };
  }
}

export async function requestMatch(
  req: MatchRequest,
): Promise<{ data: Candidate[]; engine: "gemini" | "heuristic"; latencyMs: number }> {
  const started = Date.now();
  try {
    const res = await post<MatchRequest, Candidate[]>(
      "/api/ai/reunite/match",
      req,
    );
    if (res.ok) return { data: res.data, engine: res.engine, latencyMs: res.latencyMs };
    throw new Error(res.error);
  } catch {
    return {
      data: heuristicMatch({
        descriptor: req.descriptor,
        sightings: req.sightings.map((s) => ({
          id: s.id,
          descriptor: s.descriptor,
          zoneName: s.zoneName,
          notes: s.notes,
          stewardName: s.stewardName,
          zoneId: s.zoneId,
        })),
      }),
      engine: "heuristic",
      latencyMs: Date.now() - started,
    };
  }
}

export async function requestDispatchRationale(
  req: DispatchRationaleRequest,
): Promise<{
  data: DispatchRationaleResult;
  engine: "gemini" | "heuristic";
  latencyMs: number;
}> {
  const started = Date.now();
  try {
    const res = await post<DispatchRationaleRequest, DispatchRationaleResult>(
      "/api/ai/dispatch-rationale",
      req,
    );
    if (res.ok) return { data: res.data, engine: res.engine, latencyMs: res.latencyMs };
    throw new Error(res.error);
  } catch {
    return {
      data: {
        rationale: `${req.chosen.steward.name} is the nearest suitable responder (ETA ${req.chosen.etaSeconds}s).`,
        briefing: `${req.chosen.steward.name}, proceed to the incident and report on arrival.`,
        engine: "heuristic",
      },
      engine: "heuristic",
      latencyMs: Date.now() - started,
    };
  }
}
