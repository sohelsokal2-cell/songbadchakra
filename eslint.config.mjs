import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      "**/.open-next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".data/**",
      "coverage/**",
      "node_modules/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
