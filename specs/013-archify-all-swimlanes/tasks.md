# Tasks: 전체 스윔레인 Archify 임베드 전환

**Input**: Design documents from `specs/013-archify-all-swimlanes/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: TDD 테스트와 artifact 구조·parity·브라우저 검증을 명시적으로 요청한 feature다. 각 테스트 task는 구현 task보다 먼저 RED 상태를 확인한다.

**Organization**: 작업은 사용자 스토리별로 묶고, 각 story가 독립적으로 검증 가능한 증가 단위를 이룬다.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 8개 artifact와 공통 검증에 필요한 파일 경계를 만든다.

- [x] T001 Create project-scoped Archify source and public artifact directories under `apps/front/diagrams/` and `apps/front/public/diagrams/` for the seven non-frozen swimlanes
- [x] T002 [P] Add the eight-target artifact inventory and stable ID map to `specs/013-archify-all-swimlanes/data-model.md`
- [x] T003 [P] Record the Feature 012 frozen hotel artifact hashes and immutable-file checks in `specs/013-archify-all-swimlanes/verification.md`
- [x] T004 [P] Run Archify doctor and capture the installed CLI capability in `specs/013-archify-all-swimlanes/research.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 공통 URL·parity·embed 계약을 완성해 모든 대상 story가 같은 경계를 사용하게 한다.

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 사용자 스토리 artifact와 UI 구현을 시작하지 않는다.

- [x] T005 [P] Add failing URL and target-scope validation cases first (TDD RED) in `apps/front/src/data/portfolio/feature-detail-quality.test.ts`
- [x] T006 [P] Add failing eight-target render and metadata cases first (TDD RED) in `apps/front/src/components/projects/project-detail-rendering.test.tsx`
- [x] T007 [P] Add failing shared lifecycle, timeout, same-origin, and malformed-DOM cases first (TDD RED) in `apps/front/src/components/projects/archify-swimlane-embed.test.tsx`
- [x] T008 Extend the type-safe embed metadata and target validation boundary in `apps/front/src/data/portfolio/types/feature-detail.dto.ts` and `apps/front/src/data/portfolio/feature-details/index.ts`
- [x] T009 Implement source/artifact ID-direction-kind parity helpers and frozen-hotel guards in `apps/front/src/data/portfolio/feature-detail-quality.test.ts`
- [x] T010 Implement the common Archify preparation, theme bridge, and per-instance fallback lifecycle in `apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx`
- [x] T011 Update the shared card/Dialog visual contract, legend, transcript, and fallback wiring in `apps/front/src/components/projects/ProjectSwimlane.tsx`

**Checkpoint**: 공통 metadata·adapter·card 경계와 RED 테스트가 준비되어 사용자 스토리 작업을 시작할 수 있다.

---

## Phase 3: User Story 1 - 모든 카드에서 같은 Archify 미리보기 제공 (Priority: P1) 🎯 MVP

**Goal**: 8개 기존 스윔레인 카드가 각각의 실제 Archify artifact를 작은 MAP 보기로 표시하고, topology·단계명·공통 레이아웃을 보존한다.

**Independent Test**: 8개 카드의 preview가 모두 검증된 artifact를 사용하고, 세부 문구·Viewer UI 없이 320/768/1024/1440px에서 가로 overflow 없이 표시되는지 확인한다.

### Tests for User Story 1 (write first)

- [x] T012 [P] [US1] Add failing preview MAP-density and no-detail-label assertions first (TDD RED) for all eight IDs in `apps/front/src/components/projects/archify-swimlane-embed.test.tsx`
- [x] T013 [P] [US1] Add failing preview topology and card overflow assertions first (TDD RED) in `apps/front/src/components/projects/project-swimlane-layout.test.ts`

### Implementation for User Story 1

- [x] T014 [P] [US1] Author and validate the `design-development-verification` workflow source at `apps/front/diagrams/codi-harness-dx-platform/design-development-verification.json`
- [x] T015 [P] [US1] Author and validate the `cicd-secrets-deployment` workflow source at `apps/front/diagrams/codi-harness-dx-platform/cicd-secrets-deployment.json`
- [x] T016 [P] [US1] Author and validate the `ingestion-and-recovery` workflow source at `apps/front/diagrams/hanmaum-science-institute/ingestion-and-recovery.json`
- [x] T017 [P] [US1] Author and validate the `search-request-flow` workflow source at `apps/front/diagrams/hanmaum-science-institute/search-request-flow.json`
- [x] T018 [P] [US1] Author and validate the `payment-and-compensation` workflow source at `apps/front/diagrams/blackstone-belleforet-resort/payment-and-compensation.json`
- [x] T019 [P] [US1] Author and validate the `order-payment-compensation` workflow source at `apps/front/diagrams/hipass-b2b-platform/order-payment-compensation.json`
- [x] T020 [P] [US1] Author and validate the `central-account-auth-flow` workflow source at `apps/front/diagrams/integrated-sso-server/central-account-auth-flow.json`
- [x] T021 [US1] Deliver the seven new validated workflow sources to matching frozen HTML files under `apps/front/public/diagrams/`
- [x] T022 [US1] Add the seven new same-origin `archify.url` values to `apps/front/src/data/portfolio/feature-details/{codi-harness-dx-platform,hanmaum-science-institute,blackstone-belleforet-resort,hipass-b2b-platform,integrated-sso-server}.ts` while preserving the existing hotel URL
- [x] T023 [US1] Make the common preview renderer consume each target artifact and pass all preview MAP assertions in `apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx` and `apps/front/src/components/projects/ProjectSwimlane.tsx`

**Checkpoint**: 8개 카드 preview가 실제 Archify artifact를 사용하고 MVP 검증을 통과한다.

---

## Phase 4: User Story 2 - Dialog에서 같은 흐름의 상세 읽기 제공 (Priority: P1)

**Goal**: preview와 같은 artifact를 Dialog READ 밀도로 열고, 단계 설명·관계 문구·공통 범례와 좁은 화면 transcript를 제공한다.

**Independent Test**: 각 대상의 `크게 보기`를 mouse·touch·keyboard로 열어 READ topology, 문구, 범례, transcript, Escape와 trigger 초점 복귀를 확인한다.

### Tests for User Story 2 (write first)

- [x] T024 [P] [US2] Add failing Dialog READ-density, legend, and same-artifact assertions first (TDD RED) for all eight IDs in `apps/front/src/components/projects/archify-swimlane-embed.test.tsx`
- [x] T025 [P] [US2] Add failing transcript step/edge text, 14px minimum, Escape, and focus-return assertions first (TDD RED) in `apps/front/src/components/projects/project-detail-rendering.test.tsx`

### Implementation for User Story 2

- [x] T026 [US2] Expose the common Dialog artifact with READ detail level and preserve the existing `크게 보기` trigger contract in `apps/front/src/components/projects/ProjectSwimlane.tsx`
- [x] T027 [US2] Render step and labeled-edge transcript content for all eight target swimlanes in `apps/front/src/components/projects/ProjectSwimlane.tsx`
- [x] T028 [US2] Apply shared line legend semantics and emphasis-label color mapping to every Archify instance in `apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx` and `apps/front/src/components/projects/ProjectSwimlane.tsx`
- [x] T029 [US2] Verify Dialog sizing, narrow-screen text readability, and no page-level horizontal overflow in `apps/front/src/components/projects/project-swimlane-layout.ts` and `apps/front/src/components/projects/responsive-swimlane-diagram.tsx`

**Checkpoint**: 각 대상에서 preview·Dialog parity와 텍스트 읽기 경로가 독립적으로 동작한다.

---

## Phase 5: User Story 3 - Artifact 실패 시 설명과 fallback 유지 (Priority: P1)

**Goal**: 잘못된 URL, 로드 실패, DOM 불일치, timeout에서도 빈 영역 없이 해당 카드만 기존 React fallback으로 수렴한다.

**Independent Test**: 실패 조건을 각 instance에 주입해 fallback 전환, 전체 설명·예외 대응 보존, 다른 카드 독립성을 확인한다.

### Tests for User Story 3 (write first)

- [x] T030 [P] [US3] Add failing invalid URL, external URL, query/hash, missing artifact, malformed DOM, and load-error cases first (TDD RED) in `apps/front/src/components/projects/archify-swimlane-embed.test.tsx`
- [x] T031 [P] [US3] Add failing timeout, observer cleanup, and cross-instance isolation cases first (TDD RED) in `apps/front/src/components/projects/archify-swimlane-embed.test.tsx`

### Implementation for User Story 3

- [x] T032 [US3] Enforce same-origin relative URL and eight-target allowlist checks before iframe mount in `apps/front/src/data/portfolio/feature-details/index.ts`
- [x] T033 [US3] Ensure malformed DOM, load error, prepare error, and timeout reveal `ResponsiveSwimlaneDiagram` without partial Viewer UI in `apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx`
- [x] T034 [US3] Isolate IntersectionObserver, timeout, theme observer, and iframe cleanup per preview/Dialog instance in `apps/front/src/components/projects/ArchifySwimlaneEmbed.tsx`
- [x] T035 [US3] Preserve summary, exceptions, and Dialog fallback semantics for every target in `apps/front/src/components/projects/ProjectSwimlane.tsx`

**Checkpoint**: artifact 문제 하나가 전체 페이지나 다른 스윔레인을 비우지 않고, 기존 설명과 fallback이 유지된다.

---

## Phase 6: User Story 4 - 8개 전환의 사실성·근거 검증 (Priority: P1)

**Goal**: source, generated artifact, 공개 데이터와 브라우저 결과를 parity/provenance 기록으로 추적한다.

**Independent Test**: 8개 source·artifact의 stable ID·방향·kind·outcome·label을 대조하고 validation receipt와 브라우저 evidence가 모두 연결되는지 확인한다.

### Tests for User Story 4 (write first)

- [x] T036 [P] [US4] Add failing source/artifact node-edge parity and URL mapping cases first (TDD RED) in `apps/front/src/data/portfolio/feature-detail-quality.test.ts`
- [x] T037 [P] [US4] Add failing frozen Feature 012 hash and non-target regression cases first (TDD RED) in `apps/front/src/data/portfolio/feature-detail-quality.test.ts`

### Implementation for User Story 4

- [x] T038 [US4] Complete all seven new Archify source/artifact validation receipts and stable hashes in `specs/013-archify-all-swimlanes/verification.md`
- [x] T039 [US4] Record the eight-target parity manifest, public paths, and any label omission rationale in `specs/013-archify-all-swimlanes/data-model.md` and `specs/013-archify-all-swimlanes/verification.md`
- [x] T040 [US4] Record that approved project titles, summaries, exceptions, connected insights, and non-target renderers are unchanged in `specs/013-archify-all-swimlanes/verification.md`

**Checkpoint**: 각 artifact의 생성 근거와 공개 사실 보존을 재현 가능한 문서에서 확인할 수 있다.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 회귀, 실제 브라우저 evidence, 검증 문서와 feature 상태를 마무리한다.

- [x] T041 [P] Add real-browser coverage for all eight targets, four viewport widths, Dialog keyboard/focus, theme switching, legend, transcript, and Viewer interaction blocking in `apps/front/e2e/swimlane-viewer.spec.ts`
- [x] T042 [P] Capture Archify `visual-check` output and human-reviewed screenshots for each generated HTML under `apps/front/public/diagrams/`
- [x] T043 Run targeted Vitest, typecheck, changed-file ESLint, and production build from `apps/front` and record results in `specs/013-archify-all-swimlanes/verification.md`
- [x] T044 Run production-browser E2E on a separate port with temporary configuration, remove the temporary configuration after the run, and record evidence in `specs/013-archify-all-swimlanes/verification.md`
- [x] T045 Run `speckit-converge` and resolve any remaining task/spec/plan inconsistencies in `specs/013-archify-all-swimlanes/{spec.md,plan.md,tasks.md}` before marking the feature converged
- [x] T046 Run `mise run feature:status:sync` (or record the repository task absence) after specs and feature-hub changes in `specs/013-archify-all-swimlanes/verification.md`
- [x] T047 Reset `.harness/state/current-size` to `Small` only after all tasks, verification, review, and convergence gates pass

## Phase 8: Convergence

- [x] T048 Repair the six Archify source layouts that still fail standalone desktop vertical containment, redeliver the generated HTML, and rerun `visual-check` per the Archify visual contract (plan: Archify delivery/visual contract, partial)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no feature dependency; establishes artifact paths and frozen baseline.
- **Foundational (Phase 2)**: depends on Setup and blocks all user stories.
- **User Stories (Phases 3–6)**: depend on Foundational. US1 provides the shared preview baseline; US2/US3/US4 can proceed after the common boundary exists, but each keeps its own RED→GREEN tests.
- **Polish (Phase 7)**: depends on all four stories and includes convergence/verification gates.

### User Story Dependencies

- **US1 (P1)**: starts after Phase 2; MVP baseline for all artifact URLs and preview rendering.
- **US2 (P1)**: starts after Phase 2; shares the adapter/card contract and may reuse US1 fixtures, but Dialog behavior is independently testable.
- **US3 (P1)**: starts after Phase 2; validates failure paths independently of successful artifacts.
- **US4 (P1)**: starts after Phase 2; validates source/artifact/public-data parity and can run alongside UI work.

### Parallel Opportunities

- T002–T004 and T005–T007 are parallel when their files are not being edited by another task.
- T014–T020 are independent artifact authoring streams; each source must be validated before T021 delivery.
- T012/T013, T024/T025, T030/T031 and T036/T037 are parallel RED test tasks.
- T041/T042 can run in parallel after generated artifacts are frozen.

## Parallel Example: User Story 1

```text
Task T014: author/validate codi-harness design-development source
Task T015: author/validate codi-harness CI/CD source
Task T016: author/validate hanmaum ingestion source
Task T017: author/validate hanmaum search source
Task T018: author/validate blackstone payment source
Task T019: author/validate hipass order/payment source
Task T020: author/validate integrated SSO source
```

## Implementation Strategy

### MVP First

1. Phase 1–2로 공통 계약·검증 경계를 준비한다.
2. Phase 3의 TDD와 7개 신규 artifact를 완료하고 호텔 frozen artifact와 함께 8개 preview를 검증한다.
3. US1 checkpoint에서 실제 브라우저로 작은 보기와 범위를 확인한 뒤 US2–US4를 확장한다.

### Incremental Delivery

1. 공통 adapter와 fallback을 먼저 안정화한다.
2. 프로젝트별 artifact를 하나씩 validate/deliver하되 카드 metadata는 parity가 통과한 뒤 추가한다.
3. Dialog/transcript, 실패 경계, provenance를 story별로 검증한다.
4. 전체 8개 브라우저 회귀와 converge를 통과한 뒤에만 feature 완료로 판단한다.

## Notes

- 모든 task는 checkbox, sequential ID, 필요한 `[P]`/`[US#]` label과 정확한 파일 경로를 포함한다.
- Archify deliver 이후 generated HTML은 동결하며 수동 편집하지 않는다.
- 구현 task는 commit·push·PR을 수행하지 않는다.
- 1104 dev server와 관련 없는 baseline lint 오류는 변경 파일 검사 결과에 포함하지 않는다.
