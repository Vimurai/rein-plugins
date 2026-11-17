# MOVES — cross-repo move ledger (Architect-owned, see architect.md §3.6)

> **CLOSED 2026-11-17 (D-017).** Nothing moves out of `rein`. Every row below is withdrawn; no
> unit listed here was ever released from this repo, and `rein` removed nothing. Kept as history.

One row per unit moved out of `rein`. A unit is MOVED only when both E-## columns are DONE.
The Engineer appends rows in the E-## that copies the unit; the Architect flips `removed_by`
when `rein` reports its removing task DONE.

| Unit | Kind | From (rein path) | To (plugin) | Added by (here) | Removed by (rein) | Status |
|---|---|---|---|---|---|---|
| `seo_manager` | agent | `src/claude/agents/seo_manager.md` | `rein-seo` | E-3 | pending | withdrawn (D-017) |
| `seo_engineer` | agent | `src/claude/agents/seo_engineer.md` | `rein-seo` | E-3 | pending | withdrawn (D-017) |
| `seo_content_generator` | agent | `src/claude/agents/seo_content_generator.md` | `rein-seo` | E-3 | pending | withdrawn (D-017) |
| `rein-seo` | skill | `src/claude/skills/rein-seo/` | `rein-seo` | E-3 | pending | withdrawn (D-017) |
| `seo_content_checklist` | skill | `src/claude/skills/seo_content_checklist/` | `rein-seo` | E-3 | pending | withdrawn (D-017) |
| `ux_reviewer` | agent | `src/claude/agents/ux_reviewer.md` | `rein-ux` | E-3 | pending | withdrawn (D-017) |
| `vibe_sentinel` | agent | `src/claude/agents/vibe_sentinel.md` | `rein-ux` | E-3 | pending | withdrawn (D-017) |
| `chaos_monkey` | agent | `src/claude/agents/chaos_monkey.md` | `rein-ux` | E-3 | pending | withdrawn (D-017) |
| `ux_template` | skill | `src/claude/skills/ux_template/` | `rein-ux` | E-3 | pending | withdrawn (D-017) |
| `performance_engineer` | agent | `src/claude/agents/performance_engineer.md` | `rein-ops` | E-3 | pending | withdrawn (D-017) |
| `devops_engineer` | agent | `src/claude/agents/devops_engineer.md` | `rein-ops` | E-3 | pending | withdrawn (D-017) |
| `knowledge_architect` | agent | `src/claude/agents/knowledge_architect.md` | `rein-ops` (future) | — | — | withdrawn (D-017) |
| `rein-profile` | skill | `src/shared/skills/rein-profile/` | `rein-ops` | E-3 | pending | withdrawn (D-017) |
| `obs_baseline` | skill | `src/claude/skills/obs_baseline/` | `rein-ops` | E-3 | pending | withdrawn (D-017) |

Status values: `pending-copy` · `copied` (our E-## DONE, rein's pending) · `moved` (at rein's minor
tag, D-004) · `withdrawn` · `stays-in-rein (D-###)`.
