import { NextResponse } from "next/server";
import type { AiResponse } from "@/lib/ai/contracts";

/**
 * Server-side API guards shared by every /api/* route: rate limiting, request
 * size limits, safe JSON parsing, request IDs and structured errors.
 *
 * The rate limiter is an in-memory fixed-window counter — sufficient to blunt
 * abuse per serverless instance. For multi-instance production, back it with a
 * durable store (e.g. Upstash Redis); the interface stays the same.
 */

const WINDOW_MS = 15_000;
const MAX_REQUESTS = 40; // per IP per window, per instance
const MAX_BODY_BYTES = 64 * 1024; // 64 KB — AI payloads are a few KB

interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map can't grow unbounded (DoS via many IPs).
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function newRequestId(): string {
  // crypto.randomUUID is available in the Node.js and Edge runtimes.
  try {
    return crypto.randomUUID();
  } catch {
    return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
}

/** Fixed-window rate limit. Returns null if allowed, or seconds-to-retry. */
export function rateLimit(
  key: string,
  limit = MAX_REQUESTS,
  windowMs = WINDOW_MS,
): number | null {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (bucket.count >= limit) {
    return Math.ceil((bucket.resetAt - now) / 1000);
  }
  bucket.count += 1;
  return null;
}

function errorResponse(
  status: number,
  error: string,
  requestId: string,
  extraHeaders?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { ok: false, error } satisfies AiResponse<never>,
    {
      status,
      headers: { "x-request-id": requestId, ...extraHeaders },
    },
  );
}

export interface Preflight {
  body: unknown;
  requestId: string;
  ip: string;
}

/**
 * Run before handling any API request. Rejects (returns a Response) on rate
 * limit, oversized body, wrong content-type, or malformed JSON; otherwise
 * returns the parsed body + a request id. Never leaks internals.
 */
export async function preflight(
  request: Request,
  opts: { rateKeyPrefix: string; limit?: number; maxBytes?: number } = {
    rateKeyPrefix: "api",
  },
): Promise<{ ok: true; ctx: Preflight } | { ok: false; response: NextResponse }> {
  const requestId = newRequestId();
  const ip = getClientIp(request);

  // 1. Rate limit
  const retry = rateLimit(`${opts.rateKeyPrefix}:${ip}`, opts.limit);
  if (retry !== null) {
    return {
      ok: false,
      response: errorResponse(429, "rate-limited", requestId, {
        "Retry-After": String(retry),
      }),
    };
  }

  // 2. Content-Type must be JSON (also blunts simple cross-site form posts)
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { ok: false, response: errorResponse(415, "unsupported-media-type", requestId) };
  }

  // 3. Size limit — check declared length, then enforce on the actual bytes
  const declared = Number(request.headers.get("content-length") ?? "0");
  const maxBytes = opts.maxBytes ?? MAX_BODY_BYTES;
  if (declared > maxBytes) {
    return { ok: false, response: errorResponse(413, "payload-too-large", requestId) };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { ok: false, response: errorResponse(400, "invalid-body", requestId) };
  }
  if (raw.length > maxBytes) {
    return { ok: false, response: errorResponse(413, "payload-too-large", requestId) };
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { ok: false, response: errorResponse(400, "invalid-json", requestId) };
  }

  return { ok: true, ctx: { body, requestId, ip } };
}

/** Structured validation-failure response (Zod). */
export function invalidRequest(requestId: string): NextResponse {
  return errorResponse(422, "invalid-request", requestId);
}

/** Success envelope with a request id header for correlation. */
export function aiSuccess<T>(
  data: T,
  engine: "gemini" | "heuristic",
  latencyMs: number,
  requestId: string,
): NextResponse {
  return NextResponse.json(
    { ok: true, engine, data, latencyMs } satisfies AiResponse<T>,
    { headers: { "x-request-id": requestId } },
  );
}
