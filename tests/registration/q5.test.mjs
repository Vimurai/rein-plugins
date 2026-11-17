// Unit tests for the Q5 classifiers (E-9). The live measurements run in CI
// (q5-measurements.mjs); these cover the branches CI cannot force: a trunk-tracking clone, an
// absent ref, a changed or duplicated entry, and the no-path line hygiene (D-117).
import { test } from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MKT, classifyM1, classifyM4, formatLine, summariseM2 } from "./q5.mjs";

const A = "a".repeat(40), B = "b".repeat(40);
const gh = (ref) => ({ source: "github", repo: "Vimurai/rein-plugins", ...(ref ? { ref } : {}) });
// The runner's profiles live under the OS temp dir; a line must never echo that location.
const LOC = join(tmpdir(), "rein-plugins-q5-m1-x", "plugins", "marketplaces", MKT);
const known = (ref) => ({ [MKT]: { source: gh(ref), installLocation: LOC } });

test("M1: clone on origin/stable with ref stable is a match, not trunk-tracking", () => {
  const r = classifyM1({ known: known("stable"), head: A, originStable: A });
  assert.equal(r.line, "registered=true ref=stable head=aaaaaaa origin/stable=aaaaaaa head-match");
  assert.equal(r.trunkTracking, false);
});

test("M1: HEAD ≠ origin/stable is flagged as trunk-tracking", () => {
  const r = classifyM1({ known: known("stable"), head: B, originStable: A });
  assert.match(r.line, /HEAD_MISMATCH$/);
  assert.equal(r.trunkTracking, true);
});

test("M1: a registration that dropped the ref is flagged even when HEAD happens to match", () => {
  const r = classifyM1({ known: known(), head: A, originStable: A });
  assert.match(r.line, /ref=absent/);
  assert.equal(r.trunkTracking, true);
});

test("M1: not registered and registered-without-clone are distinct results", () => {
  assert.equal(classifyM1({ known: {}, head: "", originStable: A }).line, "registered=false");
  assert.match(classifyM1({ known: known("stable"), head: "", originStable: A }).line, /head=no-clone/);
});

test("M2: counts installs across profiles and collapses version/sha", () => {
  const hit = { plugins: { [`rein-seo@${MKT}`]: [{ version: "0.1.0", gitCommitSha: A }] } };
  assert.equal(summariseM2([hit, null, hit]), `rein-seo@${MKT} installs=2/3 version=0.1.0 sha=aaaaaaa`);
  assert.equal(summariseM2([null, { plugins: {} }, null]), `rein-seo@${MKT} installs=0/3 version=- sha=-`);
});

test("M4: re-adding on a reconciled profile with the same entry is idempotent", () => {
  const s = { known: known("stable"), settings: { extraKnownMarketplaces: { [MKT]: { source: gh("stable") } } } };
  const after = structuredClone(s);
  after.known[MKT].lastUpdated = "2026-11-17T00:00:00Z"; // a refresh may touch the timestamp
  const r = classifyM4({ exit: 0, before: s, after });
  assert.equal(r.line, "prior=reconciled exit=0 entry=unchanged known-entries=1 settings-entries=1");
  assert.equal(r.ok, true);
});

test("M4: a changed source, a duplicate key or a first add are not idempotent", () => {
  const s = { known: known("stable"), settings: { extraKnownMarketplaces: { [MKT]: { source: gh("stable") } } } };
  const changed = structuredClone(s); changed.known[MKT].source = gh();
  assert.match(classifyM4({ exit: 0, before: s, after: changed }).line, /entry=CHANGED/);
  const dup = structuredClone(s); dup.known["rein-plugins-2"] = { source: gh("stable") };
  const r = classifyM4({ exit: 0, before: s, after: dup });
  assert.match(r.line, /known-entries=2 settings-entries=1 DUPLICATE$/);
  assert.equal(r.ok, false);
  assert.match(classifyM4({ exit: 0, before: { known: {}, settings: {} }, after: s }).line, /^prior=NOT_RECONCILED/);
});

test("no result line carries a filesystem path (D-117)", () => {
  const lines = [
    classifyM1({ known: known("stable"), head: B, originStable: A }).line,
    classifyM4({ exit: 0, before: { known: known("stable") }, after: { known: known("stable") } }).line,
  ];
  for (const l of lines) { assert.ok(!l.includes(tmpdir()), l); assert.doesNotMatch(l, /installLocation|rein-plugins-q5-/); }
});

test("every M line names the Claude version and the source kind (Architect 2026-11-17 18:40)", () => {
  assert.equal(formatLine(1, "2.1.326", "registered=false"), "[FIXTURE_Q5_M1] 2.1.326 source=github registered=false");
  assert.match(formatLine(4, "2.1.326", "prior=NOT_RECONCILED", "directory"), /^\[FIXTURE_Q5_M4\] 2\.1\.326 source=directory /);
});
