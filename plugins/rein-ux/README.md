# rein-ux

UI quality specialists for Rein projects. Part of the `rein-plugins` marketplace; copied unchanged from `rein` (names
invariant, D-055).

## Units
- Agents: `ux_reviewer`, `vibe_sentinel`, `chaos_monkey`
- Skills: `ux_template`

## Hooks
None. A hook added here must be PostToolUse, Stop or a non-`Bash` matcher.

## Rein state
Units that need Rein state call the MCP servers `rein` installs (`task-synchronizer-mcp`,
`vibe-check-mcp`); none reads `.ai/` state files directly or writes the Rein home directory.
