// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [{ ignores: [".next/**", "node_modules/**", "storybook-static/**", "scripts/**", "next-env.d.ts"] }, ...compat.extends("next/core-web-vitals", "next/typescript"), {
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@next/next/no-html-link-for-pages": "off",
    "react/no-unescaped-entities": "off",
  },
}, ...storybook.configs["flat/recommended"]];

export default eslintConfig;
