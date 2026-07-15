import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Vitest configuration for PULSE.
 *
 * Runs in the `jsdom` environment so the same config covers pure-logic suites
 * (simulation, AI heuristics, schemas, API routes) and component/hook/store
 * tests without per-file environment juggling.
 *
 * The `@/*` path alias mirrors tsconfig so imports resolve identically to the app.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/**/*.d.ts",
        // Presentational-only surfaces exercised via integration, not unit tests.
        "src/app/**/layout.tsx",
        "src/app/**/page.tsx",
      ],
    },
  },
});
