---
description: "패키징 단일화 태스크 목록"
---

# Tasks: 패키징 단일화

**Input**: Design documents from `/specs/014-packaging-unification/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: TDD 요청됨 — 모든 동작 변경은 실패하는 테스트를 먼저 쓴다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 미완 태스크에 의존하지 않음)
- **[Story]**: 소속 사용자 스토리 (US1/US2/US3)

## Path Conventions

하네스는 단일 저장소 CLI 모음이다. 새 디렉터리를 만들지 않는다.

- 런처: `harness`
- 스크립트: `.harness/scripts/{setup,pkg,checks}/`
- 테스트: `tests/*.test.mjs`

---

## Phase 1: Setup (Shared Infrastructure)

**목적**: 작업 시작 전 기준선을 고정한다.

- [X] T001 `npm test` 를 실행해 현재 통과 건수를 기록하고 `specs/014-packaging-unification/verification.md` 에 기준선으로 남긴다 (SC-007 비교 기준)
- [X] T002 `.harness/state/current-size` 에 `Large` 가 기록되어 있는지 확인하고, 없으면 기록한다

---

## Phase 2: Foundational (Blocking Prerequisites)

**목적**: 여러 스토리가 공유하는 상태 파일 규약을 먼저 세운다. US1 의 요약
출력이 이 규약에 의존하므로 선행이다.

**⚠️ US1 시작 전 완료 필수**

- [X] T003 `tests/bootstrap-summary.test.mjs` 를 새로 만들고, 요약 상태 파일 파서가 `version` / `reclaimed` / `doctor` 세 종류를 읽고 알 수 없는 줄을 무시하는지 검증하는 실패 테스트를 작성한다 (data-model.md 1절)
- [X] T004 요약 상태 파일 파서를 `.harness/scripts/setup/bootstrap-summary.mjs` 에 구현해 T003 을 통과시킨다 — 같은 종류가 중복되면 마지막 값을 쓰고, 파일이 없거나 비면 빈 결과를 낸다
- [X] T005 `tests/bootstrap-summary.test.mjs` 에 형식이 깨진 줄이 섞여도 파서가 예외를 던지지 않고 나머지를 처리하는 케이스를 추가하고 통과시킨다 (contracts: "구버전 스크립트와 섞여도 깨지지 않아야 한다")

---

## Phase 3: User Story 1 - 팀원이 명령 하나만 알면 된다 (Priority: P1) 🎯 MVP

**목표**: `./harness bootstrap` 하나로 준비·갱신이 끝나고, 무엇이 바뀌었는지
알 수 있다.

**독립 검증**: 전환 완료 레포를 새로 clone 한 상태 / `git pull` 로 하네스가
빠진 상태 / 링크가 어긋난 상태 각각에서 `bootstrap` 만 실행해 셋 다 같은
정상 상태에 도달하는지 확인한다 (quickstart 3·4절).

### Tests for User Story 1 ⚠️

- [X] T006 [P] [US1] `tests/harness-cli.test.mjs` 에 기본 도움말이 일상 명령 4개(`bootstrap`/`doctor`/`codex`/`claude`)만 싣고 `--all` 안내 줄을 포함하는지 검증하는 실패 테스트를 추가한다 (FR-004)
- [X] T007 [P] [US1] `tests/harness-cli.test.mjs` 에 `help --all` 이 런처 `case` 분기의 모든 명령을 빠짐없이 나열하는지 대조 검증하는 실패 테스트를 추가한다 — 명령 추가 시 문서 누락을 잡는 자기검증형 테스트 (contracts: harness-cli.md)
- [X] T008 [P] [US1] `tests/bootstrap-summary.test.mjs` 에 `bootstrap` 이 7단계 이후 요약 블록을 출력하고, 값이 없는 항목은 줄 자체를 생략하는지 검증하는 실패 테스트를 추가한다 (FR-017)
- [X] T009 [P] [US1] `tests/bootstrap-summary.test.mjs` 에 요약 생성이 실패해도 `bootstrap` 종료 코드가 영향받지 않는지 검증하는 실패 테스트를 추가한다 (contracts: "보고 기능이 준비 자체를 막으면 안 된다")
- [X] T010 [P] [US1] `tests/bootstrap-summary.test.mjs` 에 `--dry-run` 에서는 요약을 출력하지 않는지 검증하는 실패 테스트를 추가한다
- [X] T031 [US1] `tests/harness-cli.test.mjs` 에 `bootstrap` 을 연속 2회 실행했을 때 두 번째 실행이 워킹트리에 변경을 남기지 않는지 검증하는 실패 테스트를 추가한다 (FR-002, SC-003)
- [X] T032 [US1] `tests/harness-cli.test.mjs` 에 공유 경로(`.harness/policies` 등)가 소실된 상태에서 `bootstrap` 1회로 링크가 복구되는지 검증하는 실패 테스트를 추가한다 (FR-003, SC-004)
- [X] T033 [US1] `tests/harness-cli.test.mjs` 에 `bootstrap` 이후 병합 스킬 트리(`.claude/skills`)와 `.specify` 자산이 존재하는지 검증하는 실패 테스트를 추가한다 — T011/T015 가 `bootstrap` 을 수정하므로 준비 작업 누락 회귀를 막는다 (FR-005)
- [X] T034 [US1] `tests/harness-cli.test.mjs` 에 진행 표시가 `[bootstrap 1/7]`~`[bootstrap 7/7]` 로 번호 누락·중복 없이 연속인지 검증하는 실패 테스트를 추가한다 (FR-016)

### Implementation for User Story 1

- [X] T011 [US1] `harness` 런처의 `help` 분기를 기본/`--all` 두 갈래로 나눈다 — 기본은 일상 4개와 `--all` 안내, `--all` 은 그룹 제목 4개(일상/점검/패키지 관리/레포 운영)와 전체 목록 (T006/T007 통과)
- [X] T012 [US1] `.harness/scripts/pkg/pkg-sync.sh` 가 버전 전/후를 `.harness/state/bootstrap-summary` 에 `version <이전>-><이후>` 또는 `version unchanged:<버전>` 형태로 기록하게 한다 (data-model.md 1절)
- [X] T013 [US1] `.harness/scripts/pkg/reclaim-shared.sh` 가 회수 건수를 같은 파일에 `reclaimed <n>` 으로 기록하게 한다 — 0건이면 기록하지 않는다
- [X] T014 [US1] `.harness/scripts/checks/doctor.sh` 가 fail/warn 집계를 같은 파일에 `doctor <fail>/<warn>` 으로 기록하게 한다
- [X] T015 [US1] `.harness/scripts/setup/bootstrap.sh` 가 시작 시 요약 파일을 삭제하고, 7단계 이후 T004 의 파서로 읽어 요약 블록을 출력한 뒤 파일을 삭제하게 한다 (T008/T009/T010 통과)
- [X] T016 [US1] `.harness/scripts/setup/bootstrap.sh` 4단계(`mise install`)에 별도 스킵 판정을 넣지 않는 사유를 스크립트 주석으로 남긴다 — `mise install` 이 이미 설치된 도구를 건너뛰므로 별도 캐시는 이중 관리이며 드리프트 위험이다 (FR-018, research R4 에서 기각된 대안)

**완료 시점**: US1 만으로 "팀원은 `bootstrap` 하나만 안다" 가 성립한다 — MVP.

---

## Phase 4: User Story 2 - copy 모드가 안전하게 은퇴한다 (Priority: P2)

**목표**: copy 레포 사용자가 전환 방법을 알게 되고, 임의의 레포에서 현재
배포 모드를 확인할 수 있다.

**독립 검증**: copy 레포에서 갱신하면 예고가 뜨고 갱신은 정상 동작하며,
lock 레포에서는 예고가 뜨지 않는지 확인한다 (quickstart 5·6절).

**이번 범위**: 예고(FR-006/007)와 모드 보고(FR-008)까지. 제거 실행은
Out of Scope.

### Tests for User Story 2 ⚠️

- [X] T017 [P] [US2] `tests/pkg-legacy-guard.test.mjs` 에 copy 모드 레포에서 갱신 적용 시 은퇴 예고와 `migrate` 안내가 stdout 에 나오고 종료 코드가 바뀌지 않는지 검증하는 실패 테스트를 추가한다 (FR-006)
- [X] T018 [P] [US2] 같은 파일에 lock 모드 레포에서는 은퇴 예고가 나오지 않는지 검증하는 실패 테스트를 추가한다 (FR-007)
- [X] T019 [P] [US2] `tests/harness-cli.test.mjs` 에 `doctor` 가 배포 모드를 한 줄 보고하고, 그 줄이 기존 fail/warn 집계 수를 바꾸지 않는지 검증하는 실패 테스트를 추가한다 (FR-008, contracts)

### Implementation for User Story 2

- [X] T020 [US2] `.harness/scripts/setup/update.sh` 의 `apply-harness` 진입점에 은퇴 예고를 stdout 으로 출력한다 — lock 모드는 이미 조기 종료하므로 별도 분기를 두지 않는다 (T017/T018 통과, research R2)
- [X] T021 [US2] `.harness/scripts/checks/doctor.sh` 에 `harness.lock` 유무 기반 배포 모드 보고를 추가한다 — 두 경우 모두 `ok` 이며 copy 는 `migrate` 안내를 덧붙인다 (T019 통과)

---

## Phase 5: User Story 3 - 새 프로젝트는 처음부터 패키징 구조다 (Priority: P3)

**목표**: 새 프로젝트 생성 결과가 전환 완료 레포와 같은 구조임을 보장한다.

**독립 검증**: 생성 결과의 구조를 전환 완료 레포와 대조한다.

**범위 주의**: FR-013(중간 단계 제거)은 Out of Scope 다 — research R3 에서
`migrate --fresh` 가 필수 단계임이 확인됐다. 이 스토리는 FR-012(결과 구조
동일) 검증에 한정된다.

### Tests for User Story 3 ⚠️

- [X] T022 [P] [US3] FR-012 안전망을 확인한다. `init-project` 는 GitHub 레포 생성·push 를 포함해 통째로 실행할 수 없으므로 정적 대조가 유일한 실효 검증이다. 기존 테스트 `init-project bootstraps mise and harness install in one command` 가 `lock → migrate --fresh → install` 순서를 이미 고정하고 있고, 그 순서가 곧 lock 구조 성립 조건이다 — 뮤테이션으로 실효성을 확인하고 해당 테스트에 FR-012 근거 주석을 남긴다 (중복 테스트를 새로 만들지 않는다)

### Implementation for User Story 3

- [X] T023 [US3] T022 가 실패하면 `.harness/scripts/setup/init-project.sh` 의 lock 배선을 고쳐 통과시킨다. 이미 통과하면 그 사실을 `specs/014-packaging-unification/verification.md` 에 기록하고 코드는 건드리지 않는다

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T024 [P] `CONTRIBUTING.md` 와 `README.md` 의 온보딩 안내를 `./harness bootstrap` 하나로 정리한다 — 여러 명령을 상황별로 고르라는 서술이 남아 있으면 제거한다 (FR-001, SC-002)
- [X] T025 [P] `.harness/skills/codi-dev-workflow/SKILL.md` 에 하네스 준비 명령 언급이 있으면 단일 명령 기준으로 갱신한다. 없으면 확인했다는 사실만 기록한다
- [X] T026 quickstart.md 의 1~7절을 순서대로 실행하고 결과를 `specs/014-packaging-unification/verification.md` 에 기록한다 — 실행 명령, 핵심 출력, 통과 여부, 사용한 임시 clone 레포와 시점
- [X] T027 `npm test` 로 전체 회귀를 확인한다 — T001 기준선 대비 감소가 없어야 한다 (SC-007)
- [X] T028 `./harness context-check` 와 `./harness doctor` 를 실행해 실패 0건을 확인한다 (FR-014)
- [X] T029 `mise run feature:status:sync` 를 실행하고, 결정적 전이만 `--apply` 로 반영한다. 애매하거나 `on-hold` 인 항목은 보고만 한다
- [X] T035 014 를 기능 카탈로그에 등록한다 — `specs/014-*/status.yaml` 은 그 자체로 카탈로그 인식 트리거라, `data/feature-definitions.json` 항목만 추가하면 relation/traceability 가 어긋나 `feature-hub-canonical-data` 테스트가 깨진다. `data/feature-relations.json` 의 entities·links(satisfied-by / specified-by / verified-by / appears-on / depends-on)와 테스트의 기대 상수(기능 수 13→14, 링크 수 103→N)를 함께 갱신해야 한다. status.yaml 은 이 태스크에서 함께 커밋한다 (013 등록 커밋 `2b3e178` 참조)
- [X] T030 root `ROADMAP.md` 에 014 상태와 링크를 반영한다

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
   ↓
Phase 2 (Foundational) ← US1 의 요약 출력이 이 규약에 의존
   ↓
Phase 3 (US1, P1) ──┐
Phase 4 (US2, P2) ──┼─→ 서로 독립 (다른 파일)
Phase 5 (US3, P3) ──┘
   ↓
Phase 6 (Polish)
```

### User Story Dependencies

- **US1**: Phase 2 완료 후 시작. 다른 스토리에 의존하지 않는다.
- **US2**: Phase 2 완료 후 시작 가능. US1 과 파일이 겹치지 않는다
  (`update.sh`/`doctor.sh` vs `harness`/`bootstrap.sh`).
  단 T014(doctor 가 요약 기록)와 T021(doctor 가 모드 보고)은 같은 파일이라
  순서를 지킨다.
- **US3**: 독립. 검증 위주라 언제든 실행 가능.

### Within Each User Story

테스트 → 구현 순서를 지킨다. 각 스토리의 테스트 태스크는 서로 병렬 가능하다
(다른 assert, 같은 파일이면 순차).

### Parallel Opportunities

- T006/T007/T031~T034 는 같은 파일(`harness-cli.test.mjs`)이라 순차.
- T008/T009/T010 도 같은 파일(`bootstrap-summary.test.mjs`)이라 순차.
- **US1 과 US2 는 병렬 가능** — 단 T014 → T021 순서만 지킨다.
- T024/T025 는 다른 파일이라 병렬.

## Parallel Example: US1 과 US2 동시 진행

```
스트림 A (US1): T006 → T007 → T011                    (도움말)
                T008 → T009 → T010 → T031 → T032
                     → T033 → T034                     (테스트)
                T012 → T013 → T014 → T015 → T016       (요약 배선)
스트림 B (US2): T017 → T018 → T020 → T019 → T021

동기화 지점: T014(A, doctor 가 요약 기록)가 T021(B, doctor 가 모드 보고)보다
먼저. 둘 다 doctor.sh 를 고치므로 순서를 지킨다.
```

## Implementation Strategy

### MVP First (US1 만)

Phase 1 → 2 → 3 까지가 MVP 다. 이 시점에 "팀원은 `bootstrap` 하나만 안다"
가 성립하고, 나머지 없이도 배포할 수 있다.

### Incremental Delivery

1. **MVP**: Phase 1~3 (T001~T016 + T031~T034) → 단일 진입점 완성
2. **+ 은퇴 예고**: Phase 4 (T017~T021) → copy 레포 사용자에게 전환 경로 제시
3. **+ 검증**: Phase 5 (T022~T023) → 신규 프로젝트 구조 확인
4. **마무리**: Phase 6 (T024~T030) → 문서·회귀·상태 동기화

각 단계 끝에서 커밋하고, 그 시점의 저장소가 그린인지 확인한다.

### 커밋 규율

- `speckit-implement` 는 커밋하지 않는다. 원자 커밋은 별도로 만든다.
- 테스트 → 구현 쌍을 하나의 커밋으로 묶는다 (RED 를 커밋하지 않는다).
- 커밋 메시지는 `<type>: <한국어 설명>` 형식.
- **스토리 경계를 커밋 경계로 삼는다** — 한 커밋이 두 스토리를 걸치지 않게
  해서 스토리 단위 되돌림이 가능하게 한다 (FR-015).
