# Implementation Plan: 프로젝트별 디자인 시스템 지원 구조 (codi-design-system)

**Branch**: `feat/feature-hub-and-status-flow` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-design-system-support/spec.md`

## Summary

하네스가 프로젝트별 디자인 시스템의 계약(위치·형식·프로세스)을 소유하고
값은 프로젝트가 소유한다. 구현물: 신규 shared 스킬
`codi-design-system`(대화형 생성/수정 + WCAG AA 검증 게이트) + 중립
기본값 템플릿 2개 + 대비 계산 스크립트, 그리고 기존 자산 5개 파일 연결
(codi-frontend 계약 교체, design.md 우선순위, skill-triggers,
init-project 안내). deep-research로 검증된 관행(CSS 변수 토큰, 스킬 기반
JIT 로딩, 문서를 에이전트 입력으로) 기반.

## Technical Context

**Language/Version**: 스킬 본문은 Markdown(SKILL.md), 템플릿은 CSS/MD,
대비 계산 스크립트는 Node.js 24 (mise 관리, 기존 하네스 스크립트와 동일)

**Primary Dependencies**: 신규 npm 의존성 0 — WCAG 대비 계산은 순수 JS
(relative luminance 공식). 전제 스택: Tailwind v4 + shadcn/ui (다운스트림)

**Storage**: 파일 (git). shared는 `.harness/skills/`, project-owned는
다운스트림의 `apps/front/src/styles/tokens.css` + `docs/design-system.md`

**Testing**: 대비 계산 스크립트는 `tests/`의 node:test 단위 테스트(기존
`npm test` 스위트에 추가). 스킬 e2e는 임시 프로젝트에서 생성 모드 수동
검증(quickstart.md의 시나리오)

**Target Platform**: 하네스 레포(macOS/Linux dev) + 모든 다운스트림 프로젝트

**Project Type**: 에이전트 하네스 인프라 (스킬 + 템플릿 + 계약 문서)

**Performance Goals**: N/A (대화형 스킬 — 병목은 사용자 응답)

**Constraints**:
- 이 레포 pre-commit이 `.harness/skills/` staged 시 `skills-link.sh`를
  실행하는데, 현 브랜치의 skills-link.sh는 외부 소유 디렉터리
  (`speckit-*`)에서 fail하는 구버전 — **구현 커밋 전 PR #69 머지 후 v2
  merge(또는 fix 커밋 반영) 필수**
- 디자인 시스템 내용의 상시 컨텍스트 사전 로드 금지 (FR-011)
- `.specify/feature.json`은 병렬 세션이 사용 중 — 이 기능의 speckit 도구
  실행 시 `SPECIFY_FEATURE_DIRECTORY` 명시 + persist 회피

**Scale/Scope**: 신규 파일 4개(SKILL.md, 템플릿 2, 스크립트 1) + 테스트
1개 + 기존 파일 5개 수정

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md`는 미작성 템플릿이므로 constitution
게이트는 없음. 대신 repo 상주 규칙을 게이트로 적용:

- [x] skill-ownership: 하네스 레포이므로 신규 스킬은 `.harness/skills/`
  (shared)가 올바른 위치. skills-local 아님
- [x] work-safety: 작업 브랜치 사용, 파괴적 명령 없음
- [x] tool-call payload safety: 긴 한국어 파일은 스켈레톤 + 소규모 Edit
- [x] 커밋 전 `npm test` + `./harness doctor` 회귀 0건 (SC-005)

## Project Structure

### Documentation (this feature)

```text
specs/001-design-system-support/
├── plan.md              # 이 파일
├── research.md          # Phase 0 — 리서치 결정 통합
├── data-model.md        # Phase 1 — 토큰/문서/템플릿 구조
├── quickstart.md        # Phase 1 — 검증 시나리오
├── contracts/
│   └── design-system-contract.md   # 표준 위치/형식/우선순위 계약
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks 출력)
```

### Source Code (repository root)

```text
.harness/skills/codi-design-system/          # 신규 shared 스킬
├── SKILL.md                                 # 프로세스 + 계약 정본
└── resources/
    ├── tokens-template.css                  # 중립 OKLCH 기본값 (베이스 v0)
    ├── design-system-template.md            # 원칙 문서 골격
    └── contrast-check.mjs                   # WCAG AA 대비 계산 (순수 JS)

tests/
└── design-system-contrast.test.mjs          # 대비 스크립트 단위 테스트 (TDD)

# 기존 파일 수정
.harness/skills/codi-frontend/SKILL.md               # 계약 경로 교체
.harness/skills/codi-frontend/resources/tailwind-rules.md
.harness/imported-rules/design.md                    # 우선순위 규칙 추가
.harness/config/skill-triggers.json                  # 키워드 등록
.harness/skills/init-project/references/flow.md      # 생성 안내 1줄
```

**Structure Decision**: 하네스 인프라 단일 트리. 스킬은 shared 소스
(`.harness/skills/`)에 두고 `./harness skills-link`로 `.claude/skills/`,
`.agents/skills/` 머지 트리에 반영. 다운스트림 산출물 경로는 계약 문서
(contracts/design-system-contract.md)가 규정하며 이 레포에는 생성하지
않는다.

## Complexity Tracking

> Constitution Check 위반 없음 — 해당 없음.
