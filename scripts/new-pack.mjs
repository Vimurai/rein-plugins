#!/usr/bin/env node
// Pack scaffold (.ai/blueprints/language-packs.md §Components 6) — so the tenth pack is built the
// same way as the first.
//
//   node scripts/new-pack.mjs <language> --ext .a,.b [--no-hook]
//       Creates plugins/rein-<language>/ (plugin.json, the two skills, evals, README, and — unless
//       --no-hook — pack.json, hooks/run.mjs, hooks/hooks.json) and adds the marketplace entry at
//       0.1.0. Refuses to touch an existing pack. Fill in pack.json's format/lint and the skill
//       text afterwards, then run --sync.
//   node scripts/new-pack.mjs --sync
//       For every pack with a pack.json: copy scripts/pack-template/run.mjs to hooks/run.mjs and
//       regenerate hooks/hooks.json from pack.json. The pack check fails until this has been run.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { USER_CONFIG, hooksJsonText, validExt } from "./pack-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const template = join(root, "scripts", "pack-template", "run.mjs");
const die = (msg) => { console.error(msg); process.exit(1); };
const write = (p, text) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); };

function sync() {
  let n = 0;
  for (const name of readdirSync(join(root, "plugins"))) {
    const dir = join(root, "plugins", name);
    if (!existsSync(join(dir, "pack.json"))) continue;
    const pack = JSON.parse(readFileSync(join(dir, "pack.json"), "utf8"));
    mkdirSync(join(dir, "hooks"), { recursive: true });
    copyFileSync(template, join(dir, "hooks", "run.mjs"));
    write(join(dir, "hooks", "hooks.json"), hooksJsonText(pack));
    n++;
  }
  console.log(`[PACK_SYNC] ${n} pack(s): runner copied, hooks.json regenerated`);
}

function create(language, exts, hook) {
  if (!/^[a-z][a-z0-9]*$/.test(language)) die(`[PACK_NEW] language ${JSON.stringify(language)} must be a lower-case word`);
  if (!exts.length || !exts.every(validExt)) die("[PACK_NEW] --ext needs lower-case extensions with the dot, e.g. --ext .ts,.tsx");
  const name = `rein-${language}`;
  const dir = join(root, "plugins", name);
  if (existsSync(dir)) die(`[PACK_NEW] plugins/${name} already exists — edit it instead`);
  const globs = exts.map((e) => `  - "**/*${e}"`).join("\n");
  const Lang = language[0].toUpperCase() + language.slice(1);

  const plugin = {
    name, version: "0.1.0",
    description: `${Lang} conventions and a review checklist for Claude${hook ? ", and the project's own formatter and linter on every edited file" : ""}.`,
    author: { name: "Vimurai" }, license: "Apache-2.0",
    ...(hook ? { userConfig: USER_CONFIG } : {}),
  };
  write(join(dir, ".claude-plugin", "plugin.json"), `${JSON.stringify(plugin, null, 2)}\n`);

  write(join(dir, "skills", `${language}-conventions`, "SKILL.md"), `---
name: ${language}-conventions
description: ${Lang} conventions to follow when writing or editing ${exts.join(" ")} files. Project config wins over anything here.
paths:
${globs}
---

# ${Lang} conventions

**Project config wins.** The project's own formatter, linter and compiler settings, and the style of
the code around you, override everything below. Read them before writing code.

TODO: idioms the ${Lang} community broadly agrees on — short, no invented style rules. Under 120 lines.
`);
  write(join(dir, "skills", `${language}-review`, "SKILL.md"), `---
name: ${language}-review
description: Review checklist for ${Lang} changes — the slow checks (type check, full lint, tests) to run before a commit or when asked to review ${Lang} code.
---

# ${Lang} review

Run each command only when its condition holds; prefer the project's own scripts.

TODO: one bullet per command, each with its condition ("if \`<file>\` exists").
`);

  for (const skill of [`${language}-conventions`, `${language}-review`]) {
    write(join(dir, "evals", `${skill}-load`, "prompt.md"), `---
max_turns: 4
allowed_tools: [Skill]
runs: 1
---

Use the Skill tool to load the skill named ${skill}, then reply with the first bold sentence of its body, verbatim.
`);
  }
  write(join(dir, "evals", `${language}-conventions-load`, "graders", "first-rule.md"), `---
type: regex
pattern: "Project config wins"
weight: 1
---
`);
  write(join(dir, "evals", `${language}-review-load`, "graders", "first-rule.md"), `---
type: regex
pattern: "TODO: the review skill's first bold sentence"
weight: 1
---
`);

  write(join(dir, "README.md"), `# ${name}

${plugin.description}

\`\`\`
/plugin install ${name} --marketplace Vimurai/rein-plugins
\`\`\`

- \`${language}-conventions\` — loads when Claude works on ${exts.join(" ")} files.
- \`${language}-review\` — the slow checks, on request or before a commit.
${hook ? `- Edit hook — after each Edit/Write of a matching file, runs the project's own formatter, then its
  linter, on that one file. Options: \`format_on_edit\`, \`lint_on_edit\` (both on by default).

## Trust
The hook runs with your session's permissions, after Claude's edit. It runs only tools found in the
project (\`node_modules/.bin\`, \`vendor/bin\`, …) or on \`PATH\`, never a package runner that downloads.
A formatter or linter may load project config that is code (an ESLint config, for example): that is
your project's own code, the same trust you give \`npm run lint\`. The hook never fails an edit: a
missing tool, a file outside the project or a timeout is silent.
` : ""}`);

  if (hook) {
    write(join(dir, "pack.json"), `${JSON.stringify({ language, extensions: exts, format: [], lint: [] }, null, 2)}\n`);
    mkdirSync(join(dir, "hooks"), { recursive: true });
    copyFileSync(template, join(dir, "hooks", "run.mjs"));
    write(join(dir, "hooks", "hooks.json"), hooksJsonText({ extensions: exts }));
  }

  const mp = join(root, ".claude-plugin", "marketplace.json");
  const manifest = JSON.parse(readFileSync(mp, "utf8"));
  manifest.plugins.push({ name, source: `./plugins/${name}`, description: plugin.description, version: "0.1.0" });
  manifest.plugins.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(mp, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[PACK_NEW] plugins/${name} created${hook ? "" : " (no hook)"}; fill in the TODOs${hook ? " and pack.json, then run --sync" : ""}`);
}

const argv = process.argv.slice(2);
if (argv[0] === "--sync") sync();
else if (argv[0] && !argv[0].startsWith("-")) {
  const i = argv.indexOf("--ext");
  const exts = i >= 0 && argv[i + 1] ? argv[i + 1].split(",").map((s) => s.trim()).filter(Boolean) : [];
  create(argv[0], exts, !argv.includes("--no-hook"));
} else die("usage: node scripts/new-pack.mjs <language> --ext .a,.b [--no-hook]  |  --sync");
