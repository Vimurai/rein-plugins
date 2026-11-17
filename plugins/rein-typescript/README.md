# rein-typescript

TypeScript and JavaScript conventions and a review checklist for Claude, and the project's own formatter and linter on every edited file.

```
/plugin install rein-typescript --marketplace Vimurai/rein-plugins
```

- `typescript-conventions` — loads when Claude works on .ts .tsx .mts .cts .js .jsx .mjs .cjs files.
- `typescript-review` — the slow checks, on request or before a commit.
- Edit hook — after each Edit/Write of a matching file, runs the project's own formatter, then its
  linter, on that one file. Options: `format_on_edit`, `lint_on_edit` (both on by default).

## Trust
The hook runs with your session's permissions, after Claude's edit. It runs only tools found in the
project (`node_modules/.bin`, `vendor/bin`, …) or on `PATH`, never a package runner that downloads.
A formatter or linter may load project config that is code (an ESLint config, for example): that is
your project's own code, the same trust you give `npm run lint`. The hook never fails an edit: a
missing tool, a file outside the project or a timeout is silent.

## Tools the hook uses
The first tool whose config file exists and whose binary resolves (`node_modules/.bin`, then `PATH`):

| Step | Tool, in order | Runs only when the project has |
|---|---|---|
| Format | `biome format --write`, then `prettier --write` | `biome.json(c)` / a Prettier config file |
| Lint | `biome lint`, then `eslint` | `biome.json(c)` / an `eslint.config.*` file (flat config) |

Type checks, full lint and tests are whole-project and live in `typescript-review`, never on edit.
Turn either step off per project with the plugin options `format_on_edit` and `lint_on_edit`.
