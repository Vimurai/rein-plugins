# DIGEST (Token Saver Cache)

## Triad Health
- Stage: Executing (direction changed 2026-11-17, D-017)
- Architect Focus: language packs planned; waiting on E-10/E-11 and on the operator secret
- Engineer Focus: E-9 then E-8 (fixture), then E-10 close-out, then E-11 foundation + first pack

## Current snapshot
- Product: Claude Code plugin marketplace of **language packs** for Rein projects — one optional
  plugin per language or framework. `rein` is untouched; nothing moves out of it (D-017).
- A pack = `rein-<language>`: a conventions skill loaded by file path, a review skill, and a
  PostToolUse `Edit|Write` hook that runs the project's own formatter and linter on the edited
  file. Project config wins; the hook fails open. Blueprint: `.ai/blueprints/language-packs.md`.
- Packs planned (14): typescript, rust, php, astro, laravel · python, go, shell, cpp, ruby ·
  java, kotlin, csharp, swift.
- Stack: Claude Code plugin format, `claude plugin eval`, CI with pack check, stubbed hook tests
  and the rein publish scan from a pinned rein release.
- Repo: github.com/Vimurai/rein-plugins, `stable` = release pointer, untagged until E-11 merges.
- PRs: #1 (E-3 move) is to be closed unmerged by E-10, branch kept as rollback. #2 = E-7, #3 = E-4
  stay. Merge order: #2 → #3 → E-9 → E-8 → E-11 → E-12/E-13/E-14.
- Tasks: E-10 OPEN; E-11 waits on E-10; E-12..E-14 wait on E-11. E-3, E-5, E-6 withdrawn (parked
  BLOCKED; the Engineer retires them as DONE in E-10 once local CI is green on main).
- Decisions: D-001..D-017. D-017 supersedes D-002, D-004, D-010, D-011; D-005 is moot. Still key:
  registration toward rein-app (D-006, D-013..D-016), Apache-2.0 (D-008), publish scan from a
  pinned rein release (D-003), hosted eval must be green to merge (D-009).
- Known risks: hosted eval red until the operator sets the `ANTHROPIC_API_KEY` repo secret — no PR
  merges and no tag reaches `stable` without it. Conventions text needs upkeep per language.
- UNDELIVERED (2026-11-17, both sessions were down): tell `rein · Architect` the move plan is
  withdrawn so rein drops its planned removals; tell `rein-app · Architect` the plugin names change
  to the 14 packs. Text of both is in COMM.md addendum 2026-11-17. Send when they are reachable.
- Pending pings (Architect): rein-app · Architect when the first tag is on `stable`, and the same
  day on an M1 HEAD ≠ origin/stable or `[FIXTURE_REF_MISSING]` line.
- Hard rules: no writes to ~/.rein or profile hooks/autoMode/permissions/defaultMode; no
  PreToolUse hook at all in a pack; Rein state only via MCP servers; publish scan clean (D-117).
- Working-tree rule: Engineer does branch work in separate worktrees; Architect `.ai/` edits ride
  the shared checkout's branch via `git commit --only` (moves to main in E-10).

## Recent changes (last 10)
- 2026-11-08 Architect: blueprint, MOVES.md, D-001..D-016; E-2..E-9 registered; Q1–Q5 closed.
- 2026-11-08 Engineer: E-2 skeleton + CI live; E-3 in PR #1; E-7 in PR #2; E-4 fixture in PR #3.
- 2026-11-17 Architect: operator ruled rein stays untouched → D-017; language-packs blueprint;
  E-10..E-14 registered; E-3/E-5/E-6 withdrawn; notices to rein and rein-app Architects undelivered (sessions down).

---
DIGEST must be accurate or flagged as stale. If stale, invoke `skill: rein-digest`.
