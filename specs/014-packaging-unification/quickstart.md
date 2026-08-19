# Quickstart: 패키징 단일화 검증

**Feature**: 014-packaging-unification

구현이 끝난 뒤 이 순서대로 실행해 기능이 실제로 동작하는지 확인한다.
자동화 테스트가 덮는 부분과 사람이 눈으로 봐야 하는 부분을 구분해 적는다.

## 전제

- 저장소 루트에서 실행한다.
- Node.js 24 (`mise` 로 관리).
- 실측 검증에는 임시 clone 을 쓴다 — 실제 다운스트림을 건드리지 않는다.

## 1. 자동화 테스트 (필수)

```sh
npm test
```

**기대**: 전체 통과, 건수는 655건 이상 (SC-007 — 감소하면 회귀).

기능별로 좁혀 볼 때:

```sh
node --test tests/harness-cli.test.mjs        # 도움말 분할
node --test tests/bootstrap-summary.test.mjs  # 요약 출력 계약
node --test tests/pkg-migrate.test.mjs        # 요약 데이터 기록
```

## 2. 도움말 분할 (FR-004, SC-001)

```sh
./harness help
```

**기대**:
- 명령이 4개만 보인다: `bootstrap`, `doctor`, `codex`, `claude`.
- 마지막 줄에 `./harness help --all` 안내가 있다.

```sh
./harness help --all
```

**기대**: 그룹 제목 4개(일상 / 점검 / 패키지 관리 / 레포 운영)와 함께 전체
명령이 보인다.

숨긴 명령이 여전히 동작하는지:

```sh
./harness pkg-sync --help 2>&1 | head -3
```

**기대**: 정상 응답. 기본 도움말에서 빠졌을 뿐 제거된 게 아니다.

## 3. 준비 명령 요약 (FR-017, SC-008)

전환 완료된 레포를 임시로 clone 해 실행한다.

```sh
cd "$(mktemp -d)"
git clone --depth 1 <전환된-레포-URL> t && cd t
./harness bootstrap
```

**기대**:
- `[bootstrap 1/7]` ~ `[bootstrap 7/7]` 진행 표시.
- 그 뒤에 `준비 완료 요약:` 블록.
- 버전 줄이 `이전 -> 이후` 또는 `변경 없음 (버전)` 형태.

같은 디렉터리에서 한 번 더:

```sh
./harness bootstrap
```

**기대** (FR-002, SC-003):
- 요약의 버전 줄이 `변경 없음`.
- `git status --short` 가 비어 있다 — 두 번째 실행이 워킹트리를 더럽히지
  않는다.

## 4. 소실 상태 복구 (FR-003, SC-004)

3번의 임시 clone 에서 이어서:

```sh
rm -rf .harness/policies .harness/hooks
./harness bootstrap
ls -la .harness/policies
```

**기대**: 심링크로 복구된다. 요약에 조치 필요 항목이 없다.

> 참고: `rm -rf` 는 임시 디렉터리에서만 실행한다. 실제 작업 레포에서
> 실행하지 않는다.

## 5. copy 모드 은퇴 예고 (FR-006/007, SC-005)

미전환(copy) 레포를 임시로 clone 해 실행한다.

```sh
cd "$(mktemp -d)"
git clone --depth 1 <미전환-레포-URL> c && cd c
ls harness.lock   # 없어야 한다 (copy 모드 확인)
./harness update --check
```

**기대**:
- 은퇴 예고와 `./harness migrate` 안내가 보인다.
- 갱신 확인 자체는 정상 동작한다 (종료 코드 0).

전환된 레포에서는 반대로:

```sh
cd <3번에서-만든-임시-clone>
./harness update --check
```

**기대**: 은퇴 예고가 **보이지 않는다** (FR-007).

## 6. 배포 모드 보고 (FR-008, SC-006)

```sh
./harness doctor 2>&1 | grep "배포 모드"
```

**기대**: lock 레포에서는 `배포 모드 lock (버전 X.Y.Z)`, copy 레포에서는
`배포 모드 copy — 전환하려면 ./harness migrate`.

## 7. 회귀 확인 (FR-014)

CI 경로가 멀쩡한지 확인한다.

```sh
./harness context-check
./harness doctor
```

**기대**: 둘 다 실패 0건.

CI 자가 부트스트랩 경로는 자동화 테스트가 덮는다
(`tests/harness-cli.test.mjs` 의 lock 부트스트랩 케이스).

## 검증 기록

위 결과를 `specs/014-packaging-unification/verification.md` 에 남긴다 —
실행한 명령, 핵심 출력, 통과/실패 여부. 임시 clone 에 쓴 레포 이름과 시점도
함께 적는다.
