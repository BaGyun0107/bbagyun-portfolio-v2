---

description: "호텔 예약 플랫폼 구조화 상세와 연결 인사이트 정정 작업 목록"
---

# Tasks: 호텔 예약 플랫폼 구조화 상세와 연결 인사이트 정정

**Input**: Design documents from `specs/010-hotel-reservation-platform/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 사용자 요청과 헌법 원칙에 따라 테스트 우선 개발(TDD)을 적용한다. 각 story의 RED task를 먼저 실행해 실패를 확인한 뒤 implementation task로 진행한다.

**Organization**: Tasks are grouped by user story so each public reading goal can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일을 변경하고 미완료 task에 의존하지 않아 병렬 실행 가능한 작업
- **[Story]**: spec.md의 사용자 story 매핑
- 모든 task는 실제 대상 파일 경로를 포함한다

## Phase 1: Setup (Shared Baseline)

**Purpose**: 공유 worktree와 사용자 소유 1104 서버의 기준선을 보존한다.

- [X] T001 현재 변경 파일, 1104 listener PID, 세 기존 route의 200 응답과 승인 전 화면 캡처를 `specs/010-hotel-reservation-platform/verification.md`에 기준선으로 기록한다

---

## Phase 2: Foundational (Shared Visual Contract)

**Purpose**: 두 인사이트가 공유할 기존 visual 계약을 일반 흐름과 컴포넌트 관계에 맞게 확장하되 하이패스 의미를 보존한다.

**⚠️ CRITICAL**: 아래 RED와 공통 계약 task를 완료하기 전에는 US2·US3의 visual 데이터를 추가하지 않는다.

- [X] T002 [P] 일반 `data-flow`가 normal edge만 가질 수 있고 일반 `before-after`가 indirect·direct 관계를 사용할 수 있어야 한다는 RED와 기존 하이패스 고유 outcome·scope 회귀 검사를 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`에 추가하고 실패를 확인한다
- [X] T003 [P] source·relay·boundary·consumer actor와 indirect·direct 관계가 문자·data attribute로 구분되어야 한다는 RED를 `apps/front/src/components/insights/insight-visual-rendering.test.tsx`에 추가하고 실패를 확인한다
- [X] T004 `InsightArchitectureActor` 역할과 `InsightArchitectureConnection` 범위를 일반화하는 타입을 `apps/front/src/data/portfolio/types/insight.dto.ts`에 추가한다
- [X] T005 공통 visual 검증은 참조 무결성·필수 텍스트·패널별 관계를 검사하고 하이패스 고유 규칙은 대상 fixture에서 검사하도록 `apps/front/src/data/portfolio/insight-editorial.ts`와 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`를 수정해 T002를 통과시킨다
- [X] T006 확장된 actor 역할과 indirect·direct 관계의 보이는 label·스타일·data attribute를 `apps/front/src/components/insights/InsightVisualDiagram.tsx`에 반영해 T003을 통과시키고 기존 하이패스 visual renderer 회귀를 확인한다

**Checkpoint**: 두 기존 visual variant가 하이패스와 Feature 010의 의미를 모두 왜곡 없이 표현할 수 있다.

---

## Phase 3: User Story 1 - 플랫폼화의 진화와 실제 책임 (Priority: P1) 🎯 MVP

**Goal**: 작업물을 공통 구조화 상세로 이전하고 두 단계 플랫폼화, 역할, 구현·검증 범위와 실제 결과를 승인 사실대로 공개한다.

**Independent Test**: `/projects/hotel-reservation-platform`에서 역할, 두 시기, 세 코드 배치 경계, 플랫폼별 배포, 패리티 사건, Context·NICEPAY 한계와 운영 결과를 읽고 금지 주장이 0건인지 확인한다.

### Tests for User Story 1 ⚠️

- [X] T007 [P] [US1] 기존 legacy fixture 제거, 새 metadata·기간·역할·금지 주장과 고객 정보·시크릿·비공개 소스·내부 감사 수치 비노출 계약을 `apps/front/src/data/portfolio/content-quality.test.ts`와 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 먼저 추가하고 실패를 확인한다
- [X] T008 [P] [US1] 호텔 예약 구조화 상세의 공통 읽기 순서, highlight 근거, 관련 인사이트와 legacy Markdown 부재에 대한 RED를 `apps/front/src/components/projects/project-detail-rendering.test.tsx`에 추가하고 실패를 확인한다
- [X] T009 [P] [US1] 플랫폼 분류·검증·배포와 패리티 복구 edge의 유효성·비충돌 RED를 `apps/front/src/components/projects/project-swimlane-layout.test.ts`와 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 추가하고 실패를 확인한다

### Implementation for User Story 1

- [X] T010 [US1] 승인된 역할·지표·문제·제약·대안·구현·결과·회고와 정확히 1개 swimlane을 `apps/front/src/data/portfolio/feature-details/hotel-reservation-platform.ts`에 작성한다
- [X] T011 [US1] 새 detail을 `apps/front/src/data/portfolio/feature-details/index.ts`에 등록하고 `apps/front/src/data/portfolio/features.ts`의 설명·개요·기간을 정정하며 legacy `content`를 제거한다
- [X] T012 [US1] T007~T009를 실행해 작업물 사실·구조·swimlane 계약이 GREEN인지 확인하고 필요한 데이터 조정은 `apps/front/src/data/portfolio/feature-details/hotel-reservation-platform.ts`에만 반영한다

**Checkpoint**: 작업물 상세만으로 두 단계 플랫폼화와 근거 한계를 독립적으로 읽을 수 있다.

---

## Phase 4: User Story 2 - 설정 이후의 코드 경계 판단 (Priority: P1)

**Goal**: 첫 인사이트가 Config 이후 공통 동작·값·화면 및 로직 차이를 어디에 배치할지에만 답한다.

**Independent Test**: `/insights/config-driven-architecture-react`에서 승인된 제목·본문·적용/회피 조건·한계와 normal edge만 사용하는 data-flow를 확인한다.

### Tests for User Story 2 ⚠️

- [X] T013 [US2] 승인 제목·대표 문장·금지 주장·project-case source·provided data-flow·비중복 이유에 대한 RED를 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`에 추가하고 실패를 확인한다
- [X] T014 [P] [US2] 코드 경계 visual의 질문, 세 분류 node·normal edge와 동등한 텍스트 대안에 대한 RED를 `apps/front/src/components/insights/insight-visual-rendering.test.tsx`에 추가하고 실패를 확인한다

### Implementation for User Story 2

- [X] T015 [US2] `config-driven-architecture-react`의 제목·excerpt·본문·editorial metadata·data-flow를 `apps/front/src/data/portfolio/insights.ts`에서 승인 문안으로 교체한다
- [X] T016 [US2] 대상 인사이트를 migrated inventory로 전환하고 제목·source·visual expectation·legacy hash 제거를 `apps/front/src/data/portfolio/insight-editorial.ts`와 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`에 반영해 T013~T014를 통과시킨다

**Checkpoint**: 첫 인사이트는 프로젝트 전체 연혁을 반복하지 않고 코드 배치 기준만 독립적으로 설명한다.

---

## Phase 5: User Story 3 - 예약 Context의 소유 범위 판단 (Priority: P1)

**Goal**: 두 번째 인사이트가 Props Drilling과 예약 라우터 범위 생명주기 판단에만 답한다.

**Independent Test**: `/insights/context-api-encapsulation-and-router-level-isolation`에서 Redux 비교, route-scoped Provider 선택, props 전달 감소·생명주기 경계와 접근 통제·성능 한계를 확인한다.

### Tests for User Story 3 ⚠️

- [X] T017 [US3] 승인 제목·대표 문장·금지 주장·project-case source·provided before-after·비중복 이유에 대한 RED를 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`에 추가하고 실패를 확인한다
- [X] T018 [P] [US3] Before의 source→relay→consumer indirect 관계와 After의 boundary→consumer direct 관계 및 텍스트 대안에 대한 RED를 `apps/front/src/components/insights/insight-visual-rendering.test.tsx`에 추가하고 실패를 확인한다

### Implementation for User Story 3

- [X] T019 [US3] `context-api-encapsulation-and-router-level-isolation`의 제목·excerpt·본문·editorial metadata·before-after visual을 `apps/front/src/data/portfolio/insights.ts`에서 승인 문안으로 교체한다
- [X] T020 [US3] 대상 인사이트를 migrated inventory로 전환하고 제목·source·visual expectation·legacy hash 제거를 `apps/front/src/data/portfolio/insight-editorial.ts`와 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`에 반영해 T017~T018을 통과시킨다

**Checkpoint**: 두 번째 인사이트는 Provider Hell·Zustand·접근 통제·성능 성과 없이 상태 소유 범위를 독립적으로 설명한다.

---

## Phase 6: User Story 5 - 공개 경로와 출처 연결 유지 (Priority: P1)

**Goal**: 기존 세 slug, 목록 진입, 작업물↔인사이트 양방향 연결과 키보드 탐색을 유지한다.

**Independent Test**: 세 route가 200으로 응답하고 작업물의 인사이트 링크 2개와 각 인사이트의 작업물 링크 2개를 keyboard Enter로 활성화할 수 있는지 확인한다.

### Tests for User Story 5 ⚠️

- [X] T021 [US5] 정정된 두 제목의 inventory, 기존 route, sourceSlug와 양방향 링크에 대한 RED를 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`와 `apps/front/e2e/portfolio-insight-contract.spec.ts`에 추가하고 실패를 확인한다

### Implementation for User Story 5

- [X] T022 [US5] 정정된 제목·기존 slug·`hotel-reservation-platform` source 연결을 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`, `apps/front/e2e/portfolio-insight-contract.spec.ts`, `apps/front/src/data/portfolio/insights.ts`에서 일치시킨다
- [X] T023 [US5] 세 route와 양방향 keyboard navigation test를 실행해 GREEN을 확인하고 필요한 연결 데이터는 `apps/front/src/data/portfolio/features.ts`와 `apps/front/src/data/portfolio/insights.ts`에서만 수정한다

**Checkpoint**: 기존 주소와 출처 관계를 깨뜨리지 않고 세 공개 기록을 왕복할 수 있다.

---

## Phase 7: User Story 4 - 서로 다른 세 시각 판단 (Priority: P2)

**Goal**: 작업물 swimlane, 코드 경계 data-flow, Context before-after가 서로 다른 질문을 답하고 모든 지원 폭에서 읽힌다.

**Independent Test**: 세 대상 route에서 visual이 하나씩 표시되고 질문·텍스트 대안·node/actor/edge가 중복 없이 읽히며 320/768/1024/1440px에서 overflow와 핵심 요소 겹침이 0건인지 확인한다.

### Tests for User Story 4 ⚠️

- [X] T024 [US4] 세 route의 visual 종류·질문·텍스트 대안, 지원 폭 overflow·요소 겹침을 검사하는 Playwright RED를 `apps/front/e2e/hotel-reservation-platform.spec.ts`에 작성하고 기존 화면에서 실패를 확인한다
- [X] T025 [P] [US4] 세 visual의 질문과 non-duplication reason이 서로 다르고 NICEPAY 전용 visual이 생기지 않는 계약을 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`와 `apps/front/src/data/portfolio/insight-editorial-quality.test.ts`에 추가한다

### Implementation for User Story 4

- [X] T026 [US4] T024~T025와 1104 화면을 기준으로 node·actor·relation label 줄바꿈과 배치를 `apps/front/src/components/insights/InsightVisualDiagram.tsx` 및 `apps/front/src/data/portfolio/feature-details/hotel-reservation-platform.ts`에서 조정한다
- [X] T027 [US4] 1104에서 세 신규 visual과 기존 하이패스 두 visual을 캡처·검토하고 결과를 `specs/010-hotel-reservation-platform/verification.md`에 기록하되 1104 process를 종료·재시작하지 않는다

**Checkpoint**: 세 visual의 화면 역할과 반응형 읽기 상태가 서로 독립적으로 확인된다.

---

## Phase 8: Polish & Cross-Cutting Verification

**Purpose**: 전체 회귀, 실제 화면, 문서 증거와 feature 상태를 마무리한다.

- [X] T028 관련 typecheck와 Vitest를 `apps/front`에서 `pnpm exec tsc --noEmit` 및 `specs/010-hotel-reservation-platform/quickstart.md`의 scoped test 명령으로 실행한다
- [X] T029 전체 Vitest를 `apps/front`에서 `pnpm vitest run`으로 실행해 다른 작업물·인사이트와 기존 하이패스 visual 회귀를 확인한다
- [X] T030 실제 변경 TS/TSX와 E2E 파일만 `specs/010-hotel-reservation-platform/quickstart.md`의 scoped ESLint 명령으로 검사하고 저장소 전역 baseline은 건드리지 않는다
- [X] T031 production build를 `apps/front`에서 `pnpm run build`로 실행한다
- [X] T032 포트 12112 가용성을 확인하고 `apps/front/playwright.feature-010.prod.config.ts`를 임시 생성한 뒤 소유한 production server에서 Feature 010·공통 인사이트·하이패스·swimlane E2E를 실행한다
- [X] T033 320px·1440px의 세 대상 화면을 production server에서 캡처하고 `view_image`로 잘림·겹침·오독 가능성을 검토해 `specs/010-hotel-reservation-platform/verification.md`에 기록한다
- [X] T034 임시 `apps/front/playwright.feature-010.prod.config.ts`를 삭제하고 소유한 production process만 종료한 뒤 포트 12112 해제와 1104 listener 보존을 확인한다
- [X] T035 `git diff --check`, `mise run e2e:changed`, `mise run feature:status:sync`를 실행하고 존재하지 않거나 baseline 때문에 실패한 task는 우회하지 않고 `specs/010-hotel-reservation-platform/verification.md`에 기록한다
- [X] T036 최종 명령·핵심 출력·브라우저 증거·검토 결과·잔여 위험을 `specs/010-hotel-reservation-platform/verification.md`에 정리한다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 이후 진행하며 US2·US3 visual data를 차단
- **US1 (Phase 3)**: Setup 이후 독립 진행 가능. Foundational과 파일 충돌이 없어 병렬 가능
- **US2 (Phase 4)**: Foundational 완료 후 진행
- **US3 (Phase 5)**: Foundational 완료 후 진행. `insights.ts`와 editorial fixture를 US2와 공유하므로 기본 순서는 US2 다음
- **US5 (Phase 6)**: US1~US3의 제목·source 연결 완료 후 진행
- **US4 (Phase 7)**: US1~US3 완료 후 세 visual 통합 검증
- **Polish (Phase 8)**: 원하는 모든 story 완료 후 진행

### User Story Dependencies

- **US1**: Setup 이후 독립 구현 가능
- **US2**: Foundational visual 일반화에 의존
- **US3**: Foundational visual 일반화에 의존하며 shared data 충돌 방지를 위해 US2 이후 권장
- **US4**: US1·US2·US3의 세 visual에 의존
- **US5**: US1·US2·US3의 최종 slug·title·source에 의존

### Within Each User Story

- Tests MUST be written and fail before implementation
- 승인 콘텐츠와 visual data를 먼저 작성한 뒤 inventory·hash·route 기대값을 동기화
- 정적 계약 GREEN 뒤 실제 브라우저 배치 검증
- story checkpoint를 통과한 뒤 다음 shared file 작업으로 이동

### Parallel Opportunities

- T002와 T003은 다른 test 파일이므로 병렬 가능
- Foundational 완료 뒤 US1의 새 detail module 작업과 US2의 insight test 준비는 다른 파일에서 병렬 가능
- T007~T009는 서로 다른 test 책임으로 병렬 가능
- T014와 T013, T018과 T017은 renderer test와 editorial test로 각각 병렬 가능
- T025는 E2E RED T024와 다른 파일에서 병렬 가능
- shared `insights.ts`, `insight-editorial.ts`, `insight-editorial-quality.test.ts` 수정은 충돌 방지를 위해 순차 진행

---

## Parallel Example: Foundational + US1

```text
Task: "T002 — editorial visual validator RED"
Task: "T003 — visual renderer RED"

Foundation 이후:
Task: "T007 — 작업물 콘텐츠 계약 RED"
Task: "T008 — 작업물 renderer RED"
Task: "T009 — swimlane layout RED"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 baseline
2. Write US1 RED tests
3. Migrate the project detail and metadata
4. Validate US1 independently before insight edits

### Incremental Delivery

1. Baseline + shared visual contract → two approved visual meanings can be represented
2. US1 → project structured detail and swimlane
3. US2 → code-boundary insight and data-flow
4. US3 → route-scoped Context insight and before-after
5. US4 → cross-screen visual/readability proof
6. US5 → stable routes and bidirectional links
7. Full regression, production E2E, evidence, convergence

### Team Strategy

구현은 shared content files 때문에 기본적으로 순차 진행한다. 독립 RED test나 새 detail module처럼 파일 경계가 분명한 작업만 명시적 승인과 실행 환경 허용 시 병렬화한다.

---

## Notes

- `[P]`는 실제 파일 충돌과 선행 의존성이 없을 때만 사용한다.
- 1104 dev server는 사용자 소유이므로 종료·재시작하지 않는다.
- 최종 E2E는 별도 production port에서 수행하고 임시 config를 반드시 제거한다.
- 관련 없는 파일 포맷, root install, 비공개 원본 저장소 수정, commit·push는 수행하지 않는다.
- 각 task 완료는 fresh verification evidence가 있을 때만 `[X]`로 변경한다.
