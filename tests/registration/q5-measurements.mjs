#!/usr/bin/env node
// Q5 measurements (E-9, D-016) — REPORT-ONLY. One line each, `[FIXTURE_Q5_M<n>] <claude version> <result>`,
// against the live public repo (github source Vimurai/rein-plugins @ stable), each in a throwaway
// CLAUDE_CONFIG_DIR. Exit 0 whatever is observed; the lines are evidence for rein-app, not a gate.
//
//   M1  registration by start, unauthenticated: a profile holding only the github registration entry
//       (+ enabledPlugins rein-seo) gets one `claude -p` start with no credential. Reports whether
//       known_marketplaces.json carries ref "stable" and whether the clone's HEAD equals origin/stable.
//       A mismatch also prints [FIXTURE_Q5_TRUNK_TRACKING]: tell the Architect the same day.
//   M2  install by start, authenticated (ANTHROPIC_API_KEY): three fresh profiles holding the github
//       entry and only enabledPlugins {"rein-seo@rein-plugins": true}, one default start each (no
//       CLAUDE_CODE_SYNC_PLUGIN_INSTALL). Counts installs, records version + sha.
//   M4  idempotence: `claude plugin marketplace add Vimurai/rein-plugins#stable --scope user` on the
//       profile M1's start reconciled — exit code, entry unchanged, no duplicate key.
// Skips: [FIXTURE_SKIP_NO_CLAUDE] (no CLI), [FIXTURE_SKIP_NO_NETWORK] (remote unreachable — all
// three), [FIXTURE_SKIP_NO_CREDENTIAL] (M2 only).
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MKT, REF, REPO, classifyM1, classifyM4, formatLine, summariseM2 } from "./q5.mjs";

const say = (line) => console.log(line);
const ver = spawnSync("claude", ["--version"], { encoding: "utf8" });
if (ver.status !== 0) { say("[FIXTURE_SKIP_NO_CLAUDE] `claude` is not on PATH — Q5 measurements skipped"); process.exit(0); }
const version = (ver.stdout.match(/\d+\.\d+\.\d+/) || ["unknown"])[0];
const line = (n, result) => say(formatLine(n, version, result));

const remote = spawnSync("git", ["ls-remote", `https://github.com/${REPO}`, `refs/heads/${REF}`],
  { encoding: "utf8", timeout: 30_000, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
const originStable = remote.status === 0 ? remote.stdout.split(/\s/)[0] : "";
if (!originStable) {
  for (const n of [1, 2, 4]) say(`[FIXTURE_SKIP_NO_NETWORK] M${n}: ${REPO} refs/heads/${REF} unreachable`);
  process.exit(0);
}

// Throwaway profiles, removed on exit (they hold marketplace clones).
const profiles = [];
process.on("exit", () => { for (const d of profiles) rmSync(d, { recursive: true, force: true }); });
const profile = (label, settings) => {
  const d = mkdtempSync(join(tmpdir(), `rein-plugins-q5-${label}-`));
  profiles.push(d);
  writeFileSync(join(d, "settings.json"), JSON.stringify(settings, null, 2));
  return d;
};
// Only the credential may pass through (and only where a measurement asks for it): the caller's
// CLAUDE_* / ANTHROPIC_* must not steer the run.
const scrubbed = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(CLAUDE_|ANTHROPIC_)/.test(k)));
const claude = (cfg, args, { auth = false } = {}) => spawnSync("claude", args, {
  encoding: "utf8", cwd: cfg, timeout: 180_000, input: "", // no stdin: `-p` would wait 3 s for it
  env: { ...scrubbed, CLAUDE_CONFIG_DIR: cfg, ...(auth ? { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY } : {}) },
});
const start = (cfg, opts) => claude(cfg, ["-p", "Reply with OK.", "--max-turns", "1"], opts);
const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const snapshot = (cfg) => ({ known: readJson(join(cfg, "plugins", "known_marketplaces.json")) || {}, settings: readJson(join(cfg, "settings.json")) || {} });
const registration = (enabled) => ({
  extraKnownMarketplaces: { [MKT]: { source: { source: "github", repo: REPO, ref: REF } } },
  enabledPlugins: enabled,
});
const seoOnly = { [`rein-seo@${MKT}`]: true };

// ── M1 ──
const m1 = profile("m1", registration(seoOnly));
start(m1); // unauthenticated on purpose: "Not logged in" still shows whether a start registers
{
  const { known } = snapshot(m1);
  const loc = known[MKT]?.installLocation || join(m1, "plugins", "marketplaces", MKT);
  const rev = spawnSync("git", ["-C", loc, "rev-parse", "HEAD"], { encoding: "utf8" });
  const head = rev.status === 0 ? rev.stdout.trim() : "";
  const r = classifyM1({ known, head, originStable });
  line(1, r.line);
  if (r.trunkTracking) say(`[FIXTURE_Q5_TRUNK_TRACKING] M1: the start-registered clone does not follow ${REF} — report to the Architect the same day (rein-app D-007/D-009)`);
}

// ── M2 ──
if (!process.env.ANTHROPIC_API_KEY) {
  say("[FIXTURE_SKIP_NO_CREDENTIAL] M2: ANTHROPIC_API_KEY is unset — install-by-start needs an authenticated start");
} else {
  const samples = [], exits = [];
  for (let i = 1; i <= 3; i++) {
    const cfg = profile(`m2-${i}`, registration(seoOnly));
    exits.push(start(cfg, { auth: true }).status);
    samples.push(readJson(join(cfg, "plugins", "installed_plugins.json")));
  }
  line(2, `${summariseM2(samples)} start-exits=${exits.join(",")}`);
}

// ── M4 ──
{
  const before = snapshot(m1);
  const add = claude(m1, ["plugin", "marketplace", "add", `${REPO}#${REF}`, "--scope", "user"]);
  line(4, classifyM4({ exit: add.status, before, after: snapshot(m1) }).line);
}
