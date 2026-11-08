# MOVES — cross-repo move ledger (Architect-owned, see architect.md §3.6)

One row per unit moved out of `rein`. A unit is MOVED only when both E-## columns are DONE.
The Engineer appends rows in the E-## that copies the unit; the Architect flips `removed_by`
when `rein` reports its removing task DONE.

| Unit | Kind | From (rein path) | To (plugin) | Added by (here) | Removed by (rein) | Status |
|---|---|---|---|---|---|---|
| `seo_manager` | agent | `src/claude/agents/seo_manager.md` | `rein-seo` | E-3 | pending | copied — known limitation: needs rein-internal `src/shared/seo-cluster-intents.mjs`, fixed by E-6 |
| `seo_engineer` | agent | `src/claude/agents/seo_engineer.md` | `rein-seo` | E-3 | pending | copied |
| `seo_content_generator` | agent | `src/claude/agents/seo_content_generator.md` | `rein-seo` | E-3 | pending | copied — known limitation: needs rein-internal `src/shared/seo-cluster-intents.mjs`, fixed by E-6 |
| `rein-seo` | skill | `src/claude/skills/rein-seo/` | `rein-seo` | E-3 | pending | copied |
| `seo_content_checklist` | skill | `src/claude/skills/seo_content_checklist/` | `rein-seo` | E-3 | pending | copied |
| `ux_reviewer` | agent | `src/claude/agents/ux_reviewer.md` | `rein-ux` | E-3 | pending | copied |
| `vibe_sentinel` | agent | `src/claude/agents/vibe_sentinel.md` | `rein-ux` | E-3 | pending | copied |
| `chaos_monkey` | agent | `src/claude/agents/chaos_monkey.md` | `rein-ux` | E-3 | pending | copied |
| `ux_template` | skill | `src/claude/skills/ux_template/` | `rein-ux` | E-3 | pending | copied |
| `performance_engineer` | agent | `src/claude/agents/performance_engineer.md` | `rein-ops` | E-3 | pending | copied |
| `devops_engineer` | agent | `src/claude/agents/devops_engineer.md` | `rein-ops` | E-3 | pending | copied |
| `knowledge_architect` | agent | `src/claude/agents/knowledge_architect.md` | `rein-ops` (future) | — | — | stays-in-rein (D-011 = rein D-154: writes `~/.rein`, dispatched by `rein init`; moves once memory-manager-mcp exposes a palace query tool, without the maintenance write) |
| `rein-profile` | skill | `src/shared/skills/rein-profile/` | `rein-ops` | E-3 | pending | copied |
| `obs_baseline` | skill | `src/claude/skills/obs_baseline/` | `rein-ops` | E-3 | pending | copied |

Status values: `pending-copy` · `copied` (our E-## DONE, rein's pending) · `moved` (at rein's minor
tag, D-004) · `withdrawn` · `stays-in-rein (D-###)`.
