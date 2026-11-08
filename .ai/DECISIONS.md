# DECISIONS — rein-plugins

Format: `D-### | date | decision | why | rejected | constraints`. Upstream decisions from `rein`
(D-150 ecosystem contract, D-055 skill prefixes, D-076 legacy-mention allowlist, D-117 publish
privacy, D-132 settings hard-deny) are law here and are cited, not re-recorded.

## D-001 — Bootstrap queue is E-2..E-5; placeholder E-1 retired (2026-11-08)
- **Decision**: `rein init` seeded a placeholder E-1 whose description cannot be edited through
  `task-synchronizer-mcp`. It is marked DONE with a summary stating no work was done, and the plan's
  E-1..E-4 are registered as E-2..E-5. The mapping lives in `architect.md` §9.
- **Why**: TASKS.md is a generated view; the only honest mutation available was a status change with
  an explicit summary. Leaving a stale OPEN placeholder would mislead the Engineer.
- **Rejected**: hand-editing TASKS.md or state.sqlite (forbidden, regenerated); reusing E-1 with a
  wrong description.

## D-002 — Moves are two-sided and tracked in .ai/MOVES.md (2026-11-08)
- **Decision**: a unit counts as moved only when our adding E-## and `rein`'s removing E-## are both
  DONE. `.ai/MOVES.md` is the ledger; the Engineer adds rows at copy time, the Architect flips
  `removed_by` when `rein` reports.
- **Why**: the plan mandates one E-## per side; without a ledger the repos drift silently and a
  skill ships twice (collision) or not at all.
- **Constraints**: names are invariant across the move (D-055).

## D-003 — Publish scan is invoked from a pinned rein release, never vendored (2026-11-08)
- **Decision**: CI fetches a pinned `rein` release tarball and runs its publish scan from there.
- **Why**: contract §1 forbids a copy of Rein logic in this repo; the scan is Rein logic.
- **Rejected**: copying `publish-scan.mjs` into `scripts/`; reimplementing the patterns here.

## D-004 — Mirror of rein D-151: moves are a clean cut, no transition window (2026-11-08)
- **Decision**: each move group flips in one rein minor release that removes the group from
  `rein sync` and rein's tree, updates the D-076 allowlist, and is tagged the day the marketplace
  publishes the group. Before the tag our copy is `copied`; at the tag the MOVES.md row flips to
  `moved`. The copy-landed notification goes to **`rein · Architect`** (who registers the removing
  E-##), not to rein's Engineer. Supersedes the "notify rein · Engineer" wording in E-3/E-5.
- **Why** (rein's): Claude Code namespaces plugin units as `<plugin>:<name>`; a window would leave
  two copies under two names with one stale. Migration aid lives in rein (`rein sync` prune,
  `rein doctor` `[SKILL_MOVED]` line).
- **Source**: rein `.ai/DECISIONS.md` D-151, commit 036af69.

## D-005 — Mirror of rein D-152: gate-adjacent agents never move (2026-11-08)
- **Decision**: `security_engineer`, `identity_guardian`, `scope_safety`, `trigger-audit` stay in
  rein. Revisited only if the gate stops depending on one.
- **Why** (rein's): they are gate machinery — the Tier 3 reviewer and mandatory trigger, the PII
  gate other skills require, the scope enforcer, the dispatch check.
- **Source**: rein `.ai/DECISIONS.md` D-152, commit 036af69.

## D-006 — Mirror of rein-app D-002: registration shape, `stable` branch as the release pointer (2026-11-08)
- **Decision**: rein-app registers this marketplace as a GitHub source pinned to a moving `stable`
  branch, and enables plugins with boolean `<plugin>@rein-plugins` keys written only for
  operator-selected plugins. The literal shape the app merges into a profile's settings.json:
  ```json
  {
    "extraKnownMarketplaces": {
      "rein-plugins": { "source": { "source": "github", "repo": "Vimurai/rein-plugins", "ref": "stable" } }
    },
    "enabledPlugins": {
      "rein-seo@rein-plugins": true, "rein-ux@rein-plugins": true,
      "rein-ops@rein-plugins": true, "rein-data@rein-plugins": true
    }
  }
  ```
- **Consequences here**: (1) the `extraKnownMarketplaces` key must equal `marketplace.json`
  `name` = `rein-plugins`; `path` is omitted, so the manifest stays at the default
  `.claude-plugin/marketplace.json`. (2) This repo maintains a **`stable` branch**: a release
  fast-forwards `stable` to the release tag's commit; rollback resets `stable` to the previous
  tag's commit. Claude Code marketplace sources accept `ref` (branch or tag) but not a commit
  sha, so a commit pin is impossible at this layer. (3) ~~The registration fixture (E-4) treats an
  `enabledPlugins` entry as install + enable~~ — **superseded by D-013**: at user/project scope the
  entry only enables an installed plugin; `true` is written by `claude plugin install`, never by
  rein-app. (4) GitHub owner is `Vimurai` (the same org as
  `github.com/Vimurai/rein`); provisional until the remote exists — E-2 creates it.
- **Supersedes**: architect.md §8's earlier "re-tag previous plugin version" rollback; the
  pointer users follow is the `stable` branch, not a plugin version field.
- **Source**: rein-app `.ai/DECISIONS.md` D-002.

## D-007 — Name-collision check ignores kind (2026-11-08)
- **Decision**: CI treats a skill and an agent with the same name as a collision. Approved as
  implemented in E-2.
- **Why**: D-055's discipline is about names in a shared `.claude/` tree; Claude Code namespaces
  plugin units as `<plugin>:<name>`, and a same-named skill/agent pair is ambiguous to a human
  invoking either. One namespace is simpler to reason about than two.
- **Rejected**: per-kind namespaces.

## D-008 — License is Apache-2.0, matching rein (2026-11-08)
- **Decision**: every `plugin.json` carries `"license": "Apache-2.0"` and the repo root carries a
  `LICENSE` file with the Apache-2.0 text. Added to E-2 before it closes.
- **Why**: the bundles are copies of Apache-2.0 material from `rein`; a different or missing license
  would make each move a relicensing question.

## D-009 — E-2 acceptance amended: hosted eval may be red only for a missing CI secret (2026-11-08)
- **Decision**: E-2 may be marked DONE when local `claude plugin eval` passes, hosted checks and
  publish-scan pass, and the only hosted failure is `[EVAL_NO_CREDENTIAL]` (the `ANTHROPIC_API_KEY`
  repo secret unset). Setting the secret is an operator action; hosted eval green is then verified
  on E-3's first PR, whose acceptance already requires eval to pass.
- **Why**: blocking the whole queue on an operator-side secret stalls the loop for no engineering
  reason; the evidence that the eval works (local 1.00) exists.
- **Also recorded**: `.ai/publish.json` uses the Vimurai noreply identity and the local git identity
  matches — consistent with D-117 (no operator name in tracked files). The first release tag is cut
  after E-3 lands (an empty marketplace is not a release); until then `stable` tracks an untagged
  commit and rein-app is not pinged.

## D-010 — knowledge_architect held out of E-3; moved only read-only after rein rules (2026-11-08)
- **Decision**: knowledge_architect's body writes `~/.rein/memory-palace.md` (Memory Palace
  Maintenance) and reads `~/.rein/memory-palace.embeddings.json` directly, conflicting with
  contract §4 and architect.md §6. It is excluded from the E-3 commit; the other 12 group-1 units
  ship. Its MOVES.md row reads `pending-copy` with this D-### as the reason. The ruling on how it
  moves (read-only with the write dropped, stays in rein, or deferred until memory-manager-mcp
  exposes the palace) is rein's and was asked of `rein · Architect`; a plugin may not carry the write
  under any outcome. (Count correction: group 1 without knowledge_architect is **13** units — 5 seo,
  4 ux, 4 ops — not 12 as first written here and in D-011.)
- **Why**: the write violates the hard rule; a read-only move is the likely outcome, but bodies are
  byte-identical copies today and editing one during a move is a contract interpretation rein owns.
- **Also**: seo_content_generator / seo_manager depend on rein-internal files; E-6 makes the
  rein-seo bundle self-contained. Pre-existing behaviour, so not an E-3 blocker.

## D-011 — Mirror of rein D-154: knowledge_architect and seo-cluster-intents stay in rein; group 1 = 13 units (2026-11-08)
- **Decision**: (1) `knowledge_architect` stays in rein for now — no direct-read exception to
  contract §4; it writes the palace and `rein init` dispatches it, so it is rein machinery today. It
  moves later, reading through a palace query tool on memory-manager-mcp (a rein E-## planned with
  the next memory work) and without the maintenance write. Its MOVES.md row is `stays-in-rein`.
  (2) `seo-cluster-intents.mjs` stays in rein: task-synchronizer-mcp imports it to validate
  `add_cluster_page` and the topic-seed tools, so it is MCP contract. (3) Group 1 is accepted as the
  **13** units named in D-010 (rein's D-154 says "12" but lists the same 13 names; the names govern);
  rein registers its removing E-## on the Engineer's final-list notice.
- **E-6 clarification (2026-11-08, after inspection)**: the `add_cluster_page` schema does not
  enumerate the intents — its description lists examples and the MCP rejects bad values at call
  time. So "intents from the schema" means in practice: the agents carry a marked mirror of the
  intent list (source: rein `src/shared/seo-cluster-intents.mjs` at a named commit) and, on an MCP
  refusal, report the refusal verbatim rather than retrying. rein accepted (D-154 addendum, commit
  e8d9db4): its removing E-## adds the canonical set as an enum on `add_cluster_page.intent_type`,
  generated from `seo-cluster-intents.mjs` so the two cannot drift. Once that ships, our mirror is
  documentation only; E-6 cites the rein commit it mirrors and nothing more.
- **Consequences for E-3 / E-6** (supersedes the "ship the cluster-intents data inside the plugin"
  wording in E-6's task text): `seo_manager` and `seo_content_generator` take the intent set from
  the MCP — its tool schema names the canonical set — and the blueprint from the consumer project's
  `.ai/blueprints/seo-keyword-multiplier.md`, or say which is missing instead of aborting on a rein
  source path. E-6 may ship a copy of the intent list for the agents' prompts only as a marked mirror
  of the rein version it came from; the MCP refuses values outside its set, so drift fails closed.
  No agent in this tree may depend on a rein `src/` path after the move.
- **Body edits**: ours from the copy onward; names invariant (D-151); rein deletes its copies at the tag.
- **Source**: rein `.ai/DECISIONS.md` D-154, commit 0c95aea.

## D-012 — E-4 fixture skips on a missing claude CLI or credential, not on a missing rein release (2026-11-08)
- **Decision**: the registration fixture needs only the `claude` CLI and the D-006 literal; it
  depends on no rein release. Its named-reason skip conditions are therefore "claude CLI absent"
  and "no credential", replacing the task text's "no rein release available". Approved as proposed
  by the Engineer.
- **Why**: architect.md §7 said only the fixture "may require a rein release"; inspection shows it
  does not. A skip condition that can never trigger hides the real ones.

## D-013 — Mirror of rein-app D-005: `enabledPlugins` enables, it does not install (2026-11-08)
- **Decision**: at user/project scope an `enabledPlugins` entry only enables an already installed
  plugin; auto-install from `enabledPlugins` is a managed-settings behaviour (Claude Code docs:
  plugins/org "Require a marketplace and its plugins"; plugins/install "Choose an install scope",
  a committed entry "doesn't download it"). D-006 consequence (3) is permanently replaced by:
  **`true` is written by `claude plugin install`, not by rein-app.**
- **What rein-app does**: `profiles apply` writes `extraKnownMarketplaces` exactly as D-006 and
  verifies registration with `claude plugin marketplace list` (an empty `claude plugin list` is
  expected before any install). `--enable` runs, per profile,
  `CLAUDE_CONFIG_DIR=<config_dir> claude plugin install <plugin>@rein-plugins --scope user`; Claude
  Code downloads and writes the `true` entry itself; rein-app re-reads and verifies. `--disable` runs
  `claude plugin disable`. No managed-settings location (contract §2.3). Fallback registration path
  if a hand-written `extraKnownMarketplaces` entry is not honoured on some version:
  `claude plugin marketplace add Vimurai/rein-plugins#stable`.
- **Fixture (E-4) asserts**: (a) the registration key is present after apply; (b) an
  `enabledPlugins` entry appears only after `claude plugin install`; (c) the settings write alone
  installs nothing. (c) needs an authenticated `-p` start with `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1`;
  until the CI credential exists it is report-only (`[FIXTURE_Q4_OBSERVED]`), then it becomes an
  assertion. Partial evidence already in hand: an explicit `marketplace add` + `plugin install` in an
  isolated config dir wrote exactly the D-006 shape, so the JSON matches what Claude Code itself writes.
- **Source**: rein-app `.ai/DECISIONS.md` D-005.

## D-014 — Mirror of rein-app D-007: registration goes through `claude plugin marketplace add`, not a settings write (2026-11-08)
- **Decision**: on Claude Code 2.1.319 a hand-written user-scope `extraKnownMarketplaces` entry is
  NOT registered (absent from `claude plugin marketplace list`; install fails "not found in
  marketplace"). rein-app therefore registers per profile with
  `claude plugin marketplace add Vimurai/rein-plugins#stable --scope user` and verifies the written
  entry. The JSON is unchanged from D-006; only the author of the write is Claude Code, not rein-app.
- **Closes Q4's last clause**: a settings-only start on 2.1.319 is not honoured and installs nothing.
  The E-4 reconcile layer, once CI has a credential, asserts exactly that (nothing registered,
  nothing installed) instead of merely reporting.
- **Our obligation (E-8)**: CI asserts, against the live public repo, that the GitHub-shorthand form
  `Vimurai/rein-plugins#stable` yields `source.ref == "stable"` in settings.json. rein-app proves the
  git-URL form locally; the shorthand pin needs the real repo. If `ref` is missing we tell
  `rein-app · Architect` at once — their exit-7 guard fires and they reopen D-007.
- **Source**: rein-app `.ai/DECISIONS.md` D-007.

## D-015 — Empirical correction to D-013/D-014: session start registers, and an authenticated start installs, from settings alone (2026-11-08)
- **Observation** (Claude Code 2.1.319, isolated `CLAUDE_CONFIG_DIR`, settings.json holding only the
  D-006 shape with `source: directory` and `enabledPlugins {"rein-seo@rein-plugins": true}`):
  1. before any start, `claude plugin marketplace list --json` is `[]` — this is what rein-app's
     D-007 measured; 2. after one `claude -p` start the marketplace IS registered
     (`known_marketplaces.json` written), even when the start fails "Not logged in" — reproduced
     twice; 3. one authenticated start installed `rein-seo@rein-plugins` into
     `installed_plugins.json` from settings alone, without `CLAUDE_CODE_SYNC_PLUGIN_INSTALL`
     (version 0.1.0, sha 02987aa, 19:35:57Z) — single sample, from a reviewer subagent whose
     environment had inherited a credential; not reproduced by the Engineer, who has no credential.
- **Caveats**: directory source only; GitHub source untested; one authenticated sample.
- **Decision**: D-013 assertion (c) and D-014's "not registered" are **suspended**. The E-4
  reconcile layer is report-only for BOTH registration and install, measured before and after a
  start; the "flip to failure if anything installed" wording is removed from the fixture README.
  The unauthenticated before/after registration lines run in CI with no secret and give rein-app
  data on every PR. Forwarded to `rein-app · Architect` as Q5; their D-005/D-007 and exit-7 guard
  are theirs to re-rule. Our contract to rein-app is unchanged: the JSON shape and the `stable`
  pointer. Registration timing is Claude Code's behaviour, not ours.
- **Why it matters**: rein-app's flow ("write settings, then `claude plugin install`") still works;
  what changes is the claim that a settings write alone is inert, which any authenticated session
  start seems to falsify.

## D-016 — Mirror of rein-app D-009: explicit registration stays primary; install-from-settings is tolerated, not relied on (2026-11-08)
- **Decision** (rein-app's): `claude plugin marketplace add Vimurai/rein-plugins#stable` +
  `claude plugin install` stays the primary flow (immediate, verifiable at apply time). The
  hand-written `extraKnownMarketplaces` entry with `ref: "stable"` returns only as the fallback when
  the `claude` CLI is absent, relying on the session-start reconciliation D-015 found. rein-app
  D-005 (c) is retracted and replaced by: "rein-app does not rely on install-from-settings; it may
  happen after an authenticated start and is harmless."
- **Here**: the D-015 suspensions of D-013 (c) and D-014 "not registered" are lifted and both
  clauses are superseded by this model. Both repos' fixtures assert the same thing: report-only
  before/after a session start. Q5 closed.
- **Measurements rein-app wants**, report-only, one CI line each `[FIXTURE_Q5_M<n>] <claude
  version> <result>`: M1 registration-by-start (unauthenticated; github source once live, directory
  source meanwhile) — does `known_marketplaces.json` carry ref `stable` and does the clone's HEAD
  equal `origin/stable`; a mismatch is **silent trunk-tracking and reopens rein-app D-007/D-009 the
  same day**. M2 install-by-start (authenticated, github source, three fresh config dirs) — count
  installs, record version and sha. M3 = E-8 (`marketplace add` → ref `stable` in settings AND
  `known_marketplaces.json`). M4 idempotence — `marketplace add` on an already-reconciled profile
  exits 0, entry unchanged, no duplicate. M1/M2/M4 are E-9; E-8 gains the `known_marketplaces.json`
  half of M3.
- **Source**: rein-app `.ai/DECISIONS.md` D-009.

## Reserved (awaiting upstream D-###)
- none.
