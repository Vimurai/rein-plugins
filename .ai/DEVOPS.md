# DEVOPS — rein-plugins

## Pipeline (E-2, 2026-11-08)
Hosted on GitHub Actions: `.github/workflows/ci.yml`, on every push and pull request.

| Job | What | Fails with |
|---|---|---|
| `checks` | `node scripts/check-marketplace.mjs .`; `claude plugin validate --strict` on the marketplace and each plugin | `[MANIFEST_MISMATCH]`, `[MANIFEST_INVALID]`, `[NAME_COLLISION]`, validator errors |
| `publish-scan` | rein `publish-scan.mjs scan-tree` from the pinned rein release tarball (sha256-checked), run outside the workspace | `[PUBLISH_SCAN_HIT]`, `[PUBLISH_GATE]`, `[REIN_RELEASE_CHECKSUM]`, missing `[PRIVACY_GATE_OK]` |
| `registration` | `node tests/registration/fixture.mjs` (E-4): D-006 shape; install + enable of every bundle in an isolated `CLAUDE_CONFIG_DIR`; settings-only reconcile layer, report-only while rein-app re-rules D-013/D-014 | `[FIXTURE_SHAPE]`, `[FIXTURE_INSTALL]`, `[FIXTURE_ENABLED_BEFORE_INSTALL]`, `[FIXTURE_PLUGIN_MISSING]`, `[FIXTURE_PLUGIN_DISABLED]`, `[FIXTURE_SHAPE_DRIFT]`, `[FIXTURE_RECONCILE]` |
| `eval` | `claude plugin eval plugins/<name> --threshold 1.0`, one matrix leg per marketplace entry | `[EVAL_NO_CREDENTIAL]`, any case below 1.0 |

Pins: Claude Code `2.1.319` (npm), rein `v0.4.0` + tarball sha256, actions by commit SHA. Bump
a pin in its own commit; a rein bump recomputes `REIN_RELEASE_SHA256`.

## Security implications
- **Secret**: `ANTHROPIC_API_KEY` repository secret, read by the `eval` job only. Fork PRs do not
  receive it and fail with `[EVAL_NO_CREDENTIAL]` instead of skipping, because the eval is the
  installability proof the contract requires.
- **Network**: npm registry (Claude Code), codeload.github.com (rein tarball, checksum-pinned).
- **Permissions**: `contents: read` only. The eval runs `--trust-plugin` on this repo's own
  plugins; no `--scaffold`, `--allow-tools` or real MCP servers.
- The matrix plugin name reaches the shell via `env`, never `${{ }}` interpolation.

## Rollback
Revert the commit that changed `ci.yml`; nothing outside the repository depends on it.

## Local equivalent
`node scripts/check-marketplace.mjs .`, `claude plugin validate --strict .`, the scan via a local
rein checkout (`node <rein>/src/shared/publish-scan.mjs scan-tree .`), and
`claude plugin eval plugins/<name> --trust-plugin --no-publish --ablation none`.

## E-4 — registration job (2026-11-08)
- **Change**: new `registration` job running the fixture. It needs no rein release (D-012); it skips only on a missing `claude` CLI; without `ANTHROPIC_API_KEY` its reconcile start runs unauthenticated (report-only either way).
- **Security**: reuses the existing `ANTHROPIC_API_KEY` secret; the fixture writes only to fresh temp profiles (`CLAUDE_CONFIG_DIR`), never the runner's real profile. No new network beyond npm.
- **Rollback**: delete the job; the fixture file can stay.
