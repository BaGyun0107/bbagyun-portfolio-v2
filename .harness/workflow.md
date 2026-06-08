# Harness Workflow

The main agent acts as an orchestrator. The 1-5 phase model is an engineering
thinking flow, not a requirement to create local feature spec files. For
multi-phase work, use the external GSD commands and commit the `.planning/`
workspace they produce.

Users do not need to name GSD, GStack, or Superpowers in every prompt. Route to
the smallest useful tool set according to phase, task size, and risk.

| Framework | Owns |
| --- | --- |
| GStack | strategy, role review, security, QA, release decision gates |
| GSD | project structure, milestones, phase state, verification records, retroactive validation gaps, `.planning/` |
| Superpowers | implementation method, TDD, debugging, verification discipline |

## Work Size Routing

Size controls routing, not elapsed time or raw file count. Use the detailed
criteria in `.harness/policies/scenario-phase-routing.md` as the source of
truth.

| Size | Criteria | Default handling |
| --- | --- | --- |
| Small | Fixed direction, obvious target, localized edit, low blast radius, easy rollback, and direct verification | Handle directly |
| Medium | Any point where the agent must decide what to inspect, what to change, or how to verify it, even in one file | Use the matching phase and record the decision where the external tool expects it |
| Large | Medium plus multiple phases, ownership boundaries, role gates, handoff, user workflow/API impact, or cross-cutting changes | Use GSD phase commands and the relevant GStack gate |
| Extra large or risky | Production, deploy/rollback, CI/CD, infrastructure, database/data movement, auth, payments, permissions, security, secrets, privacy, destructive operations, or hard-to-reverse work | Use the full Triple Crown flow with checkpoints |

Raw file count, keyword matching, and user-provided size labels are not binding
signals. If a Small task reveals a decision point or higher risk, stop and
escalate.

## Triple Crown Phase Flow

Before new Medium or larger work, check existing `.planning/` with
`gsd-progress` or `gsd-manager`. Continue active, paused, or checkpointed GSD
work before opening unrelated work unless the user redirects.

| Phase | Intent |
| --- | --- |
| Phase 1: Strategy | GStack `cso` as the default non-trivial security gate; other decision gates and Superpowers brainstorming when needed |
| Phase 2: Project and plan | GSD codebase mapping, milestone setup, discussion, and phase planning |
| Phase 3: Execution | GSD phase execution plus Superpowers TDD, debugging, plan execution, or parallel-agent discipline |
| Phase 4: Review and verification | GSD code review and verification plus GStack review, QA, design/DX/performance gates as needed |
| Phase 5: Ship and completion | GStack `ship` release gate plus GSD milestone audit, summary, and completion; use GSD `gsd-ship` first only when PR prep should come from GSD state |

Do not run every framework by default. Use only the phases and gates that match
the current risk. The detailed routing source of truth is
`.harness/policies/scenario-phase-routing.md`.

## Codex Boundary

Claude Code can run prompt hooks on every user prompt. Codex cannot. `./harness
codex` runs preflight once at startup, then the Codex agent must apply this
workflow and `.harness/policies/scenario-phase-routing.md` directly.

## Team Mode

Single-agent execution remains the default:

```sh
./harness codex
./harness claude
```

Team Mode is an opt-in launcher for large work that benefits from visible,
role-separated terminals:

```sh
./harness team
./harness team claude
./harness team --agent codex
./harness team --agent claude
./harness team --dry-run
```

The launcher runs the shared preflight once, then prefers cmux on macOS and
falls back to tmux when cmux is unavailable. If neither tool exists, normal
single-agent launchers are unaffected.

Default roles are `orchestrator`, `planner`, `implementer`, `reviewer`, `qa`,
and `shell`. Each role gets `CODI_TEAM_ROLE` and `CODI_AGENT_ROLE` in its
environment. Use the panes for execution and monitoring, but do not treat pane
scrollback as source of truth. Phase handoffs, decisions, verification output,
and remaining risk stay in GSD `.planning/`, PR notes, or verification records.

When operating or changing Team Mode, load `team-mode-operator` alongside
`codi-phase-routing`. If official cmux skills are installed, prefer
`cmux-workspace`, `cmux-diagnostics`, and `cmux-markdown` for workspace-safe
automation and visible planning/verification notes.
