# Vercel - Infisical Secret Sync 설정 가이드

Vercel 배포를 GitHub Actions로 실행하면서, 프론트엔드 런타임 환경변수는 Infisical을 source of truth로 두고 Vercel Environment Variables로 동기화하는 절차를 정리한다.

하네스의 기본 흐름은 아래와 같다.

```text
Infisical /frontend
  -> Infisical Secret Sync
  -> Vercel Environment Variables
  -> GitHub Actions vercel pull
  -> vercel build/deploy
```

GitHub Actions가 Infisical 값을 직접 Vercel에 `vercel env add`로 등록하지 않는다. Vercel env 등록은 Infisical의 `Secret Syncs`가 담당하고, GitHub Actions는 Vercel에 이미 등록된 env를 `vercel pull`로 가져와 build/deploy를 수행한다.

---

## 1. 토큰 역할

Vercel의 `Account Settings > Tokens`에는 아래 두 토큰을 둔다.

| Vercel token name       | 용도                                         | 사용 위치                                                                 |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `github-actions-deploy` | GitHub Actions가 Vercel CLI 배포를 실행할 때 | Infisical Shared-Secrets `/vercel` -> `VERCEL_TOKEN`                      |
| `infisical-sync`        | Infisical이 Vercel env를 동기화할 때         | Infisical Project -> Integrations -> App Connections -> Vercel connection |

두 토큰의 원문 값은 Vercel에서 생성 직후 한 번만 볼 수 있다. 이후 Vercel UI에서는 다시 확인할 수 없으므로, 생성 직후 Infisical Shared-Secrets의 `/vercel` 경로에 저장한다.

권장 저장 예시:

| Infisical project | Path      | Key                           | 값                         |
| ----------------- | --------- | ----------------------------- | -------------------------- |
| Shared-Secrets    | `/vercel` | `VERCEL_TOKEN`                | `github-actions-deploy` 값 |
| Shared-Secrets    | `/vercel` | `VERCEL_INFISICAL_SYNC_TOKEN` | `infisical-sync` 값        |

현재 배포 워크플로우는 `VERCEL_TOKEN`만 읽는다. `VERCEL_INFISICAL_SYNC_TOKEN`은 GitHub Actions가 읽는 값이 아니라, Infisical App Connection을 만들거나 재연결할 때 쓰는 보관용 값이다.

---

## 2. Infisical 값 배치

프로젝트별 Infisical에는 아래 경로를 사용한다.

| Path                       | 용도                          | 예시 키                                      |
| -------------------------- | ----------------------------- | -------------------------------------------- |
| `/frontend`                | Vercel로 sync할 앱 런타임 env | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_ENV` |
| `/frontend/github-actions` | GitHub Actions 배포용 값      | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`         |

`/frontend`는 Vercel Environment Variables로 동기화된다.

`/frontend/github-actions`는 Vercel로 sync하지 않는다. 이 경로의 값은 `.github/workflows/deploy-frontend-vercel.yml`이 Infisical에서 직접 읽어서 `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`로 사용한다.

---

## 3. App Connection 생성

Infisical에서 Vercel Secret Sync를 만들기 전에 Vercel App Connection을 먼저 만든다.

1. Infisical -> Project -> Integrations
2. `App Connections` 탭
3. `Add Connection`
4. `Vercel` 선택
5. Name 입력
   - 예: `vercel-env-sync`
6. Vercel token 입력
   - `infisical-sync` 토큰 값 사용
   - 값은 Shared-Secrets `/vercel/VERCEL_INFISICAL_SYNC_TOKEN`에서 확인
7. 저장

이 connection은 Secret Sync가 Vercel 프로젝트의 Environment Variables를 생성/수정할 때 사용하는 인증 연결이다.

---

## 4. Secret Sync 생성

Secret Sync는 환경별로 따로 만든다. 하네스 표준은 `dev -> Vercel custom environment dev`, `prod -> Production`이다.

### 4.1 dev sync

1. Infisical -> Project -> Integrations
2. `Secret Syncs` 탭
3. `Add Sync`
4. `Vercel` 선택
5. Source 설정
   - Environment: `dev`
   - Secret Path: `/frontend`
6. Destination 설정
   - Vercel Connection: `vercel-env-sync`
   - Vercel App: 대상 Vercel 프로젝트
   - Vercel App Environment: `dev`
   - Vercel Preview Branch: 비움
7. Sync Options 설정
   - Initial Sync Behavior: `Import Destination Secrets - Prioritize Infisical Values`
   - Key Schema: `{{secretKey}}`
   - Auto-Sync Enabled: enabled
   - Disable Secret Deletion: enabled
8. Details 설정
   - Name: `frontend-dev-to-vercel-dev`
9. Review 후 `Create Sync`

### 4.2 prod sync

1. `Add Sync` -> `Vercel`
2. Source 설정
   - Environment: `prod`
   - Secret Path: `/frontend`
3. Destination 설정
   - Vercel Connection: `vercel-env-sync`
   - Vercel App: 대상 Vercel 프로젝트
   - Vercel App Environment: `Production`
   - Vercel Preview Branch: 비움
4. Sync Options 설정
   - Initial Sync Behavior: `Import Destination Secrets - Prioritize Infisical Values`
   - Key Schema: `{{secretKey}}`
   - Auto-Sync Enabled: enabled
   - Disable Secret Deletion: enabled
5. Details 설정
   - Name: `frontend-prod-to-vercel-production`
6. Review 후 `Create Sync`

---

## 5. Sync 옵션 기준

초기 연결에서는 아래 조합을 기본으로 쓴다.

```text
Initial Sync Behavior:
  Import Destination Secrets - Prioritize Infisical Values

Key Schema:
  {{secretKey}}

Auto-Sync:
  Enabled

Disable Secret Deletion:
  Enabled
```

각 옵션의 의미:

| 옵션                                                       | 의미                                                                  |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| `Import Destination Secrets - Prioritize Infisical Values` | Vercel 기존 env를 먼저 가져오되, 같은 key 충돌 시 Infisical 값을 우선 |
| `Key Schema: {{secretKey}}`                                | Infisical key 이름 그대로 Vercel에 생성                               |
| `Auto-Sync Enabled`                                        | Infisical 값 변경 시 Vercel로 자동 반영                               |
| `Disable Secret Deletion`                                  | Infisical에 없는 key라는 이유만으로 Vercel env를 삭제하지 않음        |

`Overwrite Destination Secrets`는 처음 연결할 때 쓰지 않는다. Infisical에 아직 없는 Vercel env가 삭제될 수 있다.

---

## 6. Synced 확인 기준

Secret Sync 상태가 `Synced`이면, 설정한 source path의 key가 설정한 Vercel project/environment에 반영되어 있어야 한다.

확인할 것:

1. Infisical source가 맞는지 확인
   - dev: `dev` environment + `/frontend`
   - prod: `prod` environment + `/frontend`
2. Destination이 맞는지 확인
   - dev: Vercel custom environment `dev`
   - prod: Vercel `Production`
3. Vercel Environment Variables에서 같은 key가 존재하는지 확인
4. Vercel UI에서 값이 마스킹되어 있어도 key가 있으면 정상으로 본다
5. Key Schema가 `{{secretKey}}`인지 확인

`Synced`인데 Vercel에 key가 보이지 않으면 아래 순서로 본다.

1. Vercel project를 잘못 선택했는지
2. Production을 보고 있는데 sync는 custom environment `dev`로 만든 상태인지
3. Vercel project의 Environments에서 `dev` environment에 도메인이 연결되어 있는지
4. Source path가 `/frontend`가 아닌지
5. Key Schema 때문에 key 이름이 바뀌었는지
6. Sync run log에 skip/error가 있는지

Vercel은 민감한 환경변수 값을 다시 노출하지 않는 경우가 있다. 초기 import 때 Vercel의 기존 sensitive value가 Infisical에 빈 값으로 들어올 수 있으므로, 첫 sync 후 Infisical `/frontend` 값을 한 번 확인한다.

---

## 7. 배포 반영 기준

Secret Sync는 Vercel Environment Variables를 갱신한다. 이미 끝난 배포 결과물이 자동으로 다시 빌드되는 것은 아니다.

특히 `NEXT_PUBLIC_*` 값은 Next.js에서 build-time 값으로 박히므로, Infisical -> Vercel sync 후 새 GitHub Actions 배포가 한 번 돌아야 실제 사이트에 반영된다.

운영 순서:

1. Infisical `/frontend` 값 수정
2. Secret Sync 상태가 `Synced`인지 확인
3. `dev` 또는 `main` 배포 실행
4. GitHub Actions의 `vercel pull`이 Vercel env를 가져옴
5. `vercel build/deploy` 결과에 새 값 반영

---

## 8. 현재 하네스 워크플로우와의 관계

`.github/workflows/deploy-frontend-vercel.yml`은 아래 값만 Infisical에서 직접 읽는다.

- Shared-Secrets `/vercel/VERCEL_TOKEN`
- Project `/frontend/github-actions/VERCEL_ORG_ID`
- Project `/frontend/github-actions/VERCEL_PROJECT_ID`

앱 런타임 env인 `NEXT_PUBLIC_*`는 이 워크플로우가 Infisical에서 직접 읽지 않는다. 런타임 env는 Secret Sync를 통해 Vercel 프로젝트에 먼저 등록되어 있어야 하며, 워크플로우는 `vercel pull --environment=dev|production`으로 Vercel env를 가져온다.

Vercel Git Integration을 끊은 프로젝트에서는 Vercel의 branch domain 자동 연결을 쓰지 않는다. 대신 Vercel Project Settings -> Environments에서 `dev` custom environment를 만들고 dev 도메인을 연결한다. GitHub Actions는 `dev` 브랜치에서 `vercel pull --environment=dev`, `vercel build --target=dev`, `vercel deploy --prebuilt --target=dev`를 실행하므로 별도 `vercel alias set` 단계가 필요 없다.

---

## 9. 공식 문서

- Infisical Vercel Connection: https://infisical.com/docs/integrations/app-connections/vercel
- Infisical Vercel Sync: https://infisical.com/docs/integrations/secret-syncs/vercel
