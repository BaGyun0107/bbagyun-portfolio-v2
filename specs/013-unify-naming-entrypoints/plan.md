# Implementation Plan: Unify Spec Kit Naming and Entry-Point Structure

**Branch**: `feature/013-unify-naming-entrypoints` | **Date**: 2026-07-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/013-unify-naming-entrypoints/spec.md`

## Summary

Two coordinated refactors of the harness context surfaces: (1) replace the
obsolete dotted logical names (`speckit.plan` style) with the actual
hyphenated installed skill names (`speckit-plan`) across all live surfaces
while leaving historical records untouched, updating check-script assertions
in the same change; (2) make AGENTS.md the single physical common rule body
and reduce CLAUDE.md to a bare `@AGENTS.md` import plus Claude-only delta,
fixing the active defect that Claude sessions never load AGENTS.md (the
current mention is inside a code span, which the import parser skips).

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Markdown rule/policy files; Node.js 24 (mise-pinned) for check scripts and tests

**Primary Dependencies**: `node --test` suite (`tests/harness-cli.test.mjs`), harness check scripts (`context-check.mjs`, `rule-check.mjs`, `codex-replay-check.mjs`, `doctor.sh`)

**Storage**: N/A (repo files only)

**Testing**: `npm test`, `./harness context-check`, `./harness rule-check`, `./harness doctor`

**Target Platform**: harness repo tooling (Claude Code + Codex runtimes)

**Project Type**: documentation/tooling refactor of context surfaces

**Performance Goals**: N/A

**Constraints**: AGENTS.md stays within the 200-line context budget target; prose and check assertions must flip in the same commit (no intermediate red state); Codex-visible rule content must not weaken

**Scale/Scope**: 23 live files, ~80 dotted-name occurrences (inventory in research.md); 2 entry-point files restructured

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against the Codi Harness Constitution v1.0.0:

- **I. Dual-Runtime Parity** — PASS. The feature strengthens parity: one
  physical common body, Codex content unchanged in meaning, `.claude/rules`
  and `.codex/rules` mirrors renamed together.
- **II. Policy as Source of Truth, Thin Entry Points** — PASS. CLAUDE.md
  loses duplicated summaries; AGENTS.md remains the thin common entry point
  delegating detail to `.harness/policies`.
- **III. Test-First and Regression Coverage** — PASS. FR-007 adds a
  regression test that dotted names cannot return; check assertions flip in
  the same commit; full check pipeline must be green.
- **IV. Human Gates Are Preserved** — PASS. Process-level: this feature runs
  through the tasks.md review gate; no gate text is weakened by the rename.
- **V. Upgrade Resilience** — PASS. Removes an obsolete translation layer;
  vendored/generated trees are excluded from edits and verification.

Post-Phase-1 re-check: no design decision introduced a violation.

## Project Structure

### Documentation (this feature)

```text
specs/013-unify-naming-entrypoints/
├── spec.md              # feature specification
├── plan.md              # this file
├── research.md          # Phase 0: decisions + full occurrence inventory
├── quickstart.md        # Phase 1: validation guide (grep sweeps + checks)
└── tasks.md             # Phase 2 output (speckit-tasks)
```

`data-model.md` and `contracts/` are intentionally omitted: the feature has
no data entities and no external interface; the enforced "contract" (entry
point structure + check assertions) is captured in spec FR-004/FR-006 and
validated by quickstart.md.

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
AGENTS.md                          # single common rule body (edited)
CLAUDE.md                          # @AGENTS.md import + Claude delta (rewritten)
README.md / ARCHITECTURE.md / CONTRIBUTING.md / docs/harness-overview.md
.harness/workflow.md
.harness/policies/{scenario-phase-routing,agent-routing,tdd}.md
.harness/hooks/guardrails.mjs
.harness/scripts/checks/{context-check,codex-replay-check}.mjs
.harness/skills/{codi-phase-routing,codi-auto-loop,codi-rule-authoring,
                 codi-feature-hub,codi-feature-definition-normalizer,
                 codi-planning-retirement}/SKILL.md
.harness/skills/codi-rule-authoring/references/rule-test-patterns.md
.claude/rules/phase-routing.md
.codex/rules/phase-routing.rules
tests/harness-cli.test.mjs         # assertions renamed + new regression test
```

**Structure Decision**: Flat in-place edits over the existing harness layout;
no new directories. Excluded from all edits and from verification:
`docs/audits/**`, `specs/002-feature-hub/**`, `specs/008-linked-feature-hub/**`
(historical records), `.harness/vendor/**`, `.claude/skills/**`,
`.agents/skills/**` (vendored/generated).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

None — all constitution gates pass without exceptions.
