import { ZONE_MAP, getZone } from "./zones";

/**
 * Zone-graph utilities for deterministic routing decisions (nearest steward,
 * ETA estimation). Kept as pure functions so the dispatch engine and the AI
 * rationale layer share identical distance math.
 */

/** BFS hop distance between two zones on the adjacency graph. */
export function hopDistance(fromId: string, toId: string): number {
  if (fromId === toId) return 0;
  const visited = new Set<string>([fromId]);
  let frontier = [fromId];
  let depth = 0;
  while (frontier.length) {
    depth += 1;
    const next: string[] = [];
    for (const id of frontier) {
      for (const n of ZONE_MAP[id]?.neighbors ?? []) {
        if (n === toId) return depth;
        if (!visited.has(n)) {
          visited.add(n);
          next.push(n);
        }
      }
    }
    frontier = next;
  }
  return Number.POSITIVE_INFINITY;
}

/** Euclidean distance between zone centroids (viewBox units). */
export function centroidDistance(fromId: string, toId: string): number {
  const a = getZone(fromId).centroid;
  const b = getZone(toId).centroid;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Composite travel cost: hop count dominates (walking through zones), refined
 * by physical distance. Returns a comparable score, lower = closer.
 */
export function travelCost(fromId: string, toId: string): number {
  const hops = hopDistance(fromId, toId);
  if (!Number.isFinite(hops)) return Number.POSITIVE_INFINITY;
  return hops * 1000 + centroidDistance(fromId, toId);
}

/** Rough ETA in seconds — ~40s per zone hop plus in-zone walk time. */
export function estimateEtaSeconds(fromId: string, toId: string): number {
  const hops = hopDistance(fromId, toId);
  if (!Number.isFinite(hops)) return 600;
  const walk = centroidDistance(fromId, toId) * 0.18;
  return Math.round(hops * 40 + walk);
}

/** Shortest neighbor path between two zones (inclusive of both endpoints). */
export function shortestPath(fromId: string, toId: string): string[] {
  if (fromId === toId) return [fromId];
  const prev = new Map<string, string>();
  const visited = new Set([fromId]);
  let frontier = [fromId];
  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const n of ZONE_MAP[id]?.neighbors ?? []) {
        if (visited.has(n)) continue;
        visited.add(n);
        prev.set(n, id);
        if (n === toId) {
          const path = [toId];
          let cur = toId;
          while (prev.has(cur)) {
            cur = prev.get(cur)!;
            path.unshift(cur);
          }
          return path;
        }
        next.push(n);
      }
    }
    frontier = next;
  }
  return [fromId];
}
