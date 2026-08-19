# Tasks: 연결형 기능 허브 v2

**Input**: Design documents from `/specs/008-linked-feature-hub/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: TDD 요청됨 — 각 behavior 구현 전에 실패 테스트를 실행한다.

**Organization**: user story별 독립 증분으로 구현하며 기존 허브 하위 호환을 매 단계 검증한다.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

**Purpose**: 새 계약과 evidence 조합을 재현하는 fixture 준비

- [x] T001 [P] traceability 유효·부분 오류·최상위 오류 fixture를 `tests/fixtures/feature-hub/feature-relations.valid.json`, `feature-relations.invalid.json`, `feature-relations.partial.json`에 추가
- [x] T002 [P] 분기·순환·broken edge를 포함한 flow fixture를 `tests/fixtures/feature-hub/user-flows.valid.json`, `user-flows.invalid.json`, `user-flows.partial.json`에 추가
- [x] T003 [P] 상세 파싱과 완료 gate용 spec/task/verification/status fixture를 `tests/fixtures/feature-hub/specs/003-sample/` 및 신규 evidence fixture 디렉터리에 추가

## Phase 2: Foundational

**Purpose**: 상세와 delivery evidence를 renderer와 분리한 pure model로 고정

**⚠️ CRITICAL**: 이 단계 완료 전 user story 구현을 시작하지 않는다.

- [x] T004 실패 테스트 작성·red 확인: spec Markdown의 summary, user stories, acceptance, edge cases, FR, SC 파싱을 `tests/feature-hub-spec-detail.test.mjs`에 추가
- [x] T005 `parseSpecDetail(markdown)` 최소 구현으로 T004 green — `.harness/scripts/docs/lib/parse-spec-detail.mjs`
- [x] T006 실패 테스트 작성·red 확인: next action, last transition, open decision, verification 미기록/일부/완료 파생을 `tests/feature-hub-delivery-evidence.test.mjs`에 추가
- [x] T007 delivery evidence를 scan 결과에 추가해 T006 green — `.harness/scripts/docs/lib/scan-specs.mjs`

**Checkpoint**: spec detail과 delivery evidence를 UI 없이 독립 검증 가능

## Phase 3: User Story 1 - 구현 가능한 기능 상세 확인 (Priority: P1) 🎯 MVP

**Goal**: 동일 ID 또는 명시적 `specified-by`로 spec을 연결해 구조화된 상세를 제공

**Independent Test**: 연결/미연결/명시 override fixture의 기능 상세 모델과 렌더 결과를 확인

- [x] T008 [US1] 실패 테스트 작성·red 확인: 동일 ID, 명시 override, 미연결 spec resolution을 `tests/feature-hub-linked-model.test.mjs`에 추가
- [x] T009 [US1] feature row와 spec detail resolution을 구현해 T008 green — `.harness/scripts/docs/lib/build-linked-hub-model.mjs`
- [x] T010 [US1] 실패 렌더 테스트 작성·red 확인: 상세 섹션, 미연결 안내, 원본 링크, 기존 행 정보 보존을 `tests/feature-hub-render.test.mjs`에 추가
- [x] T011 [US1] 구조화된 기능 상세 패널과 존재하지 않는 `feature-detail-links.csv` 안내 제거를 구현해 T010 green — `.harness/scripts/docs/lib/render-hub.mjs`

**Checkpoint**: relation/flow 원본 없이도 US1 상세 aggregation이 독립 동작

## Phase 4: User Story 2 - 누락과 끊어진 관계 탐지 (Priority: P2)

**Goal**: 선택 typed relation을 검증하고 endpoint/duplicate/orphan health 제공

**Independent Test**: 유효·부분 오류·전체 오류 fixture에서 fail-open과 정확한 health count 확인

- [x] T012 [US2] 실패 scanner 테스트 작성·red 확인: 부재, 파싱 실패, 필수 필드, entity/link 중복을 `tests/feature-hub-scan-traceability.test.mjs`에 추가
- [x] T013 [US2] traceability 진실의 원천과 fail-open scanner를 구현해 T012 green — `.harness/config/traceability-schema.json`, `.harness/scripts/docs/lib/scan-traceability.mjs`
- [x] T014 [US2] 실패 graph model 테스트 작성·red 확인: derived/supplemental endpoint, broken/duplicate/orphan, `specified-by`, `appears-on` 우선순위를 `tests/feature-hub-linked-model.test.mjs`에 추가
- [x] T015 [US2] endpoint registry와 coverage health를 구현해 T014 green — `.harness/scripts/docs/lib/build-linked-hub-model.mjs`, `.harness/scripts/docs/lib/merge-sitemap.mjs`
- [x] T016 [US2] 실패 build 통합 테스트 작성·red 확인: DATA 주입과 broken/orphan 비차단 힌트를 `tests/feature-hub-sitemap-build.test.mjs`에 추가
- [x] T017 [US2] relation scan/model/build 배선과 힌트를 구현해 T016 green — `.harness/scripts/docs/build-hub.mjs`

**Checkpoint**: UI와 무관하게 typed traceability health가 결정적으로 계산됨

## Phase 5: User Story 3 - 사이트맵 관계와 사용자 흐름 탐색 (Priority: P3)

**Goal**: relation/tree/table/flow를 같은 model과 shared state로 탐색

**Independent Test**: 분기·순환 flow와 cross relation fixture에서 view 전환, 선택, 접근성 대체 확인

- [x] T018 [US3] 실패 flow scanner 테스트 작성·red 확인: 부재, 최상위 오류, step 중복, broken next, cycle, screen/feature 참조를 `tests/feature-hub-scan-user-flows.test.mjs`에 추가
- [x] T019 [US3] user-flow 진실의 원천과 fail-open scanner를 구현해 T018 green — `.harness/config/user-flow-schema.json`, `.harness/scripts/docs/lib/scan-user-flows.mjs`
- [x] T020 [US3] 실패 model/build 테스트 작성·red 확인: flow entity/edge health와 DATA 주입을 `tests/feature-hub-linked-model.test.mjs`, `tests/feature-hub-sitemap-build.test.mjs`에 추가
- [x] T021 [US3] flow scan/model/build 배선을 구현해 T020 green — `.harness/scripts/docs/lib/build-linked-hub-model.mjs`, `.harness/scripts/docs/build-hub.mjs`
- [x] T022 [US3] 실패 렌더 테스트 작성·red 확인: 4-view toggle, shared state, swimlane node, 인접 relation, flow actor/goal/branch, 키보드 가능한 대체 목록을 `tests/feature-hub-render.test.mjs`에 추가
- [x] T023 [US3] relation/flow DOM 렌더와 shared client state를 구현해 T022 green — `.harness/scripts/docs/lib/render-hub.mjs`
- [x] T024 [P] [US3] relation swimlane, selected edge, flow step/branch, responsive/keyboard focus style을 `.harness/scripts/docs/templates/hub.css`에 구현하고 `tests/design-system-contrast.test.mjs` 회귀 확인

**Checkpoint**: 네 view가 같은 filter/selection을 공유하고 text/table fallback 제공

## Phase 6: User Story 4 - 검증 근거로 완료 판단 (Priority: P4)

**Goal**: delivery evidence를 표시하고 보수적인 `in-review → done` 자동 제안 적용

**Independent Test**: task/verification/open decision 조합표 전체에서 카드와 sync 결과 확인

- [x] T025 [US4] 실패 status-sync 테스트 작성·red 확인: 5개 evidence 조합과 기존 planned/in-progress 전이를 `tests/feature-hub-status-sync.test.mjs`에 추가
- [x] T026 [US4] evidence-gated done 제안으로 T025 green — `.harness/scripts/docs/lib/status-sync.mjs`
- [x] T027 [US4] 실패 hint 테스트 작성·red 확인: 완료 가능/미기록/부분 검증/열린 결정 문구를 `tests/feature-hub-transition.test.mjs`에 추가
- [x] T028 [US4] 비차단 상태 힌트를 delivery evidence 기준으로 구현해 T027 green — `.harness/scripts/docs/lib/transition.mjs`
- [x] T029 [US4] 실패 렌더 테스트 작성·red 확인: next action, last transition, open decisions, verification coverage/미기록을 `tests/feature-hub-render.test.mjs`에 추가
- [x] T030 [US4] 기능 현황 카드와 상세 delivery evidence UI를 구현해 T029 green — `.harness/scripts/docs/lib/render-hub.mjs`

**Checkpoint**: 자동 done은 durable evidence가 완전할 때만 제안됨

## Phase 7: Polish & Cross-Cutting

- [x] T031 [P] 새 사람 소유 relation/flow 원본과 fail-open 규칙을 `.harness/skills/codi-feature-hub/SKILL.md`에 문서화하고 skill contract를 `tests/feature-definition-normalizer-skill.test.mjs`에 고정
- [x] T032 대규모 500 feature/100 screen/50 flow build 성능·count 보존 테스트를 `tests/feature-hub-sitemap-build.test.mjs`에 추가하고 2초 기준 확인
- [x] T033 전체 `npm test`와 `node .harness/scripts/checks/rule-check.mjs`를 실행하고 결과를 `specs/008-linked-feature-hub/verification.md`에 기록
- [x] T034 `mise run docs:build` 후 `docs/index.html`의 relation/tree/table/flow, 상세, delivery evidence를 quickstart 3절대로 브라우저 검증하고 `specs/008-linked-feature-hub/verification.md`에 기록
- [x] T035 `CHANGELOG.md`, `ROADMAP.md`, `specs/008-linked-feature-hub/status.yaml`을 실제 구현 결과에 맞게 갱신
- [x] T036 `mise run feature:status:sync`를 실행하고 deterministic 인접 전이만 `--apply`한 뒤 결과를 `specs/008-linked-feature-hub/verification.md`에 기록
- [x] T037 `speckit.converge` 관점으로 spec/plan/tasks/구현/검증을 대조하고 남은 gap 0건 또는 명시적 residual risk를 `specs/008-linked-feature-hub/verification.md`에 기록

## Dependencies & Execution Order

- Setup T001~T003 → Foundational T004~T007.
- US1은 T005·T007에 의존한다.
- US2는 US1의 linked model 뼈대 T009에 의존한다.
- US3은 US2의 endpoint registry T015에 의존한다.
- US4는 T007 delivery evidence에 의존하며 US2/US3과 UI 파일 충돌 때문에 순차 실행한다.
- Polish는 선택한 모든 user story 완료 후 실행한다.

## Parallel Opportunities

- T001, T002, T003은 서로 다른 fixture라 병렬 가능하다.
- T024 CSS는 T023의 class contract가 확정된 뒤 구현하되 다른 파일 작업과 병렬 가능하다.
- T031 skill 문서는 renderer/status 구현과 파일이 달라 병렬 가능하다.
- 현재 세션은 서브에이전트 권한이 없으므로 위 표시는 팀/후속 세션용이며 실제 실행은 순차다.

## Implementation Strategy

1. **MVP**: Foundation + US1로 기존 spec 정보를 기능 상세에 연결한다.
2. **Traceability**: US2로 관계 계약과 health를 추가하되 기존 프로젝트는 fail-open 유지한다.
3. **Visual navigation**: US3으로 relation/flow를 추가하고 tree/table을 보존한다.
4. **Governance**: US4로 delivery evidence와 done gate를 연결한다.
5. 각 테스트 태스크에서 실패를 직접 확인한 뒤 최소 구현을 하고 해당 suite를 green으로 만든다.
6. 커밋은 사용자 요청 범위가 아니므로 수행하지 않는다.

## Phase 8: Convergence

- [x] T038 관계도가 traceability 설정 여부와 무관하게 sitemap의 surface별 화면 계층·빈 화면을 유지하고, 선택 노드의 인접 relation을 노드와 텍스트 목록에 함께 표시하도록 보완 per FR-011, US3/AC1-2 (partial)
- [x] T039 기능 필터 결과가 0건이어도 user flow를 숨기지 않고 `일치 기능 0건` 상태를 표시하도록 보완 per spec Edge Cases, hub-view contract (contradicts)
- [x] T040 T038~T039 회귀 테스트, 전체 테스트, docs build, Chromium 검증을 수행하고 convergence 결과를 `verification.md`에 기록 per SC-004~SC-006 (partial)
