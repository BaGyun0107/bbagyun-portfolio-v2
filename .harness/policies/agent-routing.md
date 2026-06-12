# Agent Routing

Use the smallest role set that can make the decision and verify the work.
External tools own their native responsibilities; repo-local Codi skills only
adapt implementation to the detected stack.

Before routing app work, read `.harness/config/project-profile.yaml` and apply
`.harness/policies/project-profile.md`.

## External Tools

### GSD

Use external GSD runtime skills for project structure, milestones, phase plans,
phase execution, validation, verification, and `.planning/` continuity. Claude
Code exposes them as slash commands such as `/gsd-plan-phase`; Codex exposes the
same skills as dollar commands such as `$gsd-plan-phase`.

Common skill names (non-exhaustive):

- `gsd-progress`, `gsd-manager`
- `gsd-map-codebase`, `gsd-new-project`, `gsd-new-milestone`
- `gsd-discuss-phase`, `gsd-plan-phase`, `gsd-execute-phase`
- `gsd-code-review`, `gsd-verify-work`
- `gsd-validate-phase` for retroactive validation coverage gaps
- `gsd-ship` when PR prep should come from GSD phase state
- `gsd-audit-milestone`, `gsd-complete-milestone`,
  `gsd-milestone-summary`

Use `gsd-validate-phase` for retroactive validation coverage gaps, not as the
normal execution flag. `gsd-execute-phase` has no implied validation flag.

### GStack

Use GStack for role-based decision gates:

- `cso` for security posture.
- `office-hours`, `plan-ceo-review`, `plan-eng-review`,
  `plan-design-review`, and `plan-devex-review` for planning pressure.
- `autoplan` for multi-role strategy synthesis.
- `review`, `qa`, `qa-only`, `design-review`, `devex-review`, and `benchmark`
  for validation and release confidence.
- `ship` for the ship workflow. AI may create PRs but must not merge them.
- `land-and-deploy` only after explicit user approval for merge/deploy actions.

### Superpowers

Use Superpowers for execution discipline:

- `brainstorming`
- `writing-plans` when a separate implementation plan is useful
- `test-driven-development`
- `systematic-debugging`
- `executing-plans`
- `dispatching-parallel-agents`
- `subagent-driven-development`
- `requesting-code-review`
- `receiving-code-review`
- `verification-before-completion`
- `finishing-a-development-branch`

TDD can be exempted for documentation-only, comments-only, mechanical
formatting, or pure configuration scaffold work.

## Phase and Size Defaults

Check existing `.planning/` with `gsd-progress` or `gsd-manager` before new
Medium or larger work. Map the External Tools above onto the phase flow (P1
Strategy, P2 Project and plan, P3 Execution, P4 Review and verification, P5 Ship
and completion) and onto the size flow (Small, Medium, Large, Extra large or
risky), using the smallest useful set for the actual risk.

The full P1-P5 phase map, scenario defaults, size criteria, and decision rules
live only in `.harness/policies/scenario-phase-routing.md`. Use it as the
source of truth. Raw file count, keyword matching, and user-provided size
labels are not binding signals; escalate immediately when new information
raises risk.

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

## Team Skills

Use `codi-backend`, `codi-frontend`, `codi-db`, `codi-dev-workflow`,
`codi-dependency-review`, `nestjs-expert`, and `init-project` only for
stack-specific context. They do not replace GSD, GStack, or Superpowers.

## Native Mirrors

The removed local phase commands are mirrored as Codex command policy in
`.codex/rules/phase-routing.rules` and as Claude narrative policy in
`.claude/rules/phase-routing.md`.
