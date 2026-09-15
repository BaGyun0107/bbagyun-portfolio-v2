---

description: "반응형 스윔레인 뷰어 구현 작업 목록"
---

# Tasks: 반응형 스윔레인 뷰어

**Input**: Design documents from `specs/008-responsive-swimlane-viewer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 사용자-facing 동작 변경이며 헌법이 TDD를 요구한다. 각 사용자 스토리의
테스트를 먼저 작성하고 현재 구현에서 RED를 확인한 뒤 구현해 GREEN으로 전환한다.

**Organization**: 사용자 스토리별로 독립 검증할 수 있게 묶는다. 같은 파일을 수정하는
작업은 순차 실행하며 기존 사용자 변경과 작업물 콘텐츠를 보존한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일을 사용하고 미완료 선행 작업에 의존하지 않아 병렬 실행 가능
- **[Story]**: 해당 사용자 스토리 (`US1`~`US5`)
- 모든 작업은 저장소 루트 기준의 정확한 파일 경로를 포함한다

## Path Conventions

구현 대상은 `apps/front`뿐이다. 패키지 명령은 `apps/front`에서 pnpm으로 실행한다.
`apps/back`, package manifest, lockfile과 작업물 본문 데이터는 변경하지 않는다.

---

## Phase 1: Setup

**Purpose**: 사용자 흐름 변경 표시와 구현 전 보존 기준을 확정한다.

- [X] T001 `.harness/state/touches-user-flow`를 `yes`로 만들고 `.harness/state/current-size`가 `Large`인지 확인한다
- [X] T002 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 구조화 작업물 4개·스윔레인 6개의 현재 lane/step/edge/label/summary/exception 개수와 문자열을 정본 fixture로 고정한다 (FR-022, SC-002, SC-009)

**Checkpoint**: 공개 스윔레인 콘텐츠 불변 기준과 E2E 의무가 고정된다.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리가 공유할 geometry 테스트 경계와 데이터 호환성을 준비한다.

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 renderer 구현을 변경하지 않는다.

- [X] T003 `apps/front/src/components/projects/project-swimlane-layout.test.ts`를 만들고 node geometry, 네 변 중앙 anchor와 diagram size의 현재 불변 조건을 먼저 고정한다 (FR-010, FR-023)
- [X] T004 [P] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 anchor 생략은 유효하고 임의 anchor 문자열은 오류인 계약 테스트를 추가해 RED를 확인한다 (FR-008, FR-009, FR-023)
- [X] T005 `apps/front/src/data/portfolio/feature-details/index.ts`가 anchor 값이 있을 때만 허용 방향을 검사하도록 변경해 T004를 GREEN으로 만들고 기존 renderer 타입 계약을 유지한다 (FR-008, FR-009, FR-023)

**Checkpoint**: 기존 명시 anchor는 보존되고 신규 edge는 자동 anchor를 사용할 수 있다.

---

## Phase 3: User Story 1 — 스크롤 없이 전체 흐름 파악 (Priority: P1) 🎯 MVP

**Goal**: 본문 카드가 모든 lane을 가용 폭에 맞춰 표시하고 가로 스크롤과 불필요한
키보드 정지점을 만들지 않는다.

**Independent Test**: 320/375/768/1024/1440px에서 네 구조화 작업물의 document와
스윔레인 카드 overflow가 0px이고 전체 lane이 본문 미리보기에 존재한다.

### Tests for User Story 1 — RED first

- [X] T006 [US1] `apps/front/src/components/projects/project-detail-rendering.test.tsx`의 scroll region 계약을 본문 fit preview 계약으로 바꾸고 `overflow-x-auto`, `role=region`, `tabIndex=0` 부재와 전체 lane 보존을 검사해 RED를 확인한다 (FR-001, FR-002, FR-020, SC-001, SC-007)
- [X] T007 [P] [US1] `apps/front/e2e/swimlane-viewer.spec.ts`를 만들고 네 구조화 작업물에서 320/375/768/1024/1440px document·article overflow 0px와 본문 diagram 6개 존재를 검사하는 E2E를 추가한다 (FR-001, FR-002, SC-001, SC-002)

### Implementation for User Story 1

- [X] T008 [US1] `apps/front/src/components/projects/ProjectSwimlane.tsx`에서 가로 scroll region과 `tabIndex`를 제거하고 본문 다이어그램을 `min-w-0` fit preview 컨테이너로 바꾼다 (FR-001, FR-002, FR-020)
- [X] T009 [US1] `apps/front/src/components/projects/ProjectSwimlaneDiagram.tsx`가 자연 viewBox와 종횡비를 유지하면서 부모 폭에 맞춰 축소되고 고정 폭으로 overflow를 만들지 않도록 표시 계약을 변경한다 (FR-001, FR-002)
- [X] T010 [US1] T006을 GREEN으로 만들고 `apps/front/e2e/codi-harness-portfolio-detail.spec.ts` 및 `apps/front/e2e/hanmaum-search-detail.spec.ts`의 기존 keyboard horizontal-scroll 전제를 새 no-scroll preview 계약으로 갱신한다 (FR-001, FR-002, FR-020, SC-001)

**Checkpoint**: 본문 스윔레인은 스크롤 없이 전체 구조를 보여주며 US1 관련 Vitest가 GREEN이다.

---

## Phase 4: User Story 2 — 자연스러운 연결선 추적 (Priority: P1)

**Goal**: 상·하·좌·우 어느 변에서도 둥근 직교선과 작은 화살촉이 같은 접선으로
이어지고 label pill이 경계 안에서 읽힌다.

**Independent Test**: 네 도착 방향 fixture 모두에서 마지막 직선이 10px 이상이고
target 변에 수직이며, path/marker 비례·실선/점선·label 경계 계약이 통과한다.

### Tests for User Story 2 — RED first

- [X] T011 [US2] `apps/front/src/components/projects/project-swimlane-layout.test.ts`에 상대 위치 기반 네 방향 자동 anchor, 한쪽·양쪽 명시 override, waypoint 직교화와 중복·공선점 제거 테스트를 추가해 RED를 확인한다 (FR-008, FR-009, FR-010)
- [X] T012 [US2] `apps/front/src/components/projects/project-swimlane-layout.test.ts`에 네 방향 10px 수직 진입, 최대 8px 곡률과 짧은 구간 반경 축소, 단일 path 접선 테스트를 추가해 RED를 확인한다 (FR-011, FR-012, FR-013, FR-015, SC-003)
- [X] T013 [P] [US2] `apps/front/src/components/projects/project-detail-rendering.test.tsx`에 polyline 0개, 2px butt/round path, 6px marker, normal 실선·exception 점선, port/circle/halo 0개와 승인 layer 순서 테스트를 추가해 RED를 확인한다 (FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, SC-003, SC-008)
- [X] T014 [US2] `apps/front/src/components/projects/project-swimlane-layout.test.ts`에 `labelAt` 우선, 가장 긴 읽기 가능한 구간 선택, 긴 한글 label 전체 폭과 diagram padding clamp 테스트를 추가해 RED를 확인한다 (FR-017, FR-018, SC-004)

### Implementation for User Story 2

- [X] T015 [US2] `apps/front/src/data/portfolio/types/feature-detail.dto.ts`의 `fromAnchor`·`toAnchor`를 선택 필드로 완화하고 `apps/front/src/components/projects/project-swimlane-layout.ts`에 상대 위치 기반 anchor 해석, anchor 법선 방향의 출발·도착 여유점과 waypoint를 직교 경로로 정규화하는 순수 함수를 구현한다 (FR-008, FR-009, FR-010, FR-013)
- [X] T016 [US2] `apps/front/src/components/projects/project-swimlane-layout.ts`에 중복·공선점 정리, 짧은 구간 반경 축소, 둥근 단일 path와 10px 수직 도착 구간 계산을 구현해 T011·T012를 GREEN으로 만든다 (FR-011, FR-012, FR-013, FR-015)
- [X] T017 [US2] `apps/front/src/components/projects/project-swimlane-layout.ts`에 문자열 폭·padding을 포함한 label pill geometry, longest-segment 자동 위치, `labelAt` override와 경계 clamp를 구현해 T014를 GREEN으로 만든다 (FR-017, FR-018)
- [X] T018 [US2] `apps/front/src/components/projects/ProjectSwimlaneDiagram.tsx`를 lane → node shape → edge path/marker → node text → label pill 순서로 분리하고 2px path·6px marker·8px radius·butt cap·round join과 normal/exception 표현을 적용해 T013을 GREEN으로 만든다 (FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, SC-003, SC-004, SC-008)

**Checkpoint**: geometry와 renderer의 모든 방향·라벨 테스트가 GREEN이고 기존 edge 데이터는 바뀌지 않는다.

---

## Phase 5: User Story 3 — 동일한 흐름을 크게 확인 (Priority: P2)

**Goal**: 명시적인 버튼으로 본문과 같은 스윔레인을 넓은 Dialog에서 보고 Escape로
닫은 뒤 버튼으로 돌아온다.

**Independent Test**: 각 카드에서 버튼을 실행하면 같은 lane/step/edge/label을 가진
Dialog가 열리고, hover 없이 click·keyboard로 조작되며 닫힌 뒤 포커스가 복귀한다.

### Tests for User Story 3 — RED first

- [X] T019 [US3] `apps/front/src/components/projects/project-detail-rendering.test.tsx`에 모든 스윔레인 카드의 보이는 `크게 보기` 버튼과 inline instance key 계약을 추가해 RED를 확인한다 (FR-003, FR-004, FR-006)
- [X] T020 [US3] `apps/front/e2e/swimlane-viewer.spec.ts`에 hover만으로 Dialog가 열리지 않음, 버튼 click·모바일 tap·Enter·Space 열기, Dialog 제목·설명, inline/dialog lane·step·edge·label 일치, Escape 닫기와 trigger focus 복귀, Dialog overflow 0px 테스트를 추가해 RED를 확인한다 (FR-003, FR-004, FR-005, FR-006, FR-007, SC-002, SC-005)

### Implementation for User Story 3

- [X] T021 [US3] `apps/front/src/components/projects/ProjectSwimlane.tsx`를 최소 client boundary로 전환하고 기존 `apps/front/src/components/ui/dialog.tsx` primitive로 `크게 보기` 버튼·제목·설명·대형 responsive Dialog를 조합한다 (FR-003, FR-005, FR-006, FR-007)
- [X] T022 [US3] `apps/front/src/components/projects/ProjectSwimlane.tsx`에서 본문과 Dialog에 동일 `FeatureSwimlane`을 전달하고 Dialog 내부를 가용 viewport에 맞는 no-scroll 보기로 구성한다 (FR-004, FR-005, SC-002)
- [X] T023 [US3] `apps/front/src/components/projects/ProjectSwimlaneDiagram.tsx`에 `inline | dialog` instance key와 보기별 responsive class/접근 이름 입력을 추가해 T019·T020의 데이터 동일성 계약을 GREEN으로 만든다 (FR-004, FR-005, FR-019)

**Checkpoint**: 크게 보기의 mouse·touch·keyboard 흐름과 동일 데이터 계약이 독립적으로 동작한다.

---

## Phase 6: User Story 4 — 시각화 없이도 같은 의미 이해 (Priority: P2)

**Goal**: 보조 기술과 키보드 사용자가 고유한 이름, 보이는 전체 흐름 설명과 예외
대응으로 같은 의미를 이해하고 정적 도형에서 불필요하게 멈추지 않는다.

**Independent Test**: 한 페이지의 inline/dialog 다이어그램 식별자가 모두 고유하고,
정적 node/edge tab stop이 0개이며, 텍스트 대안과 실선/점선 구분이 유지된다.

### Tests for User Story 4 — RED first

- [X] T024 [US4] `apps/front/src/components/projects/project-detail-rendering.test.tsx`에 inline/dialog별 고유 title·description·marker ID, 구분 가능한 접근 이름, 보이는 summary 연결과 정적 node/edge tab stop 0개를 검사하는 테스트를 추가해 RED를 확인한다 (FR-019, FR-020, FR-021, SC-006, SC-007)
- [X] T025 [US4] `apps/front/e2e/swimlane-viewer.spec.ts`에 article 안에서 버튼과 두 보기의 접근 이름을 구분하고 summary·exception 텍스트, focus trap·닫기 후 복귀, 색상 외 실선/점선 구분을 확인하는 테스트를 추가해 RED를 확인한다 (FR-016, FR-019, FR-020, FR-021, SC-005, SC-006, SC-007, SC-008)

### Implementation for User Story 4

- [X] T026 [US4] `apps/front/src/components/projects/ProjectSwimlaneDiagram.tsx`의 title·description·normal/exception marker ID에 swimlane ID와 instance key를 포함하고 inline/dialog 접근 이름을 분리한다 (FR-019, SC-006)
- [X] T027 [US4] `apps/front/src/components/projects/ProjectSwimlane.tsx`와 `apps/front/src/components/projects/ProjectSwimlaneDiagram.tsx`에서 보이는 summary의 `aria-describedby` 연결, 정적 도형 비포커스와 Dialog focus 복귀를 보존해 T024·T025를 GREEN으로 만든다 (FR-020, FR-021, SC-005, SC-007)

**Checkpoint**: 시각 다이어그램을 직접 해석하지 않아도 동일 흐름과 예외를 이해할 수 있다.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 회귀, 실제 화면, 환경 정리와 완료 증거를 검증한다.

- [X] T028 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`, `apps/front/src/components/projects/project-detail-rendering.test.tsx`, `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`, `apps/front/e2e/hanmaum-search-detail.spec.ts`의 구조화 작업물 4개·스윔레인 6개 회귀 fixture를 최종 새 UI 계약으로 재고정하고 기존 본문 문자열 손실 0건을 확인한다 (FR-022, SC-002, SC-009)
- [X] T029 `specs/008-responsive-swimlane-viewer/quickstart.md` 순서로 `pnpm exec tsc --noEmit` → 관련 Vitest → 전체 Vitest → 변경 파일 ESLint → `pnpm run build` → `git diff --check`를 실행하고 결과를 수집한다 (FR-023, FR-024, SC-010)
- [X] T030 포트 1104 listener와 `.next/dev` lock 상태를 기록하고 비어 있는 별도 포트에서 production server를 시작한 뒤 `apps/front/playwright.feature-008.prod.config.ts`를 임시 생성해 permanent Playwright 전체 suite를 실행한다 (FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-016, FR-019, FR-020, FR-021, SC-001, SC-002, SC-003, SC-004, SC-005, SC-006, SC-007, SC-008, SC-009, SC-010)
- [X] T031 production server에서 Harness·Blackstone 대표 화면과 열린 Dialog를 `apps/front/test-results/swimlane-viewer-mobile-approved.png`(320px), `apps/front/test-results/swimlane-viewer-desktop-approved.png`(1440px)에 캡처하고 `view_image`로 overflow, 화살촉 접선, 긴 라벨, Dialog 가독성을 확인한다 (SC-001, SC-003, SC-004)
- [X] T032 소유한 production process만 종료하고 `apps/front/playwright.feature-008.prod.config.ts`와 임시 결과를 삭제한 뒤 별도 포트 해제, 포트 1104 process와 `.next/dev` lock 보존을 확인한다
- [X] T033 `mise run e2e:changed`를 실행하되 공유 worktree의 기존 unstaged/untracked 변경 때문에 stamp가 거부되면 사용자 파일을 stage하지 말고 fresh production E2E와 구분해 사유를 기록한다 (SC-010)
- [X] T034 `superpowers:requesting-code-review`로 독립 리뷰를 요청하고 `superpowers:receiving-code-review` 절차로 Critical·Important 지적을 해소한다
- [X] T035 `speckit-converge`를 실행해 `Converged`를 확인하고 추가 태스크가 생기면 tasks.md 순서로 해결한다
- [X] T036 `specs/008-responsive-swimlane-viewer/verification.md`에 RED/GREEN, typecheck, 관련·전체 Vitest, scoped lint, build, production E2E, 화면 검사, 리뷰, 임시 자원 정리와 잔여 위험을 기록한다
- [X] T037 `mise run feature:status:sync`를 실행하고 결정 가능한 전이는 `--apply`로 반영한 뒤 `ROADMAP.md`를 feature 008 완료 상태와 일치시키며 모호하거나 on-hold인 경우 자동 변경하지 않고 보고한다

---

## Phase 8: User Story 5 — 구조를 유지하면서 모든 글자를 읽는다 (Priority: P1) 🎯 Follow-up MVP

**Goal**: lane·node·edge 관계와 no-scroll 구조를 유지하면서 실제 node 글자를 10px 이상으로
표시하고 edge label 충돌을 결정적으로 해소한다.

**Historical baseline**: 완료된 T009의 고정 viewBox 전체 축소와 T014·T017의 가장 긴
직선 구간 label 배치는 1차 구현 이력이다. 이번 승인 계약에서는 각각 T042·T045의
viewport geometry와 T039·T043의 rounded path 전체 50% 지점 배치가 이를 대체한다.

**Independent Test**: 252·307·684·766.7px 순수 layout과 320/375/768/1024/1440px 실제
브라우저에서 node text overflow, label-label·label-node·label-boundary 충돌이 모두 0건이며
4개 작업물·6개 스윔레인의 입력 구조와 문자열이 그대로인지 확인한다.

### Tests for User Story 5 — RED first

- [X] T038 [US5] `apps/front/src/components/projects/project-swimlane-layout.test.ts`에 4-lane·3-lane의 252·307·684·766.7px viewport fixture, node font 10px 이상, shape 안전 영역 줄바꿈, node 높이와 row 간격 증가 테스트를 추가해 RED를 확인한다 (FR-025, FR-026, FR-027, SC-011, SC-012)
- [X] T039 [US5] `apps/front/src/components/projects/project-swimlane-layout.test.ts`에 quadratic corner를 포함한 rounded path 누적 길이 50% 지점, 충돌 없는 이동량 0, `0/-1/+1/-2/+2` 최소 트랙, explicit label 고정, 한 줄→2줄→3줄→오류와 Blackstone 네 label 충돌 0건 테스트를 추가해 RED를 확인한다 (FR-017, FR-028, FR-029, FR-030, FR-031, SC-013, SC-014)
- [X] T040 [P] [US5] `apps/front/src/components/projects/responsive-swimlane-diagram.test.tsx`에 compact SSR fallback과 DOM 없이 검증 가능한 폭 정규화 함수의 유효 정수 폭 반영·동일·0·비유한 폭 무시 테스트를 추가해 RED를 확인한다 (FR-001, FR-005, FR-025, SC-011)
- [X] T041 [P] [US5] `apps/front/src/components/projects/project-detail-rendering.test.tsx`에 계산된 node·edge label 줄별 `tspan`, layout size viewBox, 기존 layer·marker·접근 이름과 4개 작업물·6개 스윔레인 구조 보존 테스트를 추가해 RED를 확인한다 (FR-004, FR-019, FR-022, FR-024, FR-025, FR-026, SC-015)

### Implementation for User Story 5

- [X] T042 [US5] `apps/front/src/components/projects/project-swimlane-layout.ts`에 `SwimlaneLayoutViewport`, CJK·Latin·space 공통 text layout, viewport 기반 lane/node 폭, shape 안전 영역, 동적 node·row·diagram 높이 계산을 구현해 T038을 GREEN으로 만든다 (FR-024, FR-025, FR-026, FR-027, SC-011, SC-012)
- [X] T043 [US5] `apps/front/src/components/projects/project-swimlane-layout.ts`에 rounded 직선·quadratic 구간 길이와 50% point 계산, explicit→normal→exception 순서의 rectangle 충돌 resolver, 한 줄→2줄→3줄 실패 계약을 구현해 T039를 GREEN으로 만든다 (FR-017, FR-018, FR-028, FR-029, FR-030, FR-031, SC-013, SC-014)
- [X] T044 [US5] `apps/front/src/components/projects/ResponsiveSwimlaneDiagram.tsx`에 compact fallback과 정수 폭 변경만 반영하는 `ResizeObserver` wrapper를 구현해 T040을 GREEN으로 만든다 (FR-001, FR-004, FR-005, FR-025)
- [X] T045 [US5] `apps/front/src/components/projects/ProjectSwimlane.tsx`에서 inline·Dialog 각각 `ResponsiveSwimlaneDiagram`을 사용하고 `apps/front/src/components/projects/ProjectSwimlaneDiagram.tsx`가 완성된 layout geometry와 node·label `tspan`을 렌더링하도록 변경해 T041을 GREEN으로 만든다 (FR-004, FR-005, FR-019, FR-024, FR-025, FR-026, SC-015)
- [X] T046 [US5] `apps/front/e2e/swimlane-viewer.spec.ts`에 실제 `ResizeObserver`로 반영된 inline/Dialog 독립 폭과 320/375/768/1024/1440px의 4개 작업물·6개 보기에서 node font 10px 이상, node text overflow 0, label-label·label-node·label-boundary 충돌 0, 구조·문자열 동일성을 검증한다 (FR-001, FR-004, FR-005, FR-024, FR-025, FR-026, FR-028, FR-031, SC-011, SC-012, SC-014, SC-015)

**Checkpoint**: 고정 viewBox 축소 없이 모든 지원 폭에서 구조와 문구를 보존하며 node와
edge label을 충돌 없이 읽을 수 있고 US5 관련 Vitest가 GREEN이다.

---

## Phase 9: Follow-up Polish & Cross-Cutting Concerns

**Purpose**: 후속 geometry의 전체 회귀, 실제 화면, 독립 리뷰와 완료 증거를 검증한다.

- [X] T047 `apps/front`에서 `pnpm exec tsc --noEmit` → 관련 Vitest → 전체 Vitest → 변경 파일 ESLint → `pnpm run build` → 저장소 루트 `git diff --check`를 실행하고 `specs/008-responsive-swimlane-viewer/verification.md`에 후속 결과를 기록한다 (FR-023, SC-010)
- [X] T048 포트 1104 listener와 `.next/dev` lock을 보존한 채 별도 미사용 포트 production server와 임시 `apps/front/playwright.feature-008.prod.config.ts`를 사용해 permanent Playwright 전체 suite를 실행하고 `specs/008-responsive-swimlane-viewer/verification.md`에 명령·결과를 기록한다 (FR-001, FR-004, FR-005, FR-019, FR-024, FR-025, FR-026, FR-028, FR-031, SC-010, SC-011, SC-012, SC-014, SC-015)
- [X] T049 production 화면에서 Blackstone·Hanmaum 모바일 본문과 데스크톱 Dialog를 캡처해 `view_image`로 node 줄바꿈·글자 크기·label 중앙/상하 배치를 확인하고 `specs/008-responsive-swimlane-viewer/verification.md`에 수동 검토 결과를 기록한다 (SC-011, SC-012, SC-013, SC-014)
- [X] T050 소유한 production process와 임시 `apps/front/playwright.feature-008.prod.config.ts`·임시 결과만 정리하고 별도 포트 해제, 포트 1104 process와 `.next/dev` lock 보존을 `specs/008-responsive-swimlane-viewer/verification.md`에 기록한다
- [X] T051 `superpowers:requesting-code-review`와 `superpowers:receiving-code-review`로 후속 구현을 독립 검토하고 Critical·Important 잔여를 0건으로 만든 뒤 결과를 `specs/008-responsive-swimlane-viewer/verification.md`에 기록한다
- [X] T052 `speckit-converge`가 `Converged`일 때까지 후속 태스크를 반영하고 `mise run feature:status:sync` 및 필요한 `--apply`를 실행해 `specs/008-responsive-swimlane-viewer/verification.md`와 `ROADMAP.md` 상태를 동기화한다

---

## Phase 10: User Feedback Regression — 연결선이 비연결 node를 침범하지 않는다

**Goal**: 현재 구조와 공개 데이터를 유지하면서 연결선이 출발·도착 구간 밖으로 불필요하게
우회하거나 다른 node와 문구를 관통하는 회귀를 제거한다.

- [X] T053 사용자 승인 방식에 맞춰 `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, UI contract, 후속 설계와 `tasks.md`에 세로 구간 기반 장애물 판정, 비연결 node 교차 0건과 검증 범위를 기록한다 (FR-032, SC-016)
- [X] T054 `apps/front/src/components/projects/project-swimlane-layout.test.ts`에 실제 4개 작업물·6개 스윔레인의 모든 edge가 source·target 이외 node rectangle을 통과하지 않고 진행 방향 반대로 불필요하게 우회하지 않는 회귀 테스트를 추가해 현재 구현에서 RED를 확인한다 (FR-032, SC-016)
- [X] T055 `apps/front/e2e/swimlane-viewer.spec.ts`의 실제 SVG 검사에 path와 비연결 node 도형 교차 0건을 추가해 기존 E2E 검증 공백을 닫는다 (FR-024, FR-032, SC-010, SC-016)
- [X] T056 `apps/front/src/components/projects/project-swimlane-layout.ts`에서 장애물 후보를 source·target 사이의 실제 세로 구간으로 제한하고 특수 상·하 anchor 경로도 공통 obstacle 검증을 거치게 해 T054를 GREEN으로 만든다 (FR-011, FR-013, FR-032, SC-003, SC-016)
- [X] T057 관련·전체 Vitest, TypeScript, 변경 파일 ESLint, build와 `git diff --check`를 실행하고 결과를 `verification.md`에 기록한다 (FR-023, FR-024, SC-010)
- [X] T058 포트 1104를 보존한 별도 production 서버에서 permanent Playwright를 실행하고 Blackstone·Hanmaum inline/Dialog를 직접 확인해 선·node 교차 0건을 기록한다 (FR-001, FR-004, FR-032, SC-001, SC-016)
- [X] T059 소유한 임시 자원을 정리하고 `speckit-converge`, `ROADMAP.md`와 feature 상태를 다시 동기화한다

---

## Phase 11: User Feedback Regression — 결과 분기의 대응 관계를 명확히 한다

**Goal**: Harness의 두 배포 중단 도착 변을 승인 방향으로 교환하고, Blackstone의 네 결과
분기를 구조 변경 없이 목적지 순서와 일치하는 계단형 통로로 구분한다.

- [X] T060 사용자 승인 방향을 `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, UI contract, 후속 설계와 `tasks.md`에 기록한다 (FR-009, FR-033, SC-017)
- [X] T061 `project-swimlane-layout.test.ts`에 Harness 도착 anchor와 Blackstone 분기 통로 순서 회귀 테스트를 추가해 기존 구현의 5개 실패를 RED로 확인한다 (FR-009, FR-033, SC-017)
- [X] T062 Harness의 두 `toAnchor`를 교환하고 불필요한 waypoint를 제거하며, 공통 라우터에 target 순서 기반 sibling channel을 구현해 48/48 focused 테스트를 GREEN으로 만든다 (FR-009, FR-011, FR-033, SC-003, SC-017)
- [X] T063 포트 1104 실제 Harness·Blackstone inline을 캡처해 도착 변, hairpin 제거, 분기 라벨과 target 대응을 원본 크기로 확인한다 (FR-017, FR-033, SC-013, SC-017)
- [X] T064 관련·전체 검증과 별도 포트 production E2E를 실행하고 `verification.md`, `ROADMAP.md`, 수렴 상태와 임시 자원 정리를 동기화한다 (FR-024, FR-033, SC-010, SC-017)
- [X] T065 사용자 화면 피드백에 따라 `secrets-stop`을 bottom anchor로 바꾸고, 같은 행의 가로 출발·세로 도착 경로가 target을 가리지 않는 RED→GREEN 회귀 테스트와 공통 routing을 추가한 뒤 전체 검증·화면 캡처·문서를 동기화한다 (FR-013, FR-034, SC-003, SC-018)

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 Setup (T001~T002)
  └─> Phase 2 Foundation (T003~T005)
        ├─> Phase 3 US1 (T006~T010) ─┐
        └─> Phase 4 US2 (T011~T018) ─┼─> Phase 5 US3 (T019~T023)
                                    └─> Phase 6 US4 (T024~T027)
                                          └─> Phase 7 (T028~T037, 1차 완료)
                                                └─> Phase 8 US5 (T038~T046)
                                                      └─> Phase 9 (T047~T052)
                                                            └─> Phase 10 (T053~T059)
                                                                  └─> Phase 11 (T060~T064)
```

- US1과 US2는 Foundation 뒤 논리상 독립적이지만 두 스토리 모두 공통 renderer 파일을
  수정하므로 실제 실행은 US1 → US2 순서로 진행한다.
- US3는 완성된 responsive renderer와 geometry를 같은 데이터로 두 번 표시하므로
  US1·US2 뒤에 진행한다.
- US4는 US2의 실선/점선과 US3의 Dialog를 함께 검증하므로 세 스토리 뒤에 진행한다.
- Phase 7 검증은 모든 구현이 GREEN인 뒤에만 실행한다.
- US5 후속 작업은 1차 완료 결과를 baseline으로 사용하며 T038~T041 RED 계약을 먼저 만든다.
- Phase 9 후속 검증은 T042~T046이 GREEN인 뒤에만 실행한다.
- Phase 10 회귀 보완은 T054의 실제 작업물 RED를 확인한 뒤 T056을 구현하고, T057~T059로 다시 검증한다.
- Phase 11 분기 가독성 보완은 T061의 실제 5개 RED를 확인한 뒤 T062를 구현하고, T063 화면 검사 후 T064에서 전체 검증한다.

### Within Each User Story

- 테스트를 작성하고 현재 구현에서 기대 이유로 RED인지 확인한다.
- 순수 데이터·geometry를 renderer보다 먼저 구현한다.
- story 관련 테스트를 GREEN으로 만든 뒤 다음 story로 이동한다.
- 같은 파일을 수정하는 태스크는 병렬 실행하지 않는다.

## Parallel Opportunities

- T004는 T003과 다른 파일이므로 병렬 가능하다.
- T007은 T006과 다른 파일에 E2E 계약을 작성하므로 병렬 가능하다.
- T013은 T011·T012와 다른 렌더링 테스트 파일이므로 병렬 가능하다.
- T031의 화면 캡처는 T030이 띄운 production server를 사용하므로 T030 뒤에 순차 실행한다.
- T040과 T041은 T038·T039와 다른 테스트 파일이므로 병렬 작성할 수 있다.
- T048이 띄운 production server를 T049가 사용하므로 두 작업은 순차 실행한다.

구현 파일은 `ProjectSwimlane.tsx`, `ProjectSwimlaneDiagram.tsx`,
`project-swimlane-layout.ts`에 집중되므로 구현 자체는 순차 진행한다.

## Parallel Example: User Story 2

```text
Task T011/T012/T014: project-swimlane-layout.test.ts에서 geometry RED 계약 작성
Task T013: project-detail-rendering.test.tsx에서 SVG 표현 RED 계약 작성

두 테스트 파일의 RED를 확인한 뒤 T015 → T016 → T017 → T018 순서로 구현한다.
```

## Parallel Example: User Story 5

```text
Task T038/T039: project-swimlane-layout.test.ts에서 순수 layout·label resolver RED 계약 작성
Task T040: responsive-swimlane-diagram.test.tsx에서 측정 wrapper RED 계약 작성
Task T041: project-detail-rendering.test.tsx에서 SVG 줄바꿈·구조 보존 RED 계약 작성

RED를 확인한 뒤 T042 → T043 → T044 → T045 → T046 순서로 구현한다.
```

## Implementation Strategy

### MVP First — User Story 1

1. Setup과 Foundation을 완료한다.
2. US1 테스트를 RED로 고정한다.
3. 본문 no-scroll fit preview를 구현한다.
4. 관련 Vitest와 반응형 E2E 명세가 요구하는 상태를 확인한다.

이 시점에 가로 스크롤 제거라는 첫 사용자 가치를 독립 확인할 수 있다.

### Incremental Delivery

1. US1 — 스크롤 없는 전체 흐름 미리보기
2. US2 — 자연스러운 path·화살촉·label pill
3. US3 — 동일 데이터의 크게 보기 Dialog
4. US4 — 고유 접근 이름과 키보드·텍스트 대안
5. 전체 production E2E·시각 검사·리뷰·convergence

### Follow-up MVP — User Story 5

1. 기존 완료 구현을 baseline으로 유지한다.
2. 순수 layout, collision resolver, 측정 wrapper와 renderer 테스트를 RED로 고정한다.
3. viewport 기반 node geometry와 전체 path 중앙 label resolver를 구현한다.
4. 4개 작업물·6개 스윔레인의 실제 브라우저 충돌 0건을 확인한다.
5. 별도 포트 production E2E·화면 검사·독립 리뷰·convergence를 완료한다.

## Notes

- 구현 단계는 commit, push, PR, merge 또는 deploy를 수행하지 않는다.
- 포트 1104의 기존 process를 종료하거나 재사용하지 않는다.
- 임시 Playwright config와 production process는 검증 후 반드시 정리한다.
- 전역 lint baseline을 고치거나 관련 없는 파일을 포맷하지 않는다.
- 작업물 데이터 파일의 공개 문구와 스윔레인 내용을 변경하지 않는다.
