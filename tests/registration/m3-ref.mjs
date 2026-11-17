#!/usr/bin/env node
// M3 (E-8, D-014) — an ASSERTION, unlike the report-only M1/M2/M4: in a throwaway CLAUDE_CONFIG_DIR,
// `claude plugin marketplace add Vimurai/rein-plugins#stable --scope user` against the live public
// repo must write extraKnownMarketplaces["rein-plugins"].source with ref "stable" and repo
// "Vimurai/rein-plugins". Exit 1 with [FIXTURE_REF_MISSING] when the ref is absent (rein-app reopens
// its D-007 on that signal), [FIXTURE_SHAPE_DRIFT] on any other mismatch. Skips (exit 0):
// [FIXTURE_SKIP_NO_CLAUDE], [FIXTURE_SKIP_NO_NETWORK].
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { REF, REPO, classifyM3, formatLine } from "./q5.mjs";

const ver = spawnSync("claude", ["--version"], { encoding: "utf8" });
if (ver.status !== 0) { console.log("[FIXTURE_SKIP_NO_CLAUDE] `claude` is not on PATH — M3 skipped"); process.exit(0); }
const version = (ver.stdout.match(/\d+\.\d+\.\d+/) || ["unknown"])[0];

const remote = spawnSync("git", ["ls-remote", `https://github.com/${REPO}`, `refs/heads/${REF}`],
  { encoding: "utf8", timeout: 30_000, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
if (remote.status !== 0 || !remote.stdout.trim()) {
  console.log(`[FIXTURE_SKIP_NO_NETWORK] M3: ${REPO} refs/heads/${REF} unreachable`);
  process.exit(0);
}

let cfg = "";
process.on("exit", () => { if (cfg) rmSync(cfg, { recursive: true, force: true }); });
cfg = mkdtempSync(join(tmpdir(), "rein-plugins-m3-"));
// The caller's CLAUDE_* / ANTHROPIC_* must not steer the run; no credential is needed to add.
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(CLAUDE_|ANTHROPIC_)/.test(k)));
const add = spawnSync("claude", ["plugin", "marketplace", "add", `${REPO}#${REF}`, "--scope", "user"],
  { encoding: "utf8", cwd: cfg, timeout: 180_000, input: "", env: { ...env, CLAUDE_CONFIG_DIR: cfg } });
let settings = null;
try { settings = JSON.parse(readFileSync(join(cfg, "settings.json"), "utf8")); } catch { /* absent = not registered */ }
const r = classifyM3(settings);
console.log(formatLine(3, version, `exit=${add.status} ${r.line}`));
if (r.fail) {
  console.log(`${r.fail} M3: \`marketplace add ${REPO}#${REF}\` did not write ref "${REF}" and repo "${REPO}" — report to the Architect (rein-app D-007)`);
  process.exit(1);
}
