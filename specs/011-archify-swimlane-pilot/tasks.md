---

description: "Archify 스윔레인 파일럿 작업 목록"
---

# Tasks: Archify 스윔레인 파일럿

**Input**: Design documents from `specs/011-archify-swimlane-pilot/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 사용자 요청과 헌법 원칙에 따라 테스트 우선 개발(TDD)을 적용한다. 각 행동 변경의 RED task를 먼저 실행해 예상 실패를 확인한 뒤 최소 구현으로 GREEN을 만든다. 기존 동작 보존은 characterization test로 고정한다.

**Organization**: Tasks are grouped by user story so each public reading goal can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일을 변경하고 미완료 task에 의존하지 않아 병렬 실행 가능한 작업
- **[Story]**: spec.md의 사용자 story 매핑
- 모든 task는 실제 대상 파일 경로를 포함한다

## Phase 1: Setup (Shared Baseline)

**Purpose**: 공유 worktree, 사용자 소유 1104 server와 기존 스윔레인 의미를 보존한다.

- [X] T001 현재 변경 파일, port 1104 listener PID·route 200, 기존 React preview·`크게 보기`, 대상 node 10개·edge 12개 기준선을 `specs/011-archify-swimlane-pilot/verification.md`에 기록한다
- [X] T002 Archify 2.17 doctor와 실행 경로, `apps/front/.prettierignore`의 생성물·의존성 제외 규칙을 확인하고 앱 dependency가 추가되지 않은 기준선을 `specs/011-archify-swimlane-pilot/verification.md`에 기록한다

---

## Phase 2: Foundational (Optional Link Contract)

**Purpose**: 모든 story가 공유하는 선택형 Archify metadata와 안전한 경로 계약을 TDD로 만든다.

**⚠️ CRITICAL**: 이 phase가 끝나기 전에는 프로젝트 data나 renderer에 Archify link를 연결하지 않는다.

- [X] T003 `FeatureSwimlane.archify`의 유효 metadata와 빈 label·외부 URL·`/diagrams/` 밖 path·비 HTML path 거부 RED를 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 추가하고 예상 실패를 확인한다
- [X] T004 `FeatureSwimlaneArchifyLink` 선택 타입을 `apps/front/src/data/portfolio/types/feature-detail.dto.ts`에 추가하고 link validation을 `apps/front/src/data/portfolio/feature-details/index.ts`에 최소 구현한다
- [X] T005 T003의 targeted Vitest를 실행해 optional metadata와 invalid path 계약이 GREEN인지 확인하고 결과를 `specs/011-archify-swimlane-pilot/verification.md`에 기록한다

**Checkpoint**: metadata가 없는 모든 기존 detail은 그대로 유효하고, 안전한 same-origin HTML path만 연결할 수 있다.

---

## Phase 3: User Story 1 - 같은 흐름을 확장 viewer에서 탐색 (Priority: P1) 🎯 MVP

**Goal**: 호텔 예약 시스템의 대상 카드에서 기존과 동일한 흐름을 Archify standalone viewer로 새 탭에서 연다.

**Independent Test**: `/projects/hotel-reservation-platform`에서 `Archify로 보기`를 열고 standalone viewer에서 기존 10개 단계·12개 관계, 동등한 세 분기와 패리티 복구 경로를 확인한다.

### Tests for User Story 1 ⚠️

- [X] T006 [US1] 대상 스윔레인 한 건만 metadata를 갖고 JSON·HTML path가 존재하며 canonical node 10개·edge 12개와 Archify source가 대응해야 한다는 RED를 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 추가하고 예상 실패를 확인한다
- [X] T007 [US1] metadata가 있는 card에만 보이는 이름·accessible name·`target="_blank"`·`rel="noopener noreferrer"` link가 한 번 표시되어야 한다는 RED를 `apps/front/src/components/projects/project-detail-rendering.test.tsx`에 추가하고 예상 실패를 확인한다

### Implementation for User Story 1

- [X] T008 [US1] `Archify로 보기` metadata를 `apps/front/src/data/portfolio/feature-details/hotel-reservation-platform.ts`의 `platform-change-verification-deployment` 한 건에만 추가한다
- [X] T009 [US1] 기존 `크게 보기` Dialog를 유지하며 조건부 Archify 새 탭 link를 `apps/front/src/components/projects/ProjectSwimlane.tsx`에 최소 구현한다
- [X] T010 [US1] Archify workflow schema v2, common schema와 workflow example 하나를 읽고 다른 renderer 내부를 검사하지 않은 채 다음 tool action으로 승인된 10개 node·12개 edge candidate를 `apps/front/diagrams/hotel-reservation-platform/platform-change-verification-deployment.json`에 작성한다
- [X] T011 [US1] 첫 candidate 직후 `/Users/codiworks_dev/.agents/skills/archify/scripts/check-update.mjs`를 한 번 실행하고, 매 수정 뒤 showcase validate를 수행해 9개 artifact check·composition error 0·warning 0을 만족한 `apps/front/diagrams/hotel-reservation-platform/platform-change-verification-deployment.json`을 동결한다
- [X] T012 [US1] Archify delivery contract를 읽고 frozen JSON에서 `apps/front/public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html`을 deliver해 private source snapshot 처리와 성공 receipt를 확인한다
- [X] T013 [US1] T006~T007 targeted Vitest와 실제 public HTML 존재 검사를 실행해 GREEN을 확인하고 결과를 `specs/011-archify-swimlane-pilot/verification.md`에 기록한다

**Checkpoint**: 기존 의미와 정확히 대응하는 standalone viewer를 대상 card에서 새 탭으로 열 수 있다.

---

## Phase 4: User Story 2 - 기존 스윔레인 경험 보존 (Priority: P1)

**Goal**: 파일럿 여부와 관계없이 기존 React preview·Dialog를 계속 사용하고 다른 작업물에는 빈 Archify UI를 만들지 않는다.

**Independent Test**: 호텔 예약 시스템의 기존 `크게 보기`를 열고 닫은 뒤, 다른 구조화 작업물 card에 Archify action·wrapper·placeholder가 없는지 확인한다.

### Tests for User Story 2 ⚠️

- [X] T014 [US2] 기존 preview·summary·exceptions·Dialog·focus 계약과 metadata 없는 모든 스윔레인의 Archify action·빈 wrapper·placeholder 부재 characterization을 `apps/front/src/components/projects/project-detail-rendering.test.tsx`에 추가한다
- [X] T015 [US2] 호텔 대상만 Archify metadata를 갖고 다른 작업물 data가 변경되지 않아야 한다는 회귀 검사를 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 추가한다

### Implementation for User Story 2

- [X] T016 [US2] T014~T015를 실행하고 회귀가 있으면 기존 `ProjectSwimlane` 구조를 보존하는 최소 수정만 `apps/front/src/components/projects/ProjectSwimlane.tsx`에 반영한다
- [X] T017 [US2] 기존 React Dialog의 mouse·keyboard open, 모바일 viewport touch tap, Escape close와 focus return 회귀를 `apps/front/e2e/swimlane-viewer.spec.ts`에 고정한다

**Checkpoint**: pilot이 기존 viewer를 대체하지 않고 다른 작업물의 DOM을 확장하지 않는다.

---

## Phase 5: User Story 3 - 동일 의미와 검증 근거 확인 (Priority: P2)

**Goal**: 포트폴리오 소유자가 Archify 결과의 의미 parity와 deterministic provenance를 확인한다.

**Independent Test**: canonical React data와 JSON·HTML·receipt를 대조해 node·edge mismatch와 새 주장 0건, validate·deliver 증거의 추적 가능성을 확인한다.

### Tests for User Story 3 ⚠️

- [X] T018 [US3] 기존 프로젝트 본문·연결 인사이트 copy 불변, Archify source의 한국어 authored content, generated HTML의 영어 `lang` fallback, 금지 정보·새 수치·구성요소·성과 0건 계약을 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 추가한다

### Implementation for User Story 3

- [X] T019 [US3] 동결된 source에 showcase validate를 다시 실행해 source를 수정하지 않고 최종 9/9·error 0·warning 0 receipt를 `specs/011-archify-swimlane-pilot/verification.md`에 기록한다
- [X] T020 [US3] `deliver`의 private snapshot 처리, specification·artifact SHA-256와 byte count, HTML path를 `specs/011-archify-swimlane-pilot/verification.md`에 기록하고 실제 파일과 일치하는지 확인한다
- [X] T021 [US3] `git diff`와 T018을 사용해 프로젝트 본문·인사이트·다른 swimlane copy 변경과 고객 정보·시크릿·비공개 source/log 노출이 0건인지 확인해 `specs/011-archify-swimlane-pilot/verification.md`에 기록한다

**Checkpoint**: source, artifact와 검증 receipt가 같은 승인 의미에서 생성됐음을 한 문서에서 추적할 수 있다.

---

## Phase 6: User Story 4 - 키보드와 다양한 화면에서 사용 (Priority: P2)

**Goal**: keyboard 사용자와 지원 viewport에서 두 action과 standalone viewer의 핵심 흐름을 겹침·잘림 없이 사용한다.

**Independent Test**: original page의 320/768/1024/1440px와 standalone viewer의 1440×900/1600×1000/1920×1080에서 새 탭 keyboard 동작, document overflow와 핵심 요소 가림 0건을 확인한다.

### Tests for User Story 4 ⚠️

- [X] T022 [US4] 두 action의 keyboard 식별·새 page URL, original page 지원 폭의 title/action 겹침·document overflow, 다른 작업물 action 부재를 검사하는 RED를 `apps/front/e2e/swimlane-viewer.spec.ts`에 추가하고 구현 기준에서 예상 결과를 확인한다

### Implementation for User Story 4

- [X] T023 [US4] T022의 실제 실패가 있을 때만 action wrapping·focus style·accessible label을 `apps/front/src/components/projects/ProjectSwimlane.tsx`에 조정하고 기존 Dialog markup을 유지한다
- [X] T024 [US4] delivered HTML에 Archify visual-check를 실행해 1440×900·1600×1000·1920×1080 browser evidence와 한국어 authored content·영어 Viewer UI 및 문서 언어 fallback을 `specs/011-archify-swimlane-pilot/verification.md`에 기록한다
- [X] T025 [US4] visual-check screenshot을 `view_image`로 확인해 node 관통, edge 충돌, label 잘림·겹침과 주·분기·복구 경로 오독 finding을 `specs/011-archify-swimlane-pilot/verification.md`에 기록한다
- [X] T026 [US4] 1104에서 대상 page의 기존 preview·두 action·responsive header와 다른 구조화 작업물의 action 부재를 확인하되 listener를 재시작하지 않고 결과를 `specs/011-archify-swimlane-pilot/verification.md`에 기록한다

**Checkpoint**: original page와 standalone viewer가 각각의 지원 화면·입력 계약을 충족한다.

---

## Phase 7: Polish & Cross-Cutting Verification

**Purpose**: 전체 회귀, fresh production 화면, 검토와 feature 상태를 마무리한다.

- [X] T027 `apps/front`에서 `pnpm exec tsc --noEmit`과 Feature 011 targeted Vitest를 실행하고 결과를 `specs/011-archify-swimlane-pilot/verification.md`에 기록한다
- [X] T028 `apps/front`에서 `pnpm vitest run`으로 전체 suite를 실행해 다른 작업물·인사이트·기존 swimlane 회귀를 확인한다
- [X] T029 실제 변경 TS/TSX/test 파일만 `specs/011-archify-swimlane-pilot/quickstart.md`의 scoped ESLint 명령으로 검사하고 전역 baseline은 수정하지 않는다
- [X] T030 `apps/front`에서 `pnpm run build`를 실행해 static diagram을 포함한 production build를 검증한다
- [X] T031 빈 production port와 1104 PID를 확인하고 임시 `apps/front/playwright.feature-011.prod.config.ts`를 만든 뒤 소유한 production server에서 `apps/front/e2e/swimlane-viewer.spec.ts`, `apps/front/e2e/hotel-reservation-platform.spec.ts`, `apps/front/e2e/portfolio-insight-contract.spec.ts`를 실행한다
- [X] T032 production server에서 original page 320px·1440px와 standalone viewer 1440×900·1920×1080을 캡처하고 `view_image`로 최종 시각 검토해 `specs/011-archify-swimlane-pilot/verification.md`에 기록한다
- [X] T033 임시 `apps/front/playwright.feature-011.prod.config.ts`를 `apply_patch`로 삭제하고 소유한 production process만 종료한 뒤 선택 port 해제와 1104 listener·PID 보존을 확인한다
- [X] T034 `git diff --check`, `mise run e2e:changed`, `mise run feature:status:sync`를 실행하고 baseline·dirty worktree 제약은 우회하지 않고 `specs/011-archify-swimlane-pilot/verification.md`에 기록한다
- [X] T035 최종 명령·핵심 출력·Archify receipt·브라우저·이미지 검토와 잔여 위험을 `specs/011-archify-swimlane-pilot/verification.md`에 정리한다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 이후 진행하며 모든 story의 link 계약을 차단
- **US1 (Phase 3)**: Foundational 완료 후 진행하는 MVP
- **US2 (Phase 4)**: US1의 조건부 link 구현 뒤 기존 UI와 다른 작업물 회귀를 고정
- **US3 (Phase 5)**: US1의 frozen source와 delivered artifact에 의존
- **US4 (Phase 6)**: US1·US2의 실제 action과 viewer, US3의 frozen artifact에 의존
- **Polish (Phase 7)**: 모든 user story 완료 후 진행

### User Story Dependencies

- **US1**: Foundational optional link contract에 의존
- **US2**: US1 구현을 대상으로 하지만 기존 UI 보존은 독립적으로 검증 가능
- **US3**: US1의 JSON·HTML·receipt에 의존
- **US4**: US1의 새 탭 link와 US2의 기존 UI 보존, US3의 final artifact에 의존

### Within Each User Story

- 행동 변경 test는 구현 전에 작성하고 예상 실패를 확인한다.
- 보존 요구는 characterization test로 먼저 고정하며 억지로 실패시키지 않는다.
- Archify schema/common/example을 읽은 다음 tool action은 반드시 candidate JSON 작성이다.
- candidate 수정마다 validate하고 최종 통과 뒤 source를 수정하지 않는다.
- deterministic delivery, browser evidence와 이미지 검토를 서로 대신하지 않는다.

### Parallel Opportunities

- 이 파일럿은 source→artifact→UI verification 의존성이 강해 기본 구현 순서는 직렬이다.
- T014와 T015는 서로 다른 test 책임이므로 US1 완료 뒤 병렬 작성 가능하다.
- T018의 content invariant 검사 준비는 frozen artifact 검증 T019와 파일 경계가 달라 병렬 가능하다.
- final verification의 명령 자체는 결과 추적과 shared build output 때문에 순차 실행한다.

---

## Parallel Example: User Story 2

```text
Task: "T014 — 기존 React viewer와 빈 UI 부재 renderer characterization"
Task: "T015 — 대상 한 건과 다른 작업물 data 회귀 검사"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup과 optional link foundation 완료
2. US1 RED tests 작성·실패 확인
3. 대상 metadata와 조건부 link 최소 구현
4. Archify candidate를 규정 순서로 작성·검증·deliver
5. US1 targeted tests와 standalone viewer를 독립 검증

### Incremental Delivery

1. Foundation → 안전한 선택형 link data contract
2. US1 → 기존 의미와 대응하는 새 탭 viewer
3. US2 → 기존 React experience와 다른 작업물 보존
4. US3 → parity와 source/artifact provenance
5. US4 → keyboard·responsive·perceptual proof
6. 전체 suite, scoped lint, build, fresh production E2E, review와 convergence

### Team Strategy

Archify source freeze와 generated artifact, shared `ProjectSwimlane` 때문에 기본적으로 한 흐름에서 순차 실행한다. 파일 경계가 완전히 분리된 characterization test만 명시적 승인과 실행 환경 허용 시 병렬화한다.

---

## Notes

- `[P]`는 실제 파일 충돌과 선행 의존성이 없을 때만 사용한다. 현재 목록은 순차 실행을 기본으로 하므로 task marker에는 사용하지 않았다.
- 1104 dev server는 사용자 소유이므로 종료·재시작하거나 `.next/dev` lock을 변경하지 않는다.
- build/runtime에 Archify dependency를 추가하지 않고 generated HTML을 직접 편집하지 않는다.
- 관련 없는 파일 포맷, root install, commit·push는 수행하지 않는다.
- temporary Playwright config와 소유한 production process만 정리한다.
- 각 task 완료는 fresh verification evidence가 있을 때만 `[X]`로 변경한다.
- review 결과 기록과 `ROADMAP.md` 갱신은 모든 task 완료 뒤 review·`speckit-converge`가 통과한 루프 종료 단계에서 수행한다.
