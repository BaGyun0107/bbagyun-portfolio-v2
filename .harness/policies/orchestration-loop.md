# Orchestration Loop Policy

The main agent is an orchestrator, not the long-running implementation context.

## Responsibilities

The orchestrator should:

- keep the user's goal and current phase clear.
- choose the smallest useful external tool route.
- keep durable multi-phase state in GSD's `.planning/` workspace.
- check existing `.planning/` with `gsd-progress` or `gsd-manager` before
  starting new Medium or larger work.
- collect changed files, commands, decisions, and residual risk.

The phase worker should:

- load only the relevant policy, skill, `.planning/` state, and code.
- execute one phase or one phase slice.
- return concise evidence and next-step guidance.

## Framework Placement

| Layer | Framework | Use |
| --- | --- | --- |
| Intent and decisions | GStack | `cso`, `office-hours`, `autoplan`, plan reviews, `review`, `qa`, `ship` |
| State and phase boundaries | GSD | `gsd-progress`, `gsd-manager`, project, milestone, discuss, plan, execute, verify, complete |
| Implementation | Superpowers | brainstorming, planning, TDD, systematic debugging, parallel agents, verification habits |

## Context Budget

Prefer phase isolation when work spans multiple files, multiple sessions, noisy
context, parallel attempts, or release-risk decisions. Skip phase isolation for
obvious low-risk edits.

## Handoff Contract

Every substantial phase handoff should include:

```text
Phase:
Status:
.planning state updated:
Files changed:
Commands run:
Decisions made:
Next phase recommendation:
Residual risk:
```

Do not use headless execution to bypass approval for destructive commands,
external service changes, secret writes, or production deploys.
