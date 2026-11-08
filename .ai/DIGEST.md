# DIGEST (Token Saver Cache)

## Triad Health
- Stage: Executing (bootstrap sprint)
- Architect Focus: blueprint written; awaiting upstream answers Q1–Q3 (architect.md §10)
- Engineer Focus: E-2 marketplace skeleton + CI

## Current snapshot
- Product: Claude Code plugin marketplace for Rein's non-gate capabilities (specialist agents,
  optional workflow skills, rules, optional hooks); consumed by rein-app per profile.
- Stack: Claude Code plugin format (`.claude-plugin/marketplace.json`, `plugins/<name>/.claude-plugin/plugin.json`),
  `claude plugin eval`, CI with rein publish scan from a pinned rein release. Not yet a git repo (E-2 inits it).
- Upstream law: rein D-150 ecosystem contract + rein-plugins plan (rein commit db92fd6).
- Current focus: E-2 skeleton+CI → E-3 move group 1 (rein-seo, rein-ux, rein-ops) → E-4 rein-app
  registration fixture (blocked on Q3) → E-5 move group 2 (rein-ops ext, rein-data).
- Decisions: D-001..D-006 (Q1–Q3 all answered: clean-cut moves, gate-adjacent agents stay,
  rein-app registers `Vimurai/rein-plugins` at `ref: stable`). `stable` branch = release pointer.
- Repo live: github.com/Vimurai/rein-plugins (main 4b36b2d, stable 72b579e, untagged). E-2 built;
  closes under D-009 once LICENSE/license fields land.
- Known risks: hosted eval red until the operator sets the `ANTHROPIC_API_KEY` repo secret.
- Pending pings (Architect): rein-app · Architect when the first tag is on `stable`; rein · Architect
  when E-3 / E-5 copies land.
- Hard rules: no writes to ~/.rein or profile hooks/autoMode/permissions/defaultMode; no PreToolUse on
  Bash; Rein state only via MCP servers; names invariant (D-055); publish scan clean (D-117).

## Recent changes (last 10)
- 2026-11-08 Architect: wrote architect.md, MOVES.md, DECISIONS.md (D-001..D-003); registered E-2..E-5;
  retired placeholder E-1; asked rein · Architect (Q1, Q2) and rein-app · Architect (Q3).

---
DIGEST must be accurate or flagged as stale. If stale, invoke `skill: rein-digest`.
