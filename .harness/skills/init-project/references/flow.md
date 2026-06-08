# Init Project Flow

Use this when actually running the initializer. Keep the work spec-driven and
record decisions in the active spec when one exists.

## 0. Detect Context

From the repository root:

```bash
test -f .harness/config/project-profile.yaml
git remote get-url origin
test -f apps/front/package.json
test -f apps/back/package.json
test -f apps/front/.infisical.json
test -f apps/back/.infisical.json
```

Parse `origin` if it matches `github.com/<org>/codi-<project>.git`. If matched,
reuse the detected org/project unless the user corrects it.

Read `.harness/config/project-profile.yaml` before interpreting `apps/back`.

## 0.5 Ask the User (Required Before Any Scaffold or Import)

File-system detection (`apps/front/package.json`, `apps/back/package.json`,
`origin`) only tells you what already exists. It does **not** tell you what the
user wants. Before running any scaffold command, any `git subtree add`, or any
`./harness init-project` invocation, ask the user every question below that is
still unresolved. Use the agent's structured question tool (e.g. Claude Code's
`AskUserQuestion`) when available so the user can select rather than type.

Question 1 — intent:

- Is this a **brand-new project**, or are you **importing an existing
  GitHub repository** for `apps/front` and/or `apps/back`?

Question 2 — frontend stack (only when `apps/front` will be scaffolded fresh):

- Skip this question if `project-profile.yaml` mode is `next-fullstack`
  (Next.js is forced).
- Skip this question if the user chose import for `apps/front`.
- Otherwise ask: **Next.js** or **React-only**?

Question 3 — backend stack (only in `split-front-back` mode when `apps/back`
will be scaffolded fresh):

- Skip this question if the project profile excludes `apps/back`
  (`next-fullstack`, `frontend-only`).
- Skip this question if the user chose import for `apps/back`.
- Otherwise ask: **Express** or **NestJS**? If NestJS, load `nestjs-expert`.

Question 4 — import source (only when import was chosen):

- Existing GitHub repository (org/name) and branch for `apps/front`.
- Existing GitHub repository (org/name) and branch for `apps/back`.

Record the answers in the active spec or `.planning/` notes before proceeding.
Do not infer answers from a partially populated `apps/` tree.

## 1. Choose Path

The Fast Decision Table in `SKILL.md` is a recommendation, not a trigger.
Apply a row only after the questions in section 0.5 are answered.

- No apps: scaffold according to project profile **and** the answers from
  questions 2/3.
- Only front: import or scaffold backend per the user's answer.
- Only back: import or scaffold frontend per the user's answer.
- Both apps: skip scaffold and wire Infisical/GitHub/CI.
- Existing separate repo: use import mode.

If profile mode is `next-fullstack`:

- scaffold only `apps/front`.
- do not scaffold or import `apps/back`.
- route Next.js route handlers, server actions, auth, and API-like logic to
  `codi-frontend`.
- if the user asks for `apps/back`, ask whether to change profile to
  `split-front-back` and record the decision.

When the user chooses "skip scaffold", ask whether source must still be imported
from another GitHub repo. "Already have code" may mean local code or another repo.

## 2. Collect Required Inputs

Required:

- project name, without `codi-` prefix.
- GitHub org, default `CODIWORKS-Engineer`.

Infisical values are not required for `init-project`. The user gets
`INFISICAL_PROJECT_ID`, `INFISICAL_CLIENT_ID`, and
`INFISICAL_CLIENT_SECRET` after the Infisical console work, then runs
`./harness wire-infisical <project-name>`.

Manual Infisical preparation:

- Project: `codi-{project}`.
- Environments: `dev`, `prod`, and local development environment used by the team.
- Paths: `/backend`, `/backend/github-actions`, `/frontend`,
  `/frontend/github-actions`.
- Shared-Secrets access for `/slack` and `/vercel`.
- If PM2/Docker deployment must use Cloudflare Tunnel, also grant access to the
  Cloudflare path that will replace `_CF_SHARED_PATH_` and set
  `USE_CLOUDFLARE_TUNNEL: "true"` in the selected PM2/Docker workflow env.

## 3. Scaffold or Import

For scaffold, read [scaffolding.md](scaffolding.md). Route UI work to
`codi-frontend`.

In `split-front-back` mode, route separate API/backend work to `codi-backend`; if
NestJS is chosen, load `nestjs-expert`.

In `next-fullstack` mode, route Next.js backend behavior to `codi-frontend` and
do not create `apps/back`.

For existing repositories, read [import-mode.md](import-mode.md).

## 4. Write Infisical Config

For each profile-enabled app directory, ensure `.infisical.json` has:

```json
{
  "workspaceId": "<INFISICAL_PROJECT_ID>",
  "defaultEnvironment": "local-dev",
  "gitBranchToEnvironmentMapping": {
    "main": "prod",
    "dev": "dev"
  }
}
```

The scaffold/import state should keep a placeholder here. `wire-infisical`
replaces the `workspaceId` after the user copies the real Project ID from the
Infisical console. If the file is absent, create it during scaffold or before
running final verification.

## 5. Run Initializer

Use:

```bash
./harness init-project <project-name> --org CODIWORKS-Engineer
```

The script:

- creates or reuses `codi-{project}`.
- assigns `codi-engineers` team admin permission when possible.
- leaves automatic CI/CD entrypoint as `.github/workflows/pipeline.yml`.
- sets origin.
- commits and pushes `main` and `dev` only when `--push` is explicitly passed.

The script is intended to be idempotent for existing repos. Do not pass `--push`
until the user has reviewed the diff and confirmed the first remote push.

## 6. Deployment Method

Read [deploy-methods.md](deploy-methods.md) when the user chooses or changes
deployment mode. Defaults:

- Automatic entrypoint: `pipeline.yml`.
- Front: `FRONTEND_DEPLOY_MODE=vercel` by default.
- Back: `BACKEND_DEPLOY_MODE=pm2` by default.
- `deploy-*.yml` files are reusable `workflow_call` units and should not be
  activated directly on `push`.

## 7. Verify

Run what applies:

```bash
./harness doctor
npm install
npx lint-staged --allow-empty
mise exec -- node -v
mise exec -- npm -v
```

For generated apps:

```bash
mise exec -- npm --prefix apps/front run typecheck
mise exec -- npm --prefix apps/front run build
```

Only run `apps/back` commands when the project profile enables `apps/back`.

If app scripts differ, inspect `package.json` and use the closest equivalent.

Root `npm install` activates the shared `husky + lint-staged` pre-commit hook.
Lint runs there on changed files only; CI/CD does not run lint by default.

## 8. Dependency Security

New projects include the shared phase-1 dependency security baseline:

- `renovate.json`
- `.github/workflows/pipeline.yml`
- `.github/workflows/ci-node.yml`
- `.github/workflows/dependency-security.yml`
- `.harness/scripts/checks/ci-node-verify.sh`
- `.harness/scripts/audit/osv-severity-gate.js`

After the repository is pushed, enable these GitHub settings manually:

- Dependency graph.
- Dependabot alerts.
- Branch protection or ruleset requiring `Pipeline` when available.

Private repository + GitHub Free plan projects do not use Code scanning/SARIF
upload by default. OSV results are kept in Actions logs, artifacts, and Slack
alerts.

Install the Renovate GitHub App for the generated repository. Prefer the GitHub
App over a self-hosted Renovate workflow unless immediate manual runs are needed.
See `.harness/docs/dependency-security-automation.md` for the operating policy.

## Completion Notes

Always report:

- repo URL.
- enabled deployment workflows.
- placeholders still requiring manual values.
- Infisical paths the user must fill.
- commands run and failures.
- the post-setup checklist path (see next section), so the user knows what to
  do before the project is actually production-ready.

## 9. Post-Setup

`./harness init-project` covers GitHub repo creation, `codi-engineers` admin
permission, profile/script normalization, and initial `origin` wiring. It does
not consume Infisical environment variables.

Everything below happens after init-project. Console / GUI work remains manual;
Infisical Project ID substitution and bootstrap GitHub Secrets registration are
handled by `wire-infisical` after the console work:

- Infisical project, environments (`dev`, `prod`, `local-dev`), Secret paths
  (`/backend`, `/backend/github-actions`, `/frontend`, `/frontend/github-actions`),
  and team membership.
- Infisical Machine Identity (Universal Auth, TTL 0) and its Read grants on
  this project and on Shared-Secrets (`/slack`, `/vercel`, optional
  `/cloudflare/...`).
- Running `./harness wire-infisical <project-name>` with
  `INFISICAL_PROJECT_ID`, `INFISICAL_CLIENT_ID`, and
  `INFISICAL_CLIENT_SECRET` exported to register GitHub Secrets and replace
  `_PROJECT_ID_`.
- Replacing `_CF_SHARED_PATH_` and setting `USE_CLOUDFLARE_TUNNEL: "true"`
  only when the deployment goes through Cloudflare Tunnel.
- GitHub Actions Variables (`NODE_VERSION`, `OSV_FAIL_ON_SEVERITY`,
  `BACKEND_DEPLOY_MODE`, `FRONTEND_DEPLOY_MODE`).
- GitHub repo settings: Dependency graph, Dependabot alerts, Renovate App,
  Branch protection / ruleset requiring `Pipeline`.
- Vercel project import + Infisical→Vercel integration (only when
  `FRONTEND_DEPLOY_MODE=vercel`).

The full checklist with exact commands and which step is automatic vs manual:
[`.harness/docs/init-project-post-setup.md`](../../../docs/init-project-post-setup.md).
Always include this path in the final report to the user.
