"use client";

import { create } from "zustand";
import type {
  Incident,
  IncidentStatus,
  TriageResult,
} from "@/lib/schemas/domain";

interface IncidentState {
  incidents: Incident[];
  addIncident: (incident: Incident) => void;
  setTriage: (id: string, triage: TriageResult) => void;
  setStatus: (id: string, status: IncidentStatus) => void;
  resolve: (id: string, at: number) => void;
  reset: () => void;
}

export const useIncidentStore = create<IncidentState>((set) => ({
  incidents: [],
  addIncident: (incident) =>
    set((s) => ({ incidents: [incident, ...s.incidents] })),
  setTriage: (id, triage) =>
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id
          ? { ...i, triage, severity: triage.severity, status: "triaged" }
          : i,
      ),
    })),
  setStatus: (id, status) =>
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id ? { ...i, status } : i,
      ),
    })),
  resolve: (id, at) =>
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id ? { ...i, status: "resolved", resolvedAt: at } : i,
      ),
    })),
  reset: () => set({ incidents: [] }),
}));

export const selectOpenIncidents = (s: IncidentState) =>
  s.incidents.filter((i) => i.status !== "resolved");
