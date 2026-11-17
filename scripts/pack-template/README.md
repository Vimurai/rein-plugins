# Pack template

`run.mjs` is the canonical edit-hook runner (.ai/blueprints/language-packs.md §Components 2). Every
pack ships it byte-identical as `hooks/run.mjs`; `scripts/check-marketplace.mjs` fails with
`[PACK_RUNNER_DRIFT]` on any difference. Change it here, then run
`node scripts/new-pack.mjs --sync` to copy it into every pack and regenerate each `hooks/hooks.json`
from its `pack.json`.
