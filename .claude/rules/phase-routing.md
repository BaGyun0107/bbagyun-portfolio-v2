# Phase Routing

Use external Triple Crown tools for phase work.

Before new Medium or larger work, inspect existing `.planning/` with GSD
progress/manager workflows and continue active or paused work first.

Phases run P1 Strategy, P2 Project and plan, P3 Execution, P4 Review and
verification, and P5 Ship and completion, each routed to the smallest useful
GSD, GStack, and Superpowers set. Size runs Small, Medium, Large, and Extra
large or risky, where size is a routing decision, not a time or file-count
estimate.

The full phase map, scenario defaults, and size criteria live only in
`.harness/policies/scenario-phase-routing.md`. Use it as the source of truth.

Do not use the removed local `./harness spec`, `./harness phase-prompt`, or
`./harness board` commands for new work. Keep durable phase state in GSD's
`.planning/` output.
