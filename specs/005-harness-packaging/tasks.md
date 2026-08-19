# Tasks: 하네스 패키지화 — 버전 캐시와 lock 기반 배포 (Phase 2)

**Input**: Design documents from `specs/005-harness-packaging/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/pkg-cli.md, quickstart.md

**Tests**: TDD 명시 요청됨 — 각 구현 태스크 전에 실패하는 테스트 배치.
공통 격리: 가짜 업스트림(태그 있는 로컬 bare git repo) +
`CODI_HARNESS_CACHE_DIR`/`HOME` 오버라이드.

**Organization**: US1 설치/materialize(MVP), US2 자동 업데이트,
US3 pin/롤백/오프라인, US4 릴리스 검증.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

**Purpose**: 테스트 격리 인프라와 lock 형식 시드

- [x] T001 `tests/helpers/pkg-fixture.mjs` 작성 — 가짜 업스트림 bare repo
  생성(+semver 태그 추가 헬퍼), 임시 캐시/HOME 디렉토리, 임시 다운스트림
  레포 스캐폴드를 제공하는 공용 헬퍼
- [x] T002 [P] `harness.lock.example`(채널/고정 두 형태 주석 포함) 추가,
  `.gitignore`에 materialize 생성물(`.harness/current` 등) 항목 추가

---

## Phase 2: Foundational — 버전 해석 로직 (blocking)

**Purpose**: 모든 스토리가 쓰는 lock 파싱·semver 채널 해석 (research.md R1)

- [x] T003 [TDD] `tests/pkg-resolve.test.mjs` 작성 후 **red 확인** — lock
  파싱(채널/고정/오류: 둘 다·둘 다 없음·형식 위반), semver 비교·정렬,
  latest-minor 해석(같은 major 내 최신, major 초과 제외), `ls-remote` 출력
  파싱
- [x] T004 `.harness/scripts/pkg/resolve-version.mjs` 구현 — T003 green

**Checkpoint**: 버전 판단 로직이 단독 검증 완료

---

## Phase 3: US1 — lock 설치와 materialize (P1) 🎯 MVP

**Goal**: lock이 가리키는 버전을 캐시로 받아 트리를 구성, 기능 동등 (US1)

**Independent Test**: 가짜 업스트림 + 격리 캐시만으로 quickstart 시나리오 1
검증 가능

- [x] T005 [US1] [TDD] `tests/pkg-fetch-materialize.test.mjs` 작성 후 **red
  확인** — ① 빈 캐시 수신: `.partial` 경유 후 확정 디렉토리만 존재 ② 기수신
  버전 재수신 없음 ③ materialize: `.harness/current` 심링크,
  `.claude/rules/shared` 하위 디렉토리 심링크, 스킬 디렉토리 단위 심링크
  (R4 문서화 형태) ④ 두 레포 상이 버전 공존 ⑤ 동시 수신 lockdir 직렬화
  ⑥ 대상 경로에 사용자 실파일 존재 → 보존+경고
- [x] T006 [US1] `.harness/scripts/pkg/fetch-version.sh` 구현 — shallow
  clone → partial→mv 확정, mkdir lockdir (R2)
- [x] T007 [US1] `.harness/scripts/pkg/materialize.sh` 구현 — current flip
  (`ln -sfn`) + 문서화된 심링크 형태 생성, 실파일 보존 (R3/R4)
- [x] T008 [US1] `harness` 런처 연계 — lock 존재(다운스트림 lock 모드) 감지
  시 install 흐름이 fetch+materialize를 수행
- [x] T009 [US1] `.harness/scripts/setup/init-project.sh`에 신규 프로젝트
  lock 모드 배선(harness.lock 생성 + gitignore 항목) —
  `.harness/scripts/setup/test-init-project-flows.sh`에 케이스 추가
- [x] T010 [US1] T005 전 케이스 green + quickstart 시나리오 1 실측

**Checkpoint**: US1 단독으로 MVP — 신규 프로젝트가 lock 모드로 동작

---

## Phase 4: US2 — 세션 시작 자동 업데이트 (P2)

**Goal**: minor/patch 자동 반영 — 수신은 백그라운드, flip은 preflight (US2)

**Independent Test**: 가짜 업스트림에 태그 추가 → 수신/pending/flip 경로를
격리 검증

- [x] T011 [US2] [TDD] `tests/pkg-pin-update.test.mjs`의 update 케이스 작성
  후 **red 확인** — ① patch 태그 추가 → 백그라운드 수신 + pending 마킹,
  current 불변 ② preflight 실행 → flip + pending 해제 ③ major 태그만 →
  수신·반영 없음 + 안내 출력 ④ 오프라인 → 조용히 스킵
- [x] T012 [US2] `.harness/scripts/setup/update-check.sh`에 채널 확인·수신
  연계 구현 (백그라운드, 반영 없음) (R5)
- [x] T013 [US2] `.harness/scripts/agent/agent-preflight.sh`에 pending flip
  구현 — exec 이전 수행으로 세션 단일 버전 보장 (R5)
- [x] T014 [US2] T011 update 케이스 green + quickstart 시나리오 2 실측

**Checkpoint**: "동기화 수고 0" 약속 성립

---

## Phase 5: US3 — pin / 롤백 / 오프라인 (P3)

**Goal**: 자동 채널의 안전판 — 즉시 고정/롤백, 오프라인 무영향 (US3)

**Independent Test**: 네트워크 차단(가짜 업스트림 경로 제거) 상태 포함 격리
검증

- [x] T015 [US3] [TDD] `tests/pkg-pin-update.test.mjs`의 pin 케이스 작성 후
  **red 확인** — ① 캐시 보유 버전 pin: 네트워크 없이 즉시 lock 갱신+flip
  ② 캐시 없음+오프라인 pin: exit 1 + lock·트리 불변 ③ `--channel
  latest-minor` 복귀 ④ 버전 형식 오류 exit 2
- [x] T016 [US3] `.harness/scripts/pkg/pin.sh` 구현 + `harness` 런처에
  `pin`/`update --major` case 추가 (contracts/pkg-cli.md)
- [x] T017 [US3] T015 green + quickstart 시나리오 3 실측

**Checkpoint**: 자동 최신 정책을 기본값으로 둘 수 있는 상태

---

## Phase 6: US4 — 릴리스 발행 검증 (P3)

**Goal**: 발행 실수를 코드로 차단, push는 사람 통제 (US4)

**Independent Test**: 임시 레포에서 태그 생성 시도로 격리 검증

- [x] T018 [US4] [TDD] `tests/pkg-release.test.mjs` 작성 후 **red 확인** —
  ① 형식 위반 태그(v1.2, 1.2.3, vX) 거부 ② CHANGELOG `## vX.Y.Z` 절 부재
  거부 ③ 정상 → annotated tag 생성 + push 미수행 ④ 중복 태그 거부
- [x] T019 [US4] `.harness/scripts/pkg/release-check.sh` 구현 + `harness`
  런처 `release` case + 루트 `CHANGELOG.md` 시드 — T018 green

**Checkpoint**: 업스트림 발행 절차 성립

---

## Phase 7: Polish & Cross-Cutting

- [x] T020 [P] 문서 — README에 lock 모드 소비 흐름, CONTRIBUTING/정책 문서에
  "캐시 경로(~/.codi-harness/**)를 덮는 deny 권한 규칙 금지" 명시 (R4 제약)
- [x] T021 전체 `npm test` green + quickstart 시나리오 5(기능 동등성 —
  lock 모드 임시 프로젝트에서 헤드리스 실행으로 심링크 rules/skills 로드
  실측, doctor 비교) + `specs/005-harness-packaging/verification.md` 기록
- [x] T022 `mise run feature:status:sync` 실행, 상태 전이 반영

**참고**: 기존 다운스트림 전환·구 동기화 흐름(update.sh/manifest) 은퇴는
Phase 3 spec에서 다룬다 — 이 spec 범위 아님.

---

## Dependencies

- Phase 1(T001~T002) → Phase 2(T003~T004) → US1(T005~T010) →
  {US2(T011~T014), US3(T015~T017), US4(T018~T019) 상호 독립} →
  Polish(T020~T022)
- US2·US3는 US1의 fetch/materialize에 의존, US4는 Foundational 이후 언제든
  가능 (업스트림 전용 경로)
- [P]: T002(예시 파일)는 T001과 병렬, T020(문서)은 구현과 병렬 가능

## Implementation Strategy

- **MVP = Phase 1~3 (US1)**: 신규 프로젝트가 lock 모드로 동작하는 시점.
  이후 US2(자동화) → US3(안전판) → US4(발행 규율) 순 증분.
- TDD 규율: 각 [TDD] 태스크는 red 확인 후 구현
  (superpowers:test-driven-development).
- 검증 규율: 완료 주장 전 quickstart 실측 증거를 verification.md에 기록
  (superpowers:verification-before-completion).
- 모든 테스트는 실제 네트워크·실제 홈 디렉토리를 건드리지 않는다
  (가짜 업스트림 + env 오버라이드).
