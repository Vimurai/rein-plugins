---
name: typescript-conventions
description: TypeScript and JavaScript conventions to follow when writing or editing .ts .tsx .mts .cts .js .jsx .mjs .cjs files. Project config wins over anything here.
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
  - "**/*.cts"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.mjs"
  - "**/*.cjs"
---

# TypeScript and JavaScript conventions

**Project config wins.** `tsconfig.json`, the formatter and linter config (Biome, Prettier,
ESLint), `package.json` and the style of the surrounding code override everything below. Read them
before writing code, and match what is there.

## Before you write
- Check `tsconfig.json` (`strict`, `module`, `moduleResolution`, `target`, `paths`) and
  `package.json` (`"type"`, `engines`, scripts). They decide import syntax, file extensions in
  imports, and which language features are available.
- Match the module system in use: ESM (`import`/`export`) or CommonJS (`require`). Do not mix them
  in one file.
- In an ESM project with `moduleResolution` `node16`/`nodenext`, relative imports carry the file
  extension (`./util.js`, even from a `.ts` file).
- Use the package manager the lockfile names (`package-lock.json` npm, `pnpm-lock.yaml` pnpm,
  `yarn.lock` yarn, `bun.lock`/`bun.lockb` bun). Never add a second lockfile.

## Types
- Keep the project's strictness. Do not loosen `tsconfig.json` or add `// @ts-ignore` to make an
  error go away; fix the type. If a suppression is truly needed, prefer `// @ts-expect-error` with
  a reason.
- Prefer `unknown` over `any` for values whose type is not known yet, and narrow before use.
- Let inference work for locals; annotate exported functions' parameters and return types where
  the project does.
- Avoid non-null assertions (`!`) and type assertions (`as`) when a check or a better type would
  do.
- Model "one of these shapes" with discriminated unions and handle every case; a `never` check in
  the default branch makes a missing case a compile error.
- Use `import type` / `export type` for type-only imports when the project's settings
  (`verbatimModuleSyntax`, `isolatedModules`) expect it.

## Code
- `const` by default, `let` when reassigned, never `var`.
- `===` and `!==`, except where the project's lint config allows `== null`.
- `async`/`await` over raw promise chains; never leave a promise floating — `await` it, return it,
  or handle its rejection.
- Throw `Error` objects (or subclasses), not strings. Keep the original error as `cause` when
  re-throwing.
- Use optional chaining (`?.`) and nullish coalescing (`??`) rather than `||` when `0`, `""` or
  `false` are valid values.
- Keep functions small and pure where practical; avoid mutating parameters.
- No new dependency for something the platform or an existing dependency already does.

## Files and tests
- Follow the project's file naming and directory layout; put tests where the existing tests are,
  with the same runner (Vitest, Jest, `node:test`, …) and naming (`*.test.ts`, `*.spec.ts`).
- Do not hand-edit generated files (build output, `*.d.ts` emitted by the compiler, lockfiles).

## After editing
The rein-typescript edit hook runs the project's own formatter and linter on the file you edited
and shows lint findings to you. Fix findings in the code; do not disable rules to silence them
unless the project already does so for that case. For type checks and tests, use the
`typescript-review` skill.
