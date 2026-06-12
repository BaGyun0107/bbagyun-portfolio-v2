# Harness Workflow

The main agent acts as an orchestrator. The 1-5 phase model is an engineering
thinking flow, not a requirement to create local feature spec files. For
multi-phase work, use the external GSD commands and commit the `.planning/`
workspace they produce.

Users do not need to name GSD, GStack, or Superpowers in every prompt. Route to
the smallest useful tool set according to phase, task size, and risk.

## Work Size and Phase Routing

Framework ownership, the P1-P5 phase map, size criteria, scenario defaults, and
the phase handoff contract live in `.harness/policies/scenario-phase-routing.md`
and `.harness/policies/agent-routing.md`. Use those files as the source of truth.

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
