# Tasks: Codi Harness 콘텐츠 보강 및 인사이트 통합

**Input**: Design documents from `specs/004-codi-harness-content-consolidation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/portfolio-content-contract.md`, `quickstart.md`

**Tests**: 모든 사용자 스토리는 TDD로 진행한다. 테스트를 먼저 수정·추가하고 요구한 이유로 실패하는 RED를 `verification.md`에 기록한 뒤 구현한다.

**Organization**: 사용자 스토리별로 독립 검증 가능한 결과를 만들고, 마지막 단계에서 보존 계약과 전체 품질 게이트를 함께 확인한다. 구현 단계에서는 commit 또는 stage하지 않는다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 아직 완료되지 않은 다른 task와 파일 충돌 없이 병렬 실행 가능
- **[Story]**: `spec.md`의 사용자 스토리와 연결

## Phase 1: Setup

**Purpose**: 검증 기록과 변경 전 보호 계약을 준비한다.

- [ ] T001 `specs/004-codi-harness-content-consolidation/verification.md`를 생성해 loop round, RED/GREEN, 전체 검증, 리뷰 결과를 기록할 섹션을 마련한다.
- [ ] T002 [P] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`와 `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에서 보존 대상 8개 작업물, 7개 legacy 본문 snippet, 3개 인프라 insight, 제거 대상 4개 slug의 현재 fixture를 확인하고 계약 상수의 오탈자·누락을 정리한다.

**Checkpoint**: 변경 전 데이터·경로 기준과 증거 기록 위치가 준비된다.

---

## Phase 2: Foundational content contract

**Purpose**: 네 사용자 스토리가 공유하는 단일 정본과 증거 범위 검사를 먼저 실패시킨다.

- [ ] T003 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 하네스만 `Feature.content`가 없고 구조화 상세가 존재하며, 대표 insight만 `legacyContent`가 없고 제거 slug 내부 참조가 0개여야 한다는 공통 계약 테스트를 추가한 뒤 RED 원인을 `specs/004-codi-harness-content-consolidation/verification.md`에 기록한다.
- [ ] T004 [P] `apps/front/src/data/portfolio/content-quality.test.ts`에 측정·관찰·산정 범위와 멀티 세션의 약 2주 실험 표기가 혼합·과장되지 않아야 한다는 콘텐츠 품질 테스트를 추가한 뒤 RED 원인을 `specs/004-codi-harness-content-consolidation/verification.md`에 기록한다.

**Checkpoint**: 구현 전에 중복 정본과 증거 성숙도 계약이 요구한 이유로 실패한다.

---

## Phase 3: User Story 1 — 작업물 상세에서 구현 실체 파악 (Priority: P1) 🎯 MVP

**Goal**: 별도 링크를 열지 않아도 문제·책임·대표 설계 네 개와 결과를 파악할 수 있는 하네스 상세를 제공한다.

**Independent Test**: 하네스 상세 HTML만 검사해 승인된 네 설계 heading, 문제·선택·검증 또는 trade-off, 하나의 대표 insight 링크와 기존 두 흐름·여섯 지표를 확인한다.

### Tests for User Story 1

- [ ] T005 [P] [US1] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 description·overview 역할 분리, 세 책임, 세 문제, 네 설계 heading 순서, 두 도구 전환 이유, outcomes·retrospective 핵심 문구를 검증하는 테스트를 추가하고 focused Vitest RED를 확인한다.
- [ ] T006 [P] [US1] `apps/front/src/components/projects/project-detail-rendering.test.tsx`에 공개 HTML의 네 대표 설계 heading, 단일 대표 insight 링크, 제거 링크 0개, 기존 스윔레인·지표·demo 부재를 검증하는 서버 렌더링 테스트를 추가하고 RED를 확인한다.
- [ ] T007 [US1] `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`의 기존 도구 목록·네 독립 링크 시나리오를 작업물 본문에서 네 대표 설계와 전환 판단을 확인하는 시나리오로 교체하고 targeted Playwright RED를 확인한다.

### Implementation for User Story 1

- [ ] T008 [P] [US1] `apps/front/src/data/portfolio/features.ts`의 하네스 `description`·`overview`를 사내 개발 운영 플랫폼과 문제 확장 중심으로 재작성하고 하네스 객체의 중복 `content`만 제거한다.
- [ ] T009 [US1] `apps/front/src/data/portfolio/feature-details/codi-harness-dx-platform.ts`의 `role`, `problem`, `constraints`, `alternatives`, `implementation`, `outcomes`, `retrospective`를 승인된 네 설계 결정과 증거 범위로 재작성하되 `highlights`, `swimlanes`, `demo`는 변경하지 않는다.
- [ ] T010 [US1] T005~T009의 focused Vitest·서버 렌더링·targeted Playwright를 GREEN으로 만들고 실제 heading, 링크 수, 보존한 지표·흐름 수를 `specs/004-codi-harness-content-consolidation/verification.md`에 기록한다.

**Checkpoint**: 작업물 상세만으로 구현 실체를 설명할 수 있으며 기존 시각 흐름과 결과 증거가 유지된다.

---

## Phase 4: User Story 2 — 하나의 발전 서사로 하네스 변화 이해 (Priority: P1)

**Goal**: 기존 대표 경로에서 Jenkins 출발점부터 멀티 세션 실험과 회고까지 이어지는 하나의 깊이 있는 발전 서사를 제공한다.

**Independent Test**: 대표 insight 데이터와 공개 페이지에서 정확한 제목, `9 min`, 승인된 8개 구간 순서와 세 성숙도 표지를 확인한다.

### Tests for User Story 2

- [ ] T011 [P] [US2] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`와 `apps/front/src/data/portfolio/content-quality.test.ts`에 대표 insight의 제목·읽기 시간·8개 heading 순서·최소 본문 깊이·운영 구조/실제 결과/운영 확장 실험 표지를 검증하는 테스트를 추가하고 RED를 확인한다.
- [ ] T012 [P] [US2] `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에 작업물에서 대표 insight를 같은 탭으로 열어 제목·`9 min`·8개 heading을 확인하는 keyboard navigation 시나리오를 추가하고 RED를 확인한다.

### Implementation for User Story 2

- [ ] T013 [US2] `apps/front/src/data/portfolio/insights.ts`의 `codi-harness-dx-platform-design` 항목을 승인된 제목·excerpt·`9 min`·8개 구간의 발전 서사로 재작성하고 실제 운영 구조·실제 적용 결과·약 2주 운영 확장 실험을 명시적으로 구분한다.
- [ ] T014 [US2] T011~T013의 focused Vitest와 targeted Playwright를 GREEN으로 만들고 실제 제목, 읽기 시간, heading 8개와 성숙도 표지를 `specs/004-codi-harness-content-consolidation/verification.md`에 기록한다.

**Checkpoint**: 대표 insight 하나만 읽어 하네스 v1→v2의 인과와 실험 범위를 설명할 수 있다.

---

## Phase 5: User Story 3 — 중복·삭제 경로 없이 일관된 콘텐츠 운영 (Priority: P1)

**Goal**: 네 짧은 글과 숨은 대체 장문을 제거하고 공개 정본과 경로 동작을 일치시킨다.

**Independent Test**: registry·앱 내부 참조·공개 route를 검사해 제거 slug 4개가 목록 0개, 링크 0개, redirect 없는 404이며 두 공개 정본에 대체 장문이 없음을 확인한다.

### Tests for User Story 3

- [ ] T015 [P] [US3] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 하네스 관련 insight가 대표 slug 하나뿐이고 네 제거 객체·링크·`legacyContent`가 없어야 한다는 정확한 registry 계약을 추가하고 RED를 확인한다.
- [ ] T016 [P] [US3] `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에 제거 route 4개의 HTTP 404와 redirect 부재, 유지 인프라 insight 3개의 성공 응답을 검증하는 시나리오를 추가하고 RED를 확인한다.

### Implementation for User Story 3

- [ ] T017 [US3] `apps/front/src/data/portfolio/insights.ts`에서 제거 slug 객체 4개와 `PortfolioInsight.legacyContent` 타입·대표 값·제거 글 링크를 삭제하고 대표 객체 하나만 하네스 발전 서사를 소유하게 한다.
- [ ] T018 [US3] `apps/front/src/data/portfolio/feature-details/codi-harness-dx-platform.ts`, `apps/front/src/data/portfolio/insights.ts`, `apps/front/src/data/portfolio/*.test.ts`, `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에서 제거 slug의 의도치 않은 참조가 0개인지 `rg`로 확인하고 T015~T017을 GREEN으로 만든다.

**Checkpoint**: 콘텐츠 registry, 내부 링크와 공개 404 동작이 같은 정보 구조를 표현한다.

---

## Phase 6: User Story 4 — 기존 증거와 다른 작업물 보존 (Priority: P2)

**Goal**: 이번 콘텐츠 통합이 스윔레인, 지표, 접근성, 다른 작업물과 유지 insight를 손상시키지 않았음을 증명한다.

**Independent Test**: 전체 하네스 E2E와 데이터 테스트에서 두 흐름, 여섯 지표, demo 0개, 8개 작업물 route, 7개 legacy 본문, 3개 유지 insight와 4개 viewport 계약을 확인한다.

### Tests and verification for User Story 4

- [ ] T019 [P] [US4] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에서 두 swimlane의 기존 이름·lane/step/edge·summary, 여섯 highlight의 값·evidenceKind·source, demo 부재와 7개 legacy `content` 보존 assertion을 유지·보강한다.
- [ ] T020 [US4] `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에서 10개 공통 h2, 두 named diagram region과 320px keyboard scroll, 320/768/1024/1440 overflow, 8개 작업물 route·7개 본문 snippet, 외부 링크 안전 속성을 유지하고 전체 파일을 GREEN으로 만든다.

**Checkpoint**: 승인된 콘텐츠 외의 공개 포트폴리오 계약 손실이 0건이다.

---

## Phase 7: Polish & Cross-Cutting Verification

**Purpose**: 전체 품질 증거와 리뷰 결과를 영속 상태에 남긴다.

- [ ] T021 `pnpm --dir apps/front exec tsc --noEmit`, `pnpm --dir apps/front test`, `pnpm --dir apps/front run lint`, `pnpm --dir apps/front run build`, `mise run //apps/front:e2e`, `git diff --check`를 순서대로 실행하고 실제 pass/fail·test 수·build route·E2E 시나리오를 `specs/004-codi-harness-content-consolidation/verification.md`에 기록한다.
- [ ] T022 `apps/front/src/data/portfolio/features.ts`, `apps/front/src/data/portfolio/feature-details/codi-harness-dx-platform.ts`, `apps/front/src/data/portfolio/insights.ts`와 변경된 테스트를 scope·문구·증거 정직성 관점에서 리뷰하고 Critical/Important 발견을 해결한다.
- [ ] T023 `speckit-converge` 결과가 `Converged`가 될 때까지 `specs/004-codi-harness-content-consolidation/spec.md`, `plan.md`, `tasks.md`와 구현의 차이를 조정하고 최종 리뷰 결과를 `verification.md`에 기록한다.
- [ ] T024 `ROADMAP.md`의 Feature 004 상태를 실제 완료 상태와 맞추고 `mise run feature:status:sync`를 실행해 deterministic transition 또는 정확한 미지원 결과를 `specs/004-codi-harness-content-consolidation/verification.md`에 기록한다.

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1은 즉시 시작 가능하다.
- Phase 2는 Phase 1의 baseline과 기록 위치에 의존하며 모든 구현을 차단한다.
- US1(Phase 3)은 Phase 2 이후 시작하고 작업물 상세 MVP를 완성한다.
- US2(Phase 4)는 Phase 2 이후 독립적으로 시작할 수 있지만, 같은 `feature-detail-quality.test.ts`를 수정하므로 실제 실행에서는 US1 뒤에 진행한다.
- US3(Phase 5)은 대표 insight가 완성된 US2 뒤에 네 짧은 객체와 중복 필드를 제거한다.
- US4(Phase 6)는 US1~US3 이후 전체 보존 계약을 검증한다.
- Phase 7은 모든 사용자 스토리가 GREEN인 뒤 실행한다.

### User Story Dependencies

- **US1**: 다른 story 없이 독립 공개 가능하며 MVP다.
- **US2**: 대표 insight 하나로 독립 검증 가능하다.
- **US3**: 대표 insight를 남기고 네 짧은 글을 제거하므로 US2의 canonical 객체에 의존한다.
- **US4**: 새 기능을 추가하지 않고 US1~US3의 회귀를 검증한다.

### TDD Order

각 story에서 Tests → RED 실행·기록 → data implementation → focused GREEN → checkpoint 기록 순서를 지킨다. 예상과 다른 실패가 나오면 구현을 시작하지 않고 원인을 진단한다.

## Parallel Opportunities

- T002는 T001과 파일 충돌 없이 병렬 가능하다.
- T003과 T004는 서로 다른 테스트 파일에서 병렬 가능하다.
- T005와 T006, T011과 T012, T015와 T016은 서로 다른 test layer라 병렬 가능하다.
- T008은 `features.ts`, T009는 `feature-details/codi-harness-dx-platform.ts`를 수정하지만 승인 문구 정합성 때문에 T009를 T008 뒤에 통합 검토한다.
- 사용자 선택에 따라 구현은 Subagent-Driven 방식으로 진행하되, 공유 테스트 파일을 수정하는 task는 순차 인계해 충돌을 방지한다.

## Parallel Example: User Story 1

```text
Task A: T005 — data contract RED in feature-detail-quality.test.ts
Task B: T006 — server rendering RED in project-detail-rendering.test.tsx
After A+B: T007 targeted E2E RED → T008/T009 implementation → T010 GREEN
```

## Implementation Strategy

### MVP First

1. Phase 1~2에서 baseline과 RED 증거를 만든다.
2. US1로 작업물 상세의 대표 설계 네 개와 단일 링크를 완성한다.
3. 작업물 상세만 읽는 독립 기준을 검증한 뒤 US2로 진행한다.

### Incremental Delivery

1. US1: 링크 없이도 구현 실체 전달
2. US2: 대표 발전 서사 완성
3. US3: 네 짧은 글·중복 정본 제거와 404 정합성
4. US4: 기존 포트폴리오 계약 전체 보존
5. Full verification → review → converge → ROADMAP/status sync

## Notes

- 앱 구현과 테스트 단계에서는 commit 또는 stage하지 않는다.
- unrelated dirty worktree와 기존 baseline 문제를 수정하거나 mass-format하지 않는다.
- E2E suite가 통과해도 dirty/untracked tree로 evidence stamp가 거부되면 두 결과를 분리해 기록한다.
- 테스트의 단순 문자열 수보다 실제 heading 순서, href, HTTP status, 보존된 수량과 사용자 흐름을 증거로 기록한다.
