"use client";

import { create } from "zustand";
import type {
  Candidate,
  Descriptor,
  ReuniteCase,
  ReuniteStatus,
  Sighting,
} from "@/lib/schemas/domain";

interface ReuniteState {
  cases: ReuniteCase[];
  sightings: Sighting[];
  addCase: (c: ReuniteCase) => void;
  setStatus: (id: string, status: ReuniteStatus, event?: string) => void;
  setCandidates: (id: string, candidates: Candidate[]) => void;
  setDescriptor: (id: string, descriptor: Descriptor) => void;
  appendTimeline: (id: string, label: string, detail: string) => void;
  addSighting: (s: Sighting) => void;
  reset: () => void;
}

export const useReuniteStore = create<ReuniteState>((set) => ({
  cases: [],
  sightings: [],
  addCase: (c) => set((s) => ({ cases: [c, ...s.cases] })),
  setStatus: (id, status, event) =>
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              reunitedAt: status === "reunited" ? Date.now() : c.reunitedAt,
              timeline: event
                ? [
                    ...c.timeline,
                    { t: Date.now(), label: status, detail: event },
                  ]
                : c.timeline,
            }
          : c,
      ),
    })),
  setCandidates: (id, candidates) =>
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === id
          ? {
              ...c,
              candidates,
              status: candidates.length ? "candidate-found" : c.status,
            }
          : c,
      ),
    })),
  setDescriptor: (id, descriptor) =>
    set((s) => ({
      cases: s.cases.map((c) => (c.id === id ? { ...c, descriptor } : c)),
    })),
  appendTimeline: (id, label, detail) =>
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === id
          ? { ...c, timeline: [...c.timeline, { t: Date.now(), label, detail }] }
          : c,
      ),
    })),
  addSighting: (sighting) =>
    set((s) => ({ sightings: [sighting, ...s.sightings] })),
  reset: () => set({ cases: [], sightings: [] }),
}));

export const selectActiveCases = (s: ReuniteState) =>
  s.cases.filter((c) => c.status !== "reunited" && c.status !== "archived");
