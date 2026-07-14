import { Type } from "@google/genai";

/**
 * Gemini `responseSchema` contracts. These mirror the Zod domain schemas so
 * model output can be re-validated with Zod after parsing.
 */

export const triageSchema = {
  type: Type.OBJECT,
  properties: {
    severity: {
      type: Type.INTEGER,
      description: "1 (minor) to 5 (life-threatening / mass-casualty risk).",
    },
    confidence: { type: Type.NUMBER, description: "0..1 confidence." },
    requiredSkill: {
      type: Type.STRING,
      enum: ["medical", "security", "guest-services", "any"],
    },
    rationale: {
      type: Type.STRING,
      description: "One or two sentences justifying the severity.",
    },
    reasoning: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 step chain of observations → inferences → decision.",
    },
    recommendedActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-4 concrete, imperative actions for the operator.",
    },
  },
  required: [
    "severity",
    "confidence",
    "requiredSkill",
    "rationale",
    "reasoning",
    "recommendedActions",
  ],
};

export const forecastSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    reasoning: { type: Type.ARRAY, items: { type: Type.STRING } },
    zones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          zoneId: { type: Type.STRING },
          predictedDensity: { type: Type.NUMBER },
          predictedRisk: {
            type: Type.STRING,
            enum: ["calm", "busy", "crowded", "critical"],
          },
          confidence: { type: Type.NUMBER },
          reasoning: { type: Type.STRING },
        },
        required: [
          "zoneId",
          "predictedDensity",
          "predictedRisk",
          "confidence",
          "reasoning",
        ],
      },
    },
    proactiveAlerts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          zoneId: { type: Type.STRING },
          severity: { type: Type.INTEGER },
          message: { type: Type.STRING },
          recommendedActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["zoneId", "severity", "message", "recommendedActions"],
      },
    },
  },
  required: ["summary", "reasoning", "zones", "proactiveAlerts"],
};

export const descriptorSchema = {
  type: Type.OBJECT,
  properties: {
    ageBand: {
      type: Type.STRING,
      enum: ["toddler", "child", "pre-teen", "teen", "unknown"],
    },
    gender: { type: Type.STRING, enum: ["boy", "girl", "unknown"] },
    hair: { type: Type.STRING },
    upperColor: { type: Type.STRING },
    upperItem: { type: Type.STRING },
    lowerColor: { type: Type.STRING },
    lowerItem: { type: Type.STRING },
    accessories: { type: Type.ARRAY, items: { type: Type.STRING } },
    distinguishingFeatures: { type: Type.STRING },
  },
  required: [
    "ageBand",
    "gender",
    "hair",
    "upperColor",
    "upperItem",
    "lowerColor",
    "lowerItem",
    "accessories",
    "distinguishingFeatures",
  ],
};

export const matchSchema = {
  type: Type.OBJECT,
  properties: {
    candidates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sightingId: { type: Type.STRING },
          score: { type: Type.NUMBER, description: "0..1 match confidence." },
          rationale: { type: Type.STRING },
          perAttribute: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                attribute: { type: Type.STRING },
                match: {
                  type: Type.STRING,
                  enum: ["match", "partial", "mismatch"],
                },
                note: { type: Type.STRING },
              },
              required: ["attribute", "match", "note"],
            },
          },
        },
        required: ["sightingId", "score", "rationale", "perAttribute"],
      },
    },
  },
  required: ["candidates"],
};

export const briefingSchema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    narrative: { type: Type.STRING },
    watchItems: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["headline", "narrative", "watchItems"],
};

export const dispatchRationaleSchema = {
  type: Type.OBJECT,
  properties: {
    rationale: { type: Type.STRING },
    briefing: { type: Type.STRING },
  },
  required: ["rationale", "briefing"],
};
