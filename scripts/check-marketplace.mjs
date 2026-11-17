#!/usr/bin/env node
// check-marketplace.mjs — the two single-pass repo checks of architect.md §3.4 / §7:
//   [MANIFEST_MISMATCH]  a marketplace entry without a plugin dir, a plugin dir without an entry,
//                        or an entry whose name/version disagrees with the plugin's plugin.json
//   [NAME_COLLISION]     the same skill, agent or command name shipped by two units in plugins/**
// and the language-pack check (.ai/blueprints/language-packs.md §Components 4):
//   [PACK_PART_MISSING] [PACK_RUNNER_DRIFT] [PACK_HOOK_EVENT] [PACK_NAME_RESERVED]
//   [PACK_SKILL_SHAPE] (conventions skill without paths: or over 120 lines)
//   [PACK_DESCRIPTOR_INVALID] (pack.json against the §Data Model, incl. no downloading package runner)
// Each problem is one named line on stderr; exit 1 on any. Needs no Rein install (§7).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { HOOK_EVENT, HOOK_MATCHER, USER_CONFIG, descriptorProblems, hooksJsonText } from "./pack-lib.mjs";

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

// ── Language packs (.ai/blueprints/language-packs.md §Components 4) ──
// Every plugin is a pack `rein-<language>`: two skills, README, evals; and, when it has an edit
// hook, the trio pack.json + hooks/hooks.json + hooks/run.mjs (all or none — rein-laravel has none).
const template = readFileSync(join(root, "scripts", "pack-template", "run.mjs"));
const reservedFile = join(root, "scripts", "reserved-names.json");
const reserved = new Set(existsSync(reservedFile) ? readJson(reservedFile)?.names || [] : []);
if (!reserved.size) problems.push("[PACK_PART_MISSING] scripts/reserved-names.json is missing or empty");
const lines = (f) => readFileSync(f, "utf8").split("\n").length;
const frontmatter = (f) => /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(f, "utf8"))?.[1] || "";
for (const plugin of pluginDirs) {
  const base = join(root, "plugins", plugin);
  const at = (...p) => join(base, ...p);
  const lang = /^rein-([a-z][a-z0-9]*)$/.exec(plugin)?.[1];
  if (!lang) { problems.push(`[PACK_PART_MISSING] plugins/${plugin} is not named rein-<language>`); continue; }
  for (const skill of [`${lang}-conventions`, `${lang}-review`]) {
    if (!existsSync(at("skills", skill, "SKILL.md"))) problems.push(`[PACK_PART_MISSING] plugins/${plugin}/skills/${skill}/SKILL.md`);
  }
  if (!existsSync(at("README.md"))) problems.push(`[PACK_PART_MISSING] plugins/${plugin}/README.md`);
  const conv = at("skills", `${lang}-conventions`, "SKILL.md");
  if (existsSync(conv)) {
    if (!/^paths:/m.test(frontmatter(conv))) problems.push(`[PACK_SKILL_SHAPE] ${plugin}: ${lang}-conventions has no paths: in its frontmatter`);
    if (lines(conv) > 120) problems.push(`[PACK_SKILL_SHAPE] ${plugin}: ${lang}-conventions is ${lines(conv)} lines (limit 120)`);
  }
  for (const s of dirs(at("skills"))) {
    const f = at("skills", s, "SKILL.md");
    const n = existsSync(f) ? fmName(f) || s : s;
    if (/^(rein|arch)-/.test(n) || reserved.has(n)) problems.push(`[PACK_NAME_RESERVED] ${plugin}: skill ${n} is reserved by rein (prefix rein-/arch- or scripts/reserved-names.json)`);
  }
  const pj = existsSync(at(".claude-plugin", "plugin.json")) ? readJson(at(".claude-plugin", "plugin.json")) : null;
  for (const k of ["hooks", "mcpServers", "lspServers"]) if (pj && k in pj) problems.push(`[PACK_HOOK_EVENT] ${plugin}: plugin.json declares "${k}" — a pack registers only hooks/hooks.json`);

  const trio = [at("pack.json"), at("hooks", "hooks.json"), at("hooks", "run.mjs")];
  const present = trio.filter((p) => existsSync(p));
  if (present.length === 0) {
    if (pj?.userConfig) problems.push(`[PACK_PART_MISSING] ${plugin}: userConfig without an edit hook`);
    continue;
  }
  if (present.length < 3) {
    for (const p of trio) if (!existsSync(p)) problems.push(`[PACK_PART_MISSING] ${p.slice(root.length + 1)} (pack.json, hooks/hooks.json and hooks/run.mjs come together)`);
    continue;
  }
  if (!readFileSync(at("hooks", "run.mjs")).equals(template)) problems.push(`[PACK_RUNNER_DRIFT] ${plugin}: hooks/run.mjs differs from scripts/pack-template/run.mjs — run: node scripts/new-pack.mjs --sync`);
  const pack = readJson(at("pack.json"));
  const bad = pack ? descriptorProblems(pack) : ["unreadable"];
  for (const b of bad) problems.push(`[PACK_DESCRIPTOR_INVALID] ${plugin}/pack.json: ${b}`);
  if (pack && pack.language !== lang) problems.push(`[PACK_DESCRIPTOR_INVALID] ${plugin}/pack.json: language ${JSON.stringify(pack.language)}, expected "${lang}"`);
  const hooks = readJson(at("hooks", "hooks.json"));
  const events = Object.keys(hooks?.hooks || {});
  for (const ev of events) if (ev !== HOOK_EVENT) problems.push(`[PACK_HOOK_EVENT] ${plugin}: hooks.json registers ${ev} — only ${HOOK_EVENT} is allowed`);
  for (const group of hooks?.hooks?.[HOOK_EVENT] || []) if (group.matcher !== HOOK_MATCHER) problems.push(`[PACK_HOOK_EVENT] ${plugin}: matcher ${JSON.stringify(group.matcher)}, expected "${HOOK_MATCHER}"`);
  if (pack && !bad.length && readFileSync(at("hooks", "hooks.json"), "utf8") !== hooksJsonText(pack)) problems.push(`[PACK_RUNNER_DRIFT] ${plugin}: hooks/hooks.json is not what new-pack --sync generates from pack.json — run: node scripts/new-pack.mjs --sync`);
  if (JSON.stringify(pj?.userConfig) !== JSON.stringify(USER_CONFIG)) problems.push(`[PACK_PART_MISSING] ${plugin}: plugin.json userConfig must be exactly format_on_edit + lint_on_edit (scripts/pack-lib.mjs)`);
}

for (const p of problems) console.error(p);
if (problems.length) process.exit(1);
console.log(`[MARKETPLACE_OK] plugins=${pluginDirs.length} units=${owners.size}`);
