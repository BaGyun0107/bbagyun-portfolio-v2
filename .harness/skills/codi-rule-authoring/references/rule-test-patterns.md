# Rule Test Patterns

Rules need tests at the level where they can fail.

## Mirror Drift

Use `context-check` when a rule has required wording across source of truth,
entrypoints, skills, preflight, or native mirrors.

Good checks assert specific behavior words, not just file names:

- "selected action: ask is a hard stop"
- "include test tasks (TDD)"
- "Skimming spec files without adopting their unchecked tasks"

## Native Rule Lifecycle

Use `rule-check` when adding or deleting `.codex/rules/*.rules` or
`.claude/rules/*.md`. It should catch orphaned or undocumented native rules.

## Replay Behavior

Use replay fixtures when the behavior happens in agent prose or workflow order.

Add at least two fixtures:

- **Bad transcript:** the previous failure mode must fail.
- **Good transcript:** the intended behavior must pass.

Replay fixtures should be realistic. Include the exact misleading phrases that
caused drift, for example:

- "I skimmed specs/003-upload/tasks.md" without resuming its unchecked items.
- "Ran speckit-tasks" without requesting test tasks ("include test tasks
  (TDD)").
- "Selected action: ask" followed by implementation edits.
- "Using codi-frontend/codi-backend" without a `Subagent decision:` block.

## Hook or Command Enforcement

Use direct hook/tool tests when the rule is deterministic:

- path blocking,
- protected branch blocking,
- package manager blocking,
- forbidden command prefixes,
- secret/env reads,
- destructive command prompts.

For Codex execpolicy, include both `match` and `not_match` examples in the rule
file when practical, then add tests around the script or policy generator that
validates the expected surface.

## Audit Output

When auditing a rule, report:

- Source of truth.
- Claude mirror or reason none is needed.
- Codex mirror or reason none is possible.
- Enforcement layer.
- Tests that would catch regression.
- Residual runtime limitation.
