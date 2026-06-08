# init-project Post-Setup 체크리스트

`./harness init-project` 실행 직후 사람이 손으로 처리해야 하는 일을 한 곳에 모은 정본 문서. `init-project`는 GitHub 레포 생성과 팀 권한까지만 처리하고, Infisical 콘솔 작업이 끝난 뒤 `./harness wire-infisical`로 워크플로우 placeholder 치환과 Secrets 등록을 따로 처리한다. **Infisical 콘솔/Cloudflare/GitHub 저장소 설정 같은 외부 서비스 GUI 작업은 자동화 대상이 아니다.**

> Cloudflare Tunnel 상세는 `.harness/docs/cloudflare-tunnel-ssh-guide.md`, 의존성 보안 자동화 상세는 `.harness/docs/dependency-security-manual-setup.md` 참고.

---

## 1. init-project가 자동으로 처리한 일

스크립트가 끝났다면 아래는 이미 끝난 상태다. 수동 재확인 불필요.

- GitHub 레포 `<org>/codi-<project>` 생성 또는 재사용
- `codi-engineers` 팀에 admin 권한 부여 시도
- `origin` remote 설정
- `--push` 옵션을 직접 준 경우에 한해 `main`/`dev` 초기 push

Infisical 배선과 `--push`를 안 준 경우는 아래 2.x / 3 단계에서 대응한다.

---

## 2. 사람이 해야 하는 일 (필수)

### 2.1 Infisical 콘솔 — 프로젝트/환경/경로/팀원 설정

`https://env.co-di.com` 접속 후 진행.

**프로젝트 생성**

- New Project → `codi-<project>`
- Project Settings → **Copy Project ID** (Step 2.3에서 사용)

**환경(Environments) 생성**

- `dev`
- `prod`
- `local-dev`
- `local-prd`

**Secret 경로(Paths) 생성과 값 채우기**

| 경로                                    | 용도                   | 필수 키                                                                                                                                                                                |
| --------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/backend`                              | 백엔드 런타임 환경변수 | 앱이 쓰는 환경변수 전체                                                                                                                                                                |
| `/backend/github-actions`               | 백엔드 배포 변수       | `BACK_TARGET_HOST`, `BACK_TARGET_PORT`, `BACK_SERVER_USER`, `BACK_DEPLOY_DIR`, `BACK_APP_NAME`, `BACK_TAR_FILE`, `BACK_SSH_PRIVATE_KEY`, `BACK_APP_TYPE` (기본 `pm2`)                  |
| `/frontend`                             | 프론트 런타임 환경변수 | `NEXT_PUBLIC_*` 등                                                                                                                                                                     |
| `/frontend/github-actions` (Vercel)     | Vercel 배포 변수       | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`                                                                                                                                                   |
| `/frontend/github-actions` (PM2/Docker) | 서버 배포 변수         | `FRONT_TARGET_HOST`, `FRONT_TARGET_PORT`, `FRONT_SERVER_USER`, `FRONT_DEPLOY_DIR`, `FRONT_APP_NAME`, `FRONT_TAR_FILE`, `FRONT_SSH_PRIVATE_KEY`, `FRONT_APP_TYPE` (`pm2` 또는 `static`) |

Cloudflare Tunnel을 쓰는 PM2/Docker 배포는 위에 더해 `BACK_SSH_TUNNEL_HOST`, `BACK_BASTION_USER`, `BACK_BASTION_PORT` (백엔드 측) / `FRONT_SSH_TUNNEL_HOST`, `FRONT_BASTION_USER`, `FRONT_BASTION_PORT` (프론트 측)를 같은 경로에 추가.

**팀원 Join** (env.co-di.com → All Projects → `codi-<project>`)

- `ai@co-di.com` — admin
- `dev@co-di.com`, `su@co-di.com`, `design@co-di.com` — member

**Shared-Secrets 프로젝트 접근 권한** (Slack/Vercel 공용)

- `/slack/` → `slack_bot_token`, `slack_channel`
- `/vercel/` → `VERCEL_TOKEN`
- 아래 Step 2.2에서 만드는 Machine Identity에 Shared-Secrets 프로젝트 **Read** 권한 부여

이 단계가 끝나면 Step 2.2를 진행한 뒤 Step 2.3의 `wire-infisical`을 실행한다.

### 2.2 Machine Identity 생성 (CI/CD 런타임용)

GitHub Actions가 Infisical에서 값을 끌어올 때 사용할 인증 주체.

1. Organization → Access Control → **Machine Identities**
2. 새 Machine Identity 생성
   - Auth Method: **Universal Auth**
   - TTL: **0** (만료 없음)
3. 이 프로젝트 `codi-<project>`에 **Read** 권한 부여
4. Shared-Secrets 프로젝트(Slack/Vercel/Cloudflare 등)에도 **Read** 권한 부여
5. Client ID / Client Secret을 복사해 둠 (Step 2.3에서 사용)

이 단계가 끝나면 Step 2.3의 `wire-infisical`을 실행한다.

### 2.3 GitHub Secrets 등록과 `_PROJECT_ID_` 치환 — `./harness wire-infisical` 실행

레포 Secrets에는 **`INFISICAL_CLIENT_ID`와 `INFISICAL_CLIENT_SECRET` 두 개만** 둔다. 나머지 시크릿은 모두 Infisical로 관리.

**경로 A — `wire-infisical` 실행 (권장)**

```sh
export INFISICAL_PROJECT_ID="<2.1에서 복사한 Project ID>"
export INFISICAL_CLIENT_ID="<2.2에서 생성한 Client ID>"
export INFISICAL_CLIENT_SECRET="<2.2에서 생성한 Client Secret>"
./harness wire-infisical <project-name> --org CODIWORKS-Engineer
```

- `.infisical.json`의 `workspaceId`가 `INFISICAL_PROJECT_ID`로 치환됨
- `.github/workflows/*.yml`의 `_PROJECT_ID_` placeholder가 치환됨
- 두 Secret이 `gh secret set`으로 자동 등록됨

**경로 B — 수동 처리 (네트워크/권한 문제로 스크립트 실행이 어려울 때)**

```sh
# Secrets 등록
gh secret set INFISICAL_CLIENT_ID     --repo <org>/codi-<project>
gh secret set INFISICAL_CLIENT_SECRET --repo <org>/codi-<project>
```

`.infisical.json`은 직접 편집:

```json
{
  "workspaceId": "<Infisical Project ID>",
  "defaultEnvironment": "local-dev",
  "gitBranchToEnvironmentMapping": {
    "main": "prod",
    "dev": "dev"
  }
}
```

`.github/workflows/*.yml`의 `_PROJECT_ID_` placeholder도 같은 Project ID로 직접 치환:

```sh
# 어디에 남아 있는지 확인
grep -rn '_PROJECT_ID_' .github/workflows/
```

대상 파일 (해당 배포 모드를 쓰는 경우만 의미 있음):

- `deploy-frontend-pm2.yml`
- `deploy-frontend-vercel.yml`
- `deploy-frontend-docker.yml`
- `deploy-backend-pm2.yml`
- `deploy-backend-docker.yml`

### 2.4 GitHub Actions Variables 설정

레포 Settings → Secrets and variables → Actions → **Variables** 탭.

| 변수                   | 기본     | 설명                                          |
| ---------------------- | -------- | --------------------------------------------- |
| `NODE_VERSION`         | `24`     | 앱 런타임이 24가 아니면 `20` 또는 `22`로 지정 |
| `OSV_FAIL_ON_SEVERITY` | `high`   | 의존성 취약점 차단 임계                       |
| `BACKEND_DEPLOY_MODE`  | `pm2`    | `pm2` / `docker` / `none`                     |
| `FRONTEND_DEPLOY_MODE` | `vercel` | `vercel` / `pm2` / `docker` / `none`          |

자동 실행 진입점은 `.github/workflows/pipeline.yml` 하나만 사용. 다른 deploy 워크플로우는 `workflow_call` 전용이므로 직접 `push` 트리거를 붙이지 말 것.

### 2.5 GitHub 저장소 보안 설정

레포 Settings → Code security and analysis.

- **Dependency graph** 활성화
- **Dependabot alerts** 활성화
- Branch protection 또는 ruleset이 가능하면 **`Pipeline` 체크를 필수로** 설정
- Private repository + GitHub Free 플랜에서는 Code scanning 저장(SARIF upload)은 사용하지 않음. OSV 결과는 Actions 로그/아티팩트/Slack 알림으로만 본다.
- **Renovate GitHub App** 설치 후 `<org>/codi-<project>` 레포 활성화 (셀프 호스팅 Renovate 워크플로우는 즉시 실행이 필요할 때만)

상세 체크리스트: `.harness/docs/dependency-security-manual-setup.md`.

### 2.6 Vercel 연결 (FRONTEND_DEPLOY_MODE=vercel 인 경우만)

1. Vercel 대시보드 → **New Project** → 레포 import
2. Root Directory: 빈 값
3. Git 브랜치 연결: `main` → Production, `dev` → Preview
4. Settings → Git → **Disconnect** (배포는 GitHub Actions가 담당)
5. Infisical → Integrations → Vercel 연결로 env 자동 동기화

상세 절차: `.harness/docs/vercel-infisical-secret-sync.md`.

---

## 3. 조건부로 해야 하는 일

### 3.1 Cloudflare Tunnel 사용 시 `_CF_SHARED_PATH_` 치환

PM2 또는 Docker 배포가 Cloudflare Tunnel을 통과해야 할 때만.

1. Shared-Secrets 프로젝트에 Cloudflare 경로 생성 (예: `/cloudflare/<env>` 또는 `/cloudflare/<domain>/<subdomain>`)
2. `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` 값을 그 경로에 채움
3. 위 Step 2.2에서 만든 Machine Identity에 해당 경로 **Read** 권한 부여
4. `.github/workflows/deploy-*.yml` 의 `_CF_SHARED_PATH_` placeholder를 위에서 만든 실제 Cloudflare 경로로 치환

```sh
grep -rn '_CF_SHARED_PATH_' .github/workflows/
```

5. 사용할 PM2/Docker workflow의 top-level env에서 `USE_CLOUDFLARE_TUNNEL`을 `"true"`로 변경
   - 이 boolean은 Infisical secret이 아니라 워크플로우 파일 안에서 관리한다.

상세: `.harness/docs/cloudflare-tunnel-ssh-guide.md`.

### 3.2 PM2 / static 배포 서버에 server-deploy.sh 1회 배치

서버에서 tar를 풀고 PM2 reload(또는 static 디렉터리 교체)를 담당하는 공용 스크립트. PM2/static 배포 서버 1대당 1회만 배치하면 된다.

```sh
scp .harness/scripts/deploy/server-deploy.sh <user>@<server>:~/server-deploy.sh
ssh <user>@<server> "chmod +x ~/server-deploy.sh"
```

### 3.3 `--push` 없이 init-project를 돌린 경우

스크립트가 commit/push를 일부러 건너뛴 상태다. 로컬 diff를 검토한 뒤 직접 push:

```sh
git status
git add -A && git commit -m "chore: init project"
git push origin main
git push origin dev
```

---

## 4. 검증

```sh
./harness doctor
mise exec -- node -v   # v24.x 확인
mise exec -- npm -v
```

생성된 앱이 있다면 해당 앱에서:

```sh
mise exec -- npm --prefix apps/front run typecheck
mise exec -- npm --prefix apps/front run build
```

`apps/back`은 프로젝트 프로필이 `apps/back`을 허용하는 경우에만 실행.

치환이 모두 끝났는지 한 번에 확인:

```sh
grep -rn '_PROJECT_ID_\|_CF_SHARED_PATH_' .github/ apps/ 2>/dev/null
```

위 명령이 결과를 출력하면 아직 치환 안 된 placeholder가 남아 있다는 뜻. Cloudflare Tunnel을 안 쓰면 `_CF_SHARED_PATH_`가 남아도 무방하지만, 해당 워크플로우의 `USE_CLOUDFLARE_TUNNEL`이 `"false"`인지 반드시 확인.

---

## 5. 자동화하지 않는 이유 (참고)

- Infisical 프로젝트/환경/Path/Machine Identity 생성은 콘솔 전용 GUI 작업으로 안정된 공개 API가 없거나 권한이 복잡하다.
- GitHub의 Branch protection rule, Dependabot 활성화, Code security 설정은 레포 소유자/관리자 권한이 필요하고 조직 정책에 따라 가변적이다.
- Renovate App 설치는 GitHub App 설치 동의가 필요해 무인 자동화가 어렵다.
- `wire-infisical` 도입으로 `_PROJECT_ID_` 치환과 Infisical bootstrap Secrets 등록은 콘솔 작업 이후 자동화 범위에 들어왔다.
- Vercel 프로젝트 import와 Infisical-Vercel Integration 설정도 콘솔 동의가 필요하다.

이 문서는 위 경계 바깥의 모든 단계를 정리한 정본이다. 새 항목이 생기면 init-project.sh 출력이 아니라 이 파일을 먼저 업데이트한다.
