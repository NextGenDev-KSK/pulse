"use client";

import { create } from "zustand";
import { uid } from "@/lib/utils";

export type NotificationKind =
  | "dispatch"
  | "sla"
  | "incident"
  | "reunite"
  | "forecast"
  | "system";

export interface AppNotification {
  id: string;
  t: number;
  kind: NotificationKind;
  title: string;
  detail: string;
  read: boolean;
  href?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  notify: (n: Omit<AppNotification, "id" | "t" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  notify: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: uid("ntf"), t: Date.now(), read: false },
        ...s.notifications,
      ].slice(0, 60),
    })),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
  clear: () => set({ notifications: [] }),
}));

export const selectUnreadCount = (s: NotificationState) =>
  s.notifications.filter((n) => !n.read).length;
