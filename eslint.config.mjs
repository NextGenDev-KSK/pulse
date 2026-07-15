import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The React-Compiler-preview hooks rules are over-eager on idiomatic,
    // correct patterns we use deliberately: SSR-safe mount detection and
    // localStorage hydration (setState in an effect), and impure calls
    // (Date.now/uid) inside event handlers. Keep them as advisories.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated artifacts.
    "coverage/**",
    // Local verification scripts (not part of the app).
    "shoot*.mjs",
  ]),
]);

export default eslintConfig;
