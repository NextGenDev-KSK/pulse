"use client";

import { create } from "zustand";
import type { BriefingResult, ForecastResult } from "@/lib/schemas/domain";

interface AiState {
  latestForecast: ForecastResult | null;
  forecastAt: number | null;
  forecasting: boolean;
  latestBriefing: BriefingResult | null;
  briefingAt: number | null;
  triagingIds: string[];
  setForecast: (forecast: ForecastResult) => void;
  setForecasting: (v: boolean) => void;
  setBriefing: (briefing: BriefingResult) => void;
  addTriaging: (id: string) => void;
  removeTriaging: (id: string) => void;
  reset: () => void;
}

export const useAiStore = create<AiState>((set) => ({
  latestForecast: null,
  forecastAt: null,
  forecasting: false,
  latestBriefing: null,
  briefingAt: null,
  triagingIds: [],
  setForecast: (latestForecast) =>
    set({ latestForecast, forecastAt: Date.now(), forecasting: false }),
  setForecasting: (forecasting) => set({ forecasting }),
  setBriefing: (latestBriefing) =>
    set({ latestBriefing, briefingAt: Date.now() }),
  addTriaging: (id) =>
    set((s) => ({ triagingIds: [...s.triagingIds, id] })),
  removeTriaging: (id) =>
    set((s) => ({ triagingIds: s.triagingIds.filter((x) => x !== id) })),
  reset: () =>
    set({
      latestForecast: null,
      forecastAt: null,
      forecasting: false,
      latestBriefing: null,
      briefingAt: null,
      triagingIds: [],
    }),
}));
