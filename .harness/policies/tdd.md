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
