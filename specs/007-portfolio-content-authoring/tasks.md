# Tasks: 포트폴리오 콘텐츠 작성 규칙과 인사이트 계약

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/portfolio-insight-contract.md`, `quickstart.md`

**Size**: Large — project-wide agent steering, project-local skill evaluation,
frontend data contract, seven public articles, responsive user flow and durable handoff are
separate ownership boundaries.

**Tests**: Required. Skill behavior and frontend changes follow RED → GREEN. Every RED command,
expected failure, GREEN command and result is recorded in
`specs/007-portfolio-content-authoring/verification.md`.

**Task format**: `[ID] [P?] [Story] Description`. `[P]` means the task uses a separate file or
isolated evaluation workspace and can run concurrently after its stated dependencies.

## Phase 1: Setup and immutable inventory

**Purpose**: Freeze the exact migration boundary before any content or contract implementation.

- [X] T001 Confirm the current inventory is 8 projects, 1 study and 18 insights, and record the exact seven target slugs plus eleven legacy slugs in `specs/007-portfolio-content-authoring/verification.md` (FR-035, FR-038, SC-003, SC-008)
- [X] T002 Record the title, route and source slug inventory for all 18 insights plus before-change content checksums for the eleven preservation targets in `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`, without adding production metadata yet (FR-035, FR-038, FR-039)
- [X] T003 [P] Define the six realistic skill prompts without assertions in `.harness/skills-local/portfolio-content-authoring/evals/evals.json`; do not create `SKILL.md` yet (FR-041, SC-002)
- [X] T004 Create an isolated `mktemp -d` evaluation workspace after T003, run the six prompts without the new skill, and record the observed omissions as the initial RED baseline in `specs/007-portfolio-content-authoring/verification.md` (FR-041, FR-042)

**Checkpoint**: The seven migrated and eleven preserved articles are exact, and skill failure behavior is observed before authoring the skill.

---

## Phase 2: Foundational RED contracts

**Purpose**: Write all cross-story failure contracts before production implementation.

**⚠️ CRITICAL**: Do not edit the production DTO, validator, insight metadata, public pages or skill body until these tests fail for the expected missing behavior.

- [X] T005 Write failing unit cases for both insight types, allowed/forbidden source combinations, unknown slugs and independent-reason rules in `apps/front/src/data/portfolio/insight-editorial-quality.test.ts` (FR-013, FR-017, FR-019, FR-021, FR-022)
- [X] T006 Write failing unit cases for `not-needed`, `recommended`, `provided`, rationale, kind, text alternative and non-duplication constraints in `apps/front/src/data/portfolio/insight-editorial-quality.test.ts` (FR-029–FR-034)
- [X] T007 Add failing exact-set, 6:1 type count, valid source and eleven-legacy-preservation assertions to `apps/front/src/data/portfolio/insight-editorial-quality.test.ts` (FR-035–FR-040, SC-003, SC-004, SC-008)
- [X] T008 [P] Add failing fact-contract assertions for the four harness articles, Hanmaum article, Blackstone article, Vercel article and linked study in `apps/front/src/data/portfolio/content-quality.test.ts` (FR-023–FR-028, SC-005, SC-006)
- [X] T009 [P] Add failing browser assertions for type labels, project/study round-trip navigation, legacy routes and 320/768/1024/1440px overflow in `apps/front/e2e/portfolio-insight-contract.spec.ts` (FR-020, FR-039, FR-045, SC-007, SC-010)
- [X] T010 Run the focused Vitest and production E2E test commands from `quickstart.md`, confirm failures are caused by the absent editorial contract/UI or stale target facts, and record RED evidence in `specs/007-portfolio-content-authoring/verification.md` (FR-044)

**Checkpoint**: Production changes are blocked by reproducible RED evidence for contract, content and public flow.

---

## Phase 3: User Story 1 — 두 에이전트가 같은 콘텐츠 기준을 따른다 (Priority: P1) 🎯 MVP

**Goal**: Make one short always-on rule and one project-owned authoring skill discoverable by both Claude Code and Codex.

**Independent Test**: A fresh agent context discovers the rule/skill and all six with-skill evaluations include type, source, meaning, visual, cross-record and evidence checks.

### Implementation

- [X] T011 [P] [US1] Author the short English always-on trigger and invariants in `.harness/rules-local/portfolio-editorial-standard.md`, referring detailed work to `portfolio-content-authoring` (FR-001–FR-006)
- [X] T012 [P] [US1] Author the English project-detail reading order, evidence boundaries and future work+insight feature rule in `.harness/skills-local/portfolio-content-authoring/references/project-detail-contract.md` (FR-003, FR-007, FR-010–FR-012)
- [X] T013 [P] [US1] Author the English source precedence, evidence classes, fact-contract comparison and unsupported-claim rules in `.harness/skills-local/portfolio-content-authoring/references/evidence-and-linking.md` (FR-023–FR-028)
- [X] T014 [P] [US1] Author the English two-type semantic contract, source/independent exception and non-duplication rules in `.harness/skills-local/portfolio-content-authoring/references/insight-contract.md` (FR-013–FR-022)
- [X] T015 [P] [US1] Author the English visual-necessity decision procedure and text-alternative rules in `.harness/skills-local/portfolio-content-authoring/references/visual-evidence.md` (FR-029–FR-034)
- [X] T016 [US1] Author `.harness/skills-local/portfolio-content-authoring/SKILL.md` with concise triggers, the evidence→type→source→meaning→visual→cross-check→public-verification workflow and progressive reference loading; do not duplicate full references (FR-002–FR-006)
- [X] T017 [US1] Run `./harness skills-link`, then verify `.agents/skills/portfolio-content-authoring/SKILL.md`, `.claude/skills/portfolio-content-authoring/SKILL.md` and `.claude/rules/local/portfolio-editorial-standard.md` resolve to project-owned sources (FR-001, FR-005, SC-001)
- [X] T018 [US1] In runtime-capacity-safe paired batches, launch each of the six prompts once with the new skill and once without it into an isolated temporary workspace; keep each pair in the same batch and capture outputs/timing (FR-042)
- [X] T019 [US1] Add measurable assertions to `.harness/skills-local/portfolio-content-authoring/evals/evals.json`, grade all twelve outputs, aggregate the benchmark, and record per-scenario baseline/with-skill evidence in `specs/007-portfolio-content-authoring/verification.md` (FR-042, FR-043, SC-002)
- [X] T020 [US1] If any with-skill result misses an assertion, revise only the relevant skill/reference file and repeat T018–T019 for all six prompts; clean the temporary workspace after preserving the final summary (FR-043)
- [X] T021 [US1] Run `./harness context-check`, `./harness rule-check` and `./harness doctor`; record project-local ownership/discovery results without changing shared `.harness/skills/**` (FR-005, FR-006)

**Checkpoint**: Both agent runtimes discover one source of truth and all six skill evaluations pass.

---

## Phase 4: User Story 2 — 독자가 인사이트의 목적과 출처를 이해한다 (Priority: P1)

**Goal**: Introduce an incrementally adoptable, reference-safe type/source contract and expose it only for migrated articles.

**Independent Test**: Exactly seven articles have a valid type/source contract, migrated list/detail pages show the right Korean type label, and legacy articles have no empty placeholder.

### Implementation

- [X] T022 [P] [US2] Add and export `InsightType`, `InsightVisualKind`, `InsightVisualAssessment` and `InsightEditorialMetadata` discriminated unions in `apps/front/src/data/portfolio/types/insight.dto.ts` (FR-013, FR-017, FR-019, FR-029, FR-030)
- [X] T023 [P] [US2] Implement error-code-based `validateInsightEditorial` and exact-set `validateMigratedInsightSet` in `apps/front/src/data/portfolio/insight-editorial.ts` (FR-017–FR-022, FR-029–FR-036)
- [X] T024 [US2] Extend `SeedInsight`, DTO mapping and public type exports in `apps/front/src/data/portfolio/insights.ts` and `apps/front/src/data/portfolio/index.ts`, preserving legacy seed items without metadata while normalizing legacy DTOs to `editorial: null` (FR-013, FR-035, FR-038)
- [X] T025 [US2] Add complete type/source-compatible editorial metadata to the exact seven target entries in `apps/front/src/data/portfolio/insights.ts`; use the approved final visual decisions from `data-model.md` so no incomplete intermediate state is committed (FR-013, FR-017, FR-019, FR-035, FR-036)
- [X] T026 [P] [US2] Render `프로젝트 사례형` or `기술 탐구형` only when metadata exists on cards in `apps/front/src/app/(public)/insights/page.tsx`; render no legacy placeholder (FR-013, FR-037)
- [X] T027 [P] [US2] Render the migrated type label and existing valid project/study source card in `apps/front/src/app/(public)/insights/[slug]/page.tsx`, keeping source links semantic and keyboard reachable (FR-020, FR-039)
- [X] T028 [US2] Run the source/type focused cases in `apps/front/src/data/portfolio/insight-editorial-quality.test.ts` and fix only production contract defects until GREEN (SC-004, SC-007)

**Checkpoint**: Type/source meaning is visible for seven migrated articles and absent—not empty—for eleven legacy articles.

---

## Phase 5: User Story 3 — 글마다 같은 판단 품질을 유지한다 (Priority: P1)

**Goal**: Apply a semantic contract without forcing identical headings or duplicating source records.

**Independent Test**: A documented review of all seven articles can locate the common and type-specific meanings, while headings remain topic-specific and long source text is not duplicated.

### Implementation

- [X] T029 [US3] Audit the six project-case articles against role, actual problem/time, constraints, actual choice/implementation, outcome evidence, limits and retrospective; record article-specific evidence in `specs/007-portfolio-content-authoring/verification.md` (FR-014–FR-016, FR-036)
- [X] T030 [US3] Audit the Vercel technical-exploration article against learning question, reference/direct-experiment distinction, concept/alternatives, use/avoid conditions, limits and linked study; record evidence in `specs/007-portfolio-content-authoring/verification.md` (FR-014, FR-018, FR-036)
- [X] T031 [US3] Make only the minimal content edits needed by T029–T030 in `apps/front/src/data/portfolio/insights.ts`; retain natural topic-specific Markdown headings and do not normalize section names (FR-015, FR-037)
- [X] T032 [US3] Compare each target article read-only with its linked project/study in `apps/front/src/data/portfolio/features.ts`, `apps/front/src/data/portfolio/feature-details/`, and `apps/front/src/data/portfolio/studies.ts`; remove confirmed long duplication only from the target insight in `apps/front/src/data/portfolio/insights.ts`. Source records stay unchanged except the separately evidenced Vercel study correction in T041 (FR-007–FR-010, SC-006)
- [X] T033 [US3] Add regression assertions that require semantic evidence without exact heading equality in `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`, then run the focused test to GREEN (FR-014–FR-016, FR-018)

**Checkpoint**: All seven articles satisfy meaning contracts without becoming copies of one template or their source record.

---

## Phase 6: User Story 4 — 필요한 글에만 적합한 시각 증거를 사용한다 (Priority: P2)

**Goal**: Require a reasoned visual decision for every migrated article without generating decorative diagrams.

**Independent Test**: Seven assessments match the approved fixture; `not-needed` is valid, recommendation includes a kind, and provided visuals cannot omit accessible text or non-duplication rationale.

### Implementation

- [X] T034 [US4] Review the seven `visualAssessment` values in `apps/front/src/data/portfolio/insights.ts` against `data-model.md`, replacing generic rationale with article-specific reasons and leaving all actual diagram creation out of scope (FR-029–FR-032, SC-009)
- [X] T035 [US4] Confirm the Hanmaum and Vercel `not-needed` decisions explicitly cite the existing project swimlane/table and prevent duplicate evidence in `apps/front/src/data/portfolio/insights.ts` (FR-032, FR-033, SC-006)
- [X] T036 [US4] Confirm all `recommended` decisions express candidates rather than implemented evidence and do not invent relations in `apps/front/src/data/portfolio/insights.ts` (FR-031, FR-034)
- [X] T037 [US4] Run every visual union/validator case in `apps/front/src/data/portfolio/insight-editorial-quality.test.ts` to GREEN, including synthetic `provided` fixtures with missing text alternatives (FR-033, SC-009)

**Checkpoint**: Visual necessity is decided for 100% of targets and no new diagram is implied or fabricated.

---

## Phase 7: User Story 5 — 완료된 작업물과 공부 기록의 연결 글을 먼저 정돈한다 (Priority: P1)

**Goal**: Correct only evidence-backed conflicts in the seven targets and preserve all unreviewed public content.

**Independent Test**: Exact fact-contract tests pass for all target source/article pairs; all 18 routes survive and eleven legacy checksums remain unchanged.

### Implementation

- [X] T038 [US5] Reconcile the four harness articles in `apps/front/src/data/portfolio/insights.ts` with feature 004 evidence, preserving the `$151.84` public-price estimate, exclusions, experiment boundary and non-absolute outcomes (FR-023–FR-028)
- [X] T039 [US5] Correct `optimizing-770k-text-search-in-rdbms` in `apps/front/src/data/portfolio/insights.ts` to describe browser-network end-to-end observations and remove query-only average or unverifiable percentage claims, using feature 005 evidence (FR-023–FR-028)
- [X] T040 [US5] Correct `spa-api-key-exposure-and-bff-architecture` in `apps/front/src/data/portfolio/insights.ts` to match new-build and mid-project React build-output discovery evidence from feature 006; keep the unrelated payment-API timing/current-state narrative in the project detail only, and remove unsupported header/fallback/zero-downtime claims (FR-023–FR-028)
- [X] T041 [US5] Reconcile `vercel-team-plan-bypass-and-serverless-cost-analysis` and `ai-dx-harness-starter-kit` in `apps/front/src/data/portfolio/insights.ts` and `apps/front/src/data/portfolio/studies.ts` with dated official Vercel plan/seat/credit references, labeling calculations and exclusions rather than presenting them as bills (FR-023–FR-027)
- [X] T042 [US5] Resolve the shared-file edits from T038–T041 into one coherent `apps/front/src/data/portfolio/insights.ts`, re-run exact target and eleven-legacy checksum fixtures, and restore any out-of-scope legacy body drift (FR-035–FR-040, SC-005, SC-008)
- [X] T043 [US5] Run `apps/front/src/data/portfolio/content-quality.test.ts` and `apps/front/src/data/portfolio/insight-editorial-quality.test.ts` to GREEN; record each target source/article consistency result in `specs/007-portfolio-content-authoring/verification.md` (SC-003–SC-009)

**Checkpoint**: Seven targets are evidence-consistent, eleven legacy bodies are preserved, and no route/content deletion has occurred.

---

## Phase 8: Integration, review and verification

**Purpose**: Prove the combined skill, contract, content and public flows satisfy the feature.

- [X] T044 Run `pnpm exec tsc --noEmit` and all Vitest suites from `apps/front`, then record command output in `specs/007-portfolio-content-authoring/verification.md` (FR-044)
- [X] T045 Run ESLint only for actual changed frontend files listed in `quickstart.md`; do not run global formatting or modify unrelated baseline files (FR-044)
- [X] T046 Run `pnpm run build` in `apps/front` and confirm all existing static project, study and insight routes are generated (FR-039, SC-008)
- [X] T047 Start the production build on an unused port other than 1104, run `apps/front/e2e/portfolio-insight-contract.spec.ts` plus affected portfolio E2E, and record round-trip, keyboard and 320/768/1024/1440px overflow evidence in `specs/007-portfolio-content-authoring/verification.md` (FR-020, FR-045, SC-007, SC-010)
- [X] T048 Stop only the temporary production server and remove only the temporary Playwright/server configuration created by T047; leave the port 1104 dev server and `.next/dev` lock untouched (Workflow gate: temporary-environment cleanup, intentionally not a product FR/SC)
- [X] T049 Run `git diff --check`, inspect `git diff --stat` and verify no shared `.harness/skills/**`, unrelated frontend files, routes or legacy bodies changed (FR-005, FR-038–FR-040)
- [X] T050 Run `speckit-converge` until `Converged`, applying review feedback through the relevant RED/GREEN test when behavior changes; leave no Critical or Important finding (Workflow gate: mandatory review, intentionally not a product FR/SC)
- [X] T051 Run `mise run feature:status:sync` and, if deterministic transitions are proposed, `mise run feature:status:sync --apply`; if the task is unavailable or ambiguous, record the failure and reconcile `ROADMAP.md` manually without inventing a replacement command (Workflow gate: repository status sync, intentionally not a product FR/SC)
- [X] T052 Complete `specs/007-portfolio-content-authoring/verification.md` with automated evidence, manual seven-article audit, skill benchmark, remaining visual recommendations and residual risks, then update `ROADMAP.md` to the verified feature state (Workflow gate: durable handoff, intentionally not a product FR/SC)

**Final Checkpoint**: The feature is complete only when all tasks are checked, convergence is green and verification contains fresh skill, unit, lint, build and production-browser evidence.

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1** starts immediately and freezes scope.
- **Phase 2** depends on T001–T004 and blocks production implementation.
- **US1 (Phase 3)** depends on the baseline T004; T018–T020 require explicit subagent authorization and T016–T017.
- **US2 (Phase 4)** depends on RED tasks T005–T007 and may proceed in parallel with US1 after Phase 2.
- **US3 (Phase 5)** depends on the skill contracts T012–T016 and target metadata T025.
- **US4 (Phase 6)** depends on visual types/validator T022–T025.
- **US5 (Phase 7)** depends on exact preservation/fact RED tasks T007–T008 and semantic audits T029–T030.
- **Phase 8** depends on all five user stories.

### User-story dependency graph

```text
Setup + RED
├── US1 agent rule/skill ───────┐
└── US2 type/source contract ───┼──> US3 semantic review
                                ├──> US4 visual assessment
                                └──> US5 evidence corrections
                                      └──> Integration/Converge
```

US1 and US2 are independently testable after Phase 2. US3–US5 share the exact seven-article
fixture and therefore integrate only after US2 has established its contract.

### Parallel opportunities

- T003 and T004 can run independently from inventory fixture work after the six prompts are fixed.
- T008 and T009 target isolated test files; T005–T007 are sequential because they share one test file.
- T011–T015 are separate rule/reference files and can be authored independently before T016.
- US1 skill evaluation and US2 frontend implementation are separate workstreams after Phase 2.
- T026 and T027 are separate routes.
- T029 and T030 are conceptually separate audits but write their evidence sequentially to one verification file.
- T038–T041 are conceptually independent audits but share `insights.ts`; run them sequentially or have parallel agents return findings only to T042 rather than edit the shared file.

## Implementation Strategy

1. Freeze target/legacy inventory and obtain honest skill/frontend RED evidence.
2. Build the agent rule/skill and frontend type/source contract as separate workstreams.
3. Apply semantic, visual and fact contracts to exactly seven targets.
4. Preserve eleven legacy bodies and all existing routes.
5. Verify changed files, full frontend behavior and a fresh production browser flow.
6. Converge, synchronize feature status and hand off without committing unless separately authorized.

## Notes

- `recommended` visual metadata does not authorize drawing a diagram in this feature.
- Do not claim total payment count, ratios, query-only averages, old fixed cloud bills or other unverifiable values.
- Do not alter the port 1104 development server.
- Do not commit, push, merge or deploy as part of these tasks without separate user authorization.

## Phase 9: Convergence

- [X] T053 Reconcile the user-approved The Siena logging insight follow-up across the exact migrated/legacy inventory, type counts, preservation contract, spec, plan, data model, verification, ROADMAP, validator and regression fixtures so the durable Feature 007 intent matches the implemented 8 migrated / 10 preserved scope per FR-035, FR-038, SC-003, SC-008 and US5/AC5 (contradicts)
- [X] T054 Update the `codi-harness-dx-platform-design` visual fixture in `specs/007-portfolio-content-authoring/data-model.md` to the approved `provided / timeline` state and confirm it matches production and regression contracts per plan: T025/T034 visual decision (contradicts)

## Phase 10: Final Review Convergence

- [X] T055 Correct the linked harness project copy so `fail-fast: false` is described only as an untested cancellation-boundary design intention, and add a source–insight regression contract per FR-023, FR-024 and FR-028 (contradicts)
- [X] T056 Replace direct-focus-only round-trip evidence with a bounded real Tab-navigation assertion for both source and reverse links, retaining Enter activation per FR-020, FR-045, SC-007 and Constitution IV (partial)
- [X] T057 Update the public study reading link to the approved Jenkins insight title and add adjacent-link title coverage per FR-020 and SC-007 (contradicts)
