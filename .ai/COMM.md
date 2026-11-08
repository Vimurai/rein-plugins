# COMM — Architect ↔ Engineer handoff log (append-only)

---
## Handoff — 2026-11-08 18:48 UTC
**From**: Architect → Engineer
**Trigger**: P-1 complete (blueprint written); E-2..E-5 registered

### What was planned
- `.ai/architect.md` — full blueprint from rein's ecosystem contract (D-150) and the
  rein-plugins plan: bundles (§2), components (§3), data model (§4), contracts (§5),
  security hard rules (§6), CI constraints (§7), rollback (§8), bootstrap tasks (§9), reserved
  questions (§10). Read §2–§9 before E-2.
- `.ai/MOVES.md` — cross-repo move ledger; you append a row per unit in E-3/E-5.
- `.ai/DECISIONS.md` — D-001 (E-1 placeholder retired, queue is E-2..E-5), D-002 (two-sided
  moves), D-003 (publish scan from pinned rein release, never vendored).
- `.ai/DIGEST.md` refreshed.

### Decisions made
- D-001, D-002, D-003 as above. Upstream D-150 / D-055 / D-076 / D-117 / D-132 apply as law.

### Blueprint divergence
- NONE — nothing implemented yet.

### Next action needed
- Execute **E-2** (OPEN): `git init`, marketplace skeleton, one empty plugin, CI with
  `claude plugin eval`, publish scan, manifest and name-collision checks.
- E-3 and E-4 unblock when E-2 is DONE; E-5 unblocks after E-3.
- **E-4 must not start until Q3 is recorded in DECISIONS.md** — if you reach it first, ask me.

### Open risks
- Q3 (`extraKnownMarketplaces` / `enabledPlugins` shape) is with `rein-app · Architect`; blocks
  only E-4.

### Addendum — 2026-11-08 18:52 UTC (rein answered Q1/Q2)
- D-004 (rein D-151): no transition window; copy = `copied` until rein's minor tag, then `moved`.
- D-005 (rein D-152): the four gate-adjacent agents never move.
- **Correction for E-3 and E-5**: when a group's copy lands, SendMessage **`rein · Architect`**,
  not `rein · Engineer`. The task descriptions still say Engineer (not editable); architect.md §5,
  §9 and D-004 govern.

### Addendum — 2026-11-08 18:58 UTC (rein-app answered Q3)
- D-006 (rein-app D-002): registration JSON recorded verbatim in DECISIONS.md; GitHub source
  `Vimurai/rein-plugins`, `ref: stable`, boolean `<plugin>@rein-plugins` keys = install + enable.
- **E-4 is no longer gated on a question**: build the fixture against the D-006 JSON.
- **E-2 add-on**: create a `stable` branch next to the trunk and document the release/rollback
  pointer rule in the README (architect.md §9 last row, §8). Do not create the GitHub remote
  yourself; the operator does.

### Addendum — 2026-11-08 19:10 UTC (E-2 review rulings)
- D-007: collision check ignoring kind — approved as built.
- D-008: add `"license": "Apache-2.0"` to every plugin.json and a root `LICENSE`; do this inside E-2.
- D-009: E-2 may close with hosted eval red only for `[EVAL_NO_CREDENTIAL]`; operator sets the
  secret; hosted eval green is checked on E-3's first PR. First release tag comes after E-3.
- publish.json / git identity = Vimurai noreply: accepted (D-117).

### Addendum — 2026-11-08 19:20 UTC (E-3 ruling: knowledge_architect)
- D-010: commit group 1 WITHOUT knowledge_architect (12 units). Its MOVES.md row: `pending-copy`,
  reason D-010. Never ship the `~/.rein` write; the read-only-vs-stay-vs-defer ruling is with
  `rein · Architect`.
- seo_* dependency on rein-internal files: no issue needed — E-6 registered (depends on E-3).
- When the 12-unit commit is on main: notify `rein · Architect` with the exact list, then
  `skill: rein-task` to close E-3.

### Addendum — 2026-11-08 19:30 UTC (rein D-154 → D-011)
- knowledge_architect stays in rein; do not copy it. MOVES.md row already added by the Architect.
- Group 1 confirmed as the 12 units. rein registers its removing E-## on your final-list notice.
- E-3/E-6 direction change: seo_manager / seo_content_generator must not reference any rein `src/`
  path. Intent set comes from the task-synchronizer-mcp tool schema; blueprint from the consumer
  project's `.ai/blueprints/`; report what is missing instead of aborting. If a prompt needs the
  intent list inline, ship it as a marked mirror of the rein version. Strip the `src/` references in
  E-3 if cheap; otherwise E-6.
- The repo is not yet a git repository, so this COMM entry is uncommitted; commit it as part of
  E-2's first commit.
- Whether `claude plugin eval` needs an API key in CI is unconfirmed; if it does, it is a CI
  secret, never a tracked file (§6).
---
