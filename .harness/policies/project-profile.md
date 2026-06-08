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

## Required Behavior

Before creating files:

1. Check the project profile.
2. If `mode: next-fullstack` or `mode: frontend-only`, reject or ask before any
   action that would create or modify `apps/back/**`.
3. If `mode: backend-only`, reject or ask before any action that would create or
   modify `apps/front/**`.
4. If the user asks for a backend in `next-fullstack` mode, clarify whether they
   want Next.js backend behavior inside `apps/front` or a profile change to
   `split-front-back`.
5. If the user asks for backend/API work in `frontend-only` mode, confirm whether
   the project profile should change before implementation.
6. If the user asks for frontend/UI work in `backend-only` mode, confirm whether
   the project profile should change before implementation.
7. Changing the profile requires an architecture decision in
   `.planning/`.

Claude Code also runs `.harness/hooks/project-profile-guard.mjs` before Bash
tool use. When the profile is `next-fullstack` or `frontend-only`, this hook
blocks tool inputs that target `apps/back`. When the profile is `backend-only`,
this hook blocks tool inputs that target `apps/front`.

Use `./harness profile list`, `./harness profile show`, and
`./harness profile set <mode>` to inspect or change the official profile
templates.

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
