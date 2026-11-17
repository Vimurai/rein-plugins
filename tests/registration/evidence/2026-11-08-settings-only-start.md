# Evidence: settings-only start registers the marketplace (D-015, Q5)

Claude Code 2.1.319, Linux. Each profile is a fresh, isolated `CLAUDE_CONFIG_DIR` whose
`settings.json` holds only the D-006 registration shape, with `source` set to
`{"source": "directory", "path": "<checkout>"}` and `enabledPlugins {"rein-seo@rein-plugins": true}`.
Filesystem paths are redacted to `<checkout>` / `<profile>`.

## 1. Unauthenticated start registers the marketplace (reproduced twice)
Manual run:
```
$ claude plugin marketplace list --json                  # before any start
[]
$ claude -p hi --max-turns 1
Not logged in · Please run /login
$ claude plugin marketplace list --json                  # after
[ { "name": "rein-plugins", "source": "directory", "path": "<checkout>" } ]
$ cat <profile>/plugins/installed_plugins.json
{"version":2,"plugins":{}}
```
Fixture run (`node tests/registration/fixture.mjs`, no `ANTHROPIC_API_KEY`):
```
[FIXTURE_Q4_OBSERVED] before any start: marketplace registered=false
[FIXTURE_SKIP_NO_CREDENTIAL] ANTHROPIC_API_KEY is unset — the start ran unauthenticated; install state below shows no-auth behaviour only
[FIXTURE_Q4_OBSERVED] after one unauthenticated start: marketplace registered=true
[FIXTURE_Q4_OBSERVED] rein-seo@rein-plugins from settings alone: not-installed; loaded-at-init=true
```

## 2. Authenticated start installed the enabled bundle (one sample, not reproduced)
This ran in the E-4 reviewer's probe, whose environment had inherited a credential. The start
ran without `CLAUDE_CODE_SYNC_PLUGIN_INSTALL`. The resulting `<profile>/plugins/installed_plugins.json`
entry, with the install path removed:
```json
{ "version": 2, "plugins": { "rein-seo@rein-plugins": [ {
  "scope": "user", "version": "0.1.0",
  "installedAt": "2026-11-08T19:35:57.790Z", "lastUpdated": "2026-11-08T19:35:57.790Z",
  "gitCommitSha": "02987aa2cf808c7948b2fb2a91daad3e24c0d008" } ] } }
```
Not reproduced on purpose: only the CI run with the operator's secret repeats it (D-015). Only
the `directory` source was tested, not the GitHub source.
