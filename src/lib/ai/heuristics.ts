import type {
  BriefingResult,
  Candidate,
  Descriptor,
  ForecastResult,
  Incident,
  Snapshot,
  TriageResult,
  ZoneTelemetry,
} from "@/lib/schemas/domain";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { INCIDENT_META, densityToRisk } from "@/lib/constants";

/**
 * Deterministic fallback "reasoning" used when Gemini is not configured or a
 * call fails. Produces the same validated shapes so the product is fully
 * functional offline — clearly labelled `engine: "heuristic"` in the UI.
 */

const BASE_SEVERITY: Record<string, number> = {
  medical: 4,
  fire: 5,
  crowd: 4,
  security: 3,
  "lost-child": 3,
  infrastructure: 2,
};

export function heuristicTriage(input: {
  incident: Incident;
  zoneTelemetry: ZoneTelemetry | null;
  openIncidentCount: number;
}): TriageResult {
  const { incident, zoneTelemetry, openIncidentCount } = input;
  const meta = INCIDENT_META[incident.type];
  let severity = BASE_SEVERITY[incident.type] ?? 3;
  const density = zoneTelemetry?.density ?? 0;
  if (density >= 90) severity = Math.min(5, severity + 1);
  if (zoneTelemetry?.trend === "rising" && density >= 70)
    severity = Math.min(5, severity + 1);
  if (incident.type === "infrastructure" && density < 40)
    severity = Math.max(1, severity - 1);

  const zoneName = ZONE_MAP[incident.zoneId]?.name ?? incident.zoneId;
  const reasoning = [
    `Incident type ${meta.label} carries a baseline severity of ${BASE_SEVERITY[incident.type]}.`,
    `${zoneName} is at ${Math.round(density)}% density and ${
      zoneTelemetry?.trend ?? "steady"
    }.`,
    density >= 90
      ? "High local density raises the escalation risk, so severity is stepped up."
      : "Local density is within tolerance for now.",
    `${openIncidentCount} other incidents are open, factored into prioritisation.`,
    `Final severity assessed at ${severity}, requiring a ${meta.skill} responder.`,
  ];

  const actionsByType: Record<string, string[]> = {
    medical: [
      `Dispatch nearest medical steward to ${zoneName}`,
      "Clear an access route for medics",
      "Prepare medical bay for possible transfer",
    ],
    security: [
      `Send security steward to ${zoneName}`,
      "Monitor CCTV for escalation",
      "Ready a second unit if the situation grows",
    ],
    crowd: [
      `Relieve density in ${zoneName} by opening adjacent flow`,
      "Hold further inflow into the zone",
      "Position stewards at pinch points",
    ],
    fire: [
      `Evacuate the immediate area around ${zoneName}`,
      "Alert fire response and cut nearby power if needed",
      "Establish a cordon",
    ],
    "lost-child": [
      "Open a Reunite case and extract a descriptor",
      `Sweep ${zoneName} and adjacent zones`,
      "Brief nearby stewards to watch for the child",
    ],
    infrastructure: [
      `Secure the affected asset in ${zoneName}`,
      "Reroute footfall around the hazard",
      "Log for maintenance follow-up",
    ],
  };

  return {
    severity,
    priorityRank: 0,
    confidence: 0.72,
    rationale: `${meta.label} at ${zoneName} with ${Math.round(
      density,
    )}% local density — assessed severity ${severity}.`,
    recommendedActions: actionsByType[incident.type] ?? [
      `Dispatch a responder to ${zoneName}`,
    ],
    reasoning,
    requiredSkill: meta.skill,
    engine: "heuristic",
  };
}

export function heuristicForecast(input: {
  snapshot: Snapshot;
  telemetry: ZoneTelemetry[];
  trends: Record<string, number[]>;
}): ForecastResult {
  const { snapshot, telemetry, trends } = input;
  const phaseBias =
    snapshot.phase === "first-half"
      ? { concourse: 34, facility: 12 } // will spike toward halftime
      : snapshot.phase === "halftime"
        ? { concourse: -20, facility: -10 }
        : snapshot.phase === "second-half"
          ? { concourse: 10, gate: 20 }
          : {};

  const zones = telemetry
    .filter((t) => ZONE_MAP[t.zoneId]?.kind !== "pitch")
    .map((t) => {
      const kind = ZONE_MAP[t.zoneId]?.kind ?? "stand";
      const hist = trends[t.zoneId] ?? [];
      const slope =
        hist.length >= 2 ? hist[hist.length - 1] - hist[hist.length - 3] : 0;
      const bias = (phaseBias as Record<string, number>)[kind] ?? 0;
      const predicted = Math.max(
        0,
        Math.min(130, t.density + slope * 1.5 + bias),
      );
      return {
        zoneId: t.zoneId,
        currentDensity: t.density,
        predictedDensity: predicted,
        horizonMinutes: 15,
        predictedRisk: densityToRisk(predicted),
        confidence: 0.68,
        reasoning: `${ZONE_MAP[t.zoneId]?.name} trending ${
          slope > 1 ? "up" : slope < -1 ? "down" : "flat"
        }; phase ${snapshot.phase} adds ${bias >= 0 ? "+" : ""}${bias}.`,
      };
    });

  const proactiveAlerts = zones
    .filter((z) => z.predictedRisk === "crowded" || z.predictedRisk === "critical")
    .slice(0, 4)
    .map((z) => ({
      zoneId: z.zoneId,
      severity: z.predictedRisk === "critical" ? 4 : 3,
      message: `${ZONE_MAP[z.zoneId]?.name} projected to reach ${Math.round(
        z.predictedDensity,
      )}% (${z.predictedRisk}) within 15 minutes.`,
      recommendedActions: [
        `Pre-position stewards near ${ZONE_MAP[z.zoneId]?.name}`,
        "Open an alternate flow route",
        "Throttle inflow if density keeps rising",
      ],
    }));

  return {
    summary: `Pressure index ${Math.round(
      snapshot.pressureIndex,
    )}/100. ${proactiveAlerts.length} zone(s) projected to crowd within 15 minutes.`,
    zones,
    proactiveAlerts,
    reasoning: [
      `Match phase is ${snapshot.phase}; density biases applied by zone type.`,
      "Per-zone slope extrapolated from recent density history.",
      `${proactiveAlerts.length} zone(s) cross the crowded threshold in the forecast window.`,
    ],
    engine: "heuristic",
  };
}

const COLORS = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "pink",
  "black",
  "white",
  "orange",
  "grey",
  "gray",
  "brown",
  "navy",
  "beige",
];
const UPPER_ITEMS = [
  "hoodie",
  "jacket",
  "raincoat",
  "coat",
  "t-shirt",
  "tshirt",
  "shirt",
  "jumper",
  "sweater",
  "cardigan",
  "top",
  "vest",
];
const LOWER_ITEMS = [
  "tracksuit bottoms",
  "tracksuit",
  "joggers",
  "leggings",
  "jeans",
  "trousers",
  "shorts",
  "skirt",
  "dungarees",
];
const ACCESSORIES = [
  "glasses",
  "backpack",
  "rucksack",
  "cap",
  "hat",
  "wellington boots",
  "wellies",
  "boots",
  "trainers",
  "sneakers",
  "scarf",
  "gloves",
  "umbrella",
  "hair clip",
  "dinosaur toy",
  "toy",
];

/** Colour appearing closest before a given word index in the text. */
function colorBefore(text: string, itemIndex: number): string | null {
  let best: { color: string; idx: number } | null = null;
  for (const c of COLORS) {
    const idx = text.lastIndexOf(c, itemIndex);
    if (idx >= 0 && idx < itemIndex && (!best || idx > best.idx)) {
      best = { color: c, idx };
    }
  }
  return best?.color ?? null;
}

/**
 * Keyword-based descriptor extraction used when Gemini is unavailable. Parses
 * clothing items + colours, hair, age band, gender and accessories so the
 * offline demo still produces a rich, plausible descriptor.
 */
export function heuristicExtract(freeText: string, fallback: Descriptor): Descriptor {
  const text = freeText.toLowerCase();

  const findItem = (items: string[]) => {
    for (const item of items) {
      const idx = text.indexOf(item);
      if (idx >= 0) return { item, idx };
    }
    return null;
  };

  const upper = findItem(UPPER_ITEMS);
  const lower = findItem(LOWER_ITEMS);
  const colors = COLORS.filter((c) => text.includes(c));

  // Age band
  let ageBand = fallback.ageBand;
  const ageMatch = text.match(/(\d{1,2})\s*(?:years?|yrs?|yo)?\s*old|age\s*(\d{1,2})|(\d{1,2})\s*years/);
  const ageNum = ageMatch
    ? Number(ageMatch[1] ?? ageMatch[2] ?? ageMatch[3])
    : text.includes("toddler") || text.includes("baby")
      ? 3
      : text.includes("teen")
        ? 13
        : null;
  if (ageNum !== null) {
    ageBand =
      ageNum <= 3 ? "toddler" : ageNum <= 7 ? "child" : ageNum <= 10 ? "pre-teen" : "teen";
  }

  // Gender
  let gender = fallback.gender;
  if (/\b(son|boy|he|his|brother|grandson|nephew)\b/.test(text)) gender = "boy";
  else if (/\b(daughter|girl|she|her|sister|granddaughter|niece)\b/.test(text))
    gender = "girl";

  // Hair
  const hairStyles = [
    "braids",
    "ponytail",
    "afro",
    "curly",
    "straight",
    "wavy",
    "bob",
    "buzzcut",
  ];
  const hairColor = ["blonde", "brown", "black", "red", "ginger", "dark", "fair"].find((c) =>
    new RegExp(`${c}[^.]*hair|hair[^.]*${c}`).test(text),
  );
  const hairStyle = hairStyles.find((s) => text.includes(s));
  const hair =
    [hairColor, hairStyle].filter(Boolean).join(" ") || fallback.hair;

  // Accessories
  const accessories = ACCESSORIES.filter((a) => text.includes(a));
  // De-duplicate overlaps (e.g. "boots" when "wellington boots" matched).
  const filteredAccessories = accessories.filter(
    (a) => !accessories.some((b) => b !== a && b.includes(a)),
  );

  const upperColor = upper ? colorBefore(text, upper.idx) : colors[0] ?? null;
  const lowerColor = lower ? colorBefore(text, lower.idx) : colors[1] ?? null;

  return {
    ...fallback,
    ageBand,
    gender,
    hair,
    upperColor: upperColor ?? fallback.upperColor,
    upperItem: upper?.item ?? fallback.upperItem,
    lowerColor: lowerColor ?? fallback.lowerColor,
    lowerItem: lower?.item ?? fallback.lowerItem,
    accessories: filteredAccessories.length ? filteredAccessories : fallback.accessories,
  };
}

export function heuristicMatch(input: {
  descriptor: Descriptor;
  sightings: { id: string; descriptor: Descriptor; zoneName: string; notes: string; stewardName: string; zoneId: string }[];
}): Candidate[] {
  const d = input.descriptor;
  return input.sightings
    .map((s) => {
      const sd = s.descriptor;
      const checks: { attribute: string; a: string; b: string }[] = [
        { attribute: "Age band", a: d.ageBand, b: sd.ageBand },
        { attribute: "Upper colour", a: d.upperColor, b: sd.upperColor },
        { attribute: "Upper item", a: d.upperItem, b: sd.upperItem },
        { attribute: "Lower colour", a: d.lowerColor, b: sd.lowerColor },
        { attribute: "Hair", a: d.hair, b: sd.hair },
      ];
      const perAttribute = checks.map((c) => {
        const a = c.a.toLowerCase();
        const b = c.b.toLowerCase();
        const match =
          a === b || a.includes(b) || b.includes(a)
            ? "match"
            : a.split(" ").some((w) => w.length > 2 && b.includes(w))
              ? "partial"
              : "mismatch";
        return {
          attribute: c.attribute,
          match: match as "match" | "partial" | "mismatch",
          note: `${c.a} vs ${c.b}`,
        };
      });
      const score =
        perAttribute.reduce(
          (sum, p) =>
            sum + (p.match === "match" ? 1 : p.match === "partial" ? 0.5 : 0),
          0,
        ) / perAttribute.length;
      return {
        sightingId: s.id,
        stewardName: s.stewardName,
        zoneId: s.zoneId,
        score,
        rationale: `${perAttribute.filter((p) => p.match === "match").length}/${
          perAttribute.length
        } attributes match strongly.`,
        perAttribute,
        engine: "heuristic" as const,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function heuristicBriefing(input: {
  snapshot: Snapshot;
  hotZones: ZoneTelemetry[];
  openIncidents: number;
}): BriefingResult {
  const { snapshot, hotZones, openIncidents } = input;
  const hottest = hotZones[0];
  return {
    headline: `Pressure ${Math.round(snapshot.pressureIndex)}/100 · ${openIncidents} open incident(s)`,
    narrative: `The stadium is in ${snapshot.phase} with a pressure index of ${Math.round(
      snapshot.pressureIndex,
    )}. ${
      hottest
        ? `${ZONE_MAP[hottest.zoneId]?.name} is the hottest zone at ${Math.round(
            hottest.density,
          )}% and ${hottest.trend}.`
        : "All zones are comfortable."
    } ${openIncidents > 0 ? `${openIncidents} incident(s) are being managed.` : "No active incidents."}`,
    watchItems: hotZones
      .slice(0, 3)
      .map(
        (z) =>
          `${ZONE_MAP[z.zoneId]?.name} — ${Math.round(z.density)}% (${z.risk})`,
      ),
    engine: "heuristic",
  };
}
