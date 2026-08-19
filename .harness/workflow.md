# Harness Workflow

The main agent acts as an orchestrator. The 1-5 phase model is an engineering
thinking flow, not a local feature-spec file convention. For multi-phase work,
use the Spec Kit flow — Superpowers `brainstorming` output feeds
`speckit-specify` (always request test tasks: "include test tasks (TDD)"),
then `speckit-clarify` -> `speckit-plan` -> `speckit-tasks` ->
`speckit-analyze`, implement guided by unchecked tasks.md items under harness
discipline, and close with `speckit-converge` — and commit the
`specs/<NNN-feature>/` directories it produces. Session continuity resumes
from unchecked `specs/*/tasks.md` items plus `.specify/` state; cross-feature
overview lives in the thin, manually maintained root `ROADMAP.md`.

After clarify, the user may opt into the automated loop (`codi-auto-loop`
skill), which runs plan through converge with a single mandatory pause at the
tasks.md review gate.

Users do not need to name Spec Kit or Superpowers in every prompt. Route to
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

Do not treat session scrollback as source of truth. Phase handoffs, decisions,
verification output, and remaining risk stay in the feature's
`specs/<NNN-feature>/` directory (e.g. verification.md), PR notes, or
verification records. Load `codi-phase-routing` for phase routing.
