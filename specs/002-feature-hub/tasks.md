---
description: "Task list for 기능 허브 + 기능정의 상태 flow"
---

# Tasks: 기능 허브 + 기능정의 상태 flow

**Input**: Design documents from `specs/002-feature-hub/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md

**Tests**: 포함(TDD). scan-md / merge-registry / transition 세 lib는 테스트 선작성.

**Organization**: 사용자 스토리별로 그룹화. US1(허브)=MVP, US2(상태 flow), US3(유연성).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 가능(다른 파일, 미완 의존 없음)
- **[Story]**: US1 / US2 / US3
- 모든 경로는 저장소 루트 기준

## Phase 1: Setup

**Purpose**: 디렉터리 골격과 픽스처 자리 마련

- [X] T001 `.harness/scripts/docs/`와 하위 `lib/`, `templates/` 디렉터리 생성
- [X] T002 [P] 테스트 픽스처 자리 `tests/fixtures/feature-hub/`에 샘플 status.yaml, tasks.md, registry.json, 샘플 MD 문서 준비 (data-model.md 스키마 기준)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 스토리가 의존하는 공용 기반. 런타임 의존성 0(research D1).

**⚠️ CRITICAL**: 이 페이즈 완료 전 어떤 스토리도 시작 불가

- [X] T003 [P] 상태 enum/역할 상수 모듈 `.harness/scripts/docs/lib/constants.mjs` 작성 (status 5종, phase 3종, decision_level 4종, role 4종, surface 3종 — data-model.md 기준)
- [X] T004 평면 YAML 서브셋 파서 `.harness/scripts/docs/lib/yaml-lite.mjs` 작성 (key: value, `[a,b]` 인라인 리스트, `history:` 아래 `- { at, to }` 라인; 허용 밖 구조는 경고 반환 — research D1)

**Checkpoint**: 상수 + status.yaml 읽기 준비됨 — 스토리 구현 시작 가능

---

## Phase 3: User Story 1 - 팀 협업 진입 허브 (Priority: P1) 🎯 MVP

**Goal**: `mise run docs:build`가 역할별 카드 + MD 색인 + 기능 대시보드를 담은 단일
`docs/index.html`을 생성한다. 상태 데이터가 없어도 성공한다.

**Independent Test**: status.yaml/registry 없이 `mise run docs:build` 실행 → exit 0,
`docs/index.html`이 오프라인으로 열리고 역할 카드 + MD 색인이 표시됨.

### Tests for User Story 1 (TDD — 먼저 작성, FAIL 확인) ⚠️

- [X] T005 [P] [US1] `tests/feature-hub-scan-md.test.mjs` 작성 — 샘플 MD → 제목/카테고리/발췌 추출, 빈 폴더/없는 폴더/제목 없는 파일 케이스 (data-model Doc Index Entry, research D3)
- [X] T006 [P] [US1] `tests/feature-hub-merge-registry.test.mjs` 작성 — registry만 / specs만 / 양쪽(같은 id) 3케이스 + spec_link 자동 연결 (data-model 병합 규칙, FR-012~014)

### Implementation for User Story 1

- [X] T007 [P] [US1] `.harness/scripts/docs/lib/scan-md.mjs` 구현 — 색인 대상 폴더(README, docs/**, .harness/docs/**, specs/**/spec.md) 재귀 스캔, 카테고리 분류, 발췌 (T005 통과시킴)
- [X] T008 [P] [US1] `.harness/scripts/docs/lib/scan-specs.mjs` 구현 — specs/*/status.yaml 읽고(yaml-lite) tasks.md 진행률 계산, 잘못된/누락 파일은 경고하고 건너뜀 (FR-006/007/016)
- [X] T009 [US1] `.harness/scripts/docs/lib/merge-registry.mjs` 구현 — scan-specs 결과 + 선택적 registry.json 병합, spec 우선, spec_link 연결 (T006 통과시킴, depends on T008)
- [X] T010 [P] [US1] `.harness/scripts/docs/templates/hub.css` 작성 — 인라인될 스타일 (STICKY 팔레트 참고, 라이트/다크 대응)
- [X] T011 [US1] `.harness/scripts/docs/lib/render-hub.mjs` 구현 — 병합 데이터 + MD 색인 → HTML 문자열 3섹션(역할 카드 / MD 색인 검색 / 기능 대시보드), 인라인 CSS + 인라인 JS 검색·필터, 손수정 금지 배너, 외부 참조 0 (FR-001~005, depends on T009/T010)
- [X] T012 [US1] `.harness/scripts/docs/build-hub.mjs` 구현 — scan-md + scan-specs + merge-registry + render-hub 조합, `docs/index.html` 기록, 요약 stdout, 빈 입력에도 exit 0 (FR-016, depends on T007/T011)
- [X] T013 [US1] 루트 `mise.toml`에 `[tasks."docs:build"]` 추가 — `node .harness/scripts/docs/build-hub.mjs` (research D5)

**Checkpoint**: `mise run docs:build`로 MVP 허브 생성·열람 가능 (상태 데이터 유무 무관)

---

## Phase 4: User Story 2 - 기능정의 상태 추적 flow (Priority: P1)

**Goal**: `mise run feature:status <id> <state>`로 상태를 전이하고 이력을 남긴다. 비차단
자동 힌트를 출력한다.

**Independent Test**: 한 기능의 status.yaml에 planned→in-progress→in-review→done을 순서대로
전이하면 파일과 history가 갱신되고, 정의 안 된 점프는 거부된다.

### Tests for User Story 2 (TDD — 먼저 작성, FAIL 확인) ⚠️

- [X] T014 [P] [US2] `tests/feature-hub-transition.test.mjs` 작성 — 유효 인접 전이, on-hold 진입, 역방향 경고, 정의 안 된 점프 거부, 자동 힌트 조건 A/B 판정 (data-model 상태머신, contracts 힌트 계약, FR-009/010)

### Implementation for User Story 2

- [X] T015 [US2] `.harness/scripts/docs/lib/transition.mjs` 구현 — 유효 전이 판정, 자동 힌트(tasks 완료→in-review, e2e 스탬프 신선→done) 판정 함수. `.harness/state/e2e-last-run` 읽기만 (T014 통과시킴, FR-009~011, research D4)
- [X] T016 [US2] `.harness/scripts/docs/feature-status.mjs` 구현 — `<id> <state> <날짜>` 인자, status.yaml 갱신 + history 추가, 거부/경고 처리, 힌트 출력 (contracts/cli.md, depends on T015 + yaml-lite)
- [X] T017 [US2] 루트 `mise.toml`에 `[tasks."feature:status"]` 추가 — 날짜를 인자로 주입해 `node .harness/scripts/docs/feature-status.mjs` 호출 (research D5)
- [X] T018 [US2] `build-hub.mjs`에 자동 힌트 출력 연결 — 생성 끝에 transition 힌트를 stdout에 출력(차단 없음) (FR-010, depends on T012/T015)

**Checkpoint**: US1 + US2 독립 동작 — 허브 생성 + 상태 전이 + 비차단 힌트

---

## Phase 5: User Story 3 - 기능정의 유무 무관 유연성 (Priority: P2)

**Goal**: top-down(registry→spec)과 bottom-up(spec→registry 역등록) 경로가 같은 대시보드로
수렴. registry는 선택적.

**Independent Test**: registry-먼저 경로와 spec-먼저 경로로 같은 기능을 만들면 최종 대시보드
표시가 동일하고, registry 삭제 후에도 빌드가 성공한다.

**NOTE**: 병합 로직 자체는 US1의 merge-registry(T009)에서 구현됨. 이 페이즈는 유연성 요건을
**검증하고 워크플로우를 문서화**한다.

### Tests for User Story 3 ⚠️

- [X] T019 [P] [US3] `tests/feature-hub-merge-registry.test.mjs`에 수렴 케이스 보강 — registry-먼저 vs spec-먼저 결과 동일, registry 부재 시 spec만으로 동작 (FR-013/015, SC-005/006) — T006에서 함께 작성됨

### Implementation for User Story 3

- [X] T020 [US3] `.harness/skills/codi-feature-hub/SKILL.md` 작성 — 워크플로우 문서: 기능정의 있으면 top-down(registry 항목→speckit.specify 씨앗), 없으면 bottom-up(speckit→완료 시 registry 역등록 선택), docs:build / feature:status 사용법, registry.json 스키마 (skill-ownership: 공유 스킬)
- [X] T021 [US3] `registry.json` 선택 사용법과 `features[]` 최소 스키마를 `.harness/skills/codi-feature-hub/SKILL.md` 및 feature hub guide에 문서화 (data-model Registry Entry)

**Checkpoint**: 세 스토리 모두 독립 동작. 유연성 경로 검증 완료

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: 통합 검증, 문서, 링크 반영

- [X] T022 `./harness skills-link` 실행 — 새 공유 스킬을 `.claude/skills/`·`.agents/skills/`에 머지 반영 (skill-ownership)
- [X] T023 [P] 이 기능 자신의 `specs/002-feature-hub/status.yaml` 작성 — 도구가 스스로를 대시보드에 표시(도그푸딩), data-model 스키마 준수
- [X] T024 quickstart.md의 6개 시나리오 전부 수동 실행해 통과 확인 (verify 스킬로 docs/index.html 렌더 눈으로 검증)
- [X] T025 [P] `README.md` 또는 `.harness/docs/`에 기능 허브 사용법 한 줄 링크 추가 (허브가 자기 자신을 색인)
- [X] T026 `npm test` 전체 통과 확인 (기존 테스트 회귀 없음 + 신규 3개 통과)

---

## Phase 7: Agent Status Sync Extension

**Purpose**: Codex/Claude 작업자가 수동 상태 전이를 잊어도 stale 상태가 드러나고, 안전한 전이는 명시적 sync 커맨드로 적용된다.

- [X] T027 [US2] `feature:status:sync` 계획/적용 로직 테스트 작성 — planned→in-progress, in-progress→in-review, 적용 시 history 기록
- [X] T028 [US2] `.harness/scripts/docs/lib/status-sync.mjs`와 `.harness/scripts/docs/feature-status-sync.mjs` 구현 — 기본 check, `--apply` 쓰기
- [X] T029 [US2] `mise.toml`에 `[tasks."feature:status:sync"]` 추가
- [X] T030 [US3] `codi-feature-hub`, `AGENTS.md`, `CLAUDE.md`에 에이전트 완료 전 status sync 실행 지침 추가
- [X] T031 통합 검증 — targeted tests, `mise run feature:status:sync`, `docs:build`, `npm test`, doctor

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup(P1)**: 즉시 시작
- **Foundational(P2)**: Setup 후. 모든 스토리 차단
- **US1(P3)**: Foundational 후. MVP
- **US2(P4)**: Foundational 후. yaml-lite 공유, build-hub 힌트 연결만 US1(T012) 의존
- **US3(P5)**: US1의 merge-registry(T009) 의존(검증·문서화 성격)
- **Polish(P6)**: 원하는 스토리 완료 후

### Within Each Story

- 테스트(TDD) 먼저 작성·FAIL 확인 → 구현
- constants/yaml-lite → scan-* → merge → render → build 순
- transition → feature-status 커맨드 순

### Parallel Opportunities

- T002는 T001과 병렬(픽스처 vs 디렉터리)
- T003(constants)와 T004(yaml-lite)는 병렬
- T005/T006 테스트 병렬 작성, T007/T008 병렬 구현
- T010(css)은 렌더 로직과 병렬 준비
- US1 완료 후 US2는 대부분 독립 진행 가능

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1 Setup → Phase 2 Foundational → Phase 3 US1
2. **STOP & VALIDATE**: `mise run docs:build`로 허브 생성 확인(상태 데이터 없이)
3. 이 시점에 "역할별 뭐볼지 + MD 색인" 허브가 이미 팀에 가치

### Incremental Delivery

1. Setup + Foundational → 기반
2. US1 → 허브 MVP (docs:build)
3. US2 → 상태 전이 flow (feature:status + 힌트)
4. US3 → 유연성 검증 + 워크플로우 스킬 문서
5. Polish → skills-link, 도그푸딩, quickstart 검증

---

## Notes

- [P] = 다른 파일, 미완 의존 없음
- TDD: T005/T006/T014는 구현 전 작성하고 FAIL 확인
- 런타임 의존성 0 유지(yaml-lite 자체 구현)
- 각 태스크 또는 논리 그룹 후 커밋
- 생성물 `docs/index.html`은 손수정 금지 — 항상 docs:build로 재생성
