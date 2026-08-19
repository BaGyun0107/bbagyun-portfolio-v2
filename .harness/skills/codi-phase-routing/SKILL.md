---
name: codi-phase-routing
description: Route harness work through the external Spec Kit and Superpowers tools instead of local wrapper skills or ad-hoc plan files.
---

# Codi Phase Routing

Use this skill when a request mentions phases, planning, execution, review,
verification, ship, Spec Kit, or Superpowers in this harness.

## Principle

The 1-5 phase model is an engineering thinking flow, not a prescription to run
every tool in every stage. Durable per-feature state belongs to Spec Kit: a
committed `specs/<NNN-feature>/` directory (spec.md, plan.md, tasks.md, and
design artifacts) plus `.specify/` runtime state. Cross-feature overview lives
in a thin, manually maintained root `ROADMAP.md` (feature, status, `specs/NNN`
link per row). Audit records live in `docs/audits/` (harness-owned, active);
a leftover legacy `.planning/` directory is scheduled for removal per
`docs/audits/2026-07-07-planning-retirement.md` — never read or update it
for routing.

## The Spec Kit Flow

Before opening new Medium or larger work, check for in-flight features: any
`specs/<NNN-*>/tasks.md` with unchecked items gets resumed first (unchecked
tasks plus `.specify/` state are the checkpoint) unless the user explicitly
redirects. Resume from the feature's spec.md summary, plan.md, and the
unchecked tasks — do not re-derive intent from chat history.

The feature pipeline is `speckit-specify` -> `speckit-clarify` ->
`speckit-plan` -> `speckit-tasks` -> `speckit-analyze` -> implementation
guided by unchecked tasks.md items -> `speckit-converge` until it reports
"Converged". Superpowers `brainstorming` output is exploration input for
`speckit-specify`, never the plan of record.

- Always request test tasks explicitly ("include test tasks (TDD)") in
  specify/tasks invocations — Spec Kit generates test tasks only on request.
- Steps may be chained in one instruction, but two human gates are never
  skipped: answering clarify questions and reviewing tasks.md before
  implementation starts.
- The implement step never commits; atomic commits and quality/e2e gates are
  harness rules.
- Opt-in automation: after clarify, the `codi-auto-loop` skill runs plan ->
  tasks -> analyze, pauses at the mandatory tasks.md review gate, then loops
  implement -> verify -> review -> converge. Both human gates still apply.

The full P1-P5 stage map and the Small/Medium/Large/Extra-large size criteria
live only in `.harness/policies/scenario-phase-routing.md`. Use it as the
source of truth.

## Size Self-Check

Run this before any implementation. Stop at the first YES and route there.

- **Small** — fixed direction, obvious target, localized, reversible, directly
  verifiable? **Handle directly. No Size declaration, no routing ceremony.**
  This is the default for typos, literal value changes, obvious edits.
- **Medium** — must you decide what to inspect, what to change, or how to verify
  it (even within one file)? **Declare `Size: Medium` with a one-line reason,
  then route to the smallest useful tool set.** Direct execution is allowed only
  for localized, single-stream work that does not need durable state. App
  scaffolds, split frontend/backend work, scaffold/import work, multi-stage
  implementation, and session-continuity work are Large/spec cases, not Medium
  direct cases.
- **Large** — multiple subsystems, broad cross-file impact, an API/contract
  change, a user-visible workflow change, role review, handoff, or session
  continuity? **Declare `Size: Large` and route through the Spec Kit planning
  stages (specify -> clarify -> plan -> tasks -> analyze) before
  implementing.**
- **Extra large or risky** — production, deploy, CI/CD, infra, DB schema/data,
  auth, permissions, payments, secrets, privacy, or destructive/irreversible
  work? **Full phase flow with explicit checkpoints.**

When tied, choose the larger size unless the change is reversible **and** local
**and** directly verifiable. A task that looked Small but exposes a decision
point becomes at least Medium — re-declare and route. This is a routing aid;
the full criteria stay in `.harness/policies/scenario-phase-routing.md`.

## Routing Rules

- Use the smallest phase/tool set that controls the actual risk.
- Treat size as a routing decision, not a time estimate or file-count estimate.
- Do not call every framework by default.
- Ad-hoc browser QA runs through Playwright MCP (user-level registration,
  both runtimes; see "Browser QA via Playwright MCP" in
  `.harness/policies/scenario-phase-routing.md`).
- Use Spec Kit for feature specs, plans, task state, and convergence checks;
  commit its `specs/<NNN-feature>/` output as the plan of record.
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
| `codi-planning-retirement` | A legacy `.planning/` directory from the previous planning engine needs to be retired (distill -> move audits -> thin ROADMAP -> delete). One-time per project. |
| `codi-auto-loop` | The user explicitly opts into the supervised plan->tasks->implement->review loop after clarify (see "Opt-in automation" above). |
| `codi-design-system` | Design tokens, component library structure, or design-system adoption work is involved. |
| `codi-e2e` | E2E gate setup, per-app suite scaffolding, `mise run e2e` troubleshooting, or evidence stamping is involved. |
| `codi-feature-hub` | Planning hub pages, feature catalog data (`data/**`), sitemap/traceability scans, or hub build issues are involved. |
| `codi-feature-definition-authoring` | Writing or revising normalized feature definitions is involved. |
| `codi-feature-definition-normalizer` | Converting raw feature notes into the normalized definition schema is involved. |
| `codi-rule-authoring` | Harness rule/policy authoring or Codex/Claude parity audits are involved. |

Imported rules map to those skills:

- `.harness/imported-rules/frontend.md` -> `codi-frontend`.
- `.harness/imported-rules/backend.md` -> `codi-backend`, plus `nestjs-expert` for NestJS.
- `.harness/imported-rules/database.md` -> `codi-db`.
- `.harness/imported-rules/dev-workflow.md` -> `codi-dev-workflow`.
- `.harness/imported-rules/design.md` complements frontend design work.
- `.harness/imported-rules/i18n-guide.md` affects response and user-facing localization; use it as implementation routing only when localization or i18n work is requested.

## Codex Notes

Codex has no UserPromptSubmit hook. Apply this routing table directly during
each turn after `./harness codex` preflight prints the reminder.

## Codex Medium+ Checklist

For Medium or larger work, Codex must make the routing gate explicit before
implementation:

- `spec?` Check for in-flight features first: any `specs/<NNN-*>/tasks.md`
  with unchecked items must be resumed or explicitly deferred by the user
  before new Medium+ work opens. If no matching feature exists and the task is
  Medium+ app work, split frontend/backend work, scaffold/import work, or
  multi-stage implementation, run `speckit-specify` (and the rest of the
  planning stages) before implementation; do not treat absence of `specs/` as
  permission to skip the spec flow. Skimming spec files without adopting their
  unchecked tasks is not a substitute for resuming the feature. After declaring
  `Size: Large` or larger, do not downshift the same task to a "small scaffold"
  or "mock-data-only" exemption to skip the spec flow; split frontend/backend
  scaffolds are not single-stream work. The `specs/<NNN-feature>/` directory is
  a shared team asset committed via git; `.specify/` holds the runtime state.
- `Size marker?` When you declare Medium or larger, record the Size marker so the
  Claude-side warning hook can see the declaration:
  `printf 'Medium\n' > .harness/state/current-size` (or `Large` / `Extra-large`),
  and reset to `Small` when the Medium+ work is done. `.harness/state/` is
  git-ignored, so the marker is per-session and local-only. Codex has no
  PreToolUse hook, so on Codex this marker plus the declaration are the control;
  there is no automated warning. Only Claude's `guardrails.mjs` reads the marker
  to emit a non-blocking "did you route through `specs/`?" warning.
- `test tasks?` Every specify/tasks invocation must explicitly request test
  tasks ("include test tasks (TDD)") — Spec Kit generates test tasks only on
  request. For Medium+ app work, writing a spec directory only after
  implementation is a handoff record, not the planning gate; the spec flow
  runs before code.
- `subagents?` If independent workstreams exist, spawn subagents only when
  repo/user instructions explicitly allow it and runtime policy permits it; if
  approval is needed, ask before falling back inline. Listing owner skills is
  not enough. For split frontend/backend, scaffold/import, or multi-workstream
  app work, write a `Subagent decision:` block before implementation with:
  workstreams, authorization source, selected action (`spawn`, `ask`, or
  `inline fallback`), and context boundary for each stream. If the action is
  `ask`, ask for approval in that same literal block and stop before editing
  implementation files; do not replace the block with a prose question or
  option list. Without explicit subagent authorization, choose `ask` and stop;
  do not silently run split front/back implementation inline. `ask` is a hard
  stop: do not create implementation files, install dependencies, or continue
  with an inline plan in the same turn.
- `Codi skills?` Declare stack owners before app implementation:
  `init-project` for scaffold/import, `codi-backend` plus `nestjs-expert` for
  NestJS, `codi-frontend` for Next/UI, and `codi-dev-workflow` for installs,
  dev servers, tests, and mise workflow.
- `commit permission?` Do not commit just because a downstream skill says to
  commit. If the user says not to commit, skip that step and mention the skip.

Superpowers `docs/superpowers/*` is not durable feature state. Use Superpowers
for brainstorming, TDD, debugging, and verification discipline; keep Medium+
durable planning in committed `specs/<NNN-feature>/` directories.

## Launchers

```sh
./harness codex
./harness claude
```

Durable feature handoffs and verification records belong in the feature's
`specs/<NNN-feature>/` directory, not session scrollback.

## Exemptions

Small, obvious edits can be handled directly. If a small task exposes a decision
point or higher risk, escalate to the matching phase and explain why.
