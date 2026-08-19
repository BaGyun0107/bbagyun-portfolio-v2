# Project Profile Policy

The project profile is the source of truth for which application surfaces are
allowed. Read `.harness/config/project-profile.yaml` before routing work that
could touch `apps/front` or `apps/back`.

## Modes

### `split-front-back`

Use when the project has a separate frontend and backend.

- `apps/front`: frontend UI, Next.js app, frontend integration.
- `apps/back`: Express or NestJS backend.
- Frontend work uses `codi-frontend`.
- Backend work uses `codi-backend`.
- NestJS work also loads `nestjs-expert`.
- No app path is disabled by this profile.

### `next-fullstack`

Use when the project is a single full-stack Next.js app under `apps/front`.

- `apps/front`: UI and backend behavior.
- Next.js route handlers, server actions, server components, auth, and API-like
  logic live under `apps/front`.
- `apps/back` is disabled.
- Do not create files under `apps/back`.
- Do not route Next.js backend behavior to `codi-backend`.
- Use `codi-frontend` for full-stack Next.js work.
- Use `codi-db` only for database schema/query work, not for creating `apps/back`.

### `frontend-only`

Use when the project has only a frontend app and no backend/API surface.

- `apps/front`: frontend UI and client integration.
- `apps/back` is disabled.
- Do not create files under `apps/back`.
- Do not route backend work to `codi-backend`.
- If backend behavior is requested, confirm whether the project profile should
  change before implementation.

### `backend-only`

Use when the project has only a backend/API app and no frontend/UI surface.

- `apps/back`: API, backend, server, Express, or NestJS work.
- `apps/front` is disabled.
- Do not create files under `apps/front`.
- Do not route frontend work to `codi-frontend`.
- If frontend UI behavior is requested, confirm whether the project profile
  should change before implementation.

### `planning-only`

Use when the repository holds planning sources only (feature definitions,
sitemap, decisions, attachments) — for example a planning hub repository.

- `apps/front` and `apps/back` are both disabled.
- Do not create files under `apps/front` or `apps/back`.
- Do not route work to `codi-frontend` or `codi-backend`.
- Feature-definition work uses `codi-feature-definition-authoring`,
  `codi-feature-definition-normalizer`, and `codi-feature-hub`.
- If implementation work is requested, it belongs in the downstream
  application repository, not a profile change.

### `php-monolith`

Use when the project is a PHP monolith — typically a Gnuboard5/YoungCart
shopping mall — with no Node.js app surface.

- Mall code lives under `apps/<mall>/` (any directory name other than
  `front`/`back`; one repo per mall by convention).
- `apps/front` and `apps/back` are both disabled.
- Do not create files under `apps/front` or `apps/back`.
- Do not route work to `codi-frontend` or `codi-backend`; PHP mall work
  uses `codi-gnuboard` (structure, git onboarding, local Docker
  environment, e2e suite wiring).
- Do not assume npm/pnpm package management for the mall code.
- If Node.js app work is requested, confirm whether the project profile
  should change before implementation.

## Required Behavior

Before creating files:

1. Check the project profile.
2. If `mode: next-fullstack` or `mode: frontend-only`, reject or ask before any
   action that would create or modify `apps/back/**`.
3. If `mode: backend-only`, reject or ask before any action that would create or
   modify `apps/front/**`.
3b. If `mode: planning-only`, reject any action that would create or modify
   `apps/front/**` or `apps/back/**`; implementation belongs downstream.
3c. If `mode: php-monolith`, reject any action that would create or modify
   `apps/front/**` or `apps/back/**`; mall code lives under `apps/<mall>/`
   and routes through `codi-gnuboard`.
4. If the user asks for a backend in `next-fullstack` mode, clarify whether they
   want Next.js backend behavior inside `apps/front` or a profile change to
   `split-front-back`.
5. If the user asks for backend/API work in `frontend-only` mode, confirm whether
   the project profile should change before implementation.
6. If the user asks for frontend/UI work in `backend-only` mode, confirm whether
   the project profile should change before implementation.
7. Changing the profile requires an architecture decision in
   `ARCHITECTURE.md` or the relevant spec (`plan.md`).

Claude Code runs `.harness/hooks/project-profile-guard.mjs` before Bash tool
use, and the Codex PreToolUse adapter (`.harness/hooks/codex-pretooluse.mjs`)
runs the same guard so both runtimes enforce identical app-surface blocks.
When the profile is `next-fullstack` or `frontend-only`, this hook
blocks tool inputs that target `apps/back`. When the profile is `backend-only`,
this hook blocks tool inputs that target `apps/front`. When the profile is
`planning-only` or `php-monolith`, this hook blocks tool inputs that target
either Node app surface. The `php-monolith` routing narrative is mirrored
per runtime: `.claude/rules/php-monolith.md` (path-scoped to `**/*.php`)
and `.codex/rules/php-monolith.rules` (always-on narrative + read-only
`php -l` allow).

Use `./harness profile list`, `./harness profile show`, and
`./harness profile set <mode>` to inspect or change the official profile
templates.

## Developer Role (Per-Machine Write Scope)

The project profile describes the **project**; the developer role describes
the **person on this machine**. In `split-front-back` teams where one
developer owns the frontend and another owns the backend, each developer
scopes their local agents once per clone:

```sh
./harness role front      # this machine: apps/back becomes write-protected
./harness role back       # this machine: apps/front becomes write-protected
./harness role fullstack  # this machine: both surfaces allowed
./harness role show       # current marker
./harness role clear      # remove the marker (no restriction)
```

The marker lives in `.harness/state/dev-role` (git-ignored), so it never
propagates through commits and each machine can differ. A missing marker
means no restriction (a one-time hint is shown on the first app-surface
write). Scaling is per-clone: any number of developers each run one command.

Semantics, enforced by `project-profile-guard.mjs` on both runtimes:

- **Writes are blocked, reads always pass.** The API contract-first flow
  (`api-contract-first.md`) depends on frontend sessions reading
  `apps/back` schema files — the role guard must never block reads.
- Write tools (Write/Edit/MultiEdit) are judged by normalized file path
  only, so merely *mentioning* the other surface inside file content
  never blocks.
- Bash is judged by write-shaped patterns (redirects into the surface,
  `cp`/`mv`/`rm`/`sed -i`/package installs/git worktree rewrites that
  mention the surface). This is a navigate-by-mistake defense with the
  same out-of-scope classes as the shared-skill guard (variable
  indirection, ANSI-C quoting); PR review remains the backstop.
- Codex asymmetry: the Codex PreToolUse adapter forwards Bash-shaped
  tools only, so on Codex the role guard covers shell writes but not
  `apply_patch` edits. Claude covers both. Same pilot scope as the other
  guards.

## Examples

Allowed in `split-front-back`:

```text
apps/front/**
apps/back/**
```

Allowed in `next-fullstack`:

```text
apps/front/src/app/api/**
apps/front/src/app/**/actions.ts
apps/front/src/server/**
apps/front/src/lib/server/**
```

Forbidden in `next-fullstack`:

```text
apps/back/**
```

Forbidden in `frontend-only`:

```text
apps/back/**
```

Forbidden in `backend-only`:

```text
apps/front/**
```

Allowed in `php-monolith`:

```text
apps/<mall>/**   # e.g. apps/bzmall/**, any name other than front/back
```

Forbidden in `php-monolith`:

```text
apps/front/**
apps/back/**
```
