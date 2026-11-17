# Registration fixture (E-4)

`node tests/registration/fixture.mjs [checkout]` proves the marketplace installs into a throwaway
Claude profile through the registration JSON rein-app writes (`rein-app-registration.json`,
verbatim from D-006). It needs no rein release (D-012). It runs in CI as the `registration` job.

rein-app's assertions (D-013 = rein-app D-005, D-014):

| | Assertion | Layer | Status |
|---|---|---|---|
| a | the `rein-plugins` registration key is present after apply | shape + install | enforced |
| b | an `enabledPlugins["<p>@rein-plugins"]` entry exists only after `claude plugin install` (absent after `marketplace add`, `true` after install), and the plugin is enabled | install | enforced |
| c | a profile holding only the registration JSON registers nothing and installs nothing | reconcile | **suspended — report-only** (D-015) |

## Assertion (c) is suspended (D-015, Q5 with rein-app)
Evidence from 2026-11-08 (`evidence/2026-11-08-settings-only-start.md`) (Claude Code 2.1.319, `directory` source) contradicts (c). Before any
start the marketplace is not registered. One headless start registers it, even an
unauthenticated one. One authenticated start installed an enabled bundle from settings alone.
D-015 suspends D-013 (c) and D-014's "not registered". Until rein-app rules on Q5, the reconcile layer only
reports, printing `[FIXTURE_Q5_OBSERVED]` lines for registration before and after the start and
the install state of each bundle. **When rein-app rules, turn the layer into assertions that
match the ruling. Track that as its own task, and don't leave the layer report-only.**

## Named outcomes
- Failures: `[FIXTURE_SHAPE]`, `[FIXTURE_INSTALL]`, `[FIXTURE_ENABLED_BEFORE_INSTALL]`,
  `[FIXTURE_PLUGIN_MISSING]`, `[FIXTURE_PLUGIN_DISABLED]`, `[FIXTURE_SHAPE_DRIFT]`,
  `[FIXTURE_RECONCILE]` (credentialed start could not run)
- Skips: `[FIXTURE_SKIP_NO_CLAUDE]` (whole fixture; ends `[FIXTURE_SKIPPED]`, not `[FIXTURE_OK]`);
  `[FIXTURE_SKIP_NO_CREDENTIAL]` (the reconcile start ran unauthenticated)
- Info: `[FIXTURE_PENDING]` (a D-006 key whose bundle has not moved yet), `[FIXTURE_Q5_OBSERVED]`
- Extra bundles to require: `FIXTURE_REQUIRE=a,b`

## Q5 measurements (E-9, D-016) — report-only
`node tests/registration/q5-measurements.mjs` runs after the fixture in the `registration` job,
against the live public repo (github source `Vimurai/rein-plugins` @ `stable`), each in a fresh
`CLAUDE_CONFIG_DIR`. It exits 0 whatever it observes; the lines are evidence for rein-app.

| Line | Measures |
|---|---|
| `[FIXTURE_Q5_M1] <ver> source=github registered=… ref=… head=<sha7> origin/stable=<sha7> head-match\|HEAD_MISMATCH` | one unauthenticated start on a profile holding only the github entry + `enabledPlugins {"rein-typescript@rein-plugins": true}`: does `known_marketplaces.json` carry ref `stable`, does the clone's HEAD equal origin/stable |
| `[FIXTURE_Q5_TRUNK_TRACKING]` | M1 mismatch or missing ref — silent trunk-tracking; **tell the Architect the same day** |
| `[FIXTURE_Q5_M2] <ver> source=github rein-typescript@rein-plugins installs=<n>/3 version=… sha=… start-exits=…` | three fresh profiles (same settings as M1), one default authenticated start each (no `CLAUDE_CODE_SYNC_PLUGIN_INSTALL`) |
| `[FIXTURE_Q5_M4] <ver> source=github prior=reconciled exit=0 entry=unchanged known-entries=1 settings-entries=1` | `claude plugin marketplace add Vimurai/rein-plugins#stable --scope user` on the profile M1's start reconciled; `CHANGED`, `DUPLICATE` or `NOT_RECONCILED` mark a non-idempotent result |

Skips: `[FIXTURE_SKIP_NO_CLAUDE]`; `[FIXTURE_SKIP_NO_NETWORK]` (remote unreachable — M1, M2, M4);
`[FIXTURE_SKIP_NO_CREDENTIAL]` (M2 only). The classifiers live in `q5.mjs` and are unit-tested in
`q5.test.mjs` (trunk-tracking, absent ref, changed/duplicate entry, no path in any line).

## M3 — shorthand registration keeps the ref (E-8, D-014) — an assertion
`node tests/registration/m3-ref.mjs` runs `claude plugin marketplace add Vimurai/rein-plugins#stable
--scope user` in a fresh `CLAUDE_CONFIG_DIR` (no credential) and prints
`[FIXTURE_Q5_M3] <ver> source=github exit=<n> ref=… repo=… ok`. It fails the job with
`[FIXTURE_REF_MISSING]` when the written `extraKnownMarketplaces["rein-plugins"].source` has no ref
(rein-app reopens its D-007 on that), or `[FIXTURE_SHAPE_DRIFT]` on another ref or repo. Skips:
`[FIXTURE_SKIP_NO_CLAUDE]`, `[FIXTURE_SKIP_NO_NETWORK]`. `classifyM3` is unit-tested with a bogus ref.
