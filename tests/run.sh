#!/usr/bin/env bash
# Local CI entry point — what `rein ci run` executes in a clean worktree (it certifies a commit only
# when this file exists). Offline checks only: the marketplace/manifest check and every node unit
# test file under tests/. The hosted workflow (.github/workflows/ci.yml) stays the merge proof: the
# publish scan, `claude plugin eval` and the registration fixture need a rein release, the CLI,
# network or the secret, and do not run here.
set -euo pipefail
cd "$(dirname "$0")/.."

node scripts/check-marketplace.mjs

mapfile -t units < <(find tests -name '*.test.mjs' -type f | sort)
if [[ "${#units[@]}" -eq 0 ]]; then
  echo "[RUN_NO_UNITS] no tests/**/*.test.mjs found — nothing to run" >&2
  exit 1
fi
for f in "${units[@]}"; do [[ -f "$f" ]] || { echo "[RUN_MISSING] $f" >&2; exit 1; }; done
node --test "${units[@]}"
