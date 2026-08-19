# Tasks: Unify Spec Kit Naming and Entry-Point Structure

**Input**: spec.md, plan.md, research.md, quickstart.md in
`specs/013-unify-naming-entrypoints/`

**Tests**: Requested (TDD) — regression tests are written first and must fail
before the change that makes them pass.

## Phase 1: Setup

- [X] T001 Record the pre-change baseline: run `npm test`,
  `./harness context-check`, `./harness rule-check` and confirm all green on
  branch `feature/013-unify-naming-entrypoints` before any edit.

## Phase 2: Foundational

(none — no shared scaffolding is needed; both stories edit existing files)

## Phase 3: User Story 1 - One common rule body for both runtimes (P1)

**Goal**: CLAUDE.md becomes a bare `@AGENTS.md` import plus Claude-only
delta; AGENTS.md is the single physical common body.

**Independent test**: quickstart.md §2 (bare import present, hyphen names in
AGENTS.md) and §3 (checks green); manual `/context` shows AGENTS.md content.

- [X] T002 [US1] (TDD red) Add a deterministic assertion to
  `.harness/scripts/checks/context-check.mjs`: CLAUDE.md must contain a bare
  `@AGENTS.md` import line (line-anchored; a backticked or fenced mention
  must not satisfy it). Run context-check and confirm it FAILS against the
  current CLAUDE.md.
- [X] T003 [US1] Inventory today's CLAUDE.md against AGENTS.md and
  `.harness/policies`: confirm every removed line is duplicated elsewhere;
  move any common-only content into AGENTS.md (research.md expects none).
- [X] T004 [US1] Rewrite `CLAUDE.md`: bare `@AGENTS.md` first content line,
  then only the Claude delta — skill-injector hook note, `./harness claude`
  launcher + SessionStart note, `.claude/rules` mirror list, Stop-hook
  notify-decision note, `.claude/skills` merged-tree path.
- [X] T005 [US1] Update the remaining CLAUDE.md content assertions in
  `.harness/scripts/checks/context-check.mjs` (and any CLAUDE.md string
  assertions in `tests/harness-cli.test.mjs`): drop assertions that required
  the removed duplicated summaries; keep/add assertions for the Claude delta
  (`.claude/skills`, `.claude/rules` pointers) and for
  "AGENTS.md references ..." equivalents that already exist.
- [X] T006 [US1] (TDD green) Run `npm test` and `./harness context-check`;
  the T002 assertion and all updated assertions must pass.

## Phase 4: User Story 2 - Consistent skill names everywhere (P2)

**Goal**: Live surfaces use hyphenated installed names; historical records
untouched; assertions flip with the prose.

**Independent test**: quickstart.md §1 sweep returns nothing; §5 shows
historical paths unchanged; §3 checks green.

- [X] T007 [US2] (TDD red) Add a regression test to
  `tests/harness-cli.test.mjs` that sweeps the live surfaces of FR-001 for
  `speckit\.(specify|clarify|plan|tasks|analyze|implement|converge|constitution)`
  and asserts zero matches (excluding FR-002 historical paths and
  vendored/generated trees). Run it and confirm it FAILS.
- [X] T008 [P] [US2] Rename dotted -> hyphenated in policies and workflow:
  `.harness/policies/scenario-phase-routing.md` (15),
  `.harness/policies/agent-routing.md` (4), `.harness/policies/tdd.md` (2),
  `.harness/workflow.md` (4). Reword the "logical names map to each
  runtime's slash-command form" bullet — the mapping layer no longer exists.
- [X] T009 [P] [US2] Rename in shared skills:
  `codi-phase-routing`, `codi-auto-loop` (drop its "Skill naming" mapping
  paragraph), `codi-rule-authoring` (+`references/rule-test-patterns.md`),
  `codi-feature-hub`, `codi-feature-definition-normalizer`,
  `codi-planning-retirement` SKILL.md files.
- [X] T010 [P] [US2] Rename in rule mirrors:
  `.claude/rules/phase-routing.md` (2), `.codex/rules/phase-routing.rules`
  (2).
- [X] T011 [P] [US2] Rename in root and overview docs: `AGENTS.md` (3),
  `README.md` (8), `CONTRIBUTING.md` (4), `ARCHITECTURE.md` (2),
  `docs/harness-overview.md` (7).
- [X] T012 [US2] Rename in enforcement/check code, same change as prose:
  `.harness/hooks/guardrails.mjs` (2),
  `.harness/scripts/checks/context-check.mjs` (3 dotted-name assertions),
  `.harness/scripts/checks/codex-replay-check.mjs` (5, including replay
  fixture expectations), and the 5 existing dotted-name assertions in
  `tests/harness-cli.test.mjs`.
- [X] T013 [US2] (TDD green) Run `npm test`, `./harness context-check`,
  `./harness rule-check`, `./harness codex-replay-check` fixtures via
  `npm test`; the T007 sweep and all renamed assertions must pass.

## Phase 5: Polish & Cross-Cutting

- [X] T014 Run the full quickstart.md validation (§1-§5) and record command
  output in `specs/013-unify-naming-entrypoints/verification.md`, including
  the AGENTS.md 200-line budget check and the `git diff v2 -- AGENTS.md`
  no-weakening review.
- [X] T015 Run `./harness doctor` end-to-end and `mise run
  feature:status:sync`; add the 013 row to root `ROADMAP.md`.
- [X] T016 Manual (user-assisted, may be deferred to review): in a fresh
  Claude Code session run `/context` and confirm AGENTS.md content is loaded
  via the import (SC-002 evidence noted in verification.md).

## Dependencies

- T001 → everything.
- US1 (T002→T006 sequential) before US2 tasks that touch the same files:
  T011 edits AGENTS.md and T012 edits context-check.mjs — run after T006.
- Within US2: T007 first (red); T008-T011 parallel [P]; T012 after T008-T011;
  T013 last.
- Phase 5 after both stories.

## Implementation Strategy

MVP is US1 (fixes the active defect that Claude never loads AGENTS.md). US2
is a mechanical sweep guarded by the T007 regression test. Both land as one
PR; commits may split by story to keep FR-003 (assertions flip with prose)
per commit.
