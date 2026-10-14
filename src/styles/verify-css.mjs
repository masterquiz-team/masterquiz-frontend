// Run from the repository root after pnpm build:
// node src/styles/verify-css.mjs 9889ebc /path/to/baseline/static
// Capture baseline .next/static before rebuilding; no checkout is required.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import * as sass from "sass";

const require = createRequire(import.meta.url);
// Use the tooling already installed by Next.js and Tailwind, without changing
// package.json. These resolutions are checked each time this script runs.
const postcss = require(
  require.resolve("postcss", { paths: [require.resolve("next")] }),
);
const { transform } = require(
  require.resolve("lightningcss", {
    paths: [require.resolve("@tailwindcss/postcss")],
  }),
);

const [baseline = "9889ebc", baselineStatic] = process.argv.slice(2);
const obsoleteModules = new Set([
  "src/features/auth/components/AuthPage.module.scss",
  "src/features/auth/components/AuthForm.module.scss",
]);
const header = "src/components/layout/Header/Header.module.scss";
const aliases = [
  ["--color1", "--accent-purple", "#8b6fe8"],
  ["--color2", "--accent-purple-soft", "#c9b8f5"],
  ["--color3", "--accent-cyan", "#55bbd3"],
  ["--color4", "--accent-cyan-soft", "#b8e8f2"],
  ["--color5", "--accent-pink", "#e9a7d8"],
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function canonical(css, file) {
  const root = postcss.parse(css);
  root.walkRules((rule) => {
    if (rule.selector === ":root") {
      for (const [legacy, semantic, value] of aliases) {
        const additions = rule.nodes.filter((node) => node.prop === semantic);
        if (!additions.length) continue;
        assert.equal(additions.length, 1);
        assert.equal(additions[0].value, value, semantic);
        const alias = rule.nodes.find((node) => node.prop === legacy);
        assert.equal(alias?.value, `var(${semantic})`, legacy);
        // Resolve only the five approved aliases and remove their new names.
        // Every original custom property is still compared below.
        alias.value = value;
        additions[0].remove();
      }
    }

    const deadSelector =
      file === header
        ? /\.(?:authLinks?|signUp)(?![\w-])/
        : /\.Header-module-scss-module__[\w-]+__(?:authLinks?|signUp)(?![\w-])/;
    // A minified rule can contain several selectors: retain all live ones.
    const live = rule.selectors.filter(
      (selector) => !deadSelector.test(selector),
    );
    if (live.length) rule.selectors = live;
    else rule.remove();
  });
  root.walkAtRules((rule) => {
    if (rule.nodes?.length === 0) rule.remove();
  });

  // Canonicalize syntax/color spellings with the installed production CSS
  // optimizer. Do not sort selectors, media queries, rules or declarations.
  return transform({
    filename: "verify.css",
    code: Buffer.from(root.toString()),
    minify: true,
  }).code.toString();
}

const sourceFiles = walk("src").filter((file) => /\.tsx?$/.test(file));
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  assert.ok(
    !/(?:AuthPage|AuthForm)\.module\.scss/.test(source),
    `Obsolete module is referenced in ${file}`,
  );
}
assert.ok(
  !/styles(?:\.(?:authLinks?|signUp)\b|\[\s*["'](?:authLinks?|signUp)["']\s*\])/.test(
    fs.readFileSync("src/components/layout/Header/Header.tsx", "utf8"),
  ),
  "Header references a removed class",
);

const files = execFileSync(
  "git",
  ["ls-tree", "-r", "--name-only", baseline, "src"],
  {
    encoding: "utf8",
  },
)
  .trim()
  .split("\n")
  .filter(
    (file) => file.endsWith(".module.scss") || file === "src/app/globals.scss",
  );

let unchanged = 0;
for (const file of files) {
  const original = execFileSync("git", ["show", `${baseline}:${file}`], {
    encoding: "utf8",
  });
  const before = sass.compileString(original, {
    url: pathToFileURL(path.resolve(file)),
  }).css;
  const after = sass.compile(file).css;
  if (obsoleteModules.has(file)) {
    assert.equal(after.trim(), "", file);
    console.log(`Removed unused rules, file retained: ${file}`);
    continue;
  }
  assert.equal(canonical(after, file), canonical(before, file), file);
  unchanged++;
}
console.log(`${unchanged} stylesheets match after the explicit allowances.`);
console.log(
  "Allowances: 5 accent aliases; Header authLink/authLinks/signUp; 2 unused modules.",
);

if (baselineStatic) {
  const load = (directory) =>
    walk(directory)
      .filter((file) => file.endsWith(".css"))
      .map((file) => ({ file, css: fs.readFileSync(file, "utf8") }));
  const before = load(baselineStatic);
  const after = load(".next/static");
  assert.equal(
    after.length,
    before.length,
    "Production CSS chunk count changed",
  );
  const unmatched = [...after];
  let identical = 0;
  for (const chunk of before) {
    const normalized = canonical(chunk.css, chunk.file);
    const index = unmatched.findIndex(
      (candidate) => canonical(candidate.css, candidate.file) === normalized,
    );
    assert.notEqual(index, -1, `Production CSS differs: ${chunk.file}`);
    const [match] = unmatched.splice(index, 1);
    if (chunk.css === match.css) identical++;
  }
  console.log(
    `${before.length} production CSS chunks match; ${identical} are byte-identical.`,
  );
}
