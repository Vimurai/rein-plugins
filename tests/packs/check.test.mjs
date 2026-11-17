// Pack check behaviour (scripts/check-marketplace.mjs, .ai/blueprints/language-packs.md §Components 4).
// New suite: no earlier test runs check-marketplace. Each case copies the TRACKED tree (git ls-files,
// so ignored leftovers in a working tree never decide the result) into a temp dir, breaks one thing
// and expects exactly that named reason. Needs from the host: git and node.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const tracked = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "--", ".claude-plugin", "plugins", "scripts"], { cwd: repo, encoding: "utf8" })
  .split("\n").filter(Boolean);

function tree(t) {
  const d = mkdtempSync(join(tmpdir(), "rein-pack-check-"));
  t.after(() => rmSync(d, { recursive: true, force: true }));
  for (const f of tracked) {
    try { mkdirSync(dirname(join(d, f)), { recursive: true }); copyFileSync(join(repo, f), join(d, f)); } catch { /* a deleted, still-listed file */ }
  }
  return d;
}
const check = (d) => spawnSync(process.execPath, [join(d, "scripts", "check-marketplace.mjs"), d], { encoding: "utf8" });
const ts = (d, ...p) => join(d, "plugins", "rein-typescript", ...p);
const edit = (f, fn) => writeFileSync(f, fn(readFileSync(f, "utf8")));

test("the tracked tree passes the pack check", (t) => {
  const r = check(tree(t));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^\[MARKETPLACE_OK\]/);
});

const cases = [
  ["[PACK_RUNNER_DRIFT]", "a pack's runner differs from the template", (d) => appendFileSync(ts(d, "hooks", "run.mjs"), "\n// drift\n")],
  ["[PACK_RUNNER_DRIFT]", "hooks.json was not regenerated after pack.json changed", (d) => edit(ts(d, "pack.json"), (s) => s.replace('".cjs"]', '".cjs", ".es6"]'))],
  ["[PACK_HOOK_EVENT]", "a PreToolUse hook is registered", (d) => edit(ts(d, "hooks", "hooks.json"), (s) => s.replace('"PostToolUse"', '"PreToolUse"'))],
  ["[PACK_HOOK_EVENT]", "plugin.json declares hooks of its own", (d) => edit(ts(d, ".claude-plugin", "plugin.json"), (s) => s.replace('"license"', '"hooks": "./x.json", "license"'))],
  ["[PACK_NAME_RESERVED]", "a skill takes a name rein provisions", (d) => { mkdirSync(ts(d, "skills", "x")); writeFileSync(ts(d, "skills", "x", "SKILL.md"), "---\nname: commit-crafter\ndescription: x\n---\n"); }],
  ["[PACK_NAME_RESERVED]", "a skill uses the rein- prefix", (d) => { mkdirSync(ts(d, "skills", "y")); writeFileSync(ts(d, "skills", "y", "SKILL.md"), "---\nname: rein-ts\ndescription: x\n---\n"); }],
  ["[PACK_PART_MISSING]", "the review skill is missing", (d) => unlinkSync(ts(d, "skills", "typescript-review", "SKILL.md"))],
  ["[PACK_PART_MISSING]", "pack.json without its runner", (d) => unlinkSync(ts(d, "hooks", "run.mjs"))],
  ["[PACK_SKILL_SHAPE]", "the conventions skill lost its paths:", (d) => edit(ts(d, "skills", "typescript-conventions", "SKILL.md"), (s) => s.replace(/^paths:/m, "globs:"))],
  ["[PACK_DESCRIPTOR_INVALID]", "a formatter runs through a downloading package runner", (d) => edit(ts(d, "pack.json"), (s) => s.replace('"bin": "prettier"', '"bin": "npx"'))],
];
for (const [reason, label, breakIt] of cases) {
  test(`${reason} when ${label}`, (t) => {
    const d = tree(t);
    breakIt(d);
    const r = check(d);
    assert.equal(r.status, 1);
    assert.ok(r.stderr.split("\n").some((l) => l.startsWith(reason)), `expected ${reason}, got:\n${r.stderr}`);
  });
}

test("a pack fresh from scripts/new-pack.mjs passes the pack check (with and without a hook)", (t) => {
  const d = tree(t);
  for (const args of [["demo", "--ext", ".demo,.dm"], ["frame", "--ext", ".frm", "--no-hook"]]) {
    const r = spawnSync(process.execPath, [join(d, "scripts", "new-pack.mjs"), ...args], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
  }
  const r = check(d);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /plugins=3/);
});
