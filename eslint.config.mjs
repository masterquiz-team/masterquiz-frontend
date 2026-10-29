import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const sourceRoot = fileURLToPath(new URL("./src/", import.meta.url));

function isServerSource(rawSource, filename) {
  const source = rawSource.replace(/\.(?:[cm]?[jt]sx?)$/, "");
  if (/(^|\/)server(\/|$)/.test(source)) return true;
  if (/^@\/lib\/backend(?:\/|$)/.test(source)) return true;
  if (/^@\/lib\/api\/(server|request|response)$/.test(source)) return true;
  if (!source.startsWith(".")) return false;

  // Match on the path inside src/, so the checkout location never matters.
  const relative = path
    .relative(sourceRoot, path.resolve(path.dirname(filename), source))
    .split(path.sep)
    .join("/");
  if (relative.startsWith("..")) return false;
  return (
    /(^|\/)server(\/|$)/.test(relative) ||
    /^lib\/backend(?:\/|$)/.test(relative) ||
    /^lib\/api\/(server|request|response)$/.test(relative)
  );
}

const noServerImportsInClient = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      serverImport:
        "Client components must not import server code ('{{source}}'). Pass data from a server component or route instead.",
    },
  },
  create(context) {
    let isClient = false;
    function check(node) {
      if (!isClient || !node.source) return;
      const source =
        typeof node.source.value === "string"
          ? node.source.value
          : node.source.type === "TemplateLiteral" &&
              node.source.expressions.length === 0
            ? node.source.quasis[0].value.cooked
            : null;
      if (source === null) return;
      if (node.importKind === "type" || node.exportKind === "type") return;
      if (
        node.specifiers?.length > 0 &&
        node.specifiers.every(
          (specifier) =>
            specifier.importKind === "type" || specifier.exportKind === "type",
        )
      )
        return;
      if (isServerSource(source, context.filename)) {
        context.report({ node, messageId: "serverImport", data: { source } });
      }
    }
    return {
      Program(node) {
        for (const statement of node.body) {
          if (
            statement.type !== "ExpressionStatement" ||
            typeof statement.directive !== "string"
          )
            break;
          if (statement.directive === "use client") isClient = true;
        }
      },
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};

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
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      local: {
        rules: { "no-server-imports-in-client": noServerImportsInClient },
      },
    },
    rules: { "local/no-server-imports-in-client": "error" },
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
