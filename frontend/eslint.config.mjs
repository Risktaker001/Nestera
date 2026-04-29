import nextPlugin from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  // jsx-a11y recommended rules (flat config native)
  jsxA11y.flatConfigs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      // Next.js core-web-vitals rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // React hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Project-specific rules from issue #723
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "react/no-unescaped-entities": "error",
      // Downgrade pre-existing a11y issues to warn (to be fixed incrementally)
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-redundant-roles": "warn",
    },
  },
];

export default eslintConfig;

