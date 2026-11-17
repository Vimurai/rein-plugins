# rein-plugins

A Claude Code plugin marketplace of **language packs** for Rein projects (D-017): one optional
plugin per language or framework. A pack makes Claude follow that language's conventions and runs
the project's own formatter and linter on every file Claude edits. Packs need no Rein install and
take nothing from `rein`.

| Plugin | Files | On edit (first tool the project has) |
|---|---|---|
| `rein-typescript` | `.ts .tsx .mts .cts .js .jsx .mjs .cjs` | format: biome, prettier · lint: biome, eslint |

More packs follow (`.ai/blueprints/language-packs.md`, pack list). Each pack has:
- `<language>-conventions` — a short skill that loads when Claude works on matching files;
  **project config wins** over anything in it.
- `<language>-review` — the slow checks (type check, full lint, tests) on request or before a commit.
- an edit hook — `PostToolUse` on `Edit|Write`, one file at a time, never a tool that downloads;
  it fails open (a missing tool or a timeout is silent). Options `format_on_edit` and `lint_on_edit`.

## Install
`rein-app` registers this marketplace for you. By hand:

```
claude plugin marketplace add Vimurai/rein-plugins#stable --scope user
claude plugin install rein-typescript@rein-plugins
```

A hand-written `extraKnownMarketplaces` entry in `settings.json` is not enough: Claude Code does
not register it reliably (D-014; `tests/registration/evidence/`). Use `marketplace add`.

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
and pack check (`scripts/check-marketplace.mjs`), the hook and unit tests (`tests/run.sh`, also the
local CI entry point for `rein ci run`), `claude plugin validate --strict`, rein's publish scan and
the reserved-name check from a pinned rein release, and `claude plugin eval` for every plugin. The eval job needs the
`ANTHROPIC_API_KEY` repository secret.

## Adding a pack
`node scripts/new-pack.mjs <language> --ext .a,.b` writes the skeleton (`--no-hook` for a
skills-only framework pack). Fill in `pack.json` and the two skills, then
`node scripts/new-pack.mjs --sync` (copies the runner, regenerates `hooks/hooks.json`) and
`bash tests/run.sh`.

## Rules for packs
- No writes to the Rein home directory; no changes to a profile's `hooks`, `autoMode`,
  `permissions` or `defaultMode`; no `PreToolUse` hook at all — only `PostToolUse` on `Edit|Write`.
- `hooks/run.mjs` is byte-identical to `scripts/pack-template/run.mjs`; language knowledge lives
  only in `pack.json`.
- Skill names are `<language>-conventions` / `<language>-review`, never `rein-*`, `arch-*` or a
  name `rein` provisions (`scripts/reserved-names.json`).
