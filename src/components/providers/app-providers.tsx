"use client";

import * as React from "react";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "@/components/ui/toast";
import { useAuthStore } from "@/features/auth/auth-store";

function AuthBootstrap() {
  const init = useAuthStore((s) => s.init);
  React.useEffect(() => {
    init();
  }, [init]);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {/* Honour the user's reduced-motion preference across all animations. */}
      <MotionConfig reducedMotion="user">
        <AuthBootstrap />
        {children}
        <Toaster />
      </MotionConfig>
    </ThemeProvider>
  );
}
