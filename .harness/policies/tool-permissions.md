# Tool Permission Policy

This policy defines the resolution order for MCP, Bash, file edits, deploys,
secrets, and database operations. Codex and Claude Code must apply the same
criteria.

The shape borrows from MCP configs that separate rule layers (such as
`.claude/rules/`) and manage team-scoped access declaratively. In this harness,
`.harness/config/tool-permissions.json` is the declarative source of truth, and
Claude Code uses `.claude/settings.json` hooks to block specific policies before
execution.

## Source of Truth

- Permission declarations: `.harness/config/tool-permissions.json`
- Dangerous command blocks: `.harness/hooks/guardrails.mjs`
- Project structure blocks: `.harness/hooks/project-profile-guard.mjs`
- Package manager and select MCP blocks: `.harness/hooks/tool-permission-guard.mjs`
- Claude Code hook wiring: `.claude/settings.json`
- Monorepo package rules (Claude Code): `.claude/rules/monorepo-packages.md`
- Monorepo package rules (Codex execpolicy): `.codex/rules/monorepo-packages.rules`
- Work safety rules (Claude Code): `.claude/rules/work-safety.md`
- Work safety rules (Codex execpolicy): `.codex/rules/work-safety.rules`
- Human-readable policy: `.harness/policies/guardrails.md` and this document

`.harness/imported-rules` is reading material for agents. Automatic blocks live
in hooks and config.

## Permission Priority

Apply in order:

1. `explicit_user_decision`: explicit approval or refusal for the current task
2. `permanent_deny`: operations an agent must never perform, such as
   `gh pr merge`
3. `approval_required`: dangerous operations such as `rm -rf`, force-push,
   `git reset --hard`, `DROP TABLE`, `git clean`, and production deploys or
   rollbacks
4. `project_profile_boundary`: structural limits — for example, no edits to
   `apps/back` under `next-fullstack`/`frontend-only`, and no edits to
   `apps/front` under `backend-only`
5. `role_or_team_policy`: per-role MCP/tool access policies for frontend,
   backend, security, admin
6. `package_manager_policy`: per-stack package manager policy
7. `tool_specific_ask_policy`: sensitive but not forbidden operations require
   asking the user
8. `default_least_privilege`: when unclear, apply least privilege and ask

When several rules apply, deny beats allow, and a more specific rule beats a
broader one. Production work, secret access, data deletion, and Git history
rewrites never run automatically. Codex execpolicy should use `prompt` for
approval-required command prefixes where possible; Claude hooks block
representative dangerous commands as a pre-approval stop because they do not
receive a durable approval grant.

## Package Manager Policy

The harness itself uses Node.js 24 and npm via `mise`. App code follows the
Node.js runtime declared by each app.

Allowed app package managers:

| Target | Stack | Package manager |
| --- | --- | --- |
| `apps/front` | React-only | `npm` |
| `apps/front` | Next.js | `pnpm` |
| `apps/back` | Express | `npm` |
| `apps/back` | NestJS | `pnpm` |

Do not use `yarn` or `bun`. New projects, dependency installs, and script
commands in docs must follow the table.

### Monorepo: no root hoisting

In a `split-front-back` monorepo, each app under `apps/` is a self-contained
package and owns its own `package.json`, lockfile, and `node_modules`.

- Run install commands inside the app directory (`cd apps/front && pnpm install`,
  `pnpm --dir apps/front install`, or `npm --prefix apps/front install`), not
  at the repo root. Codex prefix rules cannot inspect cwd, so prefer the
  `--dir` / `--prefix` forms in examples and automation when practical.
- Do not add dependencies to a repo-root `package.json`, create a root
  lockfile, or introduce a root `pnpm-workspace.yaml` / npm `workspaces` field
  to hoist dependencies.
- App config files such as `next.config.ts` must resolve modules from the app's
  own `node_modules`.

This keeps per-app builds and deploys reproducible and isolated. The harness
repo root itself is exempt — it installs its own tooling dependencies with npm
via `mise`. `.harness/hooks/tool-permission-guard.mjs` enforces this only when
`apps/*/package.json` exists, so it never blocks the harness root install.
`tool-permissions.json` declares this with `no_root_install` and
`app_install_dirs`.

## MCP Access Model

Grant MCP permissions narrowly by role.

| Role | Default direction |
| --- | --- |
| `frontend` | UI, docs, design-related MCPs. Database writes and secret writes are forbidden. |
| `backend` | API and database-read focused. Database writes and production deploys require user approval. |
| `security` | Audit and metadata reads. Reading secret values requires user approval. |
| `admin` | Broad access, but production, destructive, and history-rewriting operations require user approval. |

The role is set via `CODI_AGENT_ROLE` or `CODI_TEAM_ROLE`. If neither is set,
the `default` role applies.

Database operations are split by blast radius:

- Database reads are allowed only for roles that need them, and otherwise
  require user approval.
- Database writes require user approval for backend/admin roles and are denied
  for frontend roles.
- Database drop/reset/destructive DDL operations are denied for backend and
  frontend roles. Admin roles still require explicit user approval and a
  concrete target, backup/restore plan, and rollback or roll-forward strategy.
- Bash-based database CLIs and migration reset/drop tools are also governed by
  `.harness/policies/guardrails.md`, `.harness/hooks/guardrails.mjs`, and
  `.codex/rules/work-safety.rules`.

Production data and external side effects are separate approval surfaces:

- Production data reads require approval even when they are read-only.
- PII, auth/session/token, payment, and customer-support records require
  approval and redaction/minimization before leaving the source system.
- Payment capture/refund, SMS/email/push send, production webhook replay,
  customer sync, and high-cost API calls require approval unless scoped to a
  sandbox, dry-run, preview, or mock target.
- MCP tools that can mutate external systems or send user-visible messages
  should be treated like production writes unless the tool name and target prove
  otherwise.

## Implementation Notes

Claude Code uses PreToolUse hooks to block some policies before execution.
Codex must follow the same policies as guidance, and will reuse the same config
once Codex exposes equivalent hook events.

If a block decision is ambiguous, do not run the operation; send a notification
with `./harness notify-decision "<reason>"` and ask the user.

## Reference

- https://devcheolu.com/posts/mcMhWaiohwXtncbVrU86
