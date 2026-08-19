# 프로젝트 초기화 가이드

> **shared 하네스 문서입니다.** 다운스트림 프로젝트는 직접 수정하지 않습니다.

새 프로젝트나 기존 front/back 레포를 입력한 `<repo-name>` 모노레포에 통합하는
상세 절차입니다. 전체 흐름을 에이전트와 대화로 진행하려면 `/init-project`
스킬을 호출합니다(README "빠른 시작 > 6. 프로젝트 초기화" 참고).

## 명령 경계

`init-project`는 프로젝트 레포를 처음 만드는 사람의 로컬에서만 실행합니다.
이미 생성된 프로젝트를 다른 팀원이 clone한 뒤 다시 실행하는 명령이 아닙니다.

| 상황 | 실행 명령 | 목적 |
| --- | --- | --- |
| 새 프로젝트 최초 생성자 | `./harness init-project <project-name> --org CODIWORKS-Engineer --mode <mode> --reset-git` | GitHub 레포 생성/재사용, profile 확정, `origin` 설정, 하네스 clone 히스토리 정리 |
| 이미 생성된 프로젝트에 합류한 팀원 | `mise trust && mise install && ./harness install && ./harness doctor` | 로컬 런타임, 스킬 merge tree, vendored Spec Kit 자산 배치 |
| 공통 하네스 파일 최신화 | lock 모드(신규 기본): 세션 시작 자동 반영 + `./harness pkg-sync` / copy 모드: `./harness update` | lock 모드 상세는 [packaging-guide.md](./packaging-guide.md) |

`update`는 초기화나 팀원 온보딩의 대체 명령이 아닙니다. project-owned 파일을
보존하면서 `.harness`, `AGENTS.md`, `CLAUDE.md` 같은 shared 파일만 갱신하는
운영 명령입니다.

## 기본 단계

1. **로컬 bootstrap** — `./harness init-project`가 필요한 경우
   `mise trust && mise install`을 실행하고 하네스 통합 도구 설치 상태를
   보강합니다.
2. **GitHub 배선** — `./harness init-project`가 GitHub 레포 생성/재사용,
   `codi-engineers` 팀 권한 부여, `origin` 설정을 수행합니다.
3. **Infisical 콘솔 작업(수동)** — 사용자가 콘솔에서 프로젝트와
   Machine Identity를 만듭니다.
4. **Infisical 배선** — `./harness wire-infisical <repo-name>`이
   `.infisical.json` 치환, `_PROJECT_ID_` 치환, GitHub Secrets 등록을
   끝냅니다.

```sh
./harness init-project <repo-name> --org CODIWORKS-Engineer --mode split-front-back
```

기본 실행은 commit/push를 하지 않으며, 자동 push가 필요하면 `--push`를
추가합니다.
새 프로젝트처럼 하네스 clone의 git 히스토리와 upstream 작업 산출물을 정리해야 하면
`--reset-git`을 함께 사용합니다. 이미 설치 상태를 확신하면 `--skip-install`,
상태를 다시 배치하려면 `--force-install`을 추가할 수 있습니다.

## Infisical 콘솔 작업이 끝난 뒤

```sh
export INFISICAL_PROJECT_ID="<project-id>"
export INFISICAL_CLIENT_ID="<client-id>"
export INFISICAL_CLIENT_SECRET="<client-secret>"
./harness wire-infisical <repo-name> --org CODIWORKS-Engineer
```

스크립트가 끝난 뒤에도 `_CF_SHARED_PATH_` placeholder 치환, GitHub
Dependabot/Renovate/Branch protection 설정 같은 후속 단계가 남습니다.
정본 체크리스트: [init-project-post-setup.md](./init-project-post-setup.md)

## git 히스토리 초기화 (`--reset-git`)

하네스를 `git clone`으로 받은 `.git`을 그대로 둔 채 초기화하면 하네스의
`v1`/`v2` 버전 브랜치가 새 프로젝트에 남고, 기존 레포를 `git subtree`로
통합할 때 그 레포의 브랜치와 충돌할 수 있습니다. `init-project`는 이 상태를
감지하면 경고하며, `--reset-git`을 주면 하네스 `.git`을 제거하고 새 git
히스토리(`main` 브랜치)로 다시 시작합니다.

upstream 하네스 자체의 작업 상태(spec·테스트·허브 산출물 등)는 `--reset-git`
여부와 **무관하게 항상** 정리됩니다 — `--reset-git`은 `.git` 재생성만
담당합니다. 정리 경로의 정본 목록은
`.harness/scripts/setup/upstream-project-state.mjs`의
`UPSTREAM_PROJECT_STATE_PATHS`이며, 문서에 재열거하지 않습니다(재열거된
목록은 낡아서 그대로 따라 하면 잔재가 첫 커밋에 들어갑니다 — 2026-07-31 감사
H-4). 수동 `rm -rf` 대체는 권장하지 않습니다. 정리가 필요하면
`init-project`를 다시 실행하세요.
정리 후 하네스 통합 도구가 필요하면 `init-project`가 상태를 감지해 vendored
Spec Kit 자산과 skill merge tree를 다시 배치합니다.

```sh
./harness init-project <repo-name> --org CODIWORKS-Engineer --reset-git
```

## 앱 스캐폴드와 기존 레포 통합

앱 내부 구조는 `init-project`가 강제로 만들지 않습니다. `create-next-app`,
Nest CLI, Express 초기화 결과를 우선합니다.

기존 front/back 레포를 통합할 때는 `git subtree`를 사용합니다.

```sh
git subtree add --prefix=apps/<front|back> <remote>/<branch> --squash
```

`--squash`는 외부 레포의 전체 커밋을 단일 커밋으로 합쳐 모노레포 히스토리를
깔끔하게 유지합니다. 상세 절차는 에이전트에게 `/init-project` 스킬로
요청하면 안내됩니다.
