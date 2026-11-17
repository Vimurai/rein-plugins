// Edit-hook runner behaviour (.ai/blueprints/language-packs.md §Components 5). New suite: no earlier
// test covers the runner. Every pack's hooks/run.mjs is exercised against a throwaway project with
// STUB formatter/linter executables on PATH — no real toolchain is installed or needed.
// Needs from the host: node and /bin/sh (the stubs are sh scripts). Nothing is written outside the
// per-test temp dir, which is removed after each test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const packs = readdirSync(join(repo, "plugins"))
  .filter((p) => existsSync(join(repo, "plugins", p, "pack.json")))
  .map((p) => ({ name: p, dir: join(repo, "plugins", p), desc: JSON.parse(readFileSync(join(repo, "plugins", p, "pack.json"), "utf8")) }));

// A throwaway project + stub bin dir. `stubs` maps a tool name to an sh body; every stub appends
// "<name> <args…>" to calls.log so a test can see exactly what ran, with which argv.
function sandbox(t, stubs = {}) {
  const root = mkdtempSync(join(tmpdir(), "rein-pack-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const project = join(root, "project"), bin = join(root, "bin");
  mkdirSync(project); mkdirSync(bin);
  const log = join(root, "calls.log");
  for (const [name, body] of Object.entries(stubs)) {
    const p = join(bin, name);
    writeFileSync(p, `#!/bin/sh\nprintf '%s' "${name}" >> "${log}"; for a in "$@"; do printf ' [%s]' "$a" >> "${log}"; done; echo >> "${log}"\n${body}\n`);
    chmodSync(p, 0o755);
  }
  return { root, project, bin, log, calls: () => (existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean) : []) };
}

function hook(pack, sb, filePath, env = {}) {
  const r = spawnSync(process.execPath, [join(pack.dir, "hooks", "run.mjs")], {
    input: JSON.stringify({ hook_event_name: "PostToolUse", tool_name: "Edit", tool_input: { file_path: filePath }, cwd: sb.project }),
    encoding: "utf8",
    env: { PATH: `${sb.bin}:/usr/bin:/bin`, CLAUDE_PROJECT_DIR: sb.project, ...env },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

// Writes the config files a tool `needs`, so the tool is eligible.
const meetNeeds = (sb, tool) => { if (tool.needs?.length) writeFileSync(join(sb.project, tool.needs[0]), "{}\n"); };

test("there is at least one pack with a hook to test", () => {
  assert.ok(packs.length >= 1, "no plugins/*/pack.json found");
});

for (const pack of packs) {
  const fmt = pack.desc.format?.[0];
  const lint = pack.desc.lint?.[0];
  const ext = pack.desc.extensions[0];

  test(`${pack.name}: (a) the formatter runs on a matching file, with the project-relative path`, (t) => {
    if (!fmt) return t.skip(`${pack.name} has no formatter`);
    for (const e of pack.desc.extensions) {
      const sb = sandbox(t, { [fmt.bin]: "exit 0" });
      meetNeeds(sb, fmt);
      const f = join(sb.project, `src${e}`);
      writeFileSync(f, "x\n");
      const r = hook(pack, sb, f, { CLAUDE_PLUGIN_OPTION_LINT_ON_EDIT: "false" });
      assert.equal(r.code, 0, r.err);
      assert.equal(r.err, "");
      assert.equal(sb.calls().length, 1, `formatter not run for ${e}`);
      assert.match(sb.calls()[0], new RegExp(`^${fmt.bin} .*\\[\\./src\\${e}\\]`));
    }
  });

  test(`${pack.name}: (b) lint findings exit 2 with a header and at most 40 project-relative lines`, (t) => {
    if (!lint) return t.skip(`${pack.name} has no linter on edit`);
    const sb = sandbox(t, { [lint.bin]: `echo "${"$"}HOME/.config/tool/rc: note"; i=0; while [ $i -lt 100 ]; do echo "${"$"}PWD/src${ext}:$i error"; i=$((i+1)); done; exit 1` });
    meetNeeds(sb, lint);
    const f = join(sb.project, `src${ext}`);
    writeFileSync(f, "x\n");
    const r = hook(pack, sb, f, { CLAUDE_PLUGIN_OPTION_FORMAT_ON_EDIT: "false", HOME: join(sb.root, "home") });
    assert.equal(r.code, 2);
    const lines = r.err.trimEnd().split("\n");
    assert.equal(lines[0], `[${pack.name}] ${lint.bin} reported:`);
    assert.ok(lines.length - 1 <= 40, `${lines.length - 1} lines`);
    assert.ok(!r.err.includes(sb.root), "an absolute path reached the output");
    assert.equal(lines[1], "~/.config/tool/rc: note", "a home-directory path was not redacted");
    assert.match(lines[2], new RegExp(`^src\\${ext}:0 error$`));
  });

  test(`${pack.name}: (c) missing tool, outside file, other extension and timeout exit 0 silently`, (t) => {
    const tools = [...(pack.desc.format || []), ...(pack.desc.lint || [])];
    // missing tool: no stubs at all (the test PATH keeps /usr/bin:/bin for sh and sleep, so a host
    // that has a real copy there cannot prove "missing" — recorded as a skip, never a fake pass)
    const real = tools.filter((tl) => ["/usr/bin", "/bin"].some((d) => existsSync(join(d, tl.bin))));
    if (real.length) t.diagnostic(`SKIP missing-tool case: ${real.map((tl) => tl.bin).join(",")} installed on this host`);
    else {
      const sb = sandbox(t);
      for (const tl of tools) meetNeeds(sb, tl);
      const f = join(sb.project, `a${ext}`); writeFileSync(f, "x\n");
      const r = hook(pack, sb, f);
      assert.deepEqual([r.code, r.err, r.out], [0, "", ""], "missing tool");
    }
    // file outside the project, other extension: stubs that would fail loudly if run
    {
      const stubs = Object.fromEntries(tools.map((tl) => [tl.bin, "echo ran; exit 1"]));
      const sb = sandbox(t, stubs);
      for (const tl of tools) meetNeeds(sb, tl);
      const outside = join(sb.root, `outside${ext}`); writeFileSync(outside, "x\n");
      const other = join(sb.project, "notes.unmatched-ext"); writeFileSync(other, "x\n");
      for (const [label, f] of [["outside the project", outside], ["non-matching extension", other]]) {
        const r = hook(pack, sb, f);
        assert.deepEqual([r.code, r.err, r.out], [0, "", ""], label);
      }
      assert.deepEqual(sb.calls(), [], "a tool ran for a file it must not touch");
    }
    // timeout: a stub that sleeps past a lowered budget is killed and the hook stays silent
    if (tools.length) {
      const stubs = Object.fromEntries(tools.map((tl) => [tl.bin, "sleep 5; echo late; exit 1"]));
      const sb = sandbox(t, stubs);
      for (const tl of tools) meetNeeds(sb, tl);
      const f = join(sb.project, `a${ext}`); writeFileSync(f, "x\n");
      const t0 = Date.now();
      const r = hook(pack, sb, f, { REIN_PACK_TOOL_MS: "300", REIN_PACK_TOTAL_MS: "600" });
      assert.deepEqual([r.code, r.err, r.out], [0, "", ""], "timeout");
      assert.ok(Date.now() - t0 < 4000, "the hook waited for the sleeping tool");
    }
  });

  test(`${pack.name}: (d) a file name with shell metacharacters runs no extra command`, (t) => {
    const tool = fmt || lint;
    if (!tool) return t.skip(`${pack.name} has no tool on edit`);
    const sb = sandbox(t, { [tool.bin]: "exit 0" });
    meetNeeds(sb, tool);
    const evil = `a;touch PWNED $(touch PWNED2) \`touch PWNED3\` |x${ext}`;
    const f = join(sb.project, evil); writeFileSync(f, "x\n");
    const r = hook(pack, sb, f);
    assert.equal(r.code, 0, r.err);
    for (const p of ["PWNED", "PWNED2", "PWNED3"]) {
      assert.ok(!existsSync(join(sb.project, p)) && !existsSync(join(sb.root, p)), `${p} was created`);
    }
    assert.ok(sb.calls().every((c) => c.startsWith(`${tool.bin} `)), "an unexpected command ran");
    assert.ok(sb.calls()[0].includes(`[./${evil}]`), "the file name did not reach the tool as one argument");
  });

  test(`${pack.name}: a tool whose needs are absent is skipped`, (t) => {
    const needy = [...(pack.desc.format || []), ...(pack.desc.lint || [])].filter((tl) => tl.needs?.length);
    if (!needy.length) return t.skip(`${pack.name} has no tool with needs`);
    const sb = sandbox(t, Object.fromEntries(needy.map((tl) => [tl.bin, "echo ran; exit 1"])));
    const f = join(sb.project, `a${ext}`); writeFileSync(f, "x\n");
    const r = hook(pack, sb, f);
    assert.deepEqual([r.code, r.err], [0, ""]);
    assert.deepEqual(sb.calls(), [], "a tool ran without its config");
  });
}
