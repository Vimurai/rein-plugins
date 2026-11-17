#!/usr/bin/env node
// Language-pack edit hook runner (.ai/blueprints/language-packs.md §Components 2). CANONICAL COPY:
// every pack ships this file byte-identical as hooks/run.mjs, and CI fails on drift
// ([PACK_RUNNER_DRIFT]). All language knowledge lives in the pack's pack.json, none here.
//
// PostToolUse Edit|Write: format the one edited file, then lint it, with tools the project already
// has (each `local` dir under the project root, then PATH; never a package runner that downloads).
//   clean, skipped or failed open  → exit 0, no output
//   lint findings / formatter error → exit 2, stderr: `[<pack>] <tool> reported:` + ≤ 40 lines,
//                                     paths made project-relative
// Fail open: a missing tool, a file outside the project, a non-matching extension, a timeout or any
// error of the runner itself exits 0 silently — a pack never makes an edit fail.
// Security: arguments are an array, never a shell; only the edited file, and only inside the project.
import { spawnSync } from "node:child_process";
import { accessSync, constants, existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const TOOL_MS = 10_000;   // per tool (§Execution Constraints)
const TOTAL_MS = 15_000;  // whole hook
const MAX_LINES = 40;
const started = Date.now();
const quiet = () => process.exit(0);

// A test may only LOWER the budgets (tests/packs), never raise them.
const lower = (name, cap) => {
  const v = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(v) && v > 0 ? Math.min(v, cap) : cap;
};
const toolMs = lower("REIN_PACK_TOOL_MS", TOOL_MS);
const totalMs = lower("REIN_PACK_TOTAL_MS", TOTAL_MS);

function readStdin() {
  try { return JSON.parse(readFileSync(0, "utf8")); } catch { return null; }
}

// "false"/"0"/"no"/"off" switch an option off; unset or anything else keeps the default (true).
const enabled = (key) => !/^(false|0|no|off)$/i.test(String(process.env[`CLAUDE_PLUGIN_OPTION_${key}`] ?? "").trim());

function isExecutable(p) {
  try { return statSync(p).isFile() && (accessSync(p, constants.X_OK), true); } catch { return false; }
}

// Resolution order: each `local` dir under the project root, then PATH. Returns an absolute path or "".
function resolveBin(tool, project) {
  if (typeof tool.bin !== "string" || !/^[A-Za-z0-9._+-]+$/.test(tool.bin)) return "";
  for (const d of tool.local || []) {
    const p = resolve(project, d, tool.bin);
    if (inside(project, p) && isExecutable(p)) return p;
  }
  for (const d of (process.env.PATH || "").split(delimiter)) {
    if (!d || !isAbsolute(d)) continue;   // a relative PATH entry would resolve against the project
    const p = join(d, tool.bin);
    if (isExecutable(p)) return p;
  }
  return "";
}

function inside(root, p) {
  const r = relative(root, p);
  return r !== "" && !r.startsWith(`..${sep}`) && r !== ".." && !isAbsolute(r);
}

// The first tool whose `needs` are met (one listed config file exists) and whose binary resolves.
function pick(tools, project) {
  for (const t of Array.isArray(tools) ? tools : []) {
    if (Array.isArray(t.needs) && t.needs.length && !t.needs.some((n) => existsSync(join(project, n)))) continue;
    const bin = resolveBin(t, project);
    if (bin) return { ...t, path: bin };
  }
  return null;
}

const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;
function report(pack, tool, out, project, real) {
  const roots = [...new Set([real, project])].sort((a, b) => b.length - a.length);
  let text = out.replace(ANSI, "");
  for (const r of roots) text = text.split(r + sep).join("").split(r).join(".");
  // Any other path under the home directory (a global tool, a config it quotes) → "~" (D-117).
  const home = (() => { try { return homedir(); } catch { return ""; } })();
  if (home && home !== sep) text = text.split(home + sep).join(`~${sep}`);
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const shown = lines.slice(0, MAX_LINES);
  if (lines.length > MAX_LINES) shown[MAX_LINES - 1] = `… ${lines.length - MAX_LINES + 1} more lines`;
  process.stderr.write(`[${pack}] ${tool} reported:\n${shown.join("\n")}\n`);
  process.exit(2);
}

// Runs one tool on the file; returns { ok, out } or null when it timed out or could not start.
function run(tool, arg, cwd) {
  const left = totalMs - (Date.now() - started);
  if (left <= 0) return null;
  const args = (tool.args || []).map((a) => (a === "{file}" ? arg : String(a)));
  const r = spawnSync(tool.path, args, {
    cwd, encoding: "utf8", shell: false, timeout: Math.min(toolMs, left), killSignal: "SIGKILL",
    input: "", maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
  });
  if (r.error || r.signal || r.status === null) return null;
  return { ok: r.status === 0, out: `${r.stdout || ""}\n${r.stderr || ""}` };
}

try {
  const here = dirname(fileURLToPath(import.meta.url));
  const pack = JSON.parse(readFileSync(join(here, "..", "pack.json"), "utf8"));
  let name = `rein-${pack.language}`;
  try { name = JSON.parse(readFileSync(join(here, "..", ".claude-plugin", "plugin.json"), "utf8")).name || name; } catch { /* keep */ }

  const input = readStdin();
  const file = input?.tool_input?.file_path;
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input?.cwd;
  if (typeof file !== "string" || !file || typeof projectDir !== "string" || !projectDir) quiet();

  const exts = (pack.extensions || []).map((e) => String(e).toLowerCase());
  if (!exts.includes(extname(file).toLowerCase())) quiet();

  const project = realpathSync(projectDir);
  const real = realpathSync(isAbsolute(file) ? file : resolve(projectDir, file));
  if (!inside(project, real) || !statSync(real).isFile()) quiet();

  // Project-relative, "./"-prefixed: a file named "-x.ts" is never read as an option.
  const arg = `.${sep}${relative(project, real)}`;

  if (enabled("FORMAT_ON_EDIT")) {
    const fmt = pick(pack.format, project);
    if (fmt) {
      const r = run(fmt, arg, project);
      if (!r) quiet();
      if (!r.ok) report(name, fmt.bin, r.out, projectDir, project);
    }
  }
  if (enabled("LINT_ON_EDIT")) {
    const lint = pick(pack.lint, project);
    if (lint) {
      const r = run(lint, arg, project);
      if (r && !r.ok) report(name, lint.bin, r.out, projectDir, project);
    }
  }
  quiet();
} catch {
  quiet();
}
