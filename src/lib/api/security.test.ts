import { describe, expect, it } from "vitest";
import {
  aiSuccess,
  getClientIp,
  invalidRequest,
  newRequestId,
  preflight,
  rateLimit,
} from "@/lib/api/security";

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  const raw = JSON.stringify(body);
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": String(raw.length),
      ...headers,
    },
    body: raw,
  });
}

describe("rateLimit", () => {
  it("allows up to the limit then reports a retry delay", () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 2, 10_000)).toBeNull();
    expect(rateLimit(key, 2, 10_000)).toBeNull();
    const retry = rateLimit(key, 2, 10_000);
    expect(retry).not.toBeNull();
    expect(retry!).toBeGreaterThan(0);
  });

  it("uses independent buckets per key", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(rateLimit(a, 1, 10_000)).toBeNull();
    expect(rateLimit(a, 1, 10_000)).not.toBeNull();
    // b is untouched by a's exhaustion
    expect(rateLimit(b, 1, 10_000)).toBeNull();
  });
});

describe("getClientIp", () => {
  it("prefers the first x-forwarded-for entry", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip then 'unknown'", () => {
    expect(
      getClientIp(new Request("http://x", { headers: { "x-real-ip": "198.51.100.7" } })),
    ).toBe("198.51.100.7");
    expect(getClientIp(new Request("http://x"))).toBe("unknown");
  });
});

describe("newRequestId", () => {
  it("returns distinct non-empty ids", () => {
    const a = newRequestId();
    const b = newRequestId();
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });
});

describe("preflight", () => {
  it("passes a well-formed JSON request and returns the parsed body", async () => {
    const res = await preflight(jsonRequest({ hello: "world" }), {
      rateKeyPrefix: `ok-${Math.random()}`,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.ctx.body).toEqual({ hello: "world" });
      expect(res.ctx.requestId).toBeTruthy();
    }
  });

  it("rejects a non-JSON content type with 415", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "hello",
    });
    const res = await preflight(req, { rateKeyPrefix: `ct-${Math.random()}` });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(415);
  });

  it("rejects an oversized declared body with 413", async () => {
    const req = jsonRequest({ big: "x" }, { "content-length": "999999" });
    const res = await preflight(req, {
      rateKeyPrefix: `sz-${Math.random()}`,
      maxBytes: 100,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(413);
  });

  it("rejects malformed JSON with 400", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "5" },
      body: "{bad}",
    });
    const res = await preflight(req, { rateKeyPrefix: `bad-${Math.random()}` });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(400);
  });

  it("rate-limits after the configured number of requests", async () => {
    const prefix = `rl-${Math.random()}`;
    await preflight(jsonRequest({ n: 1 }), { rateKeyPrefix: prefix, limit: 1 });
    const blocked = await preflight(jsonRequest({ n: 2 }), {
      rateKeyPrefix: prefix,
      limit: 1,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.response.status).toBe(429);
      expect(blocked.response.headers.get("Retry-After")).toBeTruthy();
    }
  });
});

describe("response envelopes", () => {
  it("invalidRequest returns 422 with an error body", async () => {
    const res = invalidRequest("req-1");
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body).toMatchObject({ ok: false, error: "invalid-request" });
    expect(res.headers.get("x-request-id")).toBe("req-1");
  });

  it("aiSuccess wraps data with engine, latency and a request id", async () => {
    const res = aiSuccess({ value: 1 }, "heuristic", 42, "req-2");
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      engine: "heuristic",
      data: { value: 1 },
      latencyMs: 42,
    });
    expect(res.headers.get("x-request-id")).toBe("req-2");
  });
});
