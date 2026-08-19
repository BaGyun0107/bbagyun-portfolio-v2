# 업데이트 가이드 (다운스트림 적용 상세)

> **shared 하네스 문서입니다.** 다운스트림 프로젝트는 직접 수정하지 않습니다.
> 업데이트 정책의 정본은 `.harness/policies/update-policy.md`입니다.

## 먼저: 어느 배포 모드인가

레포 루트에 `harness.lock`이 있으면 **lock 모드**입니다. lock 모드의 수신·
버전 고정·자동 반영 시점·migrate 절차는
[packaging-guide.md](./packaging-guide.md)가 정본이며, lock 모드에서
`./harness update`(비-major)는 copy 방식 동기화 대신 lock 흐름 안내로
대체됩니다. 아래 절들은 **copy 모드**(레거시, `harness.lock` 없음)의 적용
상세입니다.

> **은퇴 예고**: copy 모드는 단계적으로 은퇴합니다. 제거 시점은 날짜가 아니라
> "모든 다운스트림의 lock 전환 완료 확인"이 조건입니다(specs/014).
> 신규 적용은 lock 모드를 쓰고, 기존 copy 레포는 `./harness migrate`로
> 전환하세요.

## 이 하네스 레포에서

`./harness install`은 `.harness/skills`를 갱신하지 않습니다. 하네스 레포
자체의 변경은 `git pull`, PR merge, 브랜치 전환 같은 일반 git 흐름으로
들어옵니다.

## 다운스트림 앱 레포에서

중앙 하네스의 공통 파일만 선택 적용합니다.

```sh
./harness update-check
./harness update --check
./harness update
```

`./harness update`는 shared 하네스 파일을 적용하는 기본 명령입니다. 예전
문서나 자동화에서 쓰던 `./harness update --apply-harness`도 같은 동작으로
계속 지원합니다. 확인만 하려면 `./harness update --check` 또는
`./harness update-check`를 사용합니다.

이 명령은 `.github/workflows`, `README.md`, `mise.toml`, `package.json`,
lockfile, `.harness/config/project-profile.yaml`, `.harness/state`,
`.specify/**`, `specs/**`, `tests/**`, `ROADMAP.md`, `docs/index.html`,
`apps/**`처럼 프로젝트별로 달라지는 파일은 보존합니다. 여기에는 app-local
`apps/*/AGENTS.md`, `apps/*/CLAUDE.md`, `apps/*/.env.example`,
`apps/*/.infisical.json`, 앱 소스와 앱별 패키지 파일이 포함됩니다. 루트
`AGENTS.md`와 `CLAUDE.md`는 공통 진입점이므로 업데이트 대상입니다.

중앙 하네스의 `apps/**` 파일은 신규/기존 앱 adopt용 참조 템플릿입니다.
다운스트림 업데이트 체크와 자동 적용은 실제 앱 코드와 app-local 설정을
비교하거나 덮어쓰지 않습니다.

초기 `git clone`에는 upstream 하네스의 작업 산출물이 물리적으로 포함될 수 있습니다.
새 프로젝트에서는 `./harness init-project <name>`이 upstream 작업 상태를
`--reset-git` 여부와 무관하게 항상 정리합니다(정본 목록:
`.harness/scripts/setup/upstream-project-state.mjs`의
`UPSTREAM_PROJECT_STATE_PATHS`). 이후 업데이트 경로에서는 이 파일들이
project-owned로 보존됩니다.

## 자동 적용 모드와 prune

런처는 시작 시 `./harness update --auto`를 사용합니다. 이
모드는 shared harness path에 local change가 있으면 warning만 출력하며
적용하지 않고, upstream 삭제도 자동 삭제하지 않습니다. 삭제 반영, stale
skill directory 정리, dirty path 처리는 수동 `./harness update`에서만
수행합니다.

`update`는 변경된 공유 파일을 적용한 뒤, 상류
`.harness/shared-manifest.json`을 기준으로 다운스트림 worktree에서 stale
공유 파일을 prune합니다. 상류 rename/move/delete로 더 이상 존재하지 않는
파일과 빈 디렉터리가 정리됩니다. 로컬 수정이 있는 stale 파일은 warning과
함께 보존됩니다.

삭제는 **하네스가 이전에 배포한 파일(적용 전 로컬 shared-manifest 목록)로만
제한**됩니다. 상류에 없는 다운스트림 고유 파일(예: 기획 저장소의 자체
데이터)은 "다운스트림 고유 파일 보호(제거 생략)"로 보고될 뿐 삭제되지
않으며, 로컬 manifest를 읽지 못하면 삭제 단계 전체를 건너뜁니다(fail-safe).

기본 출력은 건너뛴 project-owned 경로, 적용 파일, 복구 파일, prune 파일
개수만 요약합니다. 전체 파일 목록이 필요하면 `--verbose` 또는
`HARNESS_UPDATE_VERBOSE=1`을 사용합니다.

## 중앙 소스 경로

기본값은 `https://github.com/CODIWORKS-Engineer/codi-harness.git#v2`입니다.
필요하면 `HARNESS_SOURCE_REPO`, `HARNESS_SOURCE_REF` 또는 `--source-repo`,
`--source-ref`로 바꿉니다.

## 컨텍스트 진입점 검사

```sh
./harness context-check
```

`AGENTS.md`와 `CLAUDE.md`가 공통 `.harness` 정책을 참조하는지, 두 파일이
시작 컨텍스트를 낭비할 만큼 커지지 않았는지 확인합니다. `./harness doctor`도
이 검사를 함께 실행합니다.

## 다운스트림에서 만든 개선을 업스트림으로 보내기

[upstream-contribution.md](./upstream-contribution.md) 참고.
