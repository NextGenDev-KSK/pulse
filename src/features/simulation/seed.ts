import type {
  Snapshot,
  Steward,
  ZoneTelemetry,
} from "@/lib/schemas/domain";
import { ZONES } from "@/lib/stadium/zones";
import { densityToRisk } from "@/lib/constants";
import { APP } from "@/lib/constants";
import { createRng } from "@/lib/utils";

const STEWARD_NAMES = [
  "Priya Sharma",
  "Diego Alvarez",
  "Mia Chen",
  "Kwame Mensah",
  "Sofia Rossi",
  "Liam O'Brien",
  "Aisha Bello",
  "Noah Kim",
  "Elena Petrova",
  "Marcus Webb",
  "Yuki Tanaka",
  "Fatima Al-Sayed",
  "Tom Becker",
  "Grace Owusu",
  "Ravi Nair",
  "Hana Novak",
  "Luca Bianchi",
  "Zoe Martin",
];

/** Baseline density per zone kind before the crowd arrives (pre-match). */
const BASE_DENSITY: Record<string, number> = {
  gate: 34,
  concourse: 28,
  stand: 20,
  facility: 30,
  pitch: 4,
};

export function seedStewards(): Steward[] {
  const rng = createRng(4711);
  const zoneIds = ZONES.filter((z) => z.kind !== "pitch").map((z) => z.id);
  const skills: Steward["skills"][] = [
    ["medical"],
    ["security"],
    ["guest-services"],
    ["security", "guest-services"],
    ["medical", "guest-services"],
  ];
  return STEWARD_NAMES.map((name, i) => ({
    id: `stw-${(i + 1).toString().padStart(2, "0")}`,
    name,
    skills: skills[i % skills.length],
    status: "available",
    zoneId: zoneIds[Math.floor(rng() * zoneIds.length)],
    taskId: null,
  }));
}

export function seedTelemetry(now: number): ZoneTelemetry[] {
  const rng = createRng(1337);
  return ZONES.map((z) => {
    const base = BASE_DENSITY[z.kind] ?? 20;
    const density = Math.max(2, base + (rng() - 0.5) * 10);
    return {
      zoneId: z.id,
      t: now,
      density,
      occupancy: Math.round((density / 100) * z.capacity),
      inflow: rng() * 20,
      outflow: rng() * 12,
      queueLength: z.kind === "gate" ? Math.round(rng() * 40) : 0,
      risk: densityToRisk(density),
      trend: "rising",
    };
  });
}

export function seedSnapshot(now: number): Snapshot {
  return {
    t: now,
    matchClock: 0,
    phase: "pre-match",
    attendance: Math.round(APP.capacity * 0.32),
    capacity: APP.capacity,
    pressureIndex: 24,
    avgDensity: 26,
    weather: { tempC: 19, condition: "clear", windKph: 12 },
  };
}
