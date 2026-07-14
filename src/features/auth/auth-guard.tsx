"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { useAuthStore } from "./auth-store";

/** Client-side guard for the console. Redirects to /login when unauthenticated. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const [graceElapsed, setGraceElapsed] = React.useState(false);

  React.useEffect(() => {
    // Allow a short window for demo/Firebase session restoration.
    const t = setTimeout(() => setGraceElapsed(true), 350);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if ((initialized || graceElapsed) && !user) {
      router.replace("/login");
    }
  }, [initialized, graceElapsed, user, router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <span className="inline-flex size-11 animate-pulse items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Activity className="size-5 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <p className="text-sm">Booting PULSE console…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
