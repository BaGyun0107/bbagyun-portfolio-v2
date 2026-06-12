# Quality Gates

Before execution:

- Goal is clear.
- Acceptance criteria exist.
- Main risks are recorded.
- GStack gate has been used when product, architecture, UX, security, or release risk is non-trivial.

During execution:

- After 2+ redo rounds on the same task, stop and re-confirm scope with the
  user before attempting again.

Before review:

- Tests or checks have been run locally where possible.
- Execution notes list files changed and behavior touched.
- If production data, sensitive records, external side effects, or migration
  changes are involved, review evidence includes the exact target, approval
  status, minimization/redaction notes, and rollback or stop plan.

Before verification:

- Review findings are addressed or explicitly accepted.
- Verification commands are listed.
- Residual risk is documented.
- Migration verification includes generated SQL/schema diff, affected objects,
  lock/downtime expectation, rollback or roll-forward plan, and observed check
  output.
- Auth/permission verification includes authentication failure, authorization
  failure, tenant/user boundary, and audit-log expectations where applicable.
