/**
 * Client-safe display name for the Gemini model. The real key stays server-side;
 * this is only used for labelling decisions in the ledger.
 */
export const GEMINI_MODEL_PUBLIC =
  process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.0-flash";
