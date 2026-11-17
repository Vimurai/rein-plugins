// Shared by scripts/new-pack.mjs (writes) and scripts/check-marketplace.mjs (verifies), so a pack's
// generated files are produced and checked by one definition (.ai/blueprints/language-packs.md).

export const HOOK_EVENT = "PostToolUse";
export const HOOK_MATCHER = "Edit|Write";
export const HOOK_TIMEOUT_S = 20; // the runner stops itself at 15 s; this is the outer bound

// hooks.json for a pack: one handler per (tool, extension) — an `if` filter holds exactly one
// permission rule. The trailing "<Tool> <ext>" argument (ignored by the runner) keeps every command
// string distinct, so no handler can be deduplicated away. A missing `node` exits 0 (fail open);
// `exec` passes the runner's exit code (2 = findings) through unchanged.
export function hooksFor(pack) {
  const handlers = [];
  for (const ext of pack.extensions) {
    for (const tool of ["Edit", "Write"]) {
      handlers.push({
        type: "command",
        if: `${tool}(**/*${ext})`,
        command: `command -v node >/dev/null 2>&1 || exit 0; exec node "\${CLAUDE_PLUGIN_ROOT}/hooks/run.mjs" ${tool} ${ext}`,
        timeout: HOOK_TIMEOUT_S,
      });
    }
  }
  return { hooks: { [HOOK_EVENT]: [{ matcher: HOOK_MATCHER, hooks: handlers }] } };
}

export const hooksJsonText = (pack) => `${JSON.stringify(hooksFor(pack), null, 2)}\n`;

// The two boolean options every pack with a hook declares (blueprint §Data Model userConfig).
export const USER_CONFIG = {
  format_on_edit: {
    type: "boolean",
    title: "Format on edit",
    description: "Run the project's own formatter on each file Claude edits.",
    default: true,
  },
  lint_on_edit: {
    type: "boolean",
    title: "Lint on edit",
    description: "Run the project's own linter on each file Claude edits and show its findings to Claude.",
    default: true,
  },
};

// Lower-case, with the dot, letters/digits only after it.
export const validExt = (e) => typeof e === "string" && /^\.[a-z0-9]+$/.test(e);

// Problems with a pack.json, as plain strings (the caller adds the named reason).
export function descriptorProblems(pack) {
  const out = [];
  if (!pack || typeof pack !== "object") return ["pack.json is not an object"];
  if (typeof pack.language !== "string" || !/^[a-z][a-z0-9]*$/.test(pack.language)) out.push("language must be a lower-case word");
  if (!Array.isArray(pack.extensions) || !pack.extensions.length) out.push("extensions must be a non-empty array");
  else for (const e of pack.extensions) if (!validExt(e)) out.push(`extension ${JSON.stringify(e)} is not lower-case with a dot`);
  for (const key of ["format", "lint"]) {
    if (!Array.isArray(pack[key])) { out.push(`${key} must be an array`); continue; }
    for (const t of pack[key]) {
      if (typeof t?.bin !== "string" || !/^[A-Za-z0-9._+-]+$/.test(t.bin)) out.push(`${key}: bin ${JSON.stringify(t?.bin)} is not a plain executable name`);
      if (!Array.isArray(t?.args) || !t.args.includes("{file}")) out.push(`${key} ${t?.bin}: args must include "{file}"`);
      if (["npx", "pipx", "dlx", "bunx", "pnpx"].includes(t?.bin) || (t?.bin === "go" && t.args?.[0] === "run")) out.push(`${key} ${t.bin}: a package runner that can download is not allowed`);
      for (const k of ["local", "needs"]) if (t?.[k] !== undefined && !(Array.isArray(t[k]) && t[k].every((s) => typeof s === "string" && !s.startsWith("/") && !s.split("/").includes("..")))) out.push(`${key} ${t?.bin}: ${k} must be project-relative paths`);
    }
  }
  return out;
}
