"use client";

import * as React from "react";
import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn, uid } from "@/lib/utils";

type ToastVariant = "info" | "success" | "warning" | "error";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => ({ toasts: [...s.toasts, { ...t, id: uid("toast") }] })),
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(input: {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}) {
  useToastStore.getState().push({
    title: input.title,
    description: input.description,
    variant: input.variant ?? "info",
    duration: input.duration ?? 4200,
  });
}

const ICONS: Record<ToastVariant, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const COLORS: Record<ToastVariant, string> = {
  info: "text-[hsl(var(--primary))]",
  success: "text-[hsl(var(--calm))]",
  warning: "text-[hsl(var(--busy))]",
  error: "text-[hsl(var(--critical))]",
};

function ToastCard({ t }: { t: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = ICONS[t.variant];

  React.useEffect(() => {
    const timer = setTimeout(() => dismiss(t.id), t.duration);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      className="glass-strong pointer-events-auto flex w-80 items-start gap-3 rounded-lg p-3.5 shadow-2xl shadow-black/40"
      role="status"
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", COLORS[t.variant])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{t.title}</p>
        {t.description && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t.description}
          </p>
        )}
      </div>
      <button
        onClick={() => dismiss(t.id)}
        aria-label="Dismiss"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <XCircle className="size-4" />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex flex-col items-end gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastCard key={t.id} t={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
