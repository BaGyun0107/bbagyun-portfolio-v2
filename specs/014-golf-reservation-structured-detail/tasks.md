# Tasks: 골프 예약 시스템 구조화 상세

**Input**: Design documents from `specs/014-golf-reservation-structured-detail/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: 이 기능은 specification과 헌법에서 TDD를 요구한다. 각 사용자 스토리의 테스트를 먼저 작성해 예상한 이유로 실패하는지 확인한 뒤 구현한다.

**Organization**: 작업은 사용자 스토리별로 묶고, 승인된 콘텐츠·스윔레인·연결 관계·공개 회귀를 독립적으로 검증할 수 있게 한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 미완료 선행 작업과 파일 충돌 없이 병렬 수행 가능
- **[Story]**: specification의 사용자 스토리 매핑
- 구현 단계는 commit·stage·push를 수행하지 않는다

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 기존 상태와 공개 기준선을 보존하고 Feature 014 검증 기록을 준비한다.

- [x] T001 현재 branch·dirty worktree·Feature 013 미완료 항목과 Feature 014 범위를 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다
- [x] T002 1104 listener를 건드리지 않고 작업물·인사이트 두 route의 기준선 응답과 현재 표시 상태를 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다
- [x] T003 승인 인터뷰와 `specs/014-golf-reservation-structured-detail/contracts/public-content-contract.md`를 대조해 공개·금지 문구 체크리스트를 `specs/014-golf-reservation-structured-detail/verification.md`에 만든다

---

## Phase 2: Foundational (TDD RED Gates)

**Purpose**: 모든 사용자 스토리가 의존하는 구조화 상세, 사실 경계와 Archify target 계약을 구현 전에 실패 테스트로 고정한다.

**⚠️ CRITICAL**: T004~T009가 예상한 이유로 RED임을 확인하기 전에는 콘텐츠·artifact 구현을 시작하지 않는다.

- [x] T004 [P] 골프 카드 기간·첫 프로젝트 역할·최초 구축과 유지보수 구분·금지 주장 0건의 RED 테스트를 `apps/front/src/data/portfolio/content-quality.test.ts`에 추가한다
- [x] T005 [P] 구조화 상세 등록·근거 카드 3개·스윔레인 정확히 1개·예외 3종·typed Archify target의 RED 테스트를 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 추가한다
- [x] T006 [P] 공통 읽기 순서·동등한 텍스트 설명·관련 인사이트 링크·Archify preview 렌더링의 RED 테스트를 `apps/front/src/components/projects/project-detail-rendering.test.tsx`에 추가한다
- [x] T007 [P] 네 레인과 정상·예외 edge의 참조 무결성·충돌 없는 fallback geometry 계약의 RED 테스트를 `apps/front/src/components/projects/project-swimlane-layout.test.ts`에 추가한다
- [x] T008 [P] 골프 artifact URL의 allowlist·preview ratio·prepared/fallback 동작의 RED 테스트를 `apps/front/src/components/projects/archify-swimlane-embed.test.tsx`에 추가한다
- [x] T009 T004~T008의 관련 Vitest를 실행해 골프 구조화 상세와 Archify target 부재로 실패하고 기존 테스트 baseline과 다른 실패가 없는지 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다

**Checkpoint**: 승인 사실과 공통 시각 계약이 구현 전 RED로 고정된다.

---

## Phase 3: User Story 1 - 첫 프로젝트의 실제 책임과 성장을 읽는다 (Priority: P1) 🎯 MVP

**Goal**: 첫 프로젝트의 정해진 구조 안 구현 책임, 운영 로그 경계 개선, 기간·근거·결과 한계를 공통 구조화 상세로 제공한다.

**Independent Test**: 작업물 상세의 역할, 기간, 근거 카드, 문제, 제약, 선택, 구현, 결과, 회고를 승인 인터뷰·공개 콘텐츠 계약과 대조하고 legacy content가 제거됐는지 확인한다.

### Tests for User Story 1

- [x] T010 [US1] T004~T006 테스트가 역할 과장·날짜 창작·관찰 범위 확대·금지 주장에 각각 실패하도록 assertion 메시지와 fixture를 `apps/front/src/data/portfolio/content-quality.test.ts`, `apps/front/src/data/portfolio/feature-detail-quality.test.ts`, `apps/front/src/components/projects/project-detail-rendering.test.tsx`에서 확정한다

### Implementation for User Story 1

- [x] T011 [US1] 승인된 역할·근거 카드 3개·문제·제약·선택·구현·결과·회고와 인사이트 요약 링크를 `apps/front/src/data/portfolio/feature-details/the-siena-golf-reservation.ts`에 `FeatureDetailDto`로 구현한다
- [x] T012 [US1] 골프 카드의 description·overview·period를 승인 범위로 정정하고 legacy `content`를 `apps/front/src/data/portfolio/features.ts`에서 제거한다
- [x] T013 [US1] 새 상세 모듈을 import하고 `the-siena-golf-reservation` slug에 등록하며 DTO validator를 통과시키도록 `apps/front/src/data/portfolio/feature-details/index.ts`를 수정한다
- [x] T014 [US1] T004~T006의 US1 assertion을 실행해 역할·기간·근거·금지 주장·legacy 제거 계약을 GREEN으로 만들고 결과를 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다

**Checkpoint**: 시각 artifact 없이도 작업물의 승인된 구조화 본문과 근거 경계를 독립적으로 읽고 검증할 수 있다.

---

## Phase 4: User Story 2 - 예약 정상·예외 흐름을 시각적으로 이해한다 (Priority: P1)

**Goal**: 사용자·React·PHP 서버·외부 PMS 사이의 정상 예약과 중복·5xx·timeout 예외를 공통 Archify preview/dialog와 동등한 fallback 텍스트로 제공한다.

**Independent Test**: source JSON, generated HTML, `FeatureSwimlane` fallback의 레인·단계·edge·예외 parity를 대조하고 작은 보기·크게보기에서 시작·정상 종료·예외 3종을 식별한다.

### Tests for User Story 2

- [x] T015 [US2] T005~T008 테스트에 `reservation-request-and-exception-flow`의 정확한 lane/node/edge/exception ID와 URL parity 기대값을 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`, `apps/front/src/components/projects/project-swimlane-layout.test.ts`, `apps/front/src/components/projects/archify-swimlane-embed.test.tsx`에서 고정한다

### Implementation for User Story 2

- [x] T016 [US2] React fallback용 네 레인·아홉 단계·정상 경로·예외 3종·동등한 텍스트 설명을 `apps/front/src/data/portfolio/feature-details/the-siena-golf-reservation.ts`의 단일 swimlane에 구현한다
- [x] T017 [US2] 동일한 lane/node/edge 의미와 포트폴리오 선 범례를 가진 Archify workflow source를 `apps/front/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.json`에 작성한다
- [x] T018 [US2] Archify showcase validate를 실행해 composition error 0·warning 0 receipt를 `specs/014-golf-reservation-structured-detail/verification.md`에 기록하고 진단이 있으면 `apps/front/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.json`만 보정한다
- [x] T019 [US2] 검증된 source를 Archify로 delivery해 `apps/front/public/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html`을 생성하고 직접 편집하지 않는다
- [x] T020 [P] [US2] 골프 feature slug·swimlane ID·artifact URL의 정확한 조합을 `apps/front/src/data/portfolio/types/feature-detail.dto.ts`의 typed Archify target에 추가한다
- [x] T021 [P] [US2] 생성 SVG viewBox로 계산한 preview aspect ratio를 `apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx`에 추가한다
- [x] T022 [US2] source·generated HTML·React fallback의 stable ID·방향·kind·outcome·label parity와 SHA-256·byte count를 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다
- [x] T023 [US2] T005~T008의 US2 assertion과 Archify visual-check를 실행해 preview/dialog 준비·fallback·텍스트 대안 계약을 GREEN으로 만들고 receipt를 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다

**Checkpoint**: 예약 정상 경로 1개와 승인된 예외 3개가 Archify와 fallback에서 같은 의미로 제공된다.

---

## Phase 5: User Story 3 - 작업물과 로그 분리 인사이트가 다른 질문을 답한다 (Priority: P1)

**Goal**: 작업물은 예약 구현과 전체 운영 맥락을, 기존 인사이트는 로그 저장 경계 판단을 설명하고 양방향으로 연결한다.

**Independent Test**: 두 본문과 두 시각 자료를 비교해 사실 불일치·장문 중복·시각 중복이 없고 양방향 link metadata가 유지되는지 확인한다.

### Tests for User Story 3

- [x] T024 [P] [US3] 기존 로그 인사이트의 승인 제목·excerpt·본문·source slug·작업물 복귀 링크·before/after visual 보존 테스트를 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`에 추가한다
- [x] T025 [P] [US3] 작업물·인사이트 장문 비중복과 예약 스윔레인·로그 before/after 시각 비중복, 버퍼링·미검토 기술 금지 테스트를 `apps/front/src/data/portfolio/content-quality.test.ts`에 추가한다
- [x] T026 [P] [US3] 작업물→인사이트와 인사이트→작업물 link label·href 렌더링 테스트를 `apps/front/src/components/projects/project-detail-rendering.test.tsx`에 추가한다

### Implementation for User Story 3

- [x] T027 [US3] T024~T026이 발견한 승인 계약 차이가 있을 때만 `apps/front/src/data/portfolio/insights.ts`와 `apps/front/src/data/portfolio/insight-editorial.ts`를 최소 정정하고 이미 일치하면 파일을 변경하지 않는다
- [x] T028 [US3] 작업물의 로그 요약과 인사이트 link가 전체 인사이트 본문을 반복하지 않도록 `apps/front/src/data/portfolio/feature-details/the-siena-golf-reservation.ts`를 최종 대조한다
- [x] T029 [US3] T024~T026을 실행해 사실·장문·시각 비중복과 양방향 연결 계약을 GREEN으로 만들고 판정 근거를 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다

**Checkpoint**: 두 기록은 같은 사실을 모순 없이 공유하면서 서로 다른 질문과 시각 자료를 제공한다.

---

## Phase 6: User Story 4 - 기존 경로와 주변 작업물을 회귀 없이 유지한다 (Priority: P2)

**Goal**: 두 기존 공개 경로, 목록 진입, 키보드 탐색, 공통 Archify viewer와 지원 viewport가 회귀 없이 동작한다.

**Independent Test**: 별도 production port에서 두 route와 주변 구조화 작업물을 Playwright로 열어 keyboard·responsive·overflow·preview/dialog·fallback 계약을 검증한다.

### Tests for User Story 4

- [X] T030 [P] [US4] 목록→골프 작업물→로그 인사이트→작업물 keyboard 경로와 기존 slug 200 응답의 E2E를 `apps/front/e2e/golf-reservation-structured-detail.spec.ts`에 먼저 작성한다
- [X] T031 [US4] 320·768·1024·1440px document overflow, preview/dialog 전체 흐름, 핵심 node·label 겹침, Escape·focus 복귀의 E2E를 `apps/front/e2e/golf-reservation-structured-detail.spec.ts`에 먼저 작성한다
- [X] T032 [P] [US4] 기존 insight 연결 회귀에 골프 양방향 link와 승인 제목 assertion을 `apps/front/e2e/portfolio-insight-contract.spec.ts`에 보강한다
- [X] T033 [P] [US4] 공통 선 범례·theme·fallback 회귀 대상에 골프 artifact를 `apps/front/e2e/swimlane-viewer.spec.ts`에 추가한다

### Implementation and verification for User Story 4

- [X] T034 [US4] T030~T033의 locator·accessible name·viewport 기대값과 현재 공통 DOM 계약을 맞추되 기능 차이가 있을 때만 `apps/front/src/components/projects/ProjectSwimlane.tsx`와 `apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx`를 최소 수정한다
- [X] T035 [US4] 관련 Vitest와 전체 Vitest, `pnpm --dir apps/front exec tsc --noEmit`을 실행해 결과를 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다
- [X] T036 [US4] `git diff --name-only`로 확인한 실제 변경 TS/TSX와 E2E 파일만 scoped ESLint로 검사하고 전역 baseline은 `specs/014-golf-reservation-structured-detail/verification.md`에 분리한다
- [X] T037 [US4] `pnpm --dir apps/front run build`를 실행하고 결과를 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다
- [X] T038 [US4] `apply_patch`로 `apps/front/playwright.feature-014.prod.config.ts`를 임시 생성하고 비어 있는 12116 포트에서 production server를 시작하되 1104 listener와 `.next/dev` lock을 보존한다
- [X] T039 [US4] 두 공개 route와 관련 insight·swimlane E2E를 production server에서 실행해 keyboard·4개 viewport·overflow·겹침·preview/dialog·fallback 결과를 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다
- [X] T040 [US4] 320px·1440px 작업물/인사이트와 크게보기 screenshot을 `view_image`로 직접 검토해 자동 측정과 사람의 시각 판정을 `specs/014-golf-reservation-structured-detail/verification.md`에 구분해 기록한다
- [X] T041 [US4] 임시 `apps/front/playwright.feature-014.prod.config.ts`를 `apply_patch`로 삭제하고 직접 시작한 production process만 종료한 뒤 12116 해제와 1104 listener 보존을 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다

**Checkpoint**: 기존 경로·연결·공통 viewer와 지원 viewport가 실제 브라우저에서 검증된다.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 사실·범위·품질 게이트와 기능 상태를 최종 수렴한다.

- [X] T042 승인 인터뷰와 공개 콘텐츠 계약을 최종 대조해 근거 카드 100%, 금지 주장 0건, 장문·시각 중복 0건 판정을 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다
- [X] T043 Feature 014 범위 밖 파일과 Feature 013의 T045/T047/T048 상태가 보존됐는지 `git diff --check` 및 worktree 검토 결과를 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다
- [X] T044 `mise run e2e:changed`를 실행하고 stamp가 공유 worktree 정책으로 거부되면 우회 stage 없이 사유와 대체 production E2E 증거를 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다
- [X] T045 `speckit-converge`를 실행해 spec·plan·tasks·구현·검증의 차이를 해소하고 Converged 판정을 `specs/014-golf-reservation-structured-detail/verification.md`에 기록한다
- [X] T046 `mise run feature:status:sync`를 실행하고 결정적 전이가 있으면 `--apply`한 뒤 `ROADMAP.md`와 `specs/014-golf-reservation-structured-detail/verification.md`에 결과를 반영한다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 뒤 실행하며 모든 구현을 차단하는 RED gate
- **US1 (Phase 3)**: Foundational RED 뒤 시작하는 구조화 본문 MVP
- **US2 (Phase 4)**: Foundational RED와 US1 상세 모듈을 기반으로 시각 자료를 추가
- **US3 (Phase 5)**: US1의 작업물 본문과 링크가 있어야 비중복·양방향 연결을 확정 가능
- **US4 (Phase 6)**: US1~US3 통합 뒤 실제 route와 browser 회귀를 검증
- **Polish (Phase 7)**: 모든 사용자 스토리 완료 뒤 실행

### User Story Dependencies

- **US1 (P1)**: Foundational 뒤 독립 완료 가능하며 MVP다.
- **US2 (P1)**: 골프 상세 모듈에 swimlane을 넣으므로 T011~T013에 의존한다.
- **US3 (P1)**: 작업물의 최종 요약·링크와 기존 인사이트를 비교하므로 US1에 의존하지만 인사이트 보존 테스트 T024~T025는 병렬 작성 가능하다.
- **US4 (P2)**: 두 route와 artifact가 모두 준비된 US1~US3 뒤 실행한다.

### Within Each User Story

- 테스트와 assertion을 먼저 작성하고 예상한 이유로 RED인지 확인한다.
- 정적 detail과 source를 구현한 뒤 registry·typed target·ratio를 연결한다.
- Archify source는 validate 뒤 deliver하며 generated HTML을 직접 수정하지 않는다.
- 관련 테스트 GREEN 뒤 전체 test·type·scoped lint·build·fresh production E2E 순으로 넓힌다.
- implementation 단계에서는 commit·stage·push하지 않는다.

### Parallel Opportunities

- T002를 기록한 뒤 T003의 공개·금지 문구 체크리스트를 같은 verification 파일에 추가한다.
- T004~T008은 서로 다른 test file을 수정하므로 병렬 가능하다.
- T020과 T021은 source delivery 뒤 서로 다른 구현 파일에서 병렬 가능하다.
- T024~T026은 서로 다른 인사이트·렌더링 test file에서 병렬 가능하다.
- T030과 T031은 같은 신규 E2E 파일에서 순차 처리하고, T032와 T033은 서로 다른 기존 E2E 파일에서 병렬 가능하다.
- T042와 T043은 같은 verification 파일에 순차 기록한다.

---

## Parallel Example: Foundational RED

```text
Stream A: T004 content-quality RED contract
Stream B: T005 feature-detail-quality RED contract
Stream C: T006 project detail rendering RED contract
Stream D: T007 fallback geometry RED contract
Stream E: T008 Archify embed RED contract
```

## Parallel Example: User Story 3

```text
Stream A: T024 existing insight preservation contract
Stream B: T025 prose/visual non-duplication contract
Stream C: T026 reciprocal rendered-link contract
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Setup과 Foundational RED를 완료한다.
2. 승인된 구조화 detail을 구현하고 legacy content를 제거한다.
3. US1 관련 테스트를 GREEN으로 만든다.
4. 역할·기간·근거·금지 주장만 독립 검토한다.

### Incremental Delivery

1. US1: 사실 기반 구조화 본문
2. US2: 예약 정상·예외 Archify 시각 자료와 fallback
3. US3: 기존 로그 인사이트 보존·비중복·양방향 연결
4. US4: public route·keyboard·responsive·viewer 회귀
5. Polish: 전체 검증과 Converged·상태 동기화

### Subagent-ready Workstreams

- **Content/TDD**: T004~T016, T024~T029. 인터뷰·공개 콘텐츠 계약과 정적 TypeScript 데이터만 읽는다.
- **Archify artifact**: T017~T023. 예약 스윔레인 계약, 기존 source 예시와 Archify CLI만 읽고 generated HTML 외 공통 UI는 수정하지 않는다.
- **Browser QA**: T030~T041. 구현 완료 artifact와 public route만 검증하며 1104를 변경하지 않는다.
- **Main orchestrator**: 공통 파일 충돌 조정, GREEN 통합, 수동 이미지 검토, converge와 status sync를 소유한다.

서브에이전트 사용은 구현 승인 시점의 명시적 사용자 허가가 있어야 한다.

---

## Notes

- 모든 작업은 승인 인터뷰와 두 계약을 사실 기준으로 사용한다.
- [P] 작업도 같은 파일을 수정하면 동시에 실행하지 않는다.
- 기존 인사이트가 계약과 이미 일치하면 보존하며 수정 자체를 목표로 삼지 않는다.
- 전역 lint baseline, 1104 dev server, 관련 없는 사용자 변경과 Feature 013 잔여 작업을 건드리지 않는다.
- 완료 선언 전 fresh type·test·lint·build·browser 증거와 `speckit-converge`의 Converged 판정이 필요하다.
