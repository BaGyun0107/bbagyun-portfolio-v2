---
description: "하이패스 구조화 상세와 연결 인사이트 정정 작업 목록"
---

# Tasks: 하이패스 B2B 플랫폼 구조화 상세와 연결 인사이트 정정

**Input**: `specs/009-hipass-structured-detail/`의 spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 명세가 TDD를 명시했으므로 각 행동 변경은 실패 테스트를 먼저 작성·실행하고 RED 이유를 기록한 뒤 구현한다.

**Organization**: 공통 인사이트 시각 계약을 먼저 세운 뒤, 작업물과 두 인사이트를 독립 user story 단위로 완성한다. `[P]`는 파일 충돌과 선행 의존성이 없을 때만 병렬화할 수 있다는 표지이며 subagent 사용 승인을 뜻하지 않는다.

## Phase 1: Setup — 범위와 기존 상태 보호

- [X] T001 현재 branch, 공유 worktree 변경, 포트 1104 listener와 `.next/dev` lock, `apps/front` 기준 typecheck·관련 Vitest baseline을 확인하고 결과를 `specs/009-hipass-structured-detail/verification.md`의 사전 상태에 기록한다
- [X] T002 `apps/front/src/data/portfolio/features.ts`, `apps/front/src/data/portfolio/insights.ts`, `apps/front/src/data/portfolio/feature-details/index.ts`에서 세 대상 slug와 기존 연결 관계를 확인하고 결과를 `specs/009-hipass-structured-detail/verification.md`의 사전 상태에 기록해 변경 범위를 확정한다

**Checkpoint**: 사용자 소유 변경과 기존 runtime을 건드리지 않고 RED를 시작할 수 있다.

---

## Phase 2: Foundational — 인사이트 시각 계약과 공통 렌더러

**Purpose**: US2·US3가 공유하는 최소 typed visual과 조건부 renderer를 테스트 우선으로 제공한다.

- [X] T003 [P] `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`에 visual 공통 필수값, variant-kind 일치, 참조 무결성, data-flow success/failure/retry, before/after 패널·scope와 legacy provided 호환 계약을 추가한다
- [X] T004 [P] `apps/front/src/components/insights/insight-visual-rendering.test.tsx`를 추가해 visual 없음, data-flow, before-after, 접근 가능한 제목·질문·대체 설명, 색상 외 상태 표지의 RED를 작성한다
- [X] T005 T003~T004만 실행해 현재 DTO·validator·renderer 부재로 실패하는 RED와 실패 이유를 `specs/009-hipass-structured-detail/verification.md`에 기록한다
- [X] T006 `apps/front/src/data/portfolio/types/insight.dto.ts`에 `InsightVisualBase`, `InsightDataFlowVisual`, `InsightBeforeAfterVisual` 선택형 타입과 `InsightDto.visual?`을 data-model대로 추가한다
- [X] T007 `apps/front/src/data/portfolio/insight-editorial.ts`와 `apps/front/src/data/portfolio/index.ts`에 typed visual deep-copy·validation을 추가하되 visual 없는 legacy insight 동작은 유지한다
- [X] T008 `apps/front/src/components/insights/InsightVisual.tsx`와 `apps/front/src/components/insights/InsightVisualDiagram.tsx`를 추가해 두 variant, 질문·대체 설명, 정상/성공/실패/재시도와 변경 전/후 문자 표지를 렌더링한다
- [X] T009 `apps/front/src/app/(public)/insights/[slug]/page.tsx`에서 visual이 있을 때만 excerpt 뒤·본문 앞에 공통 `InsightVisual`을 한 번 렌더링한다
- [X] T010 T003~T004 테스트를 다시 실행해 foundation GREEN과 legacy insight 빈 UI 부재를 확인한다

**Checkpoint**: 두 인사이트가 같은 선택형 계약으로 독립 시각 자료를 제공할 수 있다.

---

## Phase 3: User Story 1 — 실제 책임과 결과가 보이는 하이패스 작업물 (Priority: P1) 🎯 MVP

**Goal**: 하이패스 작업물을 공통 구조화 상세로 이전하고 역할·운영 지표·결제 보상·검증 한계를 승인 사실로 정정한다.

**Independent Test**: `/projects/hipass-b2b-platform` 하나만 열어 공통 읽기 순서, 네 근거 카드, 결제 스윔레인 하나, 결과와 한계를 이해할 수 있다.

### Tests — 먼저 RED

- [X] T011 [P] [US1] `apps/front/src/data/portfolio/content-quality.test.ts`에 하이패스 메타데이터, 기간·현재 상태, 역할 경계, 네 운영 지표 단위와 금지 주장 0건 계약을 추가한다
- [X] T012 [P] [US1] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 하이패스 structured detail 존재, 네 `measured` metric, swimlane 정확히 1개, 정상·보상·취소 API 실패 stop 경로와 금지 기술 부재 계약을 추가한다
- [X] T013 [P] [US1] `apps/front/src/components/projects/project-detail-rendering.test.tsx`에 하이패스 공통 section 순서, legacy content 비중복, 관련 인사이트 카드 2개 렌더링 RED를 추가한다
- [X] T014 [US1] T011~T013을 실행해 legacy 내용과 structured detail 부재로 실패하는 RED를 기록한다

### Implementation

- [X] T015 [US1] `apps/front/src/data/portfolio/feature-details/hipass-b2b-platform.ts`에 승인된 역할, 네 근거 지표, 문제·제약·실제 선택·구현·결과·회고와 결제·보상 취소 스윔레인 한 개를 작성한다
- [X] T016 [US1] `apps/front/src/data/portfolio/feature-details/index.ts`에 하이패스 detail을 등록하고 기존 validator로 lane/node/edge/exception 무결성을 검사한다
- [X] T017 [US1] `apps/front/src/data/portfolio/features.ts`의 하이패스 description·overview·status를 정정하고 legacy `content`를 제거하되 slug·period·team·tech stack을 보존한다
- [X] T018 [US1] T011~T013을 다시 실행해 US1 GREEN을 확인하고 결제 이중 실패가 자동 복구로 표시되지 않는지 검토한다

**Checkpoint**: 하이패스 작업물만으로 책임, 업무 전환, 실제 규모, 결제 보상 범위와 운영 결과를 읽을 수 있다.

---

## Phase 4: User Story 2 — DB 상태와 JSON 재처리 입력의 분리 (Priority: P1)

**Goal**: 정산 인사이트에서 Outbox/MQ 서사를 제거하고 실제 DB 판단·JSON 입력·재처리 구조와 적용 한계를 제공한다.

**Independent Test**: `/insights/json-outbox-pattern-for-settlement`에서 slug를 유지한 채 정정 제목, 정상·실패·재시도, 단일 서버 적용 조건과 data-flow를 이해할 수 있다.

### Tests — 먼저 RED

- [X] T019 [P] [US2] `apps/front/src/data/portfolio/content-quality.test.ts`에 정산 제목·본문 핵심 사실, 매일 10시·14시, DB 기준·JSON 보조 역할, 단일 PM2 목적과 Outbox/MQ/확정 Redis 로드맵 0건 RED를 추가한다
- [X] T020 [P] [US2] `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`에 정산 project-case, provided data-flow, 질문·대체 설명·비중복 근거와 visual 일치 RED를 추가한다
- [X] T021 [US2] T019~T020을 실행해 현재 legacy 정산 글이 실패하는 이유를 기록한다

### Implementation

- [X] T022 [US2] `apps/front/src/data/portfolio/insights.ts`의 `json-outbox-pattern-for-settlement` 제목·excerpt·본문을 DB 상태, JSON 입력, 성공 제거·실패 보존, 10시·14시 재처리, 단일 PM2와 scale-out 한계 중심으로 다시 쓴다
- [X] T023 [US2] 같은 insight에 approved `provided` editorial metadata와 DB state→JSON input→payout→success/failure→retry `data-flow` visual을 추가한다
- [X] T024 [US2] T019~T020과 foundation renderer 테스트를 실행해 US2 GREEN 및 작업물 결제 흐름과의 비중복을 확인한다

**Checkpoint**: 정산 인사이트가 당시 알지 못한 패턴명을 빌리지 않고 실제 상태·데이터 역할을 설명한다.

---

## Phase 5: User Story 3 — Socket.io 전달 범위와 전달 보장의 분리 (Priority: P1)

**Goal**: 공용 Room에서 화원별 User Room으로 바꾼 사실과 유실·다중 워커 미검증 범위를 함께 공개한다.

**Independent Test**: `/insights/socketio-realtime-architecture-and-reliability`에서 변경 전후 수신 대상과 전달 보장이 별개임을 본문과 visual로 이해할 수 있다.

### Tests — 먼저 RED

- [X] T025 [P] [US3] `apps/front/src/data/portfolio/content-quality.test.ts`에 Socket.io 정정 제목, 신규 Polling 비교, 공용 Room 발견·user room 변경, 다계정 확인, 유실 원인 미규명, PM2 3 worker 관찰 한계와 ACK/DLQ/Redis/k6 주장 0건 RED를 추가한다
- [X] T026 [P] [US3] `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`에 Socket.io project-case, provided architecture, before/after 두 패널, overbroad/intended 범위와 질문·대체 설명·비중복 근거 RED를 추가한다
- [X] T027 [US3] T025~T026을 실행해 현재 legacy Socket.io 글이 실패하는 이유를 기록한다

### Implementation

- [X] T028 [US3] `apps/front/src/data/portfolio/insights.ts`의 `socketio-realtime-architecture-and-reliability` 제목·excerpt·본문을 공용 Room→`user_<gardenId>`, 실제 확인 범위, 유실·cluster 미검증, public/user room 적용 기준으로 다시 쓴다
- [X] T029 [US3] 같은 insight에 approved `provided` editorial metadata와 공용 Room/화원별 User Room `before-after` visual을 추가한다
- [X] T030 [US3] T025~T026과 foundation renderer 테스트를 실행해 US3 GREEN 및 User Room이 전달 보장으로 오해되지 않는지 확인한다

**Checkpoint**: Socket.io 인사이트가 전달 대상 제한과 메시지 도달 보장을 명확히 분리한다.

---

## Phase 6: User Story 4 — 세 시각 자료의 비중복·반응형 읽기 (Priority: P2)

**Goal**: 결제 보상, 정산 재처리, Room 전후 관계를 각각 하나의 시각 자료로 읽고 좁은 화면에서도 겹치지 않게 한다.

**Independent Test**: 세 상세 route를 320/768/1024/1440px로 열어 각 시각 자료가 다른 질문을 답하며 텍스트 대안과 겹침 없는 배치를 제공한다.

### Tests — 먼저 RED

- [X] T031 [P] [US4] `apps/front/src/components/insights/insight-visual-rendering.test.tsx`에 node/actor 순서, branch label, before/after panel, CSS responsive class와 source/target 외 텍스트 관통을 막는 구조 RED를 보강한다
- [X] T032 [P] [US4] `apps/front/e2e/hipass-structured-detail.spec.ts`를 추가해 세 visual 개수·질문·대체 설명, viewport별 document overflow와 node/actor/label bounding-box 겹침 0건을 정의한다
- [X] T033 [US4] T031 단위 테스트만 실행해 미완 스타일/관계 배치의 RED를 확인하고 E2E는 production server 전까지 미실행 상태로 기록한다

### Implementation

- [X] T034 [US4] `apps/front/src/components/insights/InsightVisual.tsx`와 `InsightVisualDiagram.tsx`의 mobile-first grid, 줄바꿈, 선·화살표·label 배치를 조정해 연결선이 비연결 텍스트를 통과하지 않도록 한다
- [X] T035 [US4] 세 시각 자료의 질문·text alternative·non-duplication 내용을 `apps/front/src/data/portfolio/feature-details/hipass-b2b-platform.ts`와 `apps/front/src/data/portfolio/insights.ts`에서 최종 대조한다
- [X] T036 [US4] T031과 관련 project swimlane renderer 테스트를 실행해 단위 GREEN과 기존 공통 스윔레인 회귀 부재를 확인한다

**Checkpoint**: 세 시각 자료가 서로 다른 질문을 답하고 자동화 가능한 반응형 계약을 통과한다.

---

## Phase 7: User Story 5 — 공개 경로와 양방향 연결 유지 (Priority: P1)

**Goal**: 기존 세 URL과 작업물↔인사이트 연결이 목록·상세·키보드 탐색에서 유지된다.

**Independent Test**: 공개 목록에서 세 기록에 진입하고 작업물에서 두 인사이트로, 각 인사이트에서 작업물로 키보드만으로 왕복한다.

### Tests — 먼저 RED

- [X] T037 [P] [US5] `apps/front/src/data/portfolio/content-quality.test.ts`와 `insight-editorial-quality.test.ts`에 세 slug, 두 `featureSlug`, 정정 title link label과 migrated fixture 수량 계약을 추가한다
- [X] T038 [US5] `apps/front/e2e/hipass-structured-detail.spec.ts`와 `portfolio-insight-contract.spec.ts`에 projects/insights 목록 진입, 링크 href·accessible name, Enter 활성화와 404 없음 계약을 추가한다
- [X] T039 [US5] T037을 실행하고 앞선 US2·US3에서 fixture·제목이 단계적으로 갱신되어 통합 계약이 즉시 GREEN인 사실을 기록한다

### Implementation

- [X] T040 [US5] `apps/front/src/data/portfolio/insight-editorial.ts`, `insight-editorial-quality.test.ts`, 필요 시 `apps/front/src/data/portfolio/index.ts`의 migrated project-case 목록·deep-copy fixture를 두 대상 포함 11건 계약으로 갱신한다
- [X] T041 [US5] `apps/front/src/components/projects/ProjectDetailContent.tsx`와 insight sidebar의 기존 공통 링크 구현은 보존하고 T037~T040의 데이터·렌더링 테스트로 정확한 정정 제목과 accessible name 노출을 검증한다
- [X] T042 [US5] T037과 관련 렌더링 테스트를 실행해 US5 단위 GREEN과 기존 공개 slug 회귀 부재를 확인한다

**Checkpoint**: 세 URL과 네 양방향 링크가 공개 데이터 계약에서 유지된다.

---

## Phase 8: Review, Verification, and Handoff

- [X] T043 전체 변경을 `docs/portfolio-interviews/2026-09-04-hipass-b2b-platform.md`, `spec.md`, 두 contract와 대조해 역할·수치·시점·금지 주장·비공개 경계에 대한 콘텐츠 리뷰를 수행한다
- [X] T044 `apps/front`에서 `pnpm exec tsc --noEmit`과 관련 Vitest 5개를 실행하고 결과를 `specs/009-hipass-structured-detail/verification.md`에 기록한다
- [X] T045 `apps/front`에서 `pnpm vitest run` 전체를 실행해 관련 없는 작업물·인사이트 회귀를 확인한다
- [X] T046 실제 변경 파일만 `pnpm exec eslint`로 검사하고 전역 lint baseline과 관련 없는 파일을 수정하지 않았음을 기록한다
- [X] T047 `apps/front`에서 `pnpm run build`를 실행해 세 static route 생성과 production bundle을 확인한다
- [X] T048 quickstart대로 별도 포트 production server와 임시 Playwright config를 만들고 `hipass-structured-detail`, `portfolio-insight-contract`, `swimlane-viewer` E2E를 실행한다
- [X] T049 320px·1440px의 작업물과 두 인사이트를 캡처해 `view_image`로 글자 잘림, node/label/connection 겹침, 의미 오독과 불필요한 가로 스크롤을 검토한다
- [X] T050 임시 Playwright config와 소유한 production process만 정리하고 포트 1104 listener·lock이 유지됐는지 확인한다
- [X] T051 `superpowers:requesting-code-review`와 `superpowers:receiving-code-review` 절차로 구현·콘텐츠 계약을 독립 검토하고 Critical·Important 잔여를 0건으로 만든 뒤 결과를 `specs/009-hipass-structured-detail/verification.md`에 기록한다
- [X] T052 `git diff --check`, `mise run e2e:changed`, `speckit-converge`를 실행하고 결과·잔여 위험·자동/수동 검증을 `specs/009-hipass-structured-detail/verification.md`에 기록한다
- [X] T053 `mise run feature:status:sync`를 실행하고 결정적인 adjacent transition이면 `--apply`로 반영하며 ambiguous/on-hold이면 사용자에게 보고한다
- [X] T054 모든 task가 완료되고 converge가 `Converged`일 때만 root `ROADMAP.md`와 feature handoff 상태를 갱신한다

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1은 즉시 시작한다.
- Phase 2는 Phase 1 이후이며 두 인사이트 구현을 차단한다.
- US1은 Phase 1 후 독립 진행 가능하고, US2·US3는 Phase 2 이후 독립 진행 가능하다.
- US4는 US1·US2·US3와 공통 시각 renderer가 모두 완료된 뒤 진행한다.
- US5 데이터 테스트는 앞선 story와 함께 작성할 수 있지만 최종 제목·연결 검증은 US1~US3 이후다.
- Phase 8은 모든 user story가 GREEN인 뒤 실행한다.

### TDD Ordering

- T003~T005 → T006~T010
- T011~T014 → T015~T018
- T019~T021 → T022~T024
- T025~T027 → T028~T030
- T031~T033 → T034~T036
- T037~T039 → T040~T042
- 각 RED는 구현 전에 실제 실패를 확인하고, 같은 계약의 GREEN을 확인한 뒤 다음 story로 이동한다.

### Parallel Opportunities

- `[P]` 테스트 파일은 서로 다른 파일을 수정할 때만 병렬 작성 가능하다.
- US1 작업물 데이터와 Phase 2 visual foundation은 파일 충돌을 피하면 병렬 가능하다.
- US2와 US3는 둘 다 `insights.ts`와 editorial test를 수정하므로 같은 worktree에서 동시에 구현하지 않는다.
- E2E와 최종 verification은 통합 결과를 다루므로 병렬화하지 않는다.

## Implementation Strategy

1. typed visual foundation의 RED→GREEN을 먼저 완료한다.
2. US1 작업물 구조화를 독립 MVP로 완성한다.
3. US2 정산, US3 Socket.io 인사이트를 각각 RED→GREEN으로 완성한다.
4. US4에서 세 시각 자료를 함께 반응형 검토하고 US5에서 연결을 확정한다.
5. 전체 정적 검증, 별도 포트 production E2E, 수동 시각 검토, converge와 상태 동기화를 순서대로 수행한다.

## Notes

- 이 기능은 사용자-facing UI 변경이므로 E2E 면제 대상이 아니다.
- 구현 중 새로운 사실 판단이 필요하면 임의로 작성하지 않고 인터뷰 기록과 사용자 승인으로 되돌아간다.
- subagent 사용 여부는 별도 사용자 승인과 agent routing 결정에 따른다.
- 구현 단계는 commit하지 않으며 AI는 PR을 merge하지 않는다.

## Requirement Traceability

| 요구사항 | 주 구현·검증 task |
| --- | --- |
| FR-001~FR-008 | T011~T018, T043~T047 |
| FR-009~FR-015 | T019~T024, T043 |
| FR-016~FR-021 | T025~T030, T043 |
| FR-022 | T012, T015, T018, T048 |
| FR-023 | T003~T010, T019~T024, T031~T036, T048 |
| FR-024 | T003~T010, T025~T030, T031~T036, T048 |
| FR-025 | T003~T010, T020, T026, T031~T036, T043, T048~T049 |
| FR-026~FR-027 | T013, T037~T042, T048 |
| FR-028~FR-029 | T031~T038, T048~T050 |
| FR-030 | T001~T002, T043~T046, T051~T052 |
| FR-031 | T011, T019, T025, T043, T051 |
| SC-001~SC-003 | T011~T030, T043~T047 |
| SC-004 | T037~T042, T048 |
| SC-005~SC-007 | T031~T038, T048~T049 |
| SC-008 | T001~T002, T045~T054 |
