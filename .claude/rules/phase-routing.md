# Phase Routing

Use external Triple Crown tools for phase work.

Before new Medium or larger work, inspect existing `.planning/` with GSD
progress/manager workflows and continue active or paused work first.

Phase summary:

- P1 Strategy: GStack `cso` as the default non-trivial security gate, plus other decision gates and Superpowers brainstorming when needed.
- P2 Project and plan: GSD map, milestone, discuss, and plan.
- P3 Execution: GSD execute plus Superpowers TDD/debugging/plan execution.
- P4 Review and verification: GSD review/verify plus GStack review and QA.
- P5 Ship and completion: GStack `ship` release gate plus GSD audit, summary, and complete; use GSD `gsd-ship` first only when PR prep should come from GSD state.

Size summary: Small requires fixed direction, an obvious target, localized
edits, easy rollback, low blast radius, and direct verification. Medium starts
when the agent must decide what to inspect, change, or verify. Large adds
multiple boundaries, role gates, handoff, or user/API impact. Extra large or
risky covers production, deploy/rollback, CI/CD, infrastructure, data,
auth/permissions/payments, security, secrets, privacy, destructive operations,
or hard-to-reverse work.

Detailed routing lives in `.harness/policies/scenario-phase-routing.md`.

Do not use the removed local `./harness spec`, `./harness phase-prompt`, or
`./harness board` commands for new work. Keep durable phase state in GSD's
`.planning/` output.
