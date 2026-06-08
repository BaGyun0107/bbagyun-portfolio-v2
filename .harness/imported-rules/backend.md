---
description: Node.js backend API coding standards with clean architecture for Express and NestJS
globs:
alwaysApply: false
---

# Backend Coding Standards

## Core Rules

1. **Clean architecture**: router/controller -> service -> repository -> models
2. **No business logic in route handlers or controllers**
3. **All inputs validated** with your stack's validation library
4. **Parameterized queries only** (never string interpolation)
5. **JWT + bcrypt for auth**; rate limit auth endpoints
6. **Async where supported**; type annotations on all signatures
7. **Custom exceptions** via centralized error module (not raw HTTP exceptions)
8. **Explicit ORM loading strategy**: do not rely on default relation loading when query shape matters
9. **Explicit transaction boundaries**: group one business operation into one request/service-scoped unit of work
10. **Safe ORM lifecycle**: do not share mutable ORM session/entity manager across concurrent work unless ORM explicitly supports it
11. **Config from environment, with graceful fallback**: DB URLs, API keys, secrets from env vars or secret managers, never hardcode. When integrating a third-party API (OpenAI, Anthropic, Stripe, etc.), write BOTH paths: (a) real call when `process.env.<KEY>` is present, (b) deterministic local fallback when absent. Mark the deferred branch with `// TODO(codi-deferred): integrate <vendor> when key is provisioned`. Shipping only the fallback (no env-conditional branch) leaves the spec unmet; shipping only the real call without fallback breaks demos when the key is missing.
12. **Stateless services**: no in-memory session or user state between requests — use external stores
13. **Backing services as resources**: DB, queue, cache are swappable resources connected via config

## Data, Auth, and External Side Effects

1. Production data reads require approval. Prefer counts, schemas, aggregates,
   redacted logs, or synthetic samples over raw records.
2. Do not log or return secrets, tokens, cookies, session IDs, DB URLs, SQL
   text, stack traces, internal paths, or provider raw errors to clients.
3. Authentication and authorization are separate concerns. Derive user,
   account, tenant, and role identity from server-verified context, not client
   input.
4. Admin, role, permission, ownership, billing, and credential changes need
   audit logs and integration tests.
5. Payment capture/refund, SMS/email/push send, production webhook replay, and
   high-cost API calls require sandbox/dry-run/mock paths by default, explicit
   approval for live targets, idempotency for retries, and rate/budget guards.
6. Test fixtures, snapshots, and seed data must be synthetic or anonymized.

## Architecture

## Runtime

- Use the target backend app's Node.js runtime from app-local `mise.toml`, `.node-version`, `.nvmrc`, `package.json#engines`, or CI config
- The harness itself uses Node.js 24, but backend app code may target Node.js 20, 22, or 24
- Express apps use npm through `mise exec -- npm ...`
- NestJS apps use pnpm through `mise exec -- pnpm ...`
- Do not use yarn or bun
- Preserve the project's existing Express/NestJS/runtime versions unless the task explicitly includes an upgrade
- For new Codi-scaffolded backend apps, prefer Node.js 24 with Express 5+ or NestJS 11+ when compatible with project constraints
- For NestJS work, load `nestjs-expert`

```
Router or Controller (HTTP) → Service (Business Logic) → Repository (Data Access) → Models
```

## Principles

- **DRY**: Business logic in Service, data access in Repository
- **Single Responsibility**: Classes and functions should have one responsibility
- **Dependency Inversion**: Use your framework's DI mechanism
- **KISS**: Keep it simple and clear
