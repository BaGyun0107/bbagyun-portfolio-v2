# Tasks: 행사 호텔 예약·결제 통합 플랫폼 구조화 상세

**Input**: Design documents from `specs/015-integrated-reservation-structured-detail/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: 이 기능은 specification과 헌법에서 테스트 우선 개발(TDD)을 요구한다. 각 사용자 스토리의 계약 테스트를 먼저 작성하고 예상한 이유로 실패하는지 확인한 뒤 구현한다.

**Organization**: 작업은 사용자 스토리별로 묶고, 실제 책임·완료 범위, 작업물 시각 자료, 세 인사이트와 alias, 공개 경로·접근성 회귀를 독립적으로 검증할 수 있게 한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 미완료 선행 작업과 파일 충돌 없이 병렬 수행 가능
- **[Story]**: specification의 사용자 스토리 매핑
- 구현 단계는 commit·stage·push를 수행하지 않는다

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 공유 worktree, 기존 공개 경로와 근거 기준선을 보존하고 Feature 015 검증 기록을 준비한다.

- [X] T001 현재 branch·dirty worktree·Feature 013의 T045/T047/T048·Feature 015 변경 허용 범위를 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다
- [X] T002 1104 listener를 건드리지 않고 작업물 1개와 기존 인사이트 4개 route의 응답·제목·legacy/visual/redirect 기준선을 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다
- [X] T003 승인 인터뷰, 원본 `dev` 코드 근거 위치와 `contracts/public-content-contract.md`를 대조해 코드 확인값·사용자 보고값·미완성·금지 주장 체크리스트를 `specs/015-integrated-reservation-structured-detail/verification.md`에 만든다

---

## Phase 2: Foundational (TDD RED Gates)

**Purpose**: 모든 사용자 스토리가 의존하는 상태·구조화 detail·시각 모델·canonical/alias·확대 계약을 구현 전에 실패 테스트로 고정한다.

**⚠️ CRITICAL**: T004~T011이 예상한 이유로 RED임을 확인하기 전에는 콘텐츠·artifact·renderer 구현을 시작하지 않는다.

- [X] T004 [P] `On Hold` 상태·승인된 카드 메타·legacy 본문 제거·금지 주장 0건의 RED 테스트를 `apps/front/src/data/portfolio/content-quality.test.ts`에 추가한다
- [X] T005 [P] 구조화 detail 등록·근거 카드 4개·swimlane 1개·relationship diagram 1개·typed artifact target의 RED 테스트를 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 추가한다
- [X] T006 [P] 공통 읽기 순서·`ProjectStatusBadge`의 보이는 상태·관계도 섹션·작업물 관련 인사이트 3개의 RED 렌더링 테스트를 `apps/front/src/components/projects/project-detail-rendering.test.tsx`에 추가한다
- [X] T007 [P] UAT fallback의 5개 lane·정상 경로·예외 2개·참조 무결성과 충돌 없는 geometry RED 테스트를 `apps/front/src/components/projects/project-swimlane-layout.test.ts`에 추가한다
- [X] T008 [P] workflow·architecture URL allowlist, 공통 preview ratio·prepared/fallback/theme 계약의 RED 테스트를 `apps/front/src/components/projects/archify-swimlane-embed.test.tsx`에 추가한다
- [X] T009 [P] 인사이트 4→3 exact 집합·project-case source·alias 무결성·두 provided/한 not-needed visual의 RED 테스트를 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`에 추가한다
- [X] T010 [P] 두 before/after visual의 텍스트 대안과 keyboard Dialog open/close/focus 복귀 계약 RED 테스트를 `apps/front/src/components/insights/insight-visual-rendering.test.tsx`에 추가한다
- [X] T011 T004~T010의 관련 Vitest를 실행해 대상 상태·detail·artifact·alias·시각 확대 부재로 실패하고 기존 baseline과 다른 실패가 없는지 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다

**Checkpoint**: 승인 사실, 데이터·route와 시각 접근성 계약이 구현 전 RED로 고정된다.

---

## Phase 3: User Story 1 - 실제 역할과 완료 범위를 이해한다 (Priority: P1) 🎯 MVP

**Goal**: 1인 백엔드·PM/PL 책임, 고객사 UAT와 PG 테스트, 보류·미완성 범위를 공통 구조화 상세와 보이는 상태로 제공한다.

**Independent Test**: 작업물 카드와 상세의 제목·기간·팀·상태·역할·근거 카드·구현·결과·회고를 승인 인터뷰와 공개 콘텐츠 계약에 대조하고 legacy `content`가 제거됐는지 확인한다.

### Tests for User Story 1

- [X] T012 [US1] T004~T006이 역할 과장·운영 확대·근거 종류 혼동·결제 미완성 은폐·민감 정보에 각각 실패하도록 assertion 메시지와 fixture를 `apps/front/src/data/portfolio/content-quality.test.ts`, `apps/front/src/data/portfolio/feature-detail-quality.test.ts`, `apps/front/src/components/projects/project-detail-rendering.test.tsx`에서 확정한다

### Implementation for User Story 1

- [X] T013 [P] [US1] `On Hold`를 상태 타입에 추가하고 기존 상태를 보존하도록 `apps/front/src/data/portfolio/types/feature.dto.ts`를 수정한다
- [X] T014 [P] [US1] `ProjectStatusBadge`를 `apps/front/src/components/projects/ProjectStatusBadge.tsx`에 추가하고 작업물 상단 공통 메타에서 기존 프로젝트 상태도 같은 계약으로 보이도록 `apps/front/src/app/(public)/projects/[slug]/page.tsx`에 연결한다
- [X] T015 [US1] 승인된 역할·근거 카드 4개·문제·제약·선택·Core Product·재고·PG·BFF 구현·UAT 결과·미완성·회고를 `apps/front/src/data/portfolio/feature-details/integrated-reservation-platform.ts`에 `FeatureDetailDto`로 구현한다
- [X] T016 [US1] 작업물 title·description·overview·status를 승인 범위로 정정하고 legacy `content`를 `apps/front/src/data/portfolio/features.ts`에서 제거한다
- [X] T017 [US1] 새 detail 모듈을 import하고 `integrated-reservation-platform` slug에 등록해 validator를 통과시키도록 `apps/front/src/data/portfolio/feature-details/index.ts`를 수정한다
- [X] T018 [US1] T004~T006의 US1 assertion을 실행해 메타·역할·근거·사실/미완성·금지 주장·legacy 제거 계약을 GREEN으로 만들고 결과를 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다

**Checkpoint**: 시각 artifact 없이도 작업물의 실제 책임·검증·보류 범위를 독립적으로 읽고 검증할 수 있다.

---

## Phase 4: User Story 2 - UAT 흐름과 Core Product 관계를 이해한다 (Priority: P1)

**Goal**: UAT의 정상·예외 흐름과 Core Product 데이터 관계를 질문이 다른 두 Archify 자료, fallback과 텍스트 대안으로 제공한다.

**Independent Test**: workflow/architecture source·generated HTML·typed fallback의 stable ID와 의미를 대조하고 작은 보기·크게보기에서 정상 경로·예외 2개 및 엔터티·관계 6개를 식별한다.

### Tests for User Story 2

- [X] T019 [US2] T005~T008 테스트에 `uat-booking-payment-flow`와 `core-product-relationships`의 정확한 ID·URL·lane/node/edge/exception 및 entity/relation 기대값을 고정한다
- [X] T020 [US2] 관계 다이어그램의 중복 ID·dangling 참조·빈 텍스트·미승인 artifact URL을 거부하는 validator RED 사례를 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 추가한다

### Implementation for User Story 2

- [X] T021 [US2] `FeatureRelationshipDiagram`·entity·relationship·typed architecture target과 validator를 `apps/front/src/data/portfolio/types/feature-detail.dto.ts`에 추가하되 기존 swimlane target 9개를 보존한다
- [X] T022 [US2] Archify iframe lifecycle·theme·timeout·ratio의 공통 코어를 `apps/front/src/components/projects/ArchifyEmbed.tsx`로 추출하고 `apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx`의 공개 동작과 test import를 보존한다
- [X] T023 [US2] architecture preview/dialog·entity/relation fallback transcript·동등한 텍스트 대안을 `apps/front/src/components/projects/ProjectRelationshipDiagram.tsx`에 구현한다
- [X] T024 [US2] `relationshipDiagrams`를 시스템 흐름 뒤 `핵심 데이터 관계` 섹션에 조건부 렌더링하고 빈 배열에는 빈 영역을 만들지 않도록 `apps/front/src/components/projects/ProjectDetailContent.tsx`를 수정한다
- [X] T025 [US2] UAT fallback의 5개 lane·정상 경로·재고 충돌·PG 승인 실패와 관계도 6개 entity·6개 relation을 `apps/front/src/data/portfolio/feature-details/integrated-reservation-platform.ts`에 구현한다
- [X] T026 [US2] Archify workflow v2 schema·common schema·예제 한 건을 읽은 직후 다음 파일 작업으로 `apps/front/diagrams/integrated-reservation-platform/uat-booking-payment-flow.json` candidate를 작성한다
- [X] T027 [US2] 첫 candidate 작성 뒤 Archify update checker를 한 번 실행하고 workflow showcase validate 진단을 최소 수정으로 해소한 결과를 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다
- [X] T028 [US2] 검증된 workflow source를 Archify로 deliver해 `apps/front/public/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html`을 생성하고 이후 직접 편집하지 않는다
- [X] T029 [US2] Archify architecture schema·common schema·예제 한 건을 읽은 직후 다음 파일 작업으로 `apps/front/diagrams/integrated-reservation-platform/core-product-relationships.json` candidate를 작성한다
- [X] T030 [US2] architecture showcase validate 진단을 최소 수정으로 해소한 뒤 deliver해 `apps/front/public/diagrams/integrated-reservation-platform/core-product-relationships.html`을 생성하고 결과를 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다
- [X] T031 [US2] 두 artifact의 생성 viewBox ratio를 typed target에 연결하고 source·HTML·fallback stable ID/방향/의미 parity, SHA-256·byte count를 `apps/front/src/data/portfolio/types/feature-detail.dto.ts`, `apps/front/src/components/projects/ArchifyEmbed.tsx`, `specs/015-integrated-reservation-structured-detail/verification.md`에 반영한다
- [X] T032 [US2] T005~T008·T019~T020을 실행하고 두 artifact의 Archify visual-check 및 standalone 1440×900·1600×1000·1920×1080 이미지 검토를 수행한다. Core Product는 GREEN으로 만들고, 5개 lane workflow의 standalone 세로 overflow는 사용자 승인 known limitation으로 기록하며 실제 사용자 노출 preview/dialog containment는 T043~T052 production E2E를 acceptance gate로 삼는다

**Checkpoint**: 작업물의 순차 흐름과 데이터 관계가 서로 다른 시각 질문으로 제공되고 미완성 결제 경계가 숨겨지지 않는다.

---

## Phase 5: User Story 3 - 세 인사이트에서 당시 경험과 현재 판단을 구분한다 (Priority: P1)

**Goal**: 기존 네 경로를 보존하면서 Middleware·Guard, BFF·Cloudflare, HTTPS 세 canonical 글로 정리하고 두 비교 visual과 한 not-needed 판정을 제공한다.

**Independent Test**: 세 canonical 글의 source·본문·시각 필요성·작업물 복귀 링크와 legacy BFF alias redirect를 대조해 사실 불일치·목록 중복·장문·시각 중복이 없는지 확인한다.

### Tests for User Story 3

- [X] T033 [P] [US3] 세 canonical slug의 승인 제목/메시지·project-case source·visualAssessment·금지 주장·콘텐츠 hash fixture를 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`에 먼저 추가한다
- [X] T034 [P] [US3] alias가 canonical만 가리키고 자기·alias·없는 slug를 거부하며 canonical 17·migrated 16·project-case 15·legacy 1 집합을 검사하는 RED 테스트를 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`에 추가한다
- [X] T035 [P] [US3] Middleware·BFF before/after의 actor/connection·질문·대체 설명과 HTTPS visual 0개를 검사하는 RED 테스트를 `apps/front/src/components/insights/insight-visual-rendering.test.tsx`와 `apps/front/src/data/portfolio/content-quality.test.ts`에 추가한다

### Implementation for User Story 3

- [X] T036 [US3] 세 canonical 글을 승인 사실·현재 회고·비중복 범위로 다시 쓰고 Middleware·BFF before/after와 HTTPS not-needed metadata를 `apps/front/src/data/portfolio/insights.ts`에 구현하며 중복 BFF SeedInsight는 제거한다
- [X] T037 [US3] canonical/alias mapping과 exact editorial fixture·count validator를 `apps/front/src/data/portfolio/insights.ts`, `apps/front/src/data/portfolio/index.ts`, `apps/front/src/data/portfolio/insight-editorial.ts`에 구현한다
- [X] T038 [US3] 정적 params에 alias를 포함하고 `enterprise-bff-architecture-and-cors`를 canonical BFF 내부 경로로 permanent redirect하도록 `apps/front/src/app/(public)/insights/[slug]/page.tsx`를 수정한다
- [X] T039 [US3] 기존 before/after 렌더러를 유지하면서 visible `크게 보기`, keyboard Dialog·Escape·focus 복귀와 동등한 내용을 `apps/front/src/components/insights/InsightVisual.tsx`에 구현한다
- [X] T040 [US3] 작업물 관련 인사이트가 canonical 세 글만 한 번씩 표시되고 각 글의 연관 기록이 작업물로 돌아오도록 `apps/front/src/data/portfolio/feature-details/integrated-reservation-platform.ts`, `apps/front/src/data/portfolio/insights.ts`를 최종 대조한다
- [X] T041 [US3] 통합 예약 글들이 legacy로 고정된 exact inventory와 기존 NestJS no-visual 기대값을 새 승인 계약으로 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`, `apps/front/e2e/portfolio-insight-contract.spec.ts`, `apps/front/e2e/hipass-structured-detail.spec.ts`에서 교체한다
- [X] T042 [US3] T009~T010·T033~T035를 실행해 4→3+alias·사실·visual 필요성·양방향 연결·비중복 계약을 GREEN으로 만들고 결과를 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다

**Checkpoint**: 기존 네 주소는 유지되지만 독자가 읽는 기본 글은 세 건이며 각 글은 작업물과 다른 질문을 답한다.

---

## Phase 6: User Story 4 - 기존 경로와 주변 콘텐츠를 회귀 없이 사용한다 (Priority: P2)

**Goal**: 작업물·canonical·alias 경로, 목록, 상태, 양방향 keyboard 이동과 네 시각 자료가 지원 viewport 및 기존 공통 계약에서 동작한다.

**Independent Test**: 별도 production port에서 다섯 기존 경로와 목록, 네 visual의 preview/dialog, 기존 구조화 작업물의 공통 viewer를 Playwright로 검증한다.

### Tests for User Story 4

- [X] T043 [P] [US4] 목록→작업물→canonical 세 글→작업물 keyboard 경로, 보이는 `On Hold`, alias 최종 URL과 목록 중복 0건의 E2E를 `apps/front/e2e/integrated-reservation-structured-detail.spec.ts`에 먼저 작성한다
- [X] T044 [US4] 320·768·1024·1440px에서 workflow·relationship·두 insight visual의 preview/dialog, document overflow·text clipping·요소 overlap·Escape·focus 복귀 E2E를 `apps/front/e2e/integrated-reservation-structured-detail.spec.ts`에 먼저 작성한다
- [X] T045 [P] [US4] 통합 예약 작업물을 legacy·Archify 비대상으로 고정한 회귀를 구조화 detail·신규 target 계약으로 `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`와 `apps/front/e2e/swimlane-viewer.spec.ts`에서 교체한다
- [X] T046 [P] [US4] 공통 insight 연결 회귀에 canonical 세 글과 alias redirect·제목·양방향 링크 기대값을 `apps/front/e2e/portfolio-insight-contract.spec.ts`에 추가한다

### Implementation and verification for User Story 4

- [X] T047 [US4] T043~T046 locator·accessible name·viewport 기대값과 공통 DOM 계약을 맞추되 실제 차이가 있을 때만 `apps/front/src/components/projects/ArchifyEmbed.tsx`, `apps/front/src/components/projects/ProjectRelationshipDiagram.tsx`, `apps/front/src/components/insights/InsightVisual.tsx`를 최소 수정한다
- [X] T048 [US4] 관련 Vitest·전체 Vitest와 `pnpm --dir apps/front exec tsc --noEmit`을 실행해 결과를 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다
- [X] T049 [US4] `git diff --name-only`로 확인한 실제 변경 TS/TSX·E2E만 scoped ESLint로 검사하고 `pnpm --dir apps/front run build` 결과와 전역 lint baseline을 `specs/015-integrated-reservation-structured-detail/verification.md`에 분리 기록한다
- [X] T050 [US4] `apply_patch`로 `apps/front/playwright.feature-015.prod.config.ts`를 임시 생성하고 비어 있는 12117 포트에서 production server를 시작하되 1104 listener와 `.next/dev` lock을 보존한다
- [X] T051 [US4] T043~T046 E2E를 production server에서 실행하고 320px·1440px 작업물/두 provided insight/크게보기 screenshot을 `view_image`로 검토해 자동 측정과 시각 판정을 `specs/015-integrated-reservation-structured-detail/verification.md`에 구분 기록한다
- [X] T052 [US4] 임시 `apps/front/playwright.feature-015.prod.config.ts`를 `apply_patch`로 삭제하고 직접 시작한 production process만 종료한 뒤 12117 해제와 1104 listener 보존을 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다

**Checkpoint**: 기존 주소·목록·연결·상태·공통 viewer와 네 viewport가 실제 production 화면에서 검증된다.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 사실·근거·비중복·품질 게이트와 기능 상태를 최종 수렴한다.

- [X] T053 승인 인터뷰와 세 계약을 최종 대조해 근거 카드 100%, 금지 주장·실제 민감 정보·장문/시각 미해결 중복 0건 판정을 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다
- [X] T054 Feature 015 범위 밖 파일, 기존 9개 Archify target, 다른 작업물·인사이트와 Feature 013의 T045/T047/T048가 보존됐는지 `git diff --check` 및 worktree 검토 결과를 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다
- [X] T055 `mise run e2e:changed`를 실행하고 공유 worktree 정책으로 stamp가 거부되면 stage 우회 없이 사유와 대체 production E2E 증거를 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다
- [X] T056 `speckit-converge`를 실행해 spec·plan·tasks·구현·검증의 차이를 해소하고 `Converged` 판정을 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다
- [X] T057 `mise run feature:status:sync`를 실행하고 결정적 전이가 있으면 `--apply`한 뒤 `ROADMAP.md`와 `specs/015-integrated-reservation-structured-detail/verification.md`에 결과를 반영한다
- [X] T058 모든 tasks·검증·review·converge가 통과한 뒤 `.harness/state/current-size`를 `Small`로 되돌리고 최종 상태를 `specs/015-integrated-reservation-structured-detail/verification.md`에 기록한다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 뒤 실행하며 모든 구현을 차단하는 RED gate
- **US1 (Phase 3)**: Foundational RED 뒤 시작하는 구조화 본문 MVP
- **US2 (Phase 4)**: US1 detail 모듈과 새 시각 타입·공통 embed를 기반으로 두 artifact를 추가
- **US3 (Phase 5)**: US1 작업물 source가 있어야 양방향 연결을 확정할 수 있지만 RED fixture는 US2와 독립 작성 가능
- **US4 (Phase 6)**: US1~US3 통합 뒤 실제 route와 browser 회귀를 검증
- **Polish (Phase 7)**: 모든 사용자 스토리 완료 뒤 실행

### User Story Dependencies

- **US1 (P1)**: Foundational 뒤 독립 완료 가능하며 MVP다.
- **US2 (P1)**: T015·T017의 detail 모듈과 registry에 의존한다.
- **US3 (P1)**: 작업물 관련 링크 확정은 US1에 의존하지만 insight editorial·visual RED는 US2와 병렬 준비 가능하다.
- **US4 (P2)**: 작업물, 두 Archify artifact, 세 canonical insight와 alias가 준비된 뒤 실행한다.

### Within Each User Story

- 테스트와 assertion을 먼저 작성하고 예상한 이유로 RED인지 확인한다.
- 타입·validator를 먼저 구현한 뒤 데이터·renderer·route를 연결한다.
- Archify source는 candidate 작성→validate→deliver 순서이며 deliver 성공 뒤 source/HTML을 수정하지 않는다.
- 관련 GREEN 뒤 전체 test·type·scoped lint·build·fresh production E2E 순으로 넓힌다.
- 구현 단계에서는 commit·stage·push하지 않는다.

### Parallel Opportunities

- T004~T010은 서로 다른 test file을 중심으로 작성하므로 같은 파일 충돌을 피한 범위에서 병렬 가능하다.
- T013과 T014는 서로 다른 타입·component/route 파일이므로 병렬 가능하다.
- T026~T028 workflow와 T029~T030 architecture는 Archify update checker 1회와 공통 target 연결 순서를 지키면 파일 단위로 분리 가능하다.
- T033~T035는 서로 다른 editorial·renderer/content test 경계를 나눌 수 있다.
- T043~T044는 같은 신규 E2E 파일에서 순차 처리하고 T045와 T046은 서로 다른 기존 E2E 파일에서 병렬 가능하다.
- verification.md를 함께 쓰는 작업은 병렬 실행하지 않는다.

---

## Parallel Example: Foundational RED

```text
Stream A: T004 content/status contract
Stream B: T005 feature detail/relationship contract
Stream C: T006 project rendering contract
Stream D: T007 swimlane fallback geometry contract
Stream E: T008 Archify embed/target contract
Stream F: T009 insight editorial/alias contract
Stream G: T010 insight visual dialog contract
```

## Parallel Example: Visual and Insight Work

```text
Stream A: T026~T028 UAT workflow source and artifact
Stream B: T029~T030 Core Product architecture source and artifact
Stream C: T033~T035 insight RED contracts
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Setup과 Foundational RED를 완료한다.
2. `On Hold` 상태와 승인된 구조화 detail을 구현하고 legacy content를 제거한다.
3. US1 관련 테스트를 GREEN으로 만든다.
4. 역할·UAT·PG 테스트·미완성·비운영 경계만 독립 검토한다.

### Incremental Delivery

1. US1: 사실 기반 구조화 본문과 상태
2. US2: UAT workflow와 Core Product 관계도
3. US3: 인사이트 4→3+alias, 비교 visual과 확대
4. US4: 공개 route·keyboard·responsive·viewer 회귀
5. Polish: 전체 검증과 Converged·상태 동기화

### Subagent-ready Workstreams

- **Content/TDD**: T004~T018, T033~T042. 인터뷰·계약과 정적 TypeScript 데이터만 읽는다.
- **Archify workflow**: T019, T025~T028. UAT 계약과 workflow schema/example만 읽는다.
- **Archify architecture**: T020~T024, T029~T032. 관계 계약과 architecture schema/example만 읽는다.
- **Browser QA**: T043~T052. 통합된 artifact와 public route만 검증하며 1104를 변경하지 않는다.
- **Main orchestrator**: 공통 파일 충돌 조정, GREEN 통합, 시각 검토, review·converge와 status sync를 소유한다.

서브에이전트 사용은 구현 승인 시점의 사용자 허가 또는 실행 스킬의 명시적 요구가 있을 때만 수행한다.

---

## Notes

- 모든 작업은 승인 인터뷰와 세 계약을 사실 기준으로 사용한다.
- [P] 작업도 같은 파일을 수정하면 동시에 실행하지 않는다.
- 실제 `dev`에 없는 충돌 테스트·과거 암호화 커밋을 코드 확인값으로 만들지 않는다.
- 전역 lint baseline, 1104 dev server, 관련 없는 사용자 변경과 Feature 013 잔여 작업을 건드리지 않는다.
- 완료 선언 전 fresh type·test·lint·build·browser·review 증거와 `speckit-converge`의 `Converged` 판정이 필요하다.
