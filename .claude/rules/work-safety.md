# Work Safety

This rule applies to every session. It mirrors the common safety policy in
`.harness/policies/guardrails.md` and the execution checks in
`.harness/hooks/guardrails.mjs`.

## Protected branches

Do not change code, config, documentation, generated files, or dependency state
directly on `main` or `dev`.

- Create a working branch first for feature work, fixes, docs, config, and
  refactors.
- Branch creation from `main` or `dev` is allowed.
- Read-only inspection, tests, and status commands are allowed.
- Hotfix work still uses a `hotfix/<short-kebab-name>` branch before opening a
  PR to `main`.

## Explicit approval required

Ask for explicit user approval before running commands that can destroy data,
rewrite history, bypass review, expose secrets, or affect production.

Examples:

- recursive force delete, hard reset, force push, force clean
- PR merge or repository deletion
- destructive database statements, unbounded database writes, database CLI
  execution that may mutate persisted data, or migration resets
- production data reads/exports, PII/payment/auth/session samples, and live
  customer records
- payment capture/refund, SMS/email/push sends, production webhook replay, or
  other live external side effects
- Kubernetes delete, Docker system prune, Terraform destroy
- printing `.env` files or secret-like environment variables
- production deploys and rollbacks

`gh pr merge` is different from the other examples: agents must never merge
PRs, even with approval. Ask the user to merge in GitHub.

For the other examples, approval must name the exact operation and target. The
Claude hook blocks representative dangerous commands because it has no durable
approval grant; treat that block as a stop sign to ask the user or move the
approved operation to a human-controlled path, not as something to bypass with
an environment variable.

## Database safety

Use ORM/bind parameters (never interpolate input into SQL); require bounded
`WHERE`, tenant scope, and reviewed row counts on writes; require dry-run,
backup, rollback plan, and explicit approval for bulk or destructive ops and
migrations.

Full SQL-authoring and migration rules: `.harness/imported-rules/database.md`
and the database/migration sections of `.harness/policies/guardrails.md`.

## Sensitive data and external side effects

Production data reads need explicit approval; prefer schemas/counts/aggregates
and never paste or log secrets, PII, tokens, or customer records. Live external
side effects (payments, sends, webhook replay, high-cost APIs) default to
sandbox/dry-run and need approval plus idempotency. Derive auth/permission
identity from server context, not client input.

Full rules: the sensitive-data, external-side-effect, and auth sections of
`.harness/policies/guardrails.md`.

## Enforcement

Claude Code runs `.harness/hooks/guardrails.mjs` before Bash, Write, Edit, and
MultiEdit tool use. Codex mirrors the command-level intent in
`.codex/rules/work-safety.rules`; branch-aware checks live in the hook because
Codex execpolicy prefix rules cannot inspect the working directory or branch.
