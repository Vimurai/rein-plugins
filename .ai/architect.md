# ARCHITECT — rein-plugins (Architect-owned Blueprint)

> Source of truth for this repo's architecture. Written by the rein-plugins Architect from the
> `rein` ecosystem contract (`rein/plans/rein-ecosystem-contract.md`, D-150) and the handed plan
> (`rein/plans/rein-plugins-plan.md`, both committed in `rein` as db92fd6). The contract is
> upstream law: a change to it arrives as a D-### in `rein` and a notice to this repo. We build
> on those decisions; we do not reopen them here.

## 1. Goal & Architecture
- **Problem**: everything Rein ships that is not the gate or the role machinery (specialist agents,
  optional workflow skills, rules, formatter/notifier hooks, later project templates) is today
  provisioned by `rein sync` and versions in lockstep with the gate.
- **Solution**: a Claude Code **plugin marketplace** at `.claude-plugin/marketplace.json`, one plugin
  per coherent bundle. Plugins version and update independently; `rein-app` enables them per profile
  with one `extraKnownMarketplaces` entry plus an `enabledPlugins` map.
- **Users**: operators of Rein projects (any Triad), and `rein-app` as the installer that registers
  the marketplace. `rein` itself depends on nothing here; we depend on a `rein` release only for tests.
- **One sentence**: a marketplace repo that packages Rein's non-gate capabilities as independently
  installable Claude Code plugins, each verified by `claude plugin eval` and the rein publish scan in CI.

## 2. Core Concept — the Bundle
A **bundle** is one plugin: a coherent set of agents, skills, rules and optional hooks that a user
turns on together. Granularity is the bundle, never the file. Initial bundles:

| Plugin | Contents (from `rein/src/claude/{agents,skills,rules}` and `rein/src/shared/skills`) | Group |
|---|---|---|
| `rein-seo` | `seo_manager`, `seo_engineer`, `seo_content_generator` (agents); `rein-seo`, `seo_content_checklist` (skills) | 1 |
| `rein-ux` | `ux_reviewer`, `vibe_sentinel`, `chaos_monkey` (agents); `ux_template` (skill) | 1 |
| `rein-ops` | `performance_engineer`, `devops_engineer` (agents); `rein-profile`, `obs_baseline` (skills). `knowledge_architect` deferred, see note below | 1 |
| `rein-ops` (extension) | `sre_responder`, `dependency_manager`, `meta_analyst` (agents); `rein-triage`, `rein-upgrade`, `rein-insights`, `release-manager`, `token-miser` (skills) | 2 |
| `rein-data` | `db_architect` (agent); `rein-migration` (skill) | 2 |

Group 3 (project templates for `rein init`) is deferred until `rein-app` can select a template at
init; no bundle is defined for it yet.

Notes on group 1 (D-010, D-011 = rein D-154): `knowledge_architect` **stays in rein** — it writes
`~/.rein`, which §6 forbids, and `rein init` dispatches it. It moves later, reading through a palace
query tool on memory-manager-mcp and without the maintenance write. Group 1 is therefore **13
units** (5 seo, 4 ux, 4 ops). `seo-cluster-intents.mjs` also stays in rein (MCP contract): `seo_manager` /
`seo_content_generator` take the intent set from the task-synchronizer-mcp tool schema and the
blueprint from the consumer project's `.ai/blueprints/`, or report which is missing; E-6 removes
every rein `src/` path from the bundle and may carry only a marked mirror of the intent list for
prompts. Plugin-local data a moved unit needs travels with the unit; gate/hook logic and MCP
contract files never do.

**Never in this repo** (contract §4, plan "What stays"): the safe-exec gate and every hook
`rein doctor` audits; `rein-preflight`, `rein-handoff`, `rein-task`, `arch-task`, `task-planner`,
`decision-recorder`, `blueprint-writer`, the four critics, `rein-review`, `rein-test`,
`commit-crafter`; `roles.json`, `registry.json`, the MCP servers. `security_engineer`,
`identity_guardian`, `scope_safety`, `trigger-audit` stay in `rein` — rein D-152 (mirrored as
D-005): they are gate machinery; revisited only if the gate stops depending on one.

## 3. Components
1. **Marketplace manifest** — `.claude-plugin/marketplace.json`: name `rein-plugins`, owner, the
   plugin list with relative `source` paths. The single registration point for `rein-app`.
2. **Plugin bundles** — `plugins/<plugin>/.claude-plugin/plugin.json` plus
   `plugins/<plugin>/{agents,skills,rules,hooks}/`. Each is installable with `claude plugin` on its own.
3. **Eval suites** — one `claude plugin eval` suite per plugin, checked in beside the plugin; it is
   the installability and behaviour proof the contract requires.
4. **CI pipeline** — on every PR and on the trunk: `claude plugin eval` for every plugin, the rein
   publish scan (`publish-scan.mjs scan-tree` semantics, see §7), a manifest validity check
   (every plugin in `marketplace.json` exists and vice versa), and the name-collision check (§7).
5. **Registration fixture** — a test that installs the marketplace into a throwaway Claude
   workspace using exactly the `extraKnownMarketplaces` entry and `enabledPlugins` map that
   `rein-app` will write, and asserts every bundle resolves. Owned here, shape owned by `rein-app`.
6. **Move ledger** — `.ai/MOVES.md` (Architect-owned): one row per moved unit with its source path
   in `rein`, the destination plugin, our E-## that added it and `rein`'s E-## that removed it.
   This is the cross-repo audit trail the two-sided move protocol needs.

## 4. Data Model
```
Marketplace { name: "rein-plugins", owner: { name }, plugins: [PluginRef] }
PluginRef   { name, source: "./plugins/<name>", description, version }
Plugin      { name, version, description, author?, agents[], skills[], rules[], hooks? }
MoveRow     { unit, kind: agent|skill|rule, from: rein path, to: plugin, added_by: E-##, removed_by: rein E-## | pending }
```
- Plugin `version` follows semver independently of the `rein` release; a bundle bump never
  implies a `rein` bump and vice versa.
- Skill and agent names are **invariant across the move** (D-055 in `rein`): `arch-*` / `rein-*`
  prefixed skills keep their exact names so a same-provider Triad sharing one `.claude/skills/`
  never collides with what `rein sync` still provisions.

## 5. Interface Contracts
- **To `rein-app`** (rein-app D-002, mirrored D-006): the app merges into a profile's settings.json
  `extraKnownMarketplaces.rein-plugins = { source: { source: "github", repo: "Vimurai/rein-plugins",
  ref: "stable" } }` and `enabledPlugins["<plugin>@rein-plugins"] = true` for operator-selected
  plugins only. Invariants we owe: the key equals `marketplace.json` `name`; the manifest stays at
  the default path; a **`stable` branch** always points at the current release tag's commit. An
  `enabledPlugins: true` entry means install + enable; the registration fixture (§3.5) asserts
  exactly that.
- **To `rein`**: moves are two-sided. Our E-## copies and evals, then notifies **`rein · Architect`**
  (not the rein Engineer: rein's Architect registers the removing E-## — removal, D-076 allowlist,
  sync prune, doctor line — and hands it to its Engineer). A unit is "moved" only when both sides
  are DONE and rein's minor release is tagged (D-151 / D-004); until then `MOVES.md` shows `copied`.
- **To Rein state**: a plugin that needs Rein state calls the MCP servers `rein` installs
  (`task-synchronizer-mcp`, `vibe-check-mcp`, …) and nothing else. Reading `.ai/state.sqlite` or
  any `.ai/*.json` directly is a contract violation and a CI failure once the grep guard exists.
- **Errors**: a plugin missing from the manifest, a manifest entry without a plugin, a failing eval,
  a publish-scan hit or a name collision each fail CI with a single named reason.

## 6. Security & Privacy
- **Trust boundary**: plugins run inside the operator's Claude session with that session's
  permissions. They must therefore stay inert toward Rein's enforcement layer.
- **Hard rules** (contract §4, plan "Rules"): no plugin writes the Rein home directory (`~/.rein`);
  none touches a profile's `hooks`, `autoMode`, `permissions`, `defaultMode`; none registers a
  PreToolUse hook on `Bash` (the gate's slot). Any optional hook a bundle ships is PostToolUse/Stop
  or a non-Bash matcher, and is documented in that plugin's README.
- **Privacy (D-117)**: the rein publish scan runs in CI; no operator name, login or filesystem path
  appears in a tracked file. Agent and skill bodies copied from `rein` are scanned on arrival.
- **Secrets**: `claude plugin eval` in hosted CI needs `ANTHROPIC_API_KEY` as a repo secret, set by
  the operator, never a tracked file. Without it the eval job reports `[EVAL_NO_CREDENTIAL]`.
- **License**: Apache-2.0 in every `plugin.json` and a root `LICENSE`, matching rein (D-008).
- **Identity**: `.ai/publish.json` and the repo's git identity use the Vimurai noreply identity (D-117).

## 7. Execution Constraints
- CI must finish inside a normal PR budget: evals run per plugin in parallel; the publish scan and
  manifest checks are single-pass.
- Name-collision guard: CI lists every skill/agent name in `plugins/**` and fails on duplicates
  within this repo, ignoring kind — a skill and an agent sharing a name collide (D-007). Cross-repo rule (rein D-151, mirrored D-004): **no transition window** — before
  rein's tag a moved unit exists only in rein's tree; after the tag only here. Claude Code namespaces
  plugin units as `<plugin>:<name>`, so a window would leave two copies under two names with one
  stale. Migration aid is rein's: `rein sync` prunes the stale provisioned copy via its sync manifest
  and `rein doctor` prints `[SKILL_MOVED] <name> now ships in the rein-plugins marketplace as
  <bundle>:<name>; enable the plugin`.
- The repo must not need a Rein install to lint itself; only the registration fixture (E-4 below)
  may require a `rein` release, and it is gated so a missing release skips with a named reason.
- Publish scan: until `rein` exposes `publish-scan.mjs` as a consumable, CI vendors nothing — it
  invokes the scan from a pinned `rein` release tarball fetched in CI. No copy of `rein` logic lands
  in this tree (contract §1).

## 8. Rollback Plan
- Each move is reversible by construction: until `rein`'s removing E-## is DONE, the unit still
  ships from `rein` and the plugin copy is additive. Reverting a move = revert our E-## commit and
  mark the `MOVES.md` row withdrawn; `rein` leaves its unit in place.
- A bad release is rolled back by resetting the `stable` branch to the previous release tag's
  commit (D-006); `rein-app` users follow `stable` and pick it up on next refresh. Marketplace
  sources cannot pin a commit sha, so `stable` is the only pointer that needs moving. No `rein`
  release is involved.
- The whole marketplace can be unregistered by removing one `extraKnownMarketplaces` entry; nothing
  in the Rein home directory changes, so `rein doctor` stays green throughout.

## 9. Bootstrap Tasks (E-## numbering note)
`rein init` seeded a placeholder E-1 ("Implement first feature") whose text cannot be edited; it is
retired as DONE with a summary pointing here, so the plan's E-1..E-4 land as **E-2..E-5**:

| Plan | Here | Scope | Tier |
|---|---|---|---|
| E-1 | **E-2** | Marketplace skeleton: `marketplace.json`, one empty plugin (`rein-seo` shell) with `plugin.json`, CI running `claude plugin eval` per plugin + publish scan + manifest/name-collision checks; `git init` the repo. Acceptance (amended D-009): hosted checks + publish-scan green; local `claude plugin eval` passes; hosted eval may fail only with `[EVAL_NO_CREDENTIAL]` until the operator sets the secret; `LICENSE` + `license` fields present (D-008). | 2 |
| E-2 | **E-3** | Move group 1 (§2, `rein-seo`, `rein-ux`, `rein-ops` core): copy from `rein`, eval each bundle, start `.ai/MOVES.md` rows with `removed_by: pending`, then notify **`rein · Architect`** with the unit list so `rein` files its removing E-## (D-004 supersedes the task text that says `rein · Engineer`). Acceptance: all three bundles pass eval; MOVES.md lists every unit; no name changed. | 2 |
| E-3 | **E-4** | Registration fixture: install the marketplace into a throwaway Claude workspace with the exact `extraKnownMarketplaces` + `enabledPlugins` JSON in D-006 (Q3 answered; the "stop and ask" clause in the task text is satisfied). The fixture may point `source` at the local checkout where the GitHub form needs network; the GitHub form is asserted structurally. Skips with a named reason only on a missing `claude` CLI or credential, never on a missing rein release (D-012). Acceptance: fixture registers and enables every bundle and fails clearly on a missing one; the install assertion is added once Q4 (§10) confirms the mechanism. | 2 |
| — | **E-6** | Make `rein-seo` self-contained (D-011 and its clarification supersede the task text): agents carry a marked mirror of the intent list (named rein commit), call the MCP and report any refusal verbatim, take the blueprint from the consumer project's `.ai/blueprints/`, and report what is missing instead of aborting. Depends on E-3. Acceptance: eval passes with no rein checkout; no `src/` or `~/.rein` path in the bundle. | 2 |
| — | **E-7** | CI once per PR: restrict the `push` trigger to `main` and `stable` (via `skill: ci_gate`). Tier 1. | 1 |
| — | **E-2 add-on** | Release pointer: E-2 creates the `stable` branch alongside the trunk and documents in the README that a release fast-forwards `stable` to the tag and a rollback resets it (D-006). GitHub remote `Vimurai/rein-plugins` is created by the operator, not the agent. | 2 |
| E-4 | **E-5** | Move group 2 (§2, `rein-ops` extension + `rein-data`), same two-sided protocol as E-3. Acceptance: eval green; MOVES.md rows added; **`rein · Architect`** notified (D-004 supersedes the task text). | 2 |

Dependency chain: E-2 → E-3 → E-5; E-2 → E-4; E-3 → E-6. No cycles, depth 2.

## 10. Open Questions (reserved — do not decide locally)
- **Q1 — ANSWERED** (rein D-151 → D-004): clean cut at a rein minor, no transition window; see §7.
- **Q2 — ANSWERED** (rein D-152 → D-005): none of the four gate-adjacent agents moves; see §2.
- **Q3 — ANSWERED** (rein-app D-002 → D-006): GitHub source `Vimurai/rein-plugins` at `ref: stable`,
  boolean `<plugin>@rein-plugins` keys; see §5, §8.
All three reserved questions are closed; answers live in `.ai/DECISIONS.md` D-004..D-006.
- **Q4 → `rein-app · Architect` (open)**: does `enabledPlugins` at user/project scope install the
  plugin at session start, or only under managed settings? Evidence in D-012's Reserved note.
  Affects D-006 consequence (3) and rein-app's `profiles apply --enable` premise.

**Standing cross-repo obligations** (Architect-owned):
- The first release tag is cut after E-3 lands (D-009); when it is on `stable` at
  `Vimurai/rein-plugins`, notify `rein-app · Architect` so they lift the "remote not live" risk;
  until then their tests use a fixture, never the live URL.
- Operator actions outstanding: set the `ANTHROPIC_API_KEY` repo secret for hosted eval.
- When E-3 / E-5 copies land, notify `rein · Architect` with the unit list (D-004).

## 11. Development Cycle
1. **Plan** (Architect): this file plus `.ai/MOVES.md`; cross-repo questions go to the owning
   Architect, never decided here.
2. **Build** (Engineer): one E-## per bundle or move; every PR runs the §3.4 CI.
3. **Test** (Tester via `skill: rein-test`): `claude plugin eval` is the primary suite; the
   registration fixture is the integration test.

## 30. Bootloader Resilience
- `rein-preflight` is the only preflight path (D-075); its Bash fallback reads `.ai/state.json`;
  final fallback is `ENGINEER.md` "Emergency Recovery" and `cat .ai/TASKS.md`.

## 33. Token Economics
- 6-file JIT limit per task; DIGEST first; never `ls -R` or read `plugins/**` wholesale — a move
  task reads only the units it moves.

## 34. Fragmentation
- When this file passes ~200 lines, split into `.ai/blueprints/{marketplace,moves,ci}.md` and
  turn this into a router.
