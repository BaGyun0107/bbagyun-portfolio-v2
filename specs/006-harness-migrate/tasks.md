# Tasks: 기존 다운스트림 migrate와 구 동기화 은퇴 (Phase 3)

**Input**: Design documents from `specs/006-harness-migrate/`

**Prerequisites**: plan.md, spec.md, research.md, contracts/migrate-cli.md,
quickstart.md

**Tests**: TDD — 각 구현 전에 실패 테스트. 픽스처는 005 확장(복사본 커밋형
가짜 다운스트림) + `CODI_HARNESS_CACHE_DIR` 격리.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 `tests/helpers/pkg-fixture.mjs`에 복사본 커밋형 가짜 다운스트림
  헬퍼 추가 — 패키지 파일 + shared-manifest.json 포함 트리를 git 커밋 상태로
  만들고, 프로젝트 소유물(specs/·skills-local/·project-profile.yaml) 시드

---

## Phase 2: Foundational — 제거 목록 계산 (blocking)

- [x] T002 [TDD] `tests/pkg-migrate.test.mjs`의 migrate-plan 단위 케이스
  작성 후 **red 확인** — manifest ∩ tracked − project-owned 계산, 프로젝트
  소유물 제외, untracked 무시 (research.md R1)
- [x] T003 `.harness/scripts/pkg/migrate-plan.mjs` 구현 —
  `project-owned.mjs` import 재사용, T002 green

---

## Phase 3: US1 — migrate 커맨드 (P1) 🎯 MVP

**Goal**: 기존 레포를 커맨드 1회로 lock 모드 전환 (계약: migrate-cli.md)

**Independent Test**: 가짜 복사본 레포에서 quickstart 시나리오 1~3 격리 검증

- [x] T004 [US1] [TDD] `tests/pkg-migrate.test.mjs`에 플로우 케이스 작성 후
  **red 확인** — ① dry-run 변경 0건+목록 출력 ② 전환: lock 생성+공유 제거+
  트리 구성, 프로젝트 소유물 무변경 ③ dirty 중단 exit 1 ④ 업스트림 거부
  exit 2 ⑤ 멱등 재실행 ⑥ 오프라인 중단(lock 미생성) exit 1
- [x] T005 [US1] `.harness/scripts/pkg/migrate.sh` 구현 — 계약 순서(감지→
  멱등→dirty→lock+pkg-sync→제거→doctor→요약+복원 안내), `--dry-run`/`--fresh`
- [x] T006 [US1] `harness` 런처에 `migrate` case + help 항목 추가
- [x] T007 [US1] T004 green + quickstart 시나리오 1~3 실측

**Checkpoint**: 기존 레포 전환 가능 — MVP

---

## Phase 4: US2 — 룰 이중 로드 해소 (P2)

- [x] T008 [US2] [TDD] `tests/pkg-migrate.test.mjs`에 단일 출처 케이스 추가
  후 **red 확인** — 전환 후 동일 공유 룰이 복사본·shared 링크 양쪽에 없음,
  `--fresh` 경로 동일
- [x] T009 [US2] `.harness/scripts/setup/init-project.sh`가 install 직후
  `migrate.sh --fresh`를 호출하도록 연계 (research.md R3) — T008 green

---

## Phase 5: US3 — 구 동기화 가드 (P3)

- [x] T010 [US3] [TDD] `tests/pkg-legacy-guard.test.mjs` 작성 후 **red
  확인** — lock 모드 레포에서 update 적용·prune-downstream·restore-missing-
  shared 실행 시 변경 0건+안내, lock 없으면 기존 동작
- [x] T011 [US3] `.harness/scripts/setup/update.sh`,
  `prune-downstream.mjs`, `restore-missing-shared.mjs`에 lock 감지 가드
  추가 + `update-check.sh` daily의 harness-repo fetch를 lock 모드에서 스킵
  (research.md R4) — T010 green

---

## Phase 6: US4 — 문서 정합화 (P3)

- [x] T012 [P] [US4] `AGENTS.md` 패키지 매니저 절 정합화 — 앱 의존성
  yarn/bun 금지 유지 + mise 빌드 도구(bun=GStack) 별개 경로 명시, 커맨드
  위치 매칭 가드와 일치하는 서술로 갱신

---

## Phase 7: Polish & Cross-Cutting

- [x] T013 [P] CONTRIBUTING.md(또는 README)에 기존 프로젝트 전환 가이드
  절 추가 — dry-run→리뷰→커밋→팀원 pull 후 bootstrap 순서
- [x] T014 전체 `npm test` green + quickstart 시나리오 1~5 실측 +
  `specs/006-harness-migrate/verification.md` 기록 (시나리오 6 실전 리허설은
  릴리스 후 항목으로 표기)
- [x] T015 `mise run feature:status:sync` 실행, 상태 전이 반영

---

## Dependencies

- T001 → T002~T003 → US1(T004~T007) → US2(T008~T009)
- US3(T010~T011)·US4(T012)는 Foundational 이후 US1과 독립 진행 가능
- [P]: T012·T013(문서)은 코드 작업과 병렬

## Implementation Strategy

- **MVP = Phase 1~3 (US1)**. US2는 migrate 재사용이라 작음. US3·US4는 독립.
- TDD·검증 규율은 004/005와 동일 (red 확인 → 구현 → quickstart 실측 기록).
