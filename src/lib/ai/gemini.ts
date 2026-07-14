import { GoogleGenAI } from "@google/genai";

// NOTE: This module reads GEMINI_API_KEY and must only be imported from server
// code (API route handlers). It is never referenced by client components.

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const API_KEY = process.env.GEMINI_API_KEY;

export const isGeminiConfigured = Boolean(API_KEY);

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: API_KEY });
  return client;
}

const DEFAULT_TIMEOUT_MS = 9000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("gemini-timeout")), ms),
    ),
  ]);
}

/**
 * Call Gemini with a strict JSON response schema and return the parsed object.
 * Throws on missing key, timeout, or malformed output — callers fall back to
 * the heuristic engine.
 */
export async function generateStructured<T = unknown>(args: {
  system: string;
  prompt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any;
  temperature?: number;
}): Promise<T> {
  if (!isGeminiConfigured) throw new Error("gemini-not-configured");

  const ai = getClient();
  const response = await withTimeout(
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: args.prompt,
      config: {
        systemInstruction: args.system,
        responseMimeType: "application/json",
        responseSchema: args.schema,
        temperature: args.temperature ?? 0.5,
        maxOutputTokens: 2048,
      },
    }),
    DEFAULT_TIMEOUT_MS,
  );

  const text = response.text;
  if (!text) throw new Error("gemini-empty-response");
  return JSON.parse(text) as T;
}
