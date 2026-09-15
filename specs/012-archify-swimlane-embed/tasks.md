---

description: "Actual Archify artifact embed conversion tasks"
---

# Tasks: Archify 스윔레인 임베드 전환

**Input**: Design documents from /specs/012-archify-swimlane-embed/

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 사용자 요청과 헌법 원칙에 따라 모든 행동 변경은 테스트를 먼저 추가하고 RED를 확인한 뒤 최소 구현으로 GREEN을 만든다.

**Scope**: hotel-reservation-platform의 platform-change-verification-deployment 한 건만 전환한다. Feature 011 JSON·HTML과 다른 작업물의 공개 콘텐츠는 수정하지 않는다.

## Format: [ID] [P?] [Story] Description

- **[P]**: 다른 파일을 수정하며 선행 의존성이 없어 병렬 실행 가능
- **[USn]**: spec.md 사용자 스토리 추적값
- 모든 작업은 실제 파일 경로와 완료 조건을 포함

## Phase 1: Setup and Baseline

**Purpose**: 공유 worktree와 동결 artifact의 시작 상태를 기록한다.

- [X] T001 port 1104 listener/PID, 대상 페이지 HTTP 상태, 공유 worktree 범위와 전역 lint baseline 주의를 specs/012-archify-swimlane-embed/verification.md에 기록한다
- [X] T002 apps/front/diagrams/hotel-reservation-platform/platform-change-verification-deployment.json과 apps/front/public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html의 SHA-256·byte count·node 10개·edge 12개를 확인해 specs/012-archify-swimlane-embed/verification.md에 기준선으로 기록한다
- [X] T003 현재 apps/front 대상 Vitest와 TypeScript 기준선을 실행하고 Feature 012 이전 실패가 있으면 specs/012-archify-swimlane-embed/verification.md에 범위와 원인을 분리해 기록한다

**Checkpoint**: 사용자 소유 server와 동결 artifact를 훼손하지 않고 구현을 시작할 기준선이 남는다.

---

## Phase 2: Foundational Embed Contract

**Purpose**: 모든 사용자 스토리가 공유하는 url-only metadata와 안전한 source 선택 계약을 TDD로 만든다.

### Tests first

- [X] T004 [P] apps/front/src/data/portfolio/feature-detail-quality.test.ts에 url-only archify metadata, query/hash 없는 same-origin /diagrams/*.html 허용, 외부·잘못된 확장자·빈 경로 거부, 대상 한 건 한정과 label 제거 테스트를 추가하고 RED를 확인한다
- [X] T005 [P] apps/front/src/components/projects/project-detail-rendering.test.tsx에 별도 Archify로 보기 link·target=_blank 제거와 metadata가 없는 스윔레인의 기존 렌더링 보존 테스트를 추가하고 RED를 확인한다

### Minimal implementation

- [X] T006 apps/front/src/data/portfolio/types/feature-detail.dto.ts의 link 성격 타입을 url-only FeatureSwimlaneArchifyEmbed 계약으로 변경한다
- [X] T007 apps/front/src/data/portfolio/feature-details/index.ts에 root-relative /diagrams/*.html, no-query, no-hash validator를 구현한다
- [X] T008 apps/front/src/data/portfolio/feature-details/hotel-reservation-platform.ts의 대상 metadata에서 label을 제거하고 동결 HTML URL만 유지한다
- [X] T009 T004~T008 관련 Vitest를 실행해 GREEN을 확인하고 RED/GREEN 명령과 결과를 specs/012-archify-swimlane-embed/verification.md에 기록한다

**Checkpoint**: 안전한 source 선택과 단일 파일럿 범위가 UI 구현 전에 고정된다.

---

## Phase 3: User Story 1 - 카드에서 핵심 구조 파악 (Priority: P1) MVP

**Goal**: 대상 카드의 작은 보기에 실제 Archify artifact를 MAP 밀도로 지연 표시하고 현재 포트폴리오 시각 체계를 적용한다.

**Independent Test**: 대상 preview가 viewport 접근 전 iframe을 만들지 않고, 접근 뒤 동일 artifact의 node label·전체 관계 geometry만 표시하며 sublabel·edge label·Viewer 기능과 새 탭 action은 표시하지 않는지 확인한다.

### Tests for User Story 1 — write and fail first

- [X] T010 [P] [US1] apps/front/src/components/projects/archify-swimlane-embed.test.tsx에 preview idle→loading→ready, same-origin DOM 검사, MAP 밀도, 준비 전 hidden, aria-hidden·tabIndex와 pointer 차단 계약 테스트를 추가하고 RED를 확인한다
- [X] T011 [P] [US1] apps/front/src/components/projects/project-detail-rendering.test.tsx에 대상 작은 보기는 Archify embed를 선택하고 비대상 작은 보기는 ResponsiveSwimlaneDiagram을 유지하는 통합 테스트를 추가하고 RED를 확인한다
- [X] T012 [US1] apps/front/src/components/projects/archify-swimlane-embed.test.tsx에 rootMargin 240px 0px인 IntersectionObserver 진입 전 iframe 0, 진입 뒤 iframe 1인 lazy mount 테스트를 추가하고 RED를 확인한다

### Implementation for User Story 1

- [X] T013 [US1] apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx에 preview/dialog mode, source URL, accessible label/description, fallback을 받는 표시 상태 골격을 구현한다
- [X] T014 [US1] apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx에 iframe load 후 .diagram-container > svg 검증, data-embed=true, data-motion=still, MAP 밀도 적용과 ready 전 비노출 transaction을 구현한다
- [X] T015 [US1] apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx에 parent computed CSS variables를 A1 규칙으로 연결하고 root class MutationObserver로 reload 없는 theme 갱신을 구현한다
- [X] T016 [US1] apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx에 rootMargin 240px 0px인 IntersectionObserver 기반 preview lazy mount와 observer cleanup을 구현한다
- [X] T017 [US1] apps/front/src/components/projects/ProjectSwimlane.tsx의 대상 작은 보기만 ArchifySwimlaneEmbed preview를 사용하고, 가용 card 폭에서 같은 SVG geometry를 비례 축소하며 iframe이 document overflow를 만들지 않도록 sizing한 뒤 기존 제목·목적·요약·예외 대응·card 구조를 유지한다
- [X] T018 [US1] US1 대상 Vitest를 실행해 GREEN을 확인하고 MAP density·lazy mount·theme bridge 결과를 specs/012-archify-swimlane-embed/verification.md에 기록한다

**Checkpoint**: Dialog 없이도 대상 카드에서 실제 Archify의 핵심 topology를 독립적으로 읽을 수 있다.

---

## Phase 4: User Story 2 - 같은 흐름을 크게 열어 읽기 (Priority: P1)

**Goal**: 기존 크게 보기 Dialog에서 같은 artifact와 geometry를 READ 밀도로 표시하고 Viewer 기능 없이 세부 문구를 읽게 한다.

**Independent Test**: Dialog open 전 상세 iframe이 없고 open 뒤 같은 URL의 READ 표현이 생기며 node sublabel·의미 있는 edge label은 보이고 Viewer control은 보이거나 focus되지 않으며 close/Escape 후 trigger로 focus가 돌아오는지 확인한다.

### Tests for User Story 2 — write and fail first

- [X] T019 [P] [US2] apps/front/src/components/projects/archify-swimlane-embed.test.tsx에 READ 밀도, 동일 source URL, node sublabel·edge label 표시, 내부 body inert/Viewer control 비활성과 대표 단축키 입력 전후 camera·theme·presentation·focus 불변 테스트를 추가하고 RED를 확인한다
- [X] T020 [US2] apps/front/src/components/projects/project-detail-rendering.test.tsx에 Dialog open 전 상세 iframe 0, open 뒤 1, 기존 크게 보기 이름·close 구조와 별도 새 탭 action 부재 테스트를 추가하고 RED를 확인한다

### Implementation for User Story 2

- [X] T021 [US2] apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx에 dialog mode의 READ 밀도와 preview와 동일한 DOM/theme/interaction 준비 절차를 구현한다
- [X] T022 [US2] apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx에 내부 body inert, iframe aria-hidden·tabIndex=-1·pointer 차단과 Viewer toolbar/search/export/theme/presentation/zoom/pan/semantic UI 제거를 구현한다
- [X] T023 [US2] apps/front/src/components/projects/ProjectSwimlane.tsx에서 기존 Dialog open lifecycle 동안만 상세 ArchifySwimlaneEmbed를 mount하고, viewport 가용 폭·높이에 맞춰 같은 SVG geometry를 비례 축소하고 Dialog 내부 scroll 책임을 제한한 뒤 기존 mouse·touch·keyboard·Escape·focus 복귀 경계를 보존한다
- [X] T024 [US2] US2 대상 Vitest를 실행해 GREEN을 확인하고 MAP/READ가 같은 URL·topology를 사용함을 specs/012-archify-swimlane-embed/verification.md에 기록한다

**Checkpoint**: 작은 보기와 상세 보기가 같은 Archify 결과의 두 승인 밀도로 독립 동작한다.

---

## Phase 5: User Story 3 - 기존 경험과 실패 안전성 (Priority: P2)

**Goal**: artifact를 준비할 수 없을 때 기존 React 스윔레인으로 대체하고 비대상 작업물과 외부 설명을 보존한다.

**Independent Test**: load error, same-origin 접근 실패, 예상 DOM 부재와 timeout 각각에서 빈 영역 대신 ResponsiveSwimlaneDiagram이 나타나고 summary·exceptions와 비대상 Dialog가 그대로인지 확인한다.

### Tests for User Story 3 — write and fail first

- [X] T025 [P] [US3] apps/front/src/components/projects/archify-swimlane-embed.test.tsx에 load error, contentDocument 접근 예외, .diagram-container > svg 부재, 5초 timeout 각각의 fallback과 timer/observer cleanup 테스트를 추가하고 RED를 확인한다
- [X] T026 [P] [US3] apps/front/src/components/projects/project-detail-rendering.test.tsx에 fallback에서도 전체 흐름 설명·예외 대응 유지, 비대상 preview/Dialog의 기존 React renderer 유지 테스트를 추가하고 RED를 확인한다

### Implementation for User Story 3

- [X] T027 [US3] apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx에 5초 단일 준비 timeout과 load/DOM/same-origin 실패를 fallback 상태로 수렴시키는 cleanup-safe state transition을 구현한다
- [X] T028 [US3] apps/front/src/components/projects/ProjectSwimlane.tsx에서 preview와 Dialog 각각에 기존 ResponsiveSwimlaneDiagram fallback을 전달하고 카드 외부 설명은 상태와 무관하게 유지한다
- [X] T029 [US3] US3 대상 Vitest를 실행해 GREEN을 확인하고 네 실패 조건의 fallback 결과를 specs/012-archify-swimlane-embed/verification.md에 기록한다

**Checkpoint**: artifact 장애가 대상 콘텐츠나 다른 작업물의 읽기 경험을 깨뜨리지 않는다.

---

## Phase 6: User Story 4 - 사실성과 범위 검증 (Priority: P2)

**Goal**: 실제 Feature 011 artifact와 공개 의미가 보존되고 파일럿이 다른 작업물로 확장되지 않았음을 자동 증명한다.

**Independent Test**: 두 동결 파일의 identity, 10개 node·12개 edge의 ID·방향·variant, 대상 한 건 한정과 본문·연결 인사이트 불변을 검사한다.

### Verification tests

- [X] T030 [P] [US4] apps/front/src/data/portfolio/feature-detail-quality.test.ts에 동결 JSON·HTML SHA-256·byte count, JSON node 10개·edge 12개, ID·방향·security/dashed variant와 public URL 일치 검사를 추가한다
- [X] T031 [P] [US4] apps/front/src/components/projects/project-detail-rendering.test.tsx에 대상 제목·목적·전체 흐름·예외 대응과 연결 인사이트가 유지되고 Archify embed가 다른 작업물로 확장되지 않았다는 회귀 검사를 추가한다
- [X] T032 [US4] apps/front/diagrams/hotel-reservation-platform/platform-change-verification-deployment.json과 apps/front/public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html이 git diff에 없고 T030~T031이 통과함을 specs/012-archify-swimlane-embed/verification.md에 기록한다

**Checkpoint**: actual Archify provenance, topology와 단일 파일럿 경계가 추적 가능하다.

---

## Phase 7: Browser Contract and Responsive Verification

**Purpose**: unit test가 증명할 수 없는 layout, focus, theme와 실제 iframe behavior를 production browser에서 검사한다.

- [X] T033 apps/front/e2e/swimlane-viewer.spec.ts에 target preview lazy mount/MAP, Dialog on-demand/READ, 같은 source URL과 Archify로 보기 link·새 탭 부재 browser 검사를 추가한다
- [X] T034 apps/front/e2e/swimlane-viewer.spec.ts에 Viewer control visible/focusable 0, iframe Tab·pointer activation 0, 대표 Viewer 단축키 입력 전후 camera·theme·presentation·focus 불변, light/dark 전환 후 reload 없는 portfolio token 반영 검사를 추가한다
- [X] T035 apps/front/e2e/swimlane-viewer.spec.ts에 Dialog mouse·touch·keyboard open, Escape/close와 trigger focus 복귀, 320/768/1024/1440px document overflow·card/close 겹침 0 검사를 추가한다
- [X] T036 apps/front/e2e/swimlane-viewer.spec.ts에 malformed artifact route를 사용한 React fallback과 hanmaum-science-institute 등 비대상 renderer/Dialog 회귀 검사를 추가한다

---

## Phase 8: Polish, Review and Verification

**Purpose**: 최소 구현을 정리하고 변경 범위에 비례한 fresh evidence를 완성한다.

- [X] T037 apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx와 apps/front/src/components/projects/ProjectSwimlane.tsx를 중복 없는 mode/state 책임으로 리팩터링하고 대상 Vitest를 다시 통과시킨다
- [X] T038 pnpm --dir apps/front exec tsc --noEmit와 pnpm --dir apps/front test를 실행해 결과를 specs/012-archify-swimlane-embed/verification.md에 기록한다
- [X] T039 실제 변경 TS/TSX/test 파일만 pnpm --dir apps/front exec eslint로 검사하고 전역 baseline이나 관련 없는 파일을 포맷하지 않은 근거를 specs/012-archify-swimlane-embed/verification.md에 기록한다
- [X] T040 pnpm --dir apps/front build를 실행하고 production artifact가 Archify 제작 도구나 신규 dependency 없이 생성되는지 specs/012-archify-swimlane-embed/verification.md에 기록한다
- [X] T041 기존 port 1104 PID를 보존한 채 별도 port 12114에서 production server를 실행하고 apply_patch로 임시 apps/front/playwright.feature-012.prod.config.ts를 만들어 T033~T036을 실행한다
- [X] T042 preview/Dialog의 light·dark screenshot을 저장해 view_image로 node/edge/arrow clipping, label 겹침, 정보 밀도, 예외 경로와 Viewer chrome flash를 검토하고 specs/012-archify-swimlane-embed/verification.md에 기록한다
- [X] T043 임시 apps/front/playwright.feature-012.prod.config.ts를 apply_patch로 삭제하고 소유한 port 12114 process만 종료한 뒤 port 해제와 기존 1104 PID 보존을 확인한다
- [X] T044 동결 JSON·HTML SHA-256·byte count를 다시 검사하고 git diff --check, mise run e2e:changed를 실행해 결과와 알려진 baseline을 specs/012-archify-swimlane-embed/verification.md에 기록한다
- [X] T045 구현 diff를 요구사항·접근성·cleanup·회귀 관점으로 검토해 Critical/Important finding을 수정하고 재검증 결과를 specs/012-archify-swimlane-embed/verification.md에 기록한다
- [X] T046 speckit-converge를 실행해 Converged가 될 때까지 spec/plan/tasks/implementation/verification 불일치를 수정한다
- [X] T047 mise run feature:status:sync와 필요한 deterministic apply를 시도하고 상태를 ROADMAP.md와 specs/012-archify-swimlane-embed/verification.md에 반영하며 ambiguous/on-hold 또는 task 부재는 자동 처리하지 않고 기록한다
- [X] T048 다른 스윔레인 전환이 없고 후속 확대가 별도 사용자 승인 사항임을 최종 확인한 뒤 specs/012-archify-swimlane-embed/tasks.md와 verification.md의 완료 상태를 동기화한다

---

## Dependencies and Execution Order

### Phase dependencies

- Phase 1 → Phase 2: 기준선과 동결 identity를 먼저 확보한다.
- Phase 2 → US1/US2/US3: metadata source 계약이 모든 embed 표현을 차단한다.
- US1 → US2: preview에서 검증한 same-origin preparation과 theme bridge를 READ mode가 재사용한다.
- US1+US2 → US3: 두 표시 위치가 준비된 뒤 동일 fallback lifecycle을 적용한다.
- US1~US3 → US4: 공개 UI가 확정된 뒤 provenance와 단일 범위를 대조한다.
- US1~US4 → Phase 7: unit/integration GREEN 뒤 실제 브라우저 계약을 추가한다.
- 모든 story와 Phase 7 → Phase 8: 전체 검증·review·converge를 마지막에 수행한다.

### Within each story

1. Tests를 먼저 작성한다.
2. 새 계약 때문에 실패하는 RED를 확인한다.
3. 최소 구현으로 GREEN을 만든다.
4. cleanup/refactor 뒤 같은 tests를 재실행한다.
5. 결과를 verification.md에 즉시 기록한다.

### Parallel opportunities

- T004와 T005는 서로 다른 test 파일이라 병렬 가능하다.
- T010과 T011, T019의 일부와 T020, T025와 T026, T030과 T031은 서로 다른 파일 기준으로 병렬 가능하다.
- 실제 실행은 한 frontend stream으로 유지하며 같은 파일을 수정하는 작업은 순차 처리한다.
- subagent 사용은 현재 계획에 필요하지 않으며 별도 사용자 승인 없이 multi-stream으로 확장하지 않는다.

## Implementation Strategy

### MVP

Phase 1~3을 완료하면 target preview가 실제 Archify MAP 표현으로 동작하는 최소 가치를 독립 확인할 수 있다.

### Incremental delivery

1. Foundation: url-only safe source
2. US1: lazy MAP preview
3. US2: on-demand READ Dialog
4. US3: React fallback and non-target preservation
5. US4: immutable provenance and scope proof
6. Browser verification, review and convergence

## Notes

- Feature 011 JSON·HTML은 read-only verification target이다.
- 구현 중 생성 HTML selector가 계약과 다르면 artifact를 고치지 말고 adapter 또는 fallback 판단을 고친다.
- RED 없이 production behavior를 먼저 작성하지 않는다.
- port 1104와 공유 worktree의 사용자 변경을 보존한다.
- commit, stage, push, PR 생성은 이 tasks.md 범위가 아니다.
