"use client";

import { create } from "zustand";

interface UiState {
  commandOpen: boolean;
  sidebarCollapsed: boolean;
  selectedZoneId: string | null;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
  toggleSidebar: () => void;
  setSelectedZone: (zoneId: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandOpen: false,
  sidebarCollapsed: false,
  selectedZoneId: null,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSelectedZone: (selectedZoneId) => set({ selectedZoneId }),
}));
