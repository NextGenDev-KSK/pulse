import { describe, expect, it, vi } from "vitest";
import { withTimeout } from "@/lib/ai/gemini";

describe("withTimeout", () => {
  it("resolves with the value when the promise wins the race", async () => {
    await expect(withTimeout(Promise.resolve(42), 1000)).resolves.toBe(42);
  });

  it("rejects with gemini-timeout when the promise is too slow", async () => {
    const slow = new Promise((resolve) => setTimeout(() => resolve("late"), 50));
    await expect(withTimeout(slow, 5)).rejects.toThrow("gemini-timeout");
  });

  it("clears the timeout timer once the promise settles (no lingering timer)", async () => {
    vi.useFakeTimers();
    try {
      const clearSpy = vi.spyOn(globalThis, "clearTimeout");
      const p = withTimeout(Promise.resolve("ok"), 9000);
      await p;
      expect(clearSpy).toHaveBeenCalled();
      // No pending timers remain after a fast success.
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
