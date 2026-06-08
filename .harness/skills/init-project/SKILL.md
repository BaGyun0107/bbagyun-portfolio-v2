---
name: init-project
description: Project initialization orchestrator for codi-harness-v2. Use for new monorepo scaffold, apps/front and apps/back setup, importing existing repos into apps/*, Infisical wiring, GitHub Actions deploy paths, and first project push.
---

# Init Project

Use this skill to initialize or normalize a codi-harness-v2 project. It is an
orchestrator skill: keep the spec-driven flow intact, then route implementation
work to `codi-frontend`, `codi-backend`, `nestjs-expert`, and `codi-dev-workflow`
as needed.

Before scaffolding or importing apps, read `.harness/config/project-profile.yaml`.
The profile decides whether `apps/back` is allowed.

## Architecture

The project model is monorepo direct deployment.

- One repository: `codi-{project}`.
- Frontend source: `apps/front`.
- Backend source: `apps/back` only in `split-front-back` mode.
- In `next-fullstack` mode, `apps/front` owns both frontend and backend behavior
  through Next.js.
- Runtime: Node.js 24 via `mise`.
- Package managers: React-only and Express use `npm`; Next.js and NestJS use `pnpm`. Do not use `yarn` or `bun`.
- Front stack: Next.js 16+, React 19+, Tailwind v4, shadcn/ui, better-auth.
- Back stack: Express 5+ or NestJS 11+. If NestJS is selected or detected, load
  `nestjs-expert`.
- Secrets: Infisical at `https://env.co-di.com`. GitHub Secrets should only keep
  `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET`.
- Deployment workflows live in `.github/workflows`.
- Harness scripts live in `.harness/scripts`.

Do not create separate `front-{project}` or `back-{project}` deployment repos.

## Workflow

Follow the harness phase order:

1. Brainstorming: **Ask the user explicitly before any scaffold or import.**
   Do not infer from the file system alone. The Fast Decision Table below is
   a recommendation, not a trigger. Required questions:
   - Is this a brand-new project, or are you importing an existing front
     and/or back repository?
   - If new and the frontend will be scaffolded: which frontend stack —
     **Next.js** or **React-only**? (Skip this question only when
     `project-profile.yaml` mode is `next-fullstack`; then Next.js is forced.)
   - If new and the project profile is `split-front-back`: which backend —
     **Express** or **NestJS**?
   - If importing: which existing GitHub repository (org/name and branch) goes
     into `apps/front` and/or `apps/back`?
   Do not run any scaffold command, any `git subtree add`, or any
   `./harness init-project` invocation until these answers exist.
2. Planning: decide initialization option, deployment method, and Infisical readiness.
3. Execution: scaffold/import/configure in small verified steps.
4. Review: inspect generated files, workflow activation, and secret placeholders.
5. Verification: run local checks and record remaining manual steps.

For detailed step logic, read [flow.md](references/flow.md) only when executing
the initializer.

## Fast Decision Table

This table is a **recommendation, not a trigger**. Always confirm "new vs
import" and stack choice with the user (see Workflow step 1) before applying
any row.

| codi repo | apps/front | apps/back | recommended path |
|---|---:|---:|---|
| missing | missing | missing | scaffold both |
| missing | present | present | skip scaffold, wire repo/secrets |
| present | present | missing | import or scaffold backend |
| present | missing | present | import or scaffold frontend |
| present | present | present | normalize Infisical/CI only |

If a `codi-*` repository already exists and exactly one app is missing, prefer
repository import when the user has an existing separate app repository.

If `project-profile.yaml` is `mode: next-fullstack`, ignore recommendations that
would scaffold or import `apps/back`. Ask the user whether backend behavior
should live in Next.js or whether the profile should change to `split-front-back`.

## Reference Map

- [flow.md](references/flow.md): environment detection, option selection, Infisical,
  git, and script execution.
- [scaffolding.md](references/scaffolding.md): frontend/backend scaffold prompts and
  package script conventions.
- [import-mode.md](references/import-mode.md): `git subtree add` import process.
- [deploy-methods.md](references/deploy-methods.md): Vercel, PM2, Docker, static SPA,
  and workflow activation rules.

Load only the reference needed for the selected path.

## Commands

Use the harness scripts from the repository root:

```bash
./harness doctor
./harness init-project <project-name> --org CODIWORKS-Engineer
./harness wire-infisical <project-name> --org CODIWORKS-Engineer
```

Equivalent direct script:

```bash
.harness/scripts/setup/init-project.sh <project-name> --org CODIWORKS-Engineer
.harness/scripts/setup/wire-infisical.sh <project-name> --org CODIWORKS-Engineer
```

Do not pass Infisical values to `init-project`. After the user finishes the
Infisical console work, run `./harness wire-infisical <project-name>` with
`INFISICAL_PROJECT_ID`, `INFISICAL_CLIENT_ID`, and
`INFISICAL_CLIENT_SECRET` exported. See post-setup checklist §2.3.

## Post-Setup (Required Manual Work)

After `./harness init-project` finishes, several steps cannot be automated and
must be done by the user. These include Infisical console work (project,
environments, paths, Machine Identity), running `./harness wire-infisical` to
register `INFISICAL_CLIENT_ID` / `INFISICAL_CLIENT_SECRET` and replace
`_PROJECT_ID_`, replacing `_CF_SHARED_PATH_` placeholders when Cloudflare Tunnel
is used, and enabling Dependabot / Branch protection / Renovate on the GitHub
repo.

The single source of truth for this checklist is
[`.harness/docs/init-project-post-setup.md`](../../docs/init-project-post-setup.md).
Read it before declaring the project initialized, and link the user to it in
the final report. The closing block of `init-project.sh` also points to the
same file.

## Guardrails

- Do not hardcode real secrets in files, prompts, logs, GitHub Actions, or examples.
- Do not run destructive cleanup for import paths without explicit user approval.
- Do not overwrite non-empty `apps/front` or `apps/back`.
- Do not create or modify `apps/back` in `next-fullstack` mode.
- Do not add direct `push` triggers to deploy workflows. `pipeline.yml` is the
  only automatic CI/CD entrypoint.
- Do not set more than one deployment mode per app; use `FRONTEND_DEPLOY_MODE`
  and `BACKEND_DEPLOY_MODE`.
- Do not bypass `mise` when a mise task exists. Prefer `mise run`, otherwise
  use the stack package manager through `mise exec -- npm ...` or
  `mise exec -- pnpm ...`.
- Keep `_PROJECT_ID_` visible until the user runs `wire-infisical` with the
  correct Infisical Project ID.
- Keep `_CF_SHARED_PATH_` visible unless the selected PM2/Docker deployment uses
  Cloudflare Tunnel. Direct SSH projects do not need this placeholder replaced.
- Do not pass `--push` to `./harness init-project` until the user has reviewed
  the local diff and confirmed the initial main/dev push.
- Use `.harness/scripts/deploy/dev-runner.js` in generated/imported app `dev` and local
  `start` scripts so local `.env` and Infisical both work through the same command.
