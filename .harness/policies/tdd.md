# TDD Policy

For non-trivial implementation work:

1. Write or update a failing test.
2. Run the focused test and capture the failure.
3. Implement the smallest change that should pass.
4. Run the focused test again.
5. Refactor only after green.
6. Run broader checks when shared behavior or user-facing workflows changed.
   When a user-facing workflow changed, "broader checks" include e2e, run in
   order: typecheck → unit → integration → e2e. e2e does not replace unit tests
   (keep the pyramid) — run it only after unit and integration are green. See
   the e2e gate and the "user-facing flow" definition in
   `.harness/policies/quality-gates.md`.

Exemptions:

- documentation-only changes
- comments-only changes
- mechanical formatting
- pure configuration scaffold where no executable behavior exists yet

Spec Kit generates test tasks only on request: every `speckit-specify` and
`speckit-tasks` invocation must explicitly request test tasks ("include test
tasks (TDD)"). For spec-managed work, record any exemption in the feature's
`specs/<NNN-feature>/` directory (plan.md or tasks.md notes).

## Retry strategy on repeated failure

When the same test or verification fails twice consecutively for the same root
cause at the same point, stop repeating the same fix. First rerun once to rule
out a flaky or intermittent failure. Then switch strategy: form at most 3
alternative hypotheses, run at most 2 exploration rounds, and compare them by
test results and verification evidence, not by self-assigned scores. Adopt the
best-evidenced approach. If it still fails, record the blocker and surface it
to the user. Detailed procedure:
`.harness/skills/_shared/conditional/exploration-loop.md`.
