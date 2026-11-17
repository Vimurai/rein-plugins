# Evidence: an unauthenticated start does not register a github source (Q5 M1, D-016)

Claude Code 2.1.326, Linux, local run (no `ANTHROPIC_API_KEY`). Each profile is a fresh, isolated
`CLAUDE_CONFIG_DIR` whose `settings.json` holds only the D-006 registration shape plus
`enabledPlugins {"rein-seo@rein-plugins": true}`. One `claude -p hi --max-turns 1` start each
(it exits 1 with `Not logged in · Please run /login`), then `claude plugin marketplace list --json`.

| `source` in settings | marketplace list after the start | `plugins/known_marketplaces.json` |
|---|---|---|
| `{"source": "directory", "path": "<checkout>"}` | `[{"name": "rein-plugins", "source": "directory", …}]` | written |
| `{"source": "github", "repo": "Vimurai/rein-plugins", "ref": "stable"}` | `[]` | absent; `plugins/marketplaces/` empty |

`node tests/registration/q5-measurements.mjs` on the same machine:
```
[FIXTURE_Q5_M1] 2.1.326 source=github registered=false
[FIXTURE_SKIP_NO_CREDENTIAL] M2: ANTHROPIC_API_KEY is unset — install-by-start needs an authenticated start
[FIXTURE_Q5_M4] 2.1.326 source=github prior=NOT_RECONCILED exit=0 entry=CHANGED known-entries=1 settings-entries=1
```

Reading: the 2026-11-08 finding (an unauthenticated start registers the marketplace, 2.1.319) holds
for a directory source only. With the github source rein-app will ship, an unauthenticated start
registers nothing, so M1 cannot observe the ref or the clone HEAD and M4 has no reconciled profile
to test idempotence on (`NOT_RECONCILED`). Not established here: whether an authenticated start
registers the github source (needs the CI secret), and whether 2.1.319 behaved the same for github.
