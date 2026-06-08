# Deployment Methods

Use this when selecting or changing CI/CD deployment mode.

## Workflow Files

```text
.github/workflows/
  pipeline.yml
  deploy-frontend-vercel.yml
  deploy-frontend-pm2.yml
  deploy-frontend-docker.yml
  deploy-backend-pm2.yml
  deploy-backend-docker.yml
```

Default deployment modes:

- Frontend: `FRONTEND_DEPLOY_MODE=vercel`.
- Backend: `BACKEND_DEPLOY_MODE=pm2`.

Only `pipeline.yml` should react to `push`, `pull_request`, schedule, and manual
dispatch. The deploy workflows are `workflow_call` implementation units.

## One Deploy Mode Per App

Frontend may use exactly one:

- Vercel: `deploy-frontend-vercel.yml`.
- PM2 SSR: `deploy-frontend-pm2.yml` with `FRONT_APP_TYPE=pm2`.
- Static SPA: `deploy-frontend-pm2.yml` with `FRONT_APP_TYPE=static`.
- Docker: `deploy-frontend-docker.yml`.

Backend may use exactly one:

- PM2: `deploy-backend-pm2.yml`.
- Docker: `deploy-backend-docker.yml`.

Do not add direct `push` triggers to deploy workflows. Switch modes with
repository variables:

```text
BACKEND_DEPLOY_MODE=pm2|docker|none
FRONTEND_DEPLOY_MODE=vercel|pm2|docker|none
```

## Infisical Paths

Project:

```text
/backend
/backend/github-actions
/frontend
/frontend/github-actions
```

Shared-Secrets:

```text
/slack
/vercel
/_CF_SHARED_PATH_ replacement path, such as /cloudflare/<domain>/<subdomain>
```

Cloudflare access is optional for PM2/Docker deployments. Set
`USE_CLOUDFLARE_TUNNEL: "true"` in the selected workflow env only for projects
that must reach the target server through Cloudflare Access. If the flag is
`"false"`, workflows connect directly to `FRONT_TARGET_HOST` or `BACK_TARGET_HOST`.

GitHub Secrets:

```text
INFISICAL_CLIENT_ID
INFISICAL_CLIENT_SECRET
```

## Server Deploy Script

For PM2/static server deployments, place this file on the target server once:

```bash
scp .harness/scripts/deploy/server-deploy.sh <user>@<server>:~/server-deploy.sh
ssh <user>@<server> "chmod +x ~/server-deploy.sh"
```

Usage on server:

```bash
~/server-deploy.sh <BASE_PATH> <TAR_FILE> <APP_NAME> <development|production> <pm2|static>
```

Static mode only swaps `current`; Nginx should already serve the appropriate
`current` path.

## Switching Method

1. Set `BACKEND_DEPLOY_MODE` or `FRONTEND_DEPLOY_MODE` to the target mode.
2. Run `Pipeline` manually with `workflow_dispatch`.
3. If successful, push to `dev` and verify that `Pipeline` runs one deploy job
   for the selected app.

If switching fails immediately, revert the workflow change commit.
