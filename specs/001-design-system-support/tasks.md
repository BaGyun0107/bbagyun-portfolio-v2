# Tasks: 프로젝트별 디자인 시스템 지원 구조 (codi-design-system)

**Input**: Design documents from `/specs/001-design-system-support/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 포함 (사용자 명시 요청 — TDD: 대비 스크립트는 테스트 먼저)

**Organization**: 사용자 스토리별 그룹 — 각 스토리는 독립 구현/검증 가능

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

**Purpose**: 구현 커밋이 가능한 상태 만들기

- [x] T001 PR #69(skills-link 외부 소유 디렉터리 fix) 머지 확인 후 v2를
      이 브랜치에 merge — `.harness/scripts/setup/skills-link.sh`에 fix가
      반영됐는지 확인 (없으면 pre-commit이 speckit-* 디렉터리에서 fail)
- [x] T002 스킬 골격 생성: `.harness/skills/codi-design-system/SKILL.md`
      (frontmatter만) + `resources/` 디렉터리

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 스토리가 의존하는 템플릿과 검증 게이트

**⚠️ CRITICAL**: 이 단계 완료 전 스토리 작업 시작 금지

- [x] T003 [P] (TDD) 대비 계산 단위 테스트 작성 —
      `tests/design-system-contrast.test.mjs`: 알려진 쌍 대비율(흰/검
      21:1 등), OKLCH→sRGB 변환, 4.5:1 미만 실패 판정, `.dark` 키 누락
      검출. 이 시점에는 실패(red)여야 함
- [x] T004 대비 계산 스크립트 구현 —
      `.harness/skills/codi-design-system/resources/contrast-check.mjs`
      (순수 JS, 입력 tokens.css 경로, 출력 쌍별 JSON + exit code) →
      T003 테스트 그린
- [x] T005 [P] 토큰 템플릿 작성 —
      `.harness/skills/codi-design-system/resources/tokens-template.css`
      (shadcn 시맨틱 토큰 전체, :root/.dark 쌍, 중립 OKLCH 기본값,
      @theme inline 매핑)
- [x] T006 [P] 원칙 문서 템플릿 작성 —
      `.harness/skills/codi-design-system/resources/design-system-template.md`
      (data-model.md의 7개 섹션 골격 + 작성 안내, composition+cva 내장)
- [x] T007 템플릿 기본값 자체가 게이트를 통과하는지 검증 —
      `node .harness/skills/codi-design-system/resources/contrast-check.mjs`
      를 tokens-template.css에 실행해 AA 전부 통과 확인

**Checkpoint**: 템플릿 + 게이트 준비 완료 — 스토리 구현 시작 가능

---

## Phase 3: User Story 1 - 대화형 디자인 시스템 생성 (P1) 🎯 MVP

**Goal**: 브랜드 질문 답변만으로 검증된 토큰 + 문서가 표준 위치에 생성

**Independent Test**: quickstart.md 시나리오 2 (임시 프로젝트 e2e)

- [x] T008 [US1] SKILL.md에 계약 절 작성 —
      `.harness/skills/codi-design-system/SKILL.md`:
      contracts/design-system-contract.md의 표준 위치/형식/우선순위/
      로딩 규칙/확장 경로를 계약 절로 이식
- [x] T009 [US1] SKILL.md에 생성 모드 프로세스 작성 — 모드 탐지(파일
      존재), backend-only 프로파일 중단, 브랜드 질문 순서(무드→주색상→
      타이포·CJK→라운드/밀도, 하나씩), 템플릿 치환, contrast-check 게이트
      실행+실패 시 조정안 루프, 문서 생성, globals.css import 연결 확인
- [x] T010 [US1] `./harness skills-link` 실행 — `.claude/skills/`와
      `.agents/skills/` 머지 트리에 codi-design-system 반영 확인
- [x] T011 [US1] quickstart 시나리오 2 수동 e2e — 임시 프로젝트에서 생성
      모드 실행(저대비 색 포함 → 게이트 동작 확인), 결과 기록을
      specs/001-design-system-support/에 남김

**Checkpoint**: US1 = 독립 배포 가능한 MVP

---

## Phase 4: User Story 2 - 에이전트가 디자인 시스템을 따름 (P2)

**Goal**: codi-frontend가 표준 경로를 필독하고 시맨틱 토큰만 사용

**Independent Test**: quickstart.md 시나리오 4

- [x] T012 [P] [US2] codi-frontend 계약 교체 —
      `.harness/skills/codi-frontend/SKILL.md`: `packages/design-tokens`
      참조를 표준 경로(tokens.css + docs/design-system.md)로 교체하고
      UI 작업 전 두 파일 읽기 단계 명시
- [x] T013 [P] [US2] 토큰 소스 경로 교체 —
      `.harness/skills/codi-frontend/resources/tailwind-rules.md`의
      "packages/design-tokens" 절을 표준 경로 + 우선순위 규칙으로 갱신
- [x] T014 [P] [US2] 공용 표준 우선순위 추가 —
      `.harness/imported-rules/design.md`에 "프로젝트 디자인 시스템
      우선, 없으면 이 문서" 1절 + 사전 로드 금지(온디맨드) 원칙 명시
- [x] T015 [US2] quickstart 시나리오 4 수동 검증 — 임시 프로젝트에서 UI
      작업 요청, 하드코딩 색상 0건 확인

---

## Phase 5: User Story 3 - 기존 디자인 시스템 수정 (P3)

**Goal**: 수정 모드가 토큰-문서 동기화를 강제

**Independent Test**: quickstart.md 시나리오 3

- [x] T016 [US3] SKILL.md에 수정 모드 절 작성 — 현재 값 요약 표시, 변경
      항목 질문, 부분 갱신 + 게이트 재검증, 문서 해당 절 + 결정 기록
      동시 갱신(동기화 강제), 부분 상태(토큰만 존재) 복구 처리
- [x] T017 [US3] quickstart 시나리오 3 수동 검증 — 주 색상 변경 후
      토큰/문서 동시 갱신 확인, 부분 상태 엣지 케이스 포함

---

## Phase 6: User Story 4 - 초기화 시 안내 (P4)

**Goal**: init-project 흐름에서 발견 가능성 확보

**Independent Test**: 초기화 흐름 실행 시 안내 1줄 출력

- [x] T018 [US4] init-project 안내 추가 —
      `.harness/skills/init-project/references/flow.md`의 프론트 구성
      완료 지점에 codi-design-system 안내 1줄 (강제 아님)

---

## Phase 7: Polish & Cross-Cutting

- [x] T019 [P] 스킬 트리거 등록 —
      `.harness/config/skill-triggers.json`에 "디자인 시스템", "토큰",
      "브랜드 컬러", "design system" 키워드 → codi-design-system
- [x] T020 회귀 스위트 — `npm test`(T003 포함 전체 그린),
      `./harness doctor` 실패 0, `./harness skills-link`에서 speckit-*
      공존 유지 확인 (quickstart 시나리오 5)
- [x] T021 완료 처리 — speckit-converge로 잔여 작업 확인("Converged"
      까지), 루트 `ROADMAP.md`에 기능 상태 반영, PR 준비

---

## Dependencies

- Phase 1 → Phase 2 → 각 스토리 phase (3~6) → Phase 7
- T003(테스트) → T004(구현): TDD red→green 순서 고정
- US1(Phase 3)이 MVP — US2~US4는 US1 없이도 파일상 독립이지만, 검증
  (T015/T017)은 US1 산출물이 있어야 의미 있음
- T012~T014, T018~T019는 서로 다른 파일이라 [P] 병렬 가능

## Parallel Example

```text
Phase 2: T003(테스트) ∥ T005(토큰 템플릿) ∥ T006(문서 템플릿)
Phase 4: T012 ∥ T013 ∥ T014 (서로 다른 파일)
```

## Implementation Strategy

- **MVP 우선**: Phase 1→2→3까지가 최소 배포 단위 (스킬 생성 모드 동작)
- **증분 전달**: US2(에이전트 준수)는 별도 커밋으로 — codi-frontend
  변경은 기존 스킬 회귀 위험이 있어 독립 리뷰가 유리
- **커밋 단위**: Phase별 1커밋 권장, 각 커밋 전 npm test 그린 유지
