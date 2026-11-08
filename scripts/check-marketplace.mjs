#!/usr/bin/env node
// check-marketplace.mjs — the two single-pass repo checks of architect.md §3.4 / §7:
//   [MANIFEST_MISMATCH]  a marketplace entry without a plugin dir, a plugin dir without an entry,
//                        or an entry whose name/version disagrees with the plugin's plugin.json
//   [NAME_COLLISION]     the same skill, agent or command name shipped by two units in plugins/**
// Each problem is one named line on stderr; exit 1 on any. Needs no Rein install (§7).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const root = resolve(process.argv[2] || ".");
const problems = [];
const readJson = (p) => {
  try { return JSON.parse(readFileSync(p, "utf8")); }
  catch (e) { problems.push(`[MANIFEST_INVALID] ${p.slice(root.length + 1)}: ${e.message.split("\n")[0]}`); return null; }
};
const dirs = (p) => (existsSync(p) ? readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory()) : []);

// ── Manifest ↔ plugins ──
const manifest = readJson(join(root, ".claude-plugin", "marketplace.json")) || { plugins: [] };
if (manifest.name !== "rein-plugins") problems.push(`[MANIFEST_MISMATCH] marketplace name is ${JSON.stringify(manifest.name)}, expected "rein-plugins"`);
const entries = new Map();
for (const e of manifest.plugins || []) {
  if (entries.has(e.name)) problems.push(`[MANIFEST_MISMATCH] ${e.name} is listed twice in marketplace.json`);
  entries.set(e.name, e);
  if (e.source !== `./plugins/${e.name}`) problems.push(`[MANIFEST_MISMATCH] ${e.name} source is ${JSON.stringify(e.source)}, expected "./plugins/${e.name}"`);
}
const pluginDirs = dirs(join(root, "plugins"));
for (const name of pluginDirs) {
  const pj = join(root, "plugins", name, ".claude-plugin", "plugin.json");
  if (!entries.has(name)) problems.push(`[MANIFEST_MISMATCH] plugins/${name} has no entry in marketplace.json`);
  if (!existsSync(pj)) { problems.push(`[MANIFEST_MISMATCH] plugins/${name} has no .claude-plugin/plugin.json`); continue; }
  const p = readJson(pj);
  if (!p) continue;
  if (p.name !== name) problems.push(`[MANIFEST_MISMATCH] plugins/${name}/plugin.json names ${JSON.stringify(p.name)}`);
  const e = entries.get(name);
  if (e && e.version && p.version !== e.version) problems.push(`[MANIFEST_MISMATCH] ${name} version ${p.version} in plugin.json, ${e.version} in marketplace.json`);
  if (!existsSync(join(root, "plugins", name, "evals"))) problems.push(`[MANIFEST_MISMATCH] plugins/${name} has no evals/ suite`);
}
for (const name of entries.keys()) if (!pluginDirs.includes(name)) problems.push(`[MANIFEST_MISMATCH] marketplace.json lists ${name} but plugins/${name} does not exist`);

// ── Name collisions across every unit in plugins/** ──
// Skills are <plugin>/skills/<name>/SKILL.md; agents and commands are <plugin>/{agents,commands}/<name>.md.
// The frontmatter `name:` wins over the path when present, since that is what Claude registers.
const fmName = (file) => /^---\r?\n[\s\S]*?^name:\s*["']?([^"'\r\n]+?)["']?\s*$/m.exec(readFileSync(file, "utf8"))?.[1];
// Keyed by name alone, across kinds: a skill and an agent sharing a name is a collision too (§7).
const owners = new Map();   // name → ["<kind> <unit path>"]
const claim = (kind, name, where) => owners.set(name, [...(owners.get(name) || []), `${kind} ${where}`]);
for (const plugin of pluginDirs) {
  const base = join(root, "plugins", plugin);
  for (const s of dirs(join(base, "skills"))) {
    const f = join(base, "skills", s, "SKILL.md");
    if (existsSync(f)) claim("skill", fmName(f) || s, `plugins/${plugin}/skills/${s}`);
  }
  for (const kind of ["agents", "commands"]) {
    const d = join(base, kind);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d).filter((n) => n.endsWith(".md"))) {
      claim(kind.slice(0, -1), fmName(join(d, f)) || basename(f, ".md"), `plugins/${plugin}/${kind}/${f}`);
    }
  }
}
for (const [name, where] of owners) if (where.length > 1) problems.push(`[NAME_COLLISION] ${name}: ${where.join(", ")}`);

for (const p of problems) console.error(p);
if (problems.length) process.exit(1);
console.log(`[MARKETPLACE_OK] plugins=${pluginDirs.length} units=${owners.size}`);
