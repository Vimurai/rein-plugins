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
  sha, so a commit pin is impossible at this layer. (3) The registration fixture (E-4) treats an
  `enabledPlugins` entry as install + enable, because writing `name@marketplace: true` is what
  makes Claude Code auto-install the plugin. (4) GitHub owner is `Vimurai` (the same org as
  `github.com/Vimurai/rein`); provisional until the remote exists — E-2 creates it.
- **Supersedes**: architect.md §8's earlier "re-tag previous plugin version" rollback; the
  pointer users follow is the `stable` branch, not a plugin version field.
- **Source**: rein-app `.ai/DECISIONS.md` D-002.

## Reserved (awaiting upstream D-###)
- none.
