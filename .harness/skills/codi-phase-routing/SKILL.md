---
name: codi-phase-routing
description: Route harness work through the external Triple Crown tools instead of local wrapper skills or repo-local spec files.
---

# Codi Phase Routing

Use this skill when a request mentions phases, planning, execution, review,
verification, ship, GSD, GStack, or Superpowers in this harness.

## Principle

The 1-5 phase model is an engineering thinking flow. It is not a rule that every
agent must create a local feature-spec file tree. Durable multi-phase state now
belongs to external GSD and its `.planning/` workspace.

## Phase Map

Before opening new Medium or larger work, inspect existing `.planning/` with
GSD progress/manager workflows. Continue active, paused, or checkpointed work
before starting unrelated work unless the user explicitly redirects.

| Phase | Tool flow |
| --- | --- |
| Phase 1: Strategy | GStack decision gates: `cso` as the default non-trivial security gate, optional `office-hours`, `autoplan`, and plan review skills as needed; Superpowers `brainstorming` for creative or ambiguous work |
| Phase 2: Project and plan | GSD: `gsd-map-codebase`, `gsd-new-project`, `gsd-new-milestone`, `gsd-discuss-phase`, `gsd-plan-phase`; Superpowers `writing-plans` only when a separate implementation plan is useful |
| Phase 3: Execution | GSD: `gsd-execute-phase`, `gsd-progress --next`, `gsd-resume-work`; Superpowers: `test-driven-development`, `systematic-debugging`, `executing-plans`, and parallel-agent skills as needed |
| Phase 4: Review and verification | GSD: `gsd-code-review`, `gsd-verify-work`, and `gsd-validate-phase` only for retroactive validation gaps; GStack: `review`, `qa`, `qa-only`, plus design/DX/perf gates as needed; Superpowers review and verification skills |
| Phase 5: Ship and completion | GStack: `ship` as the release gate; GSD: `gsd-ship` only when PR prep should come from GSD phase state, then `gsd-audit-milestone`, `gsd-complete-milestone`, `gsd-milestone-summary`; Superpowers `finishing-a-development-branch` |

## Routing Rules

- Use the smallest phase/tool set that controls the actual risk.
- Treat size as a routing decision, not a time estimate or file-count estimate.
- Small requires fixed direction, an obvious target, localized edits, easy
  rollback, low blast radius, and direct verification.
- Medium begins when the agent must decide what to inspect, change, or verify.
- Large adds multiple ownership boundaries, phases, role gates, handoff, or
  user/API impact.
- Extra large or risky covers production, deploy/rollback, CI/CD,
  infrastructure, database/data movement, auth, permissions, payments, security,
  secrets, privacy, destructive operations, or hard-to-reverse work.
- Do not call every framework by default.
- Use GStack for strategy, architecture, security, QA, and release gates.
- Use GSD for milestones, phase plans, execution state, validation, and `.planning/`.
- Use Superpowers for implementation discipline, debugging, TDD, and verification habits.
- Use repo-local Codi skills only for stack-specific implementation context after
  the phase route is chosen.
- AI may create PRs, but must not merge PRs.
- Detailed routing lives in `.harness/policies/scenario-phase-routing.md`; this
  skill is a compact reminder only.

## Shared Codi Skill Routing

Before app work, read `.harness/config/project-profile.yaml` and apply
`.harness/policies/project-profile.md`. The detailed routing source of truth is
`.harness/policies/agent-routing.md`; this section is only a compact reminder so
the shared skills are not skipped.

Use only the relevant Codi skills:

| Skill | Use when |
| --- | --- |
| `karpathy-style` | Prompt shape, concise problem framing, assumptions, phase prompt text, and handoff clarity matter. |
| `codi-frontend` | React, Next.js, UI, state, styling, accessibility, frontend integration, or browser-facing verification is involved. In `next-fullstack`, route Next.js backend behavior under `apps/front` here. |
| `codi-backend` | Express, NestJS, API/server behavior, auth, queues, or backend infrastructure is involved. Do not use it for `next-fullstack` or `frontend-only` profiles. |
| `nestjs-expert` | NestJS is detected; use alongside `codi-backend` unless the project profile routes the work to full-stack Next.js. |
| `codi-db` | Schema, migrations, queries, indexing, transactions, vector search, or RAG retrieval is involved. |
| `codi-dev-workflow` | Mise tasks, package manager policy, install/build/test/lint workflow, hooks, CI/CD, or dev-server behavior is involved. |
| `codi-dependency-review` | npm audit, OSV, Renovate, dependency update PRs, lockfile-only changes, or vulnerability triage is involved. |
| `init-project` | New project scaffolding, importing an existing app, GitHub Actions setup, Infisical bootstrap, or initial harness adoption is involved. |
| `skill-creator` | Creating, modifying, evaluating, or benchmarking skills is involved. |
| `team-mode-operator` | `./harness team`, cmux/tmux role panes, status/notification behavior, worktree isolation, or multi-agent handoff rules are involved. |

Imported rules map to those skills:

- `.harness/imported-rules/frontend.md` -> `codi-frontend`.
- `.harness/imported-rules/backend.md` -> `codi-backend`, plus `nestjs-expert` for NestJS.
- `.harness/imported-rules/database.md` -> `codi-db`.
- `.harness/imported-rules/dev-workflow.md` -> `codi-dev-workflow`.
- `.harness/imported-rules/design.md` complements frontend and GStack design review.
- `.harness/imported-rules/i18n-guide.md` affects response and user-facing localization; use it as implementation routing only when localization or i18n work is requested.

## Codex Notes

Codex has no UserPromptSubmit hook. Apply this routing table directly during
each turn after `./harness codex` preflight prints the reminder.

## Team Mode

Use `./harness team` only for large or risky work where visible role-separated
terminals help: strategy/planning in one pane, implementation in another,
review/QA in separate panes, and a shell pane for servers, watchers, or logs.
Load `team-mode-operator` with this skill when team mode is part of the task.

Team Mode is opt-in and does not replace normal launchers:

```sh
./harness codex
./harness claude
./harness team
./harness team claude
./harness team --agent codex
./harness team --agent claude
./harness team --dry-run
```

The launcher is cmux-first on macOS and tmux fallback elsewhere. Missing
cmux/tmux is not a harness failure. Durable phase handoffs and verification
records still belong in GSD `.planning/`, not pane scrollback.

## Exemptions

Small, obvious edits can be handled directly. If a small task exposes a decision
point or higher risk, escalate to the matching phase and explain why.
