# Scenario Phase Routing

Use this policy when a request describes a work scenario rather than one small
edit. This is the canonical harness map for external GSD, GStack, and
Superpowers routing. Other entrypoints should summarize or link here instead of
duplicating the full table.

## Core Rules

- The 1-5 phase model is a development thinking flow, not a local feature-spec
  file convention.
- Use the smallest useful role set for the actual risk. Do not run GSD, GStack,
  and Superpowers together by default.
- For durable multi-phase state, use GSD and commit its `.planning/` output.
- GSD command syntax is runtime-specific: Claude Code uses `/gsd-*`; Codex uses
  `$gsd-*`. Bare `gsd-*` names below are logical skill names.

## Session Continuity

Before starting new Medium or larger work, check for existing GSD state:

- If `.planning/.continue-here.md` exists, resolve that checkpoint before new
  work.
- If `.planning/STATE.md` or `.planning/ROADMAP.md` exists, inspect
  `gsd-progress` or `gsd-manager` before creating a new phase.
- If `gsd-progress --next` identifies an in-progress or paused phase, resume it
  before starting unrelated work unless the user explicitly redirects.

This keeps Claude Code, Codex, and different local machines aligned around the
same durable state instead of chat history.

## Phase Map

| Phase | Default route | Conditional skills |
| --- | --- | --- |
| P1 Strategy | GStack `cso` as the default security gate for non-trivial work, optional `office-hours`, `autoplan` | GStack `plan-ceo-review`, `plan-eng-review`, `plan-design-review`, `plan-devex-review`; Superpowers `brainstorming` for creative/product/architecture changes |
| P2 Project and plan | GSD `gsd-map-codebase` for brownfield work, `gsd-new-project`, `gsd-new-milestone`, `gsd-discuss-phase`, `gsd-plan-phase` | GStack `design-consultation`, `design-shotgun`, `design-html`; Superpowers `writing-plans` only when a separate implementation plan is useful, `using-git-worktrees` |
| P3 Execution | GSD `gsd-execute-phase`; Superpowers `test-driven-development`, `systematic-debugging`, `executing-plans` | GSD `gsd-progress --next`, `gsd-resume-work`, `gsd-pause-work --report`; Superpowers `dispatching-parallel-agents`, `subagent-driven-development`; GStack `investigate`, `guard`, `freeze`, `browse` |
| P4 Review and verification | GSD `gsd-code-review`, `gsd-verify-work`; GStack `review`, `qa` or `qa-only`; Superpowers `requesting-code-review`, `receiving-code-review`, `verification-before-completion` | GSD `gsd-validate-phase` for retroactive validation coverage gaps; GStack `design-review`, `devex-review`, `benchmark` |
| P5 Ship and completion | GStack `ship` as the release-readiness and PR gate; GSD `gsd-audit-milestone`, `gsd-complete-milestone`, `gsd-milestone-summary`; Superpowers `finishing-a-development-branch` | Use GSD `gsd-ship` before GStack `ship` only when PR preparation must be generated from GSD phase state; GStack `document-release`, `canary`, `retro`; `land-and-deploy` only with explicit user merge/deploy approval |

## Scenario Defaults

| Scenario | Default route |
| --- | --- |
| Existing `.planning/` state | Run `gsd-progress` or `gsd-manager`; continue active or paused work first |
| New project | P1 when strategy is unclear, then P2 and the first execution phase |
| Brownfield large feature | P2 starts with `gsd-map-codebase`; add GStack plan review only for open product, architecture, UX, DX, security, or release gates |
| Plan a phase | `gsd-discuss-phase` if context is missing, then `gsd-plan-phase` |
| Execute a phase | `gsd-execute-phase` plus Superpowers TDD unless docs-only, config-only, or explicitly exempt |
| Bug fix | Superpowers `systematic-debugging`; add GSD if the fix spans phases, sessions, or release risk |
| Review or verification request | GStack `review` or `qa`; add `gsd-verify-work` when GSD state exists |
| Ship preparation | `review` -> `qa` -> `ship`; AI may create PRs but must not merge |

## Size Routing

The main orchestrator owns the size decision. User-provided size is useful
intent, but repository context, risk, and reversibility decide the route.
Size is a routing decision, not an estimate of elapsed time or file count.

| Size | Criteria | Default route |
| --- | --- | --- |
| Small | Direction is fixed, local, reversible, and mechanical. The user names the exact target or the target is obvious, no product/API/security/data decision is needed, and verification is direct. Examples: typo, literal value change, obvious docs edit, simple rename with clear scope. | Direct handling |
| Medium | The work has one coherent outcome, but the agent must decide what to inspect, what to change, or how to verify it. This can still be one file. Examples: small bug fix, policy/doc change with consistency updates, local behavior change, config change with tradeoffs. | Phase-specific routing with the smallest useful external tool set |
| Large | Medium plus multiple phases, multiple subsystems, broad cross-file impact, user-visible workflow change, API/contract change, role review, handoff, or likely session continuity needs. | GSD phase commands plus the needed GStack gates |
| Extra large or risky | Large plus high-impact or hard-to-reverse risk: production, deploy/rollback, CI/CD, infrastructure, database schema or data movement, auth, permissions, payments, security, secrets, privacy/compliance, destructive operations, generated mass rewrites, or breaking public contracts. | Full phase flow with explicit checkpoints |

### Size Decision Rules

- Small requires all of these: fixed direction, obvious target, localized edit,
  low blast radius, easy rollback, and direct verification.
- Any open design choice, uncertain root cause, unclear target, behavioral
  change, or need to inspect before deciding makes the work at least Medium.
- Use Large when the work needs a durable plan, spans more than one ownership
  boundary, affects user workflows or contracts, or would benefit from role
  review before implementation.
- Use Extra large or risky when failure can damage production, data, security,
  money movement, access control, deployment safety, or trust.
- Escalate immediately if new information raises risk. De-escalate only when
  evidence shows the work is localized, reversible, and directly verifiable.
- When tied, choose the smaller route only if the change is reversible, local,
  and directly verifiable. Otherwise choose Medium or Large.

Non-signals: keyword matching, raw file count, and user-provided size labels.
A one-line auth change can be risky; a many-file mechanical formatting change
can be Small if it is generated, reversible, and directly verifiable. If a
Small task exposes a decision point, stop, declare Medium, and route
accordingly.

## Automation Boundary

- Claude Code: `.claude/settings.json` runs the skill injector hook on every
  prompt and can suggest skills.
- Codex: `./harness codex` runs `.harness/scripts/agent/agent-preflight.sh` once
  at startup. Codex must apply this policy directly on later turns.
