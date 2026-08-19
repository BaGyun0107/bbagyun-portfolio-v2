# Infisical 가이드

> **shared 하네스 문서입니다.** 다운스트림 프로젝트는 직접 수정하지 않습니다.

시크릿의 원본은 Infisical(`https://env.co-di.com`)이고, GitHub Secrets는
최소화합니다.

## GitHub Secrets

아래 두 개만 둡니다. 나머지 시크릿은 Infisical에서 관리합니다.

```text
INFISICAL_CLIENT_ID
INFISICAL_CLIENT_SECRET
```

## Infisical 경로

| 경로                             | 용도                                                 |
| -------------------------------- | ---------------------------------------------------- |
| `/backend`                       | 백엔드 런타임 환경변수                               |
| `/backend/github-actions`        | 백엔드 배포 변수                                     |
| `/frontend`                      | 프론트엔드 런타임 환경변수                           |
| `/frontend/github-actions`       | 프론트엔드 배포 변수                                 |
| Shared-Secrets `/slack`          | Slack 알림                                           |
| Shared-Secrets `/vercel`         | Vercel 토큰                                          |
| Shared-Secrets의 Cloudflare 경로 | Cloudflare Tunnel을 쓰는 PM2/Docker 배포의 Access 값 |

## 로컬 개발

Infisical CLI가 설치/로그인되어 있고 앱의 `.infisical.json`이 유효하면
`dev-runner`가 자동으로 `infisical run`을 사용합니다.

```sh
infisical login --domain=https://env.co-di.com
```

Vercel 배포와 Infisical secret 동기화는
[vercel-infisical-secret-sync.md](./vercel-infisical-secret-sync.md) 참고.
