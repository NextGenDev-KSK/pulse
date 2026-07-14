import type { Descriptor, ReuniteCase, Sighting } from "@/lib/schemas/domain";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { createRng, uid } from "@/lib/utils";

const STEWARD_POOL = [
  "Priya Sharma",
  "Diego Alvarez",
  "Mia Chen",
  "Kwame Mensah",
  "Sofia Rossi",
  "Aisha Bello",
];

const DECOY_DESCRIPTORS: Omit<Descriptor, "lastSeenZoneId" | "minutesAgo">[] = [
  {
    ageBand: "child",
    gender: "boy",
    hair: "short black",
    upperColor: "blue",
    upperItem: "jacket",
    lowerColor: "black",
    lowerItem: "shorts",
    accessories: ["cap"],
    distinguishingFeatures: "",
  },
  {
    ageBand: "child",
    gender: "girl",
    hair: "brown ponytail",
    upperColor: "green",
    upperItem: "t-shirt",
    lowerColor: "blue",
    lowerItem: "jeans",
    accessories: [],
    distinguishingFeatures: "",
  },
  {
    ageBand: "pre-teen",
    gender: "boy",
    hair: "curly brown",
    upperColor: "red",
    upperItem: "hoodie",
    lowerColor: "grey",
    lowerItem: "joggers",
    accessories: ["backpack"],
    distinguishingFeatures: "",
  },
];

/** Slightly perturb the true descriptor to mimic a real steward's imperfect report. */
function perturb(d: Descriptor, rng: () => number): Descriptor {
  const copy = { ...d, accessories: [...d.accessories] };
  // A steward might miss an accessory or describe the item generically.
  if (rng() < 0.5 && copy.accessories.length > 1) {
    copy.accessories = copy.accessories.slice(0, copy.accessories.length - 1);
  }
  if (rng() < 0.3) copy.distinguishingFeatures = "";
  return copy;
}

/**
 * Generate a realistic set of steward sighting reports for a case: one strong
 * (true) match near the last-seen zone, plus a few decoys. Descriptor-only —
 * no images, no biometrics.
 */
export function generateSightings(caseItem: ReuniteCase): Sighting[] {
  const rng = createRng(
    caseItem.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0),
  );
  const now = Date.now();
  const lastSeen = caseItem.descriptor.lastSeenZoneId;
  const neighbors = (ZONE_MAP[lastSeen]?.neighbors ?? []).filter(
    (id) => ZONE_MAP[id]?.kind !== "pitch",
  );
  const searchZones = [lastSeen, ...neighbors];

  const sightings: Sighting[] = [];

  // Strong true match near last-seen.
  sightings.push({
    id: uid("sgt"),
    caseId: caseItem.id,
    stewardName: STEWARD_POOL[Math.floor(rng() * STEWARD_POOL.length)],
    zoneId: searchZones[Math.floor(rng() * Math.min(2, searchZones.length))],
    t: now,
    descriptor: perturb(caseItem.descriptor, rng),
    notes: "Child appears calm, standing near a steward point.",
  });

  // 2-3 decoys across the search zones.
  const decoyCount = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < decoyCount; i++) {
    const zoneId = searchZones[Math.floor(rng() * searchZones.length)] ?? lastSeen;
    sightings.push({
      id: uid("sgt"),
      caseId: caseItem.id,
      stewardName: STEWARD_POOL[Math.floor(rng() * STEWARD_POOL.length)],
      zoneId,
      t: now,
      descriptor: {
        ...DECOY_DESCRIPTORS[i % DECOY_DESCRIPTORS.length],
        lastSeenZoneId: zoneId,
        minutesAgo: 0,
      },
      notes: "Unaccompanied child reported in the area.",
    });
  }

  return sightings;
}
