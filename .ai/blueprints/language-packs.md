# Blueprint — Language Packs (v1, 2026-11-17, D-017)

> Replaces the move plan in `.ai/architect.md` §2, §3.6, §5 "To rein" and §9 rows E-3/E-5/E-6.
> Everything else in `architect.md` (marketplace, CI, registration toward rein-app, hard rules,
> rollback of a release) still applies and is not repeated here.

## Goal & Architecture
- **Problem**: `rein` is technology-neutral. In a real project Claude still has to be told, again
  in every project, how that language is written, formatted and checked.
- **Solution**: one optional Claude Code plugin per language or framework — a **language pack** —
  in this marketplace. A project turns on the packs for the languages it contains.
- **Users**: the operator's own projects first (TypeScript, Astro, PHP/Laravel, Rust), then any
  rein-app user picking packs per profile.
- **Not in scope**: nothing is taken from, added to or required of `rein` (D-017). A pack works in
  a project with no Rein install at all.
- **One sentence**: a pack makes Claude follow a language's conventions and run the project's own
  formatter and linter on every file it edits.

## Core Concept — the Pack
A pack is a plugin named `rein-<language>` with exactly three parts:

1. **Conventions skill** `<language>-conventions` — short guidance that loads only when Claude
   works on matching files (skill frontmatter `paths:`).
2. **Review skill** `<language>-review` — a checklist Claude runs on request or before a commit:
   the slow checks that do not belong on every edit (type check, full lint, tests).
3. **Edit hook** — a `PostToolUse` hook on `Edit|Write` that formats the edited file and reports
   lint findings for that one file, using tools the project already has.

**Project config wins.** A pack never imposes a style. Formatter and linter settings come from the
project's own config files; the conventions skill says so in its first lines and covers only
idioms the language community broadly agrees on. Where a project file contradicts the skill, the
project file is right.

**Fail open.** A missing formatter, a missing `node`, a file outside the project, a timeout: the
hook exits 0 and says nothing. A pack must never make an edit fail.

## Components
1. **Pack plugin** — `plugins/rein-<language>/`:
   - `.claude-plugin/plugin.json` (name, version, description, author, license, `userConfig`)
   - `skills/<language>-conventions/SKILL.md`, `skills/<language>-review/SKILL.md`
   - `hooks/hooks.json`, `hooks/run.mjs`, `pack.json`
   - `evals/` (one load case per skill), `README.md`
2. **Hook runner** `hooks/run.mjs` — one implementation, byte-identical in every pack (a plugin is
   installed on its own, so it cannot import from a sibling). The canonical copy lives in
   `scripts/pack-template/run.mjs`; CI fails if any pack's copy differs. All language knowledge is
   in `pack.json`, none in the runner.
3. **Pack descriptor** `pack.json` — the data the runner reads: extensions, formatter candidates,
   linter candidates (see Data Model).
4. **Pack check** — an extension of `scripts/check-marketplace.mjs`: every pack has the three
   parts, the runner matches the template, `hooks.json` registers only `PostToolUse`, skill names
   follow the pattern and collide with nothing in this repo or in the reserved-name list (below).
5. **Hook tests** — `tests/packs/`: for each pack, run the runner against fixture files with stub
   formatter/linter executables on `PATH`. No real toolchain is installed in CI.
6. **Pack scaffold** — `scripts/new-pack.mjs <language>`: copies the template and writes the
   skeleton, so the tenth pack is built the same way as the first.

Language servers (`.lsp.json`) are **not** part of v1: the binary must already be installed and a
missing one fails loudly at session start, which breaks the fail-open rule. Revisit per pack once
`userConfig` can gate it.

## Data Model
```
Pack        { name: "rein-<language>", version, skills: [conventions, review], hook, descriptor }
pack.json   { language: string,
              extensions: [".ts", ".tsx", ...],          // lower-case, with the dot
              format: [Tool],                            // first that resolves is used
              lint:   [Tool] }                           // first that resolves is used; may be []
Tool        { bin: string,                               // executable name
              local: [string],                           // project-relative dirs searched first,
                                                         //   e.g. "node_modules/.bin", "vendor/bin"
              args: [string],                            // "{file}" is replaced by the edited path
              needs: [string] }                          // optional: config files, one of which must
                                                         //   exist in the project or the tool is skipped
userConfig  { format_on_edit: boolean = true, lint_on_edit: boolean = true }
```
- Resolution order for a tool: each `local` dir under the project root, then `PATH`. Never a
  package runner that can download (`npx` without `--no-install`, `pipx run`, `go run`, `dlx`).
- `needs` prevents running a formatter the project has not opted into (Prettier with no Prettier
  config, for example). Tools that are part of the language toolchain (`rustfmt`, `gofmt`) have
  no `needs`.
- Skill names: `<language>-conventions`, `<language>-review`. They must not start with `rein-` or
  `arch-` and must not equal any skill or agent name `rein` provisions; CI holds that list as
  `scripts/reserved-names.json`, taken from the pinned rein release the publish scan already uses.

### Pack list
| Wave | Pack | Files | Format (first that resolves) | Lint on edit |
|---|---|---|---|---|
| 1 | `rein-typescript` | `.ts .tsx .js .jsx .mjs .cjs` | biome, prettier | biome, eslint |
| 1 | `rein-rust` | `.rs` | rustfmt | — (clippy is in review) |
| 1 | `rein-php` | `.php` | pint, php-cs-fixer | `php -l` |
| 1 | `rein-astro` | `.astro` | prettier (needs the astro plugin in config) | — (`astro check` in review) |
| 1 | `rein-laravel` | Blade, routes, migrations, models | — (no hook; pairs with `rein-php`) | — |
| 2 | `rein-python` | `.py .pyi` | ruff format, black | ruff check |
| 2 | `rein-go` | `.go` | gofmt | — (`go vet` in review) |
| 2 | `rein-shell` | `.sh .bash` | shfmt | shellcheck |
| 2 | `rein-cpp` | `.c .h .cc .cpp .hpp` | clang-format (needs `.clang-format`) | — |
| 2 | `rein-ruby` | `.rb` | rubocop -a (needs `.rubocop.yml`) | rubocop |
| 3 | `rein-java` | `.java` | google-java-format | — |
| 3 | `rein-kotlin` | `.kt .kts` | ktlint -F | ktlint |
| 3 | `rein-csharp` | `.cs` | — (`dotnet format` is whole-project: review only) | — |
| 3 | `rein-swift` | `.swift` | swift-format, swiftformat | swiftlint |

Framework packs beyond Astro and Laravel are added on demand, one D-### each; they follow
`rein-laravel`'s shape (skills only, pairing with the language pack named in their README).

## API / Interface Contracts
- **Hook registration** (`hooks/hooks.json`): event `PostToolUse`, matcher `Edit|Write`, one
  handler per extension with an `if` filter (`Edit(*.<ext>)` / `Write(*.<ext>)`), command
  `node "${CLAUDE_PLUGIN_ROOT}/hooks/run.mjs"` guarded so a missing `node` exits 0. The runner
  re-checks the extension itself; the `if` filter is an optimisation, not the guard.
- **Runner input**: the hook JSON on stdin; it uses `tool_input.file_path` and the project
  directory from the hook environment. Options arrive as `CLAUDE_PLUGIN_OPTION_FORMAT_ON_EDIT`
  and `CLAUDE_PLUGIN_OPTION_LINT_ON_EDIT`.
- **Runner output**:
  - clean, skipped or failed-open → exit 0, no output;
  - lint findings or a formatter syntax error → exit 2, stderr holds one header line
    `[<pack>] <tool> reported:` and at most 40 lines of the tool's output, paths made
    project-relative.
- **Skills**: `<language>-conventions` carries `paths:` globs for the pack's files and stays under
  120 lines; `<language>-review` is invoked by name or by its description and lists the commands
  to run, each with the condition under which it applies ("if `Cargo.toml` exists").
- **To rein-app**: unchanged from `architect.md` §5. Pack keys are `rein-<language>@rein-plugins`.
- **Errors in CI**, one named reason each: `[PACK_PART_MISSING]`, `[PACK_RUNNER_DRIFT]`,
  `[PACK_HOOK_EVENT]` (anything but `PostToolUse`), `[PACK_NAME_RESERVED]`, plus the existing
  manifest, collision, eval and publish-scan failures.

## Security
- **Trust boundary**: the hook runs with the session's permissions, after an edit Claude already
  made. It executes only tools found in the project or on `PATH`. A formatter or linter may load
  project config that is code (an ESLint config, a Rubocop plugin); that is the project's own code
  and the same trust the operator gives `npm run lint`. Each pack's README states this.
- **No downloads, no network**: the runner never calls a package runner that can fetch.
- **Scope**: the runner acts on the one edited file, and only if its resolved path is inside the
  project directory. It passes arguments as an array, never through a shell, so a file name
  cannot inject a command.
- **Hard rules kept** (`architect.md` §6): no write to the Rein home directory, none to a
  profile's `hooks`, `autoMode`, `permissions` or `defaultMode`; no `PreToolUse` hook at all; the
  only hook event a pack may register is `PostToolUse` with the `Edit|Write` matcher.
- **Secrets**: packs read none. `userConfig` holds two booleans; no `sensitive` field exists.
- **Privacy (D-117)**: hook output is project-relative; the publish scan runs on every pack.

## Execution Constraints
- Budget per edit: 10 s per tool, 15 s for the whole hook; on timeout the child is killed and the
  hook exits 0.
- Nothing whole-project on edit: no `cargo clippy`, `tsc`, `go vet`, `dotnet format`,
  `astro check`. Those live in the review skill.
- One file, one process at a time; the runner holds no state between calls.
- The runner uses only Node built-ins. No dependency is added to this repo for it.
- CI stays inside the PR budget: hook tests use stubs and run in one job; evals stay per plugin
  in parallel.

## Rollback Plan
- **One pack is bad**: remove its entry from `marketplace.json` and move `stable` back to the
  previous tag (`architect.md` §8). Users keep working; the pack simply stops being offered.
- **A user is affected now**: set `format_on_edit` / `lint_on_edit` to false in the plugin's
  options, or disable the plugin. Either takes effect on the next session and needs no release.
- **The whole direction is wrong**: D-017's rollback — reopen PR #1 and reinstate the move
  decisions. Nothing in `rein` was removed, so nothing there needs restoring.

## E-## Task Breakdown
| Task | Scope | Tier |
|---|---|---|
| E-10 | Close out the move plan: carry `.ai/` to `main`, close PR #1 unmerged (branch kept), mark the moves withdrawn | 1 |
| E-11 | Pack template, runner, scaffold, pack check, hook tests; first pack `rein-typescript`; `rein-seo` shell removed; first release tag | 2 |
| E-12 | Wave 1: `rein-rust`, `rein-php`, `rein-astro`, `rein-laravel` | 2 |
| E-13 | Wave 2: `rein-python`, `rein-go`, `rein-shell`, `rein-cpp`, `rein-ruby` | 2 |
| E-14 | Wave 3: `rein-java`, `rein-kotlin`, `rein-csharp`, `rein-swift` | 2 |

Dependencies: E-10 → E-11 → E-12, E-13, E-14. E-12..E-14 are independent of each other.
E-7, E-4, E-8, E-9 are unchanged and merge before E-11 (`#2 → #3 → E-9 → E-8 → E-11`).
