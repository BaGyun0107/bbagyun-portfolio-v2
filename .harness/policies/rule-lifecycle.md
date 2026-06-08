# Rule Lifecycle Policy

Use this policy when adding, changing, or deleting agent rules.

## Source of Truth First

Common team rules start in `.harness/policies`. Do not make a Claude-only or
Codex-only context rule when the behavior should apply to both tools.

Use the smallest durable surface that can enforce the rule:

- `.harness/policies/*.md` for common intent and rationale
- `.claude/rules/*.md` for Claude Code's always-loaded narrative rules
- `.codex/rules/*.rules` for Codex command execution policy
- `.harness/hooks/*` when runtime inspection or blocking is required
- `tests/harness-cli.test.mjs` for regression coverage

## Mirror Rules

When a rule needs tool-native enforcement:

1. Add or update the common `.harness/policies` source.
2. Add a Claude narrative mirror under `.claude/rules`.
3. Add a Codex execpolicy mirror under `.codex/rules` when command execution is
   affected.
4. Add runtime hook coverage if the rule depends on branch, cwd, paths, role, or
   tool input shape.
5. Register required files in `doctor.sh`.
6. Add tests that prove the rule is documented, wired, and enforced.

Do not assume parity from file names alone. A new rule is complete only when
`./harness rule-check`, `./harness doctor`, and `npm test` pass.

## Accepted Asymmetry

Codex execpolicy is prefix-based and cannot inspect the current branch or full
tool input. Put those checks in shared hooks and document the Codex limitation in
the common policy and Claude mirror.

Some rules are documentation-only. In that case, do not create empty native rule
files just for symmetry; document why the rule has no command or hook surface.
