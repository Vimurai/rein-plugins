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

### Addendum — 2026-11-08 19:45 UTC (E-3 PR #1 review notes)
- Count corrected: group 1 is 13 units (my error, D-010/D-011 fixed). Notify rein with 13.
- E-6 clarified in D-011: marked mirror of the intent list + report MCP refusals verbatim; the
  schema does not enumerate intents today.
- E-7 registered (Tier 1): restrict CI `push` trigger to main/stable; go through `skill: ci_gate`.
- E-4 may start now on its own branch (it depends only on E-2, which is DONE); keep E-3's PR
  separate and merge it first when the secret lands.
- Merge of PR #1 waits for hosted eval green (D-009's check); the operator sets the secret.
- The repo is not yet a git repository, so this COMM entry is uncommitted; commit it as part of
  E-2's first commit.
- Whether `claude plugin eval` needs an API key in CI is unconfirmed; if it does, it is a CI
  secret, never a tracked file (§6).

### Addendum — 2026-11-08 20:05 UTC (E-4 rulings)
- D-012: fixture skips on missing `claude` CLI or credential, not on a missing rein release — approved.
- Q4 opened with `rein-app · Architect`: whether user/project-scope `enabledPlugins` installs at
  session start. Until answered the fixture asserts registration + enablement; add the install
  assertion when the mechanism is confirmed. Send me the `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1` result.
- D-011 heading fixed to 13 units; rein's enum commitment (e8d9db4) recorded in D-011.
- Branch hygiene accepted: feature work in separate worktrees; shared tree stays on the PR/main
  branch; ping me before I write .ai/ after any switch.
- Merge order: PR #1 (E-3) → PR #2 (E-7) → E-4.

### Addendum — 2026-11-08 20:20 UTC (Q4 answered → D-013)
- `enabledPlugins` enables only; rein-app runs `claude plugin install` per profile; `true` is
  written by Claude Code. D-006 (3) superseded.
- E-4 fixture as built matches D-013's three assertions. One change when the CI credential lands:
  the reconcile layer flips from report-only to asserting that the settings write alone installed
  nothing (`[FIXTURE_Q4_OBSERVED]` becomes a failure if anything installed). Keep it report-only
  until then; note the flip in the fixture's README.
- Correct refusal on credentials: never copy an operator login into a throwaway config dir.
- Forward to me the first `[FIXTURE_Q4_OBSERVED]` lines from CI; I relay them to rein-app.

### Addendum — 2026-11-08 20:35 UTC (rein-app D-007 → D-014, E-8 registered)
- rein-app proved on Claude Code 2.1.319 that a hand-written `extraKnownMarketplaces` entry is not
  registered; they now use `claude plugin marketplace add Vimurai/rein-plugins#stable --scope user`.
  JSON unchanged; author is Claude Code.
- E-4 reconcile layer: when the credential exists, the expected observation is "not registered,
  nothing installed" — assert that, not just "nothing installed".
- E-8 (Tier 2, depends on E-4): CI asserts the shorthand form writes `source.ref == "stable"`
  against the live repo; `[FIXTURE_REF_MISSING]` → tell me immediately (rein-app reopens D-007).

### Addendum — 2026-11-08 20:50 UTC (D-015: session start registers / installs from settings)
- Your finding is forwarded to rein-app as Q5 and recorded as D-015. D-013 (c) and D-014
  "not registered" are suspended.
- Approved: reconcile layer report-only for registration AND install, before and after a start;
  remove the "flip to failure" wording from the README. The 20:35 instruction to assert "not
  registered, nothing installed" is withdrawn.
- Keep the evidence in the PR: a sanitised excerpt of the installed_plugins.json entry (version,
  sha, timestamp — no paths, no account data) and the two unauthenticated before/after
  registration transcripts, so rein-app can cite them.
- Do not attempt to reproduce the authenticated sample with any credential you did not receive
  for that purpose; CI with the operator's secret is the place.

### Addendum — 2026-11-08 21:05 UTC (rein-app D-009 → D-016; E-9 registered)
- Q5 closed: explicit `marketplace add` + `plugin install` stays rein-app's primary flow;
  install-from-settings is tolerated, not relied on. Suspensions lifted; report-only model stands.
- E-8 now also asserts ref `stable` in `known_marketplaces.json` (M3).
- E-9 (depends on E-4): report-only lines `[FIXTURE_Q5_M1|M2|M4] <claude version> <result>`.
  M1's HEAD ≠ origin/stable is the one result that matters most — send it to me the same day.
- Line hygiene: no filesystem paths or account data in any fixture line (D-117).

### Addendum — 2026-11-08 21:20 UTC (PR #3 up; stacked work approved)
- E-4 in PR #3, green on a clean runner; registration-by-start lines forwarded to rein-app.
- E-8 and E-9 set OPEN for stacked work on the E-4 branch (separate worktree). Start E-9 first (M1
  and M4 need no secret; M2 skips), then E-8. Open each as a draft PR against the E-4 branch;
  rebase and retarget to main after #3 merges. Merge order stays #1 → #2 → #3 → E-9 → E-8.
- Tasks go DONE at merge, not at PR-up; E-4 stays OPEN until #3 merges.
- Commit the uncommitted review stamps in the shared tree's `.ai/` with `git commit --only` into
  PR #1 (bookkeeping, no critic stamp needed).
- M2 measures the default (no CLAUDE_CODE_SYNC_PLUGIN_INSTALL); the E-4 "(sync-install forced)" label
  stays as-is for the record.
---

---
## Handoff — 2026-11-17 16:57 UTC
**From**: Architect → Engineer
**Trigger**: operator asked to build; repo scan shows the queue idle since 2026-11-08

### What was built
- Nothing new. Scan result: PRs #1 (E-3), #2 (E-7), #3 (E-4) are open; `checks`, `publish-scan`
  and `registration` pass; every `eval` job fails in ~8s with `[EVAL_NO_CREDENTIAL]` (repo has
  no secrets). E-8 and E-9 have no branch or PR yet. main = stable = 02987aa, untagged.

### Decisions made
- No new D-###. Sequencing ruling only: E-5 and E-6 may now be built stacked, the same way
  E-8/E-9 were approved on 2026-11-08 21:20. D-009 stands: hosted eval does not skip, and no PR
  merges while eval is red.

### Blueprint divergence (if any)
- NONE

### Next action needed
Build in this order, each in its own worktree, each as a draft PR against its parent branch:
1. E-9 (M1, M4; M2 skips with `[FIXTURE_SKIP_NO_CREDENTIAL]`) on the E-4 branch.
2. E-8 (M3, `[FIXTURE_REF_MISSING]` path unit-tested with a bogus ref) on the E-4 branch.
3. E-6 (rein-seo self-contained, per architect.md §9 row E-6 and D-011, which supersede the
   task text) on the E-3 branch.
4. E-5 (group 2 → rein-ops extension + rein-data) on the E-3 branch. rein has moved nine days
   since the unit list was written: before copying, confirm each of the ten units still exists
   at the path in architect.md §2 in the pinned rein release. A unit that is missing, renamed
   or changed owner is a stop-and-ask, not a judgment call.
- Local `claude plugin eval` at threshold 1.0 is the proof for each bundle until the secret
  lands; put the local result in the PR body.
- Tasks go DONE at merge, not at PR-up. Merge order: #1 → #2 → #3 → E-9 → E-8 → E-6 → E-5.
- Forward the first `[FIXTURE_Q5_M1]` line the same day (HEAD ≠ origin/stable matters most).
- Notify `rein · Architect` with unit lists only when the copying PR merges (D-004).

### Open risks
- The operator secret is still the only merge blocker; nothing reaches `stable` or gets a tag
  until it is set, so rein-app keeps its "remote not live" risk.
- Four stacked branches on two bases: rebase and retarget to main as each parent merges.
- The shared tree carries uncommitted `.claude/` sync changes (not .ai/); they are yours to
  commit or discard, not part of this handoff commit.
---

---
## Handoff — 2026-11-17 17:10 UTC
**From**: Architect → Engineer
**Trigger**: operator ruling D-017 — rein stays untouched; language packs replace the move plan

### What was built
- Planning only: D-017 in DECISIONS.md; new blueprint `.ai/blueprints/language-packs.md`;
  architect.md §0 (what is superseded, what still holds); MOVES.md closed; DIGEST refreshed;
  E-10..E-14 registered.

### Decisions made
- D-017: nothing moves out of rein. This repo ships 14 additive language packs
  (`rein-<language>`): conventions skill by file path, review skill, PostToolUse Edit|Write hook
  running the project's own formatter/linter. Supersedes D-002, D-004, D-010, D-011.
- The 16:57 handoff's items 3 and 4 (E-6, E-5) are withdrawn for good. Items 1 and 2 (E-9, E-8)
  stand unchanged.
- Bookkeeping exception to "no merge while eval is red": a PR that touches only `.ai/` may merge
  when the sole red check is `[EVAL_NO_CREDENTIAL]`. Every other PR still waits for the secret.

### Blueprint divergence (if any)
- NONE — no implementation exists for the new blueprint yet.

### Next action needed
1. Finish E-9, then E-8, as already instructed.
2. E-10 (Tier 1): cherry-pick the `.ai/` commits from engineer/e3-group1 to main in one
   bookkeeping PR, merge it under the exception above, put the shared checkout on main, close
   PR #1 unmerged (keep the branch), set MOVES.md rows to `withdrawn`. Then retire E-3, E-5 and
   E-6 as DONE with summary "WITHDRAWN per D-017" — I could not: the CI gate refuses DONE without
   a green local run for HEAD, so they are parked BLOCKED. Tell me before I next write `.ai/`
   after the checkout switches.
3. E-11 (Tier 2): foundation + `rein-typescript` + first tag. Read the whole blueprint first.
   Base branch: main if PR #3 and the E-9/E-8 PRs have merged; otherwise stack on the tip of the
   fixture stack so the fixture's plugin keys can be updated in the same PR.
4. E-12, E-13, E-14 unblock when E-11 is DONE; they are independent of each other.
- The plugin facts the blueprint relies on were checked against the Claude Code docs today:
  plugins have no `rules/` directory (hence skill `paths:`), handler-level `if` filters exist,
  `${CLAUDE_PLUGIN_ROOT}` and `CLAUDE_PLUGIN_OPTION_<KEY>` exist, exit 2 on PostToolUse shows
  stderr to the model. The exact behaviour of `if: "Write(*.ext)"` is not spelled out in the
  docs: verify it in E-11 and keep the runner's own extension check as the real guard. If any
  of these does not hold on the pinned Claude Code version, stop and tell me.

### Open risks
- The operator secret is still the merge blocker for everything except the bookkeeping PR.
- rein has commitments on its side from the move plan (its D-150/D-151/D-154, enum commit
  e8d9db4). I have notified `rein · Architect`; nothing here depends on their answer.
- Conventions text is the part that can go wrong quietly: keep it short and defer to project
  config; do not invent style rules.
---

### Addendum — 2026-11-17 17:11 UTC (cross-repo notices NOT delivered)
Correction to the handoff above: I did not reach `rein · Architect` or `rein-app · Architect` —
neither session was running. E-10's "the Architect has notified them" is therefore not yet true;
it is still not the Engineer's job. The two notices, to be sent by the Architect when the
sessions are up:
- **To rein · Architect**: operator ruling 2026-11-17, our D-017 — nothing moves out of rein. The
  13 group-1 and 10 group-2 units stay in rein; drop the removal work queued under rein
  D-150/D-151/D-154 (removing E-##, D-076 allowlist change, sync prune, `[SKILL_MOVED]` doctor
  line). Nothing was released from rein-plugins; PR #1 is closed unmerged. The reversal of rein's
  decisions is rein's to record. Reply only if a removal already shipped in a rein release.
- **To rein-app · Architect**: registration contract unchanged (marketplace name, `#stable`,
  `marketplace add` + `plugin install`, `<plugin>@rein-plugins`, M1–M4). Plugin names change from
  rein-seo/rein-ux/rein-ops/rein-data to the 14 packs in the blueprint's pack list;
  `rein-typescript` exists first. Each pack ships one PostToolUse Edit|Write hook and two boolean
  options. First tag on `stable` still pending the hosted-eval secret.
