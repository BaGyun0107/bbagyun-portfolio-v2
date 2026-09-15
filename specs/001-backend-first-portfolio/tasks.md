# Tasks: 백엔드 중심 포트폴리오 비교 화면

> **Status:** Retired on 2026-08-19 by user direction. The `/preview` comparison experience and its implementation were removed. Items marked below as retired are no longer actionable work.

**Input**: Design documents from `/specs/001-backend-first-portfolio/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/portfolio-preview-ui.md`, `quickstart.md`

**Tests**: TDD is requested for this feature. Browser acceptance tests are written before the corresponding UI implementation and must fail before implementation begins. The project currently has no app-level Playwright suite, so the setup phase includes the minimum E2E harness required by the quality gate.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the comparison route and user-flow verification foundation without touching the existing public route implementation.

- [x] T001 Create the comparison route and component directory skeleton under `apps/front/src/app/(preview)/preview/` and `apps/front/src/components/portfolio-preview/` without replacing existing route files.
- [x] T002 [P] Add the app-level E2E task entry in `apps/front/mise.toml` and root E2E task wiring in `mise.toml` using the project’s pnpm/Next.js conventions.
- [x] T003 [P] Scaffold the Playwright and Vitest test configuration in `apps/front/playwright.config.ts`, `apps/front/vitest.config.ts`, `apps/front/package.json`, and `apps/front/e2e/` for preview acceptance tests and data-contract tests.
- [x] T004 [P] Add the preview-route baseline acceptance test file at `apps/front/e2e/portfolio-preview.spec.ts` with failing checks for existing-route preservation and all-8-project discovery.

**Checkpoint**: E2E test entry points exist, and the new route tree is isolated from the existing public routes.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define normalized project evidence data and shared rendering/theme primitives before user-story work.

- [x] T005 [P] Write failing data-shape tests for demo, evidence, decision, and metric metadata in `apps/front/src/data/portfolio/feature-evidence.test.ts`.
- [x] T006 [P] Define `FeatureEvidenceDto`, `FeatureDemoDto`, `FeatureDecisionDto`, and `FeatureMetricDto` in `apps/front/src/data/portfolio/types/feature-evidence.dto.ts` with discriminated artifact kinds and required alternative text.
- [x] T007 Extend `FeatureDto` and the conversion/export functions in `apps/front/src/data/portfolio/types/feature.dto.ts` and `apps/front/src/data/portfolio/index.ts` with optional demo/evidence/decision/metric fields while preserving existing consumers.
- [x] T008 Create normalized evidence metadata for all 8 existing feature slugs in `apps/front/src/data/portfolio/feature-evidence.ts`; provide content-rich system/sequence/ERD/metric evidence for the external reservation/logging project and truthful fallback evidence for projects without configured artifacts.
- [x] T009 [P] Implement the preview-scoped theme state/provider in `apps/front/src/components/portfolio-preview/PreviewThemeProvider.tsx` with system-preference initialization, explicit localStorage persistence, and no mutation of the existing route shell.
- [x] T010 [P] Implement `PreviewThemeToggle.tsx` with accessible name, keyboard behavior, focus styles, and current-state announcement.
- [x] T011 [P] Implement reusable responsive artifact containers in `apps/front/src/components/portfolio-preview/DiagramFrame.tsx` and `apps/front/src/styles/portfolio-preview.css` so wide diagrams scroll only inside their own region.
- [x] T012 [P] Add the shared preview type exports and artifact rendering helpers in `apps/front/src/data/portfolio/types/index.ts` or the existing portfolio export surface without introducing relative imports.

**Checkpoint**: Normalized data, preview theme, artifact frame, and failing contract tests are ready; no user story implementation should begin before this phase passes.

## Phase 3: User Story 1 - 기존 화면과 새 포트폴리오 화면 비교 (Priority: P1) 🎯 MVP

**Goal**: Expose the new backend-first home and detail experience under separate routes while keeping all existing routes unchanged.

**Independent Test**: Run the preview E2E suite and manually compare `/` and `/preview`, `/projects/[slug]` and `/preview/projects/[slug]` for all 8 slugs.

### Tests for User Story 1 (TDD)

- [x] T013 [US1] Make the existing-route preservation and `/preview` all-8-project discovery tests in `apps/front/e2e/portfolio-preview.spec.ts` fail against the current implementation before adding preview UI.

### Implementation for User Story 1

- [x] T014 [P] [US1] Implement the isolated preview layout and header in `apps/front/src/app/(preview)/preview/layout.tsx` and `apps/front/src/components/portfolio-preview/PreviewHeader.tsx` with links that do not replace the existing public navigation.
- [x] T015 [US1] Implement the backend-first preview home in `apps/front/src/app/(preview)/preview/page.tsx` and `apps/front/src/components/portfolio-preview/PreviewHome.tsx` with featured work above recent records and all 8 project cards.
- [x] T016 [US1] Implement the preview project route in `apps/front/src/app/(preview)/preview/projects/[slug]/page.tsx` with static params for every existing feature slug and a not-found state for unknown slugs.
- [x] T017 [US1] Add project-card links, accessible labels, and route-preservation assertions in `apps/front/src/components/portfolio-preview/PreviewHome.tsx` and `apps/front/e2e/portfolio-preview.spec.ts`.

**Checkpoint**: The new home and all 8 detail URLs work, while the old home and detail URLs remain available for direct comparison.

## Phase 4: User Story 2 - 대표 작업물의 문제 해결 과정 읽기 (Priority: P1)

**Goal**: Render the authored long-form case study as a navigable, content-rich detail experience.

**Independent Test**: Open the pilot detail route, navigate each table-of-contents item, and verify overview, role, problem, decisions, implementation, result, and retrospective content.

### Tests for User Story 2 (TDD)

- [x] T018 [US2] Add failing Playwright assertions for detail-page section headings, table-of-contents anchors, and authored pilot content in `apps/front/e2e/portfolio-preview.spec.ts`.

### Implementation for User Story 2

- [x] T019 [P] [US2] Implement `ProjectTableOfContents.tsx` with stable section IDs, active-link semantics, and keyboard-accessible navigation in `apps/front/src/components/portfolio-preview/ProjectTableOfContents.tsx`.
- [x] T020 [US2] Implement the long-form detail composition in `apps/front/src/components/portfolio-preview/ProjectDetail.tsx` using the existing Markdown renderer and normalized sections without truncating the authored feature content.
- [x] T021 [US2] Add the pilot project’s full overview, role, problem, constraints, decisions, implementation detail, result, and retrospective content in `apps/front/src/data/portfolio/feature-evidence.ts` and the existing feature content source where missing.
- [x] T022 [US2] Implement related-insight links and empty states for the comparison detail page in `apps/front/src/components/portfolio-preview/ProjectDetail.tsx`.

**Checkpoint**: The pilot reads as a complete case study instead of a shortened card summary, and all other projects can use the same template.

## Phase 5: User Story 3 - 작업물의 아키텍처와 데이터 구조 확인 (Priority: P1)

**Goal**: Show architecture, sequence/swimlane, and ERD evidence as detailed visual artifacts for all applicable projects.

**Independent Test**: Verify the pilot displays system/sequence/ERD artifacts, a project without ERD displays its truthful fallback, and diagram containers remain usable on mobile.

### Tests for User Story 3 (TDD)

- [x] T023 [US3] Add failing browser assertions for artifact headings, alternative text, pilot ERD/sequence content, and diagram-only horizontal scrolling at 320px in `apps/front/e2e/portfolio-preview.spec.ts`.

### Implementation for User Story 3

- [x] T024 [P] [US3] Implement `ProjectEvidence.tsx` to render system, sequence, ERD, API, metric, and operations evidence by artifact kind and omit missing optional artifacts without empty placeholders in `apps/front/src/components/portfolio-preview/ProjectEvidence.tsx`.
- [x] T025 [P] [US3] Implement the detailed SVG/HTML swimlane renderer in `apps/front/src/components/portfolio-preview/ArchitectureArtifact.tsx` with labeled lanes, directional arrows, normal/failure notes, legend, and alternative text.
- [x] T026 [P] [US3] Implement `ErdArtifact.tsx` in `apps/front/src/components/portfolio-preview/ErdArtifact.tsx` with responsive diagram framing plus adjacent entity, relation, constraint, and transaction explanations.
- [x] T027 [US3] Retired: the preview-only pilot artifact metadata/assets were intentionally not added after the comparison route was removed.
- [x] T028 [US3] Add truthful system-flow or data-design fallback evidence for the remaining 7 projects in `apps/front/src/data/portfolio/feature-evidence.ts` without inventing unsupported metrics or relationships.

**Checkpoint**: Architecture is a first-class visual proof for every project; ERD or an equivalent data-design explanation is present wherever the data model is meaningful.

## Phase 6: User Story 4 - 데모와 아키텍처 증거를 구분해서 접근 (Priority: P2)

**Goal**: Provide demos only for configured projects while keeping architecture flow available for every project.

**Independent Test**: Compare one project with demo metadata and one project without demo metadata; verify CTA visibility and destination behavior.

### Tests for User Story 4 (TDD)

- [x] T029 [US4] Retired: demo CTA behavior belongs to a future public detail-page content change, not the removed preview route.

### Implementation for User Story 4

- [x] T030 [US4] Implement conditional demo and architecture CTA rendering in `apps/front/src/components/portfolio-preview/ProjectDetail.tsx` and `apps/front/src/components/portfolio-preview/ProjectEvidence.tsx`.
- [x] T031 [US4] Add only verified demo metadata to `apps/front/src/data/portfolio/feature-evidence.ts` and explicitly omit source-code links from the public preview contract.

**Checkpoint**: No project displays a fake or empty demo; every project exposes architecture evidence.

## Phase 7: User Story 5 - 라이트·다크 테마로 읽기 (Priority: P2)

**Goal**: Let visitors switch and retain the preview route theme without changing the baseline route presentation.

**Independent Test**: Toggle theme, reload, inspect text/diagram/ERD contrast, and keyboard-navigate the header.

### Tests for User Story 5 (TDD)

- [x] T032 [US5] Add failing browser assertions for theme toggle, persistence, system-default behavior, focus visibility, and diagram contrast in `apps/front/e2e/portfolio-preview.spec.ts`.

### Implementation for User Story 5

- [x] T033 [US5] Integrate `PreviewThemeProvider` and `PreviewThemeToggle` into `apps/front/src/app/(preview)/preview/layout.tsx` without changing `apps/front/src/components/layout/PublicLayout.tsx`.
- [x] T034 [US5] Add preview-scoped light/dark tokens, prose, artifact, ERD, legend, badge, and focus styles in `apps/front/src/styles/portfolio-preview.css` and the preview layout.
- [x] T035 [US5] Add reduced-motion-safe theme transitions and verify the toggle’s accessible state in `apps/front/src/components/portfolio-preview/PreviewThemeToggle.tsx`.

**Checkpoint**: Both themes are readable and persistent in the new route, while existing routes remain available for comparison.

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validate all 8 projects, preserve the baseline, and record verification evidence.

- [x] T036 [P] Add route and content regression checks for all 8 slugs in `apps/front/e2e/portfolio-preview.spec.ts`.
- [x] T037 [P] Retired: preview-specific accessibility notes are no longer applicable after the preview route and components were removed.
- [x] T038 Retired: preview-specific lint work is no longer applicable; the current public content pilot passes targeted lint.
- [x] T039 Run `mise exec -- pnpm --dir apps/front build` and fix static-generation/type errors for existing and preview routes.
- [x] T040 Run the configured E2E gate and Playwright browser QA for `320px`, `768px`, `1024px`, and `1440px`; record evidence in `specs/001-backend-first-portfolio/verification.md`.
- [x] T041 Review the existing baseline routes against the new comparison routes and document the promotion decision in `specs/001-backend-first-portfolio/verification.md`; do not replace the old routes in this feature.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; establishes isolated routes and E2E entry points.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user-story implementation.
- **User Story 1 (Phase 3)**: Depends on Foundational; provides the MVP comparison shell and all 8 routes.
- **User Story 2 (Phase 4)**: Depends on User Story 1’s detail route; can then be implemented independently of artifact rendering.
- **User Story 3 (Phase 5)**: Depends on Foundational and the detail shell from User Story 1; can be developed in parallel with User Story 2 after the route exists.
- **User Story 4 (Phase 6)**: Depends on evidence metadata from Foundational and detail/CTA components from User Stories 1 and 3.
- **User Story 5 (Phase 7)**: Depends on the preview shell from User Story 1 and artifact styles from User Story 3.
- **Polish (Phase 8)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1**: No story dependency after Foundation; MVP.
- **US2**: Depends on the detail route from US1.
- **US3**: Depends on the detail route from US1; independent from the long-form prose implementation after the shell exists.
- **US4**: Depends on US1 and the evidence data from US3.
- **US5**: Depends on US1 and the shared preview styles.

### Parallel Opportunities

- T006, T009, T010, T011, and T012 can run in parallel after T004/T005 shape the acceptance expectations.
- T019, T024, T025, and T026 can run in parallel once the detail shell exists.
- T027 and T028 can run in parallel because they update separate evidence entries within the same data module only if coordinated; otherwise execute sequentially to avoid merge conflicts.
- T036 and T037 can run in parallel with documentation-only review after feature implementation.

## Implementation Strategy

1. Preserve and snapshot the existing route behavior.
2. Build the comparison shell and all 8 links first.
3. Enrich the pilot with long-form content and detailed artifacts.
4. Extend the normalized evidence model to the remaining 7 projects without fabricating facts.
5. Add conditional demo behavior and route-scoped dark mode.
6. Run lint, build, E2E, responsive, accessibility, and baseline comparison checks.
7. Stop with the old routes still available; promotion to the default route is a separate decision.

## Notes

- Every test task is written before its corresponding implementation task and must be demonstrated failing before implementation begins.
- No task publishes source code or introduces a backend API/database migration.
- The automatic local Claude Code/Codex history ingestion feature is intentionally deferred; this feature prepares the public content shape for it.
