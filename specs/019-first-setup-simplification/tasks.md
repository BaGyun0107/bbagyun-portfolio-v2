# Tasks: 최초 프로젝트 설정 단순화

**Input**: Design documents from `/specs/019-first-setup-simplification/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: 요청됨(TDD) — 스킬 계약 테스트(T003)와 스켈레톤 구성 테스트
(T008)를 각 구현보다 먼저 배치. data-model/contracts 없음.

**Organization**: 유저 스토리별 페이즈. **구현 착수(T003~)는 018 PR 머지
후**(FR-009) — Phase 1~2는 계획 산출물 커밋과 착수 게이트만 담당.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 계획 산출물 커밋·푸시 (specs/019-first-setup-simplification/ —
  spec, plan, research, quickstart, checklists, tasks) + status.yaml·카탈로그
  (data/feature-definitions.json, data/feature-relations.json) 등재

---

## Phase 2: Foundational (착수 게이트)

- [x] T002 018 PR(#129) 머지 확인 후 release/v1.4.1 리베이스 — 충돌 파일
  (README.md, install.sh 계열) 정리. **머지 전 구현 착수 금지** (FR-009)

---

## Phase 3: User Story 1 - 대화형 초기화 기본 경로 (P1) 🎯 MVP

**Goal**: 플래그 암기 없이 스킬 대화만으로 신규 프로젝트 초기화, git
히스토리 재시작 보장.

**Independent Test**: quickstart V1.

- [x] T003 [US1] (TDD RED) `tests/init-project-skill-contract.test.mjs`
  신설 — SKILL.md 본문 Workflow 1단계에 "git 히스토리 재시작" 질문 존재,
  Commands 절에 신규 경로 표준 호출(`--reset-git` 포함) 존재를 검사, 현
  상태 실패 확인
- [x] T004 [US1] `.harness/skills/init-project/SKILL.md` Workflow 1단계
  필수 질문에 "신규 프로젝트면 git 히스토리 재시작(--reset-git) 적용 —
  기본 예" 추가, Commands 예시에 신규/임포트 표준 호출 구분 (T003 GREEN)
- [x] T005 [P] [US1] `.harness/skills/init-project/references/flow.md`에
  신규 경로 실행 단계(--reset-git 포함 호출) 반영, import-mode.md와 표현
  일치 확인
- [x] T006 [US1] `README.md` 시나리오 A 재작성 — 기본: clone → `./harness
  claude` → 스킬 대화, 보조: CLI 플래그(스크립트/CI용) (FR-002)
- [x] T007 [US1] 스킬 경로 실검증 — 임시 디렉터리에서 대화 흐름으로 초기화
  1회 재현, 결과를 `specs/019-first-setup-simplification/evidence.md`에 기록

**Checkpoint**: SC-001, SC-002 충족 — MVP 성립.

---

## Phase 4: User Story 2 - CLI 단일 정본 유지 (P2)

**Goal**: 스킬은 정본 CLI 래퍼임을 상시 보장.

**Independent Test**: quickstart V2.

- [x] T008 [US2] (TDD RED 확장) T003 테스트에 "SKILL.md·flow.md의 실행
  명령은 `./harness init-project`/`wire-infisical` 정본 호출만 존재(직접
  git 조작·별도 초기화 로직 금지)" 검사 추가
- [x] T009 [US2] 검사에서 드러난 위반(있다면) 정리 — 스킬 문서의 실행
  명령을 정본 CLI로 수렴 (T008 GREEN)
- [x] T010 [US2] 동일 입력 스킬/CLI 결과 트리 비교 1회 수행, evidence.md에
  기록 (SC-003)

**Checkpoint**: SC-003 충족.

---

## Phase 5: User Story 3 - 스켈레톤 시작점 (P3)

**Goal**: `new-project` 스켈레톤 생성 → bootstrap으로 합류자와 동일 경험.

**Independent Test**: quickstart V3, V4.

- [x] T011 [US3] (TDD RED) `tests/new-project-skeleton.test.mjs` 신설 —
  임시 디렉터리 생성 결과에 필수 파일(런처, harness.lock, mise.toml,
  .gitignore, AGENTS/CLAUDE 씨앗, README 스텁) 존재 + 하네스-자체 잔재
  0건 + 런처 실행 가능(sh -n) 검사, 스크립트 부재로 실패 확인
- [x] T012 [US3] `.harness/scripts/setup/new-project-skeleton.sh` 구현 —
  스켈레톤 파일 목록 단일 정본, 빈 디렉터리 검증, 멱등 재실행 (T011 GREEN)
- [x] T013 [US3] `harness` 런처에 `new-project` 하위명령 추가 + 도움말 갱신
- [x] T014 [P] [US3] `.harness/scripts/setup/init-project.sh` — 스켈레톤
  출발 판정(harness.lock 존재 + upstream 시그니처 부재, R4) 시 히스토리/
  잔재 정리 단계 건너뛰기, 관련 테스트 갱신 (FR-006)
- [x] T015 [P] [US3] `.harness/docs/packaging-guide.md`에 스켈레톤 경로
  문서화, README 시나리오 A에 신규 기본 경로로 반영 (R5)
- [x] T016 [US3] 스켈레톤 → bootstrap → doctor 실검증(quickstart V3) 1회
  수행, evidence.md에 기록 (SC-004, SC-005)
- [x] T017 [US3] 릴리스 동기화 검증(quickstart V4) — lock 채널 해석 버전 =
  최신 릴리스 확인, evidence.md 기록 (SC-006)

**Checkpoint**: SC-004~SC-006 충족.

---

## Phase 6: Polish & Cross-Cutting

- [x] T018 품질 게이트 4종(rule-check, context-check, doctor, npm test)
  실행·기록, verification.md 작성
- [x] T019 [P] 루트 `ROADMAP.md`에 019 반영, `mise run feature:status:sync`
  실행
- [x] T020 019 PR 생성(대상: 현행 릴리스 브랜치) → 사용자 머지 대기

---

## Dependencies

- T001(계획 커밋)만 즉시 실행 가능. **T002가 모든 구현의 게이트** —
  018 PR #129 머지 전 T003~ 착수 금지 (FR-009).
- US1(T003~T007) → US2(T008~T010): 계약 테스트 확장은 US1 테스트 위에.
- US3(T011~T017)은 US1/US2와 독립 — T002 이후 병렬 가능. 단 T015의 README
  수정은 T006과 같은 파일이므로 순차.
- T003 → T004 → T005/T006, T011 → T012 → T013~T015 (테스트 먼저).

## Parallel Example

- US1: T005 ∥ (T006은 T004 뒤). US3: T014 ∥ T015(단 README 부분은 T006
  이후), T012 완료 후 T013.

## Implementation Strategy

MVP = US1(스킬 승격 + 갭 수정)만으로 플래그 암기 문제가 해소된다. US2가
정본 단일성을 잠그고, US3이 구조적 원인(full clone 출발)을 제거한다.
전 구간 TDD(RED→GREEN), 각 체크포인트에서 중단 가능.

## Notes

- (기록 예정)
