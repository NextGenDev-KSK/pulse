"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Radio,
  Timer,
  Siren,
  HeartHandshake,
  ScanEye,
  Info,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  useNotificationStore,
  type NotificationKind,
} from "@/stores/notification-store";

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  dispatch: Radio,
  sla: Timer,
  incident: Siren,
  reunite: HeartHandshake,
  forecast: ScanEye,
  system: Info,
};

const KIND_COLOR: Record<NotificationKind, string> = {
  dispatch: "text-[hsl(var(--primary))]",
  sla: "text-[hsl(var(--busy))]",
  incident: "text-[hsl(var(--critical))]",
  reunite: "text-[hsl(var(--accent))]",
  forecast: "text-[hsl(var(--primary))]",
  system: "text-muted-foreground",
};

export function NotificationCenter({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markRead = useNotificationStore((s) => s.markRead);

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="glass-strong absolute right-0 top-12 z-40 w-80 overflow-hidden rounded-lg shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Check className="size-3.5" /> Mark all read
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs text-muted-foreground">
                  No notifications yet. Start the simulation to see live alerts.
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = KIND_ICON[n.kind];
                  return (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                        !n.read && "bg-primary/[0.04]",
                      )}
                    >
                      <Icon className={cn("mt-0.5 size-4 shrink-0", KIND_COLOR[n.kind])} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium leading-tight">
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                          {n.detail}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground/70">
                          {formatRelativeTime(n.t)}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-[hsl(var(--primary))]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
