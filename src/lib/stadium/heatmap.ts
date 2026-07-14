import { clamp, lerp } from "@/lib/utils";

/** Density color stops (calm → critical) as HSL triples. */
const STOPS: { at: number; h: number; s: number; l: number }[] = [
  { at: 0, h: 152, s: 60, l: 46 }, // emerald
  { at: 45, h: 96, s: 60, l: 48 }, // lime
  { at: 60, h: 43, s: 92, l: 54 }, // amber
  { at: 78, h: 25, s: 92, l: 55 }, // orange
  { at: 100, h: 350, s: 85, l: 57 }, // rose
];

/** Interpolated heat color for a density value (0-100+). */
export function densityColor(density: number): string {
  const d = clamp(density, 0, 100);
  let lower = STOPS[0];
  let upper = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (d >= STOPS[i].at && d <= STOPS[i + 1].at) {
      lower = STOPS[i];
      upper = STOPS[i + 1];
      break;
    }
  }
  const span = upper.at - lower.at || 1;
  const t = (d - lower.at) / span;
  const h = lerp(lower.h, upper.h, t);
  const s = lerp(lower.s, upper.s, t);
  const l = lerp(lower.l, upper.l, t);
  return `hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${l.toFixed(0)}%)`;
}

/** Fill opacity ramps up with density so calm zones read faint. */
export function densityOpacity(density: number): number {
  return clamp(0.18 + (clamp(density, 0, 100) / 100) * 0.62, 0, 1);
}
