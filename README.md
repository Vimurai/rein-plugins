# rein-plugins

A Claude Code plugin marketplace for Rein's non-gate capabilities: specialist agents, optional
workflow skills and rules, packaged as independently installable plugins. The gate, the role
machinery and the MCP servers stay in `rein`.

| Plugin | Contents |
|---|---|
| `rein-seo` | `seo_manager`, `seo_engineer`, `seo_content_generator` agents; `rein-seo`, `seo_content_checklist` skills |
| `rein-ux` | `ux_reviewer`, `vibe_sentinel`, `chaos_monkey` agents; `ux_template` skill |
| `rein-ops` | `performance_engineer`, `devops_engineer` agents; `rein-profile`, `obs_baseline` skills |

## Install
`rein-app` registers this marketplace for you. By hand, merge this into your Claude Code
`settings.json` (each `true` key installs and enables that plugin):

```json
{
  "extraKnownMarketplaces": {
    "rein-plugins": { "source": { "source": "github", "repo": "Vimurai/rein-plugins", "ref": "stable" } }
  },
  "enabledPlugins": { "rein-seo@rein-plugins": true, "rein-ux@rein-plugins": true, "rein-ops@rein-plugins": true }
}
```

## Release pointer: the `stable` branch
Users follow the **`stable`** branch, never the trunk (rein-app registers `ref: "stable"`).
Marketplace sources accept a branch or tag but not a commit sha, so `stable` is the one pointer a
release moves:

- **Release**: tag the release on the trunk, then fast-forward `stable` to that tag's commit
  (`git push origin <tag>^{commit}:refs/heads/stable`).
- **Rollback**: reset `stable` to the previous release tag's commit
  (`git push --force-with-lease origin <previous-tag>^{commit}:refs/heads/stable`). Users pick it up
  on their next marketplace refresh. No `rein` release is involved.

`stable` only ever points at a release tag's commit; nothing is committed to it directly.

## CI
Every push and pull request runs `.github/workflows/ci.yml`: the manifest and name-collision check
(`scripts/check-marketplace.mjs`), `claude plugin validate --strict`, rein's publish scan from a
pinned rein release, and `claude plugin eval` for every plugin. The eval job needs the
`ANTHROPIC_API_KEY` repository secret.

## Rules for plugins
- No writes to the Rein home directory; no changes to a profile's `hooks`, `autoMode`,
  `permissions` or `defaultMode`; no PreToolUse hook on `Bash`.
- Rein state only through the MCP servers `rein` installs, never by reading `.ai/` files.
- Skill and agent names keep their exact `rein` names across a move.
