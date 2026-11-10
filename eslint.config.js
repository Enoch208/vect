import { existsSync, readFileSync } from "node:fs";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

const uiPackages = [
  "react",
  "react/*",
  "react-dom",
  "react-dom/*",
  "three",
  "three/*",
  "@react-three/*",
  "postprocessing",
  "zustand",
  "zustand/*",
  "motion",
  "motion/*",
  "@hugeicons/*",
  "idb-keyval",
];

const uiPaths = ["**/components/**", "**/app/**", "**/store/**", "**/styles/**"];

const serverOnly = {
  group: ["openai", "openai/*", "**/server/**", "**/generation/**"],
  message:
    "The model layer is server-only: it never reaches the browser bundle, and the engine and verifier never depend on it.",
};

const pureCore = {
  patterns: [
    {
      group: uiPackages,
      message: "The engine is pure TypeScript: no UI, rendering or state libraries.",
    },
    { group: uiPaths, message: "The engine never imports UI code." },
    serverOnly,
  ],
};

const deterministic = [
  {
    object: "Math",
    property: "random",
    message: "Seed randomness explicitly; the engine is deterministic.",
  },
  { object: "Date", property: "now", message: "Inject a clock; the engine is deterministic." },
  {
    object: "performance",
    property: "now",
    message: "Inject a clock; the engine is deterministic.",
  },
];

const localExclude = new URL(".git/info/exclude", import.meta.url);
const localIgnores = existsSync(localExclude)
  ? readFileSync(localExclude, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("!"))
      .map((line) => (line.endsWith("/") ? `${line}**` : line))
  : [];

export default tseslint.config(
  {
    ignores: [
      ...localIgnores,
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  reactHooks.configs.flat["recommended-latest"],
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      "no-console": "error",
    },
  },
  {
    files: [
      "src/contract/**",
      "src/domain/**",
      "src/verification/**",
      "src/agents/**",
      "src/fixtures/**",
    ],
    rules: {
      "no-restricted-imports": ["error", pureCore],
      "no-restricted-properties": ["error", ...deterministic],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "Inject a clock; the engine is deterministic.",
        },
      ],
    },
  },
  {
    files: ["src/agents/test-worker.ts", "src/agents/test-runner.ts"],
    rules: {
      "no-restricted-properties": "off",
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["src/generation/**", "src/server/**", "api/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: uiPackages, message: "Server code never imports UI libraries." },
            { group: uiPaths, message: "Server code never imports UI code." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**", "src/components/**", "src/store/**", "src/styles/**", "src/main.tsx"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [serverOnly] }],
    },
  },
  {
    files: ["**/*.js", "*.config.ts"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
