# Tasks: 정의-후행(definition-later) 경량 경로

**Input**: Design documents from `specs/011-definition-later-path/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD — 각 스토리에서 테스트 태스크가 구현보다 먼저 온다.

**Organization**: 유저 스토리별 독립 구현·검증. Setup 불필요(기존
파이프라인 국소 수정), Foundational 없음(스토리 간 하드 의존 없음).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: User Story 1 - 미등록 기능의 작업이 보인다 (P1) 🎯 MVP

**Goal**: 카탈로그에 없는 기능 ID의 work item이 버려지지 않고 미등록
묶음으로 기능 현황에 표시되고, 게이트/힌트가 개수를 알린다.

**Independent Test**: 미등록 `FEAT-X` work item 하나로 빌드 →
버킷 카드 + 안내 + 경고 확인 (quickstart 시나리오 1).

- [X] T001 [US1] RED: 미등록 work item이 `registered: false`로 유지되고
  health가 남는 테스트를 tests/planning-feature-work-items.test.mjs에
  추가하고 실패를 확인한다 (기존 drop 단언은 새 계약으로 갱신)
- [X] T002 [P] [US1] RED: 미등록 묶음 렌더(정식 기능과 구분 + stub 안내
  문구) 테스트를 tests/planning-feature-workbench-render.test.mjs에
  추가하고 실패를 확인한다
- [X] T003 [US1] GREEN: .harness/scripts/docs/lib/normalize-feature-work-items.mjs
  의 reference-broken 분기를 drop 대신 `registered: false` 유지로
  바꾼다 (다른 검증 실패는 기존대로 drop)
- [X] T004 [US1] GREEN: .harness/scripts/docs/lib/aggregate-feature-work-items.mjs
  가 미등록 항목을 기능 rollup에서 제외하되 미등록 그룹 집계를
  제공하게 한다
- [X] T005 [US1] GREEN: .harness/scripts/docs/lib/render-feature-workbench-view.mjs
  에 미등록 묶음 표시와 `mise run feature:stub` 안내를 추가해 T001~T002
  를 통과시킨다
- [X] T006 [US1] 게이트/힌트: .harness/scripts/docs/planning-check.mjs
  경고 + .harness/scripts/docs/build-hub.mjs 힌트에 `미등록 기능 N건`
  을 추가하고 tests/planning-check.test.mjs,
  tests/feature-hub-sitemap-build.test.mjs에 검증을 추가한다 (TDD:
  테스트 먼저)
- [X] T007 [US1] AC2 검증: 미등록 기능이 카탈로그에 등록되면 버킷이
  해체되고 정식 기능 아래로 이동하는 테스트를
  tests/planning-feature-work-items.test.mjs에 추가한다

**Checkpoint**: US1 단독으로 MVP — 미등록 작업 데이터 유실 제거

---

## Phase 2: User Story 2 - FEAT stub 경량 등록 (P2)

**Goal**: `mise run feature:stub`으로 draft 정의를 등록하고 소급 상세
필요를 열린 결정으로 남긴다.

**Independent Test**: quickstart 시나리오 2.

- [X] T008 [US2] RED: tests/feature-stub.test.mjs 신규 — 생성(draft
  항목 + decisions 열린 결정), 중복 ID 시 무변경 안내, `FEAT-` 형식
  검증 실패, planningSource 부재 시 파일 생성까지 커버하고 실패를
  확인한다 (contracts/feature-stub-cli.md 계약 기준)
- [X] T009 [US2] GREEN: .harness/scripts/docs/feature-stub.mjs 신규
  구현 — 기본 워크스페이스 planningSource 대상, ID 불변·무덮어쓰기,
  DEC-STUB-* 중복 방지
- [X] T010 [US2] mise.toml에 feature:stub 태스크를 추가하고
  tests/harness-cli.test.mjs 또는 feature-stub.test.mjs에서 태스크
  존재를 검증한다
- [X] T011 [US2] draft 정의 완료 차단 확인: draft stub + done 요청
  work item 조합에서 기존 완료 가드가 in-review 강등 + 사유 표시하는
  테스트를 tests/planning-feature-work-items.test.mjs에 추가한다
  (가드 로직 수정 없이 통과해야 함 — 회귀 고정)

---

## Phase 3: User Story 3 - spec 역방향 연결 (P2)

**Goal**: status.yaml `featureId`로 spec→기능 연결, planning 우선 충돌
진단.

**Independent Test**: quickstart 시나리오 3.

- [X] T012 [US3] RED: status.yaml `featureId` 파싱(정상/비문자열 무시)
  테스트를 tests/feature-hub-spec-detail.test.mjs 또는 scan-specs
  대상 테스트에 추가하고 실패를 확인한다
- [X] T013 [US3] GREEN: .harness/scripts/docs/lib/scan-specs.mjs가
  `featureId`를 읽어 spec 레코드에 싣게 한다
- [X] T014 [US3] RED: 연결 우선순위(planning 명시 > featureId > ID
  동일)와 `spec-feature-link-conflict` health 테스트를
  tests/feature-hub-linked-model.test.mjs에 추가하고 실패를 확인한다
- [X] T015 [US3] GREEN: .harness/scripts/docs/lib/build-linked-hub-model.mjs
  에 역방향 연결과 충돌 진단을 구현한다

---

## Phase 4: User Story 4 - specs 기반 워크스페이스 현황 유지 (P3)

**Goal**: specs deliverySource 워크스페이스에서 spec 스캔 결과를
delivery 근거로 투영(evidence 우선 + 보충).

**Independent Test**: quickstart 시나리오 4.

- [X] T016 [US4] RED: 카탈로그 + specs deliverySource 워크스페이스에서
  spec 유래 legacy 투영(featureId·status·tasks, `source: spec-scan`)과
  evidence 우선 보충을 검증하는 build 테스트를
  tests/feature-hub-sitemap-build.test.mjs에 추가하고 실패를 확인한다
- [X] T017 [US4] GREEN: .harness/scripts/docs/lib/build-workspace-hub-model.mjs
  의 loadPlanningWorkspace가 spec 디렉터리형 deliverySource를 감지해
  scanSpecs 결과를 legacy features로 투영(evidence에 없는 기능만)한다
- [X] T018 [US4] harness-internal 실검증: `mise run docs:build`로
  내부 워크스페이스에서 spec 유래 현황이 유지되는지 확인하고 결과를
  verification.md 초안에 기록한다

---

## Phase 5: Polish & Cross-Cutting

- [X] T019 [P] .harness/skills/codi-feature-hub/SKILL.md의 bottom-up
  절과 FeatureWorkItem 계약에 미등록 버킷·stub 명령·featureId 역방향
  연결·specs 투영 규칙을 갱신한다
- [X] T020 [P] .harness/docs/feature-hub-guide.md에 정의-후행 흐름
  (등록 명령, 미등록 경고, 역방향 링크)을 추가한다
- [X] T021 docs/audits/2026-07-17-feature-definition-flow-analysis.md
  의 R2를 해소 표시하고 ROADMAP.md 백로그 항목 2 상태를 갱신한다
- [X] T022 전체 검증: npm test, mise run docs:build, mise run
  planning:check, mise run feature:status:sync를 실행하고
  specs/011-definition-later-path/verification.md에 quickstart 시나리오
  결과와 함께 기록한다
- [X] T023 status.yaml 상태 전이(planned→in-progress→in-review)를
  mise run feature:status로 기록한다

---

## Dependencies & Execution Order

- US1 → US2 → US3 → US4 순서를 권장하나, US2/US3/US4는 서로 독립이며
  US1과도 파일 겹침 외 하드 의존이 없다.
- US2의 힌트 문구(T-스텁 안내)는 US1의 힌트 태스크와 같은 파일을
  건드리므로 순차 처리한다.
- Polish는 모든 스토리 완료 후.

## Implementation Strategy

- MVP는 US1 단독(데이터 유실 제거). 이후 스토리는 각각 독립 증분.
- 각 스토리: RED(테스트 추가·실패 확인) → GREEN(구현) → 스토리 검증.
- 전체 완료 후 quickstart 회귀 게이트 + verification.md 기록.
