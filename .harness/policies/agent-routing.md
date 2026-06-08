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

## Phase Defaults

Use `.harness/policies/scenario-phase-routing.md` as the detailed source of
truth. In short:

- Check existing `.planning/` with `gsd-progress` or `gsd-manager` before new
  Medium or larger work.
- P1 Strategy: GStack `cso` as the default security gate for non-trivial work,
  with other decision gates and Superpowers brainstorming when needed.
- P2 Project and plan: GSD mapping, milestone, discussion, and phase planning.
- P3 Execution: GSD execution plus Superpowers TDD/debugging/plan execution.
- P4 Review and verification: GSD review/verification plus GStack review and QA;
  use `gsd-validate-phase` only for retroactive validation gaps.
- P5 Ship and completion: GStack `ship` is the release-readiness gate; use GSD
  `gsd-ship` first only when PR prep should come from GSD phase state.

## Size Defaults

| Size | Route |
| --- | --- |
| Small | Direct handling |
| Medium | Matching phase with the smallest useful external tool set |
| Large | GSD phases plus needed GStack gates plus Superpowers execution |
| Extra large or risky | Full Triple Crown flow |

Small requires fixed direction, an obvious target, localized edits, low blast
radius, easy rollback, and direct verification. Medium begins as soon as the
agent must decide what to inspect, what to change, or how to verify it. Large
adds multiple ownership boundaries, phases, role gates, handoff, or user/API
impact. Extra large or risky covers production, deploy/rollback, CI/CD,
infrastructure, database/data movement, auth, permissions, payments, security,
secrets, privacy, destructive operations, or hard-to-reverse work.

Raw file count, keyword matching, and user-provided size labels are not binding
signals. Escalate immediately when new information raises risk. Use
`.harness/policies/scenario-phase-routing.md` for the full decision rules.

## Team Skills

Use `codi-backend`, `codi-frontend`, `codi-db`, `codi-dev-workflow`,
`codi-dependency-review`, `nestjs-expert`, and `init-project` only for
stack-specific context. They do not replace GSD, GStack, or Superpowers.

## Native Mirrors

The removed local phase commands are mirrored as Codex command policy in
`.codex/rules/phase-routing.rules` and as Claude narrative policy in
`.claude/rules/phase-routing.md`.
