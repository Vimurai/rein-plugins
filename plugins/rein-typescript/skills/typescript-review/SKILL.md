---
name: typescript-review
description: Review checklist for TypeScript and JavaScript changes — the slow checks (type check, full lint, tests, build) to run before a commit or when asked to review TypeScript or JavaScript code.
---

# TypeScript and JavaScript review

**Prefer the project's own scripts.** If `package.json` has a script for a check, run that script
with the project's package manager (from the lockfile: npm, pnpm, yarn or bun) instead of the raw
command below. Run each check only when its condition holds, and report what each one printed.

## Checks, in order
1. **Type check** — if `tsconfig.json` exists: the `typecheck` (or `type-check`, `tsc`) script, else
   `npx --no-install tsc --noEmit` (add `-p <file>` when the project builds with another tsconfig).
2. **Lint, whole project** — if a `lint` script exists, run it. Otherwise:
   - if `biome.json` or `biome.jsonc` exists: `npx --no-install biome check .`
   - else if an `eslint.config.*` file exists: `npx --no-install eslint .`
3. **Format check** — if a `format:check` (or similar) script exists, run it. Otherwise, if Biome
   is configured, `biome check` above covers it; if a Prettier config exists:
   `npx --no-install prettier --check .`
4. **Tests** — if a `test` script exists: run it (non-watch mode, e.g. `vitest run`, `jest --ci`).
5. **Build** — if a `build` script exists and the change touches build inputs (sources, config,
   dependencies): run it.

`--no-install` matters: never let a check download a tool the project does not already have. If a
tool is missing, say so instead of installing it.

## Then review the diff
- Types: no new `any`, `@ts-ignore` or unexplained `as`/`!`; exported APIs have the types the
  project expects; every case of a union is handled.
- Errors: no floating promises, no swallowed errors, `Error` objects thrown with context.
- Tests: changed behaviour has a test in the project's runner; no `.only` or skipped tests left in.
- Dependencies: anything added to `package.json` is needed, and the lockfile changed with it.
- Generated files and lockfiles are not hand-edited.

Report findings by file and line, most severe first. Do not fix anything the user did not ask you
to fix.
