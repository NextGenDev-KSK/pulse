"use client";

import { create } from "zustand";
import type { Dispatch, DispatchStatus } from "@/lib/schemas/domain";

interface DispatchState {
  dispatches: Dispatch[];
  addDispatch: (dispatch: Dispatch) => void;
  advanceStatus: (id: string, status: DispatchStatus, at: number) => void;
  markBreached: (id: string) => void;
  reset: () => void;
}

export const useDispatchStore = create<DispatchState>((set) => ({
  dispatches: [],
  addDispatch: (dispatch) =>
    set((s) => ({ dispatches: [dispatch, ...s.dispatches] })),
  advanceStatus: (id, status, at) =>
    set((s) => ({
      dispatches: s.dispatches.map((d) =>
        d.id === id
          ? {
              ...d,
              status,
              statusTimestamps: { ...d.statusTimestamps, [status]: at },
              resolvedAt: status === "resolved" ? at : d.resolvedAt,
            }
          : d,
      ),
    })),
  markBreached: (id) =>
    set((s) => ({
      dispatches: s.dispatches.map((d) =>
        d.id === id ? { ...d, slaBreached: true } : d,
      ),
    })),
  reset: () => set({ dispatches: [] }),
}));

export const selectActiveDispatches = (s: DispatchState) =>
  s.dispatches.filter(
    (d) => d.status !== "resolved" && d.status !== "cancelled",
  );
