---
name: team-mode-operator
description: Use when running or improving ./harness team with cmux or tmux, coordinating role panes, status/notification behavior, worktree isolation, and durable handoffs.
---

# Team Mode Operator

Use this skill when work is large enough for `./harness team`, when a user asks
about cmux/tmux agent workspaces, or when changing the team launcher.

## Operating Model

Normal single-agent launchers stay the default:

```sh
./harness codex
./harness claude
```

Team mode is opt-in:

```sh
./harness team codex
./harness team claude
./harness team --dry-run
```

The launcher is cmux-first on macOS and tmux fallback elsewhere. Missing
cmux/tmux is readiness information, not a harness failure.

## Role Layout

Default roles:

| Role | Responsibility |
| --- | --- |
| `orchestrator` | User-facing coordination, phase routing, handoff quality |
| `planner` | GSD `.planning/` state, assumptions, phase boundaries |
| `implementer` | TDD, implementation, systematic debugging |
| `reviewer` | Risk review, diff review, missing tests, regressions |
| `qa` | Validation commands, browser/app QA, verification evidence |
| `shell` | Dev server, watchers, logs, manual commands |

Each pane receives `CODI_TEAM_ROLE` and `CODI_AGENT_ROLE`. Use those variables
for pane titles, status hooks, logs, and role-aware prompts.

## Skill Routing

Use these skills with team mode:

| Situation | Skill |
| --- | --- |
| Choosing phase/tool flow | `codi-phase-routing` |
| Writing concise handoffs and prompts | `karpathy-style` |
| Mise, tests, dev servers, hooks, CI, tmux/cmux script changes | `codi-dev-workflow` |
| Frontend/browser-facing work | `codi-frontend` |
| Backend/server work | `codi-backend`, plus `nestjs-expert` when NestJS is detected |
| Database/schema/migration work | `codi-db` |
| Dependency/security update review | `codi-dependency-review` |

For cmux-specific agent automation, prefer the official cmux skills when they
are installed:

| cmux skill | Use |
| --- | --- |
| `cmux-workspace` | Add panes, send input, inspect current workspace without disrupting others |
| `cmux-diagnostics` | Debug cmux CLI/socket/hooks/session restore issues |
| `cmux-markdown` | Open `.planning` notes or verification records as live markdown panels |
| `cmux-browser` | Run browser checks inside a cmux browser surface |
| `cmux-customization` | Add project-local full-stack layouts, quick agent buttons, or Dock controls |

## Durable State

Pane scrollback is not source of truth. Record decisions, phase handoffs,
verification evidence, and unresolved risk in GSD `.planning/`, PR notes, or
verification records.

When panes need to coordinate, use a short handoff:

```text
Role:
Goal:
Files changed:
Commands run:
Verification:
Risks:
Next action:
```

## Isolation

For broad parallel implementation, prefer worktree isolation. A useful pattern:

| Workstream | Checkout |
| --- | --- |
| `orchestrator` and `planner` | main working tree |
| `implementer` | feature worktree |
| `reviewer` | clean review worktree or read-only diff |
| `qa` | same feature worktree after implementation stabilizes |
| `shell` | app runtime/log pane |

Never let multiple agent panes edit the same files in the same checkout unless
the orchestrator has explicitly serialized the work.

## cmux Practices

- Use cmux status/log/notification commands for team readiness and long-running
  checks.
- Use `cmux-workspace` for deterministic current-workspace targeting.
- Use `cmux-markdown` to keep `.planning` or validation records visible.
- Use `cmux-diagnostics` before assuming cmux socket, hooks, or restore behavior
  is broken.
- cmux restores layout and metadata, but it does not checkpoint arbitrary live
  process memory. Keep durable state outside the pane.

## tmux Practices

- Use explicit session names and pane titles.
- Keep pane border titles enabled for role visibility.
- Use tools such as `tmux-agent-status` when many Claude/Codex sessions run at
  once and attention state matters.
- Use `capture-pane` only for inspection; summarize durable outcomes into
  `.planning` or verification records.
