import type { Incident, Steward, StewardSkill } from "@/lib/schemas/domain";
import { travelCost, estimateEtaSeconds } from "@/lib/stadium/graph";
import { ZONE_MAP } from "@/lib/stadium/zones";

export interface Candidate {
  steward: Steward;
  etaSeconds: number;
  cost: number;
  skillMatch: boolean;
}

/**
 * Deterministic nearest-qualified-responder selection on the zone graph.
 * Prefers an available steward with the required skill; falls back to the
 * nearest available steward if no skill match exists.
 */
export function selectResponder(
  incident: Incident,
  stewards: Steward[],
): { chosen: Candidate | null; alternatives: Candidate[] } {
  const requiredSkill = incident.triage?.requiredSkill ?? "any";

  const available = stewards.filter(
    (s) => s.status === "available" && s.taskId === null,
  );

  const scored: Candidate[] = available
    .map((steward) => {
      const skillMatch =
        requiredSkill === "any" ||
        steward.skills.includes(requiredSkill as StewardSkill);
      return {
        steward,
        etaSeconds: estimateEtaSeconds(steward.zoneId, incident.zoneId),
        cost: travelCost(steward.zoneId, incident.zoneId),
        skillMatch,
      };
    })
    .sort((a, b) => {
      // Skill match dominates, then travel cost.
      if (a.skillMatch !== b.skillMatch) return a.skillMatch ? -1 : 1;
      return a.cost - b.cost;
    });

  const chosen = scored[0] ?? null;
  const alternatives = scored.slice(1, 4);
  return { chosen, alternatives };
}

export function candidateReason(c: Candidate): string {
  const zone = ZONE_MAP[c.steward.zoneId]?.name ?? c.steward.zoneId;
  return `${c.skillMatch ? "skill match" : "nearest available"}, from ${zone}`;
}
