# 하네스 패키징 가이드 (lock 모드)

> **shared 하네스 문서입니다.** 다운스트림 프로젝트는 직접 수정하지 않습니다.
> 배포 모드 정책의 정본은 `.harness/policies/update-policy.md`입니다.

하네스 본체를 버전 캐시 + `harness.lock`으로 소비하는 lock 모드의 사용자
가이드입니다. specs/005(패키지화)와 specs/006(다운스트림 전환)의 결과물을
다룹니다.

## 1. 두 배포 모드

| 모드 | 판별 | 하네스 본체가 오는 곳 |
| --- | --- | --- |
| **lock 모드** (신규 기본) | 레포 루트에 `harness.lock` 존재 | 버전 캐시에서 materialize |
| **copy 모드** (레거시) | `harness.lock` 없음 | `./harness update`가 upstream 파일을 레포에 복사. 단계적 은퇴 예고 상태 — 제거 조건은 전 다운스트림 lock 전환 완료(specs/014) |

`harness.lock`은 몇 줄짜리 project-owned 커밋 파일이다:

```json
{ "schema_version": 1, "channel": "latest-minor" }
```

`channel`은 `latest-minor`(기본 — 같은 major의 최신 minor/patch 추종) 또는
`vX.Y.Z` 고정 버전이다. `repo` 필드는 업스트림 주소를 명시한다
(`harness.lock.example` 참조; 생략 시 기본 업스트림).

파일 존재를 직접 확인할 필요는 없다 — `./harness doctor`가 현재 배포 모드를
`배포 모드 lock (버전 X)` / `배포 모드 copy — 전환하려면 ./harness migrate`
형태로 보고한다 (감사 L-14).

## 2. lock 모드 소비 흐름

```text
clone → ./harness bootstrap (또는 install)
  → (fresh clone) 런처 자가 부트스트랩: harness.lock만으로 패키지 1회 수신·materialize
  → pkg-sync: lock 해석 → 버전 수신(fetch) → materialize
  → .harness/current 심링크가 캐시 버전을 가리킴
```

fresh clone에는 공유 스크립트가 아직 없다 — 런처가 `harness.lock`의
repo/버전(채널이면 최신 태그)을 최소 셸로 해석해 스스로 첫 수신을 수행한
뒤, 채널 정밀 해석은 정식 `pkg-sync`에 위임한다.

- `./harness install`은 `harness.lock`이 있으면 자동으로 `pkg-sync`를 먼저
  실행한다.
- 공유 본체 파일은 커밋에서 사라지고 `.harness/current` 경유로만 존재한다.
- pkg-sync 는 materialize 직후 gitignore 필수 항목을 idempotent 반영하고,
  잔재(커밋에 남은 하네스 파일·링크)를 발견하면 **보고만** 한다
  (specs/015). 인덱스 변경·파일 삭제는 소유자 명령
  `./harness prune-downstream --apply` 전용이다 — 팀원 머신의 bootstrap 은
  git 인덱스를 절대 바꾸지 않는다. 리포 내부 심링크는 전부 상대경로로
  생성되며 `.harness/current`(머신 캐시 대상)만 절대경로다.

## 3. 버전 캐시 구조

- 위치: `$HOME/.codi-harness/versions/<X.Y.Z>` (오버라이드:
  `CODI_HARNESS_CACHE_DIR`).
- 수신은 partial 디렉터리에 받은 뒤 `mv`로 원자 확정하고, 동시 실행은
  lockdir로 직렬화된다.
- 전환은 `.harness/current` 심링크 하나의 `ln -sfn` 교체가 유일한 원자
  지점이다 — 실패해도 어중간한 트리가 남지 않는다.
- 캐시는 머신 공유이며 버전마다 계속 쌓인다(자동 삭제 없음, 버전당 약
  10MB). materialize가 소비 레포를 `$CACHE_DIR/repos` 레지스트리에
  등록하고, 정리는 `./harness pkg-gc`가 담당한다 — 레포들이 참조 중인
  버전(current·pending)과 최신 버전만 남기고 미참조 구버전을 제거한다.

## 4. 자동 업데이트 시점 (진행 중 세션 불변)

1. 세션 시작 시 `pkg-update-check`가 채널의 새 버전을 **수신만** 하고
   `.harness/state/pkg-pending`에 기록한다. 반영하지 않는다.
2. **다음** 세션 시작(agent preflight)에서 `pkg-apply-pending`이 pending을
   반영(flip)한다.
3. 그래서 진행 중인 세션의 하네스는 절대 바뀌지 않는다. major 업그레이드는
   자동 반영 없이 안내만 나온다.

## 5. 수동 제어 명령

```sh
./harness pkg-sync                    # 수동 동기화 (수신 + materialize)
./harness pin v1.2.3                  # 특정 버전 고정 / 롤백
./harness pin --channel latest-minor  # 채널 추종으로 복귀
./harness update --major              # 상위 major 반영 (명시적 실행 전용)
./harness pkg-gc [--dry-run]          # 버전 캐시 정리 (미참조 구버전 제거)
```

## 6. lock 모드에서 구 동기화 명령

lock 모드 레포에서 `./harness update`(비-major)는 copy 방식 동기화를 수행하지
않고 lock 흐름 안내로 대체된다(specs/006 FR-009). copy 모드 레포에서만 기존
`update --apply-harness` 동작이 유지된다.

## 6.5 새 프로젝트 스켈레톤 (new-project)

새 프로젝트는 하네스 full clone 대신 최소 스켈레톤에서 시작할 수 있다
(specs/019):

```sh
./harness new-project <dir>   # 런처 + harness.lock + 씨앗 파일 생성, git init
cd <dir> && ./harness bootstrap
```

- 스켈레톤 구성 정본은 `.harness/scripts/setup/new-project-skeleton.sh`의
  파일 목록 하나다. 나머지는 bootstrap의 lock 자가 부트스트랩(§2)이 채운다.
- 스켈레톤은 자기 git 히스토리로 시작하므로 `--reset-git`·잔재 정리가
  필요 없고, `init-project`는 스켈레톤 출발을 감지해(harness.lock 존재 +
  upstream 작업 상태 부재) 해당 단계를 건너뛴다.
- 버전은 lock 채널이 bootstrap 시점에 해석한다 — 별도 발행물이 없어
  릴리스와의 드리프트가 구조적으로 없다.

## 7. 기존 레포 전환 (migrate)

```sh
./harness update --apply-harness   # 1) 레포에 커밋된 하네스 사본을 최신으로
git add -A && git commit           # 2) migrate는 dirty worktree면 중단
./harness migrate --dry-run        # 3) 제거/전환 계획만 출력
./harness migrate                  # 4) 복사본 공유 파일 제거 + harness.lock 생성
git add -A && git commit           # 5) 전환 diff 커밋
./harness prune-downstream         # 6) 잔재 분류별 확인 (specs/015)
./harness prune-downstream --apply # 7) 정리 실행 (소유자 전용)
git add -u && git commit           # 8) 정리 diff 커밋 — add -u: 비추적 링크를
                                   #    도로 담지 않는다
```

- **1)을 먼저 하는 이유**: migrate의 초반 단계는 레포에 커밋된 자기 사본으로
  실행된다. 사본이 낡으면(구세대 migrate 결함 등) 전환이 실패할 수 있으므로
  update로 마이그레이션 도구를 현행화한 뒤 돌린다.
- 업스트림에 릴리스 태그(vX.Y.Z)가 있어야 한다. 업스트림(하네스) 레포에서는
  거부되고, dirty worktree면 중단된다. 멱등이다.
- 전환 후: 팀원은 `./harness bootstrap` 한 번으로 합류한다. 이 절이 전환
  절차의 정본이다 — `CONTRIBUTING.md`의 해당 절은 여기를 가리키는 포인터다.

### CI는 별도 조정이 필요 없다

lock 모드에서 `.harness/**` 는 git 비추적이라 CI의 `actions/checkout`
직후에는 존재하지 않는다. 그래서 CI가 직접 호출하는 스크립트만은 커밋으로
남긴다 (`migrate-plan.mjs` 의 `KEEP_COMMITTED`):

- `.harness/scripts/checks/ci-node-verify.sh`
- `.harness/scripts/deploy/node-package-manager.sh`
- `.harness/scripts/audit/osv-severity-gate.js`
- `.harness/scripts/audit/dependency-impact-report.js`

런처(`harness`)·`AGENTS.md`·`CLAUDE.md` 와 같은 취급이다. 워크플로우는
기존 호출을 그대로 두면 되고, 복원 스텝·캐시·업스트림 인증 토큰이 전부
필요 없다.

버전 드리프트도 없다: `migrate` 와 `pkg-sync` 가 매번
`keep-committed.sh` 로 이 파일들을 패키지 버전으로 맞춘다(심링크 자리는
건드리지 않는다). 갱신분은 커밋 diff에 보이므로 리뷰된다.

CI가 새로운 하네스 스크립트를 호출하게 되면 `KEEP_COMMITTED` 에 추가해야
한다 — 빠뜨리면 회귀 테스트가 실패한다.

## 8. 릴리스 발행 (업스트림 하네스 레포 전용)

```sh
./harness release v1.2.3   # CHANGELOG 해당 버전 절 검증 + annotated tag 생성
git push origin v1.2.3     # push는 수동
```

major 태그는 breaking 변경 전용이다.

## 9. 오프라인 동작

네트워크가 없으면 현재 캐시된 버전을 그대로 사용한다(fail-open). 실패하는
경우는 "해당 버전이 캐시에 없음 + 오프라인"뿐이다.

## 10. 소유권 요약

| 대상 | 소유 |
| --- | --- |
| `harness.lock` | project-owned, 커밋 대상 |
| `$HOME/.codi-harness/versions/*` | 머신 로컬 캐시 (커밋 안 함) |
| `.harness/current` | materialize가 관리하는 심링크 |
| `.harness/state/pkg-pending` | 세션 로컬 상태 (git-ignore) |

문제가 생기면 `./harness doctor`로 상태를 점검하고, 특정 버전으로 즉시
돌아가려면 `./harness pin <ver>`를 쓴다.

