# Scaffolding Guide

Use this for new app creation. Prefer the framework generator output and existing
repo conventions. This reference must not force app-internal utility files,
helper layers, or directory trees unless the selected stack skill explicitly
requires them for the requested project.

Read `.harness/config/project-profile.yaml` before scaffolding.

## Frontend

Route to `codi-frontend`.

Next.js baseline constraints:

- Node.js 24 through `mise`.
- Next.js 16+ App Router.
- React 19+.
- pnpm through `mise exec -- pnpm ...`.
- TypeScript strict.
- Tailwind v4.
- shadcn/ui.
- better-auth when auth is needed.
- FSD-lite is preferred when the project needs feature organization, but do not
  create a full FSD tree by default.

Next.js recommended command:

```bash
mise exec -- pnpm create next-app@latest apps/front --typescript --tailwind --eslint --app --src-dir --use-pnpm
```

React-only baseline constraints:

- Node.js 24 through `mise`.
- React 19+ when compatible with the selected runtime.
- npm through `mise exec -- npm ...`.
- TypeScript strict.
- Follow the selected router/bundler; Vite is the default only for new React-only apps.

React-only recommended command:

```bash
mise exec -- npm create vite@latest apps/front -- --template react-ts
```

Install project dependencies only after reading the generated `package.json` and
confirming what the project actually needs. Use pnpm for Next.js and npm for
React-only apps. Do not use yarn or bun.

Required `package.json` script behavior:

- Local server scripts must route through `.harness/scripts/deploy/dev-runner.js`.
  At minimum this means `dev`; for React/CRA/Vite-style apps where `start`
  starts the local dev server, `start` must also use `dev-runner.js`.
- Keep generator-provided `build`, `start`, `lint`, and TypeScript scripts when
  they are valid and do not bypass local Infisical injection.
- Add `typecheck` or `check` only if the project has TypeScript/lint tooling
  configured.

Example:

```json
{
  "dev": "node ../../.harness/scripts/deploy/dev-runner.js frontend next dev",
  "build": "next build",
  "start": "node ../../.harness/scripts/deploy/dev-runner.js frontend next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "check": "tsc --noEmit && eslint ."
}
```

If `.harness/scripts` will not exist in the target repository after initialization,
copy the harness scripts as part of the project template before relying on these
paths.

## Backend

Only scaffold `apps/back` when project profile mode is `split-front-back`.

In `next-fullstack` mode, do not scaffold `apps/back`. Backend behavior belongs
inside `apps/front` using Next.js route handlers, server actions, server
components, and server-only modules. Route that work to `codi-frontend`.

When `split-front-back` is active, route backend work to `codi-backend`. Ask the
user or infer whether the backend should be Express or NestJS. If NestJS is
selected or detected, load `nestjs-expert`.

Express baseline constraints:

- Express 5+.
- npm through `mise exec -- npm ...`.
- TypeScript strict.
- Zod environment validation.
- pino logging with sensitive value redaction.
- helmet, cors, cookie-parser, rate limiting.
- Vitest and Supertest for tests.

NestJS baseline constraints:

- NestJS 11+.
- pnpm through `mise exec -- pnpm ...`.
- `@nestjs/config` with schema validation.
- controllers/services/modules aligned with Nest conventions.
- e2e and unit tests through the Nest testing package.

Do not create `utils`, `repositories`, `controllers`, `middleware`, `BaseController`,
Prisma, auth helpers, or logging abstractions by default. Add those only when the
project request, selected framework, or loaded stack skill makes them necessary.

Required `package.json` script behavior for Express-style apps:

- Local server scripts must route through `.harness/scripts/deploy/dev-runner.js`.
  At minimum this means `dev`; for legacy Express apps where `start` is the
  local nodemon/server command, `start` must also use `dev-runner.js`.
- Keep scripts minimal and executable.
- Add database, migration, or auth scripts only when those capabilities are
  actually part of the initial project.

Example:

```json
{
  "dev": "node ../../.harness/scripts/deploy/dev-runner.js backend tsx watch src/server.ts",
  "build": "tsc",
  "start": "node ../../.harness/scripts/deploy/dev-runner.js backend node dist/server.js",
  "test": "vitest run",
  "typecheck": "tsc --noEmit",
  "check": "npm run typecheck && npm run test"
}
```

For NestJS, keep the Nest CLI generated structure and script names, but route
`dev` through `dev-runner.js`:

```json
{
  "dev": "node ../../.harness/scripts/deploy/dev-runner.js backend nest start --watch",
  "build": "nest build",
  "start": "node ../../.harness/scripts/deploy/dev-runner.js backend node dist/main.js",
  "test": "jest",
  "test:e2e": "jest --config ./test/jest-e2e.json"
}
```

## Lint & Format Setup

Each app under `apps/*` may already carry committed `eslint.config.*` and
`.prettierrc` files. These committed files are the authoritative lint/format
configuration for that app and must be preserved across scaffolding.

Framework generators emit their own lint config:

- `create-next-app --eslint` writes an `eslint.config.mjs`.
- `create vite --template react-ts` writes an `eslint.config.js`.
- The NestJS CLI writes an `eslint.config.mjs`.

When a generator runs in a directory that already has a committed
`eslint.config.*`, follow this order:

1. Before scaffolding, record whether `apps/<app>/eslint.config.*` and
   `apps/<app>/.prettierrc` already exist.
2. Run the framework generator as usual.
3. If the app already had a committed `eslint.config.*`, remove the
   generator-produced eslint config and any generator-added `.eslintrc*`,
   then restore the committed `eslint.config.*`. The committed file wins.
   Do not leave two eslint config files (for example both `.js` and `.mjs`)
   in the same app.
4. Keep the committed `.prettierrc`. Generators do not normally write a
   `.prettierrc`; if one appears, remove it and keep the committed file.
5. Do not edit the contents of the committed `eslint.config.*` or
   `.prettierrc` during initialization. Configuration tuning is a separate,
   explicit task.

Dependencies and scripts:

- After restoring the committed eslint config, read its `import` statements
  and install exactly the eslint packages it references into that app
  (`eslint`, `@eslint/js`, `typescript-eslint`, `globals`, and any plugins
  such as `eslint-plugin-react-hooks` or `@next/eslint-plugin-next`).
  Use the stack package manager: `pnpm` for Next.js and NestJS, `npm` for
  React-only and Express.
- Install `prettier` as a dev dependency in each app.
- Keep generator-provided `lint` scripts when they remain valid against the
  committed config. Add a `format` script: `"format": "prettier --write ."`.
- `eslint` covers code quality and `prettier` covers formatting; keep them as
  separate steps. Do not wire `eslint-plugin-prettier` unless the committed
  eslint config already depends on it.

lint-staged at the repository root:

- The root `lint-staged.config.mjs` runs `eslint` and `prettier` per app.
  It guards on each app's `node_modules/.bin`, so lint/format only runs once
  the app has installed its dependencies. No change is needed there during
  scaffolding; installing the app dependencies activates the hooks.

Verification:

- After install, run the app `lint` script and `prettier --check .` in each
  app and confirm both resolve their config without `Cannot find module`
  errors. Record any remaining failures in the spec rather than silencing them.
- If a committed `eslint.config.*` enables type-aware rules (it sets
  `projectService: true` or `parserOptions.project`), confirm the app has a
  valid `tsconfig.json` before running lint. Type-aware rules fail without it.

## Shared Files

Each app should have:

- `.env.example`.
- `.infisical.json`.
- build/test scripts.
- deployment-ready files only when they are actually supported.

For backend PM2 deployment, create a working `ecosystem.config.js` only when PM2
is the selected deployment path.

For Docker deployment readiness, create real `Dockerfile` and `docker-compose.yml`
only when Docker is selected or explicitly requested. Do not create placeholder
Docker files that give a false sense of readiness.
