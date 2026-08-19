---
description: "Task list — 기능정의서 탭 데이터 소스 전환"
---

# Tasks: 기능정의서 탭 데이터 소스 전환

**Input**: Design documents from `specs/003-feature-definition-source/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/scanner-contract.md, quickstart.md

**Tests**: TDD 요청됨 — 각 스토리의 테스트를 구현 전에 작성하고 FAIL을 확인한다.

**Organization**: 스토리별 그룹. 단, US1~US3의 구현이 같은 파일
(`scan-service-definition.mjs`)을 건드리므로 구현 태스크는 순차 진행한다(테스트는
서로 다른 케이스라 병렬 가능).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일, 선행 의존 없음 → 병렬 가능
- **[Story]**: US1/US2/US3
- 각 태스크에 정확한 파일 경로 포함

## Path Conventions

- 소스: `.harness/scripts/docs/lib/`, `.harness/scripts/docs/build-hub.mjs`
- 테스트: `tests/`, fixture: `tests/fixtures/feature-hub/`
- 소스 규약 경로: 저장소 루트 `data/feature-definitions.json`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 변경 대상 확인과 baseline 회귀 기준 확보

- [x] T001 현재 동작 baseline 기록: `npm test`를 실행해 기존 feature-hub 테스트가
  모두 통과함을 확인하고 통과 목록을 남긴다(회귀 기준, SC-006 대비).
- [x] T002 [P] 변경 대상 재확인: `.harness/scripts/docs/lib/scan-service-definition.mjs`,
  `.harness/scripts/docs/build-hub.mjs`의 현재 STICKY 경로/env 참조 위치를 확인한다
  (grep `codi-STICKY-v1`, `SERVICE_DEFINITION_HTML`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 스토리가 공유하는 테스트 fixture와 소스 규약 경로 상수 준비

**⚠️ CRITICAL**: 이 단계 완료 전에는 어떤 스토리 구현도 시작할 수 없다.

- [x] T003 [P] 정상 fixture 생성: `tests/fixtures/feature-hub/feature-definitions.valid.json`
  — canonical 필드를 가진 기능정의 행 2~3개(배열 형태).
- [x] T004 [P] 손상 fixture 생성: `tests/fixtures/feature-hub/feature-definitions.broken.json`
  — 파싱 불가능한 JSON(닫히지 않은 중괄호).
- [x] T005 [P] 객체형 fixture 생성:
  `tests/fixtures/feature-hub/feature-definitions.object.json` — `{ "rows": [...] }` 형태.
- [x] T006 소스 규약 경로 상수 정의: `scan-service-definition.mjs`에 저장소 루트 기준
  `data/feature-definitions.json`을 가리키는 기본 경로 상수를 추가하고, 기존 STICKY
  `DEFAULT_SERVICE_DEFINITION_PATH` 상수를 제거한다(research R1, R4).

**Checkpoint**: fixture와 규약 경로 준비 완료 — 스토리 구현 시작 가능.

---

## Phase 3: User Story 1 - 정규화 산출물이 기능정의서 탭에 표시됨 (Priority: P1) 🎯 MVP

**Goal**: `data/feature-definitions.json`을 읽어 serviceDefinition 모델(rows)을 만들고
기능정의서 탭에 표시한다. 렌더러 계약 유지.

**Independent Test**: 루트에 정상 소스를 두고 `mise run docs:build` → 기능정의서 탭에
행 표시 + 로그 "기능정의 N건".

### Tests for User Story 1 ⚠️ (먼저 작성 → FAIL 확인)

- [x] T007 [P] [US1] 정상 배열 소스 테스트를
  `tests/feature-hub-service-definition.test.mjs`에 작성: 정상 fixture를 주면
  `rows.length`가 fixture 행 수와 같고, `Row_ID`/`Title`이 매핑되며 `warning===''`,
  `columns`가 `SERVICE_DEFINITION_COLUMNS`와 일치함을 단언(contract 표 1행).
- [x] T008 [P] [US1] 객체형(`{rows:[...]}`) 소스 테스트를 같은 파일에 작성:
  객체형 fixture를 주면 배열과 동일 결과가 나옴을 단언(contract 표 2행, research R2).
- [x] T009 [P] [US1] 누락/추가 필드 정규화 테스트를 같은 파일에 작성: canonical 필드
  일부 누락 행은 빈 문자열로 채우고, 스키마 외 추가 필드는 무시함을 단언(contract 표
  7·8행).

### Implementation for User Story 1

- [x] T010 [US1] `scan-service-definition.mjs`의 `extractRows`(HTML `const DATA` 정규식
  파싱)를 제거하고, JSON 소스를 읽어 canonical 필드로 정규화하는 로직으로 교체한다.
  배열/`{rows:[...]}` 두 형태를 받고, 반환 계약
  `{ sourcePath, columns, rows, warning }`을 유지한다(contract, data-model).
- [x] T011 [US1] `build-hub.mjs`의 `scanServiceDefinition` 호출부에서 STICKY 절대경로
  fallback과 `process.env.SERVICE_DEFINITION_HTML` 우회를 제거하고, 규약 경로로
  호출하도록 배선한다. 생성 로그의 "기능정의 N건"이 새 소스 기준으로 보고되게 한다
  (FR-003, FR-008).
- [x] T012 [US1] T007~T009 테스트가 통과하는지 `npm test`로 확인한다(GREEN).

**Checkpoint**: 정상 소스가 기능정의서 탭에 표시됨 — US1 독립 검증 가능.

---

## Phase 4: User Story 2 - 소스가 없어도 허브 생성이 성공함 (Priority: P1)

**Goal**: 소스 부재 시 빈 탭 + 빌드 성공, STICKY 로컬 경로 참조 0건.

**Independent Test**: 소스 파일 없는 상태에서 `mise run docs:build` → exit 0, 기능정의서
탭 빈 상태, 다른 탭 정상.

### Tests for User Story 2 ⚠️ (먼저 작성 → FAIL 확인)

- [x] T013 [P] [US2] 소스 부재 테스트를 `tests/feature-hub-service-definition.test.mjs`에
  작성: 존재하지 않는 경로를 주면 `rows:[]`, `warning`에 not-found 취지, 예외 없음,
  `columns` 유지를 단언(contract 표 3행).
- [x] T014 [P] [US2] 로컬 절대경로 부재 정적 테스트를 별도 테스트 파일
  `tests/feature-hub-no-hardcoded-path.test.mjs`에 작성:
  `scan-service-definition.mjs`와 `build-hub.mjs` 소스 텍스트에 `codi-STICKY-v1`,
  `SERVICE_DEFINITION_HTML` 문자열이 없음을 단언(SC-004, FR-007).

### Implementation for User Story 2

- [x] T015 [US2] `scan-service-definition.mjs`에서 소스 부재 시 `rows:[]` + not-found
  warning으로 fail-open 반환하도록 보장한다(T010 구현에 이미 포함되면 확인만).
- [x] T016 [US2] T013~T014 테스트 통과를 `npm test`로 확인한다(GREEN).

**Checkpoint**: 소스 없어도 빌드 성공, 하드코딩 경로 제거 확인 — US2 독립 검증 가능.

---

## Phase 5: User Story 3 - 손상된 소스에서도 빌드가 무너지지 않음 (Priority: P2)

**Goal**: 깨진/구조 불일치 소스에서 경고 + fail-open, 빌드 성공.

**Independent Test**: 깨진 JSON을 두고 `mise run docs:build` → exit 0 + 경고, 기능정의서
탭 빈 상태.

### Tests for User Story 3 ⚠️ (먼저 작성 → FAIL 확인)

- [x] T017 [P] [US3] 파싱 불가 소스 테스트를
  `tests/feature-hub-service-definition.test.mjs`에 작성: 깨진 fixture를 주면 `rows:[]`,
  `warning`에 parse-failed 취지, 예외 없음을 단언(contract 표 4행).
- [x] T018 [P] [US3] 구조 불일치 테스트를 같은 파일에 작성: 배열/`rows` 아닌 JSON을
  주면 `rows:[]` + 구조 경고를 단언. 빈 배열 소스는 `rows:[]` + `warning===''`(정상)임도
  단언(contract 표 5·6행).

### Implementation for User Story 3

- [x] T019 [US3] `scan-service-definition.mjs`에서 `JSON.parse` 실패를 try/catch로
  잡아 parse-failed warning으로 반환하고, 최상위가 배열도 `{rows}`도 아니면 구조
  경고로 반환하도록 보장한다(FR-006, contract 표 4·5행).
- [x] T020 [US3] T017~T018 테스트 통과를 `npm test`로 확인한다(GREEN).

**Checkpoint**: 모든 fail-open 경계 커버 — US3 독립 검증 가능.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 회귀 확인, 문서 정합, quickstart 검증

- [x] T021 회귀 확인: `npm test` 전체 실행 → 기존 feature-hub 테스트(merge-registry,
  render, scan-md, scan-specs 등)가 T001 baseline과 동일하게 통과함을 확인(SC-006).
- [x] T022 [P] quickstart 검증 실행: `specs/003-feature-definition-source/quickstart.md`의
  검증 1~5를 순서대로 수행하고 결과를 기록한다.
- [x] T023 [P] `docs/harness-overview.md`의 기능정의서 탭 설명을 새 소스 구조(STICKY
  하드코딩 → `data/feature-definitions.json`)에 맞게 갱신한다.
- [x] T024 [P] normalizer 스킬 문서 확인:
  `.harness/skills/codi-feature-definition-normalizer/SKILL.md`의 "adapter 필요" 문구
  (SKILL.md:154-155)가 이제 구현됐으므로 갱신이 필요한지 검토하고, 필요 시 수정한다.
- [x] T025 검증 기록 작성: `specs/003-feature-definition-source/verification.md`에 실행한
  명령, 통과한 테스트, quickstart 결과를 남긴다.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능.
- **Foundational (Phase 2)**: Setup 후. 모든 스토리를 차단(fixture·규약 경로 필요).
- **User Stories (Phase 3~5)**: Foundational 후.
- **Polish (Phase 6)**: 모든 스토리 완료 후.

### 스토리 간 의존 (이 기능의 특수성)

- US1/US2/US3는 **모두 `scan-service-definition.mjs` 한 파일을 수정**한다. 따라서
  구현 태스크(T010, T015, T019)는 **순차**로 진행한다. T010(US1)이 JSON 읽기+정규화
  뼈대를 만들고, T015(US2)와 T019(US3)는 그 위에 fail-open 분기를 확정한다.
- 실무상 T010에서 부재·손상 처리까지 함께 구현될 가능성이 높다. 그 경우 T015/T019는
  "이미 충족됨을 테스트로 확인"하는 작업이 된다.
- **테스트 태스크는 서로 다른 케이스**라 [P] 병렬 작성 가능.

### Within Each User Story

- 테스트 먼저 작성 → FAIL 확인 → 구현 → GREEN 확인.

### Parallel Opportunities

- T003·T004·T005 (fixture 3종) 병렬.
- T007·T008·T009 (US1 테스트) 병렬 작성.
- T013·T014 (US2 테스트) 병렬. T017·T018 (US3 테스트) 병렬.
- T022·T023·T024 (polish 문서) 병렬.
- 구현 태스크 T010→T015→T019는 같은 파일이라 **순차**.

---

## Parallel Example: Foundational fixtures

```bash
# fixture 3종 동시 생성:
Task: "정상 fixture tests/fixtures/feature-hub/feature-definitions.valid.json"
Task: "손상 fixture tests/fixtures/feature-hub/feature-definitions.broken.json"
Task: "객체형 fixture tests/fixtures/feature-hub/feature-definitions.object.json"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1.
2. **STOP & VALIDATE**: 정상 소스가 기능정의서 탭에 표시되는지 quickstart 검증 1 수행.
3. 이 시점에서 이미 핵심 가치(normalizer↔허브 연결) 전달.

### Incremental Delivery

1. Setup + Foundational → 기반 준비.
2. US1 → 정상 소스 렌더 (MVP).
3. US2 → 소스 부재 fail-open + 하드코딩 제거 (팀 공유 차단 해제).
4. US3 → 손상 소스 fail-open.
5. Polish → 회귀 확인 + 문서 갱신.

### 회귀 안전

- 렌더러(`render-hub.mjs`)와 스키마 모듈은 계약 유지로 무변경.
- T001 baseline과 T021 회귀 확인으로 기존 feature-hub 동작 불변을 보장(SC-006).

---

## Notes

- [P] = 다른 파일, 의존 없음. 구현 태스크는 같은 파일이라 대부분 순차.
- 각 태스크 완료 후 커밋. implement 단계 자체는 커밋하지 않는다는 규칙과 구분 —
  여기서는 태스크 단위 논리적 커밋을 권장.
- 테스트 FAIL을 구현 전에 반드시 확인(TDD).
- 이 기능은 앱 스택이 아니라 하네스 내부 도구이므로 e2e user-flow 게이트 대상 아님
  (touches-user-flow 마커 불필요).

