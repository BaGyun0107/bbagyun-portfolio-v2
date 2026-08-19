# Tasks: 하네스 정보구조·기능 추적성·사용자 흐름 정본화

**Input**: Design documents from `/specs/009-harness-information-architecture/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: TDD 요청됨 — 각 canonical data slice는 실패 테스트를 먼저 실행하고 최소 변경으로 통과시킨다.

**Organization**: 실제 사이트맵, 기능 관계, 사용자 흐름을 독립 증분으로 구현한 뒤 자동·브라우저 검증에서 결합한다.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Plan of Record

**Purpose**: 승인 설계와 근거를 세션 밖에서 재개 가능한 Spec Kit 원장으로 고정

- [x] T001 승인 설계를 user story, FR, SC로 변환해 `specs/009-harness-information-architecture/spec.md` 작성
- [x] T002 모호성 5건을 결정하고 미해결 marker 0건을 `specs/009-harness-information-architecture/research.md`에 기록
- [x] T003 전문 실무 근거와 confirmed/inferred/question evidence ledger를 `specs/009-harness-information-architecture/research.md`에 기록
- [x] T004 데이터 ownership, stable ID와 cardinality를 `specs/009-harness-information-architecture/data-model.md`, `contracts/canonical-data-contract.md`에 기록
- [x] T005 구현·TDD·검증 전략을 `specs/009-harness-information-architecture/plan.md`, `quickstart.md`에 기록
- [x] T006 Spec/plan/tasks 간 critical contradiction과 uncovered FR/SC 0건 확인

**Checkpoint**: 009 plan of record가 분석을 통과해야 사람 소유 data 구현을 시작한다.

## Phase 2: User Story 1 - 실제 하네스 구조 탐색 (Priority: P1) 🎯 MVP

**Goal**: 범용 샘플 대신 현재 팀 기능 허브의 surface 3개와 node 17개를 정본화

**Independent Test**: actual sitemap exact ID/순서와 contract sample 격리를 repository root에서 검증

### Tests for User Story 1

- [x] T007 [US1] 실제 node 17개와 세 surface를 요구하는 실패 테스트를 `tests/feature-hub-canonical-data.test.mjs`에 작성
- [x] T008 [US1] 현재 sample `data/sitemap.json`에서 T007의 Red를 실행해 기록

### Implementation for User Story 1

- [x] T009 [US1] `data/sitemap.json`을 실제 HUB 계층으로 교체하고 007 contract sample 보존
- [x] T010 [US1] focused test를 재실행해 sitemap 2개 검증을 Green으로 확인

**Checkpoint**: 허브의 실제 계층과 공통 상태를 tree/table/relation에서 탐색 가능

## Phase 3: User Story 2 - 최종 9개 기능의 근거와 관계 추적 (Priority: P1)

**Goal**: 9개 need와 기능별 need/screen/spec/dependency/verification 관계 64개를 evidence와 함께 연결

**Independent Test**: scanner와 linked model에서 feature coverage 100%, dependency parity, evidence 완전성과 health 0을 검증

### Tests for User Story 2

- [x] T011 [US2] feature 9개 coverage, relation 수, evidence와 inferred label을 요구하는 실패 테스트를 `tests/feature-hub-canonical-data.test.mjs`에 추가
- [x] T012 [US2] relation 원본 부재 상태에서 T011의 Red를 실행해 기록

### Implementation for User Story 2

- [x] T013 [US2] need 9개와 typed link 64개를 `data/feature-relations.json`에 작성
- [x] T014 [US2] inferred 화면 매핑의 근거와 재검토 상태를 `specs/009-harness-information-architecture/research.md`에 대조
- [x] T015 [US2] focused test를 재실행해 relation coverage와 canonical health를 Green으로 확인

**Checkpoint**: 모든 기능이 왜·어디서·무엇에 의존하고 어떤 원본과 검증에 연결되는지 추적 가능

## Phase 4: User Story 3 - 세 목표 사용자 흐름 탐색 (Priority: P1)

**Goal**: 온보딩, 기능 전달, 하네스 배포의 action/decision/recovery/end와 화면·기능 연결을 정본화

**Independent Test**: flow 3개 exact ID, actor/goal, start/decision/end, stable references와 broken/cycle 0을 검증

### Tests for User Story 3

- [x] T016 [US3] 세 flow의 의미·구조·reference health를 요구하는 실패 테스트를 `tests/feature-hub-canonical-data.test.mjs`에 추가
- [x] T017 [US3] flow 원본 부재 상태에서 T016의 Red를 실행해 기록

### Implementation for User Story 3

- [x] T018 [US3] `FLOW-ONBOARD`, `FLOW-FEATURE-DELIVERY`, `FLOW-HARNESS-DELIVERY`를 `data/user-flows.json`에 작성
- [x] T019 [US3] retry를 recovery end로 유지하고 모든 next/screen/feature 참조를 대조
- [x] T020 [US3] focused test를 재실행해 flow와 전체 canonical health를 Green으로 확인

**Checkpoint**: 세 actor가 목표 달성·결정·실패 종료를 시각화와 텍스트에서 같은 ID로 탐색 가능

## Phase 5: User Story 4 - 오류가 있는 정본의 유효 데이터 보존 (Priority: P2)

**Goal**: 새 실제 데이터가 기존 fail-open 계약을 회귀시키지 않고 최종 health 0을 달성

**Independent Test**: 기존 malformed/partial fixtures와 새 actual-data test를 함께 실행

- [x] T021 [US4] 기존 sitemap/traceability/user-flow scanner fail-open suite 통과 확인
- [x] T022 [US4] 전체 `node --test --test-reporter=dot tests/*.test.mjs` 통과 확인
- [x] T023 [US4] `node .harness/scripts/checks/rule-check.mjs` 통과 확인
- [x] T024 [US4] `mise run docs:build` 성공, 기능 9·node 17·flow 3·health 0을 확인

## Phase 6: Review, Verification and Completion

- [x] T025 [P] `ROADMAP.md`에 009 상태와 canonical data 범위를 얇게 반영
- [x] T026 `docs/index.html`에서 desktop relation/tree/table/flow/detail과 source/evidence 확인
- [x] T027 키보드만으로 view 전환·선택·상세 탐색 확인
- [x] T028 375×812에서 console error와 수평 overflow 0 확인
- [x] T029 자동·브라우저 명령과 관찰 결과를 `specs/009-harness-information-architecture/verification.md`에 기록
- [x] T030 `speckit-converge` 관점에서 FR 12개, SC 8개, tasks와 실제 데이터·검증 gap 0 확인
- [x] T031 `mise run feature:status:sync`를 실행하고 deterministic 인접 전이만 `--apply`하며 ambiguous/on-hold는 보고
- [x] T032 `git diff --check`와 placeholder scan으로 최종 변경 품질 확인

## Dependencies & Execution Order

- Phase 1 T006 분석 통과 후에만 Phase 2를 시작한다.
- Sitemap T007~T010은 relation의 screen endpoint 전제다.
- Relation T011~T015는 flow의 feature/screen coverage 전제다.
- Flow T016~T020 완료 후 전체 model health를 최종 판단한다.
- 자동 검증 T021~T024 완료 후 브라우저 검증과 converge를 수행한다.
- 현재 사용자가 인라인 실행을 선택했으므로 모든 task를 단일 스트림으로 순차 실행한다.

## Implementation Strategy

1. 각 slice에서 테스트 작성 → Red 확인 → 최소 JSON 변경 → Green 확인 순서를 지킨다.
2. 새 renderer/scanner/schema나 외부 의존성을 추가하지 않는다.
3. 기존 사용자 변경과 007/008 artifacts를 보존한다.
4. 커밋은 사용자의 별도 승인 전 수행하지 않는다.

## Phase 7: Convergence

- [x] T033 [US2] `status.yaml` 의존 관계 10개와 기록된 verification 목록을 typed relation과 정확히 비교하는 회귀 검증을 `tests/feature-hub-canonical-data.test.mjs`에 추가 per SC-003, FR-005 (partial)
- [x] T034 [US2] inferred 화면 관계 4개의 label을 PM/PL review 상태와 승인일이 함께 드러나도록 `data/feature-relations.json`과 focused test에서 정합화 per US2/AC3, FR-006 (partial)
- [x] T035 최종 상태·태스크·검증 반영 후 `docs/index.html`을 재생성하고 stale next-action·status가 없음을 확인 per plan: generated artifact (partial)
