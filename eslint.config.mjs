import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/features",
                "@/features/**",
                "**/features",
                "**/features/**",
              ],
              message:
                "src/lib is shared infrastructure and must not import from src/features. Move the shared piece into src/lib instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/features/*/components/**/*.{ts,tsx}",
      "src/features/*/hooks/**/*.{ts,tsx}",
      "src/features/*/services/**/*.{ts,tsx}",
      "src/app/**/error.tsx",
      "src/app/global-error.tsx",
    ],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/server", "**/server/**"],
              allowTypeImports: true,
              message:
                "Client-side code must not import server modules (**/server/**). Pass data from a server component or route instead.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
