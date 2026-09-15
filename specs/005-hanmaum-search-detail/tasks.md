---

description: "한마음과학원 법문검색 구조화 상세 이전 작업 목록"
---

# Tasks: 한마음과학원 법문검색 구조화 상세 이전

**Input**: Design documents from `specs/005-hanmaum-search-detail/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 사용자가 TDD를 명시적으로 요청했다. 모든 구현 작업은 RED 확인 후
GREEN 전환 순서를 따른다.

**Organization**: 사용자 스토리별로 묶어 독립적으로 구현·검증할 수 있게 한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 미완료 의존 없음)
- **[Story]**: 해당 사용자 스토리 (US1~US5)
- 모든 작업에 정확한 파일 경로를 포함한다

## Path Conventions

작업 디렉터리는 `apps/front`다. 아래 경로는 모두 저장소 루트 기준으로 적는다.

---

## Phase 1: Setup

- [X] T001 `apps/front/src/data/portfolio/feature-details/` 아래 신규 파일 경로와 registry 등록 지점을 확인하고, `apps/front/src/data/portfolio/feature-details/index.ts`의 `featureDetails` 객체 구조를 파악한다

---

## Phase 2: Foundational (Blocking Prerequisites)

**목적**: 모든 사용자 스토리가 의존하는 데이터 골격을 만든다. 이 단계가
끝나야 US1~US5 검증이 의미를 갖는다.

- [X] T002 `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts`에 `FeatureDetailDto` 골격을 만든다 — `role`, `problem`, `constraints`, `alternatives`, `implementation`, `outcomes`, `retrospective`를 빈 문자열이 아닌 최소 문장으로 채우고 `highlights`는 빈 배열, `swimlanes`는 생략한다
- [X] T003 `apps/front/src/data/portfolio/feature-details/index.ts`의 `featureDetails`에 `'hanmaum-science-institute'` 항목을 등록하고 import를 추가한다

**Checkpoint**: `getFeatureDetailBySlug('hanmaum-science-institute')`가 null이 아니다

---

## Phase 3: User Story 1 — 작업물 간 같은 기준으로 비교 (Priority: P1)

**Goal**: 한마음 상세가 하네스와 동일한 공통 제목을 동일한 순서로 제공한다

**Independent Test**: 한마음 상세 경로에서 공통 10개 `h2`가 승인된 읽기
순서로 렌더링되는지 확인한다

### Tests (RED 먼저)

- [X] T004 [US1] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 구조화 상세 보유 목록을 `['codi-harness-dx-platform', 'hanmaum-science-institute']`로 고정하는 테스트를 추가하고 RED를 확인한다
- [X] T005 [P] [US1] `apps/front/src/data/portfolio/content-quality.test.ts`에 한마음 상세가 하네스와 동일한 공통 섹션 계약을 만족하는지 검사하는 테스트를 추가하고 RED를 확인한다

### Implementation

- [X] T006 [US1] `apps/front/src/data/portfolio/features.ts`의 `hanmaum-science-institute` 항목에서 `content` 필드를 제거하고, `description`과 `overview`를 data-model.md 1절에 따라 갱신한다
- [X] T007 [US1] T004·T005가 GREEN인지 확인하고, `pnpm exec tsc --noEmit`으로 타입을 검증한다

**Checkpoint**: 한마음 route가 구조화 렌더러를 사용하고 공통 제목이 표시된다

---

## Phase 4: User Story 2 — 검증 가능한 근거로 성능 개선 이해 (Priority: P1)

**Goal**: 모든 수치 지표가 근거 종류·기준 시점·근거 설명을 갖는다

**Independent Test**: 검색 응답 지표의 근거 문구가 측정 도구와 비교 조건을
명시하는지 확인한다

### Tests (RED 먼저)

- [X] T008 [US2] `apps/front/src/data/portfolio/content-quality.test.ts`에 한마음 지표가 **정확히 3개**임을 고정하고(FR-008: 복원되지 않은 값을 추가하지 않음), 각 지표의 `kind`·`asOf`·`evidence` 존재와 검색 응답 지표 근거에 측정 대상(브라우저 네트워크 응답)과 비교 조건(동일 검색어·전량 적재·반복 관측)이 포함되는지 검사하는 테스트를 추가하고 RED를 확인한다
- [X] T009 [P] [US2] 적재 소요 지표가 `measured`가 아니며 계측 기록 부재를 `caveat`로 밝히는지 검사하는 테스트를 `apps/front/src/data/portfolio/content-quality.test.ts`에 추가하고 RED를 확인한다

### Implementation

- [X] T010 [US2] `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts`의 `highlights`에 data-model.md 2절의 지표 3개를 채운다 — `search-response-time`(measured), `source-volume`(reported), `ingestion-duration`(reported + caveat)
- [X] T011 [US2] `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts`의 `outcomes`에 검색 응답 개선과 측정 조건을 서술하고 근거 등급을 본문에서도 구분한다

**Checkpoint**: 지표 3개가 근거와 함께 렌더링되고 T008·T009가 GREEN이다

---

## Phase 5: User Story 3 — 사실과 일치하는 구현 서술 (Priority: P1)

**Goal**: 인터뷰에서 사실과 다르다고 확인된 서술 3건이 공개 본문에 0건 남는다

**Independent Test**: 공개 본문에서 세 가지 오류 문구가 검출되지 않는지 확인한다

### Tests (RED 먼저)

- [X] T012 [US3] `apps/front/src/data/portfolio/content-quality.test.ts`에 최소 토큰 길이를 버전이 강제했다는 서술이 없고, 낮추려 시도했으나 적용되지 않았다는 사실과 토큰화 방식 차이 설명이 존재하는지 검사하는 테스트를 추가하고 RED를 확인한다
- [X] T013 [P] [US3] `apps/front/src/data/portfolio/content-quality.test.ts`에 파싱 실행이 서버 업로드 처리로 서술되고 "로컬 스크립트 채택" 대안 비교가 없는지 검사하는 테스트를 추가하고 RED를 확인한다
- [X] T014 [P] [US3] `apps/front/src/data/portfolio/content-quality.test.ts`에 외부 검색 엔진이 "검토 후 기각"이 아니라 비용으로 시도하지 못한 것으로 서술되는지 검사하는 테스트를 추가하고 RED를 확인한다

### Implementation

- [X] T015 [US3] `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts`의 `implementation`에 "하이브리드 검색" 소제목을 작성한다 — 2단계 역할 분리와 research.md D-003의 최소 토큰 길이 정정 4항목을 포함한다
- [X] T016 [US3] `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts`의 `implementation`에 "비정형 원문 파싱과 적재" 소제목을 작성한다 — 서버 업로드 처리와 신규/갱신 단일 경로를 포함한다 (research.md D-004)
- [X] T017 [US3] `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts`의 `alternatives`를 작성한다 — 외부 검색 엔진을 비용으로 시도하지 못했다는 사실로 서술한다 (research.md D-004b)
- [X] T018 [US3] `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts`의 `problem`과 `constraints`를 data-model.md 2절에 따라 작성한다

**Checkpoint**: T012·T013·T014가 GREEN이고 사실 오류가 0건이다

---

## Phase 6: User Story 5 — 기존 공개 계약 보존 (Priority: P1)

**Goal**: 이전 후에도 하네스와 남은 6개 작업물의 공개 내용이 유지된다

**Independent Test**: 전체 작업물 경로와 legacy 본문 보존을 확인한다

**Note**: US5는 US1~US3와 같은 P1이며 회귀 보호이므로 US4보다 먼저 처리한다

### Tests (원자적 재고정)

- [X] T019 [US5] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`의 `LEGACY_FEATURE_CONTENT_FIXTURES`에서 `hanmaum-science-institute` 항목을 제거해 7개에서 6개로 재고정하고, 변경 이유를 주석으로 남긴다 (나머지 6개는 그대로 유지)
- [X] T020 [US5] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`의 "구조화 상세은 하네스 하나뿐" 테스트 제목과 assertion을 구조화 2개 목록·legacy 6개 목록을 각각 고정하는 형태로 갱신한다 — assertion을 삭제하지 않는다
- [X] T021 [US5] `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`의 레거시 본문 snippet 맵에서 한마음 항목을 제거하고, 하네스 상세 계약 검증이 그대로 통과하는지 확인한다

### Implementation

- [X] T022 [US5] `pnpm vitest run`으로 전체 단위 테스트가 통과하는지 확인한다

**Checkpoint**: 회귀 계약이 새 상태로 고정되고 전체 단위 테스트가 GREEN이다

---

## Phase 7: User Story 4 — 실패 대응 흐름 이해 (Priority: P2)

**Goal**: 예외 롤백과 검증 롤백이 구분되고 실패 대응 흐름이 드러난다

**Independent Test**: 두 롤백 장치가 구분 서술되고 스윔레인이 실패·복구
경로를 표현하는지 확인한다

### Tests (RED 먼저)

- [X] T023 [US4] `apps/front/src/data/portfolio/content-quality.test.ts`에 예외 롤백과 검증 롤백이 구분 서술되고, 도입 경위(실패 후 원인 지점 파악)와 대응 방식(원본이 아닌 규칙 보완)이 존재하는지 검사하는 테스트를 추가하고 RED를 확인한다
- [X] T024 [P] [US4] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 한마음 스윔레인이 2개이고 `validateFeatureDetail`을 통과하는지 검사하는 테스트를 추가하고 RED를 확인한다

### Implementation

- [X] T025 [US4] `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts`의 `implementation`에 "검증 롤백" 소제목을 작성한다 — 예외 롤백과의 차이, 도입 경위, 원본이 아닌 규칙을 보완한 대응 방식을 포함한다 (research.md D-005)
- [X] T026 [US4] `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts`의 `swimlanes`에 `ingestion-and-recovery`를 data-model.md 3.1절의 lane 4·step 7·edge 7·exception 2 구조로 작성한다
- [X] T027 [US4] `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts`의 `swimlanes`에 `search-request-flow`를 data-model.md 3.2절의 lane 3·step 5·edge 4·exception 0 구조로 작성한다 — 분기의 구체적 임계값은 명시하지 않는다
- [X] T028 [US4] `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts`의 `retrospective`를 작성한다 — 기존 두 항목(검색 엔진 고도화, 보안 설계 성숙)을 유지하되 본문 반복을 피하고, 실패에서 진단 가능성을 얻는 장치를 만들었다는 교훈을 추가한다

**Checkpoint**: 스윔레인 2개가 검증기를 통과하고 T023·T024가 GREEN이다

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T029 `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts`의 `implementation` 마지막에 "더 깊이 읽기"로 연결 인사이트를 링크하고, 하네스와 동일한 방식으로 노출되는지 확인한다
- [X] T030 [P] 한마음 상세에 `demo` 필드가 없고 데모 관련 요소가 렌더링되지 않는지 E2E로 확인하는 테스트를 `apps/front/e2e/`에 추가한다
- [X] T031 [P] 320/768/1024/1440px에서 문서 전체 가로 넘침이 없고 스윔레인이 region 내부에서만 스크롤되는지 확인하는 E2E 테스트를 추가한다
- [X] T032 검증 체인을 quickstart.md 순서대로 실행한다 — `tsc --noEmit` → `vitest run` → 변경 범위 `eslint` → `pnpm run build` → 신선한 서버 E2E → `git diff --check`
- [X] T033 `superpowers:requesting-code-review`로 코드·콘텐츠 리뷰를 요청하고 Critical·Important 지적을 해소한다
- [X] T034 `specs/005-hanmaum-search-detail/verification.md`에 명령·핵심 출력·리뷰 결과·잔여 위험을 기록한다
- [X] T035 루트 `ROADMAP.md`의 Completed에 이번 feature를 추가하고 Next interviews 목록에서 한마음을 제거한다

---

## Dependencies

```text
Phase 1 (T001)
  └─> Phase 2 (T002, T003)            [모든 스토리의 선행 조건]
        ├─> Phase 3 US1 (T004~T007)
        │     └─> Phase 4 US2 (T008~T011)   [같은 파일의 highlights 채움]
        │           └─> Phase 5 US3 (T012~T018) [같은 파일의 implementation 채움]
        │                 └─> Phase 6 US5 (T019~T022) [본문 확정 후 fixture 고정]
        │                       └─> Phase 7 US4 (T023~T028)
        └─────────────────────────────────> Phase 8 (T029~T035)
```

**핵심 의존 관계**

- US2·US3·US4는 모두 `hanmaum-science-institute.ts` 한 파일을 순차적으로
  채우므로 병렬 실행할 수 없다. 파일 단위 충돌을 피하기 위해 순서를 지킨다.
- US5(T019~T021)는 본문이 확정된 뒤 실행해야 fixture 길이·목록이 안정된다.
- T032는 모든 구현이 끝난 뒤에만 의미가 있다.

## Parallel Opportunities

각 스토리의 **테스트 작성** 단계는 서로 다른 파일이거나 독립 블록이므로
병렬 가능하다.

- US2: T009는 T008과 병렬 가능
- US3: T013·T014는 T012와 병렬 가능
- US4: T024는 T023과 병렬 가능
- Polish: T030·T031은 서로 병렬 가능

구현 작업은 대부분 같은 파일을 수정하므로 병렬 대상이 아니다.

## Implementation Strategy

**MVP 범위**: Phase 1~3 (T001~T007)

여기까지 완료하면 한마음 작업물이 구조화 상세로 렌더링되고 하네스와 같은
읽기 순서를 갖는다. 형식 통일이라는 핵심 가치가 이 시점에 달성된다.

**증분 전달 순서**

1. US1 — 형식 통일 (MVP)
2. US2 — 근거 표기로 수치 신뢰도 확보
3. US3 — 사실 오류 정정으로 서술 정확성 확보
4. US5 — 회귀 계약 재고정으로 기존 작업 보호
5. US4 — 스윔레인으로 실패 흐름 깊이 보강

US4를 마지막에 두는 이유는 P2이기도 하지만, 스윔레인 데이터가 가장 크고
검증기 제약이 많아 앞 단계가 안정된 뒤 작업하는 편이 안전하기 때문이다.

---

## Phase 9: Convergence

2026-08-24 리뷰에서 연결 인사이트가 이번에 정정한 사실 3건을 반대로 주장하고
있음이 확인되었다. 사용자 승인에 따라 명세 가정을 바꾸고 이번 범위에 포함한다.

- [X] T036 CRITICAL `apps/front/src/data/portfolio/insights.ts`의 `optimizing-770k-text-search-in-rdbms` 본문에서 최소 토큰 길이 "2로 제한", 외부 검색 엔진 "고려했습니다", "로컬 스크립트로 마이그레이션" 3건을 작업물 상세와 일치하도록 정정한다 per FR-011a (contradicts)
- [X] T037 `apps/front/src/data/portfolio/content-quality.test.ts`에 상세와 연결 인사이트가 같은 사실을 다르게 주장하지 않는지 검사하는 테스트를 추가한다 — 금지 문구 3종이 인사이트 본문에도 없어야 한다 per FR-011a (missing)
- [X] T038 `apps/front/src/data/portfolio/insights.ts`의 해당 인사이트 회고에서 "다시 설계한다면 서버 내부에서 처리하겠다"는 문단을 실제 구현(이미 서버 처리)에 맞게 재작성한다 per SC-003 (partial)
