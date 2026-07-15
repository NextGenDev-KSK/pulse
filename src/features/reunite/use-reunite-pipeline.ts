"use client";

import * as React from "react";
import { useReuniteStore } from "@/stores/reunite-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { useNotificationStore } from "@/stores/notification-store";
import { requestExtract, requestMatch } from "@/lib/ai/client";
import { recordDecision } from "@/lib/ai/record-decision";
import { generateSightings } from "./engine/sighting-generator";
import { ZONE_MAP } from "@/lib/stadium/zones";
import { toast } from "@/components/ui/toast";
import type { ReuniteCase } from "@/lib/schemas/domain";

/**
 * GUARDIAN — the lost-child reunification loop. For each newly reported case it
 * extracts a structured descriptor, dispatches a sweep, gathers steward
 * sightings and scores candidate matches. Reunion is confirmed by a human.
 */
export function useReunitePipeline() {
  const cases = useReuniteStore((s) => s.cases);
  const tickCount = useSimulationStore((s) => s.tickCount);
  const processingRef = React.useRef<Set<string>>(new Set());
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => {
    if (tickCount === 0) {
      processingRef.current.clear();
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      useReuniteStore.getState().reset();
    }
  }, [tickCount]);

  React.useEffect(
    () => () => timersRef.current.forEach(clearTimeout),
    [],
  );

  React.useEffect(() => {
    const fresh = cases.filter(
      (c) => c.status === "reported" && !processingRef.current.has(c.id),
    );
    for (const c of fresh) {
      processingRef.current.add(c.id);
      void runGuardian(c, (fn, ms) => {
        const id = setTimeout(() => {
          timersRef.current = timersRef.current.filter((t) => t !== id);
          fn();
        }, ms);
        timersRef.current.push(id);
      });
    }
  }, [cases]);
}

async function runGuardian(
  caseItem: ReuniteCase,
  later: (fn: () => void, ms: number) => void,
) {
  const store = useReuniteStore.getState();
  const lastSeenName =
    ZONE_MAP[caseItem.descriptor.lastSeenZoneId]?.name ?? "the venue";

  // 1. Extract structured descriptor from the free-text report.
  const extract = await requestExtract({
    freeText: caseItem.freeText,
    lastSeenZoneId: caseItem.descriptor.lastSeenZoneId,
    minutesAgo: caseItem.descriptor.minutesAgo,
  });
  store.setDescriptor(caseItem.id, extract.data);
  store.appendTimeline(
    caseItem.id,
    "descriptor extracted",
    `Guardian parsed the report into a structured descriptor (${extract.engine}).`,
  );
  recordDecision({
    agent: "guardian",
    engine: extract.engine,
    latencyMs: extract.latencyMs,
    title: `Descriptor extracted · ${caseItem.childName}`,
    summary: `${extract.data.ageBand}, ${extract.data.upperColor} ${extract.data.upperItem}, ${extract.data.lowerColor} ${extract.data.lowerItem}.`,
    reasoning: [
      `Parsed guardian free-text into structured attributes.`,
      `Clothing: ${extract.data.upperColor} ${extract.data.upperItem}, ${extract.data.lowerColor} ${extract.data.lowerItem}.`,
      `Distinguishing: ${extract.data.distinguishingFeatures || "none noted"}.`,
      "Privacy preserved — descriptor only, no biometrics.",
    ],
    relatedId: caseItem.id,
  });

  // 2. Dispatch a sweep.
  later(() => {
    useReuniteStore.getState().setStatus(
      caseItem.id,
      "searching",
      `Sweep dispatched to ${lastSeenName} and adjacent zones.`,
    );
    useNotificationStore.getState().notify({
      kind: "reunite",
      title: `Reunite: searching for ${caseItem.childName}`,
      detail: `Stewards sweeping ${lastSeenName} and nearby zones.`,
    });
  }, 1400);

  // 3. Gather steward sightings.
  later(() => {
    const sightings = generateSightings({
      ...caseItem,
      descriptor: useReuniteStore.getState().cases.find((c) => c.id === caseItem.id)
        ?.descriptor ?? caseItem.descriptor,
    });
    for (const s of sightings) useReuniteStore.getState().addSighting(s);
    useReuniteStore.getState().appendTimeline(
      caseItem.id,
      "sightings gathered",
      `${sightings.length} candidate sightings reported by stewards.`,
    );
  }, 3000);

  // 4. Score matches.
  later(async () => {
    const current = useReuniteStore
      .getState()
      .cases.find((c) => c.id === caseItem.id);
    const sightings = useReuniteStore
      .getState()
      .sightings.filter((s) => s.caseId === caseItem.id);
    if (!current || sightings.length === 0) return;

    const match = await requestMatch({
      descriptor: current.descriptor,
      sightings: sightings.map((s) => ({
        id: s.id,
        stewardName: s.stewardName,
        zoneId: s.zoneId,
        zoneName: ZONE_MAP[s.zoneId]?.name ?? s.zoneId,
        notes: s.notes,
        descriptor: s.descriptor,
      })),
    });

    useReuniteStore.getState().setCandidates(caseItem.id, match.data);
    useReuniteStore.getState().appendTimeline(
      caseItem.id,
      "candidates scored",
      `Top match ${Math.round((match.data[0]?.score ?? 0) * 100)}% confidence (${match.engine}).`,
    );
    recordDecision({
      agent: "guardian",
      engine: match.engine,
      latencyMs: match.latencyMs,
      title: `Matched sightings · ${caseItem.childName}`,
      summary: `Best candidate ${Math.round(
        (match.data[0]?.score ?? 0) * 100,
      )}% — ${match.data[0]?.rationale ?? "no strong match"}`,
      reasoning: (match.data[0]?.perAttribute ?? []).map(
        (p) => `${p.attribute}: ${p.match} — ${p.note}`,
      ),
      relatedId: caseItem.id,
    });
    const top = match.data[0];
    if (top && top.score >= 0.6) {
      useNotificationStore.getState().notify({
        kind: "reunite",
        title: `Candidate found for ${caseItem.childName}`,
        detail: `${Math.round(top.score * 100)}% match near ${
          ZONE_MAP[top.zoneId]?.name ?? "the venue"
        } — awaiting confirmation.`,
      });
      toast({
        title: `Reunite: candidate found for ${caseItem.childName}`,
        description: "Review and confirm the reunion in Pulse Reunite.",
        variant: "info",
      });
    }
  }, 4200);
}
