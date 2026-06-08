# 의존성 보안 자동화 1단계

이 문서는 하네스가 생성하거나 관리하는 프로젝트에 공통으로 적용할
Renovate, OSV Scanner, Node CI 기준을 정의한다.
GitHub UI에서 직접 해야 하는 작업은
[`dependency-security-manual-setup.md`](dependency-security-manual-setup.md)를 따른다.

## 구성 요소

- `renovate.json`: 업데이트 PR 생성, 자동 병합 후보, 수동 리뷰 패키지 정책.
- `.github/workflows/pipeline.yml`: 일반 PR 검증, schedule/manual full scan, 배포를 단일 실행 흐름으로 제어.
- `.github/workflows/dependency-security-pr.yml`: dependency 파일 변경 PR에서만 dependency 보안 검사를 호출.
- `.github/workflows/dependency-security.yml`: `pipeline.yml` 또는 `dependency-security-pr.yml`에서 호출되는 OSV Scanner CLI와 Renovate 영향도 리포트 workflow.
- `.github/workflows/ci-node.yml`: `pipeline.yml`에서 호출되는 npm/pnpm install, typecheck 재사용 workflow. test는 opt-in이며 lint와 build는 실행하지 않는다.
- `.harness/scripts/checks/ci-node-verify.sh`: 프로젝트 구조를 탐색해 package manager와 스크립트를 실행.
- `.harness/scripts/deploy/node-package-manager.sh`: 배포 workflow에서 앱별 npm/pnpm을 판별.
- `.harness/scripts/audit/dependency-impact-report.js`: Renovate/dependencies PR에서 변경 dependency, lockfile, OSV 결과를 PR 코멘트로 요약.

## 운영 흐름

취약점이 공개되면 Renovate가 예약 실행 또는 수동 실행으로 업데이트 PR을 만든다.
일반 코드 변경 PR에서는 `Pipeline` 안의 `CI Node`만 실행된다.
dependency 파일이 바뀐 PR에서는 별도 `Dependency Security PR` workflow가 떠서
`OSV PR scan`을 실행한다.
Renovate 또는 `dependencies` label PR에는 영향도 리포트 코멘트를 남긴다.
dependency 보안 check가 실패하면 같은 Slack 채널에 알림을 보낸다.
필수 체크가 통과하면 사람이 PR 내용을 확인하고 병합한다. `dev`/`main` push,
schedule, 수동 실행에서는 `OSV full scan`이 전체 dependency 상태를 확인한다.
full scan은 KST 날짜와 dependency 파일 fingerprint 기준의 성공 cache를 사용한다.
같은 날 같은 dependency 상태를 이미 성공적으로 스캔했다면 full scan을 건너뛰고,
`package.json` 또는 lockfile이 바뀌면 같은 날이어도 다시 스캔한다. 실패한 스캔은
cache를 저장하지 않으므로 다음 실행에서도 다시 감지된다. `dev` 또는 `main`에 push될 때
dependency 파일 변경이 없으면 full scan cache 확인 job도 실행하지 않는다. dependency
파일 변경이 있는 push에서는 같은 `Pipeline`에서 `CI Node`와 dependency 보안 workflow를
먼저 실행하고, 둘 다 성공한 경우에만 선택된 배포 job을 실행한다. dependency 변경이 없는
push에서는 dependency 보안 workflow가 skipped여도 배포 job을 실행할 수 있다. 검증 실패
시 배포 job은 skipped 상태가 되며 운영 또는 프리뷰 환경에는 반영되지 않는다.

full scan cache는 OSV 결과 JSON을 재사용하지 않고, 같은 날짜와 같은 dependency fingerprint의
성공 스캔을 표시하는 marker로만 쓴다. OSV 취약점 DB는 dependency 파일이 같아도 시간이
지나면 결과가 달라질 수 있으므로 오래된 `osv-results.json`을 재사용하지 않는다.

## GitHub 설정

각 repository에서 다음 설정을 켠다.

- Dependency graph
- Dependabot alerts
- Branch protection 또는 ruleset. Free/private repository처럼 세부 required check를
  강제하기 어려운 경우에도 `pipeline.yml`의 `needs` 관계가 배포 전 검증을 강제한다.

Free/private repository에서는 GitHub Code scanning/SARIF 저장을 기본값으로 사용하지 않는다.
OSV 결과는 GitHub Actions 로그, artifact, Slack 알림으로 운영한다. Public repository 또는
GitHub Code Security/Advanced Security가 있는 repository에서만 Code scanning 저장을
추가로 켠다.
GitHub Dependency Review는 private/free repository 기본 flow에서 사용하지 않는다.
GitHub Code Security/Advanced Security로 전환하는 시점에 별도 변경으로 다시 추가한다.

필수 체크는 최소 아래 항목으로 둔다.

- `Pipeline`

`Dependency Security PR`은 dependency 파일 변경 PR에서만 workflow 자체가 생성된다.
일반 required check로 전역 지정하면 dependency 파일을 바꾸지 않은 PR에서 check가 없어서
대기 상태가 될 수 있으므로, 전역 required check는 `Pipeline`만 둔다. dependency 변경
PR은 `Dependency Security PR` 상태와 Renovate 영향도 코멘트를 함께 보고 병합한다.
`OSV full scan`은 dependency 파일 변경 `dev`/`main` push, schedule, 수동 실행에서 전체 lockfile 상태를 확인한다.
KST 날짜와 dependency 파일 fingerprint가 동일한 성공 이력이 있으면 같은 날의 반복
full scan은 skip된다.
보안 check 실패 알림은 Slack을 1차 채널로 사용하고, 상세 결과는 Actions 로그와
`osv-*-results` artifact에서 확인한다.

## Renovate 설정

Renovate GitHub App 설치를 기본값으로 사용한다. 별도 서버나 토큰이 필요 없다.
수동으로 즉시 실행해야 하는 운영이 필요해지면 Renovate self-hosted workflow를
별도로 추가하고 `RENOVATE_TOKEN`을 GitHub Secret에 등록한다.

자동 병합은 아래 범위만 허용한다.

- patch 업데이트
- devDependency의 minor/patch 업데이트

아래 패키지는 자동 병합하지 않는다.

- Next.js, React, NestJS, Express
- ORM/DB 관련 패키지
- 인증 관련 패키지
- 결제 SDK
- runtime dependency의 minor 업데이트
- 모든 major 업데이트

Renovate PR은 `dev` 브랜치를 대상으로 생성한다. `main`에는 dependency update PR을 직접
생성하거나 자동 병합하지 않는다. Renovate 설정은 PR 생성 정책만 정의하므로 실제 자동
업데이트를 위해서는 각 repository에 Renovate GitHub App이 설치되어 있어야 한다.
Renovate/dependencies PR의 영향도 리포트는 자동 병합을 대체하지 않는다. 리포트는 Codex나
Claude Code가 `cso` -> `review` -> `qa`, `systematic-debugging`,
`test-driven-development` 같은 skill 검증을 수행할 때 입력으로 쓰는 요약 자료다.

## 기존 프로젝트 적용

기존 프로젝트에는 아래 파일을 복사한다.

```text
renovate.json
.github/workflows/pipeline.yml
.github/workflows/dependency-security-pr.yml
.github/workflows/ci-node.yml
.github/workflows/dependency-security.yml
.github/workflows/deploy-*.yml
.harness/scripts/checks/ci-node-verify.sh
.harness/scripts/deploy/node-package-manager.sh
.harness/scripts/audit/dependency-impact-report.js
```

그 후 `package.json`에 가능한 경우 `typecheck` 스크립트를 정리한다.
존재하지 않는 스크립트는 CI에서 자동으로 건너뛴다. `test`는
`CI_NODE_VERIFY_RUN_TESTS=true`를 설정한 프로젝트에서만 실행한다.
`lint`와 `build`는 CI Node에서 실행하지 않는다. lint는 `husky + lint-staged`
pre-commit으로 변경 파일만 검증하고, build는 deploy workflow에서 환경 변수를 주입한 뒤
실행한다.
하네스 root `package.json`과 `.husky/pre-commit`이 신규 프로젝트에도 함께
복사되므로, 프로젝트 초기화 후 root에서 `npm install`을 실행해 hook을 활성화한다.

`ci-node.yml`, `dependency-security.yml`, `deploy-*.yml`은 직접 push/pull_request로
실행하지 않는다. 자동 실행 진입점은 일반 검증/배포용 `pipeline.yml`과 dependency 변경
PR 전용 `dependency-security-pr.yml`만 둔다. 나머지 workflow는 `workflow_call` 재사용
단위로 둔다.

## 앱 구조와 package manager

하네스 표준 앱 위치는 `apps/front/package.json`, `apps/back/package.json`이다.
검증과 PM2/Vercel 배포 workflow는 각 앱의 `packageManager`, app-local lockfile,
그리고 stack dependency를 보고 package manager를 고른다.

- `apps/front` Next.js: `pnpm`
- `apps/front` React-only: `npm`
- `apps/back` NestJS: `pnpm`
- `apps/back` Express: `npm`

Docker 배포 workflow는 Dockerfile 내부의 install/build 단계가 package manager를
결정한다. 따라서 Dockerfile도 위 정책과 같은 package manager를 사용해야 한다.
현재 Docker 배포는 registry push가 아니라 runner에서 이미지를 build/save/gzip한 뒤
SCP로 서버에 전달한다. Docker 배포 사용량이 커지면 registry push와 image digest/tag
기반 배포로 전환해 GitHub Actions 빌드 시간을 줄이고 dev/prod 산출물 일관성을 높인다.

## 배포 workflow 기본값

- 배포 workflow의 Node.js 버전은 repository variable `NODE_VERSION`을 우선 사용한다.
  값이 없으면 하네스 기본값인 24를 사용한다.
- `BACKEND_DEPLOY_MODE`: `pm2`, `docker`, `none` 중 하나. 기본값은 `pm2`.
- `FRONTEND_DEPLOY_MODE`: `vercel`, `pm2`, `docker`, `none` 중 하나. 기본값은 `vercel`.
  React SPA를 PM2/static 서버로 배포하는 프로젝트는 `pm2`로 설정한다.
- Vercel 프로젝트의 Root Directory는 빈 값으로 둔다. GitHub Actions가
  `apps/front`에서 Vercel CLI를 실행하므로 Vercel Git 설정에서 앱 경로를 다시
  나누지 않는다.
- PM2/Docker 배포는 기본적으로 `FRONT_TARGET_HOST` 또는 `BACK_TARGET_HOST`에 direct
  SSH로 연결한다.
- Cloudflare Tunnel이 필요한 프로젝트만 PM2/Docker workflow env의
  `USE_CLOUDFLARE_TUNNEL: "true"`를 설정하고 `_CF_SHARED_PATH_`를 실제
  Shared-Secrets path로 교체한다. 이 boolean은 Infisical secret으로 관리하지 않는다.

## Artifact 승격 메모

Artifact 승격은 prod 배포에서 다시 install/build하지 않고, dev 또는 CI에서 만든 같은
commit의 tarball이나 Docker image를 prod에 배포하는 방식이다. 백엔드처럼 런타임 env를
서버에서 주입하는 구조는 비교적 적용하기 쉽다. 프론트엔드는 `NEXT_PUBLIC_*` 같은 build-time
환경변수가 산출물에 들어갈 수 있으므로 dev artifact를 prod에 그대로 승격하지 않는다.
