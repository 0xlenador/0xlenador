import eslintPluginAstro from "eslint-plugin-astro"
import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import prettierConfig from "eslint-config-prettier"

export default [
  // ── Archivos ignorados ────────────────────────────────────────────
  {
    ignores: ["dist/**", ".astro/**", "node_modules/**"],
  },

  // ── TypeScript en archivos .ts/.tsx ──────────────────────────────
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // Permitir any explícito cuando es necesario (ej. import.meta.glob)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },

  // ── Archivos Astro (.astro) ───────────────────────────────────────
  ...eslintPluginAstro.configs.recommended,

  // ── Prettier al final (desactiva reglas de formato que Prettier maneja) ──
  prettierConfig,
]
