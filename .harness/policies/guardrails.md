# Guardrails Policy

This policy is mandatory for Codex, Claude Code, and any headless phase worker.

## Branch Safety

AI must not do feature work directly on `main` or `dev`.

If the current branch is `main` or `dev` and the user asks for code, config, or
documentation changes, create or ask to create a working branch first.

Branch naming:

```text
feat/<short-kebab-name>
fix/<short-kebab-name>
test/<short-kebab-name>
docs/<short-kebab-name>
chore/<short-kebab-name>
hotfix/<short-kebab-name>
```

If the branch cannot be created automatically because of local changes or
permissions, stop and ask the user.

## PR Flow

AI may create pull requests, but must never merge them.

App repository normal flow:

```text
feat/* or test/* or fix/* or docs/* or chore/*
  -> PR to dev
  -> user merges
  -> PR from dev to main
  -> user merges
```

Harness repository flow:

```text
chore/* or fix/* or docs/* or test/*
  -> PR to the requested version branch
  -> user merges
```

The harness repo itself is managed on version branches. The app repo
`dev -> main` promotion flow is not enforced for harness repo work.

Hotfix flow:

```text
hotfix/*
  -> PR directly to main
  -> user merges
  -> create main -> dev reverse-sync PR
  -> user merges
```

Rules:

- For app repo work, AI must not create a direct PR to `main` unless the branch
  or request is clearly `HOTFIX`.
- When `HOTFIX` is needed, the normal `feature -> dev -> main` flow may be
  skipped: create the PR directly to `main`, let the user merge it, then create
  the `main -> dev` reverse-sync PR.
- For harness repo work, AI may target a version branch requested by the user or
  implied by the current release branch.
- After a hotfix PR to `main`, AI must proceed with the `main -> dev`
  reverse-sync PR and remind the user that it must be merged.
- AI must not run merge commands, click merge buttons, enable auto-merge, or
  approve its own PR.
- AI may draft PR title/body, create the PR, and report the PR URL.

## Dangerous Operations

Always ask the user for explicit approval before running or generating a command
that can destroy data, rewrite history, bypass review, expose secrets, or affect
production.

Examples:

```text
rm -rf
git push --force
git push --force-with-lease
git reset --hard
git clean -fd
git rebase -i on shared branches
DROP TABLE
DROP DATABASE
TRUNCATE
DELETE FROM without a bounded WHERE
ALTER TABLE destructive changes
prisma migrate reset
drizzle-kit drop
sequelize db:drop
kubectl delete
docker system prune
terraform destroy
gh pr merge
gh repo delete
secret/env/token printing
production deploy or rollback
production data read or export
PII, token, session, payment, or customer record sampling
payment capture/refund, SMS/email bulk send, push notification bulk send
production webhook replay
```

Approval must be specific to the operation. A broad "continue" is not enough for
destructive operations.

`gh pr merge` is the permanent exception: AI may create PRs, but must never
merge PRs even with approval. Ask the user to merge in GitHub.

For the other examples, the policy is "specific approval required", not
"forever impossible". Codex execpolicy should model these as `prompt` whenever
a safe prefix rule can express the command. Claude Code's synchronous hook does
not receive a durable approval grant, so it blocks representative dangerous
commands as a stop sign and tells the agent to ask; the user or a future
harness approval command must perform the approved operation rather than having
the agent bypass the hook with an environment variable.

## Database Write and Migration Safety

Any command or generated SQL that can mutate persisted data is
approval-sensitive.
This includes destructive DDL, migration reset/drop commands, bulk
update/delete, and database CLI execution where the SQL text is not trivially
known to be read-only.

Rules:

- Prefer ORM/query builder APIs over raw SQL. Raw SQL must use bind parameters.
- Dynamic identifiers such as table, column, sort, and filter names must come
  from allowlists because bind parameters cannot protect identifiers.
- `UPDATE` and `DELETE` need bounded `WHERE` clauses and tenant/account/user
  scope predicates when the data model is multi-tenant.
- Writes need expected and actual affected row count checks.
- Multi-step writes need an explicit transaction boundary.
- Bulk writes need a dry-run `SELECT`, backup or restore point, transaction or
  batch rollback plan, and explicit approval when destructive.
- Migrations need human-readable diff review, forward/backward or roll-forward
  strategy, lock and downtime assessment, data migration impact notes, and a
  verification command.

The hook blocks reliable high-signal command patterns such as `DROP`,
`TRUNCATE`, unbounded `UPDATE`/`DELETE`, destructive `ALTER TABLE`, and common
reset/drop commands. Broad predicates such as `WHERE 1=1`, missing tenant
scope, or cleanup writes without batching require narrative review and the
database checklist because safe detection needs SQL and schema context.

## Production Data Access

Production data reads are sensitive even when they do not mutate data.

Rules:

- Reading production databases, logs, object storage, analytics exports, or
  vendor dashboards requires explicit user approval.
- PII, payment data, auth/session/token data, customer records, and support
  transcripts require approval even for a single-row sample.
- Prefer schema, counts, aggregates, query plans, redacted logs, and synthetic
  or anonymized samples over raw production rows.
- Do not paste production data into code, tests, fixtures, issues, PR bodies,
  chat, or verification notes.
- If production data is needed for debugging, document the exact target,
  purpose, minimum fields, retention location, and redaction approach.

## Secret, Log, and Error Redaction

Secrets and sensitive values must stay out of source, logs, client responses,
snapshots, and final reports.

Rules:

- Never log or return `Authorization`, `Cookie`, `Set-Cookie`, API keys, DB
  URLs, OAuth codes/tokens, session IDs, refresh tokens, CSRF tokens, private
  keys, or password reset tokens.
- Client responses must not expose stack traces, SQL text, internal paths,
  provider raw errors, secrets, or configuration values.
- Agent reports and PR/issue bodies must mask secret-like values and production
  identifiers.
- `.env.example` must use obvious placeholders, not real-looking credentials.
- Test fixtures, seed data, and snapshots must be synthetic or anonymized.

## Auth and Permission Boundaries

Authentication, authorization, and tenant isolation are separate checks.

Rules:

- Derive user, account, tenant, and role identity from server-verified session
  or token context, not from client-supplied IDs.
- Protected endpoints require authentication tests and authorization tests.
  Permission failures should be distinguishable from authentication failures.
- Admin, role, permission, billing, and ownership changes require audit logs.
- Cookie-based state-changing requests require CSRF protection.
- Refresh token rotation, logout invalidation, password-change invalidation,
  and session revocation must be reviewed together.

## External API Cost and Side Effects

External APIs can spend money or affect real users.

Rules:

- Payment capture/refund, SMS/email/push send, production webhook replay, live
  customer sync, and high-cost AI/API calls require explicit approval unless
  the user already scoped the exact sandbox or dry-run target.
- Use sandbox, dry-run, preview, or mock paths by default.
- Retried side effects require idempotency keys or an equivalent deduplication
  strategy.
- Set timeout, retry, rate limit, and budget/volume guardrails for paid APIs.
- Bulk sends or bulk mutations require a recipient/record count preview and a
  stop/rollback plan.

## Migration Review Evidence

Migration work must leave reviewable evidence.

Required evidence:

- generated SQL or schema diff
- affected tables, services, and runtime paths
- data backfill or data migration plan
- lock impact, index build method, and downtime expectation
- forward/backward migration or roll-forward plan
- verification command and observed result
- explicit approval note for destructive operations

## Shared Skill Ownership

`.harness/skills/**` is shared, upstream-owned Codi harness content. Downstream
projects must not create, edit, format, restore, remove, or otherwise mutate
files under that tree. `./harness update --apply-harness` overwrites
`.harness/skills/**` from upstream, so downstream edits are either rejected as
dirty shared paths or lost on the next update.

Project-specific skills belong under `.harness/skills-local/<name>/`. That
directory is project-owned, preserved by harness updates, and merged with the
shared skills by `./harness skills-link`.

Read-only inspection is allowed. Agents may read, list, grep, audit, and run
safe diffs against `.harness/skills/**`, including comparisons such as:

```sh
diff -ru .harness/skills .harness/skills-local
```

Safe `diff` means no file-writing options. `diff --output`,
`diff --output=...`, and conservative output aliases such as `-o` are blocked
when shared skills are involved. Shell redirects writing into
`.harness/skills/**` are also blocked. `find` remains outside the read-only
allow-list because `-delete`, `-exec`, `-execdir`, `-fprint*`, and `-fls` expose
write or execution surfaces. `cp` is not generally allowed for shared skills,
including copying from `.harness/skills/**` into `.harness/skills-local/**`; if
that workflow is needed, add an explicit command such as
`./harness skills-local fork <skill-name>` with dedicated checks.

## Hook Enforcement

Narrative policy lives here; execution checks live in
`.harness/hooks/guardrails.mjs`.

Claude Code runs the guardrail hook before Bash, Write, Edit, and MultiEdit
tool use. The hook blocks:

- write-like tool use on protected branches `main` and `dev`
- representative destructive operations listed above
- representative destructive DB statements and reset/drop commands, including
  unbounded `UPDATE` / `DELETE` and destructive `ALTER TABLE`
- secret or environment printing such as `.env` reads, `printenv`, and
  secret-like variable echoes
- production deploy or rollback commands
- downstream writes into `.harness/skills/**` while still allowing read-only
  inspection and safe `diff`

Codex mirrors command-level safety in `.codex/rules/work-safety.rules`.
Branch-aware checks remain in the hook because Codex execpolicy prefix rules
cannot inspect the current branch. Claude's always-loaded narrative mirror is
`.claude/rules/work-safety.md`.

## Decision Notifications

When AI must stop and ask the user to decide, approve, or choose between options,
it should notify the user before or while asking the question.

Use:

```sh
./harness notify-decision "User decision required: <short reason>"
```

Claude Code also runs `.harness/hooks/decision-notifier.mjs` on `Stop`; if the
final assistant message appears to be asking for a decision, it sends a local
notification automatically.

## Commit and PR Text

Commit messages:

```text
<type>: <Korean description>
```

Allowed types:

```text
feat, fix, chore, refactor, docs, style, test, perf
```

PR and issue titles/bodies should be Korean unless external system terms must be
kept in English.
