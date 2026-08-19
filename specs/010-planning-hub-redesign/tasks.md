---

description: "Planning Hub 데모·동기화·기능 허브 재설계 실행 태스크"
---

# Tasks: Planning Hub 데모·동기화·기능 허브 재설계

**Input**: Design documents from `/specs/010-planning-hub-redesign/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: 사용자가 TDD를 명시적으로 요청했다. 각 user story의 test task를 먼저
작성하고 실패를 확인한 뒤 같은 story의 구현 task를 시작한다.

**Organization**: 공통 contract/digest foundation 이후 user story별로 독립 검증
가능한 slice를 만든다. 기존 007~009 변경과 실제 `data/`는 보존한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일에서 수행되며 미완료 task에 의존하지 않는 병렬 가능 작업
- **[Story]**: spec.md의 User Story ID
- 모든 task는 변경 또는 검증 대상의 정확한 경로를 포함한다.

## Phase 1: Setup and Baseline

**Purpose**: 현재 dirty worktree와 기존 허브 동작을 보존할 기준을 만든다.

- [x] T001 현재 `npm test`, `mise run docs:build` 결과와 기존 `data/` checksum을 `specs/010-planning-hub-redesign/verification.md`에 기록한다
- [x] T002 [P] valid/invalid/digest/path traversal 계약 fixture 골격을 `tests/fixtures/planning-hub/contracts/`에 만든다
- [x] T003 [P] demo planning/downstream/expected fixture 디렉터리 계약을 `tests/fixtures/planning-hub/workspaces/README.md`에 고정한다

---

## Phase 2: Foundational Contracts and Deterministic Core

**Purpose**: 모든 user story가 공유하는 schema, canonical digest, workspace resolution과
legacy compatibility를 TDD로 만든다.

**⚠️ CRITICAL**: 이 phase가 끝나기 전에는 user story UI/automation 구현을 시작하지 않는다.

### Tests first

- [x] T004 [P] canonical JSON, volatile field exclusion, repeated SHA-256 digest와 invalid JSON value 실패 테스트를 `tests/planning-manifest.test.mjs`에 작성하고 실패를 확인한다
- [x] T005 [P] rich detail, manifest, evidence, proposal, workspace valid/invalid schema 계약 테스트를 `tests/planning-contracts.test.mjs`에 작성하고 실패를 확인한다
- [x] T006 [P] workspace config 부재 시 actual-project 기본값, unsafe root와 demo fallback 금지 테스트를 `tests/planning-workspaces.test.mjs`에 작성하고 실패를 확인한다
- [x] T007 [P] 기존 v1 feature/sitemap/relation/flow source가 새 builder에서도 손실 없이 읽히는 회귀 테스트를 `tests/feature-hub-sitemap-build.test.mjs`와 `tests/feature-hub-linked-model.test.mjs`에 추가하고 실패를 확인한다

### Implementation

- [x] T008 [P] versioned contract metadata를 `.harness/config/feature-detail-schema.json`, `.harness/config/planning-manifest-schema.json`, `.harness/config/delivery-evidence-schema.json`, `.harness/config/change-proposal-schema.json`, `.harness/config/hub-workspace-schema.json`에 추가한다
- [x] T009 canonical serialization과 digest 계산을 `.harness/scripts/docs/lib/canonical-json.mjs`에 구현해 T004를 통과시킨다
- [x] T010 contract별 strict/preview validation과 safe relative path 검사를 `.harness/scripts/docs/lib/planning-contracts.mjs`에 구현해 T005를 통과시킨다
- [x] T011 workspace config/default/source health resolution을 `.harness/scripts/docs/lib/scan-workspaces.mjs`에 구현해 T006을 통과시킨다
- [x] T012 planning entity를 manifest envelope로 컴파일하고 digest를 검증하는 로직을 `.harness/scripts/docs/lib/compile-planning-manifest.mjs`에 구현한다
- [x] T013 existing v1 source를 mutation 없이 새 workspace model로 변환하는 compatibility adapter를 `.harness/scripts/docs/lib/build-workspace-hub-model.mjs`에 구현한다
- [x] T014 workspace-aware build orchestration을 `.harness/scripts/docs/build-hub.mjs`에 연결하고 T007 및 기존 hub test 전체를 통과시킨다
- [x] T015 contract source와 generated snapshot이 구분되는 경로/ownership 설명을 `.harness/config/feature-detail-schema.json`, `.harness/config/planning-manifest-schema.json`, `.harness/config/delivery-evidence-schema.json`, `.harness/config/change-proposal-schema.json`, `.harness/config/hub-workspace-schema.json`과 `specs/010-planning-hub-redesign/contracts/`에 교차 확인해 반영한다

**Checkpoint**: 같은 입력은 같은 digest/model을 만들고 기존 Harness Internal build는
byte mutation 없이 동작한다.

---

## Phase 3: User Story 1 — 제품 구조를 혼동 없이 탐색 (Priority: P1) 🎯 MVP

**Goal**: Community Demo와 Harness Internal을 분리하고, 최종 여덟 planning view와
screen-only 사이트맵을 제공한다.

**Independent Test**: Community Demo에서 workspace 전환, screen-only diagram,
tree/table와 화면 상세를 탐색하고 Harness Internal 문서·데이터 보존을 확인한다.

### Tests first

- [x] T016 [P] [US1] demo의 6 need, 14 screen, 12 feature, 3 flow와 seeded health 결과 계약 테스트를 `tests/planning-demo-data.test.mjs`에 작성하고 실패를 확인한다
- [x] T017 [P] [US1] Community Demo 기본값, Harness Internal 전환, 실제 downstream 무설정 기본값과 no-fallback 테스트를 `tests/planning-workspaces.test.mjs`에 추가하고 실패를 확인한다
- [x] T018 [P] [US1] 초기 일곱 view, 기존 document 접근, workspace source badge와 atomic switch markup 테스트를 `tests/feature-hub-render.test.mjs`에 추가하고 실패를 확인한다
- [x] T019 [P] [US1] sitemap node가 screen만 포함하고 hierarchy/direct-navigation/legend/tree/table가 같은 ID를 노출하며 surface filter, screen search, zoom/fit과 keyboard selection이 일관되게 동작하는 테스트를 `tests/planning-sitemap-render.test.mjs`에 작성하고 실패를 확인한다

### Implementation

- [x] T020 [P] [US1] Community Demo needs, sitemap, catalog, 최소 valid detail, flows, relations와 decisions를 `examples/community-app/planning/needs.json`, `examples/community-app/planning/sitemap.json`, `examples/community-app/planning/feature-definitions.json`, `examples/community-app/planning/feature-details.json`, `examples/community-app/planning/user-flows.json`, `examples/community-app/planning/feature-relations.json`, `examples/community-app/planning/decisions.json`에 작성한다
- [x] T021 [US1] Community Demo published snapshot과 기대 결과를 `examples/community-app/planning/planning-manifest.json`, `examples/community-app/expected/health-report.json`, `examples/community-app/expected/hub-snapshot.json`에 생성·검증해 T016을 통과시킨다
- [x] T022 [US1] Community Demo와 Harness Internal source/default를 `data/hub-workspaces.json`에 선언해 T017을 통과시킨다
- [x] T023 [US1] 모든 workspace model을 hub data에 주입하고 active workspace를 격리하는 로직을 `.harness/scripts/docs/build-hub.mjs`와 `.harness/scripts/docs/lib/render-hub.mjs`에 구현한다
- [x] T024 [US1] primary navigation을 개요·화면 구조·기능 정의·사용자 흐름·추적성·전달 현황·동기화로 재구성하고 기존 guide/project document를 개요·검색에서 유지하도록 `.harness/scripts/docs/lib/render-hub.mjs`를 수정한다
- [x] T025 [US1] workspace selector, `DEMO DATA` badge, source version/digest와 atomic view reset을 `.harness/scripts/docs/lib/render-hub.mjs`의 client state/event handling에 구현한다
- [x] T026 [US1] screen-only hierarchy와 direct-navigation edge data, surface filter, screen search, zoom/fit, keyboard selection 및 선택 상세를 `.harness/scripts/docs/lib/render-hub.mjs`의 화면 구조 view에 구현한다
- [x] T027 [US1] 동일 screen source의 keyboard tree와 comparison table alternative를 `.harness/scripts/docs/lib/render-hub.mjs`에 구현해 T019를 통과시킨다
- [x] T028 [US1] sitemap layout, solid/dotted connector, surface color, legend, responsive overflow와 focus state를 `.harness/scripts/docs/templates/hub.css`에 구현한다
- [x] T029 [US1] Community Demo/Harness Internal 전환, surface filter, screen search, zoom/fit과 wide/narrow/keyboard 사이트맵 결과를 `specs/010-planning-hub-redesign/verification.md`의 US1 절에 기록한다

**Checkpoint**: 제품 구조와 하네스 내부 기능이 섞이지 않고, 사이트맵이 첨부 예시와
같은 화면 계층 질문에 답한다.

---

## Phase 4: User Story 2 — 구현 가능한 기능정의 판단 (Priority: P1)

**Goal**: 얇은 catalog와 rich detail을 연결하고 priority/definition/delivery/sync
의미를 분리한다.

**Independent Test**: 게시물 작성 기능에서 의도, 정상·예외·회복, 규칙, interface,
acceptance와 미검증 정보를 확인하고 불완전 기능의 해결 행동을 본다.

### Tests first

- [x] T030 [P] [US2] rich detail completeness, applicable state exemption, acceptance와 open decision validation 테스트를 `tests/planning-feature-detail.test.mjs`에 작성하고 실패를 확인한다
- [x] T031 [P] [US2] legacy `Phase_Suggestion`/`Status`/`Decision_Level`이 새 lifecycle로 오승격되지 않는 테스트를 `tests/feature-definition-schema.test.mjs`에 추가하고 실패를 확인한다
- [x] T032 [P] [US2] `우선순위 Pn`, 별도 상태 그룹, six-section detail, `정의 불완전` recovery와 hostile external text HTML escaping 테스트를 `tests/feature-hub-render.test.mjs`에 추가하고 실패를 확인한다

### Implementation

- [x] T033 [P] [US2] 12개 demo detail을 승인 목업의 rich content와 의도적 누락 사례로 확장하고 manifest/expected snapshot 재생성 입력을 `examples/community-app/planning/feature-details.json`에 반영한다
- [x] T034 [US2] rich detail scan/validation/readiness health를 `.harness/scripts/docs/lib/scan-feature-details.mjs`에 구현해 T030을 통과시킨다
- [x] T035 [US2] legacy row를 catalog candidate/provenance로 보존하는 mapping을 `.harness/scripts/docs/lib/merge-service-definition.mjs`와 `.harness/scripts/docs/lib/feature-definition-schema.mjs`에 구현해 T031을 통과시킨다
- [x] T036 [US2] catalog, detail, relation과 delivery summary를 workspace feature model로 결합하는 로직을 `.harness/scripts/docs/lib/build-workspace-hub-model.mjs`에 추가한다
- [x] T037 [US2] 검색 가능한 기능 목록, priority legend, separate status group과 rich selected detail을 `.harness/scripts/docs/lib/render-hub.mjs`에 구현해 T032를 통과시킨다
- [x] T038 [US2] detail section grid, incomplete/review/drift badge, mobile stacking과 keyboard focus를 `.harness/scripts/docs/templates/hub.css`에 구현한다
- [x] T039 [US2] normal/processing/empty/error/permission 상태와 acceptance gap의 브라우저 결과를 `specs/010-planning-hub-redesign/verification.md`의 US2 절에 기록한다

**Checkpoint**: 사람이 이름/상태 badge만 보는 대신 기능의 행동과 완료 검증 기준을
판단할 수 있다.

---

## Phase 5: User Story 3 — 계획과 구현·검증의 차이 조정 (Priority: P1)

**Goal**: Planning Lock과 Delivery Evidence를 결합해 aligned/behind/drift/conflict/
failure 및 change proposal을 mutation 없이 계산한다.

**Independent Test**: 계획 10장과 구현 4장 차이가 evidence-backed proposal로
나타나고 승인 계획과 downstream 원본은 바뀌지 않는다.

### Tests first

- [x] T040 [P] [US3] declared/Spec/observed evidence merge, certainty와 consumed digest validation 테스트를 `tests/planning-delivery-evidence.test.mjs`에 작성하고 실패를 확인한다
- [x] T041 [P] [US3] aligned/behind/drifted/conflicted/collection-failed, proposal field/value/evidence/disposition, state transition과 no source mutation 테스트를 `tests/planning-reconcile.test.mjs`에 작성하고 실패를 확인한다
- [x] T042 [P] [US3] explicit pull의 candidate schema/project/digest 검증, validate-before-write, atomic lock 교체, 중단·실패 시 기존 lock 보존 테스트를 `tests/planning-pull.test.mjs`에 작성하고 실패를 확인한다
- [x] T043 [P] [US3] traceability matrix default, optional `추적성 그래프`, flow text alternative와 delivery lens markup 테스트를 `tests/feature-hub-render.test.mjs`에 추가하고 실패를 확인한다

### Implementation

- [x] T044 [P] [US3] demo lock, feature delivery/verification evidence와 10-vs-4 proposal를 `examples/community-app/downstream/planning.lock.json`, `examples/community-app/downstream/delivery-evidence.json`, `examples/community-app/downstream/change-proposals.json`에 작성한다
- [x] T045 [US3] 완전한 candidate 검증 후에만 temporary lock을 원자 교체하고 실패 시 기존 lock을 보존하는 `.harness/scripts/docs/lib/apply-planning-lock.mjs`를 구현해 T042를 통과시킨다
- [x] T046 [US3] Spec/status/tasks/verification과 declared evidence를 certainty/source와 함께 결합하는 `.harness/scripts/docs/lib/scan-delivery-evidence.mjs`를 구현해 T040을 통과시킨다
- [x] T047 [US3] field ownership, digest, source revision과 last-good context를 비교하고 difference를 evidence-backed change proposal projection으로 만드는 `.harness/scripts/docs/lib/reconcile-planning-delivery.mjs`를 구현해 T041을 통과시킨다
- [x] T048 [US3] need↔feature↔screen↔Spec↔verification matrix와 optional traceability graph를 `.harness/scripts/docs/lib/render-hub.mjs`에 구현한다
- [x] T049 [US3] actor/goal/action/decision/end flow diagram과 ordered text alternative를 `.harness/scripts/docs/lib/render-hub.mjs`에 구현한다
- [x] T050 [US3] 제품 정의·구현 전달·현실 조정 lens, separate statuses, drift/conflict/proposal와 next action을 `.harness/scripts/docs/lib/render-hub.mjs`의 전달 현황 view에 구현한다
- [x] T051 [US3] source/digest/last success/collection failure/conflict/recovery를 `.harness/scripts/docs/lib/render-hub.mjs`의 동기화 view에 구현한다
- [x] T052 [US3] matrix, flow, pipeline, proposal와 health 시각 체계를 `.harness/scripts/docs/templates/hub.css`에 구현해 T043을 통과시킨다
- [x] T053 [US3] reconcile quickstart 5상태와 source byte 보존 결과를 `specs/010-planning-hub-redesign/verification.md`의 US3 절에 기록한다

**Checkpoint**: 계획과 구현 사실이 분리된 채 차이와 결정 필요성이 설명된다.

---

## Phase 6: User Story 4 — 에이전트와 사람 편집의 일관성 검증 (Priority: P2)

**Goal**: manual/watch/Claude/Codex/CI가 같은 core를 호출하고 hook 사각지대를 strict
merge check가 보완한다.

**Independent Test**: 같은 변경을 세 경로로 처리해 source classification, digest,
health와 projection이 동일하고 생성물이 rebuild loop를 일으키지 않는지 검증한다.

### Tests first

- [x] T054 [P] [US4] `data/`, `specs/`, `examples/`, configured evidence 변경과 generated output 제외 분류 테스트를 `tests/docs-build-on-stop.test.mjs`에 작성하고 실패를 확인한다
- [x] T055 [P] [US4] manual/Claude/Codex normalized trigger, no-op digest skip, Automation Run의 trigger/digest/duration/last-success 기록과 ordinary sync/watch/Stop이 Planning Lock을 변경하지 않는 테스트를 `tests/planning-automation.test.mjs`에 작성하고 실패를 확인한다
- [x] T056 [P] [US4] Codex Stop JSON stdout/exit 0과 shared core 호출 parity 테스트를 `tests/codex-stop.test.mjs`에 추가하고 실패를 확인한다
- [x] T057 [P] [US4] strict check가 invalid manifest/digest/broken relation/stale output/conflict를 실패시키는 테스트를 `tests/planning-check.test.mjs`에 작성하고 실패를 확인한다

### Implementation

- [x] T058 [US4] validate/collect/reconcile/build/run-log를 공유하고 명시적 `--pull`에서만 `.harness/scripts/docs/lib/apply-planning-lock.mjs`를 호출하는 CLI를 `.harness/scripts/docs/planning-sync.mjs`에 구현해 T042와 T055를 통과시킨다
- [x] T059 [US4] strict merge-ready 검증과 stale generated snapshot 비교를 `.harness/scripts/docs/planning-check.mjs`에 구현해 T057을 통과시킨다
- [x] T060 [US4] debounced relevant-source 감시와 concurrent run lock을 `.harness/scripts/docs/planning-watch.mjs`에 구현한다
- [x] T061 [US4] 기존 `hasSpecsChange`를 source-group classifier/shared sync adapter로 확장하고 generated output을 제외하도록 `.harness/hooks/docs-build-on-stop.mjs`를 수정해 T054를 통과시킨다
- [x] T062 [US4] Codex payload/cwd normalization만 담당하고 shared adapter를 호출하도록 `.harness/hooks/codex-stop.mjs`를 수정해 T056을 통과시킨다
- [x] T063 [US4] `planning:sync`, `planning:pull`, `planning:check`, `planning:watch` task를 `mise.toml`에 추가하고 root `package.json` 검증 script와 일치시킨다
- [x] T064 [US4] Node CI 검증이 strict planning check를 실행하도록 `.harness/scripts/checks/ci-node-verify.sh`를 갱신하고 기존 호출로 부족한 경우에만 `.github/workflows/ci-node.yml`의 wiring을 최소 수정한다
- [x] T065 [US4] hook syntax, replay, no-op, Automation Run 기록, explicit pull atomicity, timeout recovery와 직접 편집 CI 검출 결과를 `specs/010-planning-hub-redesign/verification.md`의 US4 절에 기록한다

**Checkpoint**: local automation이 없어도 CI에서 같은 일관성 판단을 재현한다.

---

## Phase 7: User Story 5 — 별도 planning-hub로 이동 가능한 계약 유지 (Priority: P3)

**Goal**: repository location을 바꿔도 ID/manifest/evidence 의미를 유지하고 미래
handoff를 문서화한다.

**Independent Test**: planning source root만 fixture의 다른 repository path로 바꿔
동일 manifest digest/entity relation과 explicit behind behavior를 확인한다.

### Tests first

- [x] T066 [P] [US5] repository-neutral relative source, changed repository location과 stable ID/digest portability 테스트를 `tests/planning-portability.test.mjs`에 작성하고 실패를 확인한다
- [x] T067 [P] [US5] external location escape, credential URL와 executable field 거부 테스트를 `tests/planning-contracts.test.mjs`에 추가하고 실패를 확인한다

### Implementation and documentation

- [x] T068 [US5] repository-neutral source descriptor와 safe-root resolution을 `.harness/scripts/docs/lib/scan-workspaces.mjs`와 `.harness/scripts/docs/lib/planning-contracts.mjs`에 구현해 T066-T067을 통과시킨다
- [x] T069 [US5] future planning-hub ownership, publish/pull/proposal handoff와 명시적 비범위를 `docs/planning-hub-handoff.md`에 작성한다
- [x] T070 [US5] irregular source→catalog→detail→manifest 흐름과 no-invention 규칙을 `.harness/skills/codi-feature-definition-normalizer/SKILL.md`에 반영한다
- [x] T071 [US5] workspace/reconcile/sync/check 사용법과 Claude/Codex parity 한계를 `.harness/skills/codi-feature-hub/SKILL.md`에 반영한다
- [x] T072 [US5] hook/rule mirror와 AI-read English 규칙을 `.harness/skills/codi-rule-authoring/SKILL.md`, `.harness/policies/context-engineering.md`, `.claude/settings.json`, `.codex/hooks.json`, `.claude/rules/phase-routing.md`, `.codex/rules/phase-routing.rules`에 점검·반영한다
- [x] T073 [US5] repository-location portability와 external write 미수행 결과를 `specs/010-planning-hub-redesign/verification.md`의 US5 절에 기록한다

**Checkpoint**: 이번 feature는 외부 repository를 만들지 않지만 같은 계약으로 분리할
준비가 완료된다.

---

## Phase 8: Polish, Review and Verification

**Purpose**: 전체 regression, 접근성, 성능, 문서와 완료 상태를 검증한다.

- [x] T074 [P] graph 없이 tree/table/text만으로 sitemap/flow/traceability를 탐색하는 접근성 회귀 테스트를 `tests/feature-hub-render.test.mjs`에 보강한다
- [x] T075 [P] 500 feature/100 screen/50 flow + multi-workspace build가 2초 계약을 유지하는 성능 테스트를 `tests/feature-hub-sitemap-build.test.mjs`에 보강한다
- [x] T076 전체 `npm test`와 `mise run planning:check`를 실행하고 결과를 `specs/010-planning-hub-redesign/verification.md`에 기록한다
- [x] T077 `mise run docs:build` 후 Community Demo/Harness Internal의 wide/narrow/keyboard 브라우저 자동 검증을 수행하고 `specs/010-planning-hub-redesign/verification.md`에 기록한다
- [x] T078 사용자-facing 허브와 handoff 사용법을 `README.md`, `CONTRIBUTING.md`, `docs/planning-hub-handoff.md`에서 교차 검토한다
- [x] T079 `mise run feature:status:sync`를 check-only로 실행하고 deterministic adjacent transition만 `--apply`해 `specs/010-planning-hub-redesign/status.yaml`을 갱신한다
- [x] T080 Spec Kit converge를 실행해 spec/plan/tasks/구현/검증이 `Converged`인지 확인하고 결과를 `specs/010-planning-hub-redesign/verification.md`에 기록한다

---

## Phase 9: User Story 6 — 문서 허브와 통합 Planning Hub 분리 (Priority: P1)

**Goal**: 문서 읽기와 제품 계획 탐색을 두 생성 페이지로 분리하고 기능정의·기능현황,
검색형 화면 구조·가로 확장 조직도를 같은 stable ID 상태로 연결한다.

**Independent Test**: `file://` 문서 허브에서 두 문서 범주를 선택·검색·새로고침하고
Planning Hub로 왕복한 뒤 Community Demo의 14개 screen 조직도와 같은 feature의 정의·현황
선택을 확인한다.

### Tests first

- [x] T081 [P] [US6] Markdown heading/list/table/link/code와 hostile HTML escaping, 문서별 conversion health 실패 테스트를 `tests/docs-markdown-projection.test.mjs`에 작성하고 실패를 확인한다
- [x] T082 [P] [US6] 하네스/프로젝트 범주·목록·본문·fragment 복원과 Planning 링크 실패 테스트를 `tests/docs-page-render.test.mjs`에 작성하고 실패를 확인한다
- [x] T083 [P] [US6] `docs/index.html` 문서 전용·`docs/planning.html` Planning 전용 생성, 두 결과 중 하나의 stale/missing 검출 테스트를 `tests/feature-hub-sitemap-build.test.mjs`와 `tests/planning-check.test.mjs`에 작성하고 실패를 확인한다
- [x] T084 [P] [US6] Community Demo 14개 screen-only node, 결정적 좌표, hierarchy/direct edge 분리와 tree/table ID 동등성 테스트를 `tests/planning-org-chart.test.mjs`에 작성하고 실패를 확인한다
- [x] T085 [P] [US6] 여덟 Planning view, 문서 왕복 링크, 기능 정의↔기능 현황 shared feature selection과 keyboard markup 테스트를 `tests/feature-hub-render.test.mjs`에 작성하고 실패를 확인한다

### Implementation

- [x] T086 [US6] repository-relative Markdown을 안전한 heading/list/table/link/inline-code/fenced-code projection으로 바꾸고 문서 health를 결합하는 `.harness/scripts/docs/lib/render-markdown-document.mjs`와 `.harness/scripts/docs/lib/build-document-projections.mjs`를 구현해 T081을 통과시킨다
- [x] T087 [US6] 범주 sidebar, 검색 가능한 문서 목록, 읽기 패널, fragment 복원과 Planning Hub 링크를 `.harness/scripts/docs/lib/render-docs-page.mjs`에 구현해 T082를 통과시킨다
- [x] T088 [US6] 기존 workspace model을 여덟 view의 별도 페이지로 렌더하고 기능 정의·기능 현황의 feature selection을 공유하도록 `.harness/scripts/docs/lib/render-planning-page.mjs`와 `.harness/scripts/docs/lib/render-hub.mjs`를 분리해 T085를 통과시킨다
- [x] T089 [US6] screen tree를 root/branch/descendant 좌표와 hierarchy/direct edge layer로 변환하는 `.harness/scripts/docs/lib/layout-sitemap-org-chart.mjs`를 구현해 T084를 통과시킨다
- [x] T090 [US6] 조직도 view 전환, SVG node/connector/legend, pan/zoom/fit과 구조 탐색·tree·table shared screen selection을 `.harness/scripts/docs/lib/render-planning-page.mjs`에 구현해 T084-T085를 통과시킨다
- [x] T091 [US6] 문서 3열 reader, Planning 전용 canvas, 조직도 solid/dotted arrow와 1280/768/375 responsive·focus 상태를 `.harness/scripts/docs/templates/hub.css`에 구현한다
- [x] T092 [US6] 한 model에서 두 renderer를 완료한 뒤 `docs/index.html`과 `docs/planning.html`을 쓰고 no-write preview를 반환하도록 `.harness/scripts/docs/build-hub.mjs`를 확장해 T083을 통과시킨다
- [x] T093 [US6] 두 생성물의 missing/stale을 strict 비교하고 둘 다 Stop 입력에서 제외하도록 `.harness/scripts/docs/planning-check.mjs`, `.harness/scripts/docs/planning-sync.mjs`, `.harness/hooks/docs-build-on-stop.mjs`를 수정해 T083과 automation 회귀를 통과시킨다
- [x] T094 [US6] 문서 허브·Planning Hub 명령과 source/generated ownership을 `README.md`, `CONTRIBUTING.md`, `docs/planning-hub-handoff.md`, `.harness/skills/codi-feature-hub/SKILL.md`에 반영한다

**Checkpoint**: 문서와 제품 계획이 각 전용 페이지에서 즉시 보이고 동일 source 기반
조직도와 feature 상태 탐색이 local file 환경에서 동작한다.

---

## Phase 10: Continuation Review and Verification

- [x] T095 [P] US6 focused test와 기존 renderer/build/automation 회귀를 실행하고 결과를 `specs/010-planning-hub-redesign/verification.md`에 기록한다
- [x] T096 전체 `npm test`, `mise run docs:build`, `mise run planning:check`, `./harness context-check`, `./harness rule-check`, `npm run codex:replay-check`를 실행하고 결과를 `specs/010-planning-hub-redesign/verification.md`에 기록한다
- [x] T097 `file://`에서 하네스/프로젝트 문서 전환·본문·fragment, Planning 왕복, 기능 선택 공유, 조직도 pan/zoom/fit/선택을 1280×720·768×1024·375×812·keyboard로 검증해 `specs/010-planning-hub-redesign/verification.md`에 기록한다
- [x] T098 (철회 — 2026-08-03 소유자 결정, 감사 D-2) 실사용자 5명 사용성 검증 요구를 철회한다. 사유: 해당 기능(Planning Hub)의 존속 여부 자체가 미정이라 검증 투자가 정당화되지 않음. 원 요구는 기록으로 보존하며, 기능 존속이 확정되면 별도 spec 으로 재개한다
- [x] T099 `mise run feature:status:sync`를 check-only로 실행하고 deterministic adjacent transition만 `--apply`해 `specs/010-planning-hub-redesign/status.yaml`을 갱신한다
- [x] T100 Spec Kit converge로 FR-001~FR-050, SC-001~SC-015, plan과 task 구현·검증이 `Converged`인지 확인해 `specs/010-planning-hub-redesign/verification.md`에 기록한다
- [x] T101 (T098 철회로 완료 조건 충족 — 2026-08-03) root `ROADMAP.md` 상태 갱신 및 CHANGELOG(v1.3.3 절) 반영은 specs/017 T002 에서 수행

---

## Phase 11: Feature Work-Item Foundation Continuation

> **Continuation supersession**: 완료된 T024/T050/T085/T088은 당시 7~8개 보기
> 구현 이력을 보존한다. 승인된 후속 설계에서는 T118/T123이 이를 여섯 제품 보기와
> `운영·고급` 구조로 대체하며, 이후 검증은 새 구조를 정본으로 사용한다.

**Purpose**: 승인 상세 계획 Task 2~5에 따라 FeatureDefinition 1:N
FeatureWorkItem 계약, legacy 호환, 완료 집계와 workspace 연결을 TDD로 추가한다.

**⚠️ CRITICAL**: T102~T105의 RED를 확인하기 전 대응 구현 task를
시작하지 않는다. 구현 작업의 상태는 planning drift lifecycle을 변경하지 않는다.

### Tests first

- [x] T102 [P] work-item ownership, required field, enum, placement role와 legacy compatibility 계약 테스트를 `tests/planning-feature-work-items.test.mjs`, `tests/feature-definition-schema.test.mjs`, `tests/planning-contracts.test.mjs`에 작성하고 실패를 확인한다
- [x] T103 explicit 1:N 보존, legacy 단일 unspecified/unassigned 투영, invalid·duplicate·broken parent·repository-shaped field·input immutability 테스트를 `tests/planning-feature-work-items.test.mjs`에 작성하고 실패를 확인한다
- [x] T104 done guard, zero-work, mixed status precedence, Release filter, hold count와 deterministic rollup 테스트를 `tests/planning-feature-work-items.test.mjs`에 작성하고 실패를 확인한다
- [x] T105 [P] workspace work items/rollups, legacy fixture, unchanged planning drift와 work-item health summary 테스트를 `tests/planning-workspaces.test.mjs`, `tests/planning-reconcile.test.mjs`, `tests/planning-demo-data.test.mjs`에 작성하고 실패를 확인한다

### Implementation

- [x] T106 feature work-item, feature group/placement/target Release와 optional explicit workItems metadata를 `.harness/config/feature-work-item-schema.json`, `.harness/config/feature-detail-schema.json`, `.harness/config/delivery-evidence-schema.json`에 구현해 T102를 통과시킨다
- [x] T107 explicit work-item validation과 same-feature legacy suppression, stable health 및 no-inference projection을 `.harness/scripts/docs/lib/normalize-feature-work-items.mjs`에 구현해 T103을 통과시킨다
- [x] T108 completion guard와 Release-aware feature rollup을 `.harness/scripts/docs/lib/aggregate-feature-work-items.mjs`에 순수 함수로 구현해 T104를 통과시킨다
- [x] T109 normalized work items/rollups를 `.harness/scripts/docs/lib/build-workspace-hub-model.mjs`에 연결하고 planning drift와 분리된 work-item health summary를 `.harness/scripts/docs/lib/reconcile-planning-delivery.mjs`에 추가해 T105를 통과시킨다
- [x] T110 Community Demo의 명시적 frontend/backend/qa 작업과 planning feature group/placement/target Release를 `examples/community-app/downstream/delivery-evidence.json`, `examples/community-app/planning/feature-definitions.json`에 추가하고 기존 의도적 drift fixture를 보존한다

**Checkpoint**: invalid 작업은 원본을 수정하지 않고 health로 격리되며 기능 1개에
여러 Release/work type/status 작업을 연결하고 집계할 수 있다.

---

## Phase 12: User Story 7 — Placement Explorer and Work-Item Status (Priority: P1)

**Goal**: 승인 상세 계획 Task 6~7에 따라 기능 정의를 화면 배치 중심으로 탐색하고
같은 feature 컨텍스트에서 project-owned 작업 Kanban과 기능별 보기를 사용한다.

**Independent Test**: Community Demo의 `FEAT-POST-CREATE`를 화면/그룹에서 찾아
기능 현황으로 이동하고 Release/work type/hold 필터, Kanban/기능별 전환과 근거 상세를
왕복해 같은 feature ID와 독립 work-item ID 선택을 확인한다.

### Tests first

- [x] T111 [P] [US7] Surface/Screen·group·placement·검색·rollup markup과 기능 현황 이동 시 shared feature selection 테스트를 `tests/planning-feature-workbench-render.test.mjs`, `tests/feature-hub-render.test.mjs`에 작성하고 실패를 확인한다
- [x] T112 [US7] 네 status column, work-item card, feature context, Release/group/work type/hold/query filter, Kanban/기능별 전환과 독립 work-item selection 테스트를 `tests/planning-feature-workbench-render.test.mjs`에 작성하고 실패를 확인한다

### Implementation

- [x] T113 [US7] demo 기능의 explicit group/typed placements/target Release와 legacy screenIds 동등성을 `examples/community-app/planning/feature-definitions.json`에 완성해 T111 fixture 계약을 통과시킨다
- [x] T114 [US7] placement-first definition client model과 세 영역 탐색 renderer를 `.harness/scripts/docs/lib/render-feature-workbench-view.mjs`에 구현하고 `.harness/scripts/docs/lib/render-planning-page.mjs`의 shared feature state에 연결해 T111을 통과시킨다
- [x] T115 [US7] feature-context Kanban, 기능별 계층 보기, 공통 필터와 task/acceptance/evidence blocker 상세를 `.harness/scripts/docs/lib/render-feature-workbench-view.mjs`, `.harness/scripts/docs/lib/render-planning-page.mjs`에 구현한 뒤 기존 feature-level status row를 제거해 T112를 통과시킨다

**Checkpoint**: 기능 정의는 어디에 만들지를, 기능 현황은 어떤 프로젝트 작업과
근거가 남았는지를 같은 feature ID에서 설명한다.

---

## Phase 13: User Story 7 — Goal Flow, Coverage and Navigation (Priority: P1)

**Goal**: 승인 상세 계획 Task 8~10에 따라 목표 흐름, 확장 가능한 추적성 기본 화면과
여섯 제품 보기 + 운영·고급 정보 위계를 구현한다.

**Independent Test**: 사용자 목표의 정상·결정·실패·복구를 순서형 대안과 비교하고,
누락 queue에서 선택 기능의 국소 관계를 연 뒤 operations를 열고 닫아도 제품 보기
선택이 유지되는지 확인한다.

### Tests first

- [x] T116 [P] [US7] 정상 path, branch kind, screen/feature ID, broken target, cycle와 ordered alternative projection 테스트를 `tests/planning-user-flow-story.test.mjs`에 작성하고 실패를 확인한다
- [x] T117 [P] [US7] coverage counts, severity-sorted gaps, bounded neighborhood, matrix/CSV secondary와 500 feature/2,000 work-item scale 테스트를 `tests/planning-traceability-coverage.test.mjs`에 작성하고 실패를 확인한다
- [x] T118 [P] [US7] 정확한 여섯 product view, delivery/sync button 제거, operations open/close state와 `계층 목록(접근성 보기)` parity 테스트를 `tests/feature-hub-render.test.mjs`, `tests/planning-sitemap-render.test.mjs`에 작성하고 실패를 확인한다

### Implementation

- [x] T119 [US7] bounded traversal, branch health와 ordered text를 `.harness/scripts/docs/lib/build-user-flow-story.mjs`에 구현해 T116 model test를 통과시킨다
- [x] T120 [US7] goal story path, attached decision/failure/recovery, selected-step detail과 조건부 role lane을 `.harness/scripts/docs/lib/render-user-flow-story-view.mjs`에 구현하고 `.harness/scripts/docs/lib/render-planning-page.mjs`에 연결해 T116 render test를 통과시킨다
- [x] T121 [US7] indexed coverage, recovery gap queue와 bounded selected neighborhood를 `.harness/scripts/docs/lib/build-traceability-coverage.mjs`에 구현해 T117 model/scale test를 통과시킨다
- [x] T122 [US7] coverage dashboard, gap drill-down, local relation explorer와 collapsed matrix/CSV controls를 `.harness/scripts/docs/lib/render-traceability-coverage-view.mjs`에 구현하고 `.harness/scripts/docs/lib/render-planning-page.mjs`에 연결해 T117 render test를 통과시킨다
- [x] T123 [US7] product navigation을 개요·화면 구조·기능 정의·기능 현황·사용자 흐름·추적성으로 제한하고 delivery evidence를 overview/status에, version/digest·sync·automation을 operations disclosure에 배치하도록 `.harness/scripts/docs/lib/render-planning-page.mjs`를 수정해 T118을 통과시킨다

**Checkpoint**: 일상 제품 질문은 여섯 보기에서 해결하고 운영 문제는 같은 선택
컨텍스트를 깨지 않는 보조 영역에서 해결한다.

---

## Phase 14: User Story 7 — Responsive and Accessibility Completion (Priority: P1)

**Goal**: 승인 상세 계획 Task 11의 반응형·키보드·색상 비의존 계약과 대용량 활성
DOM 경계를 구현한다.

**Independent Test**: 1280×720, 768×1024와 375×812에서 keyboard-only로 화면 →
기능 → work item → evidence, story branch와 gap neighborhood를 탐색한다.

### Tests first

- [x] T124 [US7] feature explorer/Kanban/story/gap selector, 900px·600px breakpoint, focus-visible, reduced-motion, 44px control과 bounded active DOM CSS/client 계약 테스트를 `tests/planning-feature-workbench-render.test.mjs`, `tests/planning-user-flow-story.test.mjs`, `tests/planning-traceability-coverage.test.mjs`에 작성하고 실패를 확인한다

### Implementation

- [x] T125 [US7] desktop/tablet/mobile grid·scroll·sticky summary, 색상 비의존 label, focus-visible와 reduced-motion을 `.harness/scripts/docs/templates/hub.css`에 구현해 T124를 통과시킨다

---

## Phase 15: Continuation Documentation, Review and Verification

**Purpose**: 승인 상세 계획 Task 12를 수행하고 새 화면을 기존 인간 완료 gate로
연결한다. 문서 변경은 TDD 예외지만 생성/계약 회귀와 브라우저 검증은 필수다.

- [x] T126 planning package/project ownership, FeatureDefinition 1:N FeatureWorkItem, Release 속성, legacy unspecified, 여섯 보기와 operations 계약을 `README.md`, `CONTRIBUTING.md`, `docs/planning-hub-handoff.md`, `.harness/skills/codi-feature-hub/SKILL.md`에 반영한다
- [x] T127 focused continuation tests와 전체 `npm test`, `mise run docs:build`, `mise run planning:check`, `./harness context-check`, `./harness rule-check`, `npm run codex:replay-check`, `git diff --check`를 실행하고 결과를 `specs/010-planning-hub-redesign/verification.md`에 기록한다
- [x] T128 500 feature/2,000 work-item/100 screen/50 flow 표본의 2초 build, bounded neighborhood와 active workspace 비중복을 `tests/planning-traceability-coverage.test.mjs`, `tests/feature-hub-render.test.mjs`에서 검증하고 결과를 `specs/010-planning-hub-redesign/verification.md`에 기록한다
- [x] T129 `file://`의 1280×720·768×1024·375×812·keyboard에서 기능 배치 탐색, Kanban/기능별 보기, filter, flow recovery, gap drill-down, operations와 console error 0을 검증해 `specs/010-planning-hub-redesign/verification.md`에 기록한다
- [x] T130 `mise run feature:status:sync` check-only와 deterministic adjacent `--apply`, Spec Kit converge를 실행해 FR-001~FR-070, SC-001~SC-024와 미완료 구현 gap을 `specs/010-planning-hub-redesign/status.yaml`, `specs/010-planning-hub-redesign/verification.md`, `specs/010-planning-hub-redesign/tasks.md`에 반영한다

**Human completion order**: T102~T130 완료와 converge 후 기존 T098을 새 화면으로
수행한다. T098 통과 전 T101은 계속 미완료이며 agent/browser QA로 대체하지 않는다.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: 즉시 시작 가능.
- **Foundation (Phase 2)**: Setup 이후; 모든 story의 blocker.
- **US1 (Phase 3)**: Foundation 이후 MVP.
- **US2 (Phase 4)**: Foundation 이후 data path는 진행 가능하지만 최종 UI 통합은 US1
  navigation/workspace shell에 의존.
- **US3 (Phase 5)**: Foundation 이후 reconcile core는 진행 가능하지만 전달/동기화
  UI 통합은 US1에 의존.
- **US4 (Phase 6)**: US3 sync/reconcile entrypoint와 strict validation 의미에 의존.
- **US5 (Phase 7)**: Foundation 이후 portability test/document는 병렬 가능하며 최종
  handoff review는 US3-US4 계약을 반영.
- **Polish (Phase 8)**: 선택한 모든 story 완료 후.
- **US6 continuation (Phase 9)**: 승인된 페이지 분리 설계에 따라 T081-T085 test가
  실패한 뒤 T086-T094를 실행한다. 기존 Planning model과 source ownership은 선행
  완료된 Foundation/US1-US5에 의존한다.
- **Continuation verification (Phase 10)**: US6 완료 후에만 실행한다.
- **Work-item foundation continuation (Phase 11)**: 기존 Foundation/US3 evidence 모델
  이후 시작하며 T102~T105 RED를 먼저 확인한 뒤 T106→T110 순서로 구현한다.
- **US7 workbench (Phase 12)**: Phase 11 이후 T111 RED부터 시작하고 T114 RED가
  확인된 뒤 기존 status row를 대체한다.
- **US7 flow/coverage/navigation (Phase 13)**: Phase 11 이후 projection test는 준비할
  수 있으나 `render-planning-page.mjs` 통합은 Phase 12 다음에 순차 수행한다.
- **US7 responsive completion (Phase 14)**: Phase 12~13 render markup이 고정된 뒤다.
- **Continuation docs/verification (Phase 15)**: 선택한 모든 새 slice 완료 후 수행한다.
  T130 converge 뒤 T098 human test, 마지막으로 T101 completion update 순서다.

### User story dependency graph

```text
Foundation
  ├── US1 Product Structure ──┬── US2 Feature Detail
  │                           └── US3 Reconcile ── US4 Automation
  └── US5 Portability (contracts/docs; final review waits for US3-US4)
Completed baseline ── Work-item foundation ── US7 Workbench
                                         └── US7 Flow/Coverage/Nav
                                                └── Responsive/Verification ── T098 ── T101
```

### Within each user story

1. Test tasks를 작성하고 실패를 확인한다.
2. Source/fixture/model implementation을 완료한다.
3. Renderer 또는 adapter integration을 완료한다.
4. Story-specific tests를 통과시킨다.
5. Independent browser/CLI verification을 기록한다.

## Parallel Opportunities

- T002-T003 setup fixtures는 서로 다른 경로다.
- T004-T007 foundation tests는 서로 다른 contract/legacy concerns다.
- T008 schema metadata는 T009-T011 implementation 전 준비 가능하다.
- T016-T019 US1 tests와 T020 demo source authoring은 독립 파일에서 진행 가능하다.
- T030-T032 US2 tests와 T033 detail authoring은 독립 파일에서 진행 가능하다.
- T040-T043 US3 tests와 T044 downstream demo authoring은 독립 파일에서 진행 가능하다.
- T054-T057 automation tests는 독립 test files다.
- T066-T067 portability/security tests와 T069 handoff outline은 독립 경로다.
- T081-T085 US6 tests는 서로 다른 Markdown projection/document page/page-set/layout/interaction 계약이다.
- T102, T105는 contract와 workspace/reconcile의 서로 다른 test file 집합이다.
- T116, T117, T118은 flow, traceability, navigation의 서로 다른 focused test files다.
- Phase 12~14 implementation은 `render-planning-page.mjs`와 `hub.css`를 공유하므로
  병렬 수정하지 않고 task ID 순서로 통합한다.

Subagent 사용은 별도 사용자 승인이 있을 때만 가능하다. `[P]`는 dependency 정보이며
자동 위임 권한이 아니다.

## Parallel Example: User Story 1

```text
Task T016: demo count/health contract tests in tests/planning-demo-data.test.mjs
Task T017: workspace default/no-fallback tests in tests/planning-workspaces.test.mjs
Task T018: navigation/source badge tests in tests/feature-hub-render.test.mjs
Task T019: screen-only sitemap tests in tests/planning-sitemap-render.test.mjs
Task T020: Community Demo planning source files in examples/community-app/planning/
```

## Implementation Strategy

### MVP first

1. Complete Setup and Foundation.
2. Complete US1 only.
3. Stop and validate Community Demo/Harness Internal separation and screen-only sitemap.
4. Review visual behavior before rich detail/reconcile automation expands the UI.

### Incremental delivery

1. Contract/digest foundation without UI behavior change.
2. Workspace + conventional sitemap MVP.
3. Rich feature definition and unambiguous status semantics.
4. Plan/delivery reconcile and change proposals.
5. Shared automation/CI guarantee.
6. Repository portability and final documentation.

### Safety rules

- Never rewrite human-owned `data/`, Spec, planning or delivery source during build/check.
- Keep generated outputs out of change triggers.
- Preserve existing 007-009 dirty-tree work and regression tests.
- Do not create the external planning-hub repository or perform cross-repository writes.
- Do not commit unless the user explicitly grants commit permission.
