---

description: "블랙스톤 벨포레 리조트 구조화 상세 이전 작업 목록"
---

# Tasks: 블랙스톤 벨포레 리조트 구조화 상세 이전

**Input**: Design documents from `specs/006-blackstone-belleforet-resort/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 명세와 사용자가 TDD를 명시적으로 요청했다. 콘텐츠·데이터·회귀 계약을
먼저 작성해 RED를 확인한 뒤 구현하고 GREEN으로 전환한다.

**Organization**: 사용자 스토리별로 묶어 독립적으로 구현·검증할 수 있게 한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 미완료 의존 없음)
- **[Story]**: 해당 사용자 스토리 (US1~US5)
- 모든 작업에 정확한 파일 경로를 포함한다

## Path Conventions

작업 디렉터리는 `apps/front`다. 아래 경로는 모두 저장소 루트 기준이다.
패키지 설치나 루트 lockfile 변경은 하지 않는다.

---

## Phase 1: Setup

- [X] T001 `apps/front/src/data/portfolio/feature-details/index.ts`, `apps/front/src/data/portfolio/types/feature-detail.dto.ts`, `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts`를 읽어 신규 상세 등록 지점과 기존 계약 재사용 범위를 확인한다

---

## Phase 2: Foundational (Blocking Prerequisites)

**목적**: 변경 전 기준선과 테스트 위치를 확인해 이후 RED가 이번 feature에서
추가한 계약 때문임을 구분한다.

- [X] T002 `apps/front`에서 `pnpm vitest run src/data/portfolio/content-quality.test.ts src/data/portfolio/feature-detail-quality.test.ts`와 `pnpm exec tsc --noEmit`을 실행해 현재 기준선을 확인하고 핵심 결과를 `specs/006-blackstone-belleforet-resort/verification.md` 초안에 기록한다

**Checkpoint**: 기존 구조화 2개·legacy 6개 상태의 단위·타입 기준선을 확보한다

---

## Phase 3: User Story 1 — 작업물 간 같은 기준으로 비교 (Priority: P1) 🎯 MVP

**Goal**: 블랙스톤 상세가 기존 두 구조화 상세와 같은 공통 10섹션을 제공한다

**Independent Test**: 블랙스톤 route가 구조화 렌더러를 사용하고 legacy 본문 없이
공통 제목 순서를 제공하는지 확인한다

### Tests (RED 먼저, exact 회귀 계약 원자적 재고정 포함)

- [X] T003 [US1] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 `blackstone-belleforet-resort` 상세가 존재하고 `validateFeatureDetail`을 통과하는 계약을 추가한 뒤 미등록 상태의 RED를 확인한다
- [X] T004 [US1] `apps/front/src/data/portfolio/content-quality.test.ts`에 블랙스톤 상세가 하네스와 같은 필수 섹션 계약을 만족하고 `features.ts`의 legacy `content`가 제거되는지 검사하는 테스트를 추가하고 RED를 확인한다
- [X] T005 [US1] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`의 `LEGACY_FEATURE_CONTENT_FIXTURES`에서 블랙스톤만 제거하고 feature 006 이전 사유를 주석으로 남긴 뒤, 구조화 exact 3개·legacy exact 5개 목록과 legacy 본문 길이를 고정하는 assertion을 구현 전에 갱신해 RED 계약에 포함한다
- [X] T006 [P] [US1] `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`의 `legacyBodyBySlug`에서 블랙스톤만 제거하고 `structuredSlugs`에 블랙스톤을 추가해 전체 8개 길이 assertion을 유지하며 구현 전 fresh E2E가 실패할 exact 경로 계약을 확정한다

### Implementation

- [X] T007 [US1] `apps/front/src/data/portfolio/feature-details/blackstone-belleforet-resort.ts`에 `FeatureDetailDto` 골격을 만든다 — 인터뷰로 확인한 최소 문장과 지표 1개로 validator를 통과시키되 `demo`는 만들지 않는다
- [X] T008 [US1] `apps/front/src/data/portfolio/feature-details/index.ts`에 `BLACKSTONE_BELLEFORET_RESORT_DETAIL` import와 `'blackstone-belleforet-resort'` registry 항목을 추가한다
- [X] T009 [US1] `apps/front/src/data/portfolio/features.ts`의 블랙스톤 `content`를 제거하고 `description`·`overview`를 신규 구축과 1인 백엔드 주도 사실에 맞게 갱신한다
- [X] T010 [US1] `apps/front`에서 `pnpm vitest run src/data/portfolio/content-quality.test.ts src/data/portfolio/feature-detail-quality.test.ts`와 `pnpm exec tsc --noEmit`을 실행해 exact 회귀 fixture를 포함한 US1 전체 계약이 GREEN인지 확인한다

**Checkpoint**: 블랙스톤 route가 구조화 렌더러를 사용하고 구조화 3개·legacy 5개
단위 회귀 계약과 공통 제목을 함께 만족한다

---

## Phase 4: User Story 2 — 근거 범위 안에서 결제 안정화 결과 이해 (Priority: P1)

**Goal**: 지표 네 개가 서로 다른 근거 강도와 한계를 정확히 드러낸다

**Independent Test**: 지표 ID·등급·근거·caveat와 총 결제량·비율 금지를 확인한다

### Tests (RED 먼저)

- [X] T011 [US2] `apps/front/src/data/portfolio/content-quality.test.ts`에 블랙스톤 지표 ID가 data-model.md의 네 개와 정확히 일치하고 모든 지표에 `kind`·`asOf`·`evidence`가 있는지 검사하는 테스트를 추가하고 RED를 확인한다
- [X] T012 [US2] `apps/front/src/data/portfolio/content-quality.test.ts`에 컴플레인 지표가 `reported`이며 시스템 집계 아님·실제 불일치 하한 caveat를 갖고, PMS 평균은 `reported`, 장애 약 1시간은 `measured`인지 검사하는 테스트를 추가하고 RED를 확인한다
- [X] T013 [US2] `apps/front/src/data/portfolio/content-quality.test.ts`에 블랙스톤 공개 텍스트가 총 결제 건수·누적 결제 건수·이를 분모로 한 비율이나 퍼센트를 주장하지 않고, 평일·주말의 회고 기반 대략적 결제량도 성과 분모로 쓰지 않는지 검사하는 테스트를 추가하고 RED를 확인한다

### Implementation

- [X] T014 [US2] `apps/front/src/data/portfolio/feature-details/blackstone-belleforet-resort.ts`의 `highlights`를 data-model.md의 지표 네 개로 채우고 `outcomes`에 근거 범위를 반복하지 않는 결제 안정화 결과를 작성해 T011~T013을 GREEN으로 전환한다

**Checkpoint**: 지표 네 개가 근거와 함께 렌더링되고 파생 총량·비율 주장이 없다

---

## Phase 5: User Story 3 — 사실과 일치하는 판단 과정 (Priority: P1)

**Goal**: 역할은 유지하고 인터뷰와 다른 서술 6종을 공개 경로에서 제거한다

**Independent Test**: 상세와 연결 인사이트에서 금지 문장이 사라지고 실제 순서를
담은 정정 문장이 존재하는지 확인한다

### Tests (RED 먼저)

- [X] T015 [US3] `apps/front/src/data/portfolio/content-quality.test.ts`에 모든 설계를 혼자 했고 1인 백엔드로 전반을 주도했다는 역할 문장과 신규 구축 문장이 존재하며 무중단 전환을 성과로 주장하지 않는지 검사하는 테스트를 추가하고 RED를 확인한다
- [X] T016 [US3] `apps/front/src/data/portfolio/content-quality.test.ts`에 `10건 미만`이 고객 컴플레인 접수 기준과 실제 불일치 하한으로 서술되는지 문장 단위로 고정하고 RED를 확인한다
- [X] T017 [US3] `apps/front/src/data/portfolio/content-quality.test.ts`에 12초 임의 설정 → 업체 평균 약 20초 공유 → 60초 요청 → 30초 UX와 60초 결제 안전성 사이의 선택이 실제 순서로 존재하는지 검사하고 RED를 확인한다
- [X] T018 [US3] `apps/front/src/data/portfolio/content-quality.test.ts`에 2PC·이벤트 소싱 대안표와 환경변수 난독화 대안표가 없고, PHP에서 ORM 트랜잭션을 그대로 쓰기 어려웠던 고민과 React 환경변수 오해 발견이 존재하는지 검사하고 RED를 확인한다
- [X] T019 [US3] `apps/front/src/data/portfolio/content-quality.test.ts`에 WebView 원인이 앱 개발자에게 전달받은 내용으로 한정되고 브릿지 구현은 유지되는지, 연결 인사이트가 프로젝트 중간 발견을 밝히며 무중단·운영 중 핫픽스를 주장하지 않는지 검사하고 RED를 확인한다

### Implementation

- [X] T020 [US3] `apps/front/src/data/portfolio/feature-details/blackstone-belleforet-resort.ts`의 `problem`과 `constraints`를 신규 구축·결제 파편화·API Key 오해와 공개 한계에 맞게 작성한다
- [X] T021 [US3] `apps/front/src/data/portfolio/feature-details/blackstone-belleforet-resort.ts`의 `alternatives`를 실제 검토한 서브도메인 판단, 기존 자산·일정, PHP에서 ORM 트랜잭션을 그대로 쓰기 어려웠던 고민으로 작성하고 근거 없는 대안표 두 개를 만들지 않는다
- [X] T022 [US3] `apps/front/src/data/portfolio/feature-details/blackstone-belleforet-resort.ts`의 `implementation`에 "기존 자산 위의 PHP·React 공존과 인증" 절을 작성한다 — 신규 구축 전제, Nginx 경로 분기, JWT 검증, 전달받은 WebView 원인과 브릿지 구현 포함
- [X] T023 [US3] `apps/front/src/data/portfolio/feature-details/blackstone-belleforet-resort.ts`의 `implementation`에 "결제·예약 보상 흐름과 세 차례 장애 보강" 절을 작성한다 — 자동 보상취소, `resvId` fallback·로그, timeout 실제 순서와 60초 트레이드오프 포함
- [X] T024 [US3] `apps/front/src/data/portfolio/feature-details/blackstone-belleforet-resort.ts`의 `implementation`에 "API Key 오해 발견과 서버 프록시" 및 "더 깊이 읽기" 절을 작성하고 `retrospective`에 임의 timeout·시크릿 경계·진단 가능성 교훈을 작성한다
- [X] T025 [US3] `apps/front/src/data/portfolio/insights.ts`의 `spa-api-key-exposure-and-bff-architecture`에서 "핫픽스" 문맥을 프로젝트 중간 발견 후 즉시 수정한 사실로 좁히고 T015~T019를 GREEN으로 전환한다

**Checkpoint**: 정정 6종의 금지 서술이 0건이고 실제 판단 문장이 모두 존재한다

---

## Phase 6: User Story 5 — 기존 공개 계약 보존 (Priority: P1)

**Goal**: 구조화 3개·legacy 5개·전체 8개 경로를 정확히 다시 고정한다

**Independent Test**: 기존 두 구조화 상세와 남은 다섯 legacy 본문이 보존되고
8개 경로가 빠짐없이 순회되는지 확인한다

### Verification

- [X] T026 [US5] `apps/front`에서 `pnpm vitest run`을 실행해 하네스·한마음·블랙스톤 구조화 exact 3개와 legacy exact 5개의 전체 단위 회귀 계약이 GREEN인지 확인한다

**Checkpoint**: 구현 전 고정한 exact assertion이 약해지지 않고 새 상태를 보호한다

---

## Phase 7: User Story 4 — 결제 실패와 보상취소 흐름 이해 (Priority: P2)

**Goal**: 정상 완료와 확인된 세 장애 분기를 하나의 스윔레인으로 전달한다

**Independent Test**: 스윔레인 1개가 validator를 통과하고 세 exception 설명을
정확히 포함하는지 확인한다

### Tests (RED 먼저)

- [X] T027 [US4] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 블랙스톤 스윔레인이 정확히 1개이며 `validateFeatureDetail`을 통과하는지 검사하는 테스트를 추가하고 RED를 확인한다
- [X] T028 [US4] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 `payment-and-compensation`이 lane 4·step 9·edge 8·exception 3 구조와 응답 미도달·PMS 장애·12초 timeout 분기를 정확히 갖는지 검사하는 테스트를 추가하고 RED를 확인한다

### Implementation

- [X] T029 [US4] `apps/front/src/data/portfolio/feature-details/blackstone-belleforet-resort.ts`의 `swimlanes`에 data-model.md 3절의 `payment-and-compensation`을 작성한다 — start/end 각 1개, 정상 edge 5개, stop exception edge 3개, 텍스트 summary 포함
- [X] T030 [US4] `apps/front`에서 T027·T028 대상 테스트와 전체 `pnpm vitest run`을 실행해 스윔레인 계약과 기존 흐름 회귀가 GREEN인지 확인한다

**Checkpoint**: 결제 스윔레인 1개가 validator와 내용 계약을 모두 통과한다

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T031 `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에 블랙스톤의 공통 10개 제목, 지표 근거 표시, 데모 요소 0개, 연결 인사이트 노출을 검사하는 E2E 시나리오를 추가한다
- [X] T032 `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에 320/768/1024/1440px 문서 overflow와 결제 스윔레인 region 내부 스크롤·키보드 접근·정상/예외 텍스트 구분을 검사하는 E2E 시나리오를 추가한다
- [X] T033 `apps/front`에서 quickstart.md의 순서대로 `pnpm exec tsc --noEmit` → `pnpm vitest run` → 변경 파일만 `pnpm exec eslint` → `pnpm run build` → 별도 프로덕션 포트 fresh E2E → 저장소 루트 `git diff --check`를 실행하고 임시 Playwright 설정을 삭제한다
- [X] T034 `superpowers:requesting-code-review`와 `superpowers:receiving-code-review`로 `specs/006-blackstone-belleforet-resort/` 및 변경 구현을 사실 정확성·회귀 보호·테스트 강제력·문장 품질 관점에서 검토하고 Critical·Important 지적을 해소한다
- [X] T035 `specs/006-blackstone-belleforet-resort/verification.md`에 baseline, TDD RED/GREEN, 검증 명령과 핵심 출력, 리뷰 결과, 잔여 위험, 임시 E2E 설정 삭제를 기록한다
- [X] T036 `ROADMAP.md`의 feature 006 상태를 완료로 갱신하고 다음 인터뷰 대상에서 블랙스톤을 제거한다 — 이 저장소에는 `mise run feature:status:sync`가 없으므로 수동 상태 정본을 사용한다

---

## Phase 9: 2026-08-25 후속 사실 정정

**Goal**: PMS 응답 지연과 fallback을 확정 사실보다 강하게 표현한 부분을 제거하고,
현재 진행 중인 운영 관찰 및 timeout 설계 교훈만 근거 범위 안에서 남긴다.

### Tests (RED 먼저)

- [X] T037 [US2] `apps/front/src/data/portfolio/content-quality.test.ts`에서 결과 지표를 컴플레인 접수 불일치와 `2024년 오픈 ~ 현재 진행 중` 운영 관찰 기간 두 개로 exact 고정하고, PMS 20초·1시간 카드가 없음을 검사해 RED를 확인한다
- [X] T038 [US3] `apps/front/src/data/portfolio/content-quality.test.ts`에서 WebView 제약의 불필요한 공개 제한 문장을 제거하고, 20초가 정상 평균이 아니라 당시 API 문제로 지연된 값이며 현재는 수정됐다는 timeout 교훈을 문장 단위로 고정해 RED를 확인한다
- [X] T039 [US4] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에서 결제 스윔레인과 회고에 `fallback`·`resvId`·`tid`가 없고, PMS 장애는 로그로 확인한 범위만 남는지 검사해 RED를 확인한다
- [X] T040 `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에서 지표 2개와 수정된 결제 스윔레인 문구를 검사하도록 공개 흐름 계약을 갱신한다

### Implementation and Verification

- [X] T041 `docs/portfolio-interviews/2026-08-24-blackstone-belleforet-resort.md`와 `docs/portfolio-interviews/2026-08-24-codex-handoff.md`에 2026-08-25 후속 정정이 기존 결론을 대체함을 기록한다
- [X] T042 `specs/006-blackstone-belleforet-resort/`의 spec·plan·research·data-model·quickstart를 후속 사실 정정과 일치시킨다
- [X] T043 `apps/front/src/data/portfolio/feature-details/blackstone-belleforet-resort.ts`에서 카드·제약·timeout·스윔레인·결과·회고를 최소 범위로 수정해 T037~T040을 GREEN으로 전환한다
- [X] T044 변경 범위 lint·typecheck·전체 Vitest·프로덕션 build·별도 포트 fresh E2E·`git diff --check`를 실행하고 `verification.md`에 후속 검증 결과와 잔여 위험을 기록한다
- [X] T045 `speckit-converge` 관점에서 후속 정정과 공개 콘텐츠가 일치하고 미완료 task가 0건인지 확인한다

---

## Dependencies

```text
Phase 1 (T001)
  └─> Phase 2 (T002)
        └─> Phase 3 US1 (T003~T010)
              └─> Phase 4 US2 (T011~T014)
                    └─> Phase 5 US3 (T015~T025)
                          └─> Phase 6 US5 (T026)
                                └─> Phase 7 US4 (T027~T030)
                                      └─> Phase 8 (T031~T036)
                                            └─> Phase 9 (T037~T045)
```

**핵심 의존 관계**

- US1에서 unit·E2E exact 회귀 계약을 구현 전에 원자적으로 새 상태로 옮긴 뒤
  신규 상세 파일과 registry를 만든다. US2·US3·US4는 같은 파일을 증분 완성한다.
- US2 지표 계약은 `outcomes` 서술의 근거 경계를 먼저 고정하고, US3가 나머지
  본문과 연결 인사이트를 완성한다.
- US5는 US1에서 미리 고정한 exact fixture가 전체 단위 회귀 실행에서도 유지되는지
  검증하며 assertion을 다시 편집하지 않는다.
- US4 스윔레인은 본문 사실이 안정된 뒤 작성해 근거 없는 단계를 추가하지 않는다.
- T031~T036은 모든 구현·단위 테스트가 완료된 뒤 실행한다.

## Parallel Opportunities

- T006은 unit RED 계약 T003~T005와 파일이 달라 병렬 가능하지만 신규 데이터 구현
  T007보다 먼저 완료한다.
- 사실 정정 테스트 T015~T019는 같은 테스트 파일을 수정하므로 순차 실행한다.
- 신규 상세 구현 T020~T024도 같은 파일을 수정하므로 순차 실행한다.
- E2E T031·T032는 같은 파일을 수정하므로 순차 실행한다.
- 사용자 스토리 사이에는 동일 데이터 파일 의존성이 있어 병렬 구현하지 않는다.

## Implementation Strategy

**MVP 범위**: Phase 1~3 (T001~T010)

여기까지 완료하면 블랙스톤 route가 구조화 상세 렌더러를 사용하고 기존 두
작업물과 같은 읽기 순서 및 exact 회귀 목록을 제공한다.

**증분 전달 순서**

1. US1 — exact 회귀 계약을 먼저 재고정하고 구조화 형식 통일
2. US2 — 지표 근거와 금지 수치 고정
3. US3 — 역할 유지와 사실 오류 6종 정정
4. US5 — 전체 단위 회귀에서 exact 공개 계약 확인
5. US4 — 결제·보상취소 스윔레인 1개 추가

각 사용자 스토리에서 테스트를 먼저 작성해 RED를 확인하고 해당 구현 뒤 GREEN을
확인한다. 구현 단계에서는 commit·stage하지 않는다.
