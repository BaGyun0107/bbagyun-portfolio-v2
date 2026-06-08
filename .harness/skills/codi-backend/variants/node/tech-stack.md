# Backend Agent - Tech Stack Reference (Node.js)

## Primary Stack
- **Runtime**: target project Node.js runtime, commonly 20, 22, or 24, managed by the project's runtime files
- **Language**: TypeScript 5.x (strict mode)
- **Package manager**: Express uses npm through `mise exec -- npm ...`; NestJS uses pnpm through `mise exec -- pnpm ...`. Do not use yarn or bun.
- **Framework**: existing Express or NestJS version; for new Codi-scaffolded apps prefer Express 5+ or NestJS 11+
- **ORM**: existing ORM version; for new apps prefer Prisma 6+ or Drizzle ORM
- **Validation**: Zod
- **Database**: PostgreSQL 16+, Redis 7+
- **Auth**: jsonwebtoken, bcrypt
- **Testing**: Vitest or Jest, Supertest
- **Migrations**: Prisma Migrate or Drizzle Kit

## Runtime Compatibility

Detect runtime from app-local `mise.toml`, `.node-version`, `.nvmrc`, `package.json#engines`, or CI config. Do not introduce dependencies, Node built-ins, TypeScript targets, or framework versions that require a newer Node major unless the user approves a runtime upgrade.

## Architecture
```
src/
  modules/          # Feature modules for NestJS
  routes/           # Express routers when using Express
  controllers/      # NestJS controllers or explicit HTTP adapters
  services/         # Business logic
  repositories/     # Data access
  common/           # Shared guards, pipes, interceptors
  prisma/           # Prisma client and schema
```

## Express Conventions
- Keep handlers thin: validate input, call services, map response.
- Put reusable middleware under `src/common` or `src/middleware`.
- Centralize error handling in one error middleware.
- Use `supertest` for endpoint integration tests.

## NestJS Conventions
- If `@nestjs/core`, `nest-cli.json`, or `*.module.ts` is present, load `../nestjs-expert/SKILL.md`.
- Preserve module/provider boundaries and use DI instead of manual singletons.
- Validate DTOs with pipes or the project's existing validation pattern.
- Validate in this order: `mise run typecheck`, unit tests, integration/e2e tests.

## Security Requirements
- Password hashing: bcrypt (cost factor 10-12)
- JWT: 15min access tokens, 7 day refresh tokens
- Rate limiting on auth endpoints
- Input validation with Zod schemas
- Parameterized queries via ORM (never raw string interpolation)

## Linter/Formatter
- **ESLint**: with @typescript-eslint
- **Prettier**: consistent formatting
- **Biome**: alternative all-in-one (lint + format)
