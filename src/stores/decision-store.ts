"use client";

import { create } from "zustand";
import type { Agent, Decision } from "@/lib/schemas/domain";

const MAX_DECISIONS = 200;

interface DecisionState {
  decisions: Decision[];
  addDecision: (decision: Decision) => void;
  reset: () => void;
}

export const useDecisionStore = create<DecisionState>((set) => ({
  decisions: [],
  addDecision: (decision) =>
    set((s) => ({
      decisions: [decision, ...s.decisions].slice(0, MAX_DECISIONS),
    })),
  reset: () => set({ decisions: [] }),
}));

export const selectDecisionsByAgent = (agent: Agent) => (s: DecisionState) =>
  s.decisions.filter((d) => d.agent === agent);
