# Tasks: Codi Harness 포트폴리오 상세 개선

**Input**: Design documents from `specs/002-codi-harness-portfolio-detail/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/portfolio-detail-contract.md`, `quickstart.md`

**Tests**: 사용자 요청과 명세 FR-021에 따라 모든 행동 변경은 테스트를 먼저 작성하고
실패를 확인한 뒤 구현한다.

**Organization**: 사용자 스토리별로 독립 구현·검증할 수 있게 구성한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일을 변경하며 선행 작업에 의존하지 않아 병렬 실행 가능
- **[Story]**: `spec.md`의 사용자 스토리 번호
- 모든 작업은 정확한 파일 경로를 포함한다.

## Phase 1: Setup (Shared Test Infrastructure)

**Purpose**: 사용자 흐름 변경에 필요한 E2E 실행 경계를 먼저 준비한다.

- [X] T001 `codi-e2e`의 canonical task를 루트 `mise.toml`에 추가해 `e2e`와 `e2e:changed` 진입점을 등록한다.
- [X] T002 `@playwright/test` 1.62.1, TSX 테스트 include, webServer 설정과 앱 task를 `apps/front/package.json`, `apps/front/pnpm-lock.yaml`, `apps/front/vitest.config.ts`, `apps/front/playwright.config.ts`, `apps/front/mise.toml`에 구성한다.

**Checkpoint**: `mise tasks ls --all`에서 루트와 `//apps/front:e2e` 작업이 확인된다.

---

## Phase 2: Foundational (Blocking Data Contract)

**Purpose**: 모든 사용자 스토리가 사용하는 타입, 검증기와 slug 레지스트리를 TDD로 만든다.

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 사용자 스토리 구현을 시작하지 않는다.

### Tests First

- [X] T003 `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 빈 필드, estimated caveat, 중복 ID, 잘못된 lane/step 참조, failure outcome과 demo URL 실패 사례를 먼저 작성하고 실패를 확인한다.

### Implementation

- [X] T004 `apps/front/src/data/portfolio/types/feature-detail.dto.ts`에 FeatureMetric, FeatureDemo, SwimlaneLane/Step/Edge, FeatureSwimlane과 FeatureDetailDto 계약을 구현한다.
- [X] T005 `apps/front/src/data/portfolio/feature-details/index.ts`에 `validateFeatureDetail`과 검증된 slug 레지스트리 및 `getFeatureDetailBySlug`를 구현해 T003을 통과시킨다.
- [X] T006 `apps/front/src/data/portfolio/types/feature.dto.ts`와 `apps/front/src/data/portfolio/features.ts`에서 `In Progress` 상태를 공식화하고 SeedFeature가 FeatureCategory/FeatureStatus를 직접 사용하게 한다.
- [X] T007 `apps/front/src/data/portfolio/index.ts`와 `apps/front/src/data/portfolio/types/index.ts`에서 상세 타입·접근자를 export하고 category/status 강제 캐스팅을 제거한다.
- [X] T008 `pnpm --dir apps/front test`와 `pnpm --dir apps/front exec tsc --noEmit`으로 기반 계약을 검증하고 결과를 `specs/002-codi-harness-portfolio-detail/verification.md`에 기록한다.

**Checkpoint**: 잘못된 구조화 상세는 테스트와 레지스트리 초기화에서 차단되고 기존 8개 FeatureDto가 타입 안전하게 생성된다.

---

## Phase 3: User Story 1 - 가치와 성과를 빠르게 파악 (Priority: P1) 🎯 MVP

**Goal**: 하네스 상세 상단에서 개요, 역할과 근거가 있는 핵심 결과를 먼저 확인한다.

**Independent Test**: 하네스 상세 상단만 보고 목적·기간·역할·적용/운영 범위·사용
인원·비용 산정·배포 시간·환경변수 결과를 구분할 수 있다.

### Tests First

- [X] T009 [US1] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 하네스 지표 6개의 kind/asOf/evidence, estimated caveat와 demo 부재 계약을 추가하고 실패를 확인한다.
- [X] T010 [US1] `apps/front/src/components/projects/project-detail-rendering.test.tsx`와 `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에 10개 공통 heading 순서, `available` demo fixture의 새 창 안내·안전한 link 속성, overview 우선 노출, 역할, 5개 이상 지표와 하네스의 외부/준비 중 demo CTA 부재 시나리오를 작성하고 실패를 확인한다.

### Implementation

- [X] T011 [US1] `apps/front/src/data/portfolio/feature-details/codi-harness-dx-platform.ts`에 역할, 문제·제약·대안, 근거가 구분된 6개 지표와 결과·회고의 구조화 상세를 작성한다.
- [X] T012 [P] [US1] `apps/front/src/components/projects/ProjectHighlights.tsx`에 지표 값, kind, 기준 시점, 근거와 caveat를 표시하는 정적 구성 요소를 구현한다.
- [X] T013 [P] [US1] `apps/front/src/components/projects/ProjectNarrative.tsx`에 역할·문제·제약·대안·구현·결과·회고 Markdown 섹션을 구현한다.
- [X] T014 [US1] `apps/front/src/components/projects/ProjectDemoLink.tsx`, `apps/front/src/components/projects/ProjectDetailContent.tsx`와 `apps/front/src/app/(public)/projects/[slug]/page.tsx`에서 접근 가능한 선택형 demo 링크를 구현하고 overview를 항상 먼저 표시하며 하네스 구조화 상세와 T012/T013을 조합한다.
- [X] T015 [US1] `pnpm --dir apps/front test`와 하네스 대상 Playwright 테스트를 실행해 US1을 독립 검증하고 결과를 `specs/002-codi-harness-portfolio-detail/verification.md`에 기록한다.

**Checkpoint**: 하네스 상단 요약과 근거 지표가 보이고 외부 demo CTA는 없다.

---

## Phase 4: User Story 2 - 개발 운영과 배포 운영의 흐름 이해 (Priority: P1)

**Goal**: 데모 없이 두 스윔레인의 책임, 정상, 실패와 복구·중단 흐름을 이해한다.

**Independent Test**: 두 스윔레인에서 책임 주체, 정상 경로와 최소 한 개의 실패 후
복구 또는 중단 경로를 시각 영역과 대체 설명에서 같은 순서로 설명할 수 있다.

### Tests First

- [X] T016 [US2] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 두 스윔레인의 고유 ID, 참조 무결성, normal/failure/recovery, failure outcome과 대체 설명 계약을 추가하고 실패를 확인한다.
- [X] T017 [US2] `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에 두 제목, lane/step, 색상 외 흐름 label, 순서형 대체 목록, 불필요한 tab stop 부재와 320/768/1024/1440px overflow 시나리오를 추가하고 실패를 확인한다.

### Implementation

- [X] T018 [US2] `apps/front/src/data/portfolio/feature-details/codi-harness-dx-platform.ts`에 설계·개발·검증 및 CI/CD·시크릿·배포 스윔레인 데이터와 실패·복구/중단 edge를 작성한다.
- [X] T019 [US2] `apps/front/src/components/projects/ProjectSwimlane.tsx`에 semantic token, 선 스타일·아이콘·텍스트 label, 내부 overflow와 동일 데이터 기반 `<ol>` 대체 설명을 구현한다.
- [X] T020 [US2] `apps/front/src/components/projects/ProjectDetailContent.tsx`에서 스윔레인이 존재할 때만 T019를 렌더링하고 빈 영역을 만들지 않는다.
- [X] T021 [US2] Vitest와 네 viewport Playwright 테스트를 실행해 US2를 독립 검증하고 결과를 `specs/002-codi-harness-portfolio-detail/verification.md`에 기록한다.

**Checkpoint**: 데스크톱과 모바일 모두 두 흐름을 읽을 수 있고 페이지 전체 가로 overflow가 없다.

---

## Phase 5: User Story 3 - 현재 구조와 발전 과정을 구분 (Priority: P1)

**Goal**: 현재 도구와 역사적 도구 및 전환 근거를 혼동 없이 보여준다.

**Independent Test**: 현재 핵심 도구 6개와 GSD/GStack의 역사적 역할·교체 이유를
서로 다른 영역에서 확인하고 런타임 공통 정책과 집행 레이어를 구분할 수 있다.

### Tests First

- [X] T022 [US3] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 현재 tech stack에서 GSD/GStack 제외, 현재 도구 6개 포함, 두 전환 이유와 정책 계층 설명 존재 계약을 추가하고 실패를 확인한다.
- [X] T023 [US3] `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에 현재 도구·발전 기록 분리와 공통 정책→Claude/Codex 집행 계층의 텍스트 구조 시나리오를 추가하고 실패를 확인한다.

### Implementation

- [X] T024 [US3] `apps/front/src/data/portfolio/features.ts`에서 하네스 techStack과 장문 본문의 현재/과거 도구, GSD→Spec Kit 및 GStack→Playwright MCP 전환 표현을 승인된 사실로 정합화한다.
- [X] T025 [US3] `apps/front/src/data/portfolio/feature-details/codi-harness-dx-platform.ts`에 현재 역할, 발전 타임라인과 공통 정책→런타임 집행 계층의 압축 설명을 추가한다.
- [X] T026 [US3] Vitest와 하네스 대상 Playwright 테스트를 실행해 US3을 독립 검증하고 결과를 `specs/002-codi-harness-portfolio-detail/verification.md`에 기록한다.

**Checkpoint**: 현재 tech stack에 역사적 도구가 없고 발전 기록에서 전환 이유가 확인된다.

---

## Phase 6: User Story 4 - 상세 인사이트로 확장 (Priority: P2)

**Goal**: 본문은 핵심 판단에 집중하고 네 개 구현 주제를 독립 인사이트로 연결한다.

**Independent Test**: 하네스 본문에서 네 주제 링크를 찾아 각기 정상적인 독립
인사이트로 이동하고, 기존 관련 인사이트와 비용·도구 시점이 충돌하지 않음을 확인한다.

### Tests First

- [X] T027 [US4] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 네 신규 insight slug·featureSlug·Markdown 제목·본문 길이, 본문 직접 링크와 기존 관련 인사이트 비용/도구 정합성 계약을 추가하고 실패를 확인한다.
- [X] T028 [US4] `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에 네 본문 링크와 각 insight 공개 경로 이동 시나리오를 추가하고 실패를 확인한다.

### Implementation

- [X] T029 [US4] `apps/front/src/data/portfolio/insights.ts`에서 `codi-harness-dx-platform-design`, Jenkins, Infisical, Cloudflare 관련 기존 인사이트의 비용·현재 도구·운영 범위를 승인된 사실과 일치시킨다.
- [X] T030 [US4] `apps/front/src/data/portfolio/insights.ts`에 패키징·소유권, CLI·doctor, Claude/Codex 패리티·회귀, 멀티 세션·컨텍스트 수명의 신규 인사이트 4개를 작성한다.
- [X] T031 [US4] `apps/front/src/data/portfolio/feature-details/codi-harness-dx-platform.ts`의 핵심 구현 영역에서 네 신규 insight slug로 직접 연결하고 종합 본문 중복을 압축한다.
- [X] T032 [US4] Vitest와 네 insight 공개 경로 Playwright 테스트를 실행해 US4를 독립 검증하고 결과를 `specs/002-codi-harness-portfolio-detail/verification.md`에 기록한다.

**Checkpoint**: 네 링크가 모두 정상이고 관련 공개 콘텐츠에 상충하는 비용·도구 주장이 없다.

---

## Phase 7: User Story 5 - 기존 작업물을 보존하며 순차 이전 (Priority: P2)

**Goal**: 하네스만 구조화하고 나머지 7개 작업물의 경로와 기존 본문을 보존한다.

**Independent Test**: 8개 상세 경로가 모두 생성되고 대표 legacy 작업물에서 기존
Markdown을 확인하며 빈 demo·swimlane 영역이 없음을 확인한다.

### Tests First

- [X] T033 [US5] `apps/front/src/data/portfolio/feature-detail-quality.test.ts`에 구조화 상세가 하네스 1개뿐이고 나머지 7개가 기존 content를 유지하며 다른 상세로 대체되지 않는 계약을 추가하고 실패를 확인한다.
- [X] T034 [US5] `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`에 8개 상세 경로 접근, 대표 legacy 본문 유지와 빈 demo/swimlane 블록 부재 시나리오를 추가하고 실패를 확인한다.

### Implementation

- [X] T035 [US5] `apps/front/src/components/projects/ProjectDetailContent.tsx`와 `apps/front/src/app/(public)/projects/[slug]/page.tsx`의 legacy fallback을 완성해 구조화 상세가 없는 경우 기존 Markdown만 렌더링한다.
- [X] T036 [US5] `apps/front/src/data/portfolio/content-quality.test.ts`를 구조화 상세와 legacy 본문을 모두 허용하되 7개 기존 content 보존을 검증하도록 정합화한다.
- [X] T037 [US5] Vitest, production build와 8개 경로 Playwright 테스트를 실행해 US5를 독립 검증하고 결과를 `specs/002-codi-harness-portfolio-detail/verification.md`에 기록한다.

**Checkpoint**: 하네스 1개만 구조화됐고 다른 7개 공개 페이지에 회귀가 없다.

---

## Phase 8: Polish & Cross-Cutting Verification

**Purpose**: 전체 요구사항의 품질, 접근성, 콘텐츠 근거와 배포 전 검증을 마무리한다.

- [X] T038 `pnpm --dir apps/front exec tsc --noEmit`, `pnpm --dir apps/front test`, `pnpm --dir apps/front lint`, `pnpm --dir apps/front build`, `mise run //apps/front:e2e`를 순서대로 실행하고 전체 결과를 `specs/002-codi-harness-portfolio-detail/verification.md`에 기록한다.
- [X] T039 `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`와 Playwright MCP로 320/768/1024/1440px, 10개 heading 순서, 키보드 링크, 외부 링크 새 창 안내·안전한 속성, 다크 모드, 내부/전체 overflow를 확인하고 관찰 결과를 `specs/002-codi-harness-portfolio-detail/verification.md`에 기록한다.
- [X] T040 인터뷰·승인 설계·현재 하네스 근거와 `apps/front/src/data/portfolio/features.ts`, `apps/front/src/data/portfolio/insights.ts`의 공개 주장 정합성을 검토해 `specs/002-codi-harness-portfolio-detail/verification.md`에 기록한다.
- [X] T041 `speckit-converge`와 코드 리뷰 결과의 Critical/Important 항목을 해소하고 수렴 결과를 `specs/002-codi-harness-portfolio-detail/verification.md`에 기록한다.
- [X] T042 `mise run feature:status:sync`를 재시도하고 가능하면 `--apply`로 결정적 전이를 반영하며, 작업 부재 시 결과를 `specs/002-codi-harness-portfolio-detail/verification.md`와 루트 `ROADMAP.md`에 기록한다.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: 즉시 시작 가능
- **Phase 2 Foundation**: Phase 1 완료 후 진행하며 모든 사용자 스토리를 차단
- **US1**: Foundation 완료 후 시작하는 MVP
- **US2**: Foundation과 US1의 공통 페이지 조합 완료 후 진행
- **US3**: Foundation과 US1 narrative 렌더러 완료 후 진행
- **US4**: US3의 현재/역사 도구 경계 확정 후 진행
- **US5**: US1의 공통 페이지 조합 후 진행 가능하며 최종적으로 US1~US4와 함께 회귀 검증
- **Polish**: 선택한 모든 사용자 스토리 완료 후 진행

### User Story Dependency Graph

```text
Setup → Foundation → US1 ─┬→ US2
                         ├→ US3 → US4
                         └→ US5
US2 + US4 + US5 → Polish
```

### Within Each User Story

1. 테스트를 먼저 작성한다.
2. 새 테스트가 기대한 이유로 실패하는지 확인한다.
3. 데이터 모델·콘텐츠를 구현한다.
4. 구성 요소와 페이지 조합을 구현한다.
5. 해당 스토리 테스트를 다시 실행해 독립 검증한다.

### Parallel Opportunities

- T012와 T013은 서로 다른 구성 요소 파일이라 병렬 가능하다.
- US2와 US3은 US1 이후 서로 다른 데이터/구성 요소 초점으로 진행할 수 있으나,
  같은 하네스 상세 데이터 파일을 수정하는 T018/T025는 동시에 실행하지 않는다.
- US5의 E2E 설계는 US2/US3과 병렬 검토할 수 있으나 공통 페이지 구현은 순차 적용한다.
- 현재 환경에서는 별도 사용자 승인 없는 subagent 실행을 전제로 하지 않는다.

## Parallel Example: User Story 1

```text
Task T012: apps/front/src/components/projects/ProjectHighlights.tsx 구현
Task T013: apps/front/src/components/projects/ProjectNarrative.tsx 구현
```

두 작업은 T011의 데이터 계약을 기준으로 서로 다른 파일을 수정하며, T014에서 조합한다.

## Implementation Strategy

### MVP First

1. Phase 1 Setup 완료
2. Phase 2 Foundation 완료
3. US1 테스트→구현→검증 완료
4. 상단 개요·근거 지표·demo 부재를 독립 확인

### Incremental Delivery

1. US1: 하네스 가치와 결과
2. US2: 데모 대체 스윔레인
3. US3: 현재/역사 도구 구분
4. US4: 네 상세 인사이트
5. US5: 나머지 7개 fallback 회귀 검증
6. 전체 review·verification·converge

## Notes

- `[P]`는 파일과 선행 의존성이 분리된 작업에만 사용했다.
- 테스트 작업은 항상 같은 스토리의 구현 작업보다 앞선다.
- 구현 단계는 커밋하지 않으며 기존 사용자 변경을 되돌리거나 임의로 stage하지 않는다.
- `components/ui/*`는 read-only로 유지한다.
- E2E stamp를 만들 수 없는 dirty worktree라면 앱 전용 실제 통과 증거와 사유를 기록한다.
