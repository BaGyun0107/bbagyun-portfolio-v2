<!--
Sync Impact Report
- Version change: (template) -> 1.0.0
- Modified principles: none (initial adoption)
- Added sections: Core Principles (I-V), Operational Constraints, Governance
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ compatible (generic Constitution Check gate)
  - .specify/templates/spec-template.md ✅ compatible (no constitution-specific sections)
  - .specify/templates/tasks-template.md ✅ compatible (test-first tasks already supported)
- Follow-up TODOs: none
-->

# Codi Harness Constitution

## Core Principles

### I. Dual-Runtime Parity (Claude / Codex)

Every shared rule MUST land in `.harness` (policies, skills, hooks) as the
common source, then be mirrored into each runtime's native layer. A rule is
complete only when both Claude Code and Codex demonstrably act on it — policy
text alone is not parity. Accepted asymmetries MUST be documented with
compensating controls.
Detail: `.harness/policies/context-engineering.md`,
`.harness/policies/rule-lifecycle.md`.

### II. Policy as Source of Truth, Thin Entry Points

Root entry points (`AGENTS.md`, `CLAUDE.md`) stay thin (target ≤200 lines)
and delegate to `.harness/policies/*.md`; common rules MUST NOT be duplicated
at length across entry points. A decision that exists only in chat or a
scratch note is not source of truth — durable feature state lives in
committed `specs/<NNN-feature>/` directories, cross-feature overview in the
thin root `ROADMAP.md`.
Detail: `.harness/policies/context-engineering.md`,
`.harness/policies/scenario-phase-routing.md`.

### III. Test-First and Regression Coverage

Feature work follows TDD (test tasks are requested explicitly in every
specify/tasks invocation), and validation runs in order: typecheck -> unit ->
integration -> e2e, with e2e evidence recorded for user-facing flows. A rule
or behavior change is incomplete until a regression test proves the previous
bad behavior now fails. `npm test`, `./harness context-check`,
`./harness rule-check`, and `./harness doctor` MUST pass before shipping.
Detail: `.harness/policies/quality-gates.md`,
`.harness/policies/rule-lifecycle.md`.

### IV. Human Gates Are Preserved

Two feature-flow gates are never skipped or answered on the user's behalf:
answering clarify questions, and reviewing `tasks.md` before implementation
starts — automation (including the `codi-auto-loop` skill) MUST pause at
them. Agents MUST NOT merge PRs. Destructive, production-affecting, or
secret-exposing operations require explicit user approval naming the exact
operation and target.
Detail: `.harness/policies/scenario-phase-routing.md`,
`.harness/policies/guardrails.md`.

### V. Upgrade Resilience

External tools (Spec Kit, Superpowers, Playwright MCP) are consumed at
pinned versions — vendored fixed tags, marketplace releases, or pinned
package versions — never floating `latest`. Cross-tool coupling is by name and contract only: harness skills
and policies MUST NOT restate or depend on the internal steps of external
skills. Upstream-owned directories (`.harness/skills/` in downstream
projects, vendored assets) MUST NOT be edited in place; changes go upstream
or into project-owned parallel paths.
Detail: `.harness/lock.json` policy fields,
`.claude/rules/skill-ownership.md`.

## Operational Constraints

Work happens on working branches, never directly on protected branches
(`main` / `dev`; this repo's version branches follow the same rule). Commits
and PRs are written in Korean per the Language rules in `AGENTS.md`. Size
routing (Small / Medium / Large / Extra large) decides the process weight;
Medium+ work declares its Size and keeps its plan of record in
`specs/<NNN-feature>/`.
Detail: `.harness/policies/guardrails.md`,
`.harness/policies/scenario-phase-routing.md`.

## Governance

This constitution is the distilled, non-negotiable summary of the harness
policies; the detailed rules remain in `.harness/policies/*.md`. On conflict,
treat the divergence as drift: fix whichever document is stale through a PR
rather than silently following either. Amendments are made by PR to the
active version branch, merged by the user, with the version bumped by semver
(MAJOR: principle removal/redefinition, MINOR: new or materially expanded
principle, PATCH: clarification). Compliance is reviewed through the standard
check pipeline (`./harness doctor`, `context-check`, `rule-check`,
`npm test`) and the Constitution Check gate in `speckit-plan` /
`speckit-analyze`.

**Version**: 1.0.0 | **Ratified**: 2026-07-29 | **Last Amended**: 2026-07-29
