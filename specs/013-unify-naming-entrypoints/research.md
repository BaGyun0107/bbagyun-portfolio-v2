# Research: Unify Spec Kit Naming and Entry-Point Structure

**Date**: 2026-07-29. No NEEDS CLARIFICATION items remained after specify;
this file records the settled decisions and the measured inventory.

## Decision 1: Drop the dotted logical-name layer

- **Decision**: Use hyphenated installed skill names (`speckit-plan`)
  everywhere on live surfaces.
- **Rationale**: The dotted form existed to bridge per-runtime slash-command
  syntax. Since Spec Kit v0.14.2 (vendored 2026-07-29) both Claude and Codex
  integrations install hyphenated skills, so the extra translation layer only
  creates mismatch risk between documented and invocable names.
- **Alternatives considered**: Keep dotted names as "logical" aliases with a
  mapping note (rejected: the mapping note is the bug surface); rename only
  agent-facing files (rejected: humans copy names from README/CONTRIBUTING).

## Decision 2: CLAUDE.md imports AGENTS.md (bare `@AGENTS.md`)

- **Decision**: AGENTS.md stays the single physical common body; CLAUDE.md
  becomes a bare `@AGENTS.md` import plus Claude-only delta.
- **Rationale**: Verified against official docs (2026-07-29, claude-code-guide
  agent): Claude Code does not natively read AGENTS.md ("Claude Code reads
  CLAUDE.md, not AGENTS.md"); `@path` imports are official, expand at launch,
  max four hops, resolve relative to the importing file, skip code
  spans/fences, and return with the root-CLAUDE.md re-injection after
  compaction. The current CLAUDE.md mentions AGENTS.md only inside backticks,
  so Claude sessions have never loaded the common body — an active defect.
- **Alternatives considered**: Generate AGENTS.md from a `.harness` source
  (rejected: build machinery + "do not edit AGENTS.md" rule for no gain);
  symlink CLAUDE.md -> AGENTS.md (rejected: loses the Claude-only delta and
  is broken on Windows without Developer Mode).

## Decision 3: Historical records stay untouched

- **Decision**: `docs/audits/**`, `specs/002-feature-hub/**`, and
  `specs/008-linked-feature-hub/**` keep their dotted names.
- **Rationale**: They are records of what happened, not live instructions;
  rewriting them falsifies history. The FR-007 regression sweep excludes them.

## Occurrence inventory (measured 2026-07-29)

Pattern: `speckit\.(specify|clarify|plan|tasks|analyze|implement|converge|constitution)`

| Surface | File | Count |
| --- | --- | --- |
| Policy | .harness/policies/scenario-phase-routing.md | 15 |
| Policy | .harness/policies/agent-routing.md | 4 |
| Policy | .harness/policies/tdd.md | 2 |
| Workflow | .harness/workflow.md | 4 |
| Hook | .harness/hooks/guardrails.mjs | 2 |
| Check | .harness/scripts/checks/context-check.mjs | 3 |
| Check | .harness/scripts/checks/codex-replay-check.mjs | 5 |
| Skill | codi-phase-routing/SKILL.md | 5 |
| Skill | codi-auto-loop/SKILL.md | 1 |
| Skill | codi-rule-authoring/SKILL.md (+references/rule-test-patterns.md) | 1 + 1 |
| Skill | codi-feature-hub/SKILL.md | 1 |
| Skill | codi-feature-definition-normalizer/SKILL.md | 2 |
| Skill | codi-planning-retirement/SKILL.md | 2 |
| Rule mirror | .claude/rules/phase-routing.md | 2 |
| Rule mirror | .codex/rules/phase-routing.rules | 2 |
| Root doc | AGENTS.md | 3 |
| Root doc | README.md | 8 |
| Root doc | CONTRIBUTING.md | 4 |
| Root doc | ARCHITECTURE.md | 2 |
| Doc | docs/harness-overview.md | 7 |
| Test | tests/harness-cli.test.mjs | 5 |

Total: 23 files (CLAUDE.md has 0 today; it is rewritten anyway).
Excluded (contain dotted names, intentionally untouched): docs/audits/*,
specs/002-feature-hub/tasks.md, specs/008-linked-feature-hub/tasks.md,
vendored `.harness/vendor/**`, generated `.claude/skills/**` and
`.agents/skills/**`.

## CLAUDE.md delta inventory (what stays after the rewrite)

Claude-only content to retain: skill-injector UserPromptSubmit hook note,
`./harness claude` launcher + SessionStart update-check note, `.claude/rules`
path-scoped mirror list, Stop-hook notify-decision note, `.claude/skills`
merged-tree path. Everything else in today's CLAUDE.md duplicates AGENTS.md
or `.harness/policies` content and is deleted. Common content that exists
only in CLAUDE.md today (none identified beyond phrasing) — re-verify during
implementation; if found, move into AGENTS.md, not kept in CLAUDE.md.
