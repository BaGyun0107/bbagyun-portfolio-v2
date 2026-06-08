# Monorepo Package Management

This rule applies to every session. It is loaded unconditionally because a
dependency install can happen while working on any file.

## Each app owns its own packages

In a `split-front-back` monorepo, each app under `apps/` is a self-contained
package. It owns its own `package.json`, its own lockfile, and its own
`node_modules`.

- `apps/front` and `apps/back` each keep their own `package.json` and lockfile.
- Run install commands **inside the app directory**, not at the repo root:
  - `cd apps/front && pnpm install`
  - or `pnpm --dir apps/front install` / `npm --prefix apps/front install`
- Do **not** add dependencies to a repo-root `package.json`.
- Do **not** create a root lockfile (`pnpm-lock.yaml`, `package-lock.json`) by
  running an install at the repo root.
- Do **not** introduce a root `pnpm-workspace.yaml` or npm `workspaces` field to
  hoist dependencies up to the root.
- App config files (for example `next.config.ts`) must resolve modules from the
  app's own `node_modules`, never from a root `node_modules` or a root lockfile.

**Why:** hoisting dependencies to the root couples the two apps' dependency
trees, makes per-app deploys and Docker builds resolve the wrong modules, and
produces a root lockfile that does not match how either app is actually built
or shipped. Keeping each app self-contained keeps builds reproducible and
deploys isolated.

## Package manager by stack

The package manager is fixed per stack:

| Target | Stack | Package manager |
| --- | --- | --- |
| `apps/front` | React-only | `npm` |
| `apps/front` | Next.js | `pnpm` |
| `apps/back` | Express | `npm` |
| `apps/back` | NestJS | `pnpm` |

`yarn` and `bun` are not allowed. New projects, dependency installs, and script
commands in docs must follow this table.

## Harness root is the exception

The harness repository root itself uses Node.js 24 and `npm` via `mise` for its
own tooling dependencies. The no-root-install rule above targets downstream
application monorepos that contain an `apps/` directory; it does not apply to
the harness repo's own root install.

## Enforcement

`.harness/hooks/tool-permission-guard.mjs` blocks a root-level install in a
monorepo before it runs. Codex applies the same intent through
`.codex/rules/monorepo-packages.rules`, which marks `install` commands as
`prompt` so a root install surfaces a confirmation first.
