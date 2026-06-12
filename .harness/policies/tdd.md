# TDD Policy

For non-trivial implementation work:

1. Write or update a failing test.
2. Run the focused test and capture the failure.
3. Implement the smallest change that should pass.
4. Run the focused test again.
5. Refactor only after green.
6. Run broader checks when shared behavior or user-facing workflows changed.

Exemptions:

- documentation-only changes
- comments-only changes
- mechanical formatting
- pure configuration scaffold where no executable behavior exists yet

For GSD-managed work, record any exemption in `.planning/` or the active GSD
phase notes.

## Retry strategy on repeated failure

When the same test or verification fails twice consecutively for the same root
cause at the same point, stop repeating the same fix. First rerun once to rule
out a flaky or intermittent failure. Then switch strategy: form at most 3
alternative hypotheses, run at most 2 exploration rounds, and compare them by
test results and verification evidence, not by self-assigned scores. Adopt the
best-evidenced approach. If it still fails, record the blocker and surface it
to the user. Detailed procedure:
`.harness/skills/_shared/conditional/exploration-loop.md`.
