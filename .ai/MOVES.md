# MOVES — cross-repo move ledger (Architect-owned, see architect.md §3.6)

One row per unit moved out of `rein`. A unit is MOVED only when both E-## columns are DONE.
The Engineer appends rows in the E-## that copies the unit; the Architect flips `removed_by`
when `rein` reports its removing task DONE.

| Unit | Kind | From (rein path) | To (plugin) | Added by (here) | Removed by (rein) | Status |
|---|---|---|---|---|---|---|
| _(none yet — first rows land with E-3, group 1)_ | | | | | | |

Status values: `pending-copy` · `copied` (our E-## DONE, rein's pending) · `moved` · `withdrawn`.
