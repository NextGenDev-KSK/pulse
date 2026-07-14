"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong max-w-md rounded-lg p-8 text-center">
        <span className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-[hsl(var(--critical))]/15 text-[hsl(var(--critical))]">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The console hit an unexpected error. Your live session is safe — try
          reloading this view.
        </p>
        <Button className="mt-6" onClick={reset}>
          <RotateCcw /> Try again
        </Button>
      </div>
    </div>
  );
}
