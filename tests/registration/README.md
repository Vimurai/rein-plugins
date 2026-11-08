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
reports, printing `[FIXTURE_Q4_OBSERVED]` lines for registration before and after the start and
the install state of each bundle. **When rein-app rules, turn the layer into assertions that
match the ruling. Track that as its own task, and don't leave the layer report-only.**

## Named outcomes
- Failures: `[FIXTURE_SHAPE]`, `[FIXTURE_INSTALL]`, `[FIXTURE_ENABLED_BEFORE_INSTALL]`,
  `[FIXTURE_PLUGIN_MISSING]`, `[FIXTURE_PLUGIN_DISABLED]`, `[FIXTURE_SHAPE_DRIFT]`,
  `[FIXTURE_RECONCILE]` (credentialed start could not run)
- Skips: `[FIXTURE_SKIP_NO_CLAUDE]` (whole fixture; ends `[FIXTURE_SKIPPED]`, not `[FIXTURE_OK]`);
  `[FIXTURE_SKIP_NO_CREDENTIAL]` (the reconcile start ran unauthenticated)
- Info: `[FIXTURE_PENDING]` (a D-006 key whose bundle has not moved yet), `[FIXTURE_Q4_OBSERVED]`
- Extra bundles to require: `FIXTURE_REQUIRE=a,b`
