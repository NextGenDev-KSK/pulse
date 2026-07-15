import { describe, expect, it } from "vitest";
import { POST as triagePOST } from "@/app/api/ai/triage/route";
import { POST as extractPOST } from "@/app/api/ai/reunite/extract/route";
import { POST as matchPOST } from "@/app/api/ai/reunite/match/route";
import { POST as forecastPOST } from "@/app/api/ai/forecast/route";
import { POST as briefingPOST } from "@/app/api/ai/briefing/route";
import { POST as dispatchPOST } from "@/app/api/ai/dispatch-rationale/route";

/**
 * Integration tests for the AI route handlers. No GEMINI_API_KEY is set in the
 * test environment, so every route must gracefully fall back to its
 * deterministic heuristic engine and still return a valid success envelope.
 */

let ipCounter = 0;
function jsonReq(body: unknown, headers: Record<string, string> = {}) {
  const raw = JSON.stringify(body);
  // Unique IP per request so the fixed-window rate limiter never bleeds
  // between unrelated test cases.
  return new Request("http://localhost/api", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": String(raw.length),
      "x-forwarded-for": `10.0.0.${ipCounter++}`,
      ...headers,
    },
    body: raw,
  });
}

const zoneTelemetry = {
  zoneId: "concourse-n",
  t: 0,
  density: 88,
  occupancy: 3000,
  inflow: 12,
  outflow: 6,
  queueLength: 0,
  risk: "crowded" as const,
  trend: "rising" as const,
};

const snapshot = {
  t: 0,
  matchClock: 600,
  phase: "first-half" as const,
  attendance: 60000,
  capacity: 62000,
  pressureIndex: 62,
  avgDensity: 55,
  weather: { tempC: 18, condition: "clear" as const, windKph: 10 },
};

const incident = {
  id: "inc_1",
  createdAt: 0,
  type: "medical" as const,
  zoneId: "concourse-n",
  severity: 4,
  status: "open" as const,
  title: "Fan collapse",
  description: "A spectator collapsed and is unresponsive near the kiosk.",
  triage: null,
  resolvedAt: null,
};

const descriptor = {
  ageBand: "child" as const,
  gender: "boy" as const,
  hair: "brown",
  upperColor: "red",
  upperItem: "shirt",
  lowerColor: "blue",
  lowerItem: "jeans",
  accessories: ["dinosaur toy"],
  distinguishingFeatures: "",
  lastSeenZoneId: "facility-food",
  minutesAgo: 5,
};

async function body(res: Response) {
  return res.json() as Promise<Record<string, unknown>>;
}

describe("POST /api/ai/triage", () => {
  it("falls back to the heuristic engine and returns a valid envelope", async () => {
    const res = await triagePOST(
      jsonReq({
        incident,
        snapshot,
        zoneTelemetry,
        neighborTelemetry: [zoneTelemetry],
        openIncidentCount: 1,
      }),
    );
    expect(res.status).toBe(200);
    const json = await body(res);
    expect(json.ok).toBe(true);
    expect(json.engine).toBe("heuristic");
    expect((json.data as { severity: number }).severity).toBeGreaterThanOrEqual(1);
    expect(res.headers.get("x-request-id")).toBeTruthy();
  });

  it("rejects a malformed request body with 422", async () => {
    const res = await triagePOST(jsonReq({ incident: { bad: true } }));
    expect(res.status).toBe(422);
    expect((await body(res)).error).toBe("invalid-request");
  });

  it("rejects a non-JSON content type with 415", async () => {
    const req = new Request("http://localhost/api", {
      method: "POST",
      headers: {
        "content-type": "text/plain",
        "x-forwarded-for": `10.9.9.${ipCounter++}`,
      },
      body: "hello",
    });
    const res = await triagePOST(req);
    expect(res.status).toBe(415);
  });
});

describe("POST /api/ai/reunite/extract", () => {
  it("extracts a descriptor via the heuristic engine", async () => {
    const res = await extractPOST(
      jsonReq({
        freeText: "lost boy in a red shirt and blue jeans near the food court",
        lastSeenZoneId: "facility-food",
        minutesAgo: 4,
      }),
    );
    expect(res.status).toBe(200);
    const json = await body(res);
    expect(json.ok).toBe(true);
    expect((json.data as { upperColor: string }).upperColor).toBe("red");
  });
});

describe("POST /api/ai/reunite/match", () => {
  it("scores sightings with the heuristic matcher", async () => {
    const res = await matchPOST(
      jsonReq({
        descriptor,
        sightings: [
          {
            id: "sg1",
            stewardName: "Mia Chen",
            zoneId: "facility-food",
            zoneName: "Food Court",
            notes: "calm child",
            descriptor,
          },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const json = await body(res);
    expect(Array.isArray(json.data)).toBe(true);
    expect((json.data as unknown[]).length).toBe(1);
  });
});

describe("POST /api/ai/forecast", () => {
  it("returns a heuristic forecast", async () => {
    const res = await forecastPOST(
      jsonReq({
        snapshot,
        telemetry: [zoneTelemetry],
        trends: { "concourse-n": [70, 80, 88] },
      }),
    );
    expect(res.status).toBe(200);
    const json = await body(res);
    expect(json.ok).toBe(true);
    expect((json.data as { zones: unknown[] }).zones).toBeDefined();
  });
});

describe("POST /api/ai/briefing", () => {
  it("returns a heuristic briefing", async () => {
    const res = await briefingPOST(
      jsonReq({ snapshot, hotZones: [zoneTelemetry], openIncidents: 2 }),
    );
    expect(res.status).toBe(200);
    expect((await body(res)).ok).toBe(true);
  });
});

describe("POST /api/ai/dispatch-rationale", () => {
  it("returns a heuristic rationale and briefing", async () => {
    const res = await dispatchPOST(
      jsonReq({
        incident,
        chosen: {
          steward: {
            id: "stw-01",
            name: "Priya Sharma",
            skills: ["medical"],
            status: "available",
            zoneId: "concourse-w",
            taskId: null,
          },
          etaSeconds: 90,
        },
        alternatives: [],
      }),
    );
    expect(res.status).toBe(200);
    const json = await body(res);
    expect(json.ok).toBe(true);
    expect((json.data as { rationale: string }).rationale).toContain("Priya");
  });
});
