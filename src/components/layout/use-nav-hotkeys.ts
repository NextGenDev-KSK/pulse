"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { NAV_ITEMS } from "./nav-config";

/**
 * Linear-style leader chords: press `g` then a module key (d, v, b, x, r, a, l).
 * Ignored while typing in inputs.
 */
export function useNavHotkeys() {
  const router = useRouter();
  const leaderRef = React.useRef(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }

      if (leaderRef.current) {
        const item = NAV_ITEMS.find((n) => n.chord === e.key.toLowerCase());
        if (item) {
          e.preventDefault();
          router.push(item.href);
        }
        leaderRef.current = false;
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }

      if (e.key.toLowerCase() === "g") {
        leaderRef.current = true;
        timerRef.current = setTimeout(() => {
          leaderRef.current = false;
        }, 1200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [router]);
}
