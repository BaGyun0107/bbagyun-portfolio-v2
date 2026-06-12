---
description: Node.js backend API coding standards with clean architecture for Express and NestJS
globs:
alwaysApply: false
---

# Backend Coding Standards

## Core Rules

The canonical backend Core Rules (1-13, including the codi-deferred third-party
fallback contract in rule 11) live in `../skills/codi-backend/SKILL.md`.

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

## Principles

The clean-architecture layer diagram and the DRY / SOLID / KISS principles are
canonical in `../skills/codi-backend/SKILL.md` (Architecture Pattern and
Guardrails sections).
