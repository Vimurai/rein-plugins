#!/usr/bin/env node
// Registration fixture (E-4, architect.md §3.5, D-006): proves the marketplace installs into a
// throwaway Claude profile through the exact registration JSON rein-app writes.
//
//   shape      the D-006 literal: key = marketplace.json name, github Vimurai/rein-plugins @ stable,
//              boolean `<plugin>@rein-plugins` keys. Its GitHub form is asserted structurally only;
//              the install layers swap `source` for the local checkout (architect.md §9, E-4 row).
//   install    no credential needed: in an isolated CLAUDE_CONFIG_DIR, `claude plugin marketplace
//              add` + `claude plugin install` for every bundle in marketplace.json, then asserts each
//              is installed + enabled and that the settings Claude Code itself wrote have the D-006
//              shape (same key, same boolean map).
//   reconcile  a fresh profile holding ONLY the registration JSON: reports whether the marketplace
//              is registered before and after one headless start (CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1)
//              and whether each bundle got installed. REPORT-ONLY ([FIXTURE_Q4_OBSERVED]) while
//              rein-app answers Q5 (D-015 suspends D-013 (c) and D-014). Runs without a credential too (the start
//              then fails "Not logged in", which still shows registration); with ANTHROPIC_API_KEY set
//              a start that cannot run fails [FIXTURE_RECONCILE].
//
// Every problem is one named line; exit 1 on any. Skips (exit 0) are named too:
//   [FIXTURE_SKIP_NO_CLAUDE]       no `claude` on PATH — nothing can be installed (D-012: never a
//                                  missing rein release; the fixture needs no rein)
//   [FIXTURE_SKIP_NO_CREDENTIAL]   info: the reconcile start ran unauthenticated (ANTHROPIC_API_KEY unset)
// A D-006 key whose plugin is not in marketplace.json yet prints [FIXTURE_PENDING] (not a failure:
// rein-app may list a bundle before its move lands). Extra keys to require: FIXTURE_REQUIRE=a,b.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(process.argv[2] || join(here, "..", ".."));
const MKT = "rein-plugins";
const problems = [];
const fail = (line) => problems.push(line);
const say = (line) => console.log(line);

const registration = JSON.parse(readFileSync(join(here, "rein-app-registration.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8"));
const bundles = (manifest.plugins || []).map((p) => p.name);
if (!bundles.length) fail("[FIXTURE_SHAPE] marketplace.json lists no plugins — nothing to register");

// ── shape ──
const entry = registration.extraKnownMarketplaces?.[MKT];
if (manifest.name !== MKT) fail(`[FIXTURE_SHAPE] marketplace.json name is ${JSON.stringify(manifest.name)}; the registration key is "${MKT}"`);
if (!entry) fail(`[FIXTURE_SHAPE] extraKnownMarketplaces has no "${MKT}" entry`);
const src = entry?.source || {};
if (src.source !== "github" || src.repo !== "Vimurai/rein-plugins" || src.ref !== "stable") {
  fail(`[FIXTURE_SHAPE] source must be github Vimurai/rein-plugins @ ref stable, got ${JSON.stringify(src)}`);
}
if ("path" in src) fail("[FIXTURE_SHAPE] source carries `path`; the manifest must stay at the default .claude-plugin/marketplace.json");
const enabled = registration.enabledPlugins || {};
for (const [k, v] of Object.entries(enabled)) {
  if (!k.endsWith(`@${MKT}`)) fail(`[FIXTURE_SHAPE] enabledPlugins key ${k} is not <plugin>@${MKT}`);
  if (v !== true) fail(`[FIXTURE_SHAPE] enabledPlugins ${k} is ${JSON.stringify(v)}, expected true`);
  const name = k.slice(0, -(MKT.length + 1));
  if (!bundles.includes(name)) say(`[FIXTURE_PENDING] ${k} is in the D-006 registration but not in marketplace.json yet`);
}
for (const b of bundles) if (!(`${b}@${MKT}` in enabled)) fail(`[FIXTURE_SHAPE] marketplace bundle ${b} has no enabledPlugins key in the D-006 registration`);
const required = [...bundles, ...(process.env.FIXTURE_REQUIRE || "").split(",").map((s) => s.trim()).filter(Boolean)];

const hasClaude = spawnSync("claude", ["--version"], { encoding: "utf8" }).status === 0;
if (!hasClaude) {
  say("[FIXTURE_SKIP_NO_CLAUDE] `claude` is not on PATH — install and reconcile layers skipped");
  finish(true);
}

// The local form of the D-006 entry: same key and map, source pointed at this checkout.
const localSource = { source: "directory", path: root };
// Every throwaway profile is removed on exit, pass or fail (they hold cached plugin copies).
const profiles = [];
process.on("exit", () => { for (const d of profiles) rmSync(d, { recursive: true, force: true }); });
const profile = (label) => { const d = mkdtempSync(join(tmpdir(), `rein-plugins-fixture-${label}-`)); profiles.push(d); return d; };
// The caller's CLAUDE_CODE_* / ANTHROPIC_* (base URL, model, flags) must not steer the fixture:
// only the credential passes through, so the run is the same on every machine.
const baseEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(CLAUDE_|ANTHROPIC_)/.test(k)));
if (process.env.ANTHROPIC_API_KEY) baseEnv.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const claude = (cfg, args, extraEnv = {}) =>
  spawnSync("claude", args, { encoding: "utf8", cwd: cfg, env: { ...baseEnv, CLAUDE_CONFIG_DIR: cfg, ...extraEnv }, timeout: 180_000 });
const installed = (cfg) => {
  const r = claude(cfg, ["plugin", "list", "--json"]);
  try { return new Map(JSON.parse(r.stdout).map((p) => [p.id || p.name, p])); } catch { return new Map(); }
};
const assertInstalled = (cfg, layer, skip = new Set()) => {
  const have = installed(cfg);
  for (const name of required.filter((n) => !skip.has(n))) {
    const p = have.get(`${name}@${MKT}`);
    if (!p) fail(`[FIXTURE_PLUGIN_MISSING] ${layer}: ${name}@${MKT} is not installed`);
    else if (p.enabled !== true) fail(`[FIXTURE_PLUGIN_DISABLED] ${layer}: ${name}@${MKT} is installed but not enabled`);
  }
};

// ── install ──
{
  const cfg = profile("install"), before = problems.length, failed = new Set();
  const add = claude(cfg, ["plugin", "marketplace", "add", root, "--json"]);
  if (add.status !== 0) fail(`[FIXTURE_INSTALL] marketplace add failed: ${lastLine(add)}`);
  // Assertion (b), first half: registering the marketplace enables nothing — the entry comes from install.
  const early = readSettings(cfg);
  for (const name of required) {
    if (`${name}@${MKT}` in (early.enabledPlugins || {})) fail(`[FIXTURE_ENABLED_BEFORE_INSTALL] enabledPlugins["${name}@${MKT}"] exists after marketplace add, before install`);
  }
  for (const name of required) {
    const r = claude(cfg, ["plugin", "install", `${name}@${MKT}`, "--json"]);
    if (r.status !== 0) { failed.add(name); fail(`[FIXTURE_PLUGIN_MISSING] install: ${name}@${MKT} — ${lastLine(r)}`); }
  }
  assertInstalled(cfg, "install", failed);
  // What Claude Code wrote must be the D-006 shape: same marketplace key, `true` per bundle.
  const written = readSettings(cfg);
  if (!written.extraKnownMarketplaces?.[MKT]) fail(`[FIXTURE_SHAPE_DRIFT] Claude Code registered the marketplace under another key than "${MKT}"`);
  for (const name of required.filter((n) => !failed.has(n))) {
    if (written.enabledPlugins?.[`${name}@${MKT}`] !== true) fail(`[FIXTURE_SHAPE_DRIFT] Claude Code did not write enabledPlugins["${name}@${MKT}"] = true`);
  }
  if (problems.length === before && required.length) say(`[FIXTURE_INSTALL_OK] ${required.length} bundle(s) installed and enabled; settings match the D-006 shape`);
}

// ── reconcile ── report-only (D-015: D-013 (c) / D-014 suspended pending Q5): what a profile holding ONLY the
// registration JSON does, before and after one headless start. Runs with or without a credential:
// without one the start fails "Not logged in", which still shows whether a start registers the entry.
{
  const cfg = profile("reconcile"), cred = Boolean(process.env.ANTHROPIC_API_KEY);
  const settings = { extraKnownMarketplaces: { [MKT]: { source: localSource } }, enabledPlugins: {} };
  for (const name of required) settings.enabledPlugins[`${name}@${MKT}`] = true;
  writeFileSync(join(cfg, "settings.json"), JSON.stringify(settings, null, 2));
  say(`[FIXTURE_Q4_OBSERVED] before any start: marketplace registered=${registered(cfg)}`);
  const r = claude(cfg, ["-p", "Reply with OK.", "--max-turns", "1", "--output-format", "stream-json", "--verbose"],
    { CLAUDE_CODE_SYNC_PLUGIN_INSTALL: "1" });
  if (cred && r.status !== 0) fail(`[FIXTURE_RECONCILE] headless start failed with a credential (exit ${r.status}): ${lastLine(r)}`);
  if (!cred) say("[FIXTURE_SKIP_NO_CREDENTIAL] ANTHROPIC_API_KEY is unset — the start ran unauthenticated; install state below shows no-auth behaviour only");
  const init = r.stdout.split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .find((e) => e?.type === "system" && e?.subtype === "init");
  if (init?.plugin_errors?.length) say(`[FIXTURE_Q4_OBSERVED] init plugin_errors: ${JSON.stringify(init.plugin_errors).slice(0, 300)}`);
  const loaded = new Set((init?.plugins || []).map((p) => (typeof p === "string" ? p : p.name)));
  const have = installed(cfg);
  say(`[FIXTURE_Q4_OBSERVED] after one ${cred ? "authenticated" : "unauthenticated"} start: marketplace registered=${registered(cfg)}`);
  for (const name of required) {
    const id = `${name}@${MKT}`, p = have.get(id);
    const state = p ? (p.enabled === true ? "installed+enabled" : "installed,disabled") : "not-installed";
    // Sync install is forced so a short -p run does not exit before a background install lands;
    // rein-app's real flow does not set it, so the line says so (E-9 M2 measures the default).
    say(`[FIXTURE_Q4_OBSERVED] ${id} from settings alone (sync-install forced): ${state}; loaded-at-init=${loaded.has(name) || loaded.has(id)}`);
  }
}
finish();

function readSettings(cfg) { try { return JSON.parse(readFileSync(join(cfg, "settings.json"), "utf8")); } catch { return {}; } }
function registered(cfg) {
  const r = claude(cfg, ["plugin", "marketplace", "list", "--json"]);
  try { return JSON.parse(r.stdout).some((m) => m.name === MKT); } catch { return "unknown"; }
}
function lastLine(r) { return String(r.stderr || r.stdout || "").trim().split("\n").pop().slice(0, 240); }
function finish(skipped = false) {
  for (const p of problems) console.error(p);
  if (problems.length) process.exit(1);
  say(skipped ? `[FIXTURE_SKIPPED] shape checked only; nothing installed` : `[FIXTURE_OK] marketplace=${MKT} bundles=${bundles.join(",")}`);
  process.exit(0);
}
