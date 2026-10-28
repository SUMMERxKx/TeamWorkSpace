import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Paths ESLint should never look at. A flat config object containing only
  // `ignores` applies globally.
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.tsbuildinfo"],
  },

  // Baseline rules for plain JavaScript correctness.
  js.configs.recommended,

  // TypeScript rules. Not type-aware (that needs a tsconfig per file and is
  // much slower); these catch syntax and obvious mistakes.
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      // A leading underscore marks a parameter or variable as deliberately
      // unused, e.g. `_req` in an Express handler that only needs `res`.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // Browser code gets browser globals (window, document, fetch) instead of
  // Node's. Without this, `document` is an undefined variable.
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  // MUST BE LAST. Turns off every ESLint rule that overlaps with Prettier, so
  // the two tools cannot disagree about formatting.
  prettier,
);
