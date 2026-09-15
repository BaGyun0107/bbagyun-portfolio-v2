# Tasks: 연결형 스윔레인 재설계

**Input**: Design documents from `/specs/003-connected-swimlane-redesign/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: FR-022와 헌법 V에 따라 모든 행동 변경은 실패 테스트를 먼저 확인하는 TDD
순서로 실행한다.

**Organization**: 작업은 사용자 스토리별로 묶고, 공통 데이터·geometry 계약만 선행
기반 단계에 둔다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 미완료 작업과 파일 충돌 없이 병렬 실행할 수 있음
- **[Story]**: `spec.md`의 사용자 스토리 추적 label
- 각 작업은 실제 수정 또는 검증할 파일 경로를 포함함

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 승인된 계획과 현재 기준선을 구현 세션의 검증 기록에 고정한다.

- [X] T001 체크리스트 승인 상태, 변경 전 집중 테스트 결과와 dirty worktree 보존 조건을 `specs/003-connected-swimlane-redesign/verification.md`에 기록한다.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 두 스윔레인이 공유하는 데이터 무결성과 SVG 좌표 계약을 먼저 확립한다.

**⚠️ CRITICAL**: 이 단계가 완료되기 전에는 사용자 스토리 구현을 시작하지 않는다.

- [X] T002 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 중복 ID·lane/row, 잘못된 참조·shape·anchor·좌표, start/end 개수, 단절·고립·역행 정상 경로, outcome/stop 규칙, 비어 있거나 미포함된 예외 설명을 차단하는 실패 테스트를 추가하고 RED를 기록한다.
- [X] T003 `apps/front/src/data/portfolio/types/feature-detail.dto.ts`, `apps/front/src/data/portfolio/types/index.ts`, `apps/front/src/data/portfolio/index.ts`에 connected-flow point, anchor, shape, step, edge, exception과 summary 타입을 추가하고 기존 공개 export를 갱신한다.
- [X] T004 [P] `apps/front/src/data/portfolio/feature-details/index.ts`에 ID·문자열·위치·좌표·graph reachability·normal row 진행·outcome·stop target·exception label·narrative coverage 검증을 구현해 T002를 GREEN으로 만든다.
- [X] T005 [P] `apps/front/src/components/projects/project-swimlane-layout.test.ts`에 diagram 크기, lane 중심, 모든 node shape anchor, 음수·소수 gutter waypoint, label 위치, bounds와 polyline 직렬화 실패 테스트를 작성하고 RED를 기록한다.
- [X] T006 `apps/front/src/components/projects/project-swimlane-layout.ts`에 React 비의존 grid-to-SVG geometry와 shape별 anchor·route 계산을 구현해 T005를 GREEN으로 만든다.

**Checkpoint**: 잘못된 공개 흐름은 게시 전에 차단되고 승인된 좌표 데이터는 결정론적으로
SVG geometry로 변환된다.

---

## Phase 3: User Story 1 - 설계부터 검증까지 전체 흐름 추적 (Priority: P1) 🎯 MVP

**Goal**: 네 책임 lane, 핵심 여섯 단계, 명시적 완료 종점과 세 복귀 경로를 하나의
연결형 설계·개발·검증 흐름으로 제공한다.

**Independent Test**: 설계 다이어그램만으로 요청부터 리뷰·검증까지 여섯 핵심 단계를
따르고, 통과 시 완료되며 모호성·미승인·검증 실패 시 복귀 대상을 설명할 수 있다.

### Tests for User Story 1

> **NOTE: 테스트를 먼저 작성하고 요구한 이유로 실패하는지 확인한 뒤 구현한다.**

- [X] T007 [US1] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 설계 흐름의 4개 lane, 6개 핵심 단계, 보조 완료 end, 6개 normal·3개 exception edge, decision 분기 label과 3개 예외 문장 계약을 추가하고 RED를 기록한다.
- [X] T008 [US1] 첫 UI 변경 전에 `apps/front/src/components/projects/project-detail-rendering.test.tsx`와 `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에 두 semantic figure, 이름·설명이 연결된 SVG, 실제 normal/exception 수, 분기 label, summary·exception prose, 320/768/1024/1440 overflow, keyboard scroll, light/dark 구분, no-demo CTA, 8개 route·legacy 본문 및 기존 내부·외부 링크 계약을 추가하고 현재 카드 UI에서 RED를 기록한다.
- [X] T009 [US1] `apps/front/src/data/portfolio/feature-details/codi-harness-dx-platform.ts`의 설계 흐름을 승인된 node·edge·waypoint·summary·exception 데이터로 교체해 T007을 GREEN으로 만든다.

### Implementation for User Story 1

- [X] T010 [US1] `apps/front/src/components/projects/ProjectSwimlaneDiagram.tsx`에 고유 marker, lane, edge-first/node-last 순서, process·decision·start/end/stop 도형, solid/dashed 선과 edge label을 가진 공통 Server Component SVG renderer를 구현한다.
- [X] T011 [US1] `apps/front/src/components/projects/ProjectSwimlane.tsx`를 semantic figure, 한 개의 이름 있는 horizontal scroll region, 보이는 `전체 흐름 설명`과 조건부 `예외 상황과 대응`으로 재구성하고 기존 카드·`연결과 분기` 목록을 제거한다.
- [X] T012 [US1] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`, `apps/front/src/components/projects/project-swimlane-layout.test.ts`, `apps/front/src/components/projects/project-detail-rendering.test.tsx`의 US1 집중 테스트를 GREEN으로 실행하고 결과를 `specs/003-connected-swimlane-redesign/verification.md`에 기록한다.

**Checkpoint**: 설계 흐름 하나만으로 정상 이동과 세 예외 복귀를 독립적으로 이해할 수 있다.

---

## Phase 4: User Story 2 - 변경부터 배포까지 책임 경계 추적 (Priority: P1)

**Goal**: 네 시스템 lane과 여섯 핵심 단계를 연결하고 품질·시크릿 실패의 중단 및
처음부터 재실행 경로를 명확히 제공한다.

**Independent Test**: 배포 다이어그램만으로 변경 감지부터 결과 확인까지 추적하고,
품질 실패와 환경·시크릿 불일치가 배포를 막는 위치와 재실행 방식을 설명할 수 있다.

### Tests for User Story 2

- [X] T013 [US2] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 배포 흐름의 4개 lane, 6개 핵심 단계, 보조 중단 node, 5개 normal·3개 exception edge, decision 분기 label과 2개 예외 문장 계약을 추가하고 RED를 기록한다.

### Implementation for User Story 2

- [X] T014 [US2] `apps/front/src/data/portfolio/feature-details/codi-harness-dx-platform.ts`의 배포 흐름을 승인된 node·edge·waypoint·summary·exception 데이터로 교체하고 `stopped-retry`에 `원인 수정 후 처음부터 재실행` label을 적용한다.
- [X] T015 [US2] T008에서 먼저 작성한 `apps/front/src/components/projects/project-detail-rendering.test.tsx`의 두 번째 SVG assertion으로 4개 lane, 5개 normal·3개 dashed exception edge, 통과·실패·일치·불일치 label과 2개 예외 설명을 GREEN으로 확인한다.
- [X] T016 [US2] US2 데이터·geometry·server rendering 집중 테스트를 GREEN으로 실행하고 두 흐름의 실제 이름·단계·edge 수를 `specs/003-connected-swimlane-redesign/verification.md`에 기록한다.

**Checkpoint**: 배포 흐름은 설계 흐름과 독립적으로 정상 책임 이동과 두 중단 조건을
설명하며 같은 공통 renderer를 사용한다.

---

## Phase 5: User Story 3 - 결과 수치의 해석 범위 이해 (Priority: P2)

**Goal**: 지표 보충 설명을 근거 종류에 맞는 산정·측정·관찰 범위로 표시한다.

**Independent Test**: 세 metric kind의 caveat가 각각 맞는 공개 label을 사용하고 caveat가
없는 지표는 범위 영역을 만들지 않으며 `제한:`이 나타나지 않는다.

### Tests for User Story 3

- [X] T017 [US3] `apps/front/src/components/projects/project-detail-rendering.test.tsx`에 estimated·measured·reported와 caveat 없는 지표 fixture를 추가해 `산정 범위`, `측정 범위`, `관찰 범위`, 조건부 생략 및 `제한:` 금지의 RED를 기록한다.

### Implementation for User Story 3

- [X] T018 [US3] `apps/front/src/components/projects/ProjectHighlights.tsx`에 metric kind별 공개 범위 label mapping을 구현하고 caveat가 있을 때만 표시한다.
- [X] T019 [US3] `apps/front/src/components/projects/project-detail-rendering.test.tsx` 집중 테스트를 GREEN으로 실행하고 공개 HTML의 `제한:` 0건을 `specs/003-connected-swimlane-redesign/verification.md`에 기록한다.

**Checkpoint**: 수치의 사실 내용은 그대로 유지되며 해석 범위만 근거 종류에 맞게 읽힌다.

---

## Phase 6: User Story 4 - 화면과 관계없이 같은 흐름 이해 (Priority: P2)

**Goal**: 보조 기술과 320~1440px 화면에서 시각 흐름과 동일한 의미와 안전한 내부
가로 탐색을 제공한다.

**Independent Test**: SVG를 제외한 summary·exception prose로 같은 흐름을 설명할 수
있고, 각 diagram은 이름·설명을 가지며 한 번만 focus되고 320px에서 ArrowRight가 해당
region만 이동시킨다.

### Tests for User Story 4

- [X] T020 [US4] T008에서 구현 전에 RED를 기록한 `apps/front/src/components/projects/project-detail-rendering.test.tsx`의 SVG `role=img`·고유 accessible name·보이는 summary `aria-describedby`, scroll region `tabindex=0`, 정적 node/edge 0 tab stop, 조건부 예외 영역과 공개 금지 문구 assertion을 다시 실행해 남은 차이를 확인한다.
- [X] T021 [US4] T008에서 구현 전에 RED를 기록한 `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`의 실제 edge 수·분기 label, 4개 viewport overflow, ArrowRight 내부 scroll, light/dark, no-demo, 8개 route·legacy 본문과 링크 회귀 시나리오를 targeted 실행해 남은 차이를 확인한다.

### Implementation for User Story 4

- [X] T022 [US4] `apps/front/src/components/projects/ProjectSwimlane.tsx`와 `apps/front/src/components/projects/ProjectSwimlaneDiagram.tsx`에 summary ID 연결, unique accessible naming, focus ring, diagram-only overflow, 비색상 도형·선 style과 light/dark token을 보완해 T020을 GREEN으로 만든다.
- [X] T023 [US4] `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`의 `두 연결형 스윔레인` targeted Playwright를 GREEN으로 만들고 clipping·label 겹침·bounding box 관찰 결과를 `specs/003-connected-swimlane-redesign/verification.md`에 기록한다.

**Checkpoint**: 시각·텍스트·키보드 경로가 같은 정상 순서와 예외 의미를 제공하고 페이지
전체 overflow를 만들지 않는다.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 회귀, 리뷰, 상태 동기화와 최종 증거를 완료한다.

- [X] T024 `pnpm --dir apps/front exec tsc --noEmit`, `pnpm --dir apps/front test`, `pnpm --dir apps/front run lint`, `pnpm --dir apps/front run build`, `mise run //apps/front:e2e`, `git diff --check`를 이 순서로 실행하고 명령별 실제 결과·flow 이름·edge 수·기존 기준선 실패를 `specs/003-connected-swimlane-redesign/verification.md`에 구분해 기록한다.
- [X] T025 신규 파일에는 전체 lint rule을, 수정 legacy 파일에는 비-Prettier lint를 적용해 기능 범위 품질을 확인하고 관련 없는 사용자 파일을 일괄 포맷하지 않았음을 `specs/003-connected-swimlane-redesign/verification.md`에 기록한다.
- [X] T026 `speckit-converge`와 최종 코드 리뷰에서 발견된 Critical·Important 항목을 해당 `apps/front/` 파일에 수정하고 영향받은 테스트를 재실행해 `specs/003-connected-swimlane-redesign/verification.md`에 해결 근거를 기록한다.
- [X] T027 `mise run feature:status:sync`를 실행하고 가능한 인접 상태를 적용하며, task 부재·ambiguous·on-hold이면 정확한 결과를 `specs/003-connected-swimlane-redesign/verification.md`와 `ROADMAP.md`에 수동 반영한다.
- [X] T028 `specs/003-connected-swimlane-redesign/tasks.md`의 완료 항목과 검증 증거를 대조하고 남은 공개 금지 문구·빈 demo·빈 예외 UI가 없는지 확인한 뒤 최종 `git diff --check` 결과를 `specs/003-connected-swimlane-redesign/verification.md`에 기록한다.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 이후 실행하며 모든 사용자 스토리를 차단함
- **US1 (Phase 3)**: Foundational 이후 실행하는 MVP이자 공통 renderer 최초 통합
- **US2 (Phase 4)**: 공통 renderer가 마련된 US1 이후 두 번째 흐름 데이터 통합
- **US3 (Phase 5)**: Foundational 이후 독립 가능하지만 같은 rendering test 파일 충돌을 피하려 기본 순서 유지
- **US4 (Phase 6)**: 두 흐름과 metric UI가 준비된 US1~US3 이후 통합 접근성·반응형 검증
- **Polish (Phase 7)**: 원하는 모든 사용자 스토리와 집중 검증 완료 후 실행

### User Story Dependencies

- **US1 (P1)**: Foundational에만 의존하며 단독 MVP로 검증 가능
- **US2 (P1)**: Foundational과 US1의 공통 renderer에 의존하지만 데이터 계약은 독립 검증 가능
- **US3 (P2)**: Foundational 이후 기능상 독립적임
- **US4 (P2)**: US1·US2의 시각 흐름과 US3의 공개 문구가 통합된 상태에 의존함

### Within Each User Story

- 테스트 작성 → 의도한 RED 확인 → 데이터/컴포넌트 구현 → 집중 GREEN 순서를 지킨다.
- 데이터 계약과 geometry를 SVG renderer보다 먼저 완성한다.
- server rendering GREEN 뒤에 실제 브라우저 E2E를 실행한다.
- task checkbox는 해당 증거가 `verification.md`에 기록된 뒤에만 완료한다.
- 공통 server-rendering·E2E acceptance 테스트는 T008에서 첫 UI 구현 전에 RED를 확보하고,
  이후 사용자 스토리는 같은 assertion을 GREEN으로 전환한다.

### Parallel Opportunities

- T005 geometry RED는 T002~T004의 데이터 파일과 충돌하지 않으므로 기반 타입이 확정된 뒤 병렬화할 수 있다.
- US3의 T017~T019는 US2 데이터 작업 T013~T014와 파일이 겹치지 않을 때 병렬화할 수 있다.
- 시각 QA 관찰과 legacy route 회귀 확인은 T022 구현이 안정된 뒤 서로 다른 브라우저 context에서 병렬화할 수 있다.
- 공통 test 또는 component 파일을 동시에 수정하는 작업은 병렬화하지 않는다.

---

## Parallel Example: User Story 2 + User Story 3

```text
Task A: T013~T014 — 배포 flow 데이터 RED→GREEN
Task B: T017~T019 — metric 범위 label RED→GREEN
조건: Task B가 공통 rendering test를 수정하는 동안 Task A는 data test와 flow data 파일만 수정한다.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup을 완료한다.
2. Phase 2 데이터·geometry 기반을 RED→GREEN으로 완료한다.
3. Phase 3 설계·개발·검증 흐름을 renderer와 함께 구현한다.
4. US1 집중 data·geometry·rendering test를 독립 실행한다.
5. 연결선, 책임 이동과 세 복귀 경로가 의도대로 읽히는지 검토하고 다음 스토리로 간다.

### Incremental Delivery

1. Setup + Foundation → 잘못된 flow 차단과 geometry 준비
2. US1 → 설계 흐름 MVP
3. US2 → 같은 renderer로 배포 흐름 추가
4. US3 → metric 해석 범위 명확화
5. US4 → 접근성·반응형·전체 route 통합 검증
6. Polish → 전체 gate, converge와 상태 동기화

### Team Strategy

현재 파일 소유권 충돌을 피하기 위해 기본 실행은 task 순서를 따른다. 병렬 작업을 사용할
경우에도 각 worker는 `tasks.md`의 서로 다른 파일 소유 범위만 맡고, 공통 test/component
파일은 한 worker가 통합한다.

---

## Notes

- `[P]`는 실제 파일·의존성 충돌이 없는 경우에만 사용한다. 현재 체크리스트에는 공유
  파일이 많아 잘못된 병렬 실행을 막기 위해 task-level `[P]`를 의도적으로 생략했다.
- 핵심 단계 수와 보조 `완료`/`배포 중단` 상태를 혼동하지 않는다.
- waypoint는 승인된 외곽 복귀선 때문에 음수·소수 column을 허용하되 diagram bounds
  안에서 검증한다.
- 하네스에는 demo CTA를 추가하지 않고 다른 7개 작업물의 legacy content를 보존한다.
- 구현 단계는 commit, push, merge 또는 deploy를 수행하지 않는다.
