# Agent Routing

Use the smallest role set that can make the decision and verify the work.
External tools own their native responsibilities; repo-local Codi skills only
adapt implementation to the detected stack.

Before routing app work, read `.harness/config/project-profile.yaml` and apply
`.harness/policies/project-profile.md`.

## External Tools

### Spec Kit

Use Spec Kit for durable per-feature planning state: committed
`specs/<NNN-feature>/` directories (spec.md, plan.md, tasks.md, and design
artifacts) plus `.specify/` runtime state. The command surface is installed
per runtime by `specify init` / `specify integration install`; the logical
names below map to each runtime's slash-command form.

Core commands:

- `speckit-constitution` once per project before the first feature
- `speckit-specify` — always request test tasks ("include test tasks (TDD)")
- `speckit-clarify`, `speckit-plan`, `speckit-tasks`, `speckit-analyze`
- `speckit-converge` for review and verification until "Converged"

Implementation is guided by unchecked tasks.md items under harness
discipline; the implement step never commits — atomic commits and quality/e2e
gates are harness rules. Cross-feature overview lives in a thin, manually
maintained root `ROADMAP.md`. Audit records live in `docs/audits/`
(harness-owned, active); a leftover legacy `.planning/` directory is
scheduled for removal per `docs/audits/2026-07-07-planning-retirement.md` —
never read or update it for routing.
For Medium+ app work, the specify-through-tasks planning stages happen before
implementation. Updating the spec directory only after code was written is a
handoff record, not evidence that the planning gate was used.

### Browser QA (Playwright MCP)

Ad-hoc browser QA runs through the Playwright MCP server (user-level
registration, both runtimes; see "Browser QA via Playwright MCP" in
`scenario-phase-routing.md` and the pin in `tool-permissions.md`).
Real-browser session cases use claude-in-chrome.

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

## Subagent Economy

Applies to both runtimes whenever subagents are authorized. Claude 5-generation
models delegate to subagents more readily than prior models, and each subagent
multiplies cost and time (context re-establishment, re-exploration, report
round-trip).

- Delegate only genuinely independent, sizeable parallel tracks (e.g. a wide
  multi-file investigation). Do not delegate work finishable in a handful of
  tool calls.
- Do not spawn subagents to verify or double-check your own work. These models
  self-verify; verification belongs in the main agent loop and in the
  harness verification gates.
- If one subagent can complete the task, use one rather than several. Keep
  spawn counts low.

## Phase and Size Defaults

Check for in-flight Spec Kit features (any `specs/<NNN-*>/tasks.md` with
unchecked items plus `.specify/` state) before new Medium or larger work. Map
the External Tools above onto the phase flow (P1 Strategy, P2 Specify and
plan, P3 Execution, P4 Review and verification, P5 Ship
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
Spec state updated:
Files changed:
Commands run:
Decisions made:
Next phase recommendation:
Residual risk:
```

## Team Skills

Use `codi-backend`, `codi-frontend`, `codi-db`, `codi-dev-workflow`,
`codi-dependency-review`, `codi-e2e`, `codi-rule-authoring`, `nestjs-expert`,
and `init-project` only for stack-specific context. They do not replace Spec
Kit or Superpowers.

## Codex Subagent Routing

For Codex, independent frontend, backend, workflow, review, or QA streams must
be routed explicitly before long inline execution. If repo or user instructions
explicitly authorize subagents and the runtime exposes subagent tools, spawn the
workstreams through the relevant Superpowers parallel-agent flow. If the
runtime policy requires a fresh user approval, ask before falling back inline.
When Codex falls back inline, state the reason and keep the workstream
boundaries visible in the plan, handoff, and verification record.

Listing Codi owner skills is not a subagent routing decision. For split
frontend/backend work, scaffold/import work, or any task with independent
frontend, backend, workflow, and review streams, Codex must write a
`Subagent decision:` block before implementation. The block must list the
workstreams, the authorization source for spawning or the reason approval is
needed, the selected action (`spawn`, `ask`, or `inline fallback`), and the
context boundary for each stream. If the selected action is `ask`, stop before
editing implementation files and ask for approval in the same literal
`Subagent decision:` block; do not replace the block with a prose question or
option list. If the selected action is `inline fallback`, state the runtime or
user-policy reason and keep separate task boundaries instead of collapsing the
work into one undifferentiated plan.
The `Subagent decision:` block is not the first routing step. For Medium+ split
app work, Codex must load `codi-phase-routing`, read the project profile, and
check for in-flight features (unchecked `specs/<NNN-*>/tasks.md` items) before
writing the block. Skimming spec files without adopting their unchecked tasks
does not satisfy this prerequisite.
Without explicit user authorization for subagents, split frontend/backend or
multi-workstream implementation must not silently choose inline execution; the
selected action must be `ask`. Inline fallback is only valid after the user
declines subagents or a concrete runtime/tool limitation prevents spawning.
If the selected action is `ask`, the response is a hard stop: do not create
implementation files, do not install dependencies, and do not convert the ask
into an inline plan in the same turn.

## Codex Stack-Skill Declaration

Before app implementation, Codex must state which Codi skills own the work:

- `init-project` for scaffold, import, initial harness adoption, and project
  bootstrap.
- `codi-backend` plus `nestjs-expert` for NestJS API/server work.
- `codi-frontend` for Next.js, React, UI, browser integration, and frontend
  verification.
- `codi-dev-workflow` for installs, dev servers, tests, CI, mise, and package
  manager workflow.

Reading a skill is not enough for handoff clarity; the active owner skills must
be visible before implementation begins.

## Codex Commit Guard

Codex must not run `git commit` merely because a downstream Spec Kit or
Superpowers step includes a commit instruction. Commit only when the current user
request explicitly asks for commit/ship or the user approves a repo workflow
step that commits. If a skill contains a commit step but the user said not to
commit, skip that step and mention the skip in the handoff.

## Native Mirrors

The removed local phase commands are mirrored as Codex command policy in
`.codex/rules/phase-routing.rules` and as Claude narrative policy in
`.claude/rules/phase-routing.md`.
