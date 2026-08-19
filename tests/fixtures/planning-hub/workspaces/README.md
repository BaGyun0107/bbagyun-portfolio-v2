# Planning Hub workspace fixtures

The fixture contract mirrors the repository-neutral ownership boundary:

- `planning/` contains top-down needs, screens, definitions, flows, relations and decisions.
- `downstream/` contains the pinned Planning Lock plus delivery and verification evidence.
- `expected/` contains generated health/model snapshots only.

Tests may copy this structure into an isolated temporary root. A builder or check must never
rewrite `planning/` or human-owned downstream evidence. Only an explicit pull may atomically
replace the Planning Lock.
