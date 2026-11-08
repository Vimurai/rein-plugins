# rein-seo

SEO and AI-engine-optimisation specialists for Rein projects, packaged as a Claude Code plugin in
the `rein-plugins` marketplace.

**Status:** shell. The agents and skills move here from `rein` in E-3 (group 1); until then this
plugin ships no components.

## Hooks
None. A hook added here must be PostToolUse, Stop or a non-`Bash` matcher (architect.md §6).

## Rein state
A unit that needs Rein state calls the MCP servers `rein` installs; it never reads `.ai/` files
directly.
