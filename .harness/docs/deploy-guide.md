# 배포 가이드

> **shared 하네스 문서입니다.** 다운스트림 프로젝트는 직접 수정하지 않습니다.

GitHub Actions 워크플로우는 `.github/workflows` 아래에 있습니다.

## 워크플로우 종류

| 종류     | 워크플로우                                                                            |
| -------- | ------------------------------------------------------------------------------------- |
| Frontend | `deploy-frontend-vercel.yml`, `deploy-frontend-pm2.yml`, `deploy-frontend-docker.yml` |
| Backend  | `deploy-backend-pm2.yml`, `deploy-backend-docker.yml`                                 |

기본값은 Frontend Vercel, Backend PM2입니다. 한 앱에 대해 `push`로 활성화된
배포 워크플로우는 하나만 있어야 합니다.

## 서버 배포 스크립트

PM2 또는 static 배포 서버에는 공용 서버 배포 스크립트를 1회 배치합니다.

```sh
scp .harness/scripts/deploy/server-deploy.sh <user>@<server>:~/server-deploy.sh
ssh <user>@<server> "chmod +x ~/server-deploy.sh"
```

## Cloudflare Tunnel SSH

Cloudflare Tunnel SSH 구성이 필요하면 PM2/Docker 워크플로우의 top-level
env에서 `USE_CLOUDFLARE_TUNNEL: "true"`로 바꾸고
[cloudflare-tunnel-ssh-guide.md](./cloudflare-tunnel-ssh-guide.md)를
참고합니다.
