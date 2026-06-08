# 의존성 보안 자동화 수동 설정 체크리스트

이 문서는 하네스가 파일로 자동 제공하지 못하는 GitHub/외부 서비스 설정만
정리한다. 새 프로젝트 이름은 `codi-{project}` 형식을 사용한다.

## 1. Renovate GitHub App

1. Renovate GitHub App을 설치한다.
2. 대상 repository `codi-{project}`를 활성화한다.
3. repository 루트의 `renovate.json`이 적용되는지 확인한다.
4. GitHub `Issues` 또는 Renovate Dependency Dashboard가 생성되는지 확인한다.

Renovate는 업데이트 PR을 만드는 도구다. OSV Scanner는 PR을 만들지 않고
취약점만 스캔한다.

## 2. GitHub Code Security

각 repository의 `Settings > Code security and analysis`에서 아래 항목을 켠다.

- Dependency graph
- Dependabot alerts

Private repository + GitHub Free 플랜에서는 Code scanning/SARIF 저장을 사용할 수 없다.
이 경우 Code scanning을 켜려고 하지 말고, OSV 결과를 GitHub Actions 로그, artifact,
Slack 알림으로 운영한다. Public repository 또는 GitHub Code Security/Advanced Security가
있는 repository에서만 Code scanning 저장을 추가로 켠다.
GitHub Dependency Review는 private/free repository 기본 flow에서 사용하지 않는다.
GitHub Code Security/Advanced Security로 전환하는 시점에 별도 변경으로 다시 추가한다.

## 3. Branch Protection 또는 Ruleset

`dev`, `main` 브랜치에 대해 PR merge 전에 필요한 체크를 설정한다.

가능하면 필수 체크는 아래 하나로 둔다.

- `Pipeline`

GitHub Free/private repository 등으로 required check를 세세하게 강제하기 어렵다면
이 단계는 생략할 수 있다. `Dependency Security PR`은 dependency 파일 변경 PR에서만
생성되므로 전역 required check로 두면 일반 PR이 대기 상태가 될 수 있다. dependency
변경 PR은 `Dependency Security PR` 상태와 영향도 코멘트를 확인한 뒤 병합한다.
`dev`/`main` push에서 dependency 파일이 바뀐 경우에는 `pipeline.yml`이 `CI Node`와
`Dependency Security` 성공 후에만 배포 job을 실행하므로, 보안 실패 후 배포되는 상황은
workflow 레벨에서 막는다.

## 4. GitHub Actions Variables

필요한 repository variable을 설정한다.

- `NODE_VERSION`: 앱 런타임이 24가 아니면 `20` 또는 `22`로 지정한다.
- `CI_NODE_VERIFY_SCOPE`: 특정 앱만 검증하려면 `apps/front` 또는 `apps/back`으로 지정한다.
- `OSV_FAIL_ON_SEVERITY`: 기본값 `high`. `critical`만 막으려면 `critical`.
- `BACKEND_DEPLOY_MODE`: `pm2`, `docker`, `none` 중 하나. 기본값 `pm2`.
- `FRONTEND_DEPLOY_MODE`: `vercel`, `pm2`, `docker`, `none` 중 하나. 기본값 `vercel`.

설정하지 않으면 기본값을 사용한다.

## 5. App package.json 스크립트

각 앱의 `package.json`에 가능한 배포 전 정적 검증 스크립트를 둔다.

- `typecheck`

없는 스크립트는 `ci-node-verify.sh`가 건너뛴다. `test`는
`CI_NODE_VERIFY_RUN_TESTS=true`를 설정한 프로젝트에서만 실행한다. Renovate PR을
신뢰하려면 최소 `typecheck`는 두는 것을 권장한다.

`lint`는 CI/CD에서 실행하지 않는다. 각 repository에 `husky + lint-staged`를 두고
pre-commit 단계에서 변경된 파일만 검사한다.
`build`도 CI Node에서 실행하지 않는다. React/Next/Nest 앱의 실제 build는 deploy job에서
환경 변수와 시크릿을 준비한 뒤 실행한다.
신규 프로젝트는 하네스 root `package.json`과 `.husky/pre-commit`을 그대로 포함하므로
root에서 `npm install`을 실행하면 hook이 활성화된다.

## 6. Package Manager 정책

하네스 표준은 아래와 같다.

- `apps/front` Next.js: `pnpm`
- `apps/front` React-only: `npm`
- `apps/back` NestJS: `pnpm`
- `apps/back` Express: `npm`

`package.json#packageManager`를 명시하면 workflow가 가장 먼저 그 값을 사용한다.
Docker 배포는 Dockerfile 내부 install/build 단계가 같은 정책을 따라야 한다.

## 7. 배포 관련 수동 설정

배포 방식에 따라 필요한 외부 설정을 완료한다.

- Vercel: `codi-{project}` repository import, Root Directory는 빈 값으로 둔다.
  Git integration은 끄고 GitHub Actions가 `apps/front`에서 Vercel CLI를 실행한다.
- PM2/Docker: Infisical `/frontend/github-actions`, `/backend/github-actions` 경로에 SSH/배포 시크릿 등록.
- 배포 방식은 workflow 파일의 `push` 블록을 수정하지 않고 GitHub Actions Variables의
  `BACKEND_DEPLOY_MODE`, `FRONTEND_DEPLOY_MODE`로 선택한다.
- Cloudflare Tunnel 사용 시 workflow의 `_CF_SHARED_PATH_`를 실제 Infisical path로 교체하고,
  같은 workflow env의 `USE_CLOUDFLARE_TUNNEL: "true"`를 설정한다.
  설정하지 않으면 PM2/Docker 배포는 `FRONT_TARGET_HOST` 또는 `BACK_TARGET_HOST`로 direct SSH 연결한다.
- GitHub Secrets에는 `INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET`만 둔다.
- Renovate PR은 `dev`로만 받는다. `main`에는 직접 dependency update PR을 만들거나
  자동 병합하지 않는다.

## 8. 취약점 공개 시 운영

1. Slack의 `Dependency Security 실패` 알림을 확인한다.
2. Renovate가 관련 업데이트 PR을 만들었는지 확인한다.
3. 없으면 Renovate를 재시도하거나 수동 업데이트 PR을 만든다.
4. PR 체크를 확인한다.
5. `manual-review`, `major`, framework/auth/db/payment 업데이트는 changelog와 breaking change를 확인한다.
6. Renovate/dependencies PR에 생성된 `Dependency Update Impact Report` 코멘트를 확인한다.
7. Codex 또는 Claude Code로 리포트를 읽게 한 뒤 `gstack`의 `cso` -> `review` -> `qa`와
   `superpowers`의 `systematic-debugging` 또는 `test-driven-development`를 사용해 영향도와 실패 원인을 검증한다.
8. merge 후 배포하고 smoke check를 수행한다.

## 9. 알림 운영

`pipeline.yml`에서 호출되는 `dependency-security.yml`은 아래 경우에만 Slack에 알린다.

- dependency 파일 변경 PR에서 `OSV PR scan` 실패.
- dependency 파일 변경 `dev`/`main` push, scheduled run, manual run에서 `OSV full scan` 실패.

일반 코드 변경 PR에는 dependency 보안 스캔과 Slack 알림이 발생하지 않는다.
Renovate/dependencies PR에는 OSV 결과와 변경 dependency 요약 코멘트가 생성된다.
`OSV full scan`은 KST 날짜와 dependency 파일 fingerprint 기준의 성공 cache를 사용한다.
같은 날 같은 dependency 상태를 이미 성공적으로 스캔했다면 full scan은 skip되고,
`package.json` 또는 lockfile 변경으로 fingerprint가 달라지면 다시 실행된다. 실패한
스캔은 cache를 저장하지 않으므로 다음 dependency 변경 push에서도 배포 gate를 다시
확인한다. 캐시는 OSV 결과 JSON 재사용이 아니라 성공 스캔 marker로만 사용한다.
GitHub 개인 이메일/web 알림을 줄이고 싶다면 각 사용자가 GitHub notification 설정에서
Security alerts 알림을 조정한다. 저장소의 Dependency graph, Dependabot alerts는 유지한다.

## 10. 확인 명령

로컬에서 하네스 구성이 깨지지 않았는지 확인한다.

```sh
ruby -e 'require "json"; JSON.parse(File.read("renovate.json"))'
ruby -e 'require "yaml"; ARGV.each { |f| YAML.load_file(f) }' .github/workflows/*.yml
bash -n .harness/scripts/checks/ci-node-verify.sh .harness/scripts/deploy/node-package-manager.sh
node --check .harness/scripts/audit/dependency-impact-report.js
printf '{"results":[]}\n' > /tmp/empty-osv-results.json
node .harness/scripts/audit/osv-severity-gate.js /tmp/empty-osv-results.json high
./harness doctor
```
