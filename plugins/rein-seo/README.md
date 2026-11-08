# rein-seo

SEO and AI-engine-optimisation specialists for Rein projects. Part of the `rein-plugins` marketplace; copied unchanged from `rein` (names
invariant, D-055).

## Units
- Agents: `seo_manager`, `seo_engineer`, `seo_content_generator`
- Skills: `rein-seo`, `seo_content_checklist`

**Known limitation:** `seo_manager` and `seo_content_generator` expect the cluster-intent
taxonomy at `src/shared/seo-cluster-intents.mjs`, which only `rein`'s own tree has; outside it
they stop with `[SEO_INTENTS_MISSING]`. E-6 removes that dependency (D-011): the agents take the
intent set from the `task-synchronizer-mcp` tool contract, read the blueprint from the consumer
project's `.ai/blueprints/seo-keyword-multiplier.md`, and report what is missing instead of
aborting. The bundle carries at most a marked mirror of rein's intent list for prompts.

## Hooks
None. A hook added here must be PostToolUse, Stop or a non-`Bash` matcher.

## Rein state
Units that need Rein state call the MCP servers `rein` installs (`task-synchronizer-mcp`,
`vibe-check-mcp`); none reads `.ai/` state files directly or writes the Rein home directory.
