import type {
  Descriptor,
  Incident,
  IncidentType,
  ReuniteCase,
} from "@/lib/schemas/domain";
import { ZONES, ZONE_MAP } from "@/lib/stadium/zones";
import { densityToRisk } from "@/lib/constants";
import { uid } from "@/lib/utils";

type Rng = () => number;

function pick<T>(rng: Rng, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const INCIDENT_TEMPLATES: Record<
  IncidentType,
  { titles: string[]; descriptions: string[]; baseSeverity: number }
> = {
  medical: {
    titles: [
      "Fan collapse reported",
      "Suspected cardiac event",
      "Spectator fainted",
      "Fall with head injury",
      "Severe allergic reaction",
    ],
    descriptions: [
      "A spectator has collapsed and is unresponsive. Bystanders requesting urgent medical help.",
      "Adult male clutching chest, short of breath. Possible cardiac event.",
      "Spectator fainted in the seating bowl, now conscious but disoriented.",
      "Fan slipped on the stairs, visible head injury and bleeding.",
    ],
    baseSeverity: 4,
  },
  security: {
    titles: [
      "Altercation between fans",
      "Unauthorised pitch approach",
      "Aggressive crowd behaviour",
      "Ejection required",
    ],
    descriptions: [
      "Verbal altercation escalating to pushing between rival supporters.",
      "Individual attempting to breach the pitch perimeter.",
      "Group displaying aggressive behaviour, intimidating nearby families.",
    ],
    baseSeverity: 3,
  },
  crowd: {
    titles: [
      "Dangerous crowd density",
      "Crushing risk at barrier",
      "Bottleneck forming",
      "Surge against railing",
    ],
    descriptions: [
      "Density approaching critical levels with pressure building against the front barrier.",
      "Sudden crowd surge creating a crushing risk near the concourse exit.",
      "Severe bottleneck forming, movement has stalled.",
    ],
    baseSeverity: 4,
  },
  fire: {
    titles: ["Smoke reported", "Pyrotechnic device lit", "Small fire in bin"],
    descriptions: [
      "Smoke seen rising from the concourse. Source unconfirmed.",
      "Supporter has lit a flare in the stand, smoke spreading.",
      "Small fire reported in a waste bin, contained for now.",
    ],
    baseSeverity: 4,
  },
  "lost-child": {
    titles: ["Lost child reported"],
    descriptions: ["A guardian has reported a missing child."],
    baseSeverity: 3,
  },
  infrastructure: {
    titles: [
      "Barrier damage",
      "Escalator malfunction",
      "Power fault in concourse",
      "Blocked exit route",
    ],
    descriptions: [
      "A crowd barrier has come loose and needs immediate securing.",
      "Escalator has stopped abruptly, minor injuries possible.",
      "Lighting failure in a section of the concourse.",
    ],
    baseSeverity: 2,
  },
};

export function makeIncident(
  rng: Rng,
  type: IncidentType,
  zoneId?: string,
  now = Date.now(),
): Incident {
  const template = INCIDENT_TEMPLATES[type];
  const candidateZones =
    type === "crowd"
      ? ZONES.filter((z) => z.kind !== "pitch")
      : ZONES.filter((z) => z.kind !== "pitch");
  const zone = zoneId ?? pick(rng, candidateZones).id;
  const severity = Math.min(
    5,
    Math.max(1, template.baseSeverity + (rng() < 0.25 ? 1 : 0) - (rng() < 0.2 ? 1 : 0)),
  );
  return {
    id: uid("inc"),
    createdAt: now,
    type,
    zoneId: zone,
    severity,
    status: "open",
    title: pick(rng, template.titles),
    description: pick(rng, template.descriptions),
    triage: null,
    resolvedAt: null,
  };
}

/* ---------------------------------------------------------- Lost children */

const CHILDREN: {
  name: string;
  free: string;
  descriptor: Omit<Descriptor, "lastSeenZoneId" | "minutesAgo">;
  reporter: string;
}[] = [
  {
    name: "Leo",
    reporter: "Marcus (father)",
    free: "My son Leo is 6, he was wearing a bright red FC Meridian shirt and blue jeans, with white trainers. He has short curly brown hair and was carrying a small dinosaur toy. He wandered off near the food court about 5 minutes ago.",
    descriptor: {
      ageBand: "child",
      gender: "boy",
      hair: "short curly brown",
      upperColor: "red",
      upperItem: "FC Meridian shirt",
      lowerColor: "blue",
      lowerItem: "jeans",
      accessories: ["white trainers", "dinosaur toy"],
      distinguishingFeatures: "carrying a small green dinosaur toy",
    },
  },
  {
    name: "Amara",
    reporter: "Sophie (mother)",
    free: "Amara is 4 years old, wearing a yellow raincoat and black leggings, pink wellington boots. She has two small braids and a butterfly hair clip. Last seen by the north gate a couple of minutes ago.",
    descriptor: {
      ageBand: "toddler",
      gender: "girl",
      hair: "two braids with butterfly clip",
      upperColor: "yellow",
      upperItem: "raincoat",
      lowerColor: "black",
      lowerItem: "leggings",
      accessories: ["pink wellington boots", "butterfly hair clip"],
      distinguishingFeatures: "butterfly hair clip",
    },
  },
  {
    name: "Daniel",
    reporter: "Priya (aunt)",
    free: "Daniel, about 9, has a green hoodie and grey tracksuit bottoms, black backpack. Tall for his age with glasses and a short afro. He went to buy a drink and didn't come back, maybe near the east stand.",
    descriptor: {
      ageBand: "pre-teen",
      gender: "boy",
      hair: "short afro",
      upperColor: "green",
      upperItem: "hoodie",
      lowerColor: "grey",
      lowerItem: "tracksuit bottoms",
      accessories: ["black backpack", "glasses"],
      distinguishingFeatures: "wears glasses, tall for age",
    },
  },
  {
    name: "Mia",
    reporter: "James (father)",
    free: "Mia is 7, purple hoodie with a unicorn on it, white skirt and purple leggings. Long blonde hair in a ponytail. She was near the fan zone when we lost her a few minutes ago.",
    descriptor: {
      ageBand: "child",
      gender: "girl",
      hair: "long blonde ponytail",
      upperColor: "purple",
      upperItem: "unicorn hoodie",
      lowerColor: "white",
      lowerItem: "skirt over purple leggings",
      accessories: ["ponytail"],
      distinguishingFeatures: "unicorn design on hoodie",
    },
  },
];

const CHILD_ZONES = ["facility-food", "gate-n", "stand-e", "facility-fanzone", "concourse-s"];

export function makeReuniteCase(rng: Rng, now = Date.now()): ReuniteCase {
  const child = pick(rng, CHILDREN);
  const lastSeenZoneId = pick(rng, CHILD_ZONES);
  const minutesAgo = 2 + Math.floor(rng() * 6);
  return {
    id: uid("rnt"),
    status: "reported",
    childName: child.name,
    reporterName: child.reporter,
    reporterContact: `+44 7${Math.floor(100000000 + rng() * 899999999)}`,
    freeText: child.free,
    descriptor: { ...child.descriptor, lastSeenZoneId, minutesAgo },
    candidates: [],
    createdAt: now,
    reunitedAt: null,
    timeline: [
      {
        t: now,
        label: "reported",
        detail: `${child.reporter} reported ${child.name} missing near ${ZONE_MAP[lastSeenZoneId]?.name}.`,
      },
    ],
  };
}

/** Public label helper for risk (re-exported for engine convenience). */
export { densityToRisk };
