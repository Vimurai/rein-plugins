# DIGEST (Token Saver Cache)

## Triad Health
- Stage: Executing (bootstrap sprint, PRs stacked behind an operator secret)
- Architect Focus: all cross-repo questions Q1–Q5 answered; relaying fixture data to rein-app
- Engineer Focus: E-9/E-8 stacked on the E-4 branch while PR #1 waits for the hosted-eval secret

## Current snapshot
- Product: Claude Code plugin marketplace for Rein's non-gate capabilities (specialist agents,
  optional workflow skills, rules, optional hooks); consumed by rein-app per profile.
- Stack: Claude Code plugin format (`.claude-plugin/marketplace.json`, `plugins/<name>/.claude-plugin/plugin.json`),
  `claude plugin eval`, CI with rein publish scan from a pinned rein release.
- Upstream law: rein D-150 ecosystem contract + rein-plugins plan (rein commit db92fd6).
- Repo live: github.com/Vimurai/rein-plugins, `stable` branch = release pointer (untagged until E-3 merges).
- PRs: #1 = E-3 group 1 (13 units, reviewed, waits on secret) → #2 = E-7 (CI once per PR) → #3 = E-4
  registration fixture (green on a clean runner). Merge strictly in that order.
- Queue after merges: E-5 (group 2), E-6 (rein-seo self-contained), E-8 (shorthand `ref` pin, M3),
  E-9 (rein-app measurements M1/M2/M4). E-8/E-9 set OPEN for stacked work; tasks go DONE at merge.
- Decisions: D-001..D-016. Key: clean-cut moves at a rein minor tag (D-004); gate-adjacent agents and
  knowledge_architect stay in rein (D-005, D-011); rein-app registers via `claude plugin marketplace
  add Vimurai/rein-plugins#stable` + `claude plugin install`, install-from-settings tolerated not
  relied on (D-006, D-013..D-016); Apache-2.0 (D-008); publish scan from pinned rein release (D-003).
- Known risks: hosted eval red until the operator sets the `ANTHROPIC_API_KEY` repo secret — gates
  PR #1 and the authenticated measurement M2. Fixture lines must carry no paths or account data.
- Pending pings (Architect): rein · Architect with the 13-unit list when PR #1 merges (Engineer sends);
  rein-app · Architect when the first tag is on `stable`, and the same day on an M1 HEAD ≠ origin/stable
  or `[FIXTURE_REF_MISSING]` line.
- Hard rules: no writes to ~/.rein or profile hooks/autoMode/permissions/defaultMode; no PreToolUse on
  Bash; Rein state only via MCP servers; names invariant (D-055); publish scan clean (D-117).
- Working-tree rule: Engineer does branch work in separate worktrees; the shared checkout stays on the
  PR/main branch; Architect `.ai/` edits ride that branch via `git commit --only`.

## Recent changes (last 10)
- 2026-11-08 Architect: blueprint, MOVES.md, DECISIONS.md D-001..D-003; E-2..E-5 registered; Q1–Q3 asked.
- 2026-11-08 Engineer: E-2 skeleton + CI live; E-3 group 1 in PR #1; E-7 in PR #2; E-4 fixture in PR #3.
- 2026-11-08 Architect: D-004..D-016 mirrored from rein/rein-app; E-6..E-9 registered; Q4/Q5 raised
  from fixture findings and closed.

---
DIGEST must be accurate or flagged as stale. If stale, invoke `skill: rein-digest`.
