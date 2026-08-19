# Feature Specification: Unify Spec Kit Naming and Entry-Point Structure

**Feature Branch**: `feature/013-unify-naming-entrypoints`

**Created**: 2026-07-29

**Status**: Draft

**Input**: User description: "Replace dotted speckit.* logical names with actual hyphenated skill names across live harness files, and restructure AGENTS.md/CLAUDE.md so both runtimes read one common rule body (CLAUDE.md imports AGENTS.md)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One common rule body for both runtimes (Priority: P1)

A Claude Code session and a Codex session both load the same common team
rules from one physical source, so a rule edited once applies to both
runtimes without copying summaries between entry-point files.

**Why this priority**: Today CLAUDE.md only *mentions* AGENTS.md inside a
code span, which the import parser skips — so Claude sessions never load the
AGENTS.md rule bodies, and duplicated summaries in CLAUDE.md drift. This is
an active defect, not just cleanup.

**Independent Test**: Start a Claude session and confirm (via `/context` or
the deterministic context-check assertion) that AGENTS.md content is loaded;
edit a common rule in AGENTS.md only and observe both runtimes see it.

**Acceptance Scenarios**:

1. **Given** the restructured entry points, **When** Claude Code launches,
   **Then** AGENTS.md content is loaded through a bare `@AGENTS.md` import
   in CLAUDE.md (not inside backticks or a code fence).
2. **Given** the restructured CLAUDE.md, **When** its content is reviewed,
   **Then** it contains only the import line plus Claude-only delta (hooks,
   launcher, `.claude/rules` pointers) — no duplicated common summaries.
3. **Given** the restructured AGENTS.md, **When** a Codex session starts,
   **Then** Codex sees the same rule content as before (naming updates only,
   no rule removed or weakened).

---

### User Story 2 - Consistent skill names everywhere (Priority: P2)

Anyone (human or agent) reading a live harness rule, policy, skill, or root
document sees the actual invocable skill name (`speckit-specify`,
`speckit-plan`, ...) instead of the obsolete dotted logical name
(`speckit.specify`), so the documented name always matches what can be run.

**Why this priority**: The dotted "logical name" layer existed to bridge
per-runtime slash-command forms; since Spec Kit v0.14.2 both runtimes install
hyphenated skills, so the extra layer only creates translation burden and
error risk for agents.

**Independent Test**: Search live surfaces for dotted speckit names and get
zero matches, while historical records still contain them untouched; all
harness checks pass.

**Acceptance Scenarios**:

1. **Given** the rename is complete, **When** live policies, shared skills,
   check scripts, root docs, rule mirrors, and tests are searched for dotted
   speckit names, **Then** no matches remain.
2. **Given** the rename is complete, **When** historical records
   (`docs/audits/*`, completed `specs/002`, `specs/008`) are inspected,
   **Then** they are byte-identical to before.
3. **Given** the updated check scripts, **When** `context-check`,
   `rule-check`, `codex-replay-check`, and the test suite run, **Then** all
   pass — name assertions were updated in the same change as the prose.

### Edge Cases

- Vendored and generated trees (`.harness/vendor/speckit/**`,
  `.claude/skills/**`, `.agents/skills/**`) are upstream-owned or generated —
  they are excluded from the rename and from "no dotted names" verification.
- The upstream Spec Kit skill bodies themselves describe a dot-to-hyphen
  conversion rule for extension hooks; that text is vendored and untouched.
- The `@AGENTS.md` line must be bare: the import parser skips Markdown code
  spans and fenced code blocks, so any backticked mention does not import.
- Compaction: only the project-root CLAUDE.md is re-injected from disk, so
  the import must live in the root CLAUDE.md (not a nested one).
- Entry-point files are harness-shared (manifest-delivered); downstream
  app-local `apps/*/CLAUDE.md` / `apps/*/AGENTS.md` are out of scope.
- AGENTS.md must stay within the 200-line context budget target after edits.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All live harness surfaces MUST reference Spec Kit skills by
  their hyphenated installed names. Live surfaces: `.harness/policies/*.md`,
  `.harness/workflow.md`, `.harness/skills/*/SKILL.md` (and their
  references), `.harness/hooks/guardrails.mjs`,
  `.harness/scripts/checks/context-check.mjs` and `codex-replay-check.mjs`,
  `.claude/rules/*.md`, `.codex/rules/*.rules`, root `AGENTS.md`,
  `CLAUDE.md`, `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`,
  `docs/harness-overview.md`, and `tests/harness-cli.test.mjs`.
- **FR-002**: Historical records MUST remain untouched: `docs/audits/**` and
  completed feature archives `specs/002-feature-hub/` and
  `specs/008-linked-feature-hub/`.
- **FR-003**: Check-script name assertions MUST change in the same commit as
  the prose they assert, so no intermediate state fails CI.
- **FR-004**: CLAUDE.md MUST begin its content with a bare `@AGENTS.md`
  import line and contain only Claude-specific delta afterwards; all
  duplicated common summaries MUST be removed.
- **FR-005**: AGENTS.md MUST remain the single physical common rule body for
  both runtimes; its edits in this feature are limited to naming updates and
  (if needed) absorbing content that only existed in CLAUDE.md but is common.
- **FR-006**: `context-check` MUST deterministically assert the bare
  `@AGENTS.md` import exists in CLAUDE.md (rejecting a backticked-only
  mention) and MUST drop assertions that required the removed duplicated
  CLAUDE.md content.
- **FR-007**: A regression test MUST prove dotted speckit names are absent
  from the live surfaces of FR-001 (with FR-002 paths excluded), so the old
  naming cannot silently return.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A search for dotted speckit names across live surfaces returns
  zero matches; the same search over `docs/audits/**` and the completed spec
  archives shows them unchanged.
- **SC-002**: A fresh Claude Code session loads the AGENTS.md rule body at
  launch (import visible via `/context`; guarded permanently by the
  context-check assertion).
- **SC-003**: `npm test`, `./harness context-check`, `./harness rule-check`,
  and `./harness doctor` all pass with zero failures.
- **SC-004**: The AGENTS.md diff for this feature contains no removed or
  weakened rule — only name updates and additions — so Codex behavior is
  unchanged.
- **SC-005**: CLAUDE.md line count drops (duplicated summaries removed) and
  AGENTS.md stays within the 200-line context budget target.

## Assumptions

- Both runtimes' installed Spec Kit integrations use hyphenated skill names
  (confirmed on vendored Spec Kit v0.14.2 for Claude and Codex).
- Claude Code CLAUDE.md `@path` imports are official, load at launch, resolve
  relative to the importing file, and return with the root-CLAUDE.md
  re-injection after compaction (verified against official docs 2026-07-29).
- Codex reads AGENTS.md as plain text with no import mechanism, so the
  common body must remain physically in AGENTS.md.
- The global `~/.claude/CLAUDE.md` and app-local entry points are unaffected.
- In-repo `*.local.md` files are personal scratch and out of scope.
