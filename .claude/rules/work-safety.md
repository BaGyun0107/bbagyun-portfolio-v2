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

Follow `.harness/imported-rules/database.md` for SQL authoring. In short:
prefer ORM/query builder APIs, use bind parameters for raw SQL, never
interpolate user input into SQL strings, and allowlist dynamic identifiers.

Before database writes, check that `UPDATE` and `DELETE` have bounded `WHERE`
clauses, multi-tenant predicates include tenant/account/user scope, expected and
actual affected row counts are reviewed, and multi-step writes have transaction
boundaries. Bulk update/delete requires dry-run `SELECT`, backup or restore
point, rollback or roll-forward plan, and explicit approval when destructive.

Before migrations, review the generated diff, data impact, lock impact, index
build method, downtime expectation, rollback or roll-forward strategy, and
verification command. Do not run `DROP`, `TRUNCATE`, destructive `ALTER TABLE`,
database reset, or database drop commands without explicit approval for the
exact target.

## Sensitive data and external side effects

Production data reads require explicit approval even when read-only. Prefer
schemas, counts, aggregates, query plans, redacted logs, and synthetic samples
over raw production rows. Do not paste production data, PII, payment data,
tokens, session IDs, customer records, or support transcripts into code, tests,
fixtures, docs, issues, PRs, chat, or verification notes.

Never log or return secrets, `Authorization`, `Cookie`, `Set-Cookie`, DB URLs,
OAuth codes/tokens, session IDs, CSRF tokens, reset tokens, stack traces, SQL
text, internal paths, provider raw errors, or config values to clients.

Payment capture/refund, SMS/email/push send, production webhook replay, live
customer sync, and high-cost API calls require sandbox/dry-run/mock paths by
default and explicit approval for live targets. Retried side effects need
idempotency keys or equivalent deduplication.

Auth and permission work must derive user/account/tenant/role identity from
server-verified context, not client input. Admin, role, permission, ownership,
billing, and credential changes need audit logs and tests for both
authentication and authorization failure paths.

## Enforcement

Claude Code runs `.harness/hooks/guardrails.mjs` before Bash, Write, Edit, and
MultiEdit tool use. Codex mirrors the command-level intent in
`.codex/rules/work-safety.rules`; branch-aware checks live in the hook because
Codex execpolicy prefix rules cannot inspect the working directory or branch.
