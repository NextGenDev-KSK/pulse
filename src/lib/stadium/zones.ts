import type { Zone, ZoneKind } from "@/lib/schemas/domain";

export const STADIUM_VIEWBOX = { width: 1000, height: 640 } as const;

/** Rounded-rectangle SVG path in the stadium viewBox. */
function rrect(x: number, y: number, w: number, h: number, r = 10): string {
  const rr = Math.min(r, w / 2, h / 2);
  return [
    `M${x + rr},${y}`,
    `H${x + w - rr}`,
    `A${rr},${rr} 0 0 1 ${x + w},${y + rr}`,
    `V${y + h - rr}`,
    `A${rr},${rr} 0 0 1 ${x + w - rr},${y + h}`,
    `H${x + rr}`,
    `A${rr},${rr} 0 0 1 ${x},${y + h - rr}`,
    `V${y + rr}`,
    `A${rr},${rr} 0 0 1 ${x + rr},${y}`,
    "Z",
  ].join(" ");
}

type ZoneDef = {
  id: string;
  name: string;
  kind: ZoneKind;
  capacity: number;
  neighbors: string[];
  rect: [number, number, number, number];
  radius?: number;
};

const DEFS: ZoneDef[] = [
  // Pitch (center)
  {
    id: "pitch",
    name: "Pitch",
    kind: "pitch",
    capacity: 300,
    neighbors: ["stand-n", "stand-s", "stand-e", "stand-w"],
    rect: [385, 245, 230, 150],
    radius: 20,
  },
  // Inner stands
  {
    id: "stand-n",
    name: "North Stand",
    kind: "stand",
    capacity: 16000,
    neighbors: ["pitch", "concourse-n", "stand-w", "stand-e"],
    rect: [345, 150, 310, 88],
  },
  {
    id: "stand-s",
    name: "South Stand",
    kind: "stand",
    capacity: 16000,
    neighbors: ["pitch", "concourse-s", "stand-w", "stand-e"],
    rect: [345, 402, 310, 88],
  },
  {
    id: "stand-w",
    name: "West Stand",
    kind: "stand",
    capacity: 15000,
    neighbors: ["pitch", "concourse-w", "stand-n", "stand-s"],
    rect: [252, 150, 86, 340],
  },
  {
    id: "stand-e",
    name: "East Stand",
    kind: "stand",
    capacity: 15000,
    neighbors: ["pitch", "concourse-e", "stand-n", "stand-s"],
    rect: [662, 150, 86, 340],
  },
  // Concourses
  {
    id: "concourse-n",
    name: "North Concourse",
    kind: "concourse",
    capacity: 4200,
    neighbors: ["stand-n", "gate-n", "concourse-w", "concourse-e"],
    rect: [252, 92, 496, 52],
  },
  {
    id: "concourse-s",
    name: "South Concourse",
    kind: "concourse",
    capacity: 4200,
    neighbors: ["stand-s", "gate-s", "concourse-w", "concourse-e"],
    rect: [252, 496, 496, 52],
  },
  {
    id: "concourse-w",
    name: "West Concourse",
    kind: "concourse",
    capacity: 3800,
    neighbors: [
      "stand-w",
      "concourse-n",
      "concourse-s",
      "gate-w",
      "facility-food",
      "facility-medical",
    ],
    rect: [186, 92, 60, 456],
  },
  {
    id: "concourse-e",
    name: "East Concourse",
    kind: "concourse",
    capacity: 3800,
    neighbors: [
      "stand-e",
      "concourse-n",
      "concourse-s",
      "gate-e",
      "facility-fanzone",
    ],
    rect: [754, 92, 60, 456],
  },
  // Gates
  {
    id: "gate-n",
    name: "North Gate",
    kind: "gate",
    capacity: 1400,
    neighbors: ["concourse-n"],
    rect: [400, 30, 200, 52],
  },
  {
    id: "gate-s",
    name: "South Gate",
    kind: "gate",
    capacity: 1400,
    neighbors: ["concourse-s"],
    rect: [400, 558, 200, 52],
  },
  {
    id: "gate-w",
    name: "West Gate",
    kind: "gate",
    capacity: 1200,
    neighbors: ["concourse-w"],
    rect: [64, 254, 112, 132],
  },
  {
    id: "gate-e",
    name: "East Gate",
    kind: "gate",
    capacity: 1200,
    neighbors: ["concourse-e"],
    rect: [824, 254, 112, 132],
  },
  // Facilities
  {
    id: "facility-food",
    name: "Food Court",
    kind: "facility",
    capacity: 2200,
    neighbors: ["concourse-w"],
    rect: [64, 92, 112, 150],
  },
  {
    id: "facility-fanzone",
    name: "Fan Zone",
    kind: "facility",
    capacity: 2600,
    neighbors: ["concourse-e"],
    rect: [824, 92, 112, 150],
  },
  {
    id: "facility-medical",
    name: "Medical Bay",
    kind: "facility",
    capacity: 400,
    neighbors: ["concourse-w"],
    rect: [64, 398, 112, 150],
  },
];

export const ZONES: Zone[] = DEFS.map((d) => {
  const [x, y, w, h] = d.rect;
  return {
    id: d.id,
    name: d.name,
    kind: d.kind,
    capacity: d.capacity,
    neighbors: d.neighbors,
    centroid: { x: x + w / 2, y: y + h / 2 },
    svgPath: rrect(x, y, w, h, d.radius ?? 10),
  };
});

/** Bounding boxes keyed by zone id — used for label layout on the map. */
export const ZONE_BBOX: Record<
  string,
  { x: number; y: number; w: number; h: number }
> = Object.fromEntries(
  DEFS.map((d) => [
    d.id,
    { x: d.rect[0], y: d.rect[1], w: d.rect[2], h: d.rect[3] },
  ]),
);

export const ZONE_MAP: Record<string, Zone> = Object.fromEntries(
  ZONES.map((z) => [z.id, z]),
);

export const SEATED_ZONE_IDS = ZONES.filter((z) => z.kind === "stand").map(
  (z) => z.id,
);

export function getZone(id: string): Zone {
  const z = ZONE_MAP[id];
  if (!z) throw new Error(`Unknown zone: ${id}`);
  return z;
}
