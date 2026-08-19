# Quality Gates

Before execution:

- Goal is clear.
- Acceptance criteria exist.
- Main risks are recorded.
- When product, architecture, UX, security, or release risk is non-trivial,
  surface the risk to the user and record the decision in the spec directory
  before implementation.

During execution:

- After 2+ redo rounds on the same task, stop and re-confirm scope with the
  user before attempting again.

Before review:

- Tests or checks have been run locally where possible. When the change touches
  a user-facing flow, this includes e2e (run-evidence is recorded at
  verification time, below).
- Execution notes list files changed and behavior touched.
- If production data, sensitive records, external side effects, or migration
  changes are involved, review evidence includes the exact target, approval
  status, minimization/redaction notes, and rollback or stop plan.

Before verification:

- Review findings are addressed or explicitly accepted.
- Verification commands are listed.
- Residual risk is documented.
- When a change adds or alters a user-facing flow, e2e has been run and the
  record includes e2e run evidence: which flows passed, the command, and the
  observed output (not just "e2e was run"). Validation runs in order:
  typecheck → unit → integration → e2e. Exemptions: pure internal refactors,
  config, docs, and changes that do not alter a user-facing surface.
- Migration verification includes generated SQL/schema diff, affected objects,
  lock/downtime expectation, rollback or roll-forward plan, and observed check
  output.
- Auth/permission verification includes authentication failure, authorization
  failure, tenant/user boundary, and audit-log expectations where applicable.

## What counts as a user-facing flow

A user-facing flow is what triggers the e2e requirement above. Defined here once
so policy, rules, and skills agree.

Included:

- a new page or route
- the user flow created by a new API endpoint
- login/auth flows
- payment or order flows
- end-to-end paths of core domain CRUD

Excluded:

- selector- or style-only changes
- internal utilities or refactors
- config or build changes
- docs
- logging

How e2e is run: through the root `e2e` / `e2e:changed` mise tasks, which ship
in the harness root `mise.toml` (new projects inherit them; without per-app
suites they skip gracefully and never stamp evidence). Per-app suite
scaffolding, retrofitting older projects, and troubleshooting are owned by the
`codi-e2e` skill; the canonical task source is
`.harness/skills/codi-e2e/resources/mise-e2e-tasks.toml`. A missing task or
suite means "scaffold it first", not "skip e2e".

E2E best-practice principles (referenced by the skills so they live in one
place):

- e2e covers critical flows only — do not write a test per feature.
- Separate test intent from implementation.
- An agent may author e2e, but a human owns and reviews it.

## Enforcement level of Planning Hub process rules (decided 2026-07-17)

The feature-definition / Planning Hub process rules — surface-scoped sitemap
review, splitting features that span surfaces, the work-item recording
contract, actor-surface consistency — are **intentionally non-blocking**:
they operate as narrative rules plus non-blocking hints/warnings/reminders.
The rationale matches the existing guardrail philosophy (the same
self-declare pattern as the Size and e2e markers; hooks are a
navigate-by-mistake defense, not a sandbox). Staying fail-open keeps
bottom-up and maintenance flows unblocked.

Criteria for revisiting a switch to blocking gates:

- Unregistered-feature warnings accumulate unresolved for 2+ weeks.
- Open decisions (DEC-*) sit neglected across multiple sprints.
- Actor-surface mismatch hints are repeatedly ignored at merge time.

Even if switched, the only mechanism is promoting the relevant
`planning:check` warnings to failures (no new hooks). Background for this
decision: `docs/audits/2026-07-17-feature-definition-flow-analysis.md`,
residual item 5.
